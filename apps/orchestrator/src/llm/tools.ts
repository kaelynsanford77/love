import type { ChatCompletionTool } from 'openai/resources';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
        try {
          const { stdout, stderr } = await execAsync(args.command, {
            cwd: projectPath,
            timeout,
            maxBuffer: 2 * 1024 * 1024,
          });
          return { success: true, output: [stdout, stderr].filter(Boolean).join('\n') };
        } catch (e: any) {
          return {
            success: false,
            output: `Command failed with exit code ${e.code}:\n${e.stdout || ''}\n${e.stderr || e.message}`,
          };
        }
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
