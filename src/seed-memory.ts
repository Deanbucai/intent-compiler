/**
 * Memory Seed Data — Pre-populate the IR memory bank with high-quality examples.
 *
 * Without seeds, the memory starts empty and few-shot learning has nothing to
 * reference. These 18 gold-standard examples (quality_score=100) cover all 5
 * domains, common industries, and frequent section patterns.
 *
 * Run: npx tsx src/seed-memory.ts
 * CLI:  intentc memory seed
 */

import { IRMemory } from './ir-memory';

export interface SeedEntry {
  nl_input: string;
  ir_json: string;
  domain: string;
  industry: string;
  section_types: string[];
  color_scheme: string;
  tone: string;
  quality_score: number;
}

/** Build a minimal valid IR envelope — all seeds share this skeleton. */
function ir(params: {
  domain: string;
  type: string;
  industry: string;
  language: string;
  summary: string;
  colorScheme: string;
  tone: string;
  typography?: string;
  layout: Array<Record<string, unknown>>;
}): Record<string, unknown> {
  return {
    $schema: 'https://intent-compiler.dev/schema/v0.1.0',
    version: '0.1.0',
    intent: {
      domain: params.domain,
      type: params.type,
      industry: params.industry,
      language: params.language,
      summary: params.summary,
    },
    design: {
      colorScheme: params.colorScheme,
      tone: params.tone,
      typography: params.typography || 'modern-sans',
      responsive: true,
    },
    layout: params.layout,
  };
}

// ═══════════════════════════════════════════════════════════════
// 18 Gold-Standard Seeds — quality_score = 100
// ═══════════════════════════════════════════════════════════════

export const SEED_DATA: SeedEntry[] = [
  // ─── web_page (7) ───────────────────────────────────────────

  {
    nl_input: '做一个五金工具工厂B2B外贸官网，深灰工业风，hero+工厂实力6卡片+技术规格6项+FAQ5条+联系表单+认证标志ISO/CE/SGS',
    domain: 'web_page',
    industry: '制造',
    section_types: ['hero', 'features', 'specs', 'faq', 'contact_form', 'trust_badges'],
    color_scheme: 'dark-industrial-gray',
    tone: 'professional-industrial',
    quality_score: 100,
    ir_json: JSON.stringify(ir({
      domain: 'web_page', type: 'landing', industry: '制造', language: 'zh-CN',
      summary: '五金工具工厂B2B外贸官网，展示制造实力和产品规格',
      colorScheme: 'dark-industrial-gray', tone: 'professional-industrial',
      layout: [
        { id: 'hero', type: 'hero', priority: 10, content: { headline: '精密五金工具制造商', subheadline: '20年出口经验 · 服务全球50+国家 · ISO/CE/SGS认证', cta: { text: '获取报价', action: 'contact' } } },
        { id: 'strength', type: 'features', priority: 20, content: { title: '工厂实力', items: [
          { icon: 'factory', title: '20000㎡ 生产基地', description: '拥有CNC加工中心、冲压车间、装配线全套设备' },
          { icon: 'certificate', title: 'ISO 9001:2015 认证', description: '严格质量管理体系，每批次产品出厂前全检' },
          { icon: 'truck', title: '月产能 500万件', description: '自动化产线确保交期稳定，支持急单48小时响应' },
          { icon: 'globe', title: '出口50+国家', description: '欧美、东南亚、中东市场均有长期合作客户' },
          { icon: 'users', title: '200+技术工人', description: '平均从业经验8年以上，持证上岗率100%' },
          { icon: 'flask', title: '自有检测实验室', description: '硬度测试、盐雾测试、尺寸精度检测设备齐全' },
        ] } },
        { id: 'specs', type: 'specs', priority: 30, content: { title: '产品技术规格', columns: 3, items: [
          { label: '材质', value: '碳钢 / 不锈钢304 / 合金钢 / 铜' },
          { label: '表面处理', value: '镀锌 / 镀铬 / 发黑 / 达克罗' },
          { label: '硬度等级', value: '4.8 / 8.8 / 10.9 / 12.9' },
          { label: '精度公差', value: '±0.01mm (CNC加工件)' },
          { label: '包装标准', value: '出口托盘 + 防锈纸 + 标签' },
          { label: '最小起订量', value: '1000件 (支持样品单)' },
        ] } },
        { id: 'faq', type: 'faq', priority: 40, content: { title: '常见问题', items: [
          { question: '你们的最小起订量是多少？', answer: '标准件MOQ为1000件，支持样品单（50-100件），样品费下单后退还。' },
          { question: '交货期多久？', answer: '常规订单15-25个工作日，急单可协调至7-10个工作日。' },
          { question: '是否支持OEM/ODM？', answer: '支持。可按图纸、样品定制，提供激光打标服务。' },
          { question: '如何保证质量？', answer: '每批次出厂前进行硬度、尺寸、外观全检，附带检测报告。' },
          { question: '提供哪些付款方式？', answer: 'T/T 30%预付+70%装运前，L/C即期信用证，支持阿里信保。' },
        ] } },
        { id: 'contact', type: 'contact_form', priority: 50, content: { title: '询价咨询', subtitle: '24小时内回复，免费提供样品和技术资料', fields: [
          { name: 'name', label: '姓名', type: 'text', required: true },
          { name: 'email', label: '邮箱', type: 'email', required: true },
          { name: 'phone', label: '电话', type: 'tel' },
          { name: 'message', label: '需求描述（产品/规格/数量）', type: 'textarea', required: true },
        ] } },
        { id: 'certs', type: 'trust_badges', priority: 60, content: { title: '认证与资质', badges: [
          { name: 'ISO 9001:2015' }, { name: 'CE 认证' }, { name: 'SGS 检测报告' }, { name: 'RoHS 合规' },
        ] } },
      ],
    })),
  },

  {
    nl_input: '做一个SaaS产品landing page，蓝色调，hero+4个features+pricing3档+cta+3条用户评价+footer',
    domain: 'web_page',
    industry: 'SaaS',
    section_types: ['hero', 'features', 'pricing', 'cta', 'testimonials', 'footer'],
    color_scheme: 'blue-light',
    tone: 'professional',
    quality_score: 100,
    ir_json: JSON.stringify(ir({
      domain: 'web_page', type: 'landing', industry: 'SaaS', language: 'en-US',
      summary: 'SaaS product landing page with features, pricing, and testimonials',
      colorScheme: 'blue-light', tone: 'professional',
      layout: [
        { id: 'hero', type: 'hero', priority: 10, content: { headline: 'Streamline Your Workflow', subheadline: 'The all-in-one platform for modern teams to collaborate, ship, and scale.', cta: { text: 'Start Free Trial', action: 'signup' } } },
        { id: 'features', type: 'features', priority: 20, content: { title: 'Everything You Need', items: [
          { icon: 'zap', title: 'Lightning Fast', description: 'Sub-100ms response times with our globally distributed infrastructure.' },
          { icon: 'shield', title: 'Enterprise Security', description: 'SOC 2 Type II certified, AES-256 encryption at rest and in transit.' },
          { icon: 'users', title: 'Team Collaboration', description: 'Real-time editing, comments, and version history for seamless teamwork.' },
          { icon: 'bar-chart', title: 'Advanced Analytics', description: 'Custom dashboards, exports, and AI-powered insights to track growth.' },
        ] } },
        { id: 'pricing', type: 'pricing', priority: 30, content: { title: 'Simple, Transparent Pricing', items: [
          { name: 'Starter', price: '$29/mo', description: 'For small teams getting started.', features: ['Up to 5 users', '10 GB storage', 'Basic analytics', 'Email support'], highlighted: false },
          { name: 'Professional', price: '$99/mo', description: 'For growing teams that need more power.', features: ['Up to 50 users', '100 GB storage', 'Advanced analytics', 'Priority support', 'API access'], highlighted: true },
          { name: 'Enterprise', price: 'Custom', description: 'For large organizations with custom needs.', features: ['Unlimited users', 'Unlimited storage', 'SSO / SAML', 'Dedicated support', 'Custom integrations', 'SLA guarantee'], highlighted: false },
        ] } },
        { id: 'cta', type: 'cta', priority: 40, content: { headline: 'Ready to Get Started?', body: 'Join 10,000+ teams already using our platform. Free 14-day trial, no credit card required.', buttonText: 'Start Free Trial', buttonAction: 'signup' } },
        { id: 'testimonials', type: 'testimonials', priority: 50, content: { title: 'What Our Customers Say', items: [
          { quote: 'Switching to this platform cut our deployment time by 60%. The collaboration features are a game-changer.', name: 'Sarah Chen', role: 'VP Engineering, TechCorp' },
          { quote: 'Finally, a tool that our entire team actually enjoys using. The analytics alone are worth the price.', name: 'Marcus Johnson', role: 'CTO, GrowthStack' },
          { quote: 'We evaluated 12 solutions before choosing this one. Best decision we made all year.', name: 'Elena Rodriguez', role: 'Director of Product, ScaleUp' },
        ] } },
        { id: 'footer', type: 'footer', priority: 60, content: { brandName: 'StreamLine', links: [
          { label: 'About', href: '/about' }, { label: 'Blog', href: '/blog' }, { label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' },
        ], copyright: '© 2026 StreamLine, Inc. All rights reserved.' } },
      ],
    })),
  },

  {
    nl_input: '做一个高端日料餐厅网站，暗色暖金调，hero+菜品展示6图+主厨介绍+客户点评5条+在线预约表单+联系信息',
    domain: 'web_page',
    industry: '餐饮',
    section_types: ['hero', 'gallery', 'features', 'testimonials', 'contact_form', 'footer'],
    color_scheme: 'dark-warm-gold',
    tone: 'elegant-luxury',
    quality_score: 100,
    ir_json: JSON.stringify(ir({
      domain: 'web_page', type: 'landing', industry: '餐饮', language: 'zh-CN',
      summary: '高端日料餐厅官网，展示菜品、主厨、顾客评价，支持在线预约',
      colorScheme: 'dark-warm-gold', tone: 'elegant-luxury', typography: 'classic-serif',
      layout: [
        { id: 'hero', type: 'hero', priority: 10, content: { headline: '匠心 · 旬味', subheadline: '银座传承 · 东京空运食材 · 每日仅接待30席', cta: { text: '预约席位', action: 'reserve' } } },
        { id: 'gallery', type: 'gallery', priority: 20, content: { title: '当季菜品', images: [
          { src: '/images/omakase-1.jpg', alt: '主厨特选刺身盛合', caption: '北海道直送 · 主厨特选刺身盛合' },
          { src: '/images/omakase-2.jpg', alt: 'A5和牛寿喜烧', caption: '宫崎A5和牛 · 寿喜烧' },
          { src: '/images/omakase-3.jpg', alt: '时令天妇罗', caption: '旬菜天妇罗 · 樱花盐' },
          { src: '/images/omakase-4.jpg', alt: '握寿司', caption: '江户前握寿司 · 赤醋饭' },
          { src: '/images/omakase-5.jpg', alt: '抹茶甜品', caption: '宇治抹茶 · 手作和菓子' },
          { src: '/images/omakase-6.jpg', alt: '季节怀石', caption: '八寸 · 季节怀石料理' },
        ] } },
        { id: 'chef', type: 'features', priority: 30, content: { title: '主厨介绍', items: [
          { icon: 'star', title: '山田一郎', description: '银座久兵卫修业12年，东京米其林二星副料理长。2020年归国创立本店，坚持每日手磨山葵、现煮赤醋饭。' },
        ] } },
        { id: 'reviews', type: 'testimonials', priority: 40, content: { title: '食客点评', items: [
          { quote: '在上海吃过最正宗的江户前寿司，食材新鲜度堪比银座名店。', name: '张先生', role: '大众点评VIP' },
          { quote: '每一次季节菜单更换都让人惊艳，主厨对食材的理解非常深刻。', name: '李女士', role: '美食博主' },
          { quote: '氛围安静雅致，服务恰到好处，是商务宴请的首选。', name: '王总', role: '常客' },
          { quote: '价格不菲但物有所值，每一道菜都能感受到匠心。', name: '陈小姐', role: '黑珍珠餐厅指南评委' },
          { quote: '从进门到离开，每一个细节都无可挑剔。', name: '刘先生', role: '美食评论家' },
        ] } },
        { id: 'reserve', type: 'contact_form', priority: 50, content: { title: '预约席位', subtitle: '每日仅接待30席，请提前2天预约', fields: [
          { name: 'name', label: '姓名', type: 'text', required: true },
          { name: 'phone', label: '电话', type: 'tel', required: true },
          { name: 'date', label: '期望日期', type: 'text', required: true },
          { name: 'guests', label: '人数', type: 'text', required: true },
          { name: 'note', label: '特别需求（过敏/纪念日等）', type: 'textarea' },
        ] } },
        { id: 'footer', type: 'footer', priority: 60, content: { brandName: '旬 · SHUN', links: [
          { label: '关于我们', href: '/about' }, { label: '菜单', href: '/menu' }, { label: '位置', href: '/location' },
        ], copyright: '© 2026 旬 SHUN. 沪ICP备XXXXXXXX号' } },
      ],
    })),
  },

  {
    nl_input: '做一个独立摄影师作品集网站，极简黑白，hero大图+作品画廊8张+关于我+服务项目+联系表单',
    domain: 'web_page',
    industry: '创意',
    section_types: ['hero', 'gallery', 'features', 'cta', 'contact_form'],
    color_scheme: 'minimal-black-white',
    tone: 'minimal-artistic',
    quality_score: 100,
    ir_json: JSON.stringify(ir({
      domain: 'web_page', type: 'portfolio', industry: '创意', language: 'en-US',
      summary: 'Independent photographer portfolio showcasing fine art and commercial work',
      colorScheme: 'minimal-black-white', tone: 'minimal-artistic',
      layout: [
        { id: 'hero', type: 'hero', priority: 10, content: { headline: 'Capturing Light, Telling Stories', subheadline: 'Fine Art & Commercial Photography · Based in New York · Available Worldwide', cta: { text: 'View Portfolio', action: 'gallery' } } },
        { id: 'gallery', type: 'gallery', priority: 20, content: { title: 'Selected Works', images: [
          { src: '/images/portrait-1.jpg', alt: 'Portrait in natural light', caption: 'Editorial Portrait' },
          { src: '/images/wedding-1.jpg', alt: 'Destination wedding', caption: 'Amalfi Coast Wedding' },
          { src: '/images/product-1.jpg', alt: 'Luxury product', caption: 'Commercial Campaign' },
          { src: '/images/street-1.jpg', alt: 'Tokyo street', caption: 'Urban Stories' },
          { src: '/images/fashion-1.jpg', alt: 'Runway', caption: 'NYFW Backstage' },
          { src: '/images/landscape-1.jpg', alt: 'Iceland', caption: 'Elemental' },
          { src: '/images/food-1.jpg', alt: 'Fine dining', caption: 'Culinary Art' },
          { src: '/images/architecture-1.jpg', alt: 'Modern building', caption: 'Concrete & Light' },
        ] } },
        { id: 'about', type: 'features', priority: 30, content: { title: 'About', items: [
          { title: 'James Walker', description: 'Award-winning photographer with 12 years of experience. Published in Vogue, National Geographic, and The New York Times. I believe every frame should tell a story that words cannot.' },
        ] } },
        { id: 'services', type: 'cta', priority: 40, content: { headline: 'Services', body: 'Editorial · Commercial · Wedding · Portrait · Architecture\n\nStarting at $2,500 per project. Custom packages available for long-term collaborations.', buttonText: 'Inquire Now', buttonAction: 'contact' } },
        { id: 'contact', type: 'contact_form', priority: 50, content: { title: 'Let\'s Create Together', subtitle: 'Tell me about your project. I typically respond within 24 hours.', fields: [
          { name: 'name', label: 'Name', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'project_type', label: 'Project Type', type: 'text' },
          { name: 'message', label: 'Tell me about your vision', type: 'textarea', required: true },
        ] } },
      ],
    })),
  },

  {
    nl_input: '做一个跨境电商独立站，卖智能家居产品，hero+产品特点5个+价格表3档+用户评价+购买FAQ+页脚',
    domain: 'web_page',
    industry: '电商',
    section_types: ['hero', 'features', 'pricing', 'testimonials', 'faq', 'footer'],
    color_scheme: 'light-blue-white',
    tone: 'friendly-modern',
    quality_score: 100,
    ir_json: JSON.stringify(ir({
      domain: 'web_page', type: 'landing', industry: '电商', language: 'zh-CN',
      summary: '智能家居产品跨境电商独立站，展示产品功能和购买信息',
      colorScheme: 'light-blue-white', tone: 'friendly-modern',
      layout: [
        { id: 'hero', type: 'hero', priority: 10, content: { headline: '让家更聪明，让生活更简单', subheadline: '全新SmartHome系列 · 语音控制 · 节能30% · 全球免邮', cta: { text: '立即购买', action: 'buy' } } },
        { id: 'features', type: 'features', priority: 20, content: { title: '为什么选择 SmartHome？', items: [
          { icon: 'mic', title: '全语音控制', description: '兼容Alexa/Google Home/Siri，一句话控制全屋设备。' },
          { icon: 'battery', title: '超长续航', description: '内置5000mAh电池，单次充电使用6个月。' },
          { icon: 'wifi', title: '自组网技术', description: '断网也能工作，Mesh网络覆盖500㎡。' },
          { icon: 'shield', title: '金融级安全', description: '端到端加密，通过GDPR和CCPA认证。' },
          { icon: 'sun', title: '太阳能配件', description: '可选太阳能面板，彻底告别换电池。' },
        ] } },
        { id: 'pricing', type: 'pricing', priority: 30, content: { title: '选择你的套装', items: [
          { name: '入门套装', price: '¥299', description: '适合小户型公寓', features: ['智能网关×1', '智能灯泡×3', '门窗传感器×1', 'App控制'], highlighted: false },
          { name: '标准套装', price: '¥699', description: '适合三室两厅家庭', features: ['智能网关×1', '智能灯泡×6', '智能开关×3', '门窗传感器×2', '人体传感器×2', '语音控制'], highlighted: true },
          { name: '全屋套装', price: '¥1299', description: '适合大平层/别墅', features: ['智能网关×2', '智能灯泡×12', '智能开关×6', '全系传感器×8', '太阳能面板×2', 'VIP安装服务'], highlighted: false },
        ] } },
        { id: 'reviews', type: 'testimonials', priority: 40, content: { title: '全球用户好评', items: [
          { quote: 'Installation took 5 minutes. Now I control everything from my phone. Amazing!', name: 'David M.', role: '美国 · 已验证购买' },
          { quote: '省电效果出乎意料，第一个月电费降了30%。强烈推荐。', name: '陈先生', role: '中国 · 已验证购买' },
          { quote: 'Der beste Smart-Home-Kauf, den ich je gemacht habe.', name: 'Anna S.', role: '德国 · 已验证购买' },
        ] } },
        { id: 'faq', type: 'faq', priority: 50, content: { title: '购买须知', items: [
          { question: '发货到哪些国家？', answer: '全球配送，欧美主要国家5-10个工作日送达，支持物流追踪。' },
          { question: '是否支持退换货？', answer: '30天无理由退换，质量问题我们承担来回运费。' },
          { question: '需要专业安装吗？', answer: '不需要。所有产品即插即用，App引导3分钟完成配对。' },
        ] } },
        { id: 'footer', type: 'footer', priority: 60, content: { brandName: 'SmartHome', links: [
          { label: '关于我们', href: '/about' }, { label: '隐私政策', href: '/privacy' }, { label: '退换政策', href: '/returns' }, { label: '联系我们', href: '/contact' },
        ], copyright: '© 2026 SmartHome Inc.' } },
      ],
    })),
  },

  {
    nl_input: '做一个教育培训机构官网，hero+课程特色6项+师资介绍4人+学员成果+FAQ+联系试听表单+认证标志',
    domain: 'web_page',
    industry: '教育',
    section_types: ['hero', 'features', 'specs', 'testimonials', 'faq', 'contact_form', 'trust_badges'],
    color_scheme: 'warm-blue-white',
    tone: 'professional-friendly',
    quality_score: 100,
    ir_json: JSON.stringify(ir({
      domain: 'web_page', type: 'landing', industry: '教育', language: 'zh-CN',
      summary: '教育培训机构官网，展示课程体系、师资力量、学员成果，引导试听报名',
      colorScheme: 'warm-blue-white', tone: 'professional-friendly',
      layout: [
        { id: 'hero', type: 'hero', priority: 10, content: { headline: '从零到就业，只需6个月', subheadline: 'Web前端/Java/Python 三大方向 · 小班面授 · 98%就业率 · 就业薪资不达标全额退款', cta: { text: '免费试听', action: 'trial' } } },
        { id: 'features', type: 'features', priority: 20, content: { title: '课程特色', items: [
          { icon: 'code', title: '项目驱动教学', description: '6个月完成4个企业级项目，简历直接写真实项目经验。' },
          { icon: 'users', title: '8人小班面授', description: '每班不超过8人，讲师一对一代码review。' },
          { icon: 'briefcase', title: '就业保障协议', description: '签署就业保障协议，毕业3个月未就业全额退款。' },
          { icon: 'clock', title: '全日制/周末班', description: '全日制周一至周五，周末班周六日全天，灵活选择。' },
          { icon: 'laptop', title: 'Mac/PC实训环境', description: '每人配备iMac开发机，提供全套正版开发工具。' },
          { icon: 'message-circle', title: '终身技术辅导', description: '毕业后仍可免费参加技术分享会，享受终身内推服务。' },
        ] } },
        { id: 'teachers', type: 'specs', priority: 30, content: { title: '核心讲师', columns: 4, items: [
          { label: '张老师', value: '前阿里P7 · 10年Java架构经验 · 专著《Spring实战》作者', icon: 'user' },
          { label: '李老师', value: '前腾讯T3.2 · 8年前端经验 · Vue/React技术栈专家', icon: 'user' },
          { label: '王老师', value: '前字节跳动2-2 · 7年Python/AI经验 · Kaggle大师', icon: 'user' },
          { label: '赵老师', value: '前美团L8 · 12年全栈经验 · 创业公司CTO背景', icon: 'user' },
        ] } },
        { id: 'success', type: 'testimonials', priority: 40, content: { title: '学员就业案例', items: [
          { quote: '从送外卖到进大厂，6个月改变了我的职业轨迹。现在在字节做前端，年薪35万。', name: '刘同学', role: 'Web前端班 · 入职字节跳动' },
          { quote: '老师讲的项目经验太实用了，面试时说得面试官频频点头。拿到了4个offer。', name: '陈同学', role: 'Java班 · 入职美团' },
          { quote: '35岁转行学Python，以为没希望了。结果因为项目经验丰富，反而比应届生有优势。', name: '周同学', role: 'Python班 · 入职科大讯飞' },
        ] } },
        { id: 'faq', type: 'faq', priority: 50, content: { title: '常见问题', items: [
          { question: '零基础可以学吗？', answer: '可以。前2周为基础预科，确保每位同学跟上进度后再进入正式课程。' },
          { question: '就业保障怎么保证？', answer: '入学签署就业保障协议，明确薪资底线，不达标全额退款。8年来98%学员达到目标薪资。' },
          { question: '可以试听吗？', answer: '可以。每周六有免费试听课，联系课程顾问预约即可。' },
        ] } },
        { id: 'trial', type: 'contact_form', priority: 60, content: { title: '预约免费试听', subtitle: '填写信息，课程顾问将在2小时内联系您', fields: [
          { name: 'name', label: '姓名', type: 'text', required: true },
          { name: 'phone', label: '手机号', type: 'tel', required: true },
          { name: 'course', label: '意向课程', type: 'text' },
          { name: 'background', label: '是否有编程基础？', type: 'textarea' },
        ] } },
        { id: 'certs', type: 'trust_badges', priority: 70, content: { title: '资质认证', badges: [
          { name: '教育局办学许可证' }, { name: '工信部认证培训机构' }, { name: '阿里云合作伙伴' }, { name: '腾讯课堂认证' },
        ] } },
      ],
    })),
  },

  {
    nl_input: 'Build a dental clinic website, light blue medical tone, hero+services 6 cards+doctors 4 profiles+patient testimonials+appointment form+insurance badges',
    domain: 'web_page',
    industry: '医疗',
    section_types: ['hero', 'features', 'specs', 'testimonials', 'contact_form', 'trust_badges'],
    color_scheme: 'light-blue-medical',
    tone: 'professional-caring',
    quality_score: 100,
    ir_json: JSON.stringify(ir({
      domain: 'web_page', type: 'landing', industry: '医疗', language: 'en-US',
      summary: 'Dental clinic website with services, doctor profiles, patient reviews, and online booking',
      colorScheme: 'light-blue-medical', tone: 'professional-caring',
      layout: [
        { id: 'hero', type: 'hero', priority: 10, content: { headline: 'Your Smile, Our Passion', subheadline: 'State-of-the-art dental care in a comfortable, welcoming environment. Accepting new patients.', cta: { text: 'Book Appointment', action: 'book' } } },
        { id: 'services', type: 'features', priority: 20, content: { title: 'Our Services', items: [
          { icon: 'smile', title: 'General Dentistry', description: 'Comprehensive exams, cleanings, fillings, and preventive care for the whole family.' },
          { icon: 'star', title: 'Cosmetic Dentistry', description: 'Teeth whitening, veneers, and smile makeovers to give you the confidence you deserve.' },
          { icon: 'tool', title: 'Orthodontics', description: 'Traditional braces and Invisalign clear aligners for teens and adults.' },
          { icon: 'shield', title: 'Periodontics', description: 'Gum disease treatment, deep cleaning, and periodontal maintenance.' },
          { icon: 'zap', title: 'Emergency Care', description: 'Same-day appointments for dental emergencies — toothaches, broken teeth, injuries.' },
          { icon: 'moon', title: 'Sedation Dentistry', description: 'Anxiety-free treatment with oral sedation and nitrous oxide options.' },
        ] } },
        { id: 'doctors', type: 'specs', priority: 30, content: { title: 'Meet Our Doctors', columns: 4, items: [
          { label: 'Dr. Sarah Miller, DDS', value: 'General & Cosmetic Dentistry · UCLA School of Dentistry · 15 years experience', icon: 'user' },
          { label: 'Dr. James Park, DMD', value: 'Orthodontics · Harvard School of Dental Medicine · Invisalign Platinum Provider', icon: 'user' },
          { label: 'Dr. Emily Chen, DDS', value: 'Periodontics · Columbia University · Board Certified · Laser Dentistry Certified', icon: 'user' },
          { label: 'Dr. Michael Brown, DMD', value: 'Oral Surgery · University of Pennsylvania · IV Sedation Certified', icon: 'user' },
        ] } },
        { id: 'testimonials', type: 'testimonials', priority: 40, content: { title: 'Patient Stories', items: [
          { quote: 'I used to be terrified of the dentist. Dr. Miller and her team completely changed that. I actually look forward to my visits now!', name: 'Jessica T.', role: 'Patient since 2020' },
          { quote: 'My Invisalign treatment was smooth and the results are incredible. Dr. Park is a perfectionist in the best way.', name: 'Ryan K.', role: 'Patient since 2022' },
          { quote: 'They fit me in the same day when my crown broke. Professional, caring, and efficient. Highly recommend!', name: 'Maria G.', role: 'Patient since 2019' },
        ] } },
        { id: 'booking', type: 'contact_form', priority: 50, content: { title: 'Schedule Your Visit', subtitle: 'New patient? First exam and X-rays only $99.', fields: [
          { name: 'name', label: 'Full Name', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'phone', label: 'Phone', type: 'tel', required: true },
          { name: 'reason', label: 'Reason for Visit', type: 'textarea' },
        ] } },
        { id: 'insurance', type: 'trust_badges', priority: 60, content: { title: 'We Accept', badges: [
          { name: 'Delta Dental' }, { name: 'Aetna' }, { name: 'Cigna' }, { name: 'MetLife' }, { name: 'Guardian' }, { name: 'CareCredit' },
        ] } },
      ],
    })),
  },

  // ─── slide_deck (3) ──────────────────────────────────────────

  {
    nl_input: '做一个AI创业公司种子轮融资PPT，10页，cover+问题陈述+解决方案+市场规模+竞品对比+商业模式+团队+财务预测+里程碑+结束页',
    domain: 'slide_deck',
    industry: '科技',
    section_types: ['title_slide', 'content_slide', 'bullets_slide', 'content_slide', 'content_slide', 'bullets_slide', 'content_slide', 'bullets_slide', 'content_slide', 'ending_slide'],
    color_scheme: 'dark-blue-tech',
    tone: 'professional-confident',
    quality_score: 100,
    ir_json: JSON.stringify(ir({
      domain: 'slide_deck', type: 'presentation', industry: '科技', language: 'en-US',
      summary: 'Seed round pitch deck for AI startup — 10 slides covering problem, solution, market, team, and financials',
      colorScheme: 'dark-blue-tech', tone: 'professional-confident',
      layout: [
        { id: 'cover', type: 'title_slide', priority: 10, content: { title: 'NexMind AI', subtitle: 'Intelligent Document Processing for Enterprise', presenter: 'Alex Zhang, CEO', date: 'June 2026' } },
        { id: 'problem', type: 'content_slide', priority: 20, content: { title: 'The Problem', body: 'Enterprise knowledge workers spend 30% of their time searching for and processing documents. Manual document processing costs Fortune 500 companies an average of $12M annually in lost productivity and errors.', image: '/slides/doc-chaos.png' } },
        { id: 'solution', type: 'content_slide', priority: 30, content: { title: 'Our Solution', body: 'NexMind AI is an LLM-native document intelligence platform that reads, understands, and processes any enterprise document in seconds — contracts, invoices, reports, emails. 95%+ accuracy, SOC 2 compliant, deploys in days not months.', image: '/slides/product.png' } },
        { id: 'market', type: 'bullets_slide', priority: 40, content: { title: 'Market Opportunity', bullets: [
          'IDP market: $2.1B (2024) → $12.7B (2030), CAGR 35%',
          'Total addressable: 50M+ knowledge workers in US/EU',
          'Initial focus: Legal & Financial services ($4.2B segment)',
          '3 enterprise LOIs signed — $240K in pipeline',
        ] } },
        { id: 'competition', type: 'content_slide', priority: 50, content: { title: 'Why We Win', body: 'Legacy OCR players (ABBYY, Kofax) require template setup per document type — weeks of configuration. Generic LLMs (ChatGPT, Claude) lack enterprise security and workflow automation. NexMind combines LLM-native understanding with enterprise-grade deployment, permission controls, and audit trails.', image: '/slides/competition.png' } },
        { id: 'business', type: 'bullets_slide', priority: 60, content: { title: 'Business Model', bullets: [
          'SaaS subscription: $5K–$25K/mo based on document volume',
          'Implementation fee: $15K–$50K one-time',
          'Target ACV: $60K year 1, expanding to $120K by year 3',
          'Gross margin: 85% (hosted on customer AWS/Azure)',
        ] } },
        { id: 'team', type: 'content_slide', priority: 70, content: { title: 'Team', body: 'Alex Zhang (CEO): Ex-Google AI, Stanford CS PhD. Led document AI team at Google Cloud. Lisa Chen (CTO): Ex-Stripe, 3x engineer. Built ML infra handling $100B+ transactions. Mark Wu (COO): Ex-DocuSign VP Sales, $0→$50M ARR in 4 years.', image: '/slides/team.png' } },
        { id: 'financials', type: 'bullets_slide', priority: 80, content: { title: 'Financial Projections & Ask', bullets: [
          'Raising: $2.5M seed on SAFE',
          'Use of funds: 60% engineering, 25% sales, 15% ops',
          'Year 1 target: $500K ARR, 12 enterprise customers',
          'Year 2 target: $2.5M ARR, 40 customers',
          '18-month runway to Series A',
        ] } },
        { id: 'milestones', type: 'content_slide', priority: 85, content: { title: 'Traction & Milestones', body: 'Q1 2026: MVP shipped, 3 design partners onboarded. Q2 2026: SOC 2 Type II certification, first paid customer ($60K ACV). Q3 2026 target: 10 paying customers, $30K MRR. We are ahead of schedule on all metrics.' } },
        { id: 'end', type: 'ending_slide', priority: 90, content: { title: 'Thank You', message: 'Let\'s make enterprise documents intelligent.', contact: 'alex@nexmind.ai | @alexzhang' } },
      ],
    })),
  },

  {
    nl_input: '做一个新产品发布会PPT，8页，封面+产品亮点+核心技术3页+市场数据+客户案例+发布信息+致谢',
    domain: 'slide_deck',
    industry: '科技',
    section_types: ['title_slide', 'bullets_slide', 'content_slide', 'image_slide', 'bullets_slide', 'quote_slide', 'content_slide', 'ending_slide'],
    color_scheme: 'dark-gradient-purple',
    tone: 'bold-exciting',
    quality_score: 100,
    ir_json: JSON.stringify(ir({
      domain: 'slide_deck', type: 'presentation', industry: '科技', language: 'zh-CN',
      summary: '2026夏季新品发布会，8页展示产品亮点、技术突破和市场策略',
      colorScheme: 'dark-gradient-purple', tone: 'bold-exciting',
      layout: [
        { id: 'cover', type: 'title_slide', priority: 10, content: { title: '突破想象', subtitle: 'Nova X 系列 · 2026夏季新品发布会', presenter: '产品VP 李明', date: '2026年7月15日' } },
        { id: 'highlights', type: 'bullets_slide', priority: 20, content: { title: '三大核心突破', bullets: [
          '自研芯片 Nova A3：AI算力提升400%，功耗降低60%',
          '全域屏：真全面屏，屏下摄像头技术第四代',
          '量子充电：0-100%仅需8分钟，电池寿命延长3倍',
        ] } },
        { id: 'chip', type: 'content_slide', priority: 30, content: { title: 'Nova A3 自研芯片', body: '4nm制程，晶体管密度提升40%。集成NPU 3.0，支持本地运行70亿参数大模型。端侧实时翻译、AI修图、语音助手全部离线可用。', image: '/slides/chip.png' } },
        { id: 'screen', type: 'image_slide', priority: 40, content: { title: '全域屏技术', image: '/slides/fullscreen.png', caption: '第四代屏下摄像头 · 6.8英寸 · 2K+ LTPO · 1-120Hz自适应刷新率' } },
        { id: 'charging', type: 'content_slide', priority: 50, content: { title: '量子充电技术', body: '自研GaN量子充电协议，8分钟充满5000mAh。电池循环寿命2000次后仍保持85%容量。充电安全通过TÜV莱茵认证，支持-20°C低温快充。', image: '/slides/charging.png' } },
        { id: 'market', type: 'bullets_slide', priority: 60, content: { title: '市场数据', bullets: [
          '预售48小时突破50万台，超上代300%',
          '目标用户：25-40岁科技爱好者，TAM约2亿人',
          '定价策略：Nova X ¥3999起，Nova X Pro ¥4999起',
          '首批覆盖30个国家，9月1日正式开售',
        ] } },
        { id: 'testimonial', type: 'quote_slide', priority: 70, content: { quote: 'Nova X的AI体验是目前所有手机中最自然、最实用的，这不是噱头，是真正的生产力工具。', author: '王刚', context: '《数码前线》主编 · 提前体验评测' } },
        { id: 'details', type: 'content_slide', priority: 80, content: { title: '发售信息', body: '7月20日开启全款预售，9月1日全球同步发货。首发权益：免费2年延保 + 独家限定色 + ¥200配件券。线下体验店覆盖全国300+城市，欢迎到店真机体验。' } },
        { id: 'end', type: 'ending_slide', priority: 90, content: { title: '感谢观看', message: 'Nova X — 突破，不止想象', contact: 'nova@tech.com | 400-888-XXXX' } },
      ],
    })),
  },

  {
    nl_input: '做一个企业内部安全培训课件，10页，封面+培训目标+安全事故数据+安全规范5条+案例分析2个+违规后果+考试要点+总结+感谢',
    domain: 'slide_deck',
    industry: '企业',
    section_types: ['title_slide', 'bullets_slide', 'content_slide', 'bullets_slide', 'content_slide', 'bullets_slide', 'bullets_slide', 'content_slide', 'ending_slide'],
    color_scheme: 'orange-dark-safety',
    tone: 'serious-authoritative',
    quality_score: 100,
    ir_json: JSON.stringify(ir({
      domain: 'slide_deck', type: 'presentation', industry: '企业', language: 'zh-CN',
      summary: '企业内部安全生产培训课件，覆盖安全规范、案例分析和考试要点',
      colorScheme: 'orange-dark-safety', tone: 'serious-authoritative',
      layout: [
        { id: 'cover', type: 'title_slide', priority: 10, content: { title: '安全生产培训', subtitle: '2026年度全员安全教育培训', presenter: '安全管理部', date: '2026年6月' } },
        { id: 'objectives', type: 'bullets_slide', priority: 20, content: { title: '培训目标', bullets: [
          '了解2026年最新安全生产法规要求',
          '掌握本岗位安全操作规程和应急处置方法',
          '通过培训考核，考核不合格者须补考通过后方可上岗',
        ] } },
        { id: 'data', type: 'content_slide', priority: 30, content: { title: '警钟长鸣', body: '2026年上半年全国发生生产安全事故906起，死亡957人。其中高处坠落占50%，物体打击占20-25%，坍塌占10-18%。90%以上的事故直接原因是违章操作。每一起事故背后都有家庭破碎。', image: '/slides/safety-data.png' } },
        { id: 'rules', type: 'bullets_slide', priority: 40, content: { title: '五大安全红线', bullets: [
          '红线一：高处作业必须系挂安全带，做到"高挂低用"',
          '红线二：动火作业必须办理动火证，配备灭火器材和监护人',
          '红线三：进入受限空间必须先检测、后通风、再作业、有监护',
          '红线四：吊装作业下方严禁站人，必须设置警戒区域',
          '红线五：临时用电必须三级配电两级保护，严禁私拉乱接',
        ] } },
        { id: 'case1', type: 'content_slide', priority: 50, content: { title: '案例一：未系安全带坠落事故', body: '2025年8月，某工地架子工李某在6米高处作业时未系挂安全带，踩空坠落后经抢救无效死亡。直接原因：违反高处作业安全规程。间接原因：班组长未检查安全带佩戴情况，安全员巡查不到位。企业被罚款120万元，项目负责人被追究刑事责任。', image: '/slides/case1.png' } },
        { id: 'case2', type: 'content_slide', priority: 55, content: { title: '案例二：受限空间中毒事故', body: '2025年11月，某化工厂3名工人未检测气体即进入反应釜清理，硫化氢中毒。1名工友盲目施救也中毒。最终2死2伤。教训：受限空间作业必须"先通风、再检测、后作业"，且必须配备呼吸器和监护人。', image: '/slides/case2.png' } },
        { id: 'consequences', type: 'bullets_slide', priority: 60, content: { title: '违规后果', bullets: [
          '个人：轻则罚款扣绩效，重则解除劳动合同、追究刑事责任',
          '班组：全班连带处罚，班组长撤职',
          '企业：罚款/停产整顿/降低资质等级/吊销许可证',
          '家庭：事故伤害是不可逆的，你的安全是全家的牵挂',
        ] } },
        { id: 'exam', type: 'bullets_slide', priority: 70, content: { title: '考核要点', bullets: [
          '五大安全红线内容（必考，错一题不合格）',
          '本岗位安全操作规程（岗位专项题）',
          '应急处置流程：报警→疏散→救援→报告',
          '考试时间：6月20日-25日，满分100分，80分合格',
        ] } },
        { id: 'summary', type: 'content_slide', priority: 80, content: { title: '安全第一，生命至上', body: '安全不是口号，是每一天、每一次作业的习惯。进入现场先看风险，作业之前先想安全。对自己负责、对家人负责、对工友负责。你的每一个安全动作，都是在保护生命。' } },
        { id: 'end', type: 'ending_slide', priority: 90, content: { title: '谢谢大家', message: '安全是回家最近的路', contact: '安全管理部 · 内线 8888' } },
      ],
    })),
  },

  // ─── document (3) ────────────────────────────────────────────

  {
    nl_input: '写一份智能门锁产品说明书，含产品概述+技术参数表+安装步骤+使用说明+故障排除+售后服务',
    domain: 'document',
    industry: '制造',
    section_types: ['document_title', 'toc', 'chapter', 'doc_table', 'chapter', 'body', 'body', 'chapter'],
    color_scheme: 'clean-white',
    tone: 'instructional-neutral',
    quality_score: 100,
    ir_json: JSON.stringify(ir({
      domain: 'document', type: 'manual', industry: '制造', language: 'zh-CN',
      summary: '智能门锁SL-1000产品说明书，包含安装、使用和故障排除指南',
      colorScheme: 'clean-white', tone: 'instructional-neutral',
      layout: [
        { id: 'title', type: 'document_title', priority: 10, content: { title: 'SmartLock SL-1000 智能门锁', subtitle: '产品说明书 V3.2', date: '2026年6月' } },
        { id: 'toc', type: 'toc', priority: 20, content: { title: '目录' } },
        { id: 'overview', type: 'chapter', priority: 30, content: { number: 1, title: '产品概述' } },
        { id: 'overview_body', type: 'body', priority: 31, content: { text: 'SmartLock SL-1000 是一款支持指纹、密码、IC卡、手机App、机械钥匙五种开锁方式的智能门锁。采用C级锁芯、半导体指纹传感器、256位AES加密通信，通过公安部GA 374-2019和GA 701-2007检测认证。\n\n产品特点：\n- 指纹识别速度 <0.3秒，拒真率 <0.01%\n- 支持虚位密码（最长20位，防止窥视）\n- 低电量报警 + 应急供电（Micro USB）\n- 防撬报警 + 试错锁定 + 高温报警\n- 支持华为HiLink / 小米米家双平台', format: 'markdown' } },
        { id: 'specs', type: 'doc_table', priority: 40, content: { title: '技术参数', headers: ['参数', '规格'], rows: [
          ['产品型号', 'SL-1000 / SL-1000 Pro'],
          ['外壳材质', '锌合金 + 钢化玻璃面板'],
          ['指纹传感器', '半导体电容式 (FPC 508 DPI)'],
          ['指纹容量', '100枚（管理员10枚 + 普通用户90枚）'],
          ['密码容量', '50组（支持虚位密码）'],
          ['IC卡容量', '100张（支持M1卡/CPU卡）'],
          ['供电方式', '8节AA电池（续航约12个月）'],
          ['应急供电', 'Micro USB 5V/1A'],
          ['工作温度', '-25°C ~ 70°C'],
          ['锁芯等级', 'C级（国标最高等级）'],
          ['门厚度要求', '38mm ~ 120mm'],
          ['无线连接', '蓝牙5.0 + Wi-Fi (Pro版)'],
        ] } },
        { id: 'install', type: 'chapter', priority: 50, content: { number: 2, title: '安装步骤' } },
        { id: 'install_steps', type: 'body', priority: 51, content: { text: '1. 确认门厚在38-120mm之间，门框无变形\n2. 根据安装模板在门上开孔（附送开孔图纸）\n3. 安装锁体：将锁体放入门侧槽，螺丝固定\n4. 安装外面板：将连接线穿过门孔，外面板对准锁体\n5. 安装内面板：连接排线，固定螺丝，安装电池\n6. 安装门框扣板：对准锁舌位置，螺丝固定\n7. 通电测试：装入电池，检查指纹/密码/机械钥匙是否正常\n\n⚠️ 注意：安装前务必断开旧锁电源（如有），建议由专业锁匠安装。', format: 'markdown' } },
        { id: 'usage', type: 'chapter', priority: 60, content: { number: 3, title: '使用说明' } },
        { id: 'usage_body', type: 'body', priority: 61, content: { text: '**添加指纹**：管理员指纹验证 → 按"*"进入菜单 → 选择"添加用户" → 选择"指纹" → 手指按传感器6次 → 保存成功。\n\n**添加密码**：管理员验证 → 菜单 → 添加用户 → 密码 → 输入6-10位密码 → 重复确认 → 保存。\n\n**虚位密码**：在真实密码前后加任意数字（最长20位），防止他人窥视。例如真实密码123456，可输入88771234569823。\n\n**应急开锁**：电池耗尽时，用Micro USB充电宝连接外面板底部应急供电口，等待10秒后正常开锁。\n\n**恢复出厂**：拆下内面板电池盖，长按Reset键5秒，所有数据清除。', format: 'markdown' } },
        { id: 'troubleshoot', type: 'chapter', priority: 70, content: { number: 4, title: '故障排除' } },
        { id: 'trouble_body', type: 'body', priority: 71, content: { text: '| 现象 | 可能原因 | 解决方法 |\n|------|---------|----------|\n| 指纹不识别 | 手指潮湿/脏污/磨损 | 擦干手指，换用密码开锁，重新录入指纹 |\n| 门锁无反应 | 电池耗尽 | 使用Micro USB应急供电，立即更换电池 |\n| 门锁报警长响 | 被撬动触发报警 | 检查门锁是否被破坏，用管理员指纹解除报警 |\n| 密码被锁定 | 连续输入错误5次 | 等待3分钟自动解锁，或用指纹/钥匙开锁 |\n| App连接失败 | 蓝牙未开/距离过远 | 靠近门锁，检查手机蓝牙是否开启 |\n| 机械钥匙转不动 | 锁芯缺油/钥匙磨损 | 使用备用钥匙，加注锁芯润滑剂 |', format: 'markdown' } },
        { id: 'service', type: 'chapter', priority: 80, content: { number: 5, title: '售后服务' } },
        { id: 'service_body', type: 'body', priority: 81, content: { text: '**保修政策**：整机保修3年，指纹模块保修5年。人为损坏不在保修范围内。\n\n**客服热线**：400-888-XXXX（7×24小时）\n\n**官方渠道**：微信公众号"SmartLock智能锁" / 官网 www.smartlock.com / 全国3000+授权服务网点\n\n**退换政策**：7天无理由退换（包装完整、无人为损坏），30天内质量问题免费换新。', format: 'markdown' } },
      ],
    })),
  },

  {
    nl_input: 'Write a technical report on Q2 2026 cloud infrastructure performance, with executive summary, uptime stats table, incident analysis, cost optimization findings, and recommendations',
    domain: 'document',
    industry: '科技',
    section_types: ['document_title', 'chapter', 'body', 'doc_table', 'chapter', 'body', 'chapter'],
    color_scheme: 'clean-white',
    tone: 'professional-data-driven',
    quality_score: 100,
    ir_json: JSON.stringify(ir({
      domain: 'document', type: 'report', industry: '科技', language: 'en-US',
      summary: 'Q2 2026 cloud infrastructure performance technical report',
      colorScheme: 'clean-white', tone: 'professional-data-driven',
      layout: [
        { id: 'title', type: 'document_title', priority: 10, content: { title: 'Q2 2026 Cloud Infrastructure Performance Report', subtitle: 'Confidential — Infrastructure Engineering Team', author: 'SRE Team', date: 'July 2026' } },
        { id: 'exec_summary', type: 'chapter', priority: 20, content: { number: 1, title: 'Executive Summary' } },
        { id: 'summary_body', type: 'body', priority: 21, content: { text: 'Q2 2026 achieved 99.97% overall uptime across all regions, an improvement from 99.94% in Q1. The Frankfurt and Singapore regions achieved 99.99% with zero critical incidents. US-East experienced two P1 incidents (total 4h 12min downtime) due to a cascade failure in the load balancer tier. Infrastructure costs decreased 12% QoQ driven by spot instance adoption and reserved instance optimization. This report details the incidents, root causes, corrective actions, and cost optimization findings.', format: 'markdown' } },
        { id: 'uptime_table', type: 'doc_table', priority: 30, content: { title: 'Regional Uptime — Q2 2026', headers: ['Region', 'Uptime %', 'P1 Incidents', 'P2 Incidents', 'Total Downtime', 'vs Q1'], rows: [
          ['US-East', '99.96%', '2', '7', '4h 12min', '-0.01%'],
          ['US-West', '99.98%', '0', '3', '52min', '+0.01%'],
          ['EU-Frankfurt', '99.99%', '0', '1', '14min', '±0%'],
          ['EU-Ireland', '99.97%', '1', '4', '1h 38min', '+0.02%'],
          ['AP-Singapore', '99.99%', '0', '2', '22min', '+0.01%'],
          ['AP-Tokyo', '99.95%', '1', '5', '3h 05min', '-0.02%'],
        ] } },
        { id: 'incidents', type: 'chapter', priority: 40, content: { number: 2, title: 'P1 Incident Analysis' } },
        { id: 'incident_body', type: 'body', priority: 41, content: { text: '**Incident #1427 — US-East Load Balancer Cascade Failure**\n- Date: May 12, 2026 | Duration: 3h 18min | Severity: P1\n- Root Cause: A configuration push to the load balancer fleet contained an invalid TLS certificate path. The fleet health check failed progressively, causing traffic redistribution that overloaded remaining healthy instances.\n- Impact: 23% of US-East customers experienced degraded service. No data loss.\n- Corrective Actions: (1) Implement canary deployment for LB config changes (2) Add automatic rollback trigger when health check failure rate exceeds 10% (3) Increase LB fleet over-provisioning from 30% to 50%.\n\n**Incident #1435 — Tokyo Database Connection Pool Exhaustion**\n- Date: June 3, 2026 | Duration: 47min | Severity: P1\n- Root Cause: A slow query introduced by a schema migration consumed all connection pool slots, blocking new connections.\n- Impact: Tokyo region read replicas unresponsive for 47min. Primary DB unaffected.\n- Corrective Actions: (1) Add statement_timeout enforcement per connection pool (2) Pre-production query plan analysis required for all migrations (3) Implement circuit breaker pattern for connection pool exhaustion.', format: 'markdown' } },
        { id: 'cost', type: 'chapter', priority: 50, content: { number: 3, title: 'Cost Optimization' } },
        { id: 'cost_body', type: 'body', priority: 51, content: { text: '**Q2 Savings: $487K (12% QoQ reduction)**\n\n1. Spot Instance Expansion: Migrated 65% of stateless workloads to spot instances (was 40%), saving $210K/quarter. Risk mitigated by multi-AZ diversification and graceful shutdown handling.\n2. Reserved Instance Optimization: Converted expiring 1-year RIs to 3-year terms for stable workloads, saving $155K/quarter.\n3. Storage Tiering: Implemented S3 Intelligent-Tiering for log archives and backups, saving $72K/quarter.\n4. Rightsizing: Automated right-sizing recommendations applied to 120 underutilized instances, saving $50K/quarter.\n\n**Q3 Target**: Additional $200K savings through Graviton migration (ARM-based instances) and cross-region data transfer optimization.', format: 'markdown' } },
      ],
    })),
  },

  {
    nl_input: '写一份建筑公司对外宣传册，含公司概况+资质荣誉+代表工程6个+技术优势+企业文化+联系方式',
    domain: 'document',
    industry: '建筑',
    section_types: ['document_title', 'chapter', 'body', 'doc_image', 'doc_table', 'body'],
    color_scheme: 'warm-gray-professional',
    tone: 'authoritative-reliable',
    quality_score: 100,
    ir_json: JSON.stringify(ir({
      domain: 'document', type: 'brochure', industry: '建筑', language: 'zh-CN',
      summary: '建筑公司对外宣传册，展示资质、代表工程和技术实力',
      colorScheme: 'warm-gray-professional', tone: 'authoritative-reliable',
      layout: [
        { id: 'title', type: 'document_title', priority: 10, content: { title: '城建集团有限公司', subtitle: '品质筑城 · 诚信建业', date: '2026年' } },
        { id: 'about', type: 'chapter', priority: 20, content: { number: 1, title: '公司概况' } },
        { id: 'about_body', type: 'body', priority: 21, content: { text: '城建集团有限公司成立于1998年，注册资金5亿元，具有建筑工程施工总承包特级资质、市政公用工程施工总承包一级资质、钢结构工程专业承包一级资质。\n\n公司现有员工3200余人，其中高级工程师86人、一级建造师120人、注册安全工程师45人。拥有各类施工机械设备1200余台（套），年施工能力超过500万平方米。\n\n28年来，累计承建项目860余个，竣工面积超8000万平方米，工程合格率100%，获鲁班奖4项、国家优质工程奖12项、省优工程奖80余项。', format: 'markdown' } },
        { id: 'honors', type: 'doc_table', priority: 30, content: { title: '资质与荣誉', headers: ['类别', '资质/荣誉'], rows: [
          ['施工资质', '建筑工程施工总承包 特级'],
          ['施工资质', '市政公用工程施工总承包 一级'],
          ['施工资质', '钢结构工程专业承包 一级'],
          ['施工资质', '建筑装修装饰工程专业承包 一级'],
          ['设计资质', '建筑行业（建筑工程）甲级'],
          ['质量奖项', '鲁班奖 4项 (2015/2018/2021/2024)'],
          ['质量奖项', '国家优质工程奖 12项'],
          ['安全荣誉', '全国AAA级安全文明标准化工地 20个'],
          ['企业荣誉', '全国建筑业先进企业'],
          ['企业荣誉', '全国重合同守信用企业'],
        ] } },
        { id: 'projects', type: 'doc_image', priority: 40, content: { src: '/images/projects-collage.jpg', alt: '代表工程一览', caption: '代表工程：城市之心（超高层·320m）、滨江金融中心、奥体中心体育馆、高铁新城TOD、高新区产业园、湖畔华庭住宅区' } },
        { id: 'tech', type: 'chapter', priority: 50, content: { number: 2, title: '技术优势' } },
        { id: 'tech_body', type: 'body', priority: 51, content: { text: '**BIM全过程应用**：所有项目全面应用BIM技术，实现设计施工一体化。自主研发企业级BIM管理平台，累计完成BIM项目120个，获国家级BIM大赛奖项15项。\n\n**装配式建筑**：拥有PC构件生产基地3个，年产能30万立方米。装配式建筑实施项目超200万平方米，装配率最高达76%。\n\n**绿色施工**：全面推行绿色施工标准，获绿色施工示范工程40余项，施工现场扬尘控制、噪音控制、节水节能技术行业领先。\n\n**智能建造**：2024年引入建筑机器人（砌筑/抹灰/喷涂）和无人机巡检系统，施工效率提升30%，人工成本降低20%。', format: 'markdown' } },
        { id: 'contact', type: 'chapter', priority: 60, content: { number: 3, title: '联系我们' } },
        { id: 'contact_body', type: 'body', priority: 61, content: { text: '地址：上海市浦东新区XX路888号城建大厦\n电话：021-XXXX-XXXX\n邮箱：info@chengjian.com\n官网：www.chengjian.com\n微信公众号：城建集团', format: 'markdown' } },
      ],
    })),
  },

  // ─── ecommerce_content (3) ────────────────────────────────────

  {
    nl_input: '写一个无线降噪耳机产品详情页文案，强调音质和续航，带5个卖点+技术参数+SEO元数据',
    domain: 'ecommerce_content',
    industry: '电商',
    section_types: ['product_description', 'seo_meta'],
    color_scheme: 'dark-tech',
    tone: 'friendly-expert',
    quality_score: 100,
    ir_json: JSON.stringify(ir({
      domain: 'ecommerce_content', type: 'product_page', industry: '电商', language: 'zh-CN',
      summary: '无线降噪耳机产品详情页，突出音质、续航和降噪能力',
      colorScheme: 'dark-tech', tone: 'friendly-expert',
      layout: [
        { id: 'product', type: 'product_description', priority: 10, content: { headline: 'QuietPro X1 · 听见安静的力量', selling_points: [
          '殿堂级降噪：自适应ANC 3.0技术，降噪深度达-48dB，地铁/飞机/咖啡馆一键切换降噪模式',
          'Hi-Res金标音质：40mm镀铍振膜 + LDAC传输，频响范围4Hz-40kHz，还原录音室级别的细节',
          '70小时超长续航：ANC开启50小时，ANC关闭70小时，充电5分钟畅听3小时',
          '通话降噪黑科技：6麦克风阵列 + AI骨传导拾音，嘈杂环境下对方仍能听清你的声音',
          '极致舒适：仅重250g，蛋白皮耳罩 + 记忆海绵，佩戴4小时无压感',
        ], specs: [
          { label: '驱动单元', value: '40mm 镀铍动圈' },
          { label: '降噪深度', value: '-48dB (自适应ANC 3.0)' },
          { label: '续航', value: '50h(ANC开) / 70h(ANC关)' },
          { label: '充电', value: 'USB-C · 5分钟=3小时' },
          { label: '蓝牙', value: '5.4 · 支持LDAC/AAC/SBC' },
          { label: '重量', value: '250g' },
          { label: '配色', value: '午夜黑 / 星光银 / 雾霾蓝' },
        ], price: '¥899', cta: '立即购买', tone: 'friendly expert' } },
        { id: 'seo', type: 'seo_meta', priority: 20, content: { title_tag: 'QuietPro X1 无线降噪耳机 | 48dB深度降噪 70小时续航', meta_description: 'QuietPro X1旗舰无线降噪耳机，自适应ANC 3.0降噪深度达-48dB，Hi-Res金标音质，70小时超长续航。京东/天猫旗舰店同步发售，享30天无忧试用。', json_ld: '{"@type":"Product","name":"QuietPro X1 无线降噪耳机","description":"旗舰级自适应降噪耳机","offers":{"@type":"Offer","price":"899","priceCurrency":"CNY"}}' } },
      ],
    })),
  },

  {
    nl_input: 'Create a brand launch campaign for a sustainable fashion label: brand story + launch email + Instagram post + SEO meta',
    domain: 'ecommerce_content',
    industry: '时尚',
    section_types: ['brand_story', 'marketing_email', 'social_post', 'seo_meta'],
    color_scheme: 'earth-warm',
    tone: 'authentic-conscious',
    quality_score: 100,
    ir_json: JSON.stringify(ir({
      domain: 'ecommerce_content', type: 'campaign', industry: '时尚', language: 'en-US',
      summary: 'Brand launch campaign for sustainable fashion label — story, email, social, and SEO',
      colorScheme: 'earth-warm', tone: 'authentic-conscious',
      layout: [
        { id: 'story', type: 'brand_story', priority: 10, content: { headline: 'THREAD · Fashion That Doesn\'t Cost the Earth', narrative: 'THREAD was born from a simple question: can fashion be beautiful without being destructive? Our founder, Maya Lin, spent 5 years in fast fashion supply chains before walking away to build something better. Every THREAD garment is made from certified organic cotton, recycled ocean plastics, or TENCEL™ lyocell — materials that regenerate instead of deplete. Our supply chain is 100% transparent, from farm to finished garment. We pay living wages, we measure our carbon footprint, and we\'re Climate Neutral Certified. No greenwashing. No compromises. Just clothes you can feel good about wearing.', values: ['Radical Transparency', 'Circular by Design', 'Living Wages', 'Climate Neutral', 'Timeless, Not Trendy'], origin: 'Founded 2026 in Portland, Oregon' } },
        { id: 'email', type: 'marketing_email', priority: 20, content: { subject: 'Introducing THREAD — fashion that gives back', preheader: 'Beautiful clothes. Zero guilt. Meet your new favorite brand.', body: 'Hi {name},\n\nWe\'re THREAD, and we think fashion should make you feel good — not just about how you look, but about the impact you\'re making.\n\nEvery THREAD piece is made from planet-positive materials, in factories that pay living wages, with a supply chain you can trace from seed to stitch. \n\nOur first collection drops next Tuesday at 10am EST. As a launch insider, you get:\n→ Early access 24 hours before the public\n→ 15% off your first order with code THREAD15\n→ Free carbon-neutral shipping + free returns\n\nSee you on Tuesday.\n\nWith care,\nMaya & the THREAD team', cta_text: 'Shop the Lookbook', cta_link: 'https://wearthread.com/lookbook' } },
        { id: 'social', type: 'social_post', priority: 30, content: { caption: 'Fashion shouldn\'t come at the planet\'s expense. After 2 years of building, we\'re thrilled to introduce @wearthread — the sustainable fashion label where every piece tells a story of regeneration, not destruction. 🌍 First collection drops June 20. Link in bio to join early access.', hashtags: ['SustainableFashion', 'SlowFashion', 'EthicalStyle', 'ThreadLaunch', 'WearTheChange'], image_description: 'Model wearing our signature organic cotton wrap dress in natural dye terracotta, standing in a wildflower field', link: 'https://wearthread.com/launch' } },
        { id: 'seo', type: 'seo_meta', priority: 40, content: { title_tag: 'THREAD | Sustainable Fashion — Organic, Ethical, Carbon Neutral', meta_description: 'THREAD makes sustainable fashion that doesn\'t compromise on style. Organic cotton, recycled materials, transparent supply chain, Climate Neutral Certified. Shop our debut collection.', json_ld: '{"@type":"Brand","name":"THREAD","description":"Sustainable fashion label using organic and recycled materials with transparent supply chain","slogan":"Fashion That Doesn\'t Cost the Earth"}' } },
      ],
    })),
  },

  {
    nl_input: '做一个618大促全渠道营销文案包：产品促销文案+营销邮件+小红书帖子+SEO落地页元数据',
    domain: 'ecommerce_content',
    industry: '电商',
    section_types: ['product_description', 'marketing_email', 'social_post', 'seo_meta'],
    color_scheme: 'festive-red-gold',
    tone: 'urgent-exciting',
    quality_score: 100,
    ir_json: JSON.stringify(ir({
      domain: 'ecommerce_content', type: 'campaign', industry: '电商', language: 'zh-CN',
      summary: '618大促全渠道营销文案，覆盖产品页、邮件、社交和搜索',
      colorScheme: 'festive-red-gold', tone: 'urgent-exciting',
      layout: [
        { id: 'product', type: 'product_description', priority: 10, content: { headline: '618狂欢 · 年度最低价', selling_points: [
          '限时直降：全场低至5折，叠加每满300减50，上不封顶',
          '前100名福利：下单即送价值¥299限量礼盒，含定制周边+VIP延保卡',
          '价保618：买贵退差价，30天无理由退换，0风险购物',
          '会员专属：Plus会员额外享95折，积分翻倍，免运费',
        ], price: '¥199 起', cta: '立即抢购', tone: 'urgent exciting' } },
        { id: 'email', type: 'marketing_email', priority: 20, content: { subject: '🔥 618终极攻略 | 你的专属优惠已到账，手慢无！', preheader: '全场5折起 + 满300减50 + 前100名赠礼盒', body: 'Hi {name}，\n\n618大战已经打响，我们为你准备了专属福利清单：\n\n🎁 福利一：全场低至5折，叠加每满300减50\n🎁 福利二：前100名下单送价值¥299限量礼盒\n🎁 福利三：Plus会员额外享95折 + 双倍积分\n\n⏰ 活动时间：即日起至6月20日24:00\n🚚 所有订单48小时内发货，全国包邮\n\nP.S. 爆款库存告急，建议现在就下手！\n\n祝购物愉快！', cta_text: '进入618主会场', cta_link: 'https://shop.com/618' } },
        { id: 'social', type: 'social_post', priority: 30, content: { caption: '618攻略来啦！🗓️ 整理了今年最值得买的清单，这个价格真的可以闭眼冲👇\n\nTop 3 必入：\n① 爆款无线耳机 ¥449（原价¥899）\n② 智能手表 ¥699（原价¥1299）\n③ 便携投影仪 ¥1299（原价¥2499）\n\n💡省钱小技巧：先领券再下单，叠加满减更划算！\n\n评论区说说你最想买啥？抽3个宝子送限量礼盒～', hashtags: ['618购物节', '618攻略', '好物推荐', '省钱攻略', '限时抢购'], image_description: '618主会场商品拼图，红色背景金色字体，突出5折和满减信息', link: 'https://shop.com/618' } },
        { id: 'seo', type: 'seo_meta', priority: 40, content: { title_tag: '618大促 | 全场5折起 满300减50 前100名赠礼盒 | 品牌旗舰店', meta_description: '618年中大促，品牌旗舰店全场5折起，每满300减50，前100名下单赠价值¥299限量礼盒。价保618买贵退差价，30天无理由退换。', json_ld: '{"@type":"WebSite","name":"品牌旗舰店","url":"https://shop.com","potentialAction":{"@type":"SearchAction","target":"https://shop.com/search?q={search_term_string}","query-input":"required name=search_term_string"}}' } },
      ],
    })),
  },

  // ─── business_report (3) ─────────────────────────────────────

  {
    nl_input: '做一个2026年上半年经营分析报告，含执行摘要+6个KPI指标+收入差异分析+成本差异分析+4条建议',
    domain: 'business_report',
    industry: '企业',
    section_types: ['executive_summary', 'kpi_table', 'variance_analysis', 'recommendations'],
    color_scheme: 'corporate-blue',
    tone: 'professional-analytical',
    quality_score: 100,
    ir_json: JSON.stringify(ir({
      domain: 'business_report', type: 'report', industry: '企业', language: 'zh-CN',
      summary: '2026年上半年经营分析，对比目标与实际，分析差异原因并给出改进建议',
      colorScheme: 'corporate-blue', tone: 'professional-analytical',
      layout: [
        { id: 'summary', type: 'executive_summary', priority: 10, content: { title: '执行摘要', key_finding: 'H1 2026营收完成率92%，未达成主因是Q2新品上市延迟。毛利率超预期1.2个百分点，净利润率达成96%，整体经营质量健康。', metrics: [
          { label: '营收', value: '¥2.76亿', change: '-8% vs 目标' },
          { label: '毛利率', value: '48.2%', change: '+1.2pp vs 目标' },
          { label: '净利润', value: '¥3,850万', change: '-4% vs 目标' },
          { label: '经营现金流', value: '¥4,200万', change: '+15% vs 目标' },
        ], conclusion: 'Q3重点：加速新品上市、拓展线上渠道、优化供应链成本。全年目标维持不变。' } },
        { id: 'kpi', type: 'kpi_table', priority: 20, content: { title: '核心KPI达成情况', items: [
          { kpi: '营业收入', current: '¥2.76亿', target: '¥3.0亿', status: 'at_risk' },
          { kpi: '毛利率', current: '48.2%', target: '47%', status: 'on_track' },
          { kpi: '净利润率', current: '13.9%', target: '14.5%', status: 'at_risk' },
          { kpi: '客户满意度(NPS)', current: '72', target: '70', status: 'on_track' },
          { kpi: '新客户获取', current: '186', target: '200', status: 'at_risk' },
          { kpi: '员工留存率', current: '91%', target: '88%', status: 'on_track' },
        ] } },
        { id: 'revenue_variance', type: 'variance_analysis', priority: 30, content: { title: '收入差异分析', period_a: 'H1 2026 目标', period_b: 'H1 2026 实际', items: [
          { metric: '产品线A收入', value_a: '¥1.5亿', value_b: '¥1.42亿', delta: '-5.3%', explanation: '老品销量稳定，但Q2新品延迟上市导致增量不足' },
          { metric: '产品线B收入', value_a: '¥1.0亿', value_b: '¥0.92亿', delta: '-8.0%', explanation: '友商Q1降价抢占市场份额，我方未及时调整价格策略' },
          { metric: '服务收入', value_a: '¥0.5亿', value_b: '¥0.42亿', delta: '-16.0%', explanation: '2个大客户续约推迟至Q3，预计7月签约' },
        ] } },
        { id: 'cost_variance', type: 'variance_analysis', priority: 35, content: { title: '成本差异分析', period_a: 'H1 2026 预算', period_b: 'H1 2026 实际', items: [
          { metric: '原材料成本', value_a: '¥1.05亿', value_b: '¥0.96亿', delta: '-8.6%', explanation: '供应链优化谈判使采购成本下降，铜/铝价格回落' },
          { metric: '人力成本', value_a: '¥0.42亿', value_b: '¥0.43亿', delta: '+2.4%', explanation: 'Q2新招技术团队8人，略超预算但在计划内' },
          { metric: '营销费用', value_a: '¥0.25亿', value_b: '¥0.22亿', delta: '-12.0%', explanation: '部分线下活动转为线上，ROI提升但覆盖量下降' },
        ] } },
        { id: 'recs', type: 'recommendations', priority: 40, content: { title: '改进建议', items: [
          { recommendation: '加速新品上市：成立专项项目组，将Q3新品上市时间从9月提前至8月中旬', priority: 'high', rationale: 'H1营收缺口主要来自新品延迟，提前上市可追回大部分缺口' },
          { recommendation: '动态定价策略：建立竞品价格监控系统，授权销售总监在±10%范围内灵活调价', priority: 'high', rationale: '产品线B因价格未及时调整损失了约¥800万收入' },
          { recommendation: '大客户专项跟进：由VP带队拜访延迟续约的2个大客户，7月底前签署合同', priority: 'high', rationale: '这2个客户贡献服务收入的35%，延迟续约影响显著' },
          { recommendation: '线上渠道扩建：Q3增加抖音/小红书直播渠道，目标线上收入占比从25%提升至35%', priority: 'medium', rationale: '线上渠道毛利率比线下高5个百分点，且增速更快' },
        ] } },
      ],
    })),
  },

  {
    nl_input: 'Generate a SaaS quarterly business review: executive summary + 5 KPIs + ARR variance analysis + churn analysis + 3 strategic recommendations',
    domain: 'business_report',
    industry: 'SaaS',
    section_types: ['executive_summary', 'kpi_table', 'variance_analysis', 'recommendations'],
    color_scheme: 'modern-blue',
    tone: 'data-driven-strategic',
    quality_score: 100,
    ir_json: JSON.stringify(ir({
      domain: 'business_report', type: 'report', industry: 'SaaS', language: 'en-US',
      summary: 'Q2 2026 SaaS quarterly business review with KPIs, variance analysis, and strategic recommendations',
      colorScheme: 'modern-blue', tone: 'data-driven-strategic',
      layout: [
        { id: 'summary', type: 'executive_summary', priority: 10, content: { title: 'Q2 2026 Executive Summary', key_finding: 'ARR reached $8.4M (+18% QoQ), surpassing the $8M target. Net revenue retention improved to 125% (target: 120%). Customer acquisition missed target by 8% due to longer enterprise sales cycles, partially offset by higher ACV. The platform now serves 340 customers across 12 countries.', metrics: [
          { label: 'ARR', value: '$8.4M', change: '+18% QoQ' },
          { label: 'Net Revenue Retention', value: '125%', change: '+5pp vs target' },
          { label: 'New Customers', value: '46', change: '-8% vs target' },
          { label: 'Gross Margin', value: '82%', change: 'stable' },
          { label: 'Cash Runway', value: '28 months', change: '+4 months' },
        ], conclusion: 'Growth remains strong with improving unit economics. Q3 focus: accelerate enterprise pipeline, launch PLG motion, expand EU market.' } },
        { id: 'kpis', type: 'kpi_table', priority: 20, content: { title: 'Key Performance Indicators', items: [
          { kpi: 'ARR', current: '$8.4M', target: '$8.0M', status: 'on_track' },
          { kpi: 'Net Revenue Retention', current: '125%', target: '120%', status: 'on_track' },
          { kpi: 'CAC Payback (months)', current: '14', target: '12', status: 'at_risk' },
          { kpi: 'New Customers', current: '46', target: '50', status: 'at_risk' },
          { kpi: 'Logo Churn Rate', current: '2.1%', target: '2.5%', status: 'on_track' },
        ] } },
        { id: 'arr_variance', type: 'variance_analysis', priority: 30, content: { title: 'ARR Growth Analysis', period_a: 'Q1 2026', period_b: 'Q2 2026', items: [
          { metric: 'Starting ARR', value_a: '$7.12M', value_b: '$7.12M', delta: '—', explanation: 'Baseline from Q1 close' },
          { metric: 'New Customer ARR', value_a: '$0.68M', value_b: '$0.82M', delta: '+$140K', explanation: 'Fewer logos but higher ACV — average deal size grew from $14.8K to $17.8K' },
          { metric: 'Expansion ARR', value_a: '$0.45M', value_b: '$0.68M', delta: '+$230K', explanation: 'Seat expansion + 2 upsells to Enterprise tier drove strong NRR' },
          { metric: 'Churned ARR', value_a: '-$0.25M', value_b: '-$0.22M', delta: '+$30K', explanation: 'Churn improved slightly; 2 logo losses but 1 was small contract' },
        ] } },
        { id: 'recs', type: 'recommendations', priority: 40, content: { title: 'Strategic Recommendations for Q3', items: [
          { recommendation: 'Launch PLG (Product-Led Growth) motion with a freemium tier to accelerate top-of-funnel and reduce CAC payback from 14 months to target 12', priority: 'high', rationale: 'CAC payback is our weakest metric. PLG freemium has been proven by peers (Notion, Figma) to reduce CAC by 40-60% at scale.' },
          { recommendation: 'Hire 2 enterprise AEs for EU market (Berlin/Amsterdam) to capitalize on 340% pipeline growth in DACH region', priority: 'high', rationale: 'EU pipeline grew 340% QoQ but we have no feet on the ground — every week of delay is lost revenue.' },
          { recommendation: 'Implement usage-based pricing tier between Pro ($99/mo) and Enterprise (custom) to capture high-growth startups before they churn to competitors', priority: 'medium', rationale: '3 of 4 churned logos cited "pricing jumps from $99 to custom" as a factor. A usage-based tier bridges this gap.' },
        ] } },
      ],
    })),
  },

  {
    nl_input: '做一个创业公司月度经营数据看板，执行摘要+6个关键指标+资金消耗分析+3条建议',
    domain: 'business_report',
    industry: '科技',
    section_types: ['executive_summary', 'kpi_table', 'variance_analysis', 'recommendations'],
    color_scheme: 'dark-startup',
    tone: 'concise-actionable',
    quality_score: 100,
    ir_json: JSON.stringify(ir({
      domain: 'business_report', type: 'report', industry: '科技', language: 'zh-CN',
      summary: '创业公司2026年6月经营数据看板，关注现金流和用户增长',
      colorScheme: 'dark-startup', tone: 'concise-actionable',
      layout: [
        { id: 'summary', type: 'executive_summary', priority: 10, content: { title: '6月经营数据摘要', key_finding: '月活用户突破5万（+40% MoM），MRR达到¥48万。但烧钱速度加快（月消耗¥35万），按当前速度剩余现金可维持7个月。需要关注：用户留存率下降3个点，可能是产品改版导致。', metrics: [
          { label: 'MAU', value: '52,000', change: '+40% MoM' },
          { label: 'MRR', value: '¥48万', change: '+25% MoM' },
          { label: '现金余额', value: '¥245万', change: '-¥35万' },
          { label: '用户留存(D30)', value: '42%', change: '-3pp' },
        ], conclusion: '增长强劲但须管控现金流。7月目标：优化留存、启动新一轮融资路演。' } },
        { id: 'kpis', type: 'kpi_table', priority: 20, content: { title: '核心指标看板', items: [
          { kpi: '月活用户(MAU)', current: '52,000', target: '50,000', status: 'on_track' },
          { kpi: '月经常性收入(MRR)', current: '¥48万', target: '¥45万', status: 'on_track' },
          { kpi: '客户获取成本(CAC)', current: '¥82', target: '¥70', status: 'at_risk' },
          { kpi: '用户留存率(D30)', current: '42%', target: '45%', status: 'behind' },
          { kpi: '月消耗现金', current: '¥35万', target: '¥30万', status: 'behind' },
          { kpi: 'NPS', current: '58', target: '55', status: 'on_track' },
        ] } },
        { id: 'burn', type: 'variance_analysis', priority: 30, content: { title: '现金流分析', period_a: '6月预算', period_b: '6月实际', items: [
          { metric: '人力成本', value_a: '¥18万', value_b: '¥19万', delta: '+¥1万', explanation: '新入职1名后端工程师' },
          { metric: '营销投放', value_a: '¥8万', value_b: '¥12万', delta: '+¥4万', explanation: '抖音信息流投放加量，CAC从¥65涨至¥82' },
          { metric: '基础设施', value_a: '¥3万', value_b: '¥2.5万', delta: '-¥0.5万', explanation: '优化数据库查询，降配了部分闲置实例' },
          { metric: '其他', value_a: '¥2万', value_b: '¥1.5万', delta: '-¥0.5万', explanation: '办公费用控制良好' },
        ] } },
        { id: 'recs', type: 'recommendations', priority: 40, content: { title: '7月行动建议', items: [
          { recommendation: '暂停低ROI投放渠道：抖音信息流CAC已涨至¥82（目标¥70），建议暂停投放并优化素材后再上线', priority: 'high', rationale: '每多投放1个月就多浪费¥4万，且无法达到CAC目标' },
          { recommendation: '排查留存下降原因：6月产品改版后D30留存从45%降至42%，需分析产品改版的用户行为数据，定位流失节点', priority: 'high', rationale: '留存每降1个百分点，6个月后MAU差距约15%，对融资估值影响显著' },
          { recommendation: '启动Pre-A轮融资路演：按当前烧钱速度剩余现金仅够7个月，考虑到融资周期通常3-4个月，7月必须启动路演', priority: 'high', rationale: '等待现金低于4个月时融资会非常被动，现在启动可以保持议价能力' },
        ] } },
      ],
    })),
  },
];

/**
 * Number of seed entries across all domains.
 */
export const SEED_COUNT = SEED_DATA.length;

// ═══════════════════════════════════════════════════════════════
// Seed Function
// ═══════════════════════════════════════════════════════════════

/**
 * Populate an IRMemory instance with gold-standard seed data.
 * Safe to call multiple times — skips entries that already exist.
 */
export function seedMemory(memory: IRMemory): { inserted: number; skipped: number } {
  let inserted = 0;
  let skipped = 0;

  for (const seed of SEED_DATA) {
    try {
      // Check if a similar entry already exists (same nl_input)
      const existing = memory.search(seed.nl_input.slice(0, 30), 1);
      if (existing.length > 0 && existing[0].nl_input === seed.nl_input) {
        skipped++;
        continue;
      }

      memory.record({
        nl_input: seed.nl_input,
        ir_json: seed.ir_json,
        domain: seed.domain,
        industry: seed.industry,
        section_types: seed.section_types,
        color_scheme: seed.color_scheme,
        tone: seed.tone,
        token_input: 0,   // seed — not from API call
        token_output: 0,
        model: 'seed',
        quality_score: seed.quality_score,
      });
      inserted++;
    } catch (err) {
      // Duplicate or constraint error — skip
    }
  }

  return { inserted, skipped };
}
