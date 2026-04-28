const BASE_URL = import.meta.env.VITE_ORCHESTRATOR_URL || "http://localhost:4000";

async function req<T = unknown>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => req<T>("GET", path),
  post: <T>(path: string, body?: unknown) => req<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => req<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => req<T>("PATCH", path, body),
  delete: <T>(path: string, body?: unknown) => req<T>("DELETE", path, body),

  // Streaming SSE helper
  stream(path: string, body: unknown, onEvent: (event: unknown) => void): () => void {
    const ctrl = new AbortController();
    const url = `${BASE_URL}${path}`;

    (async () => {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: ctrl.signal,
        });
        if (!res.body) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                onEvent(JSON.parse(line.slice(6)));
              } catch {}
            }
          }
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") console.error("Stream error:", e);
      }
    })();

    return () => ctrl.abort();
  },
};
