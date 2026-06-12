# Intent Compiler MCP Server

> Any MCP-compatible agent can now use intent-compiler as structured preprocessing.

## Quick Setup

```bash
cd intent-compiler

# Claude Code
claude mcp add --transport stdio --scope project intent-compiler -- npx tsx src/mcp-server.ts

# Cursor / VS Code
# Add to .cursor/mcp.json or .vscode/mcp.json:
# { "mcpServers": { "intent-compiler": { "type": "stdio", "command": "npx", "args": ["tsx", "src/mcp-server.ts"] } } }
```

Restart your agent session. The following tools become available:

| Tool | What It Does |
|------|-------------|
| `compile_intent` | NL → structured Intent IR JSON |
| `render_format` | IR → HTML/React/Markdown/Slide/Document |
| `diff_ir` | Compare two IR files |
| `translate_ir` | Translate IR content (zh-CN/en-US/ru-RU) |
| `list_templates` | List built-in IR templates |

## How Agents Use It

```
User: "Make a landing page for a coffee shop"

Agent calls compile_intent("coffee shop landing page...")
        ↓
Agent receives structured IR with precise sections, colors, content
        ↓
Agent calls render_format(ir, "html") → complete HTML
Agent calls render_format(ir, "react") → React components
        ↓
Agent presents both to user
```

**Key difference from direct NL → code:** The IR is a validated intermediate representation. The agent knows the exact structure before generating code, eliminating guesswork.

## Architecture

```
Any Agent (Claude Code / Cursor / Copilot / GPT)
    │
    ▼
  MCP stdio transport
    │
    ▼
┌──────────────────────┐
│ intent-compiler MCP  │
│                      │
│  compile_intent()    │ ← LLM compiler frontend
│  render_format()     │ ← 5 renderers
│  diff_ir()           │ ← IR versioning
│  translate_ir()      │ ← Multi-language
└──────────────────────┘
```

## Verification

After setup, in Claude Code:
```
/mcp → should show intent-compiler connected
```

Or in any agent session:
```
Use compile_intent to describe a landing page
```
