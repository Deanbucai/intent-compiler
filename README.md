# Intent Compiler

> 把模糊的自然语言，编译成 AI Agent 能精确执行的结构化意图。
> Natural Language → Structured Intent IR → Any Output.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/Deanbucai/intent-compiler/actions/workflows/ci.yml/badge.svg)](https://github.com/intent-compiler/intent-compiler/actions)

## 30 秒用起来 · Get Started in 30s

```bash
# 1. 克隆 + 安装 / Clone + install
git clone https://github.com/Deanbucai/intent-compiler.git
cd intent-compiler && npm install

# 2. 设 API Key / Set API key（任选一个 / pick one）
# DeepSeek（国内直接用）
export ANTHROPIC_BASE_URL="https://api.deepseek.com/anthropic"
export ANTHROPIC_AUTH_TOKEN="sk-你的key"

# Claude
export ANTHROPIC_API_KEY="sk-ant-..."

# 3. 试试 / Try it
echo "做一个咖啡店landing page，暖棕色调，hero+3个features+价格表+联系表单" \
  | npx tsx src/cli.ts --render html --output index.html
```

**输出** / **Output**: `index.html` — 浏览器直接打开 / open in browser.

### 接入 Agent · MCP Integration

```bash
# Claude Code / Cursor — 一行接入，Agent 自动调 IR
claude mcp add --transport stdio intent-compiler -- npx tsx src/mcp-server.ts
```

---

## 这是什么 · What This Is

AI 编程工具擅长把 prompt 变成代码。但**把想法变成好的 prompt，仍然 100% 靠人工。** Intent Compiler 补上了这一环——把自由自然语言编译成结构化的 **Intent IR**，任何 Agent 或渲染器都能消费。

AI coding tools are great at turning prompts into code. But **turning ideas into good prompts is still 100% manual.** Intent Compiler bridges that gap — it compiles free-form natural language into a structured Intermediate Representation.

```
模糊想法 / Human Idea
      │
      ▼
┌─────────────────────┐
│  Intent Compiler    │  NL → IR
│  编译成结构化意图     │
└─────────┬───────────┘
          │  Intent IR (JSON)
          ▼
┌─────────────────────┐
│  Any Renderer       │  IR → HTML / React / MD / Slide / Document
│  任意渲染器          │
└─────────┬───────────┘
          │
          ▼
     最终产物 / Final Output
```

### 为什么 · Why

**问题 / Problem**: 所有人都让 AI 直接生成代码。但自然语言太模糊——用户写得含糊 → AI 猜 → 输出不一致、丢内容、跑偏。

Everyone generates code directly from NL. But NL is fuzzy → agents guess → output is inconsistent.

**解法 / Solution**: 在生成代码之前，先把自然语言编译成结构化意图。就像传统编译器：源代码 → AST → 机器码。Intent Compiler 做的事：自然语言 → Intent IR → 任意输出。

Compile NL into structured intent BEFORE code generation — just like source code → AST → machine code.

### 效果 · Proven

| 指标 | 直接用 NL | 用 IR | 提升 |
|------|----------|-------|------|
| Section 遗漏率 | 17% | 0% | -100% |
| 内容缩水率 | 60% | 0% | -100% |
| 配色漂移 | 随意 | 精确匹配 | — |

[详细实验报告](EXPERIMENT.md)

---

## 全部命令 · All Commands

| 命令 | 说明 |
|------|------|
| `intentc init [dir]` | 交互式脚手架 — 生成 ir.json + CLAUDE.md / Scaffold project |
| `intentc --render html\|react\|markdown\|slide\|document` | NL → 五种输出 / 5 output formats |
| `intentc translate ir.json en-US\|ru-RU` | 翻译 IR 内容 / Translate IR content |
| `intentc diff a.json b.json` | 对比两个版本 / Diff two IRs |
| `intentc play` | 浏览器 IR 编辑器 / Visual editor |
| `intentc bench "描述"` | 质量评分 (100分制) / Quality benchmark |
| `intentc site init\|build [dir]` | 多页面站点 / Multi-page site |
| `intentc template list` | 内置模板 / Built-in templates |
| `intentc memory stats` | 学习记忆统计 / Memory statistics |
| `intentc renderer list` | 已注册渲染器 / Registered renderers |

### MCP 工具 · MCP Tools

`compile_intent` `render_format` `diff_ir` `translate_ir` `list_templates` `list_renderers`

### API

```ts
import { compile, renderHTML } from 'intent-compiler';

const { ir } = await compile('Landing page for a SaaS product. Hero + features + pricing.');
console.log(ir.design.colorScheme);  // "light-blue"
const html = renderHTML(ir);
```

### 支持的 API Key · Supported API Keys

```bash
export ANTHROPIC_API_KEY="sk-ant-..."                          # Claude
export OPENAI_API_KEY="sk-..."                                 # GPT / Kimi / 通义
export ANTHROPIC_BASE_URL="https://api.deepseek.com/anthropic" # DeepSeek
export ANTHROPIC_AUTH_TOKEN="sk-..."                           # DeepSeek
```

---

## Intent IR Schema

IR 是一个 JSON 文档，四个顶层字段。A JSON document with four top-level sections.

```jsonc
{
  "$schema": "https://intent-compiler.dev/schema/v0.1.0",
  "version": "0.1.0",

  "intent": {                                 // 意图 / What this is
    "domain": "web_page",
    "type": "landing",
    "industry": "manufacturing",
    "language": "zh-CN",
    "summary": "B2B toothbrush factory showcase"
  },

  "design": {                                 // 设计 / Visual system
    "colorScheme": "dark-gold",
    "tone": "professional-industrial",
    "typography": "modern-sans",
    "responsive": true
  },

  "layout": [                                 // 布局 / Sections
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

  "constraints": {                            // 约束 / Constraints
    "maxSections": 8,
    "budgetTier": "standard"
  }
}
```

### Section 类型 · Section Types

| Type | 用途 / Purpose | Content |
|------|---------------|---------|
| `hero` | 首屏大图 / Hero banner | `{ headline, subheadline?, cta? }` |
| `features` | 特点展示 / Feature grid | `{ title?, items: [{ icon?, title, description }] }` |
| `specs` | 技术规格 / Specs grid | `{ title?, items: [{ label, value }], columns? }` |
| `pricing` | 价格表 / Pricing table | `{ title?, items: [{ name, price, features?, highlighted? }] }` |
| `gallery` | 图片展示 / Image gallery | `{ title?, images: [{ src, alt, caption? }] }` |
| `cta` | 行动号召 / Call to action | `{ headline?, buttonText, buttonAction }` |
| `testimonials` | 客户评价 / Testimonials | `{ title?, items: [{ quote, name, role? }] }` |
| `faq` | 常见问题 / FAQ accordion | `{ title?, items: [{ question, answer }] }` |
| `contact_form` | 联系表单 / Contact form | `{ title?, fields: [{ name, label, type, required? }] }` |
| `trust_badges` | 认证标志 / Trust badges | `{ title?, badges: [{ name, icon? }] }` |
| `footer` | 页脚 / Footer | `{ brandName?, links?, copyright? }` |
| `custom` | 自定义 / Custom | `{ component, props? }` |

---

## 写一个渲染器 · Write a Renderer

IR 不绑定渲染器。任何人都能写一个——实现 `{ meta, render }` 接口，放到 `renderers/` 目录。

The IR is renderer-agnostic. Anyone can write one — implement `{ meta, render }`, drop it in `renderers/`.

```ts
import type { IntentIR } from 'intent-compiler';

export const meta = { id: 'my-renderer', name: 'My Renderer', description: '...', domain: '*', outputFormat: 'html', version: '1.0.0' };
export function render(ir: IntentIR): string {
  return ir.layout.sort((a,b) => a.priority - b.priority).map(s => `<section>${s.type}</section>`).join('');
}
```

内置渲染器 / Built-in: HTML, React, Markdown, Slide Deck, Document. 扩展 / Extend: [renderer registry](src/renderers/registry.ts).

---

## 项目结构 · Project Structure

```
intent-compiler/
├── src/
│   ├── index.ts / schema.ts / compiler.ts / cli.ts / mcp-server.ts
│   ├── ir-memory.ts (SQLite 记忆学习) / site.ts (多页面)
│   ├── providers/ (Anthropic + OpenAI)
│   ├── renderers/ (HTML / React / Markdown / Slide / Document / registry)
│   ├── playground/ (IR 可视化编辑器)
│   └── __tests__/ (15 单元测试)
├── examples/ (DR.Warm + 外部渲染器示例)
├── .github/workflows/ (CI + release-please)
└── docs: CHANGELOG / DEVLOG / ROADMAP / CONTRIBUTING / EXPERIMENT / MCP_SETUP / CLAUDE / AGENTS
```

---

## 路线图 + 贡献 · Roadmap + Contributing

- [ROADMAP.md](ROADMAP.md) — 版本历史 + 未来计划 / Version history + upcoming plans
- [CHANGELOG.md](CHANGELOG.md) — 每版变更 / Per-version changes
- [CONTRIBUTING.md](CONTRIBUTING.md) — 如何参与 / How to contribute
- [EXPERIMENT.md](EXPERIMENT.md) — IR 效果对照实验 / Controlled experiment data

**当前版本 / Current**: v0.0.10 — 10 个 GitHub Release, 6 MCP 工具, 3 领域, 5 渲染器, 记忆学习, bench 质量评分, 多页面站点.

---

## License

MIT — 随便用，保留声明。Do what you want, just keep the notice.
