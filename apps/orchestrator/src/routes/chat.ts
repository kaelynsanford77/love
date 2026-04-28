import { Hono } from "hono";
import { stream } from "hono/streaming";
import { getOpenAIClient, pickModel, escalateTier, type ModelTier } from "../llm/router";
import { join } from "path";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";

const app = new Hono();
const DATA_DIR = process.env.DATA_DIR ?? join(process.cwd(), "data");

function getSystemPrompt(project: { name?: string; framework?: string } | null): string {
  return `You are an expert full-stack developer helping build the project "${project?.name ?? "the app"}".
Framework: ${project?.framework ?? "React"}
You write clean, production-ready code. When making file changes, use this format:
<file path="src/App.tsx">
// full file content here
</file>
Always explain what you're doing briefly before making changes.`;
}

function parseFileChanges(content: string): Array<{ path: string; content: string }> {
  const changes: Array<{ path: string; content: string }> = [];
  const regex = /<file path="([^"]+)">([\s\S]*?)<\/file>/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    changes.push({ path: match[1], content: match[2].trim() });
  }
  return changes;
}

// POST /chat/:projectId - streaming chat
app.post("/:projectId", async (c) => {
  const { messages, context } = await c.req.json<{
    messages: Array<{ role: string; content: string }>;
    context?: { fileCount?: number; turns?: number };
  }>();

  const lastMessage = messages.filter((m) => m.role === "user").pop()?.content ?? "";
  let { model, tier, emoji } = pickModel(lastMessage, context);

  const projectDir = join(DATA_DIR, "projects", c.req.param("projectId"));
  let project = null;
  const projectFile = join(DATA_DIR, "projects.json");
  if (existsSync(projectFile)) {
    const projects = JSON.parse(await readFile(projectFile, "utf-8"));
    project = projects.find((p: { id: string }) => p.id === c.req.param("projectId"));
  }

  const systemPrompt = getSystemPrompt(project);
  const openai = getOpenAIClient();

  return stream(
    c,
    async (s) => {
      await s.write(`data: ${JSON.stringify({ type: "model", model, tier, emoji })}\n\n`);

      let currentTier: ModelTier = tier;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          const response = await openai.chat.completions.create({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              ...(messages as Array<{ role: "user" | "assistant" | "system"; content: string }>),
            ],
            stream: true,
            max_tokens: 4096,
          });

          let fullContent = "";
          for await (const chunk of response) {
            const delta = chunk.choices[0]?.delta?.content ?? "";
            if (delta) {
              fullContent += delta;
              await s.write(`data: ${JSON.stringify({ type: "text", content: delta })}\n\n`);
            }
          }

          const fileChanges = parseFileChanges(fullContent);
          if (fileChanges.length > 0) {
            for (const fc of fileChanges) {
              const filePath = join(projectDir, fc.path);
              await mkdir(join(filePath, ".."), { recursive: true });
              await writeFile(filePath, fc.content, "utf-8");
            }
            await s.write(
              `data: ${JSON.stringify({
                type: "files_changed",
                files: fileChanges.map((f) => f.path),
              })}\n\n`
            );
          }

          await s.write(
            `data: ${JSON.stringify({ type: "done", tier: currentTier, model })}\n\n`
          );
          break;
        } catch (err: unknown) {
          attempts++;
          const next = escalateTier(currentTier);
          if (next && attempts < maxAttempts) {
            currentTier = next;
            model = process.env[`LLM_MODEL_${next.toUpperCase()}`] ?? model;
            await s.write(
              `data: ${JSON.stringify({
                type: "escalate",
                from: currentTier,
                to: next,
                model,
              })}\n\n`
            );
          } else {
            const message = err instanceof Error ? err.message : "LLM error";
            await s.write(`data: ${JSON.stringify({ type: "error", message })}\n\n`);
            break;
          }
        }
      }
    },
    { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } }
  );
});

export const chatRouter = app;
