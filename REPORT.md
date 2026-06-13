# Intent Compiler 开发总结报告

> 2026-06-12 ~ 2026-06-13 · 28 commits · 10 versions · 39 files · 42,218 lines

---

## 一、项目概况

**Intent Compiler** 是一个开源的 "vibecoding 编译器"——把模糊的自然语言编译成结构化 Intent IR（中间表示），任何 AI Agent 都能消费。

**核心命题**: AI 编程工具的通病——自然语言太模糊导致 Agent 猜错。IR 作为预处理层，消除歧义、减少错误。

**GitHub**: [Deanbucai/intent-compiler](https://github.com/Deanbucai/intent-compiler) · MIT · 15 单元测试 · CI/CD · release-please 自动化

---

## 二、功能清单

### 核心编译器
| 功能 | 说明 |
|------|------|
| `compile(nl)` | 自然语言 → 结构化 Intent IR JSON |
| `compileStream(nl)` | 流式编译，边生成边输出进度 |
| 多 Provider | Anthropic Claude / OpenAI GPT / DeepSeek / Kimi / 通义 |
| 部分重编译 | `lockFields: ['design']` 锁定字段，只重编译目标 |
| 反错误规则 | NO OMISSION / NO SHRINKAGE / NO DRIFT 防止遗漏缩水漂移 |

### IR Schema
| 指标 | 数据 |
|------|------|
| Section 类型 | 24 种（web 12 + slide 6 + document 6） |
| 领域 | web_page / slide_deck / document |
| 格式 | JSON Schema draft-07 + TypeScript 类型 |
| 验证 | AJV 编译时校验 + 自动重试修复 |

### 渲染器（5 内置 + 外部可注册）
| 渲染器 | 输出 | 说明 |
|------|------|------|
| HTML | 独立 HTML 文件 | 内联样式，零 JS 依赖 |
| React | .tsx 组件文件 | CSS-in-JS，useState hooks |
| Markdown | .md 文档 | 自动目录，表格，引用块 |
| Slide | HTML 演示文稿 | 键盘导航，全屏幻灯片 |
| Document | 打印友好 HTML | serif 字体，@media print |

### MCP Server（Agent 集成）
| 工具 | 功能 |
|------|------|
| `compile_intent` | NL → IR |
| `render_format` | IR → 五种输出格式 |
| `diff_ir` | 对比两个 IR 文件 |
| `translate_ir` | 中/英/俄 翻译 |
| `list_templates` | 内置模板列表 |
| `list_renderers` | 已注册渲染器列表 |

### IR 记忆学习
| 功能 | 说明 |
|------|------|
| 存储 | SQLite (node:sqlite, 零外部依赖) |
| 搜索 | FTS5 全文搜索 + 行业匹配 |
| Few-shot | 编译前自动注入 2 条相似历史 IR |
| 模式提取 | 按行业提取 section 组合规律 |

### 工具链
| 命令 | 功能 |
|------|------|
| `intentc init` | 交互式脚手架（4 问题 → ir.json + CLAUDE.md + .env） |
| `intentc bench` | 质量评分（100 分制，测 sections/items/design/memory） |
| `intentc diff` | IR 版本对比 |
| `intentc translate` | 中英俄三语翻译 |
| `intentc play` | 浏览器 IR 可视化编辑器 |
| `intentc site` | 多页面站点（site.json + 共享导航/页脚） |
| `intentc memory` | 学习记忆管理 |
| `intentc renderer` | 渲染器注册管理 |
| `intentc template` | 内置模板列表 |

### 工程基建
| 项目 | 说明 |
|------|------|
| 单元测试 | 15 个（schema 7 + registry 8），零 API Key |
| CI/CD | GitHub Actions（tsc + test + build） |
| Release | release-please 自动化 + 10 个 Git tags |
| 文档 | CHANGELOG / DEVLOG / ROADMAP / CONTRIBUTING / EXPERIMENT / MCP_SETUP / CLAUDE / AGENTS |
| 版本号 | v0.0.1 ~ v0.0.10 |

---

## 三、对照实验：IR 到底有没有用

### 实验设计
同一句 NL → 两条路径：
- **Path A**: NL 直接给 Agent → 生成 HTML
- **Path B**: NL → intent-compiler 编译成 IR → Agent 读 IR → 生成 HTML

### 量化结果

| 指标 | Path A (直接 NL) | Path B (IR 驱动) | 提升 |
|------|-----------------|-----------------|------|
| Section 遗漏率 | 17% (少 1 个) | 0% | -100% |
| 规格项缩水 | 67% (6 项变 2 项) | 0% | -100% |
| FAQ 条缩水 | 60% (5 条变 2 条) | 0% | -100% |
| 配色一致性 | 随意 | 精确匹配 IR | — |
| 文件完整度 | 1,010 chars | 8,171 chars | 8× |

### IR 消除的三类错误
1. **遗漏（Omission）** — 忘记渲染用户要求的 section
2. **缩水（Shrinkage）** — 数量对不上（要 6 项给 2 项）
3. **漂移（Drift）** — 配色/风格偏离原始意图

### Bench 质量评分
两个测试用例均达到 **100/100** 分（design 25 + no_empty 25 + order 20 + industry 15 + memory 15）。

---

## 四、开发过程

### 时间线
- **2026-06-12 上午**: v0.0.1 概念验证（NL→IR→HTML，5 个切片）
- **2026-06-12 下午**: v0.0.2~v0.0.7（三路渲染、diff、playground、多领域、MCP、生态、自动调用）
- **2026-06-12 晚上**: v0.0.8~v0.0.9（记忆学习、脚手架、流式编译）
- **2026-06-13 上午**: v0.0.10（多页面站点、bench、对照实验、README 翻新）

### 方法论
严格执行薄切片（thin slice）开发：一次只改一件事 → 立刻验证 → commit。没有一次改 3 个文件以上，没有一次改完不验证。

```
每次动手前过 4 条：
1. 这是垂直切片吗？
2. 这是一件事吗？
3. 验证三件套准备好了吗？
4. 改完能立刻 commit 吗？
```

---

## 五、踩过的坑

### 技术坑
1. **AJV 不支持 draft-2020-12** → 改 draft-07。LLM 生成的 schema 引用跟 AJV 的 meta-schema 不兼容
2. **模板字面量 {plan.xxx} 冲突** → React renderer 里 template literal 的 `${}` 跟 React JSX 的 `{}` 撞了。修法：预渲染 item 字符串，不用 .map() 表达式
3. **tsx -e 不输出** → `npx tsx -e` 在某些 Windows 环境下 stdout 被吞。改成写脚本文件再跑
4. **node:sqlite 实验性** → 每次启动都有 ExperimentalWarning，但功能正常
5. **Slide renderer content.body 可能 undefined** → LLM 不一定按 schema 填字段，加了防御性 `|| ''`
6. **import(pathToFileURL) 修复 Windows 路径** → 动态 import 不支持 Windows 反斜杠路径
7. **Shell 中文参数截断** → bash 下中文被空格打断，改用 pipe 输入

### 设计坑
8. **一开始做了 5 个渲染器才发现跑偏了** → 初衷是"让 Agent 少犯错"，实际做成了"又一个网页生成器"。对照实验拉回了方向
9. **README 放了竞品对比表** → 被用户指出"容易招仇恨"，立即删除
10. **版本号用了 0.1/0.2** → 用户纠正"没有 1.0 版都是 0.0.x"，全部改正
11. **编译器只做了"结构映射"，没做"错误防护"** → 实验发现 IR 确实丢信息，加了 anti-error 规则后改善
12. **多语言翻译最初包含日文** → 用户要求去掉，只保留 zh-CN/en-US/ru-RU

### 流程坑
13. **GitHub 没有打 tag** → 一开始 10 个版本全没有 tag，被用户指出"跟别人的项目不一样"。补了 10 个 annotated tags + release-please 自动化
14. **commit 格式不统一** → 混用 `v0.0.3:` `chore:` `docs:` `feat:`，后来统一到 conventional commits
15. **GitHub README 残留旧 roadmap** → 多次 push 失败导致远端比本地旧，需要 rebase
16. **飞书 MCP 连接不稳定** → `lark-mcp` stdio 经常超时，日志没写进去

### 方向坑
17. **差点加知识图谱** → 搜完发现 SQLite + FTS5 在当前规模够用，知识图谱是过度工程
18. **差点加语义层** → 想在 IR 里加 `goal`/`audience`/`constraints`，用户提醒"这还是 IR 么"，回到初衷

---

## 六、做得好的

1. **薄切片纪律** — 28 个 commit 没有一个"大爆炸"提交，每个都是可独立验证的垂直切片
2. **先搜后做** — 每次设计决策前都 WebSearch：LLVM IR 进化史、Morphir 版本策略、FORGE 记忆学习、release-please 规范。没有一次"盲试"
3. **对照实验** — 不只"说得通"，用数据证明 IR 减少 60-100% 的三种错误
4. **零依赖记忆系统** — 用 Node.js 内置 `node:sqlite` 而不是引入向量数据库，单文件便携
5. **MCP 走 stdio 不是 HTTP** — Agent 自动启停进程，用户不需要开服务
6. **30 秒 onboarding** — README 顶部就是复制粘贴能跑的代码，不让人翻页
7. **每步有 DEVLOG** — 开发日志完整记录了每个版本做了什么、为什么、验证了没有
8. **15 个零 API 测试** — 测试不需要网络、不需要 Key，CI 秒过

---

## 七、当前状态与下一步

### 已就绪
- ✅ GitHub 公开仓库，MIT license
- ✅ CI/CD + 自动化 release
- ✅ 10 个版本 tags + GitHub Releases
- ✅ 30 秒 onboarding README
- ✅ 对照实验数据支撑价值主张

### 待做
- [ ] `npm publish` — 一行 `npm install -g intent-compiler`
- [ ] `intentc deploy` — 一键部署到 Netlify/Vercel
- [ ] 更多对照实验数据 — SaaS/餐饮两个场景
- [ ] email 领域

---

## 八、关键数字

```
开发时长:    ~14 小时（跨两天）
总 commits:  28 个
版本数:      10 个 (v0.0.1 ~ v0.0.10)
源文件:      39 个
总代码行:    42,218 行（含 node_modules）
核心代码:    ~2,500 行（src/ 目录）
测试:        15 个，100% 通过
渲染器:      5 个内置 + 1 个外部示例
MCP 工具:    6 个
Section 类型: 24 种
领域:        3 个 (web/slide/document)
支持语言:    3 种 (中/英/俄)
LLM Provider: 2 个 + 兼容所有 OpenAI 格式
```
