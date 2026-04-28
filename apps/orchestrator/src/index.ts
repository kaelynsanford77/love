import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import { projectsRouter } from "./routes/projects";
import { chatRouter } from "./routes/chat";
import { supabaseRouter } from "./routes/supabase";
import { settingsRouter } from "./routes/settings";

const app = new Hono();

app.use("*", cors({ origin: "*", allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] }));
app.use("*", logger());

app.route("/projects", projectsRouter);
app.route("/chat", chatRouter);
app.route("/supabase", supabaseRouter);
app.route("/settings", settingsRouter);

app.get("/health", (c) => c.json({ status: "ok", version: "1.0.0" }));

const port = parseInt(process.env.PORT ?? "3001");
console.log(`🚀 Orchestrator running on port ${port}`);

serve({ fetch: app.fetch, port });
