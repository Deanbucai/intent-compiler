import Ajv from 'ajv';
import { callAnthropic, type ProviderOptions } from './providers/anthropic';
import { callOpenAI } from './providers/openai';
import { INTENT_IR_SCHEMA, type IntentIR } from './schema';

const ajv = new Ajv({ allErrors: true });
const validateIR = ajv.compile(INTENT_IR_SCHEMA);

export type Provider = 'anthropic' | 'openai';

export interface CompileOptions {
  /** LLM provider */
  provider?: Provider;
  /** Provider-specific options (apiKey, model, etc.) */
  providerOpts?: ProviderOptions & { baseURL?: string };
  /** Max retries on validation failure */
  maxRetries?: number;
}

export interface CompileResult {
  /** The validated Intent IR */
  ir: IntentIR;
  /** Raw LLM response text */
  raw?: string;
  /** Token usage */
  usage?: { input: number; output: number };
  /** Provider and model used */
  model: string;
}

/**
 * System prompt that turns the LLM into a compiler frontend.
 * Includes the full JSON Schema so the LLM knows the exact contract.
 */
function buildSystemPrompt(): string {
  const schemaStr = JSON.stringify(INTENT_IR_SCHEMA, null, 2);
  return `You are a compiler frontend. Your job is to parse natural language descriptions of web pages and output structured Intent IR JSON.

## Rules
1. Output ONLY valid JSON — no markdown, no code fences, no explanation.
2. The JSON MUST conform to the schema below.
3. Infer reasonable defaults when information is missing:
   - No color scheme? Use "light" tones for corporate, "dark" for luxury/tech.
   - No typography? Default to "modern-sans".
   - No language specified? Default to "zh-CN" if input is Chinese, "en-US" otherwise.
4. Map the user's described sections to the correct section types:
   - "头部/主页大图/首屏" → hero
   - "特点/优势/为什么选我们" → features
   - "规格/参数/技术指标" → specs
   - "常见问题/问答" → faq
   - "联系我们/表单/询价" → contact_form
   - "认证/资质/证书/合作方" → trust_badges
   - "底部/版权/链接" → footer
   - Anything that doesn't fit → custom
5. Assign priorities based on the order the user mentions sections (10, 20, 30...).
6. Keep content concise — headlines under 50 chars, descriptions under 200 chars.
7. The "summary" field should be a single sentence describing the page's purpose.

## Output Schema (JSON Schema)
\`\`\`json
${schemaStr}
\`\`\`

## Example
Input: "做一个SaaS landing page，蓝色调，hero+3个features+contact form"

Output:
{
  "$schema": "https://intent-compiler.dev/schema/v0.1.0",
  "version": "0.1.0",
  "intent": {
    "domain": "web_page",
    "type": "landing",
    "industry": "saas",
    "language": "en-US",
    "summary": "SaaS product landing page with features and contact form"
  },
  "design": {
    "colorScheme": "blue-light",
    "tone": "professional",
    "typography": "modern-sans",
    "responsive": true
  },
  "layout": [
    {
      "id": "hero",
      "type": "hero",
      "priority": 10,
      "content": {
        "headline": "Streamline Your Workflow",
        "subheadline": "The all-in-one platform for modern teams.",
        "cta": { "text": "Get Started Free", "action": "signup" }
      }
    },
    {
      "id": "features",
      "type": "features",
      "priority": 20,
      "content": {
        "title": "Why Choose Us",
        "items": [
          { "title": "Fast", "description": "Lightning-fast performance." },
          { "title": "Secure", "description": "Enterprise-grade security." },
          { "title": "Simple", "description": "Intuitive interface." }
        ]
      }
    },
    {
      "id": "contact",
      "type": "contact_form",
      "priority": 30,
      "content": {
        "title": "Get in Touch",
        "fields": [
          { "name": "name", "label": "Name", "type": "text", "required": true },
          { "name": "email", "label": "Email", "type": "email", "required": true },
          { "name": "message", "label": "Message", "type": "textarea" }
        ]
      }
    }
  ]
}`;
}

/**
 * Extract JSON from LLM response — handles code fences and stray text.
 */
function extractJSON(text: string): string {
  // Try code-fenced JSON first
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // Try to find JSON object boundaries
  const braceStart = text.indexOf('{');
  const braceEnd = text.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
    return text.slice(braceStart, braceEnd + 1);
  }

  return text.trim();
}

/**
 * Compile natural language intent into structured Intent IR.
 *
 * @example
 * ```ts
 * const result = await compile("做一个牙刷工厂B2B官网，深色金色调，hero+技术规格+FAQ+联系表单");
 * console.log(result.ir.layout.length); // 4
 * ```
 */
export async function compile(
  input: string,
  opts: CompileOptions = {}
): Promise<CompileResult> {
  const systemPrompt = buildSystemPrompt();
  const maxRetries = opts.maxRetries ?? 2;

  let lastError: Error | null = null;
  let lastRaw = '';

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let result;
    if (opts.provider === 'openai') {
      result = await callOpenAI(systemPrompt, input, opts.providerOpts);
    } else {
      result = await callAnthropic(systemPrompt, input, opts.providerOpts);
    }

    lastRaw = result.text;

    // Extract and parse JSON
    let parsed: unknown;
    try {
      const jsonStr = extractJSON(result.text);
      parsed = JSON.parse(jsonStr);
    } catch {
      lastError = new Error('Failed to parse LLM output as JSON');
      if (attempt < maxRetries) continue;
      throw lastError;
    }

    // Validate against schema
    if (!validateIR(parsed)) {
      const errors = validateIR.errors
        ?.map((e) => `${e.instancePath} ${e.message}`)
        .join('; ');
      lastError = new Error(`IR validation failed: ${errors}`);

      if (attempt < maxRetries) {
        // Append validation errors to prompt for retry
        const fixPrompt = `Your previous output failed validation. Errors: ${errors}\nPlease fix and output valid JSON only.`;
        const fixResult = await callAnthropic(systemPrompt, fixPrompt);
        lastRaw = fixResult.text;
        continue;
      }
      throw lastError;
    }

    return {
      ir: parsed as IntentIR,
      raw: lastRaw,
      usage: result.usage,
      model: result.model,
    };
  }

  throw lastError ?? new Error('Compilation failed');
}
