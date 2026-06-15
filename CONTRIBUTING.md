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

## Development Workflow

### Before committing
```bash
npx tsc --noEmit    # Type check must pass
npm test            # Tests must pass
```

### Commit Convention
```
<type>: <description>

feat: add pricing section type
fix: slide renderer null body crash
docs: update README with MCP setup
```

### Pull Requests
1. Fork → branch → change → test → PR
2. Keep PRs small — one feature or fix per PR
3. Include a test or verification output
4. Update DEVLOG.md if relevant

## License

MIT. By contributing, you agree to license your work under MIT.
