# Intent Compiler Roadmap

> **核心命题**: IR（结构化意图）是产品，不是编译器。

## 差异化

```
Agent 模式（Cursor/Claude Code/Copilot）:
  人 → NL → Agent 黑盒 → 最终产物
  改需求 → 重新对话 → 重新生成 → 结果不可预知

Intent Compiler 模式:
  人 → NL → Intent IR（存下来） → HTML + React + MD + Slide + Document
  改配色 → 只改 IR 一行 → 五个渲染器全部自动更新
  加 MCP → 任意 Agent 自动调用 IR 预处理
```

---

## v0.0.1 — 概念验证 ✅

**NL → IR → HTML。** 7 种 section type，Anthropic/OpenAI 双 provider。

---

## v0.0.2 — 多渲染器 + 版本化 ✅

**同一个 IR → HTML + React + Markdown 三路输出。** IR diff 工具，4 种新 section type（pricing/gallery/cta/testimonials）。

差异化：编译一次 IR，渲染 N 次，结构保证一致。Agent 对话做不到。

---

## v0.0.3 — 可视化 + 迭代 ✅

**IR Playground 浏览器编辑器。** 部分重编译（锁定字段），4 个内置模板，中/英/俄三语翻译。

差异化：改配色改文案不重编译整个 IR。非程序员也能操作。

---

## v0.0.4 — 多领域 ✅

**Slide Deck + Document 两个新领域。** 24 种 section type 覆盖网页/幻灯片/文档。同一品牌描述 → 三个领域各自输出。

差异化：写一次描述，同时出网页 + PPT + 产品手册。

---

## v0.0.5 — MCP Server ✅

**6 个 MCP 工具暴露给所有 Agent。** compile_intent / render_format / diff_ir / translate_ir / list_templates / list_renderers。

差异化：不是"另一个工具"，是 Agent 的基础设施层。

---

## v0.0.6 — 渲染器生态 ✅

**插件注册表 + 外部渲染器。** `IntentRenderer` 接口，auto-discovery，优先级排序。任何人可以写一个 `.ts` 文件当渲染器。

差异化：LLVM 的后端生态——IR 标准化后，渲染器自生长。

---

## v0.0.7 — 自动调用 ✅

**CLAUDE.md + AGENTS.md。** Agent 读到规则后自动调 IR，用户不需要知道 IR 存在。

---

## v0.0.11 — 反馈闭环 ✅

**bench 错误 → prompt 自动纠错。** 每次 bench 检测到的错误按行业存储，下次同行业编译时注入为纠错提示。

---

## v0.0.13 — 记忆库预填充 ✅

**19 条黄金种子 IR。** `intentc memory seed` 一键注入，覆盖全部 5 领域 13 行业。

从零开始编译时，记忆库立即能提供行业匹配的 few-shot 示例和 section pattern 参考。

---

## 下一步

| 优先级 | 任务 | 说明 |
|--------|------|------|
| P0 | npm publish 0.0.13 | 发布到 npm registry |
| P1 | `dev_docs` 领域 | 开发文档：readme/changelog/api_doc/adr/tech_spec |
| P2 | 中文 FTS5 分词 | 接入 ICU 分词器或 jieba，解决中文检索 0 匹配问题 |
| P3 | streaming 集成到 playground | 大 IR 边编译边渲染 |
| P4 | email 领域 | 交易邮件模板 |

## 差异化增长曲线

```
        差异化
          │                              ╱
          │                         ╱  v0.0.6 生态
          │                    ╱  v0.0.5 MCP
          │               ╱  v0.0.4 多领域
          │          ╱  v0.0.3 可视化+迭代
          │     ╱  v0.0.2 多渲染器
          │ ╱  v0.0.1 单渲染器
          └──────────────────────────→
```
