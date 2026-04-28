import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import { projectsRouter } from "./routes/projects";
import { chatRouter } from "./routes/chat";
import { filesRouter } from "./routes/files";
import { gitRouter } from "./routes/git";
import { supabaseRouter } from "./routes/supabase";
import { settingsRouter } from "./routes/settings";
import { initDb } from "./db";
import "dotenv/config";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["X-Project-Id"],
  })
);

// Health check
app.get("/health", (c) => c.json({ status: "ok", version: "1.0.0" }));

// Mount routers
app.route("/projects", projectsRouter);
app.route("/chat", chatRouter);
app.route("/files", filesRouter);
app.route("/git", gitRouter);
app.route("/supabase", supabaseRouter);
app.route("/settings", settingsRouter);

// Initialize DB
initDb();

const port = parseInt(process.env.PORT || "4000");
const host = process.env.HOST || "0.0.0.0";

console.log(`🚀 Orchestrator running at http://${host}:${port}`);

serve({ fetch: app.fetch, port, hostname: host });

export default app;
