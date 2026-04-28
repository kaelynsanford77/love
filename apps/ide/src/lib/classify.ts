/** Classify a file path into a broad category for UI hints */
export type FileCategory = 'frontend' | 'backend' | 'shared' | 'config' | 'asset' | 'test';

export function classifyFile(path: string): FileCategory {
  const lower = path.toLowerCase();

  if (/\.(test|spec)\.(tsx?|jsx?|mjs)$/.test(lower)) return 'test';

  if (/\.(png|jpe?g|gif|svg|ico|webp|avif|woff2?|ttf|eot)$/.test(lower)) return 'asset';

  if (
    /\.(json|ya?ml|toml|env|env\..+|\.prettierrc|\.eslintrc|\.babelrc)$/.test(lower) ||
    /(^|\/)(config|\.config|vite\.config|tailwind\.config|tsconfig)/.test(lower)
  )
    return 'config';

  if (
    /(server|api|route|controller|service|middleware|handler|db|database|orm|prisma|drizzle|knex|sequelize|model)/.test(
      lower
    ) &&
    !/src\/app/.test(lower)
  )
    return 'backend';

  if (/\.(tsx?|jsx?|css|html|scss|less|styl)$/.test(lower)) return 'frontend';

  return 'shared';
}

/** Get Monaco language id from a file path */
export function getLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    json: 'json',
    jsonc: 'json',
    css: 'css',
    scss: 'scss',
    less: 'less',
    html: 'html',
    md: 'markdown',
    mdx: 'markdown',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    py: 'python',
    rs: 'rust',
    go: 'go',
    sql: 'sql',
    graphql: 'graphql',
    gql: 'graphql',
    env: 'plaintext',
    txt: 'plaintext',
  };
  return map[ext] ?? 'plaintext';
}

/** Get a display icon name (lucide) for a file */
export function getFileIcon(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  const icons: Record<string, string> = {
    ts: 'FileCode',
    tsx: 'FileCode',
    js: 'FileCode',
    jsx: 'FileCode',
    json: 'Braces',
    css: 'Palette',
    scss: 'Palette',
    html: 'Globe',
    md: 'FileText',
    yaml: 'Settings',
    yml: 'Settings',
    env: 'Lock',
    svg: 'Image',
    png: 'Image',
    jpg: 'Image',
  };
  return icons[ext] ?? 'File';
}
