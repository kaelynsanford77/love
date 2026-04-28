import { ChatMessage, complete, stream } from './provider.js';

export type Tier = 'fast' | 'standard' | 'powerful';

export interface RoutingDecision {
  tier: Tier;
  model: string;
  reason: string;
}

export interface RouterResult {
  content: string;
  model: string;
  tier: Tier;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  duration_ms: number;
  escalated_from?: Tier;
  error?: string;
}

const MODELS: Record<Tier, string> = {
  fast: process.env.LLM_MODEL_FAST ?? 'claude-haiku-4-5-20251001',
  standard: process.env.LLM_MODEL_STANDARD ?? 'claude-sonnet-4-6-thinking',
  powerful: process.env.LLM_MODEL_POWERFUL ?? 'claude-opus-4-6-thinking',
};

const FAST_PATTERNS = [
  /fix (typo|bug|error|warning)/i,
  /change (color|text|title|label)/i,
  /\brename\b/i,
  /add comment/i,
  /\bexplain\b/i,
  /what does .+ do/i,
];

const POWERFUL_PATTERNS = [
  /\brefactor\b/i,
  /\bredesign\b/i,
  /\barchitect\b/i,
  /\bbuild (full|complete|entire)\b/i,
  /\bmigrate\b/i,
  /from scratch/i,
  /authentication system/i,
  /database schema/i,
  /build a dashboard/i,
  /create an app/i,
  /implement RBAC/i,
  /add real-time/i,
  /\bwebsocket\b/i,
];

export function classifyTier(
  message: string,
  conversationLength: number,
  previousFailed?: boolean,
  estimatedFileChanges?: number,
): RoutingDecision {
  if (process.env.LLM_ROUTING === 'fixed') {
    const model = process.env.LLM_MODEL ?? MODELS.standard;
    return { tier: 'standard', model, reason: 'fixed routing' };
  }

  const fileChanges = estimatedFileChanges ?? estimateFileChanges(message);

  if (previousFailed) {
    return { tier: 'powerful', model: MODELS.powerful, reason: 'previous turn failed QA' };
  }

  if (fileChanges > 10) {
    return { tier: 'powerful', model: MODELS.powerful, reason: `estimated ${fileChanges} file changes` };
  }

  for (const p of POWERFUL_PATTERNS) {
    if (p.test(message)) {
      return { tier: 'powerful', model: MODELS.powerful, reason: `matched pattern: ${p}` };
    }
  }

  const isFastMatch = FAST_PATTERNS.some((p) => p.test(message));
  if (isFastMatch && fileChanges <= 2 && conversationLength < 10) {
    return { tier: 'fast', model: MODELS.fast, reason: 'simple edit detected' };
  }

  return { tier: 'standard', model: MODELS.standard, reason: 'default standard routing' };
}

function estimateFileChanges(message: string): number {
  const multiFileSignals = [
    /all (files|components|pages)/i,
    /throughout/i,
    /every (file|component|page)/i,
    /multiple/i,
  ];
  for (const p of multiFileSignals) {
    if (p.test(message)) return 11;
  }
  const singleFileMatch = message.match(/\b(src\/|components\/|pages\/|hooks\/)[^\s]+\.(tsx?|css|json)/g);
  if (singleFileMatch) return singleFileMatch.length;
  return 1;
}

const ESCALATION: Partial<Record<Tier, Tier>> = {
  fast: 'standard',
  standard: 'powerful',
};

export async function route(
  messages: ChatMessage[],
  conversationLength: number,
  systemPrompt?: string,
  previousFailed?: boolean,
): Promise<RouterResult> {
  const lastMessage = messages[messages.length - 1]?.content ?? '';
  let decision = classifyTier(lastMessage, conversationLength, previousFailed);
  let escalatedFrom: Tier | undefined;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await complete(messages, decision.model, systemPrompt);
      return {
        ...result,
        tier: decision.tier,
        escalated_from: escalatedFrom,
      };
    } catch (err) {
      const nextTier = ESCALATION[decision.tier];
      if (!nextTier) {
        return {
          content: '',
          model: decision.model,
          tier: decision.tier,
          tokens_in: 0,
          tokens_out: 0,
          cost_usd: 0,
          duration_ms: 0,
          escalated_from: escalatedFrom,
          error: err instanceof Error ? err.message : String(err),
        };
      }
      escalatedFrom = decision.tier;
      decision = { tier: nextTier, model: MODELS[nextTier], reason: 'auto-escalation on failure' };
    }
  }

  return {
    content: '',
    model: decision.model,
    tier: decision.tier,
    tokens_in: 0,
    tokens_out: 0,
    cost_usd: 0,
    duration_ms: 0,
    error: 'All escalation tiers exhausted',
  };
}

export async function* routeStream(
  messages: ChatMessage[],
  conversationLength: number,
  systemPrompt?: string,
  previousFailed?: boolean,
): AsyncGenerator<string | { __meta: RouterResult }> {
  const lastMessage = messages[messages.length - 1]?.content ?? '';
  const decision = classifyTier(lastMessage, conversationLength, previousFailed);

  const { stream: streamFn } = await import('./provider.js');
  for await (const chunk of streamFn(messages, decision.model, systemPrompt)) {
    yield chunk;
  }
  yield {
    __meta: {
      content: '',
      model: decision.model,
      tier: decision.tier,
      tokens_in: 0,
      tokens_out: 0,
      cost_usd: 0,
      duration_ms: 0,
    },
  };
}
