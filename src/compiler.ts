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
  /** Skip response cache — force a fresh LLM call */
  skipCache?: boolean;
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
  /** Whether this was a cache hit */
  cached?: boolean;
}

/**
 * Streaming event emitted during compilation.
 */
export type StreamEvent =
  | { type: 'start'; model: string }
  | { type: 'token'; text: string }
  | { type: 'progress'; message: string }
  | { type: 'complete'; ir: IntentIR; usage: { input: number; output: number } }
  | { type: 'error'; message: string };

// ═══════════════════════════════════════════════════════════════
// Optimization 1: Response Cache (LRU, 5-min TTL)
// ═══════════════════════════════════════════════════════════════

interface CacheEntry {
  ir: IntentIR;
  raw: string;
  usage: { input: number; output: number };
  model: string;
  at: number;
}

const responseCache = new Map<string, CacheEntry>();
const CACHE_MAX = 50;
const CACHE_TTL = 5 * 60 * 1000; // 5 min — aligns with DeepSeek prefix cache TTL

function cacheKey(input: string, opts: CompileOptions): string {
  // Hash based on NL input + lock fields (exclude model/provider to maximize hits)
  const lockTag = (opts.lockFields || []).sort().join(',');
  return `${input.slice(0, 300)}|lock:${lockTag}`;
}

function cacheGet(key: string): CacheEntry | undefined {
  const entry = responseCache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.at > CACHE_TTL) {
    responseCache.delete(key);
    return undefined;
  }
  return entry;
}

function cacheSet(key: string, entry: CacheEntry): void {
  // LRU eviction
  if (responseCache.size >= CACHE_MAX) {
    const oldest = [...responseCache.entries()].sort((a, b) => a[1].at - b[1].at)[0];
    if (oldest) responseCache.delete(oldest[0]);
  }
  responseCache.set(key, entry);
}

// ═══════════════════════════════════════════════════════════════
// Optimization 2: Minified Schema (reduces ~500 tokens vs pretty-print)
// ═══════════════════════════════════════════════════════════════

/** JSON Schema compacted for prompt injection — no descriptions, no whitespace bloat. */
let _compactSchema: string | null = null;
function getCompactSchema(): string {
  if (_compactSchema) return _compactSchema;
  // Deep-clone and strip all "description" fields to save tokens
  const stripped = JSON.parse(JSON.stringify(INTENT_IR_SCHEMA));
  function strip(obj: Record<string, unknown>): void {
    if (!obj || typeof obj !== 'object') return;
    delete obj.description;
    for (const v of Object.values(obj)) {
      if (typeof v === 'object' && v !== null) strip(v as Record<string, unknown>);
    }
  }
  strip(stripped);
  _compactSchema = JSON.stringify(stripped);
  return _compactSchema;
}

// ═══════════════════════════════════════════════════════════════
// Optimization 3: Prompt Reorder for Prefix Caching
// ═══════════════════════════════════════════════════════════════
//
// DeepSeek (and Anthropic) use automatic prefix caching. The prefix
// must be byte-identical across calls. So FIXED content (rules,
// schema, example) goes FIRST. VARIABLE content (few-shot, feedback,
// lock instructions) goes LAST — after the 1024+ token fixed prefix
// is cached.
//
// Structure: [FIXED ~2500 tokens] [VARIABLE ~500 tokens]

function buildSystemPrompt(
  lockedFields?: string[],
  existingIR?: Partial<IntentIR>,
  fewShots?: MemoryEntry[],
  feedback?: string[]
): string {
  const schemaStr = getCompactSchema();

  // ── Variable blocks (appended AFTER fixed prefix) ──

  let variableBlocks = '';

  if (lockedFields && lockedFields.length > 0 && existingIR) {
    const lockedData: Record<string, unknown> = {};
    for (const f of lockedFields) {
      if (f in existingIR) lockedData[f] = (existingIR as Record<string, unknown>)[f];
    }
    variableBlocks += `
## LOCKED FIELDS — DO NOT MODIFY
The following fields are LOCKED and MUST be preserved exactly as-is. Only generate the UNLOCKED fields.
\`\`\`json
${JSON.stringify(lockedData)}
\`\`\``;
  }

  if (feedback && feedback.length > 0) {
    variableBlocks += `
## FEEDBACK — Fix These Past Errors
${feedback.map(f => `- ${f}`).join('\n')}`;
  }

  if (fewShots && fewShots.length > 0) {
    // Compact few-shots: only IR snippet, no NL input duplication
    const examples = fewShots.map((m, i) => {
      const ir = JSON.parse(m.ir_json);
      // Only include the layout + design — the most relevant parts
      const compact = { design: ir.design, layout: ir.layout.slice(0, 4) };
      return `Ex${i + 1} [${m.industry || '?'}]: ${JSON.stringify(compact)}`;
    }).join('\n');
    variableBlocks += `
## FEW-SHOT PATTERNS
${examples}`;
  }

  // ── Fixed prefix (MUST stay byte-identical for cache hits) ──

  const fixedPrefix = `You are a compiler frontend. Output Intent IR JSON for the given natural language description.

## ANTI-ERROR RULES
1. NO OMISSION: every mentioned section type MUST be in output.
2. NO SHRINKAGE: "6项"→6 items, "5条"→5 items, "3个"→3 items. Exact count.
3. NO DRIFT: map color/style words precisely. "深灰工业风"→dark-industrial-gray, not gray.

## RULES
1. Output ONLY valid JSON — no markdown, no code fences, no explanation.
2. Infer defaults: no color→light corporate / dark luxury. no typo→modern-sans. Chinese input→zh-CN.
3. Section type mapping (keyword → type):
   web_page: 头部/hero→hero, 特点/features→features, 规格/specs→specs, 问答/FAQ→faq, 联系/form→contact_form, 认证/badges→trust_badges, 价格/pricing→pricing, 图集/gallery→gallery, CTA→cta, 评价/testimonials→testimonials, 底部/footer→footer
   slide_deck: 封面→title_slide, 内容→content_slide, 要点→bullets_slide, 引用→quote_slide, 图片→image_slide, 结束→ending_slide
   document: 标题→document_title, 章节→chapter, 正文→body, 表格→doc_table, 图片→doc_image, 目录→toc
   ecommerce: 产品→product_description, 邮件→marketing_email, 社交→social_post, SEO→seo_meta, 品牌→brand_story
   business_report: 摘要→executive_summary, 差异→variance_analysis, KPI→kpi_table, 建议→recommendations
   unmatched→custom
4. Priority: first mentioned=10, second=20, third=30...
5. Headlines <50 chars, descriptions <200 chars.
6. summary = one sentence describing the page purpose.

## SCHEMA
\`\`\`json
${schemaStr}
\`\`\`

## EXAMPLE
Input: "做一个SaaS landing，蓝色调，hero+3 features+contact form"
Output: {"$schema":"https://intent-compiler.dev/schema/v0.1.0","version":"0.1.0","intent":{"domain":"web_page","type":"landing","industry":"saas","language":"en-US","summary":"SaaS product landing page with features and contact form"},"design":{"colorScheme":"blue-light","tone":"professional","typography":"modern-sans","responsive":true},"layout":[{"id":"hero","type":"hero","priority":10,"content":{"headline":"Streamline Your Workflow","subheadline":"The all-in-one platform for modern teams.","cta":{"text":"Get Started Free","action":"signup"}}},{"id":"features","type":"features","priority":20,"content":{"title":"Why Choose Us","items":[{"title":"Fast","description":"Lightning-fast performance."},{"title":"Secure","description":"Enterprise-grade security."},{"title":"Simple","description":"Intuitive interface."}]}},{"id":"contact","type":"contact_form","priority":30,"content":{"title":"Get in Touch","fields":[{"name":"name","label":"Name","type":"text","required":true},{"name":"email","label":"Email","type":"email","required":true},{"name":"message","label":"Message","type":"textarea"}]}}]}`;

  return fixedPrefix + '\n' + variableBlocks;
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
 * Optimizations:
 * - Response cache (5-min TTL, LRU eviction) — instant return on cache hit
 * - Prefix-cache-friendly prompt ordering (fixed prefix first)
 * - Compact schema (strips descriptions to save ~500 tokens)
 * - Few-shot compressed to essential pattern data
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
  // ── Check response cache ──
  if (!opts.skipCache && !opts.lockFields?.length) {
    const key = cacheKey(input, opts);
    const hit = cacheGet(key);
    if (hit) {
      return { ir: hit.ir, raw: hit.raw, usage: hit.usage, model: hit.model, cached: true };
    }
  }

  // Fetch few-shot examples from memory if available
  let fewShots: MemoryEntry[] | undefined;
  let industry: string | undefined;
  let feedback: string[] = [];
  if (opts.memory) {
    const industryMatch = input.match(/(?:行业|产业|领域|工厂|店|品牌|公司|企业|SaaS|B2B|电商|制造|餐饮|教育|医疗|金融|房地产|科技|建筑|时尚)/);
    industry = industryMatch ? industryMatch[0] : undefined;
    fewShots = opts.memory.getFewShotExamples(input, industry, 2);
    if (industry) {
      feedback = opts.memory.getFeedbackForIndustry(industry);
    }
  }

  // ── Optimization: token budget scaled to expected complexity ──
  const estimatedSections = (input.match(/(?:hero|features|specs|faq|contact|pricing|gallery|cta|testimonials|footer|trust_badges|slide|title|custom|summary|analysis|kpi|recommendations|description|email|social|seo|brand|story)/gi) || []).length;
  const tokenBudget = opts.providerOpts?.maxTokens
    || (estimatedSections <= 4 ? 2048 : estimatedSections <= 7 ? 3072 : 4096);

  const systemPrompt = buildSystemPrompt(opts.lockFields, opts.existingIR, fewShots, feedback);
  const maxRetries = opts.maxRetries ?? 2;

  let lastError: Error | null = null;
  let lastRaw = '';

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let result;
    const callOpts = { ...opts.providerOpts, maxTokens: tokenBudget };
    if (opts.provider === 'openai') {
      result = await callOpenAI(systemPrompt, input, callOpts);
    } else {
      result = await callAnthropic(systemPrompt, input, callOpts);
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
          quality_score: 0,
        });
      } catch {
        // Memory recording failure shouldn't break compilation
      }
    }

    // ── Cache successful result ──
    const cacheEntry: CacheEntry = {
      ir,
      raw: lastRaw,
      usage: result.usage || { input: 0, output: 0 },
      model: result.model,
      at: Date.now(),
    };
    cacheSet(cacheKey(input, opts), cacheEntry);

    return { ir, raw: lastRaw, usage: result.usage, model: result.model, cached: false };
  }

  throw lastError ?? new Error('Compilation failed');
}

/**
 * Streaming compile — yields events as the LLM generates.
 * Uses the same optimized prompt structure as compile().
 * Note: streaming results are NOT cached (cache is for exact-match only).
 */
export async function* compileStream(
  input: string,
  opts: CompileOptions = {}
): AsyncGenerator<StreamEvent> {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not found');

  const Anthropic = await import('@anthropic-ai/sdk');
  const client = new Anthropic.default({
    apiKey,
    baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
  });

  const systemPrompt = buildSystemPrompt(opts.lockFields, opts.existingIR);
  const model = opts.providerOpts?.model || process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

  // Token budget: same as compile — scale to expected complexity
  const estimatedSections = (input.match(/(?:hero|features|specs|faq|contact|pricing|gallery|cta|testimonials|footer|trust_badges|slide|title|custom|summary|analysis|kpi|recommendations|description|email|social|seo|brand|story)/gi) || []).length;
  const tokenBudget = opts.providerOpts?.maxTokens
    || (estimatedSections <= 4 ? 2048 : estimatedSections <= 7 ? 3072 : 4096);

  yield { type: 'start', model };

  const stream = client.messages.stream({
    model,
    max_tokens: tokenBudget,
    system: systemPrompt,
    messages: [{ role: 'user', content: input }],
  });

  let fullText = '';

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && 'text' in event.delta) {
      fullText += event.delta.text;
      yield { type: 'token', text: event.delta.text };
    }
  }

  const final = await stream.finalMessage();
  const text = (final.content as Array<{ type: string; text?: string }>)
    .filter((block) => block.type === 'text')
    .map((block) => block.text || '')
    .join('');

  // Parse and validate
  try {
    const jsonStr = extractJSON(text);
    const parsed = JSON.parse(jsonStr);

    if (validateIR(parsed)) {
      const ir = parsed as IntentIR;
      if (opts.lockFields && opts.lockFields.length > 0 && opts.existingIR) {
        for (const field of opts.lockFields) {
          (ir as unknown as Record<string, unknown>)[field] = (opts.existingIR as unknown as Record<string, unknown>)[field];
        }
      }
      yield {
        type: 'complete',
        ir,
        usage: { input: final.usage.input_tokens, output: final.usage.output_tokens },
      };
    } else {
      const errors = validateIR.errors?.map((e) => `${e.instancePath} ${e.message}`).join('; ');
      yield { type: 'error', message: `IR validation failed: ${errors}` };
    }
  } catch (e: unknown) {
    yield { type: 'error', message: `Parse failed: ${e instanceof Error ? e.message : String(e)}` };
  }
}
