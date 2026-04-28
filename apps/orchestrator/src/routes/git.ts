import { Hono } from "hono";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const router = new Hono();

const WORKSPACES_DIR = () =>
  path.resolve(process.env.WORKSPACES_DIR || path.join(process.cwd(), "workspaces"));

function projectPath(id: string) {
  return path.join(WORKSPACES_DIR(), id);
}

// ─── GET /git/:projectId/status ───────────────────────────────────────────────
router.get("/:projectId/status", async (c) => {
  const id = c.req.param("projectId");
  try {
    const { stdout } = await execFileAsync("git", ["status", "--porcelain"], { cwd: projectPath(id) });
    const files = stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => ({
        status: line.slice(0, 2).trim(),
        path: line.slice(3),
      }));
    return c.json({ files });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

// ─── GET /git/:projectId/log ──────────────────────────────────────────────────
router.get("/:projectId/log", async (c) => {
  const id = c.req.param("projectId");
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["log", "--oneline", "-20", "--pretty=format:%H|%an|%ae|%ar|%s"],
      { cwd: projectPath(id) }
    );
    const commits = stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [hash, author, email, date, ...rest] = line.split("|");
        return { hash, author, email, date, message: rest.join("|") };
      });
    return c.json({ commits });
  } catch (_e) {
    return c.json({ commits: [] });
  }
});

// ─── POST /git/:projectId/commit ──────────────────────────────────────────────
router.post("/:projectId/commit", async (c) => {
  const id = c.req.param("projectId");
  const { message = "Update" } = await c.req.json();
  try {
    await execFileAsync("git", ["add", "-A"], { cwd: projectPath(id) });
    const { stdout } = await execFileAsync("git", ["commit", "-m", message], {
      cwd: projectPath(id),
    });
    return c.json({ ok: true, output: stdout });
  } catch (e: any) {
    return c.json({ error: e.message, stderr: e.stderr }, 500);
  }
});

// ─── POST /git/:projectId/push ────────────────────────────────────────────────
router.post("/:projectId/push", async (c) => {
  const id = c.req.param("projectId");
  const { remote = "origin", branch = "main" } = await c.req.json() || {};
  try {
    const { stdout } = await execFileAsync("git", ["push", remote, branch], {
      cwd: projectPath(id),
    });
    return c.json({ ok: true, output: stdout });
  } catch (e: any) {
    return c.json({ error: e.message, stderr: e.stderr }, 500);
  }
});

// ─── POST /git/:projectId/pull ────────────────────────────────────────────────
router.post("/:projectId/pull", async (c) => {
  const id = c.req.param("projectId");
  try {
    const { stdout } = await execFileAsync("git", ["pull"], { cwd: projectPath(id) });
    return c.json({ ok: true, output: stdout });
  } catch (e: any) {
    return c.json({ error: e.message, stderr: e.stderr }, 500);
  }
});

// ─── POST /git/:projectId/init ────────────────────────────────────────────────
router.post("/:projectId/init", async (c) => {
  const id = c.req.param("projectId");
  try {
    const { stdout: init } = await execFileAsync("git", ["init"], { cwd: projectPath(id) });
    await execFileAsync("git", ["add", "-A"], { cwd: projectPath(id) });
    const { stdout: commit } = await execFileAsync("git", ["commit", "-m", "Initial commit"], {
      cwd: projectPath(id),
    });
    return c.json({ ok: true, output: `${init}\n${commit}` });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ─── POST /git/:projectId/remote ─────────────────────────────────────────────
router.post("/:projectId/remote", async (c) => {
  const id = c.req.param("projectId");
  const { url } = await c.req.json();
  try {
    await execFileAsync("git", ["remote", "add", "origin", url], { cwd: projectPath(id) }).catch(() =>
      execFileAsync("git", ["remote", "set-url", "origin", url], { cwd: projectPath(id) })
    );
    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ─── GET /git/:projectId/diff ─────────────────────────────────────────────────
router.get("/:projectId/diff", async (c) => {
  const id = c.req.param("projectId");
  const file = c.req.query("file");
  try {
    const args = file ? ["diff", "--", file] : ["diff"];
    const { stdout } = await execFileAsync("git", args, { cwd: projectPath(id) });
    return c.json({ diff: stdout });
  } catch (_e) {
    return c.json({ diff: "" });
  }
});

export const gitRouter = router;
