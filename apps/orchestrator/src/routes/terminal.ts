import { WebSocketServer, WebSocket } from 'ws';
import * as pty from 'node-pty';
import db from '../db';
import os from 'os';

interface TerminalSession {
  ptyProcess: pty.IPty;
  projectId: string;
}

const sessions = new Map<string, TerminalSession>();

export function setupTerminalWs(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket, req) => {
    const url = new URL(req.url || '', `http://localhost`);
    const projectId = url.searchParams.get('projectId') || '';
    const sessionId = url.searchParams.get('sessionId') || `session-${Date.now()}`;

    let cwd = os.homedir();
    if (projectId) {
      const project = db.prepare('SELECT path FROM projects WHERE id=?').get(projectId) as any;
      if (project?.path) cwd = project.path;
    }

    const shell = os.platform() === 'win32' ? 'powershell.exe' : (process.env.SHELL || '/bin/bash');

    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: 120,
      rows: 30,
      cwd,
      env: process.env as Record<string, string>,
    });

    sessions.set(sessionId, { ptyProcess, projectId });

    ptyProcess.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'output', data }));
      }
    });

    ptyProcess.onExit(({ exitCode }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'exit', exitCode }));
        ws.close();
      }
      sessions.delete(sessionId);
    });

    ws.on('message', (message) => {
      try {
        const msg = JSON.parse(message.toString());
        switch (msg.type) {
          case 'input':
            ptyProcess.write(msg.data);
            break;
          case 'resize':
            ptyProcess.resize(msg.cols, msg.rows);
            break;
          case 'kill':
            ptyProcess.kill();
            break;
        }
      } catch (e) {
        // Treat raw message as input
        ptyProcess.write(message.toString());
      }
    });

    ws.on('close', () => {
      ptyProcess.kill();
      sessions.delete(sessionId);
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
      ptyProcess.kill();
      sessions.delete(sessionId);
    });

    // Send ready
    ws.send(JSON.stringify({ type: 'ready', sessionId, cwd }));
  });
}
