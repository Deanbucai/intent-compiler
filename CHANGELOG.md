# Changelog

## v0.0.9 (2026-06-12)

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
