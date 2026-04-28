import type { ChatCompletionTool } from 'openai/resources';
import fs from 'fs';
import path from 'path';

export const TOOL_DEFINITIONS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'read_file',
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
      description: 'Write or update a file in the project with new content',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to project root' },
          content: { type: 'string', description: 'Full file content to write' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_file',
      description: 'Create a new file in the project',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to project root' },
          content: { type: 'string', description: 'Initial file content' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_file',
      description: 'Delete a file or directory from the project',
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
      name: 'run_command',
      description: 'Run a shell command in the project directory (e.g., npm install, bun add, etc.)',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Shell command to run' },
          timeout: { type: 'number', description: 'Timeout in milliseconds (default: 30000)' },
        },
        required: ['command'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'List files in a directory of the project',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path relative to project root (default: ".")' },
          recursive: { type: 'boolean', description: 'Whether to list recursively (default: false)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'fetch_url',
      description: 'Fetch content from a URL (for reading documentation or APIs)',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to fetch' },
        },
        required: ['url'],
      },
    },
  },
];

export interface ToolExecutionResult {
  success: boolean;
  output: string;
  changedFiles?: string[];
}

export async function executeTool(
  toolName: string,
  args: Record<string, any>,
  projectPath: string
): Promise<ToolExecutionResult> {
  function safePath(p: string): string {
    const resolved = path.resolve(projectPath, p.replace(/^\//, ''));
    if (!resolved.startsWith(path.resolve(projectPath))) {
      throw new Error('Path traversal detected');
    }
    return resolved;
  }

  try {
    switch (toolName) {
      case 'read_file': {
        const fullPath = safePath(args.path);
        if (!fs.existsSync(fullPath)) return { success: false, output: `File not found: ${args.path}` };
        const content = fs.readFileSync(fullPath, 'utf-8');
        return { success: true, output: content };
      }

      case 'write_file':
      case 'create_file': {
        const fullPath = safePath(args.path);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, args.content, 'utf-8');
        return { success: true, output: `File written: ${args.path}`, changedFiles: [args.path] };
      }

      case 'delete_file': {
        const fullPath = safePath(args.path);
        if (!fs.existsSync(fullPath)) return { success: false, output: `Not found: ${args.path}` };
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(fullPath);
        }
        return { success: true, output: `Deleted: ${args.path}` };
      }

      case 'run_command': {
        const timeout = args.timeout || 30000;

        // Validate command against allowlist
        const ALLOWED_PREFIXES = ['bun ', 'npm ', 'npx ', 'node ', 'tsc', 'vite', 'git ', 'ls', 'cat ', 'echo ', 'pwd', 'find '];
        const trimmedCmd = (args.command || '').trim();
        if (!ALLOWED_PREFIXES.some(p => trimmedCmd.startsWith(p))) {
          return { success: false, output: `Command not allowed: ${trimmedCmd}. Use bun/npm/npx/node/git/tsc/vite commands.` };
        }

        // Use spawn with shell:false for safety
        const parts = trimmedCmd.split(/\s+/);
        const execResult = await new Promise<ToolExecutionResult>((resolve) => {
          const { spawn } = require('child_process');
          const proc = spawn(parts[0], parts.slice(1), {
            cwd: projectPath,
            timeout,
            shell: false,
            env: process.env,
          });
          let stdout = '';
          let stderr = '';
          proc.stdout?.on('data', (d: Buffer) => { stdout += d.toString() });
          proc.stderr?.on('data', (d: Buffer) => { stderr += d.toString() });
          proc.on('close', (code: number) => {
            const output = [stdout, stderr].filter(Boolean).join('\n');
            resolve({ success: code === 0, output: output || '(no output)' });
          });
          proc.on('error', (err: Error) => resolve({ success: false, output: err.message }));
        });
        return execResult;
      }

      case 'list_files': {
        const dirPath = args.path ? safePath(args.path) : projectPath;
        if (!fs.existsSync(dirPath)) return { success: false, output: `Directory not found: ${args.path}` };

        if (args.recursive) {
          const files: string[] = [];
          function walk(dir: string) {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const e of entries) {
              if (e.name === '.git' || e.name === 'node_modules') continue;
              const rel = path.relative(projectPath, path.join(dir, e.name));
              files.push(e.isDirectory() ? `${rel}/` : rel);
              if (e.isDirectory()) walk(path.join(dir, e.name));
            }
          }
          walk(dirPath);
          return { success: true, output: files.join('\n') };
        } else {
          const entries = fs.readdirSync(dirPath, { withFileTypes: true });
          const list = entries
            .filter((e) => e.name !== '.git' && e.name !== 'node_modules')
            .map((e) => (e.isDirectory() ? `${e.name}/` : e.name))
            .join('\n');
          return { success: true, output: list };
        }
      }

      case 'fetch_url': {
        const response = await fetch(args.url, {
          headers: { 'User-Agent': 'Love-IDE/1.0' },
          signal: AbortSignal.timeout(10000),
        });
        const text = await response.text();
        const truncated = text.length > 10000 ? text.slice(0, 10000) + '\n...[truncated]' : text;
        return { success: true, output: truncated };
      }

      default:
        return { success: false, output: `Unknown tool: ${toolName}` };
    }
  } catch (err: any) {
    return { success: false, output: `Tool error: ${err.message}` };
  }
}
