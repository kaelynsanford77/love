const BASE = (
  (import.meta.env.VITE_ORCHESTRATOR_URL as string | undefined) ?? 'http://localhost:4000'
).replace(/^http/, 'ws');

const TOKEN = (import.meta.env.VITE_BEARER_TOKEN as string | undefined) ?? '';

export interface FSEvent {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  path: string;
}

export function watchFiles(projectId: string, onEvent: (e: FSEvent) => void): () => void {
  const url = `${BASE}/fs/watch?projectId=${encodeURIComponent(projectId)}${TOKEN ? `&token=${TOKEN}` : ''}`;
  let ws: WebSocket;
  let closed = false;

  function connect() {
    ws = new WebSocket(url);
    ws.onmessage = (e) => {
      try {
        onEvent(JSON.parse(e.data) as FSEvent);
      } catch {
        // ignore malformed messages
      }
    };
    ws.onerror = () => ws.close();
    ws.onclose = () => {
      if (!closed) setTimeout(connect, 2000);
    };
  }

  connect();
  return () => {
    closed = true;
    ws?.close();
  };
}
