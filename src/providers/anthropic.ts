import Anthropic from '@anthropic-ai/sdk';

export interface ProviderOptions {
  apiKey?: string;
  /** Base URL for Anthropic-compatible APIs (e.g. DeepSeek, OpenRouter) */
  baseURL?: string;
  model?: string;
  maxTokens?: number;
}

export interface ProviderResult {
  text: string;
  model: string;
  usage: { input: number; output: number };
}

/**
 * Anthropic (Claude) provider adapter.
 * Uses the @anthropic-ai/sdk. Supports custom baseURL for compatible APIs.
 */
/** Strip ANSI escape artifacts and context-window tags from model names. */
export function sanitizeModel(name: string): string {
  // Remove [Nm] or [Nk] suffixes (e.g. "deepseek-v4-pro[1m]" → "deepseek-v4-pro")
  return name.replace(/\[\d+[mk]\]$/i, '').trim();
}

export async function callAnthropic(
  systemPrompt: string,
  userMessage: string,
  opts: ProviderOptions = {}
): Promise<ProviderResult> {
  const apiKey =
    opts.apiKey ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.ANTHROPIC_AUTH_TOKEN ||
    process.env.CLAUDE_API_KEY;

  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY not found. Set it in env or pass via options.'
    );
  }

  const baseURL = opts.baseURL || process.env.ANTHROPIC_BASE_URL || undefined;

  const client = new Anthropic({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });

  const model = sanitizeModel(
    opts.model || process.env.ANTHROPIC_MODEL || 'deepseek-v4-flash'
  );

  const resp = await client.messages.create({
    model,
    max_tokens: opts.maxTokens || 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = resp.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  return {
    text,
    model: resp.model,
    usage: {
      input: resp.usage.input_tokens,
      output: resp.usage.output_tokens,
    },
  };
}
