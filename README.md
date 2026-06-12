# Intent Compiler

> **The LLVM for vibe coding.** Natural Language → Structured Intent IR → Any Output.
> 把模糊的自然语言，编译成 AI Agent 能精确执行的结构化意图。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/Deanbucai/intent-compiler/actions/workflows/ci.yml/badge.svg)](https://github.com/intent-compiler/intent-compiler/actions)
[![tested with tsx](https://img.shields.io/badge/tested%20with-tsx-blue)](https://github.com/privatenumber/tsx)

AI coding tools are great at turning prompts into code. But **turning ideas into good prompts is still 100% manual.** Intent Compiler bridges that gap — it compiles free-form natural language into a structured **Intent IR** (Intermediate Representation) that any agent, renderer, or tool can consume.

```
Human Idea (模糊想法)
      │
      ▼
┌─────────────────────┐
│  Intent Compiler    │  ← You are here
│  NL → Intent IR     │
└─────────┬───────────┘
          │  Structured JSON
          ▼
┌─────────────────────┐
│  Any Renderer       │  ← Write your own
│  IR → HTML/React/.. │
└─────────┬───────────┘
          │
          ▼
     Final Output
```

## Why This Exists

### The Problem

Everyone is building AI agents that generate code. But they all face the same bottleneck: **natural language is too fuzzy for reliable code generation.** Users write vague prompts → agents guess → output is inconsistent.

### The Solution

**Compile natural language into structured intent BEFORE code generation.**

This is exactly what compilers do: source code → AST → machine code. Intent Compiler does the same for AI-driven creation:

```
Source Code → AST → Machine Code     (traditional compiler)
Natural Lang → Intent IR → Any Output  (intent compiler)
```

## Quick Start

### 中文用户 · 一行命令

```bash
# 1. 安装
git clone https://github.com/Deanbucai/intent-compiler.git
cd intent-compiler && npm install

# 2. 设 API Key (DeepSeek — 国内可用)
export ANTHROPIC_BASE_URL="https://api.deepseek.com/anthropic"
export ANTHROPIC_AUTH_TOKEN="sk-你的key"

# 3. 试试
echo "做一个咖啡店官网，暖棕色调，hero+3个特点+价格表+联系表单" | npx tsx src/cli.ts --render html --output coffee.html
```

### Install

```bash
npm install intent-compiler
```

### CLI

```bash
# Compile to IR JSON
echo "Build a SaaS landing page with hero and 3 features" | npx intentc

# Compile and render to HTML
echo "做一个牙刷工厂B2B官网，深色金色调，hero+技术规格+FAQ+联系表单" \
  | npx intentc --render html --output page.html

# Translate to English / Russian
intentc translate page-ir.json en-US
intentc translate page-ir.json ru-RU

# Diff two versions
intentc diff v1.json v2.json

# Launch visual editor
intentc play

# List templates
intentc template list
```

### MCP Server (Agent Integration)

```bash
# Claude Code
claude mcp add --transport stdio intent-compiler -- npx tsx src/mcp-server.ts

# Cursor — add to .cursor/mcp.json:
# {"mcpServers":{"intent-compiler":{"type":"stdio","command":"npx","args":["tsx","src/mcp-server.ts"]}}}
```

Then in any agent session: `compile_intent`, `render_format`, `translate_ir`, `diff_ir`, `list_renderers`.

### API

```ts
import { compile, renderHTML } from 'intent-compiler';

const { ir } = await compile(
  'A dark-themed landing page for a toothbrush factory. Hero + specs + FAQ + contact form.'
);

console.log(ir.design.colorScheme);      // "dark-gold"
console.log(ir.layout.length);           // 4
const html = renderHTML(ir);
```

### Environment

Supports Anthropic or OpenAI-compatible providers:

```bash
export ANTHROPIC_API_KEY="sk-..."    # Claude
export OPENAI_API_KEY="sk-..."       # GPT / DeepSeek / Kimi
```

**DeepSeek users:** set `ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic` — it's Anthropic-compatible!

## Intent IR Schema (v0.1.0)

The Intent IR is a **JSON document** with four top-level sections:

```jsonc
{
  "$schema": "https://intent-compiler.dev/schema/v0.1.0",
  "version": "0.1.0",

  // What this page is about
  "intent": {
    "domain": "web_page",
    "type": "landing",
    "industry": "manufacturing",
    "language": "zh-CN",
    "summary": "B2B toothbrush factory showcase"
  },

  // Visual design system
  "design": {
    "colorScheme": "dark-gold",
    "tone": "professional-industrial",
    "typography": "modern-sans",
    "responsive": true
  },

  // Ordered sections
  "layout": [
    {
      "id": "hero",
      "type": "hero",
      "priority": 10,
      "content": {
        "headline": "Premium Toothbrush Manufacturer",
        "subheadline": "20 years experience · Export to 30+ countries",
        "cta": { "text": "Get Quote", "action": "contact" }
      }
    }
  ],

  // Optional constraints
  "constraints": {
    "maxSections": 8,
    "budgetTier": "standard"
  }
}
```

### Supported Section Types (v0.1.0)

| Type | Description | Content Shape |
|------|-------------|---------------|
| `hero` | Hero banner with headline + CTA | `{ headline, subheadline?, cta?, background? }` |
| `features` | Feature highlights grid | `{ title?, items: [{ icon?, title, description }] }` |
| `specs` | Technical specifications grid | `{ title?, items: [{ label, value, icon? }], columns? }` |
| `faq` | Accordion FAQ section | `{ title?, items: [{ question, answer }] }` |
| `contact_form` | Contact/inquiry form | `{ title?, subtitle?, fields: [{ name, label, type, required? }] }` |
| `trust_badges` | Certification/partner badges | `{ title?, badges: [{ name, icon? }] }` |
| `footer` | Page footer | `{ brandName?, links?, copyright? }` |
| `custom` | Custom component | `{ component, props? }` |

## Writing a Renderer

The IR is renderer-agnostic. Write your own in ~50 lines:

```ts
import type { IntentIR } from 'intent-compiler';

function renderMyWay(ir: IntentIR): string {
  return ir.layout
    .sort((a, b) => a.priority - b.priority)
    .map(section => {
      switch (section.type) {
        case 'hero':    return `<header><h1>${section.content.headline}</h1></header>`;
        case 'features': return `<section>...</section>`;
        // ... handle each type
      }
    })
    .join('\n');
}
```

Planned future renderers: React, Vue, PDF, Markdown, Slide Deck, Email.

## Project Structure

```
intent-compiler/
├── src/
│   ├── index.ts           # Public API
│   ├── schema.ts          # IR types + JSON Schema
│   ├── compiler.ts        # NL → IR compiler (prompt + validate)
│   ├── cli.ts             # CLI tool
│   ├── providers/
│   │   ├── anthropic.ts   # Claude / DeepSeek / OpenRouter
│   │   └── openai.ts      # GPT / DeepSeek / Kimi
│   └── renderers/
│       └── html.ts        # IR → standalone HTML
├── examples/
│   └── drwarm.ts          # Real B2B manufacturing site
├── package.json
├── tsconfig.json
├── LICENSE                # MIT
└── README.md
```

## Roadmap

### v0.1.0 ✅ Now
- [x] Web page domain IR schema
- [x] Anthropic + OpenAI provider support
- [x] Reference HTML renderer (8 section types, zero JS dependency)
- [x] CLI + API

### v0.2.0 (Planned)
- [ ] Domain extension: documents, slides, emails
- [ ] Streaming compilation
- [ ] `intentc init` project scaffolding
- [ ] Renderer: React components

### v1.0.0 (Vision)
- [ ] Multi-domain IR standard (web, doc, app, data)
- [ ] Community renderer registry
- [ ] Plugin system for custom section types
- [ ] AGENTS.md / CLAUDE.md auto-generation from IR

## Contributing

This is a v0.1.0 — rough edges expected. Open an issue or PR.

1. **Found a bug?** Open an issue with the NL input and expected output.
2. **Want a new section type?** Propose it with the content shape.
3. **Built a renderer?** We'd love to link it here.
4. **Want to extend the IR to a new domain?** Let's discuss.

## License

MIT — do what you want, just keep the notice.

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
