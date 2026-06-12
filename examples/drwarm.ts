/**
 * DR.Warm B2B Manufacturing Website — Example Intent
 *
 * This demonstrates how a real manufacturing website can be described
 * in natural language and compiled through the Intent IR.
 *
 * Usage:
 *   npx tsx examples/drwarm.ts
 */

const DRWARM_INTENT = `做一个牙刷工厂的B2B外贸展示官网。

行业背景：
- 品牌名：DR.WARM，专业牙刷制造商
- 位于中国牙刷之都扬州杭集，20年生产经验
- 出口30+国家，服务全球批发商和品牌代工客户

设计风格：
- 深色背景配金色点缀，黑底#08080f + 金色#c9a84c
- 专业工业风调性，不要花哨
- 中英双语支持

需要的页面模块（按顺序）：
1. Hero大图区：品牌slogan + 询价CTA按钮
2. 认证标志展示：ISO 9001, FDA, CE, SGS
3. 技术规格卡片（6个）：刷毛材质、刷柄材质、生产能力、最小起订量、交期、认证合规
4. 产品特色（4个）：柔韧刷毛、人体工学刷柄、彩尖软毛、环保包装
5. FAQ手风琴（5条）：MOQ起订量、交货时间、能否定制、有哪些认证、是否提供样品
6. 询盘表单：姓名、邮箱、电话、需求描述
7. 底部：品牌名 + 版权信息`;

export { DRWARM_INTENT };
