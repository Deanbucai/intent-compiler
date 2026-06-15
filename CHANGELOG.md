# Changelog

## v0.0.13 (2026-06-15)

### Added
- **记忆库预填充**: `intentc memory seed` — 19 条黄金种子 IR 覆盖全部 5 领域 13 个行业，每条 quality_score=100
  - web_page: 制造工厂/SaaS/餐饮/摄影/电商/教育/牙科 — 覆盖 landing/portfolio 类型，常见 section 组合
  - slide_deck: 融资PPT/新品发布/安全培训 — 覆盖 pitch deck/presentation/training 场景
  - document: 产品说明书/技术报告/企业宣传册 — 覆盖 manual/report/brochure
  - ecommerce_content: 产品详情/品牌发布/大促全渠道 — 覆盖单品/品牌故事/营销活动
  - business_report: 经营分析/SaaS季度回顾/创业数据看板 — 覆盖中文/KPI/差异分析/建议
- 种子数据文件 `src/seed-memory.ts` — 每个种子是完整的有效 IR JSON，通过 schema 验证

### Changed
- **编译器加速（4项优化）**:
  1. **前缀缓存优化**: 固定内容（规则/Schema/示例）前置 → DeepSeek 自动前缀缓存命中，TTFT 降低 40-80%
  2. **Schema Minify**: 剥离 description 字段，4291→1708 chars（省 60%、~646 tokens）
  3. **响应缓存**: LRU 内存缓存，5-min TTL，相同输入 0ms 返回
  4. **Token 预算**: 按 section 数量动态调整（≤4→2048, ≤7→3072, 更大→4096）
- Prompt 瘦身：规则说明从 20 行压缩至 12 行，示例 IR 去掉空白
- Few-shot 压缩：只传 design + layout（不传完整 IR），减少变量区 token
- `CompileResult` 新增 `cached` 字段、`CompileOptions` 新增 `skipCache` 选项
- CLI 缓存命中时显示 `⚡ CACHE HIT`

### Fixed
- `compileStream()` 之前硬编码 4096 max_tokens，现在使用与 `compile()` 相同的动态 token 预算

## v0.0.11 (2026-06-13)

### Added
- **Bench feedback loop**: errors detected by bench are stored in `error_log` table with industry tags. Next compilation in same industry gets fix hints injected into the prompt
- **Quality-weighted memory**: few-shot examples sorted by bench score — 100/100 IRs preferred over 75/100
- **Claude Code Skill**: `intent-compiler` skill registered — agent auto-triggers on "做个网页" etc.
- **MCP memory integration**: `compile_intent` calls now auto-record to knowledge graph

### Changed
- Improved bench empty-section detection: now correctly handles footer, forms, galleries, badges
- Section types expanded from 24 to 34 (ecommerce_content + business_report domains)

### Fixed
- MCP server wasn't contributing to few-shot memory — now shares IRMemory instance

---

## v0.0.10 (2026-06-13)

### Added
- **`intentc init`**: Interactive project scaffolding — generates `ir.json`, `CLAUDE.md`, `.env.example`
- **Streaming compilation**: `compileStream()` async generator — yields `start/token/progress/complete/error` events
- Supports 3 domains × 5 styles × 6 industries in the scaffolder

### Fixed
- `.intent-compiler/` added to `.gitignore` (memory.db was tracked by git)

---

## v0.0.8 (2026-06-12)

### Added
- **IR Memory**: SQLite-based memory store that learns from past compilations
- Few-shot injection: similar past IRs are injected as examples into the compiler prompt
- `intentc memory stats|search|patterns|clear` CLI commands
- Industry pattern extraction: the system learns domain-specific section combinations

### How it works
Every `compile()` call is recorded. Before each new compilation, the system searches for similar past IRs (by industry, keywords, or recency) and injects them as few-shot examples. Over time, factory sites consistently get `hero+specs+faq+contact`, SaaS sites get `hero+features+pricing+cta`.

---

## v0.0.7 (2026-06-12)

### Added
- **CLAUDE.md**: Agent auto-invoke rules — agents automatically call `compile_intent` before generating code
- **AGENTS.md**: Multi-agent pipeline documentation (Compiler → Renderer → Output)
- Users no longer need to know IR exists — agent handles it transparently

---

## v0.0.6 (2026-06-12)

### Added
- **Renderer Ecosystem**: Plugin registry with `IntentRenderer` interface
- External renderer support: drop a `.ts` file → register → usable in CLI and MCP
- `intentc renderer list|discover|add` CLI commands
- Example external renderer: `pdf-brochure.ts` (A4-optimized, print-to-PDF)
- `list_renderers` MCP tool
- `render_format` MCP tool now uses registry

---

## v0.0.5 (2026-06-12)

### Added
- **MCP Server**: 6 tools exposed via STDIO transport
- `compile_intent`, `render_format`, `diff_ir`, `translate_ir`, `list_templates`, `list_renderers`
- Zero-config: agent auto-starts the server process
- `.mcp.json` for Claude Code / Cursor integration

---

## v0.0.4 (2026-06-12)

### Added
- **Multi-Domain IR**: `web_page` | `slide_deck` | `document`
- 6 new slide section types: `title_slide`, `content_slide`, `bullets_slide`, `quote_slide`, `image_slide`, `ending_slide`
- 7 new document section types: `document_title`, `chapter`, `body`, `doc_table`, `doc_image`, `toc`
- Slide renderer: self-contained HTML presentation with keyboard navigation
- Document renderer: print-friendly HTML with auto-generated table of contents
- Total section types: 24

---

## v0.0.3 (2026-06-12)

### Added
- **IR Playground**: browser-based JSON editor with real-time preview (`intentc play`)
- **Partial Recompilation**: `lockFields` option — lock design/layout while regenerating other parts
- **Multi-Language Translation**: `intentc translate ir.json zh-CN|en-US|ru-RU`
- **Template Library**: 4 built-in templates (landing, saas, portfolio, manufacturing)
- `intentc template list` CLI command

---

## v0.0.2 (2026-06-12)

### Added
- **React Renderer**: IR → complete `.tsx` file with typed functional components
- **Markdown Renderer**: IR → formatted `.md` with table of contents
- **IR Diff Tool**: `intentc diff a.json b.json` — human-readable change summary
- 4 new section types: `pricing`, `gallery`, `cta`, `testimonials`
- `intentc --render react|markdown` CLI support

---

## v0.0.1 (2026-06-12)

### Added
- **IR Schema v0.1.0**: 7 section types (hero, features, specs, faq, contact_form, trust_badges, footer, custom)
- **NL → IR Compiler**: Anthropic + OpenAI provider support
- **HTML Renderer**: IR → standalone HTML page with inline styles
- **CLI**: pipe input, file input, `--render html|json` output
- DR.Warm real-world B2B manufacturing example
- MIT license
