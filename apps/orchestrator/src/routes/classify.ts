import { Hono } from 'hono';

export const classifyRoutes = new Hono();

const FRONTEND_PATTERNS = /\.(tsx?|jsx?|css|html|svg|png|jpg|gif|webp|ico)$/i;
const BACKEND_PATTERNS = /(server|api|route|controller|service|middleware|handler|db|database|orm|model)/i;
const CONFIG_PATTERNS = /\.(json|ya?ml|toml|env)$|(config|tsconfig|vite\.config|tailwind\.config)/i;

classifyRoutes.get('/', (c) => {
  const filePath = c.req.query('path') ?? '';

  let category: string;
  if (/\.(test|spec)\.(tsx?|jsx?)$/.test(filePath)) {
    category = 'test';
  } else if (CONFIG_PATTERNS.test(filePath)) {
    category = 'config';
  } else if (BACKEND_PATTERNS.test(filePath) && !/src\/app/.test(filePath)) {
    category = 'backend';
  } else if (FRONTEND_PATTERNS.test(filePath)) {
    category = 'frontend';
  } else {
    category = 'shared';
  }

  return c.json({ path: filePath, category });
});

classifyRoutes.post('/batch', async (c) => {
  const { paths } = await c.req.json<{ paths: string[] }>();
  const results = (paths ?? []).map((p) => {
    let category: string;
    if (/\.(test|spec)\.(tsx?|jsx?)$/.test(p)) category = 'test';
    else if (CONFIG_PATTERNS.test(p)) category = 'config';
    else if (BACKEND_PATTERNS.test(p) && !/src\/app/.test(p)) category = 'backend';
    else if (FRONTEND_PATTERNS.test(p)) category = 'frontend';
    else category = 'shared';
    return { path: p, category };
  });
  return c.json({ results });
});
