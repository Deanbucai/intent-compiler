# Intent Compiler

> **The LLVM for vibe coding.** Natural Language → Structured Intent IR → Any Output.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/intent-compiler)](https://www.npmjs.com/package/intent-compiler)

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

### vs. Existing Projects

| Project | Take NL? | Domain | IR Open? | Renderer Pluggable? |
|---------|----------|--------|----------|---------------------|
| **Intent Compiler** | ✅ Free-form | Agnostic | ✅ | ✅ |
| English Compiler | ⚠️ Pseudocode only | Algorithms | ✅ | ❌ |
| Google A2UI | ❌ (agent→UI) | UI only | ✅ | ✅ |
| AIRL | ❌ | Code | ✅ | — |
| OpenEngine | ✅ | Code | ❌ | ❌ |
| MadeBee | ✅ | React UI | ✅ | ❌ |

**Intent Compiler is the only one that takes free-form NL, is domain-agnostic, and has a pluggable renderer architecture.**

## Quick Start

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
```

### API

```ts
import { compile, renderHTML } from 'intent-compiler';

// Compile natural language to structured Intent IR
const { ir } = await compile(
  'A dark-themed landing page for a toothbrush factory. Hero + specs + FAQ + contact form.'
);

console.log(ir.design.colorScheme);      // "dark-gold"
console.log(ir.layout.length);           // 4

// Render IR to a self-contained HTML page
const html = renderHTML(ir);
```

### Environment

Set your API key — supports Anthropic or OpenAI-compatible providers:

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
