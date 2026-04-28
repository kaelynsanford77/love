export type ModelTier = 'fast' | 'standard' | 'powerful';

export const TIERS: Record<ModelTier, string> = {
  fast: process.env.LLM_MODEL_FAST || 'gpt-4o-mini',
  standard: process.env.LLM_MODEL_STANDARD || 'gpt-4o',
  powerful: process.env.LLM_MODEL_POWERFUL || 'gpt-4o',
};

const SIMPLE_PATTERNS = [
  /fix (the|this) (typo|bug|error|warning)/i,
  /change (the|this) (color|text|title|label)/i,
  /rename/i,
  /add a comment/i,
  /explain/i,
  /what (is|does|are)/i,
  /show me/i,
];

const COMPLEX_PATTERNS = [
  /refactor/i,
  /redesign/i,
  /architect/i,
  /build (a|an|the) (full|complete|entire)/i,
  /migrate/i,
  /from scratch/i,
  /authentication.*system/i,
  /database.*schema/i,
  /implement.*feature/i,
  /create.*component.*with/i,
];

export function classifyRequest(message: string, fileCount: number): ModelTier {
  if (SIMPLE_PATTERNS.some((p) => p.test(message)) && fileCount <= 2) return 'fast';
  if (COMPLEX_PATTERNS.some((p) => p.test(message)) || fileCount > 10) return 'powerful';
  return 'standard';
}

export function getModel(tier: ModelTier): string {
  return TIERS[tier];
}

export function tierFromModel(model: string): ModelTier {
  if (model === TIERS.fast) return 'fast';
  if (model === TIERS.powerful) return 'powerful';
  return 'standard';
}

export function estimateCost(model: string, tokensIn: number, tokensOut: number): number {
  // Rough pricing per 1M tokens (input/output)
  const pricing: Record<string, [number, number]> = {
    'gpt-4o-mini': [0.15, 0.6],
    'gpt-4o': [2.5, 10],
    'claude-haiku-3-5': [0.8, 4],
    'claude-sonnet-4-5': [3, 15],
    'claude-opus-4-5': [15, 75],
  };

  const [inPrice, outPrice] = pricing[model] || [2.5, 10];
  return (tokensIn / 1_000_000) * inPrice + (tokensOut / 1_000_000) * outPrice;
}
