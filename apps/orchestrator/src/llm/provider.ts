/**
 * LLM provider abstraction — supports OpenAI-compatible APIs (including Quatarly)
 * and Anthropic. Controlled via environment variables:
 *   LLM_PROVIDER=openai|anthropic   (default: openai)
 *   OPENAI_API_KEY                  (Quatarly key when using Quatarly)
 *   OPENAI_BASE_URL                 (e.g. https://api.quatarly.cloud/v1)
 *   ANTHROPIC_API_KEY
 */

export type LLMProvider = 'openai' | 'anthropic';

export function getProvider(): LLMProvider {
  const p = (process.env.LLM_PROVIDER ?? 'openai').toLowerCase();
  if (p === 'anthropic') return 'anthropic';
  return 'openai';
}

export type ModelTier = 'fast' | 'standard' | 'powerful';

export function getModelForTier(tier: ModelTier): string {
  switch (tier) {
    case 'fast':
      return process.env.LLM_MODEL_FAST ?? 'claude-haiku-4-5-20251001';
    case 'standard':
      return process.env.LLM_MODEL_STANDARD ?? 'claude-sonnet-4-6-thinking';
    case 'powerful':
      return process.env.LLM_MODEL_POWERFUL ?? 'claude-opus-4-6-thinking';
  }
}
