import Ajv from 'ajv';
import { callAnthropic, type ProviderOptions } from './providers/anthropic';
import { callOpenAI } from './providers/openai';
import { INTENT_IR_SCHEMA, type IntentIR } from './schema';
import type { IRMemory, MemoryEntry } from './ir-memory';

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
  /**
   * Partial recompilation: lock specific top-level fields.
   * e.g. lockFields: ['design'] means design is preserved from existingIR,
   * only layout and intent are regenerated.
   */
  lockFields?: Array<'intent' | 'design' | 'layout'>;
  /** Required when lockFields is set — the existing IR to preserve from */
  existingIR?: IntentIR;
  /** IRMemory instance for few-shot pattern injection */
  memory?: IRMemory;
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
function buildSystemPrompt(lockedFields?: string[], existingIR?: Partial<IntentIR>, fewShots?: MemoryEntry[]): string {
  const schemaStr = JSON.stringify(INTENT_IR_SCHEMA, null, 2);

  let fewShotBlock = '';
  if (fewShots && fewShots.length > 0) {
    const examples = fewShots.map((m, i) => {
      const ir = JSON.parse(m.ir_json);
      return `Example ${i + 1} (${m.industry || 'unknown industry'}, ${m.section_types}):\nInput: ${m.nl_input.slice(0, 200)}\nIR: ${JSON.stringify(ir, null, 2).slice(0, 800)}`;
    }).join('\n\n');
    fewShotBlock = `
## FEW-SHOT EXAMPLES — Reference These Patterns
Below are successful compilations for similar requests. Use them as reference for section structure, industry conventions, and design choices.

${examples}

`;
  }

  let lockInstructions = '';
  if (lockedFields && lockedFields.length > 0 && existingIR) {
    const lockedData: Record<string, unknown> = {};
    for (const f of lockedFields) {
      if (f in existingIR) lockedData[f] = (existingIR as Record<string, unknown>)[f];
    }
    lockInstructions = `
## LOCKED FIELDS — DO NOT MODIFY
The following fields are LOCKED and MUST be preserved exactly as-is in your output:
\`\`\`json
${JSON.stringify(lockedData, null, 2)}
\`\`\`
Copy these fields verbatim into your output. Only generate the UNLOCKED fields based on the user's input.
`;
  }

  return `You are a compiler frontend. Your job is to parse natural language descriptions of web pages and output structured Intent IR JSON.
${lockInstructions}

## Rules
1. Output ONLY valid JSON — no markdown, no code fences, no explanation.
2. The JSON MUST conform to the schema below.
3. Infer reasonable defaults when information is missing:
   - No color scheme? Use "light" tones for corporate, "dark" for luxury/tech.
   - No typography? Default to "modern-sans".
   - No language specified? Default to "zh-CN" if input is Chinese, "en-US" otherwise.
4. Map the user's described sections to the correct section types:
   - For web_page (landing/saas/portfolio):
     "头部"→hero, "特点"→features, "规格"→specs, "问答"→faq, "联系"→contact_form,
     "认证"→trust_badges, "价格"→pricing, "图集"→gallery, "CTA"→cta, "评价"→testimonials, "底部"→footer
   - For slide_deck (presentation/pitch deck):
     "封面/标题页"→title_slide, "内容页/正文"→content_slide, "要点/列表"→bullets_slide,
     "引用/金句"→quote_slide, "图片页"→image_slide, "结束页/谢谢"→ending_slide
   - For document (report/manual/brochure):
     "文档标题"→document_title, "章节"→chapter, "正文"→body, "表格"→doc_table,
     "图片"→doc_image, "目录"→toc
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
  // Fetch few-shot examples from memory if available
  let fewShots: MemoryEntry[] | undefined;
  let industry: string | undefined;
  if (opts.memory) {
    // Try to extract industry from input
    const industryMatch = input.match(/(?:行业|产业|领域|工厂|店|品牌|公司|企业|SaaS|B2B|电商|制造|餐饮|教育|医疗|金融|房地产)/);
    industry = industryMatch ? industryMatch[0] : undefined;
    fewShots = opts.memory.getFewShotExamples(input, industry, 2);
  }

  const systemPrompt = buildSystemPrompt(opts.lockFields, opts.existingIR, fewShots);
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

    // Post-compilation: force-restore locked fields from existing IR
    const ir = parsed as IntentIR;
    if (opts.lockFields && opts.lockFields.length > 0 && opts.existingIR) {
      for (const field of opts.lockFields) {
        (ir as unknown as Record<string, unknown>)[field] = (opts.existingIR as unknown as Record<string, unknown>)[field];
      }
    }

    // Record to memory for future few-shot learning
    if (opts.memory && !opts.lockFields) {
      try {
        opts.memory.record({
          nl_input: input.slice(0, 500),
          ir_json: JSON.stringify(ir),
          domain: ir.intent.domain,
          industry: industry || '',
          section_types: ir.layout.map((s) => s.type),
          color_scheme: ir.design.colorScheme,
          tone: ir.design.tone,
          token_input: result.usage?.input || 0,
          token_output: result.usage?.output || 0,
          model: result.model,
        });
      } catch {
        // Memory recording failure shouldn't break compilation
      }
    }

    return { ir, raw: lastRaw, usage: result.usage, model: result.model };
  }

  throw lastError ?? new Error('Compilation failed');
}
