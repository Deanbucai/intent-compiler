import type { ProviderOptions, ProviderResult } from './anthropic';

/**
 * OpenAI-compatible provider adapter.
 * Works with OpenAI, DeepSeek, Kimi, Qwen, and any OpenAI-compatible API.
 *
 * Usage:
 *   callOpenAI(systemPrompt, userMessage, {
 *     apiKey: 'sk-...',
 *     baseURL: 'https://api.deepseek.com/v1',  // optional override
 *     model: 'deepseek-chat'
 *   })
 */
export async function callOpenAI(
  systemPrompt: string,
  userMessage: string,
  opts: ProviderOptions & { baseURL?: string } = {}
): Promise<ProviderResult> {
  const apiKey =
    opts.apiKey || process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY not found. Set it in env or pass via options.'
    );
  }

  const baseURL = opts.baseURL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

  const resp = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model || 'gpt-4o',
      max_tokens: opts.maxTokens || 4096,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!resp.ok) {
    const errBody = await resp.text().catch(() => '');
    throw new Error(`OpenAI API error ${resp.status}: ${errBody}`);
  }

  const data = (await resp.json()) as {
    model: string;
    usage: { prompt_tokens: number; completion_tokens: number };
    choices: Array<{ message: { content: string } }>;
  };

  return {
    text: data.choices[0]?.message?.content || '',
    model: data.model,
    usage: {
      input: data.usage.prompt_tokens,
      output: data.usage.completion_tokens,
    },
  };
}
