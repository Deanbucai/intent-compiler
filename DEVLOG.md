# Development Log

## 2026-06-12 — v0.1.0 (Concept Proven)

### 背景
基于 v0.1.0 方案：5 个垂直切片，Web 页面领域，MIT 协议。

### 完成
- IR Schema v0.1.0：7 section types (hero/features/specs/faq/contact_form/trust_badges/footer/custom)
- NL → IR 编译器：prompt 模板 + AJV 校验 + 自动重试
- Anthropic/OpenAI 双 provider，支持 DeepSeek baseURL
- HTML 渲染器：8 种 section 渲染器，内联样式，零 JS 依赖
- CLI：管道输入/文件输入/JSON+HTML 输出
- DR.Warm 真实 B2B 制造网站示例
- README：LLVM 类比，IR 文档，快速开始

### 验证
- TypeScript 零错误
- 端到端测试通过（"牙刷工厂B2B官网" → IR JSON → 10KB HTML）
- Playwright 浏览器渲染确认（5 sections 正确展示）

### 教训
- AJV 不支持 draft-2020-12，改 draft-07
- Shell 中文参数需 pipe 输入，直接 positional arg 会截断
- renderContactForm 访问 `meta` 变量不在作用域 → 加 `lang` 参数

### 下一步
v0.2.0 — 多渲染器（React + Markdown）展示 IR 可复用价值

---

## 2026-06-12 — v0.2.0 (Multi-Renderer)

### React Renderer
- 12 种 section type 渲染器（含新增的 pricing/gallery/cta/testimonials）
- 完整 .tsx 输出：imports + typed components + useState hooks + 默认导出
- 样式对象模式（CSS-in-JS），零外部依赖
- 模板字面量嵌套冲突修复（{plan.xxx} → 预处理 cards 字符串）

### Markdown Renderer
- 12 种 section type → 格式化 Markdown
- 自动生成目录（Contents）
- 元数据头部
- 表格（specs）、引用块（testimonials）、图片（gallery）

### Schema 扩展
- 新增 section types: pricing, gallery, cta, testimonials
- 从 8 种扩展到 12 种
- Compiler prompt 同步更新 section 映射规则

### 验证
- 同一份 IR (gym-ir.json) → HTML (7284B) + React (8088B) + Markdown (531B) 三路输出
- 内容一致性确认（5 sections 完全对应）

### IR Diff 工具
- `intentc diff a.json b.json` — 人类可读的变更摘要
- 检测：意图变更、设计变更、section 增删
- 演示"IR 可版本化"——Agent 对话做不到的事

---

## 2026-06-12 — v0.0.3 (IR Playground + Partial Recompilation + Multi-Language)

### IR Playground
- 独立 HTML 页面 (`src/playground/index.html`)
- JSON 编辑器（左）+ 实时预览（右），12 section 类型
- 4 个内置模板：landing/saas/DR.Warm/portfolio
- 拖拽分隔条、复制粘贴、下载 HTML
- `intentc play` 一键启动

### 部分重编译
- `compile(input, { lockFields: ['design'], existingIR })` — 锁定字段后只编译目标
- Prompt 层 + 编译后强制恢复，双重保证
- 验证：lock design → 加 gallery → design 零变化

### 多语言翻译
- `intentc translate ir.json zh-CN|en-US|ru-RU`
- 锁定 design + intent，翻译 layout 文本内容
- Section 结构验证，结构变化时自动恢复
- 实测：中文 "甜蜜时刻，从一口开始" → 英文 "Sweet Moments, Start with a Bite"

### 模板 CLI
- `intentc template list` — 4 个模板
- 模板已内嵌到 playground

---

## 2026-06-12 — v0.0.4 (Multi-Domain: Web + Slide + Document)

### Slide Deck Domain
- 6 种 slide section types: title_slide/content_slide/bullets_slide/quote_slide/image_slide/ending_slide
- `renderSlideDeck(ir)` → 独立 HTML 演示文稿
- 键盘导航（← → Space）、幻灯片计数器、点击翻页
- `--render slide` CLI 支持

### Document Domain
- 7 种 document section types: document_title/chapter/body/doc_table/doc_image/toc
- `renderDocument(ir)` → 打印友好的 HTML 文档
- Serif 字体、自动目录、`@media print` 适配 PDF 导出
- `--render document` CLI 支持

### Schema 扩展
- `intent.domain` 从 `'web_page'` 扩展为 `'web_page' | 'slide_deck' | 'document'`
- 总 section type 从 12 种扩展到 24 种
- Compiler prompt 支持三领域 section 映射

### 跨领域同源验证
- 同一品牌描述（DR.WARM）→ 三领域编译
- Web (3 sections) + Slide (4 slides) + Document (4 chapters)
- 三份输出共享一致的品牌信息和设计系统

---

## 2026-06-12 — v0.0.5 (MCP Server: Agent Infrastructure)

### MCP Server
- `src/mcp-server.ts` — STDIO MCP server exposing 5 tools
- `compile_intent` — NL → IR (any domain)
- `render_format` — IR → HTML/React/MD/Slide/Document
- `diff_ir` — Compare two IR files
- `translate_ir` — zh-CN/en-US/ru-RU translation
- `list_templates` — Built-in templates list
- Verified: stdio handshake + tools/list response
- `.mcp.json` auto-generated for Claude Code integration

### Architecture
- Any MCP agent (Claude Code, Cursor, Copilot) can call intent-compiler
- IR preprocessing before code generation → eliminates NL ambiguity
- STDIO transport → auto-started by agent, zero config

---

## 2026-06-12 — v0.0.6 (Renderer Ecosystem)

### Renderer Registry
- `RendererRegistry` class — centralized Map-based registration
- `IntentRenderer` interface: `{ meta: RendererMeta, render: (ir) => string }`
- Contract validation at registration time
- Priority-based ordering
- Domain-aware filtering

### External Renderer Support
- `discoverRenderers(dir)` — auto-scan directory for renderer files
- Example: `examples/renderers/pdf-brochure.ts` — third-party PDF brochure renderer
- Drop a `.ts` or `.js` file → register → available in CLI and MCP

### CLI Commands
- `intentc renderer list` — list all registered renderers (built-in + external)
- `intentc renderer discover <dir>` — scan and register from directory
- `intentc renderer add <dir>` — alias for discover

### MCP Extension
- `list_renderers` MCP tool added
- `render_format` now uses registry (not hardcoded imports)

---

## 2026-06-12 — Open Source Prep (Pre-GitHub)

### CI/CD
- `.github/workflows/ci.yml` — GitHub Actions: npm ci → tsc → test → build
- Ubuntu latest, Node 22, cache enabled

### Tests
- 15 unit tests, 2 suites: schema (7 tests) + registry (8 tests)
- Zero API key needed — all tests run offline
- `npm test` via `tsx --test`

### CONTRIBUTING.md
- Architecture overview, good first issues, development rules, PR guidelines

### npm Prep
- `.npmignore` — exclude tests, dev files, examples
- `prepublishOnly` hook — auto-build before publish

### README
- Chinese quick-start section for domestic users
- MCP setup instructions
- CI badge + test badge

