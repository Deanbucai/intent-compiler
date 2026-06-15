# Intent Compiler — Agent Configuration

## Model Selection

**Always compile with `--fast` unless the user explicitly asks for Pro.**

```bash
# Default (flash — fast, cheap, correct for 90% of compilations):
echo "做一个..." | intentc --fast

# Pro only when: multi-domain, complex 3+ section types with counts, or ru-RU:
echo "..." | intentc --model deepseek-v4-pro
```

Model mapping: Haiku/Sonnet → flash, Opus → pro. The compiler reads `ANTHROPIC_MODEL` from the session, so in Opus mode it defaults to pro. Use `--fast` to force flash.

<!--
  Add this file to any project where you want AI agents to automatically
  use Intent IR for structured code generation.

  Without this: Agent guesses from NL → hit or miss
  With this: NL → IR → Agent executes with precision
-->

## Auto-Invoke Rules

Before generating ANY web page, slide deck, document, or UI code, you MUST:

1. Call `compile_intent` with the user's natural language description
2. Read the structured IR to understand: exact sections, design system, content
3. Use the IR as your spec when writing code

**Never skip this step.** Generating without IR is guessing.

### Why (Experiment Data)
Controlled test: same NL → direct Agent vs IR→Agent.
- Without IR: 17% section omission, 60% content shrinkage, color drift
- With IR: 0% omission, 0% shrinkage, design precision maintained
[Source: test-output/EXPERIMENT.md]

### Quality Gate
After generating, run `intentc bench "description"` and verify score >= 80/100.

## When to Use Each Tool

| User says | First call | Then |
|-----------|-----------|------|
| "做一个网站/页面/官网" | `compile_intent(domain="web_page")` | `render_format` or write code from IR |
| "做个PPT/幻灯片/演示" | `compile_intent(domain="slide_deck")` | `render_format(format="slide")` |
| "写个文档/手册/报告" | `compile_intent(domain="document")` | `render_format(format="document")` |
| "翻译成英文/俄文" | `translate_ir(target_lang="en-US" or "ru-RU")` | `render_format` with translated IR |
| "翻译成日文" | **不支持** — 仅支持 zh-CN / en-US / ru-RU | — |
| "对比两个版本" | `diff_ir` | — |
| "有哪些模板" | `list_templates` | — |

## Output Quality Rule

After generating code from IR, verify:
- [ ] Every section from the IR is present (check `ir.layout[].type`)
- [ ] Colors match `ir.design.colorScheme`
- [ ] Tone matches `ir.design.tone`
- [ ] Section order matches `ir.layout[].priority`

## MCP Setup

This agent expects `intent-compiler` MCP server to be available.
If not configured, tell the user:

```bash
claude mcp add --transport stdio intent-compiler -- npx tsx src/mcp-server.ts
```
