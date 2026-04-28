const BASE = "/api";

export async function getProjects() {
  const r = await fetch(`${BASE}/projects`);
  return r.json();
}

export async function createProject(data: {
  name: string;
  template?: string;
  description?: string;
}) {
  const r = await fetch(`${BASE}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function updateProject(id: string, data: Record<string, unknown>) {
  const r = await fetch(`${BASE}/projects/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function deleteProject(id: string) {
  const r = await fetch(`${BASE}/projects/${id}`, { method: "DELETE" });
  return r.json();
}

export async function importProject(data: {
  repoUrl: string;
  branch: string;
  name?: string;
}) {
  const r = await fetch(`${BASE}/projects/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function getProjectFiles(projectId: string) {
  const r = await fetch(`${BASE}/projects/${projectId}/files`);
  return r.json();
}

export async function readFile(projectId: string, path: string) {
  const r = await fetch(`${BASE}/projects/${projectId}/files/${path}`);
  return r.json();
}

export async function writeFile(projectId: string, path: string, content: string) {
  const r = await fetch(`${BASE}/projects/${projectId}/files/${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  return r.json();
}

export async function startDevServer(projectId: string) {
  const r = await fetch(`${BASE}/projects/${projectId}/start`, { method: "POST" });
  return r.json();
}

export async function stopDevServer(projectId: string) {
  const r = await fetch(`${BASE}/projects/${projectId}/stop`, { method: "POST" });
  return r.json();
}

export async function connectSupabase(data: {
  projectId: string;
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}) {
  const r = await fetch(`${BASE}/supabase/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function getSupabaseStatus(projectId: string) {
  const r = await fetch(`${BASE}/supabase/${projectId}/status`);
  return r.json();
}

export async function runSupabaseQuery(projectId: string, sql: string) {
  const r = await fetch(`${BASE}/supabase/${projectId}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sql }),
  });
  return r.json();
}

export async function getSettings() {
  const r = await fetch(`${BASE}/settings`);
  return r.json();
}

export async function updateSettings(settings: unknown) {
  const r = await fetch(`${BASE}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  return r.json();
}

export async function* streamChat(
  projectId: string,
  messages: Array<{ role: string; content: string }>,
  context?: { fileCount?: number; turns?: number }
) {
  const r = await fetch(`${BASE}/chat/${projectId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, context }),
  });

  if (!r.body) return;

  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          yield JSON.parse(line.slice(6));
        } catch {}
      }
    }
  }
}
