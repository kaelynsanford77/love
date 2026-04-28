import OpenAI from "openai";

// ─── Model tiers ─────────────────────────────────────────────────────────────
export type ModelTier = "fast" | "standard" | "powerful";

const TIER_MODELS: Record<ModelTier, string> = {
  fast: process.env.LLM_MODEL_FAST || "claude-haiku-4-5-20251001",
  standard: process.env.LLM_MODEL_STANDARD || "claude-sonnet-4-6-thinking",
  powerful: process.env.LLM_MODEL_POWERFUL || "claude-opus-4-6-thinking",
};

// ─── Request classifier ───────────────────────────────────────────────────────
const FAST_PATTERNS = [
  /fix (the|this) (typo|bug|error|warning)/i,
  /change (the|this) (color|text|title|label|font)/i,
  /rename/i,
  /add a? comment/i,
  /explain (this|what|why|how)/i,
  /what does .* do/i,
  /show me/i,
  /format/i,
];

const POWERFUL_PATTERNS = [
  /refactor/i,
  /redesign/i,
  /architect/i,
  /build (a|an|the) (full|complete|entire)/i,
  /migrate/i,
  /from scratch/i,
  /authentication.*system/i,
  /database.*schema/i,
  /implement .{40,}/i,
];

export function classifyRequest(message: string, fileCount = 0): ModelTier {
  if (FAST_PATTERNS.some((p) => p.test(message)) && fileCount <= 2) {
    return "fast";
  }
  if (POWERFUL_PATTERNS.some((p) => p.test(message)) || fileCount > 10) {
    return "powerful";
  }
  return "standard";
}

export function pickModel(
  message: string,
  context: { fileCount?: number; turns?: number } = {}
): { model: string; tier: ModelTier } {
  const routing = process.env.LLM_ROUTING || "auto";

  if (routing === "fixed") {
    const fixed =
      process.env.LLM_MODEL_STANDARD || TIER_MODELS.standard;
    return { model: fixed, tier: "standard" };
  }

  const tier = classifyRequest(message, context.fileCount ?? 0);
  return { model: TIER_MODELS[tier], tier };
}

export function escalateTier(current: ModelTier): ModelTier | null {
  if (current === "fast") return "standard";
  if (current === "standard") return "powerful";
  return null;
}

export function getTierModel(tier: ModelTier): string {
  return TIER_MODELS[tier];
}

// ─── OpenAI client ────────────────────────────────────────────────────────────
export function createLLMClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "no-key",
    baseURL: process.env.OPENAI_BASE_URL || "https://api.quatarly.cloud/v1",
  });
}

// ─── Tier display ─────────────────────────────────────────────────────────────
export const TIER_LABELS: Record<ModelTier, string> = {
  fast: "⚡ fast",
  standard: "🔵 standard",
  powerful: "🟣 powerful",
};
