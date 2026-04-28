/**
 * Smart 3-tier auto-router for LLM requests.
 *
 * Tiers:
 *   fast     — quick replies, simple edits (claude-haiku-4-5)
 *   standard — most coding tasks (claude-sonnet-4-6-thinking)
 *   powerful — complex architecture, multi-file refactors (claude-opus-4-6-thinking)
 *
 * With LLM_ROUTING=auto the router picks the tier based on message complexity.
 * Set LLM_ROUTING=fast|standard|powerful to force a specific tier.
 */

import { getModelForTier, type ModelTier } from './provider';

export function routeToTier(userMessage: string): ModelTier {
  const routing = (process.env.LLM_ROUTING ?? 'auto').toLowerCase();

  if (routing === 'fast') return 'fast';
  if (routing === 'standard') return 'standard';
  if (routing === 'powerful') return 'powerful';

  // Auto routing based on message heuristics
  const msg = userMessage.toLowerCase();
  const wordCount = msg.split(/\s+/).length;

  // Simple / short messages → fast model
  if (wordCount <= 15 && !msg.includes('refactor') && !msg.includes('architect')) {
    return 'fast';
  }

  // Complex tasks → powerful model
  const powerfulKeywords = [
    'refactor',
    'architect',
    'redesign',
    'migrate',
    'rewrite',
    'restructure',
    'performance',
    'security audit',
    'entire',
    'whole app',
  ];
  if (powerfulKeywords.some((kw) => msg.includes(kw))) {
    return 'powerful';
  }

  // Default → standard model
  return 'standard';
}

export function getRoutedModel(userMessage: string): string {
  const tier = routeToTier(userMessage);
  return getModelForTier(tier);
}
