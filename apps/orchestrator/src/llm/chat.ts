import { createLLMClient, ModelTier } from "./router";
import type OpenAI from "openai";

export interface ToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: (args: unknown) => Promise<unknown>;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  name?: string;
}

// ─── System prompt builder ────────────────────────────────────────────────────
export function buildSystemPrompt(options: {
  projectPath: string;
  supabaseUrl?: string;
  supabaseTables?: string[];
  framework?: string;
}): string {
  const { projectPath, supabaseUrl, supabaseTables, framework } = options;

  let prompt = `You are an expert AI software engineer working inside Lovable Solo IDE.
You help users build, modify, and debug web applications.
Current project is at: ${projectPath}
Framework: ${framework || "vite-react"}

Guidelines:
- Always write complete, working TypeScript/React code
- Use Tailwind CSS for styling
- Use shadcn/ui components where appropriate
- When editing files, use the write_file tool with the complete new content
- When creating new features, create all necessary files
- Run commands using the run_command tool when needed
- Always explain what you changed and why`;

  if (supabaseUrl && supabaseTables?.length) {
    prompt += `\n\nThis project is connected to Supabase at ${supabaseUrl}.
Available tables: ${supabaseTables.join(", ")}
Use the supabase client at "@/integrations/supabase/client" for database operations.
Use RLS policies for security. Never expose the service role key in client code.`;
  }

  return prompt;
}

// ─── Streaming chat runner ────────────────────────────────────────────────────
export async function* runStreamingChat(
  messages: ChatMessage[],
  model: string,
  tools: ToolDef[],
  onToolCall?: (name: string, args: unknown, result: unknown) => void
): AsyncGenerator<
  | { type: "delta"; content: string }
  | { type: "tool_call"; name: string; args: unknown; result: unknown }
  | { type: "done"; model: string; tier: ModelTier | null; usage: { prompt_tokens: number; completion_tokens: number } }
  | { type: "error"; message: string }
> {
  const client = createLLMClient();

  const openaiTools: OpenAI.Chat.Completions.ChatCompletionTool[] = tools.map(
    (t) => ({
      type: "function" as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    })
  );

  const openaiMessages = messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[];

  let usage = { prompt_tokens: 0, completion_tokens: 0 };

  try {
    // Tool loop
    const MAX_TOOL_TURNS = 10;
    let toolTurns = 0;

    while (toolTurns < MAX_TOOL_TURNS) {
      const stream = await client.chat.completions.create({
        model,
        messages: openaiMessages,
        tools: openaiTools.length > 0 ? openaiTools : undefined,
        tool_choice: openaiTools.length > 0 ? "auto" : undefined,
        stream: true,
        stream_options: { include_usage: true },
      });

      let fullContent = "";
      const toolCallsAccum: Record<
        number,
        { id: string; name: string; arguments: string }
      > = {};

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;

        if (delta?.content) {
          fullContent += delta.content;
          yield { type: "delta", content: delta.content };
        }

        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            if (!toolCallsAccum[tc.index]) {
              toolCallsAccum[tc.index] = {
                id: tc.id || "",
                name: tc.function?.name || "",
                arguments: "",
              };
            }
            if (tc.id) toolCallsAccum[tc.index].id = tc.id;
            if (tc.function?.name)
              toolCallsAccum[tc.index].name = tc.function.name;
            if (tc.function?.arguments)
              toolCallsAccum[tc.index].arguments += tc.function.arguments;
          }
        }

        if (chunk.usage) {
          usage = {
            prompt_tokens: chunk.usage.prompt_tokens,
            completion_tokens: chunk.usage.completion_tokens,
          };
        }
      }

      // If no tool calls, we're done
      const toolCallList = Object.values(toolCallsAccum);
      if (toolCallList.length === 0) {
        break;
      }

      // Execute tool calls
      openaiMessages.push({
        role: "assistant" as const,
        content: fullContent || null,
        tool_calls: toolCallList.map((tc) => ({
          id: tc.id,
          type: "function" as const,
          function: { name: tc.name, arguments: tc.arguments },
        })),
      } as OpenAI.Chat.Completions.ChatCompletionMessageParam);

      for (const tc of toolCallList) {
        const toolDef = tools.find((t) => t.name === tc.name);
        let result: unknown = { error: "Unknown tool" };

        if (toolDef) {
          try {
            const args = JSON.parse(tc.arguments || "{}");
            result = await toolDef.handler(args);
          } catch (e) {
            result = { error: String(e) };
          }
        }

        const resultStr =
          typeof result === "string" ? result : JSON.stringify(result);

        yield { type: "tool_call", name: tc.name, args: JSON.parse(tc.arguments || "{}"), result };
        if (onToolCall) onToolCall(tc.name, JSON.parse(tc.arguments || "{}"), result);

        openaiMessages.push({
          role: "tool" as const,
          content: resultStr,
          tool_call_id: tc.id,
        } as OpenAI.Chat.Completions.ChatCompletionMessageParam);
      }

      toolTurns++;
    }

    yield { type: "done", model, tier: null, usage };
  } catch (e) {
    yield { type: "error", message: String(e) };
  }
}
