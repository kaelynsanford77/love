import { Hono } from 'hono';
import { streamText } from 'hono/streaming';
import { z } from 'zod';
import { streamWithTools } from '../llm/anthropic';
import { openaiStreamWithTools } from '../llm/openai';
import { viewFile, writeFile, replaceLines, listFiles, buildTree } from '../tools/view';
import { execInProject } from '../tools/exec';

const SYSTEM_PROMPT = `You are Lovable Solo, an expert AI coding assistant and software engineer.
You help users build, modify, and debug web applications. You have access to tools to read and write files,
execute commands, and inspect the project structure.

Guidelines:
- Always explain what you're doing before making changes
- Write clean, modern TypeScript/React code following best practices
- Use Tailwind CSS for styling
- Break large changes into small focused edits
- After making changes, explain what was done
- When creating new features, consider UX and accessibility
- Prefer shadcn/ui components when available
- Use async/await over callbacks
- Always handle error states in UI components`;

const chatSchema = z.object({
  projectId: z.string().default('default'),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'tool']),
      content: z.string(),
    })
  ),
});

export const chatRoutes = new Hono();

chatRoutes.post('/stream', async (c) => {
  let body: z.infer<typeof chatSchema>;
  try {
    body = chatSchema.parse(await c.req.json());
  } catch (e: unknown) {
    return c.json({ error: 'Invalid request' }, 400);
  }
  const { projectId, messages } = body;
  const provider = process.env.LLM_PROVIDER ?? 'anthropic';

  const toolExecutor = async (name: string, input: Record<string, unknown>): Promise<string> => {
    switch (name) {
      case 'view_file':
        return viewFile(projectId, input.path as string);

      case 'write_file':
        await writeFile(projectId, input.path as string, input.content as string);
        return `Written: ${input.path}`;

      case 'replace_lines':
        await replaceLines(
          projectId,
          input.path as string,
          input.start_line as number,
          input.end_line as number,
          input.new_content as string
        );
        return `Replaced lines ${input.start_line}-${input.end_line} in ${input.path}`;

      case 'exec_command': {
        const result = await execInProject(
          projectId,
          input.command as string,
          input.cwd as string | undefined
        );
        return `Exit: ${result.exitCode}\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`;
      }

      case 'list_files':
        return (await listFiles(projectId, (input.path as string) ?? '.')).join('\n');

      default:
        return `Unknown tool: ${name}`;
    }
  };

  const anthropicMessages = messages
    .filter((m) => m.role !== 'tool')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  return streamText(c, async (stream) => {
    try {
      if (provider === 'openai' || provider === 'ollama') {
        const openaiMessages = messages
          .filter((m) => m.role !== 'tool')
          .map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }));
        for await (const chunk of openaiStreamWithTools(
          openaiMessages,
          SYSTEM_PROMPT,
          toolExecutor
        )) {
          await stream.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
      } else {
        for await (const chunk of streamWithTools(
          anthropicMessages,
          SYSTEM_PROMPT,
          toolExecutor
        )) {
          await stream.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
      }
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'Unknown error';
      await stream.write(
        `data: ${JSON.stringify({ type: 'error', error: errMsg })}\n\n`
      );
    }
    await stream.write('data: [DONE]\n\n');
  });
});

chatRoutes.get('/health', (c) => c.json({ ok: true }));
