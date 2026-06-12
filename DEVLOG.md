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

