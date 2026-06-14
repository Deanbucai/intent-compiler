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

  // Smart model selection based on DeepSeek V4 benchmarks (2026):
  // Flash: costs 8% of Pro, handles 80% of daily tasks (single-file code, summaries, chat)
  // Pro: needed for multi-step agent loops, complex architecture, high-accuracy facts
  const resolvedModel = opts.model || (() => {
    const isComplex =
      userMessage.length > 400 ||                          // Long description
      /\b(?:技术规格|认证标志|价格表|gallery|slide|document|ecommerce_content|business_report)\b/.test(userMessage) || // Multi-domain
      /\b(?:俄文|Russian|ru-RU)\b/.test(userMessage) ||   // Translation needs accuracy
      (userMessage.match(/\d+\s*(?:项|条|个|档)/g) || []).length > 2; // Multiple numbered lists
    return isComplex
      ? (process.env.ANTHROPIC_MODEL || 'deepseek-v4-pro')
      : (process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL || 'deepseek-v4-flash');
  })();

  const client = new Anthropic({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });

  const resp = await client.messages.create({
    model: resolvedModel,
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
