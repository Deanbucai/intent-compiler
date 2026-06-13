# IR 对照实验报告

## 实验设计

同一句 NL → 两条路径生成网页：

- **Path A**: NL 直接给 Agent → Agent 生成 HTML
- **Path B**: NL → intent-compiler 编译成 IR → Agent 读 IR 后生成 HTML

## 测试用例 1: 工厂站

**NL 输入**: "做一个五金工具工厂B2B外贸官网，深灰工业风：hero+工厂实力4卡片+技术规格6项+FAQ5条+联系表单+认证标志(ISO/CE/SGS)"

### 结果

| 指标 | Path A (直接NL) | Path B (IR驱动) | 差值 |
|------|-----------------|-----------------|------|
| 文件大小 | 1,010 chars | 8,171 chars | 8× |
| Section 完整度 | 5/6 | 6/6 | +1 |
| 规格项数 | 2/6 | 6/6 | +4 |
| FAQ 条数 | 2/5 | 5/5 | +3 |
| 认证标志 | ❌ 缺失 | ✅ ISO/CE/SGS | — |
| 配色 | 随意 | 精确匹配 dark-industrial | — |

### IR 消除的三类错误

1. **遗漏** — Path A 忘了认证标志。IR 的 layout 数组强制每项必渲染
2. **缩水** — Path A 把 6 项规格变成 2 项、5 条 FAQ 变成 2 条。IR 的 items 数组锁定了数量
3. **漂移** — Path A 配色随意。IR 的 design.colorScheme 精确指定

### 结论

IR 作为 Agent 的预处理层，消除了 NL 模糊性导致的遗漏、缩水、漂移。不做对照实验之前，这个价值只是"说得通"——现在有数据。
