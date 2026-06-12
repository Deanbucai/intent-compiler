# AGENTS.md — Multi-Agent Intent IR Pipeline

## Agent Roles

| Agent | Role | Tool |
|-------|------|------|
| **Compiler** | NL → Structured IR | `compile_intent` |
| **Renderer** | IR → HTML/React/MD/Slide/Document | `render_format` |
| **Translator** | IR content → zh-CN/en-US/ru-RU | `translate_ir` |
| **Validator** | Compare IR versions | `diff_ir` |

## Pipeline

```
User Input (NL)
    │
    ▼
┌──────────────┐
│  Compiler    │  compile_intent(input, domain)
│  NL → IR     │  → structured IR JSON
└──────┬───────┘
       │ IR
       ▼
┌──────────────┐
│  Renderer    │  render_format(ir, format)
│  IR → Output │  → final HTML/React/MD/Slide
└──────┬───────┘
       │
       ▼
   Final Output
```

## Composable: Same IR → Multiple Outputs

```javascript
const ir = await compile_intent("coffee shop landing page");

// One IR → three formats, structurally identical
const web     = await render_format(ir, "html");
const slide   = await render_format(ir, "slide");
const brochure = await render_format(ir, "document");
```
