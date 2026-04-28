import OpenAI from 'openai';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  duration_ms: number;
}

export interface StreamChunk {
  delta: string;
  done: boolean;
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.quatarly.cloud/v1',
});

const COST_PER_1K: Record<string, { in: number; out: number }> = {
  'claude-haiku-4-5-20251001': { in: 0.00025, out: 0.00125 },
  'claude-sonnet-4-6-thinking': { in: 0.003, out: 0.015 },
  'claude-opus-4-6-thinking': { in: 0.015, out: 0.075 },
};

function calcCost(model: string, tokensIn: number, tokensOut: number): number {
  const rates = COST_PER_1K[model] ?? { in: 0.001, out: 0.005 };
  return (tokensIn / 1000) * rates.in + (tokensOut / 1000) * rates.out;
}

export async function complete(
  messages: ChatMessage[],
  model: string,
  systemPrompt?: string,
): Promise<LLMResponse> {
  const allMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (systemPrompt) {
    allMessages.push({ role: 'system', content: systemPrompt });
  }
  allMessages.push(...messages);

  const start = Date.now();
  const resp = await client.chat.completions.create({
    model,
    messages: allMessages,
  });
  const duration_ms = Date.now() - start;

  const content = resp.choices[0]?.message?.content ?? '';
  const tokens_in = resp.usage?.prompt_tokens ?? 0;
  const tokens_out = resp.usage?.completion_tokens ?? 0;
  const cost_usd = calcCost(model, tokens_in, tokens_out);

  return { content, model, tokens_in, tokens_out, cost_usd, duration_ms };
}

export async function* stream(
  messages: ChatMessage[],
  model: string,
  systemPrompt?: string,
): AsyncGenerator<string> {
  const allMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (systemPrompt) {
    allMessages.push({ role: 'system', content: systemPrompt });
  }
  allMessages.push(...messages);

  const resp = await client.chat.completions.create({
    model,
    messages: allMessages,
    stream: true,
  });

  for await (const chunk of resp) {
    const delta = chunk.choices[0]?.delta?.content ?? '';
    if (delta) yield delta;
  }
}
