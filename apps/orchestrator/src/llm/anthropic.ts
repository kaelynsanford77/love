import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const TOOLS: Anthropic.Tool[] = [
  {
    name: 'view_file',
    description: 'Read the contents of a file in the project',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'File path relative to project root' },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write or create a file in the project',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'File path relative to project root' },
        content: { type: 'string', description: 'Full file content to write' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'replace_lines',
    description: 'Replace a range of lines in a file',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string' },
        start_line: { type: 'number', description: '1-indexed start line (inclusive)' },
        end_line: { type: 'number', description: '1-indexed end line (inclusive)' },
        new_content: { type: 'string', description: 'New content for the replaced range' },
      },
      required: ['path', 'start_line', 'end_line', 'new_content'],
    },
  },
  {
    name: 'exec_command',
    description: 'Execute a shell command in the project sandbox',
    input_schema: {
      type: 'object' as const,
      properties: {
        command: { type: 'string', description: 'Shell command to run' },
        cwd: { type: 'string', description: 'Working directory (defaults to project root)' },
      },
      required: ['command'],
    },
  },
  {
    name: 'list_files',
    description: 'List files in a directory',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'Directory path (defaults to project root)' },
      },
      required: [],
    },
  },
];

export interface StreamChunk {
  type: 'text' | 'tool_call' | 'done' | 'error';
  text?: string;
  name?: string;
  input?: Record<string, unknown>;
  result?: string;
  error?: string;
}

export async function* streamWithTools(
  messages: MessageParam[],
  systemPrompt: string,
  toolExecutor: (name: string, input: Record<string, unknown>) => Promise<string>
): AsyncGenerator<StreamChunk> {
  const allMessages: MessageParam[] = [...messages];

  let iterations = 0;
  const MAX_ITERATIONS = 20;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const stream = client.messages.stream({
      model: process.env.LLM_MODEL ?? 'claude-3-5-sonnet-20241022',
      max_tokens: 8192,
      system: systemPrompt,
      tools: TOOLS,
      messages: allMessages,
    });

    let textBuffer = '';
    const toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];
    let currentToolCall: { id: string; name: string; inputJson: string } | null = null;

    for await (const event of stream) {
      if (event.type === 'content_block_start') {
        if (event.content_block.type === 'text') {
          // text block start
        } else if (event.content_block.type === 'tool_use') {
          currentToolCall = {
            id: event.content_block.id,
            name: event.content_block.name,
            inputJson: '',
          };
        }
      } else if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          textBuffer += event.delta.text;
          yield { type: 'text', text: event.delta.text };
        } else if (event.delta.type === 'input_json_delta' && currentToolCall) {
          currentToolCall.inputJson += event.delta.partial_json;
        }
      } else if (event.type === 'content_block_stop') {
        if (currentToolCall) {
          let input: Record<string, unknown> = {};
          try {
            input = JSON.parse(currentToolCall.inputJson);
          } catch {
            input = { raw: currentToolCall.inputJson };
          }
          toolCalls.push({ id: currentToolCall.id, name: currentToolCall.name, input });
          currentToolCall = null;
        }
      }
    }

    const finalMsg = await stream.finalMessage();

    // Add assistant message
    allMessages.push({
      role: 'assistant',
      content: finalMsg.content,
    });

    if (finalMsg.stop_reason === 'end_turn' || toolCalls.length === 0) {
      yield { type: 'done' };
      break;
    }

    if (finalMsg.stop_reason === 'tool_use') {
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const tool of toolCalls) {
        let result: string;
        try {
          result = await toolExecutor(tool.name, tool.input);
        } catch (e: unknown) {
          result = `Error: ${e instanceof Error ? e.message : String(e)}`;
        }

        yield {
          type: 'tool_call',
          name: tool.name,
          input: tool.input,
          result,
        };

        toolResults.push({
          type: 'tool_result',
          tool_use_id: tool.id,
          content: result,
        });
      }

      allMessages.push({ role: 'user', content: toolResults });
    }
  }

  if (iterations >= MAX_ITERATIONS) {
    yield { type: 'error', error: 'Max iterations reached' };
  }
}
