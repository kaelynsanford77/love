import OpenAI from "openai";

export type ModelTier = "fast" | "standard" | "powerful";

const MODEL_MAP: Record<ModelTier, string> = {
  fast: process.env.LLM_MODEL_FAST ?? "claude-haiku-4-5-20251001",
  standard: process.env.LLM_MODEL_STANDARD ?? "claude-sonnet-4-6-thinking",
  powerful: process.env.LLM_MODEL_POWERFUL ?? "claude-opus-4-6-thinking",
};

const TIER_EMOJI: Record<ModelTier, string> = {
  fast: "🟢",
  standard: "🔵",
  powerful: "🟣",
};

const simplePatterns = [
  /fix (the|this) (typo|bug|error|warning)/i,
  /change (the|this) (color|text|title|label|style)/i,
  /rename/i,
  /add (a )?comment/i,
  /explain (this|what|how)/i,
  /what does .* do/i,
  /make .* (bigger|smaller|bold|italic)/i,
  /update (the )?(text|label|title)/i,
];

const complexPatterns = [
  /refactor/i,
  /redesign/i,
  /architect/i,
  /build (a|an|the) (full|complete|entire)/i,
  /migrate/i,
  /from scratch/i,
  /authentication.*system/i,
  /database.*schema/i,
  /real.?time/i,
  /websocket/i,
  /payment/i,
  /oauth/i,
  /multi.?tenant/i,
];

export function classifyRequest(message: string, fileCount = 0, _turnCount = 0): ModelTier {
  const isSimple = simplePatterns.some((p) => p.test(message)) && fileCount <= 2;
  if (isSimple) return "fast";

  const isComplex = complexPatterns.some((p) => p.test(message)) || fileCount > 10 || message.length > 500;
  if (isComplex) return "powerful";

  return "standard";
}

export function pickModel(
  message: string,
  context: { fileCount?: number; turns?: number } = {}
): { model: string; tier: ModelTier; emoji: string } {
  const routing = process.env.LLM_ROUTING ?? "auto";

  if (routing === "fixed") {
    const model = process.env.LLM_MODEL_FIXED ?? MODEL_MAP.standard;
    return { model, tier: "standard", emoji: "🔵" };
  }

  const tier = classifyRequest(message, context.fileCount, context.turns);
  return {
    model: MODEL_MAP[tier],
    tier,
    emoji: TIER_EMOJI[tier],
  };
}

export function escalateTier(current: ModelTier): ModelTier | null {
  if (current === "fast") return "standard";
  if (current === "standard") return "powerful";
  return null;
}

let _openai: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY ?? "no-key",
      baseURL: process.env.OPENAI_BASE_URL ?? "https://api.quatarly.cloud/v1",
    });
  }
  return _openai;
}
