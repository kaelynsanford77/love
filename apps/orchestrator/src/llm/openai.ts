import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OLLAMA_BASE_URL ? `${process.env.OLLAMA_BASE_URL}/v1` : undefined,
});

export const OPENAI_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'view_file',
      description: 'Read the contents of a file in the project',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to project root' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Write or create a file in the project',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          content: { type: 'string' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'exec_command',
      description: 'Execute a shell command in the project sandbox',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string' },
          cwd: { type: 'string' },
        },
        required: ['command'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'List files in a directory',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string' },
        },
        required: [],
      },
    },
  },
];

export interface OpenAIStreamChunk {
  type: 'text' | 'tool_call' | 'done' | 'error';
  text?: string;
  name?: string;
  input?: Record<string, unknown>;
  result?: string;
  error?: string;
}

export async function* openaiStreamWithTools(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  systemPrompt: string,
  toolExecutor: (name: string, input: Record<string, unknown>) => Promise<string>
): AsyncGenerator<OpenAIStreamChunk> {
  const allMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  const model = process.env.LLM_MODEL ?? (process.env.OLLAMA_BASE_URL ? 'llama3.1' : 'gpt-4o');

  let iterations = 0;
  const MAX_ITERATIONS = 20;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const stream = await client.chat.completions.create({
      model,
      messages: allMessages,
      tools: OPENAI_TOOLS,
      stream: true,
    });

    let textBuffer = '';
    const toolCallMap: Map<number, { id: string; name: string; args: string }> = new Map();
    let finishReason: string | null = null;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      if (delta.content) {
        textBuffer += delta.content;
        yield { type: 'text', text: delta.content };
      }

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0;
          if (!toolCallMap.has(idx)) {
            toolCallMap.set(idx, { id: tc.id ?? '', name: tc.function?.name ?? '', args: '' });
          }
          const existing = toolCallMap.get(idx)!;
          if (tc.function?.arguments) existing.args += tc.function.arguments;
          if (tc.id) existing.id = tc.id;
          if (tc.function?.name) existing.name = tc.function.name;
        }
      }

      finishReason = chunk.choices[0]?.finish_reason ?? finishReason;
    }

    // Add assistant turn
    const assistantContent: OpenAI.Chat.Completions.ChatCompletionMessageParam = {
      role: 'assistant',
      content: textBuffer || null,
    };

    const toolCallsArr = Array.from(toolCallMap.values());
    if (toolCallsArr.length > 0) {
      (assistantContent as OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam).tool_calls =
        toolCallsArr.map((tc) => ({
          id: tc.id,
          type: 'function' as const,
          function: { name: tc.name, arguments: tc.args },
        }));
    }

    allMessages.push(assistantContent);

    if (finishReason === 'stop' || toolCallsArr.length === 0) {
      yield { type: 'done' };
      break;
    }

    if (finishReason === 'tool_calls') {
      for (const tc of toolCallsArr) {
        let input: Record<string, unknown> = {};
        try {
          input = JSON.parse(tc.args);
        } catch {
          input = {};
        }

        let result: string;
        try {
          result = await toolExecutor(tc.name, input);
        } catch (e: unknown) {
          result = `Error: ${e instanceof Error ? e.message : String(e)}`;
        }

        yield { type: 'tool_call', name: tc.name, input, result };

        allMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: result,
        });
      }
    }
  }
}
