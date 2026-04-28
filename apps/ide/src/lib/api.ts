const BASE = (import.meta.env.VITE_ORCHESTRATOR_URL as string | undefined) ?? 'http://localhost:4000';
const TOKEN = (import.meta.env.VITE_BEARER_TOKEN as string | undefined) ?? '';

function headers(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
  };
}

export const api = {
  get: <T = unknown>(path: string): Promise<T> =>
    fetch(`${BASE}${path}`, { headers: headers() }).then((r) => r.json()),

  post: <T = unknown>(path: string, body?: unknown): Promise<T> =>
    fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    }).then((r) => r.json()),

  put: <T = unknown>(path: string, body?: unknown): Promise<T> =>
    fetch(`${BASE}${path}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(body),
    }).then((r) => r.json()),

  patch: <T = unknown>(path: string, body?: unknown): Promise<T> =>
    fetch(`${BASE}${path}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify(body),
    }).then((r) => r.json()),

  delete: <T = unknown>(path: string): Promise<T> =>
    fetch(`${BASE}${path}`, { method: 'DELETE', headers: headers() }).then((r) => r.json()),

  stream: (
    path: string,
    body: unknown,
    onChunk: (data: string) => void,
    onDone: () => void,
    onError?: (err: Error) => void
  ): (() => void) => {
    const ctrl = new AbortController();

    (async () => {
      try {
        const r = await fetch(`${BASE}${path}`, {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify(body),
          signal: ctrl.signal,
        });

        if (!r.ok) {
          const text = await r.text();
          throw new Error(`HTTP ${r.status}: ${text}`);
        }

        const reader = r.body!.getReader();
        const dec = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            onDone();
            break;
          }
          buffer += dec.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const d = trimmed.slice(6);
              if (d === '[DONE]') {
                onDone();
                return;
              }
              if (d) onChunk(d);
            }
          }
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.name !== 'AbortError') {
          onError?.(e);
          onDone();
        }
      }
    })();

    return () => ctrl.abort();
  },
};
