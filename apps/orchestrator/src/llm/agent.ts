import OpenAI from 'openai';
import { classifyRequest, getModel, estimateCost } from './router';
import { TOOL_DEFINITIONS, executeTool } from './tools';
import { commitChanges } from '../git/service';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'placeholder',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

export interface AgentOptions {
  projectPath: string;
  projectId: string;
  messages: Array<{ role: string; content: string }>;
  sendEvent: (event: string, data: any) => void;
  preferredModel?: string;
}

export interface AgentResult {
  content: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  gitSha: string;
}

const SYSTEM_PROMPT = `You are an expert full-stack developer AI assistant embedded in an AI-powered IDE called "Love".
You help users build web applications by reading and modifying their code.

Guidelines:
- Always use the available tools to read existing files before modifying them
- Make precise, minimal changes unless a complete rewrite is requested
- Write clean, modern TypeScript/React code following best practices
- Use Tailwind CSS for styling
- Explain what you're doing briefly before taking actions
- After making changes, summarize what was modified
- Prefer small, focused commits
- If you encounter errors, diagnose and fix them systematically

Available file operations: read_file, write_file, create_file, delete_file, list_files
Available actions: run_command, fetch_url`;

export async function runAgent(options: AgentOptions): Promise<AgentResult> {
  const { projectPath, messages, sendEvent, preferredModel } = options;

  const lastMessage = messages[messages.length - 1]?.content || '';
  
  // Count changed files for model selection
  let fileCount = 0;
  try {
    const files = fs.readdirSync(projectPath, { recursive: true }) as string[];
    fileCount = files.filter(f => !f.includes('.git') && !f.includes('node_modules')).length;
  } catch {}

  const tier = classifyRequest(lastMessage, fileCount);
  const model = preferredModel || getModel(tier);

  sendEvent('model', { model, tier });

  // Build messages
  const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  let totalTokensIn = 0;
  let totalTokensOut = 0;
  let finalContent = '';
  const changedFiles: string[] = [];

  // Agent loop
  const MAX_ITERATIONS = 10;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    sendEvent('thinking', { iteration: i + 1 });

    let streamContent = '';
    let toolCalls: OpenAI.Chat.ChatCompletionMessageToolCall[] = [];
    let finishReason = '';

    try {
      const stream = await openai.chat.completions.create({
        model,
        messages: openaiMessages,
        tools: TOOL_DEFINITIONS,
        tool_choice: 'auto',
        stream: true,
        temperature: 0.3,
        max_tokens: 4096,
      });

      const toolCallMap: Record<number, { id: string; name: string; args: string }> = {};

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        finishReason = chunk.choices[0]?.finish_reason || '';

        if (delta?.content) {
          streamContent += delta.content;
          sendEvent('text', { delta: delta.content });
        }

        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index;
            if (!toolCallMap[idx]) {
              toolCallMap[idx] = { id: tc.id || '', name: '', args: '' };
            }
            if (tc.id) toolCallMap[idx].id = tc.id;
            if (tc.function?.name) toolCallMap[idx].name += tc.function.name;
            if (tc.function?.arguments) toolCallMap[idx].args += tc.function.arguments;
          }
        }

        if (chunk.usage) {
          totalTokensIn += chunk.usage.prompt_tokens || 0;
          totalTokensOut += chunk.usage.completion_tokens || 0;
        }
      }

      toolCalls = Object.values(toolCallMap).map((tc) => ({
        id: tc.id,
        type: 'function' as const,
        function: { name: tc.name, arguments: tc.args },
      }));

      if (streamContent) finalContent = streamContent;

    } catch (err: any) {
      sendEvent('error', { message: err.message });
      throw err;
    }

    // If no tool calls, we're done
    if (finishReason === 'stop' || toolCalls.length === 0) {
      break;
    }

    // Add assistant message with tool calls
    openaiMessages.push({
      role: 'assistant',
      content: streamContent || null,
      tool_calls: toolCalls,
    });

    // Execute tool calls
    const toolResults: OpenAI.Chat.ChatCompletionToolMessageParam[] = [];

    for (const tc of toolCalls) {
      const toolName = tc.function.name;
      let args: Record<string, any> = {};
      try {
        args = JSON.parse(tc.function.arguments || '{}');
      } catch {}

      sendEvent('tool_call', { id: tc.id, name: toolName, args });

      const result = await executeTool(toolName, args, projectPath);

      if (result.changedFiles) changedFiles.push(...result.changedFiles);

      sendEvent('tool_result', {
        id: tc.id,
        name: toolName,
        success: result.success,
        output: result.output.slice(0, 500),
      });

      toolResults.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: result.output,
      });
    }

    openaiMessages.push(...toolResults);
  }

  // Auto-commit if files were changed
  let gitSha = '';
  if (changedFiles.length > 0) {
    try {
      gitSha = await commitChanges(projectPath, `AI: ${lastMessage.slice(0, 72)}`);
      sendEvent('commit', { sha: gitSha, files: changedFiles });

      // Auto-QA: run tsc if TypeScript files changed
      const hasTsChanges = changedFiles.some((f) => f.endsWith('.ts') || f.endsWith('.tsx'));
      if (hasTsChanges) {
        try {
          const tsconfigPath = path.join(projectPath, 'tsconfig.json');
          if (fs.existsSync(tsconfigPath)) {
            const { stdout, stderr } = await execAsync('bun run tsc --noEmit 2>&1 || true', {
              cwd: projectPath,
              timeout: 15000,
            });
            const output = stdout + stderr;
            const hasErrors = /error TS\d+/.test(output);
            sendEvent('qa', { passed: !hasErrors, output: output.slice(0, 2000) });
          }
        } catch {}
      }
    } catch (e: any) {
      console.error('Git commit failed:', e.message);
    }
  }

  const costUsd = estimateCost(model, totalTokensIn, totalTokensOut);

  return {
    content: finalContent,
    model,
    tokensIn: totalTokensIn,
    tokensOut: totalTokensOut,
    costUsd,
    gitSha,
  };
}
