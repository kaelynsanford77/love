import { spawn } from 'child_process';
import { getProjectRoot, ensureProjectExists } from './view';
import path from 'path';

const SANDBOX_MODE = process.env.SANDBOX_MODE ?? 'local';

// Commands allowed in local mode (safeguard)
const ALLOWED_PREFIXES = [
  'npm', 'npx', 'bun', 'node', 'tsc', 'vite',
  'ls', 'cat', 'find', 'grep', 'echo', 'pwd',
  'git', 'mkdir', 'rm', 'cp', 'mv', 'touch',
  'curl', 'wget', 'python', 'python3', 'pip',
];

function isCommandAllowed(command: string): boolean {
  if (SANDBOX_MODE === 'docker') return true;
  const cmd = command.trim().split(/\s+/)[0];
  return ALLOWED_PREFIXES.some((p) => cmd === p || cmd.endsWith(`/${p}`));
}

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function execInProject(
  projectId: string,
  command: string,
  cwd?: string
): Promise<ExecResult> {
  if (!isCommandAllowed(command)) {
    return { stdout: '', stderr: `Command not allowed: ${command}`, exitCode: 1 };
  }

  const root = await ensureProjectExists(projectId);
  const workDir = cwd ? path.resolve(root, cwd.replace(/^\//, '')) : root;

  return new Promise((resolve) => {
    const proc = spawn('bash', ['-c', command], {
      cwd: workDir,
      env: { ...process.env, PATH: process.env.PATH },
      timeout: 60_000,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => (stdout += d.toString()));
    proc.stderr.on('data', (d) => (stderr += d.toString()));

    proc.on('close', (code) => {
      resolve({ stdout: stdout.slice(0, 10_000), stderr: stderr.slice(0, 5_000), exitCode: code ?? 0 });
    });

    proc.on('error', (err) => {
      resolve({ stdout: '', stderr: err.message, exitCode: 1 });
    });
  });
}
