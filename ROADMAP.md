# Intent Compiler Roadmap

> **核心命题**: IR（结构化意图）是产品，不是编译器。

## 差异化在哪

```
Agent 模式（Cursor/Claude Code/Copilot）:
  人 → NL → Agent 黑盒 → 最终产物
  改需求 → 重新对话 → 重新生成 → 结果不可预知

Intent Compiler 模式:
  人 → NL → Intent IR（存下来） → 渲染器A → HTML
                                  → 渲染器B → React  
                                  → 渲染器C → 幻灯片
  改配色 → 只改 IR 一行 → 三个渲染器全部自动更新
```

**IR 是中间层。** 就像 LLVM IR 让编译器世界从"N 个语言 × M 个架构"变成"N + M"，Intent IR 让 AI 生成世界从 "N 种描述 × M 种输出"变成 "N + M"。

下面每个版本都必须让这个差异化更明显。

---

## v0.1.0 — 概念验证 ✅ Done

**差异化程度**: ⭐ (几乎为零)

```
echo "做一个网站..." | intentc → IR JSON → HTML
```

- [x] IR Schema v0.1.0（7 种 section type）
- [x] NL → IR 编译器（Anthropic/OpenAI provider）
- [x] 参考 HTML 渲染器
- [x] CLI + API
- [x] DR.Warm 真实案例

**问题**: 只有一个渲染器，IR 的可复用价值不存在。看起来就是个带 schema 的 prompt 模板。

---

## v0.2.0 — 多渲染器（差异化开始可见）

**差异化程度**: ⭐⭐⭐

**核心功能**: 同一个 IR → 3 种输出

```
同一个 IR
  ├── renderHTML(ir)    → 独立 HTML 文件
  ├── renderReact(ir)   → React 组件代码
  └── renderMarkdown(ir) → Markdown 文档
```

**为什么差异化**:
- Agent 模式：要 HTML 得生成一次，要 React 得再生成一次，两次可能不一致
- IR 模式：编译一次 IR，渲染 N 次，结构保证一致
- IR 可 diff：`diff v1.json v2.json` 看到改了什么，Agent 对话做不到

### v0.2.0 具体任务

| # | 任务 | 验证 |
|---|------|------|
| 1 | React renderer（IR → React components） | 同一个 IR 渲染 HTML + React，内容一致 |
| 2 | Markdown renderer（IR → .md 文档） | IR 的文本内容 → 格式化 MD |
| 3 | IR diff 工具 `intentc diff a.json b.json` | 输出人类可读的变更摘要 |
| 4 | 新增 section types: `pricing`, `gallery`, `cta`, `testimonials` | 覆盖 90% landing page 需求 |
| 5 | `intentc init` — 交互式创建 IR 脚手架 | 不写 NL 也能用 |

---

## v0.3.0 — 可视化 + 迭代（差异化明显）

**差异化程度**: ⭐⭐⭐⭐

**核心功能**: IR 可视化编辑 + 锁定重编译

```
NL → IR → 可视化编辑器（改配色/调顺序/改文案）
              │
              ├── 锁定 design 部分 → 只重编译 layout
              ├── 锁定 layout 部分 → 只重编译 design  
              └── 全量重编译
```

**为什么差异化**:
- Agent 模式：改一行文案要重新对话，可能把其他部分也改了
- IR 模式：锁定不想改的部分，只重编译目标区域
- 非程序员可以直接在 IR 编辑器里改文案、换色、调顺序

### v0.3.0 具体任务

| # | 任务 | 验证 |
|---|------|------|
| 1 | Web-based IR playground（`intentc play`） | 浏览器里编辑 IR → 实时预览 |
| 2 | Partial re-compilation（锁定字段重编译） | 锁定 design → 只改 layout → design 不变 |
| 3 | IR 模板库（landing/saas/portfolio/电商） | 从模板 IR 开始，不用从零写 NL |
| 4 | 多语言支持（同一 IR 编译成中/英/日文案） | 改 language 字段 → 重编译 content |
| 5 | IR → 静态站点部署（Netlify/Vercel 一键） | `intentc deploy` |

---

## v0.4.0 — 多领域 IR（真正领域无关）

**差异化程度**: ⭐⭐⭐⭐⭐

**核心功能**: IR 不只描述网页

```
NL → Intent IR
  ├── domain: "web_page"    → HTML/React
  ├── domain: "slide_deck"  → PPT/Keynote
  ├── domain: "document"    → PDF/Markdown
  ├── domain: "email"       → HTML Email
  └── domain: "form"        → JSON Schema + UI
```

**为什么差异化**:
- 市面上没有"写一次描述，同时出网页+PPT+文档"的工具
- 企业场景：产品介绍 → 网页 + 销售 PPT + 产品手册 PDF，从同一个 IR 出
- Agent 模式：得跟 Agent 对话三次，每个都不一致

### v0.4.0 具体任务

| # | 任务 | 验证 |
|---|------|------|
| 1 | IR schema 扩展为多 domain（web/slide/doc/email） | 同一个 meta 支持不同 domain |
| 2 | Slide renderer（IR → PPTX / Google Slides） | 编译为幻灯片 |
| 3 | Document renderer（IR → Markdown / PDF） | 编译为文档 |
| 4 | 跨 domain 一致性：网页+PPT+PDF 用同一份 IR | 三份输出的核心内容一致 |

---

## v1.0.0 — 生态层

**差异化程度**: ⭐⭐⭐⭐⭐

**核心功能**: 渲染器注册表 + 插件系统

```
社区渲染器市场:
  - @someone/intent-renderer-vue
  - @someone/intent-renderer-email  
  - @someone/intent-renderer-react-native
  - @someone/intent-renderer-shopify

安装 → 同一个 IR 渲染到 Shopify 店铺
```

**为什么差异化**:
- 这是 LLVM 终局——IR 标准化后，渲染器生态自生长
- 跟 Agent 不在一个维度竞争了。Agent 是工具，这个是基础设施。

---

## 差异化增长曲线

```
        差异化
          │                                        ╱  v1.0 生态
          │                                   ╱
          │                              ╱  v0.4 多领域
          │                         ╱
          │                    ╱  v0.3 可视化+迭代
          │               ╱
          │          ╱  v0.2 多渲染器
          │     ╱
          │ ╱  v0.1 单渲染器（现在）
          │
          └──────────────────────────────────────────→ 版本
              ↑
          和 Agent 没区别
```

**v0.1 → v0.2 是质变**。从"一个带 schema 的 prompt 模板"跨到"IR 是可复用资产"。

---

## 下一步：v0.2.0 启动

要开始做吗？优先任务是：

1. **React renderer** — 同一个 IR 渲染出两套代码，差异化立刻可见
2. **pricing/testimonials 等 section type** — 覆盖真实场景
3. **IR diff** — `intentc diff a.json b.json` 直观展示 IR 的版本控制价值
