#!/usr/bin/env node
/**
 * Intent Compiler MCP Server
 *
 * Exposes the intent-compiler as Model Context Protocol tools that any
 * MCP-compatible agent (Claude Code, Cursor, Copilot, etc.) can call.
 *
 * Tools exposed:
 *   compile_intent  — NL → structured Intent IR
 *   render_format   — IR → HTML/React/Markdown/Slide/Document
 *   diff_ir         — Compare two IR files
 *   translate_ir    — Translate IR content to another language
 *
 * Usage:
 *   claude mcp add --transport stdio intent-compiler -- npx tsx src/mcp-server.ts
 *   claude mcp add --transport stdio intent-compiler -- node dist/mcp-server.js
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod/v3';
import { readFileSync, writeFileSync } from 'fs';
import { registry, registerBuiltins } from './renderers/registry';
import { IRMemory } from './ir-memory';
// Register built-in renderers at startup
registerBuiltins();
const memory = new IRMemory();

// Register built-in renderers at startup
registerBuiltins();

// Dynamic imports for the compiler core (avoid circular deps)
async function getCompiler() {
  return await import('./compiler');
}

// ─── Server Setup ────────────────────────────────────────────────

const server = new McpServer({
  name: 'intent-compiler',
  version: '0.0.5',
});

// ─── Tool: compile_intent ────────────────────────────────────────

server.registerTool(
  'compile_intent',
  {
    title: 'Compile Natural Language to Intent IR',
    description:
      'Convert natural language descriptions (of web pages, slide decks, or documents) into structured Intent IR JSON. ' +
      'Use this BEFORE generating code — the IR ensures structural consistency. ' +
      'The IR can then be rendered to HTML, React, Markdown, slides, or documents.',
    inputSchema: {
      input: z
        .string()
        .describe(
          'Natural language description of what to build. Any language. Be specific about sections, colors, and tone.'
        ),
      domain: z
        .enum(['web_page', 'slide_deck', 'document'])
        .optional()
        .default('web_page')
        .describe('Target domain: web_page (default), slide_deck, or document'),
      lock_design: z
        .boolean()
        .optional()
        .default(false)
        .describe('If true, preserve the design system from existing_ir_json'),
      existing_ir_json: z
        .string()
        .optional()
        .describe('Existing IR JSON string to preserve locked fields from (required if lock_design is true)'),
    },
  },
  async ({ input, domain, lock_design, existing_ir_json }) => {
    const { compile } = await getCompiler();
    const opts: Record<string, unknown> = {};
    if (lock_design && existing_ir_json) {
      opts.lockFields = ['design'];
      opts.existingIR = JSON.parse(existing_ir_json);
    }

    const result = await compile(
      `${input}\n\nTarget domain: ${domain}`,
      { ...opts, memory } as any
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              ir: result.ir,
              model: result.model,
              sections: result.ir.layout.length,
              domain: result.ir.intent.domain,
              design: result.ir.design,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ─── Tool: render_format ─────────────────────────────────────────

server.registerTool(
  'render_format',
  {
    title: 'Render Intent IR to Output Format',
    description:
      'Render a structured Intent IR to a specific output format. ' +
      'Supports: html, react, markdown, slide, document. ' +
      'Use this to turn compiled IR into actual usable output.',
    inputSchema: {
      ir_json: z
        .string()
        .describe('The Intent IR JSON string to render'),
      format: z
        .enum(['html', 'react', 'markdown', 'slide', 'document'])
        .describe('Output format'),
      output_path: z
        .string()
        .optional()
        .describe('File path to write output to (writes to disk if provided)'),
    },
  },
  async ({ ir_json, format, output_path }) => {
    const ir = JSON.parse(ir_json);

    // Look up the renderer from the registry
    const formatToRendererId: Record<string, string> = {
      html: 'html', react: 'react', markdown: 'markdown',
      slide: 'slide', document: 'document',
    };
    const rendererId = formatToRendererId[format] || 'html';
    const renderer = registry.get(rendererId);

    if (!renderer) {
      return { content: [{ type: 'text', text: `Renderer "${rendererId}" not found in registry.` }], isError: true };
    }

    const output = renderer.render(ir);

    if (output_path) {
      writeFileSync(output_path, output, 'utf-8');
      return {
        content: [
          {
            type: 'text',
            text: `Rendered ${format} (${output.length} chars) → ${output_path}`,
          },
        ],
      };
    }

    return {
      content: [{ type: 'text', text: output }],
    };
  }
);

// ─── Tool: diff_ir ───────────────────────────────────────────────

server.registerTool(
  'diff_ir',
  {
    title: 'Diff Two Intent IR Files',
    description:
      'Compare two Intent IR files and show what changed: design, sections added/removed, intent changes.',
    inputSchema: {
      path_a: z.string().describe('Path to the first IR JSON file'),
      path_b: z.string().describe('Path to the second IR JSON file'),
    },
  },
  async ({ path_a, path_b }) => {
    const a = JSON.parse(readFileSync(path_a, 'utf-8'));
    const b = JSON.parse(readFileSync(path_b, 'utf-8'));
    const changes: string[] = [];

    if (a.intent?.summary !== b.intent?.summary)
      changes.push(`Summary: "${a.intent?.summary}" → "${b.intent?.summary}"`);
    for (const key of ['colorScheme', 'tone', 'typography'])
      if (a.design?.[key] !== b.design?.[key])
        changes.push(`design.${key}: "${a.design?.[key]}" → "${b.design?.[key]}"`);

    const aIds = new Set((a.layout || []).map((s: any) => s.id));
    const bIds = new Set((b.layout || []).map((s: any) => s.id));
    for (const s of a.layout || []) if (!bIds.has(s.id)) changes.push(`- Removed [${s.type}] ${s.id}`);
    for (const s of b.layout || []) if (!aIds.has(s.id)) changes.push(`+ Added [${s.type}] ${s.id}`);

    return {
      content: [
        {
          type: 'text',
          text: changes.length === 0
            ? 'No changes — IRs are identical.'
            : `${changes.length} change(s):\n` + changes.map((c) => '  ' + c).join('\n'),
        },
      ],
    };
  }
);

// ─── Tool: translate_ir ──────────────────────────────────────────

server.registerTool(
  'translate_ir',
  {
    title: 'Translate Intent IR Content',
    description: 'Translate all text content in an IR to another language (zh-CN, en-US, ru-RU). Preserves design and layout structure.',
    inputSchema: {
      ir_path: z.string().describe('Path to the IR JSON file to translate'),
      target_lang: z
        .enum(['zh-CN', 'en-US', 'ru-RU'])
        .describe('Target language code'),
    },
  },
  async ({ ir_path, target_lang }) => {
    const langNames: Record<string, string> = { 'zh-CN': 'Chinese', 'en-US': 'English', 'ru-RU': 'Russian' };
    const ir = JSON.parse(readFileSync(ir_path, 'utf-8'));
    const { compile } = await getCompiler();

    const result = await compile(
      `Here is an existing Intent IR. Translate ALL text content to ${langNames[target_lang]}. Keep the exact same section types, IDs, priorities, and structure. Only change the text content.\n\nExisting IR:\n\`\`\`json\n${JSON.stringify(ir, null, 2)}\n\`\`\``,
      { lockFields: ['design', 'intent'], existingIR: ir } as any
    );

    result.ir.intent.language = target_lang;

    const outPath = ir_path.replace('.json', `-${target_lang.split('-')[0]}.json`);
    writeFileSync(outPath, JSON.stringify(result.ir, null, 2), 'utf-8');

    return {
      content: [
        {
          type: 'text',
          text: `Translated to ${langNames[target_lang]} → ${outPath} (${result.ir.layout.length} sections)`,
        },
      ],
    };
  }
);

// ─── Tool: list_templates ────────────────────────────────────────

server.registerTool(
  'list_templates',
  {
    title: 'List Intent IR Templates',
    description: 'List available IR templates (landing, saas, portfolio, manufacturing) for quick starting points.',
    inputSchema: {},
  },
  async () => {
    const templates = {
      landing: 'Generic product landing page (hero + features + contact)',
      saas: 'SaaS with pricing (hero + features + pricing + faq + footer)',
      portfolio: 'Creative portfolio (hero + gallery + testimonials + footer)',
      manufacturing: 'B2B factory showcase (hero + specs + faq + contact)',
    };
    return {
      content: [
        {
          type: 'text',
          text: Object.entries(templates)
            .map(([k, v]) => `  ${k.padEnd(16)} ${v}`)
            .join('\n'),
        },
      ],
    };
  }
);

// ─── Tool: list_renderers ────────────────────────────────────────

server.registerTool(
  'list_renderers',
  {
    title: 'List Available Renderers',
    description: 'List all registered renderers (built-in and external). Shows id, domain, output format, and description.',
    inputSchema: {},
  },
  async () => {
    const renderers = registry.list();
    return {
      content: [
        {
          type: 'text',
          text: renderers
            .map((r) => `${r.meta.id.padEnd(16)} [${r.meta.domain} → ${r.meta.outputFormat}] ${r.meta.description}`)
            .join('\n'),
        },
      ],
    };
  }
);

// ─── Start ────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('intent-compiler MCP server v0.0.5 ready (stdio)');
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
