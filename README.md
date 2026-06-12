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

### 第一步：安装 + 初始化项目

```bash
# 安装
git clone https://github.com/Deanbucai/intent-compiler.git
cd intent-compiler && npm install

# 设 API Key (DeepSeek — 国内可用)
export ANTHROPIC_BASE_URL="https://api.deepseek.com/anthropic"
export ANTHROPIC_AUTH_TOKEN="sk-你的key"

# 初始化项目（交互式，4 个问题）
npx tsx src/cli.ts init my-site
```

会问你：做什么类型的项目？什么行业？什么语言？什么配色风格？然后自动生成：

```
my-site/
├── ir.json        ← 项目的结构化意图，可以直接编辑
├── CLAUDE.md      ← Agent 规则，Agent 打开这个目录自动用 IR
└── .env.example   ← API Key 配置模板
```

### 第二步：编译 → 出 HTML

```bash
echo "做一个高端蛋糕店官网，法式轻奢风，hero+gallery+价格表+评价+联系" \
  | npx tsx src/cli.ts --render html --output cake.html
```

### 不想初始化？直接试用

```bash
echo "做一个SaaS landing page，浅蓝色调，hero+3个features+价格表" \
  | npx tsx src/cli.ts --render html --output page.html
```

### 全部 CLI 命令

```bash
intentc init [dir]              # 交互式初始化项目
intentc --render html|react|markdown|slide|document   # NL → 输出
intentc translate ir.json en-US|ru-RU                 # 翻译 IR
intentc diff a.json b.json      # 对比两个版本
intentc play                    # 浏览器 IR 编辑器
intentc template list           # 内置模板
intentc memory stats            # 学习记忆统计
intentc renderer list           # 已注册渲染器
```

### 接入 Agent（MCP）

```bash
# Claude Code — Agent 自动调 IR，用户无感
claude mcp add --transport stdio intent-compiler -- npx tsx src/mcp-server.ts

# Cursor — 加到 .cursor/mcp.json
# {"mcpServers":{"intent-compiler":{"type":"stdio","command":"npx","args":["tsx","src/mcp-server.ts"]}}}
```

接入后，Agent 自动获得 6 个工具：`compile_intent` `render_format` `diff_ir` `translate_ir` `list_templates` `list_renderers`。

### API

```ts
import { compile, renderHTML } from 'intent-compiler';

const { ir } = await compile('Landing page for a SaaS product. Hero + features + pricing.');
console.log(ir.design.colorScheme);  // "light-blue"
const html = renderHTML(ir);
```

### 支持的 API Key

```bash
export ANTHROPIC_API_KEY="sk-ant-..."                          # Claude
export OPENAI_API_KEY="sk-..."                                 # GPT / Kimi / 通义
export ANTHROPIC_BASE_URL="https://api.deepseek.com/anthropic" # DeepSeek
export ANTHROPIC_AUTH_TOKEN="sk-..."                           # DeepSeek
```

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

### Supported Section Types (v0.0.9)

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

Built-in renderers: HTML, React, Markdown, Slide Deck, Document. Extensible via [renderer registry](src/renderers/registry.ts).

## Project Structure

```
intent-compiler/
├── src/
│   ├── index.ts              # Public API
│   ├── schema.ts             # IR types + JSON Schema
│   ├── compiler.ts           # NL → IR (compile + compileStream)
│   ├── cli.ts                # CLI tool
│   ├── mcp-server.ts         # MCP server (STDIO, 6 tools)
│   ├── ir-memory.ts          # SQLite memory (few-shot learning)
│   ├── site.ts               # Multi-page site support
│   ├── providers/            # Anthropic + OpenAI adapters
│   ├── renderers/            # HTML / React / Markdown / Slide / Document / registry
│   ├── playground/           # IR Playground (browser editor)
│   └── __tests__/            # 15 unit tests
├── examples/                 # DR.Warm + external renderer demo
├── .github/workflows/        # CI (tsc + test + build)
└── docs: CHANGELOG, DEVLOG, ROADMAP, CONTRIBUTING, MCP_SETUP, CLAUDE.md, AGENTS.md
```

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the full version history and upcoming plans.

**Current (v0.0.9):** 5 renderers · 6 MCP tools · 3 domains · IR memory with few-shot learning · streaming compile · `intentc init` scaffolding · multi-language (zh-CN/en-US/ru-RU) · multi-page site support.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for architecture overview, development rules, and good first issues.

Quick links: [CHANGELOG.md](CHANGELOG.md) · [DEVLOG.md](DEVLOG.md) · [MCP_SETUP.md](MCP_SETUP.md)

## License

MIT — do what you want, just keep the notice.

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
