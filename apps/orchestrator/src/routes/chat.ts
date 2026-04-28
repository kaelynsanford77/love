import { Hono } from "hono";
import { getDb } from "../db";
import { pickModel, escalateTier, getTierModel } from "../llm/router";
import { buildSystemPrompt, runStreamingChat } from "../llm/chat";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const router = new Hono();

const WORKSPACES_DIR = () =>
  path.resolve(process.env.WORKSPACES_DIR || path.join(process.cwd(), "workspaces"));

// ─── Build file tools for the current project ─────────────────────────────────
function buildTools(projectPath: string) {
  return [
    {
      name: "read_file",
      description: "Read the contents of a file in the project",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Relative file path from project root" },
        },
        required: ["path"],
      },
      handler: async ({ path: filePath }: { path: string }) => {
        const fullPath = path.join(projectPath, filePath);
        if (!fullPath.startsWith(projectPath)) return { error: "Path traversal denied" };
        try {
          return { content: fs.readFileSync(fullPath, "utf-8") };
        } catch (e) {
          return { error: String(e) };
        }
      },
    },
    {
      name: "write_file",
      description: "Write or create a file in the project with the given content",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Relative file path from project root" },
          content: { type: "string", description: "Full file content to write" },
        },
        required: ["path", "content"],
      },
      handler: async ({ path: filePath, content }: { path: string; content: string }) => {
        const fullPath = path.join(projectPath, filePath);
        if (!fullPath.startsWith(projectPath)) return { error: "Path traversal denied" };
        try {
          fs.mkdirSync(path.dirname(fullPath), { recursive: true });
          fs.writeFileSync(fullPath, content, "utf-8");
          return { ok: true, path: filePath };
        } catch (e) {
          return { error: String(e) };
        }
      },
    },
    {
      name: "list_files",
      description: "List files in a directory",
      parameters: {
        type: "object",
        properties: {
          dir: { type: "string", description: "Directory path relative to project root" },
        },
        required: [],
      },
      handler: async ({ dir = "" }: { dir?: string }) => {
        const fullDir = path.join(projectPath, dir);
        if (!fullDir.startsWith(projectPath)) return { error: "Path traversal denied" };
        try {
          const entries = fs.readdirSync(fullDir, { withFileTypes: true });
          return {
            files: entries.map((e) => ({
              name: e.name,
              type: e.isDirectory() ? "dir" : "file",
            })),
          };
        } catch (e) {
          return { error: String(e) };
        }
      },
    },
    {
      name: "run_command",
      description: "Run a shell command in the project directory",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "Shell command to run" },
        },
        required: ["command"],
      },
      handler: async ({ command }: { command: string }) => {
        const { exec } = await import("child_process");
        const { promisify } = await import("util");
        const execAsync = promisify(exec);
        try {
          const { stdout, stderr } = await execAsync(command, {
            cwd: projectPath,
            timeout: 30000,
          });
          return { stdout: stdout.slice(0, 4000), stderr: stderr.slice(0, 1000) };
        } catch (e: any) {
          return { error: String(e), stdout: e.stdout?.slice(0, 2000), stderr: e.stderr?.slice(0, 1000) };
        }
      },
    },
    {
      name: "delete_file",
      description: "Delete a file from the project",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Relative file path from project root" },
        },
        required: ["path"],
      },
      handler: async ({ path: filePath }: { path: string }) => {
        const fullPath = path.join(projectPath, filePath);
        if (!fullPath.startsWith(projectPath)) return { error: "Path traversal denied" };
        try {
          fs.unlinkSync(fullPath);
          return { ok: true };
        } catch (e) {
          return { error: String(e) };
        }
      },
    },
  ];
}

// ─── POST /chat/:projectId ────────────────────────────────────────────────────
router.post("/:projectId", async (c) => {
  const projectId = c.req.param("projectId");
  const db = getDb();
  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId) as any;
  if (!project) return c.json({ error: "Project not found" }, 404);

  const { message, history = [] } = await c.req.json();
  if (!message) return c.json({ error: "message required" }, 400);

  const projectPath = path.join(WORKSPACES_DIR(), projectId);

  // Count files for routing
  let fileCount = 0;
  try {
    const count = (cmd: string) => parseInt(
      require("child_process").execSync(cmd, { cwd: projectPath }).toString().trim()
    );
    fileCount = count("find src -type f 2>/dev/null | wc -l");
  } catch {}

  // Pick model
  const { model, tier } = pickModel(message, { fileCount, turns: history.length });

  // Get Supabase info for system prompt
  const supabaseLink = db
    .prepare("SELECT project_url FROM supabase_links WHERE project_id = ?")
    .get(projectId) as any;

  const systemPrompt = buildSystemPrompt({
    projectPath,
    supabaseUrl: supabaseLink?.project_url,
    framework: project.framework,
  });

  // Build message history
  const messages: any[] = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: message },
  ];

  const tools = buildTools(projectPath);

  // Streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      send({ type: "model", model, tier });

      let attempts = 0;
      let currentTier = tier;
      let currentModel = model;
      let lastError: string | null = null;

      while (attempts < 3) {
        let success = false;
        let fullResponse = "";

        for await (const event of runStreamingChat(messages, currentModel, tools)) {
          if (event.type === "delta") {
            fullResponse += event.content;
            send(event);
          } else if (event.type === "tool_call") {
            send(event);
          } else if (event.type === "done") {
            success = true;
            send(event);

            // Save to history
            const now = Date.now();
            const msgId = crypto.randomUUID();
            db.prepare(
              `INSERT INTO chat_history (id, project_id, role, content, model, tier, tokens_in, tokens_out, created_at)
               VALUES (?, ?, 'user', ?, ?, ?, 0, 0, ?)`
            ).run(msgId, projectId, message, currentModel, currentTier, now);
            db.prepare(
              `INSERT INTO chat_history (id, project_id, role, content, model, tier, tokens_in, tokens_out, created_at)
               VALUES (?, ?, 'assistant', ?, ?, ?, ?, ?, ?)`
            ).run(
              crypto.randomUUID(), projectId, fullResponse, currentModel, currentTier,
              event.usage.prompt_tokens, event.usage.completion_tokens, now
            );
            db.prepare("UPDATE projects SET updated_at = ?, last_activity = ? WHERE id = ?").run(now, now, projectId);
          } else if (event.type === "error") {
            lastError = event.message;
            send(event);
          }
        }

        if (success) break;

        // Escalate
        const nextTier = escalateTier(currentTier);
        if (!nextTier) break;
        currentTier = nextTier;
        currentModel = getTierModel(nextTier);
        send({ type: "escalate", from: tier, to: nextTier, model: currentModel });
        attempts++;
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});

// ─── GET /chat/:projectId/history ─────────────────────────────────────────────
router.get("/:projectId/history", (c) => {
  const db = getDb();
  const history = db
    .prepare("SELECT * FROM chat_history WHERE project_id = ? ORDER BY created_at ASC")
    .all(c.req.param("projectId"));
  return c.json({ history });
});

// ─── DELETE /chat/:projectId/history ─────────────────────────────────────────
router.delete("/:projectId/history", (c) => {
  const db = getDb();
  db.prepare("DELETE FROM chat_history WHERE project_id = ?").run(c.req.param("projectId"));
  return c.json({ ok: true });
});

export const chatRouter = router;
