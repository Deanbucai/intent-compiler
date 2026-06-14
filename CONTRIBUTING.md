# Contributing to Intent Compiler

Thanks for your interest! Here's how to contribute.

## Quick Start

```bash
git clone https://github.com/intent-compiler/intent-compiler.git
cd intent-compiler
npm install
npx tsc --noEmit          # Type check
npx tsx src/cli.ts --help  # Test CLI
```

Set your API key:
```bash
export ANTHROPIC_API_KEY="sk-..."  # Claude
# or DeepSeek:
export ANTHROPIC_BASE_URL="https://api.deepseek.com/anthropic"
export ANTHROPIC_AUTH_TOKEN="sk-..."
```

## What to Work On

### Good First Issues
- **Add a new section type**: Define the content shape in `src/schema.ts`, add a renderer in `src/renderers/html.ts`, update the JSON Schema enum.
- **Improve a renderer**: The built-in HTML renderer is minimal. Better styling, accessibility, or responsive design are all welcome.
- **Translate IR docs**: Help translate the README and schema docs to more languages.

### Major Contributions
- **Write a new renderer**: `{ meta: RendererMeta, render: (ir: IntentIR) => string }`. Drop it in `examples/renderers/` as a demo, or propose adding it as built-in.
- **Add a new domain**: Extend `SectionType` with domain-specific types, write a renderer, update the compiler prompt.
- **Add an LLM provider**: Implement `src/providers/<name>.ts` following the pattern in `anthropic.ts`.

## Architecture

```
src/
├── schema.ts          # The IR — source of truth
├── compiler.ts        # NL → IR (prompt + validate)
├── cli.ts             # CLI tool
├── mcp-server.ts      # MCP server (STDIO transport)
├── providers/         # LLM adapters (add new ones here)
├── renderers/
│   ├── registry.ts    # Renderer plugin system
│   ├── html.ts        # Built-in: HTML page
│   ├── react.ts       # Built-in: React components
│   ├── markdown.ts    # Built-in: Markdown doc
│   ├── slide.ts       # Built-in: Slide deck
│   └── document.ts    # Built-in: Document/report
└── playground/
    └── index.html     # IR Playground
```

## Development Rules

所有规则来自筑安 Agent 内化知识体系（10轮学习 × 204知识点 × 第一性原理 × Naval哲学）。

### 动手前自检（Pre-Task Checklist）

**任何写代码/改代码之前，必须先过这4条。不过完不动手。**

1. **这是垂直切片吗？** 改的功能 = 前后端+验证，三者齐全？只写后端没前端 → 停下。只写前端没接后端 → 停下。
2. **这是一件事吗？** 改完→3分钟内验证→知道对不对？需要改3个以上文件 → 拆。5分钟验证不完 → 范围太大。
3. **验证三件套准备好了吗？** 改完能立刻跑：编译检查 / API测试 / 浏览器确认？不行 → 先搭验证环境。
4. **改完能立刻commit吗？** 代码可运行、可部署？需要等别的改动一起 → 拆开。

改完后强制：`tsc --noEmit` + `npm test` + 浏览器确认 + git commit + DEVLOG。

### 禁止盲试铁律

1. 每个改动必须验证。改一行验证一行。
2. 修bug前先诊断：确认当前状态 → 复现 → 定位根因 → 单点修复 → 验证。
3. 连续2次失败 → 停，诊断，不继续改。
4. 先搜后做：涉及领域知识/外部服务/设计决策/竞品参考 → 必须先 WebSearch 再动手。

### 精英开发者习惯

1. **原子提交** — 每个commit可独立构建，不含破坏性改动。
2. **main始终可部署** — 不在main上做实验。
3. **每次只改一处** — 不接受big-bang改动。改onclick就别动CSS，加功能就别重构。
4. **AI生成=必须review** — 每处diff人工过。
5. **验证是AI的责任，判断是你的责任** — AI跑测试，人判断对不对。
6. **TypeScript**: `npx tsc --noEmit` + `npm test` 必须通过才能commit。

## Commit Convention

```
<type>: <description>

Examples:
  feat: add pricing section type
  fix: slide renderer null body crash
  docs: update README with MCP setup
  renderer: new pdf-brochure example
```

## Pull Requests

1. Fork → branch → change → test → PR
2. Keep PRs small — one feature or fix per PR
3. Include a test or verification screenshot
4. Update DEVLOG.md in your PR

## License

MIT. By contributing, you agree to license your work under MIT.
