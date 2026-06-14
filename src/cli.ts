#!/usr/bin/env node
/**
 * intent-compiler CLI
 *
 * Usage:
 *   intentc "做一个牙刷工厂B2B官网，深色金色调"
 *   intentc --input desc.txt --output ir.json
 *   intentc --input desc.txt --render html --output page.html
 *   echo "build a SaaS landing page" | intentc
 *   intentc diff a.json b.json
 */

import { compile } from './compiler';
import { renderHTML } from './renderers/html';
import { renderReact } from './renderers/react';
import { renderMarkdown } from './renderers/markdown';
import { renderSlideDeck } from './renderers/slide';
import { renderDocument } from './renderers/document';

interface CLIOptions {
  input?: string;
  output?: string;
  render?: 'html' | 'react' | 'markdown' | 'slide' | 'document' | 'json';
  provider?: 'anthropic' | 'openai';
  model?: string;
  fast?: boolean;
}

async function runPlayground() {
  const http = await import('http');
  const fs = await import('fs');
  const path = await import('path');

  const playgroundPath = path.join(__dirname, '..', 'src', 'playground', 'index.html');
  const html = fs.readFileSync(playgroundPath, 'utf-8');

  const server = http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });

  const PORT = 3456;
  server.listen(PORT, () => {
    console.log(`🎮 IR Playground → http://localhost:${PORT}`);
    console.log('   Edit IR JSON on the left, preview updates on the right.');
    console.log('   Press Ctrl+C to stop.');
  });
}

async function runTranslate(args: string[]) {
  if (args.length < 2) {
    console.error('Usage: intentc translate <ir-file.json> <target-lang>');
    console.error('  target-lang: zh-CN | en-US | ru-RU');
    process.exit(1);
  }

  const [file, lang] = args;
  if (!['zh-CN', 'en-US', 'ru-RU'].includes(lang)) {
    console.error('Target language must be: zh-CN, en-US, or ru-RU');
    process.exit(1);
  }

  const langNames: Record<string, string> = { 'zh-CN': 'Chinese', 'en-US': 'English', 'ru-RU': 'Russian' };

  const fs = await import('fs');
  const ir = JSON.parse(fs.readFileSync(file, 'utf-8'));

  const { compile } = await import('./compiler');
  console.error(`🌐 Translating IR content to ${langNames[lang]}...`);

  // Lock design + intent, allow layout content to be translated
  const result = await compile(
    `Here is an existing Intent IR. Translate ALL text content (headlines, descriptions, labels, questions, answers, button text, etc.) to ${langNames[lang]}. Keep the exact same section types, IDs, priorities, and structure. Only change the text content.\n\nExisting IR:\n\`\`\`json\n${JSON.stringify(ir, null, 2)}\n\`\`\``,
    {
      lockFields: ['design', 'intent'],
      existingIR: ir,
    }
  );

  // Verify section structure is preserved
  const origIds = ir.layout.map((s: any) => `${s.type}:${s.id}`).join(',');
  const newIds = result.ir.layout.map((s: any) => `${s.type}:${s.id}`).join(',');
  if (origIds !== newIds) {
    console.error(`⚠️  Section structure changed! Original: [${origIds}] → New: [${newIds}]`);
    console.error('   Restoring original structure...');
    result.ir.layout = JSON.parse(JSON.stringify(ir.layout));
  }

  // Also update the language field
  result.ir.intent.language = lang;

  const output = file.replace('.json', `-${lang.split('-')[0]}.json`);
  fs.writeFileSync(output, JSON.stringify(result.ir, null, 2));
  console.error(`✅ Written to ${output} (${result.ir.layout.length} sections)`);
}

async function runTemplate(args: string[]) {
  const fs = await import('fs');
  const path = await import('path');

  const templates: Record<string, { desc: string; file: string }> = {
    landing: { desc: 'Generic product landing page (hero + features + contact)', file: 'landing' },
    saas: { desc: 'SaaS with pricing table (hero + features + pricing + faq + footer)', file: 'saas' },
    portfolio: { desc: 'Creative portfolio (hero + gallery + testimonials + footer)', file: 'portfolio' },
    manufacturing: { desc: 'B2B factory showcase like DR.Warm (hero + specs + faq + contact)', file: 'manufacturing' },
  };

  const cmd = args[0];

  if (cmd === 'list') {
    console.log('Available templates:\n');
    for (const [name, t] of Object.entries(templates)) {
      console.log(`  ${name.padEnd(16)} ${t.desc}`);
    }
    return;
  }

  if (cmd === 'show' && args[1]) {
    const t = templates[args[1]];
    if (!t) { console.error(`Unknown template: ${args[1]}`); process.exit(1); }

    const playgroundPath = path.join(__dirname, '..', 'src', 'playground', 'index.html');
    const html = fs.readFileSync(playgroundPath, 'utf-8');
    const match = html.match(new RegExp(`"${t.file}":({[^}]*?\\})`));
    if (match) {
      try {
        const ir = JSON.parse(match[1]);
        console.log(JSON.stringify(ir, null, 2));
      } catch {
        console.error('Failed to parse template from playground');
      }
    }
    return;
  }

  console.error('Usage: intentc template list');
  console.error('       intentc template show <name>');
}

async function runRendererCmd(args: string[]) {
  const { registry, discoverRenderers, registerBuiltins } = await import('./renderers/registry');

  // Register built-ins first
  registerBuiltins();

  const cmd = args[0];

  if (cmd === 'list') {
    const renderers = registry.list();
    if (renderers.length === 0) {
      console.log('No renderers registered.');
      return;
    }
    console.log(`Registered renderers (${renderers.length}):\n`);
    for (const r of renderers) {
      const builtin = r.meta.id === 'html' || r.meta.id === 'react' || r.meta.id === 'markdown' || r.meta.id === 'slide' || r.meta.id === 'document';
      console.log(`  ${r.meta.id.padEnd(16)} [${r.meta.domain.padEnd(12)} → ${r.meta.outputFormat.padEnd(10)}] ${builtin ? '(built-in)' : '(external)'}  ${r.meta.description}`);
    }
    return;
  }

  if (cmd === 'discover' && args[1]) {
    const discovered = await discoverRenderers(args[1]);
    console.log(`Discovered ${discovered.length} renderer(s) from ${args[1]}:`);
    for (const r of discovered) {
      console.log(`  + ${r.meta.id} — ${r.meta.name}`);
    }
    return;
  }

  if (cmd === 'add' && args[1]) {
    const path = args[1];
    const discovered = await discoverRenderers(path);
    if (discovered.length === 0) {
      console.log(`No valid renderers found in ${path}`);
    } else {
      console.log(`Registered ${discovered.length} renderer(s). Use "intentc renderer list" to see all.`);
    }
    return;
  }

  console.error('Usage: intentc renderer list');
  console.error('       intentc renderer discover <directory>');
  console.error('       intentc renderer add <directory>');
}

async function runMemoryCmd(args: string[]) {
  const { IRMemory } = await import('./ir-memory');
  const memory = new IRMemory();

  const cmd = args[0];

  if (cmd === 'stats') {
    const stats = memory.getStats();
    console.log(`📊 IR Memory Stats`);
    console.log(`   Total entries: ${stats.total}`);
    if (stats.total === 0) { memory.close(); return; }
    console.log(`   By domain:`, Object.entries(stats.by_domain).map(([k, v]) => `${k}:${v}`).join(', '));
    console.log(`   By industry:`, Object.entries(stats.by_industry).slice(0, 8).map(([k, v]) => `${k}:${v}`).join(', '));
    console.log(`   Top patterns:`);
    for (const p of stats.most_common_sections.slice(0, 5)) {
      console.log(`     ${p.types.padEnd(40)} x${p.count}`);
    }
    if (stats.recent.length > 0) {
      console.log(`   Recent:`);
      for (const r of stats.recent.slice(0, 3)) {
        console.log(`     [${r.industry || '?'}] ${r.nl_input.slice(0, 60)}...`);
      }
    }
    memory.close();
    return;
  }

  if (cmd === 'search' && args[1]) {
    const results = memory.search(args[1], 5);
    console.log(`${results.length} matches for "${args[1]}":`);
    for (const r of results) {
      console.log(`  [${r.industry || '?'}] ${r.section_types} — ${r.nl_input.slice(0, 80)}`);
    }
    memory.close();
    return;
  }

  if (cmd === 'patterns' && args[1]) {
    const patterns = memory.getPatternsForIndustry(args[1]);
    console.log(`Patterns for "${args[1]}":`);
    for (const p of patterns) {
      console.log(`  ${p.types.join(' → ')} (x${p.count})`);
    }
    memory.close();
    return;
  }

  if (cmd === 'clear') {
    memory.close();
    const fs = await import('fs');
    const path = '.intent-compiler/memory.db';
    if (fs.existsSync(path)) { fs.unlinkSync(path); console.log('Memory cleared.'); }
    else { console.log('No memory file found.'); }
    return;
  }

  console.error('Usage: intentc memory stats');
  console.error('       intentc memory search <query>');
  console.error('       intentc memory patterns <industry>');
  console.error('       intentc memory clear');
  memory.close();
}

async function runInit(args: string[]) {
  const readline = await import('node:readline');
  const fs = await import('fs');
  const path = await import('path');

  const dir = args[0] || 'my-landing-page';

  if (fs.existsSync(dir)) {
    console.error(`Directory "${dir}" already exists. Choose a different name.`);
    process.exit(1);
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string): Promise<string> => new Promise((resolve) => rl.question(q, resolve));

  console.log('\n🧁 Intent Compiler — New Project\n');

  const domain = await ask('1. Domain [1=website 2=slide 3=document] (1): ') || '1';
  const domainMap: Record<string, string> = { '1': 'web_page', '2': 'slide_deck', '3': 'document' };
  const domainVal = domainMap[domain] || 'web_page';

  const industryQ = domainVal === 'web_page'
    ? '2. Industry [mfg/saas/food/retail/health/other] (other): '
    : '2. Topic (presentation): ';
  const industry = await ask(industryQ) || 'other';

  const lang = await ask('3. Language [zh/en/ru] (zh): ') || 'zh';
  const langMap: Record<string, string> = { 'zh': 'zh-CN', 'en': 'en-US', 'ru': 'ru-RU' };

  const schemeQ = domainVal === 'web_page'
    ? '4. Style [1=dark-gold 2=light-blue 3=dark-blue 4=warm-pink 5=minimal] (1): '
    : '4. Style [1=dark 2=light 3=warm] (1): ';
  const scheme = await ask(schemeQ) || '1';
  const schemeMap: Record<string, { color: string; tone: string; typo: string }> = {
    '1': { color: 'dark-gold', tone: 'professional', typo: 'modern-sans' },
    '2': { color: 'light-blue', tone: 'professional', typo: 'modern-sans' },
    '3': { color: 'dark-blue', tone: 'professional-tech', typo: 'modern-sans' },
    '4': { color: 'warm-pink-cream-gold', tone: 'elegant-sweet', typo: 'serif' },
    '5': { color: 'minimal-white', tone: 'minimal', typo: 'modern-sans' },
  };
  const design = schemeMap[scheme] || schemeMap['1'];

  rl.close();

  // Build scaffold IR
  const scaffoldIR: Record<string, unknown> = {
    $schema: 'https://intent-compiler.dev/schema/v0.1.0',
    version: '0.1.0',
    intent: {
      domain: domainVal,
      type: domainVal === 'web_page' ? 'landing' : domainVal === 'slide_deck' ? 'presentation' : 'report',
      industry,
      language: langMap[lang] || 'zh-CN',
      summary: 'Edit this summary to describe your project',
    },
    design: {
      colorScheme: design.color,
      tone: design.tone,
      typography: design.typo,
      responsive: true,
    },
    layout: domainVal === 'web_page' ? [
      { id: 'hero', type: 'hero', priority: 10, content: { headline: 'Your Headline', subheadline: 'Your subheadline here.', cta: { text: 'Get Started', action: 'signup' } } },
      { id: 'features', type: 'features', priority: 20, content: { title: 'Features', items: [{ title: 'Feature 1', description: 'Description here.' }] } },
      { id: 'contact', type: 'contact_form', priority: 90, content: { title: 'Contact', fields: [{ name: 'email', label: 'Email', type: 'email', required: true }] } },
    ] : domainVal === 'slide_deck' ? [
      { id: 'title', type: 'title_slide', priority: 10, content: { title: 'Presentation Title', subtitle: 'Subtitle', presenter: 'Your Name' } },
      { id: 'content', type: 'content_slide', priority: 20, content: { title: 'Topic', body: 'Content here.' } },
      { id: 'end', type: 'ending_slide', priority: 90, content: { title: 'Thank You', contact: 'your@email.com' } },
    ] : [
      { id: 'title', type: 'document_title', priority: 10, content: { title: 'Document Title', subtitle: 'Subtitle', author: 'Author' } },
      { id: 'ch1', type: 'chapter', priority: 20, content: { title: 'Chapter 1' } },
      { id: 'body', type: 'body', priority: 30, content: { text: 'Content here.' } },
    ],
  };

  // Create directory and files
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'ir.json'), JSON.stringify(scaffoldIR, null, 2));
  fs.writeFileSync(path.join(dir, 'CLAUDE.md'), `# Agent Configuration

## Auto-Invoke Rules
Before generating any ${domainVal === 'web_page' ? 'web page' : domainVal === 'slide_deck' ? 'presentation' : 'document'}, you MUST:
1. Read \`ir.json\` to understand the exact structure and design system
2. Use the IR as your spec when writing code
3. Verify every section from the IR is present in your output

## Design System
- Color: ${design.color}
- Tone: ${design.tone}
- Typography: ${design.typo}

## Project IR
See \`ir.json\` for the complete structured intent.
`);
  fs.writeFileSync(path.join(dir, '.env.example'), `# Intent Compiler — API Keys
# Choose one:

# Claude (Anthropic)
ANTHROPIC_API_KEY=sk-ant-...

# DeepSeek (Anthropic-compatible)
ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic
ANTHROPIC_AUTH_TOKEN=sk-...

# OpenAI / GPT
OPENAI_API_KEY=sk-...
`);

  console.log(`\n✅ Created ${dir}/`);
  console.log(`   ├── ir.json          ← Edit this to customize your ${domainVal === 'web_page' ? 'page' : domainVal === 'slide_deck' ? 'slides' : 'document'}`);
  console.log(`   ├── CLAUDE.md        ← Agent auto-invoke rules`);
  console.log(`   └── .env.example     ← API key setup`);
  console.log(`\nNext: cd ${dir} && echo "your description" | npx intentc --render html --output index.html`);
}

async function runSiteCmd(args: string[]) {
  const { buildSite, createDefaultSite } = await import('./site');
  const fs = await import('fs');
  const path = await import('path');

  const cmd = args[0];

  if (cmd === 'init' || !cmd) {
    const dir = args[1] || '.';
    const readline = await import('node:readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (q: string): Promise<string> => new Promise((r) => rl.question(q, r));

    console.log('\n🌐 Multi-Page Site Setup\n');
    const name = await ask('Site name (My Site): ') || 'My Site';
    const lang = await ask('Language [zh/en/ru] (zh): ') || 'zh';
    const langMap: Record<string, string> = { 'zh': 'zh-CN', 'en': 'en-US', 'ru': 'ru-RU' };
    rl.close();

    const site = createDefaultSite(name);
    site.language = langMap[lang] || 'zh-CN';

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'site.json'), JSON.stringify(site, null, 2));

    // Create a sample index page
    const indexIR = {
      $schema: 'https://intent-compiler.dev/schema/v0.1.0',
      version: '0.1.0',
      intent: { domain: 'web_page', type: 'landing', language: site.language, summary: `${name} — Home` },
      design: site.design,
      layout: [
        { id: 'hero', type: 'hero', priority: 10, content: { headline: `Welcome to ${name}`, subheadline: 'Your tagline here.', cta: { text: 'Learn More', action: 'about' } } },
      ],
    };
    fs.writeFileSync(path.join(dir, 'index.ir.json'), JSON.stringify(indexIR, null, 2));

    console.log(`\n✅ Multi-page site at ${dir}/`);
    console.log(`   site.json      ← shared design + nav + footer`);
    console.log(`   index.ir.json  ← homepage (add more: about.ir.json, contact.ir.json)`);
    console.log(`\nNext: intentc site build ${dir}`);
    return;
  }

  if (cmd === 'build') {
    const dir = args[1] || '.';
    console.log(`🏗  Building site from ${dir}/site.json...\n`);
    const results = buildSite(dir);
    if (results.length === 0) {
      console.log('No pages built.');
      return;
    }
    console.log(`\n✅ Built ${results.length} page(s) → ${dir}/_site/`);
    for (const r of results) {
      console.log(`   ${r.url.padEnd(20)} ${r.size}B`);
    }
    return;
  }

  console.error('Usage: intentc site init [dir]');
  console.error('       intentc site build [dir]');
}

async function runBenchmark(args: string[]) {
  const { compile } = await import('./compiler');
  const { IRMemory } = await import('./ir-memory');
  const fs = await import('fs');

  // Read from pipe, file, or args
  let input: string;
  if (args[0] && !args[0].startsWith('--')) {
    input = args.join(' ');
  } else if (!process.stdin.isTTY) {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
    input = Buffer.concat(chunks).toString('utf-8').trim();
  } else {
    console.error('Usage: echo "description..." | intentc bench');
    console.error('       intentc bench "description..."');
    process.exit(1);
  }

  console.log('🧪 IR Benchmark\n');
  console.log(`Input: "${input.slice(0, 100)}${input.length > 100 ? '...' : ''}"\n`);

  const memory = new IRMemory();
  const startTime = Date.now();

  const result = await compile(input, { memory });
  const elapsed = Date.now() - startTime;

  const ir = result.ir;
  const sections = ir.layout.sort((a, b) => a.priority - b.priority);

  // ─── Metrics ────────────────────────────────────────────
  console.log('═══ Compilation Metrics ═══');
  console.log(`Time:         ${elapsed}ms`);
  console.log(`Model:        ${result.model} ${result.model?.includes('flash') ? '⚡' : result.model?.includes('pro') ? '🔴' : ''}`);
  console.log(`Tokens:       ${result.usage?.input} in / ${result.usage?.output} out`);
  console.log(`Domain:       ${ir.intent.domain}`);
  console.log(`Industry:     ${ir.intent.industry || '(not detected)'}`);
  console.log(`Language:     ${ir.intent.language}`);
  console.log(`Design:       ${ir.design.colorScheme} · ${ir.design.tone} · ${ir.design.typography || 'sans'}`);

  // Section analysis
  console.log(`\n═══ Section Analysis ═══`);
  console.log(`Total:        ${sections.length} sections`);

  let totalItems = 0;
  let totalFields = 0;
  for (const s of sections) {
    const c = s.content as Record<string, unknown>;
    const items = (c.items as unknown[]) || [];
    const fields = (c.fields as unknown[]) || [];
    const bullets = (c.bullets as unknown[]) || [];
    const badges = (c.badges as unknown[]) || [];
    const images = (c.images as unknown[]) || [];
    const itemCount = items.length + bullets.length + badges.length + images.length;
    totalItems += itemCount;
    totalFields += fields.length;

    const detail = itemCount > 0 ? ` (${itemCount} items)` : fields.length > 0 ? ` (${fields.length} fields)` : '';
    console.log(`  [${s.type.padEnd(16)}] pri ${String(s.priority).padStart(2)}${detail}`);
  }

  console.log(`\nContent items: ${totalItems} total`);
  console.log(`Form fields:   ${totalFields} total`);

  // ─── Quality Checks ─────────────────────────────────────
  console.log(`\n═══ Quality Checks ═══`);

  // Check 1: Design completeness
  const designOK = ir.design.colorScheme && ir.design.tone;
  console.log(`${designOK ? '✅' : '❌'} Design system: ${designOK ? 'complete' : 'missing fields'}`);

  // Check 2: No empty sections
  const emptySections = sections.filter(s => {
    const c = s.content as Record<string, unknown>;
    const a = c as any; return !c.headline && !c.title && !c.question && !c.text && !c.body && !(a.items?.length) && !(a.bullets?.length) && !(a.badges?.length) && !(a.images?.length) && !c.brandName && !c.copyright && !(a.fields?.length);
  });
  console.log(`${emptySections.length === 0 ? '✅' : '❌'} Empty sections: ${emptySections.length === 0 ? 'none' : emptySections.map(s => s.type).join(', ')}`);

  // Check 3: Priority ordering
  const priorities = sections.map(s => s.priority);
  const sorted = [...priorities].sort((a, b) => a - b);
  const ordered = priorities.every((p, i) => p === sorted[i]);
  console.log(`${ordered ? '✅' : '⚠️'} Priority order: ${ordered ? 'correct' : 'needs sorting'}`);

  // Check 4: Industry detection
  console.log(`${ir.intent.industry ? '✅' : '⚠️'} Industry detected: ${ir.intent.industry || 'N/A — add industry context for better few-shot'}`);

  // Check 5: Memory (few-shot learning)
  const similarCount = memory.search(input, 3).length;
  console.log(`${similarCount > 0 ? '✅' : 'ℹ️'} Memory matches: ${similarCount} similar past compilation(s) used as few-shot`);

  // ─── Summary ────────────────────────────────────────────
  const score = (designOK ? 25 : 0) + (emptySections.length === 0 ? 25 : 0) + (ordered ? 20 : 0) + (ir.intent.industry ? 15 : 0) + (similarCount > 0 ? 15 : 0);
  console.log(`\n═══ Score: ${score}/100 ═══`);
  console.log(`(design ${designOK?25:0} + no_empty ${emptySections.length===0?25:0} + order ${ordered?20:0} + industry ${ir.intent.industry?15:0} + memory ${similarCount>0?15:0})`);

  // Save report
  const reportDir = '.intent-compiler/benchmarks';
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  const reportFile = `${reportDir}/bench-${Date.now()}.json`;
  fs.writeFileSync(reportFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    input: input.slice(0, 200),
    metrics: { elapsed, model: result.model, tokens: result.usage, domain: ir.intent.domain, sections: sections.length, items: totalItems, fields: totalFields, score },
    quality: { designOK, emptySections: emptySections.length, ordered, industryDetected: !!ir.intent.industry, memoryMatches: similarCount },
    ir: ir,
  }, null, 2));
  console.log(`\n📄 Report: ${reportFile}`);

  // Update quality score on last memory entry
  try {
    const db = (memory as any).db;
    db.prepare('UPDATE memories SET quality_score = ? WHERE id = (SELECT MAX(id) FROM memories)').run(score);
  } catch {}

  // Record errors for feedback loop
  const industry = ir.intent.industry || 'unknown';
  if (!designOK) memory.recordError(industry, 'design_incomplete', `Design system missing fields in ${industry} compilations`);
  if (emptySections.length > 0) {
    for (const s of emptySections) {
      memory.recordError(industry, 'empty_section', `Section [${s.type}] was empty in ${industry} page`);
    }
  }
  if (!ordered) memory.recordError(industry, 'priority_order', 'Section priorities not in correct order');
  if (!ir.intent.industry) memory.recordError(industry, 'no_industry', 'Industry not detected from NL description');

  memory.close();
}

async function runDeploy(args: string[]) {
  const fs = await import('fs');
  const path = await import('path');

  const file = args[0] || '';
  if (!file || !fs.existsSync(file)) {
    console.error('Usage: intentc deploy <file.html>');
    console.error('  Deploys an HTML file to Netlify and returns a public URL.');
    console.error('  Requires NETLIFY_AUTH_TOKEN env var. Get one at https://app.netlify.com/user/applications');
    process.exit(1);
  }

  const token = process.env.NETLIFY_AUTH_TOKEN;
  if (!token) {
    console.error('NETLIFY_AUTH_TOKEN not set.');
    console.error('  1. Go to https://app.netlify.com/user/applications');
    console.error('  2. Create a new personal access token');
    console.error('  3. export NETLIFY_AUTH_TOKEN=your-token');
    process.exit(1);
  }

  const html = fs.readFileSync(file, 'utf-8');
  const siteName = path.basename(file, '.html');

  console.error(`🚀 Deploying ${siteName}...`);

  try {
    // Create a new site
    const createResp = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `intentc-${siteName}-${Date.now()}` }),
    });
    if (!createResp.ok) {
      const err = await createResp.text();
      throw new Error(`Create site failed: ${createResp.status} ${err}`);
    }
    const site = await createResp.json() as { id: string; ssl_url: string; name: string };

    // Deploy the HTML
    const deployResp = await fetch(`https://api.netlify.com/api/v1/sites/${site.id}/deploys`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
      body: html,
    });
    if (!deployResp.ok) {
      const err = await deployResp.text();
      throw new Error(`Deploy failed: ${deployResp.status} ${err}`);
    }

    console.error(`✅ Deployed: ${site.ssl_url}`);
    console.log(site.ssl_url);
  } catch (e: unknown) {
    console.error(`❌ ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }
}

async function runDiff(args: string[]) {
  if (args.length < 2) {
    console.error('Usage: intentc diff <file-a.json> <file-b.json>');
    process.exit(1);
  }

  const fs = await import('fs');
  const a = JSON.parse(fs.readFileSync(args[0], 'utf-8'));
  const b = JSON.parse(fs.readFileSync(args[1], 'utf-8'));

  const changes: string[] = [];

  // Compare intent
  if (a.intent?.summary !== b.intent?.summary) {
    changes.push(`📝 Summary: "${a.intent?.summary}" → "${b.intent?.summary}"`);
  }
  if (a.intent?.type !== b.intent?.type) {
    changes.push(`📝 Type: ${a.intent?.type} → ${b.intent?.type}`);
  }

  // Compare design
  const designKeys = ['colorScheme', 'tone', 'typography'];
  for (const key of designKeys) {
    if (a.design?.[key] !== b.design?.[key]) {
      changes.push(`🎨 ${key}: "${a.design?.[key]}" → "${b.design?.[key]}"`);
    }
  }

  // Compare layout sections
  const aSections = (a.layout || []) as Array<{ id: string; type: string; priority: number }>;
  const bSections = (b.layout || []) as Array<{ id: string; type: string; priority: number }>;
  const aIds = new Set(aSections.map((s) => s.id));
  const bIds = new Set(bSections.map((s) => s.id));

  for (const s of aSections) {
    if (!bIds.has(s.id)) changes.push(`➖ Removed: [${s.type}] ${s.id}`);
  }
  for (const s of bSections) {
    if (!aIds.has(s.id)) changes.push(`➕ Added: [${s.type}] ${s.id}`);
  }

  // Print diff
  if (changes.length === 0) {
    console.log('✅ No changes — IRs are identical.');
    return;
  }

  console.log(`📊 IR Diff: ${args[0]} → ${args[1]}`);
  console.log(`   ${changes.length} change(s):\n`);
  for (const c of changes) {
    console.log(`   ${c}`);
  }
}

async function main() {
  const args = process.argv.slice(2);

  // Handle 'diff' subcommand
  if (args[0] === 'diff') {
    await runDiff(args.slice(1));
    return;
  }

  // Handle 'play' subcommand — launch IR playground
  if (args[0] === 'play') {
    await runPlayground();
    return;
  }

  // Handle 'translate' subcommand
  if (args[0] === 'translate') {
    await runTranslate(args.slice(1));
    return;
  }

  // Handle 'template' subcommand
  if (args[0] === 'template') {
    await runTemplate(args.slice(1));
    return;
  }

  // Handle 'renderer' subcommand
  if (args[0] === 'renderer') {
    await runRendererCmd(args.slice(1));
    return;
  }

  // Handle 'memory' subcommand
  if (args[0] === 'memory') {
    await runMemoryCmd(args.slice(1));
    return;
  }

  // Handle 'init' subcommand
  if (args[0] === 'init') {
    await runInit(args.slice(1));
    return;
  }

  // Handle 'site' subcommand
  if (args[0] === 'site') {
    await runSiteCmd(args.slice(1));
    return;
  }

  // Handle 'bench' subcommand
  if (args[0] === 'bench') {
    await runBenchmark(args.slice(1));
    return;
  }

  // Handle 'deploy' subcommand
  if (args[0] === 'deploy') {
    await runDeploy(args.slice(1));
    return;
  }

  const opts = parseArgs(args);

  // Read input: from --input file, from stdin, or from positional arg
  let input: string;
  if (opts.input) {
    const fs = await import('fs');
    input = fs.readFileSync(opts.input, 'utf-8').trim();
  } else if (!process.stdin.isTTY) {
    // Pipe mode
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(Buffer.from(chunk));
    }
    input = Buffer.concat(chunks).toString('utf-8').trim();
  } else {
    input = args.filter((a) => !a.startsWith('--')).join(' ');
  }

  if (!input) {
    console.error('Usage: intentc "describe your web page in natural language"');
    console.error('       intentc --input desc.txt --render html --output page.html');
    console.error('       cat desc.txt | intentc');
    process.exit(1);
  }

  console.error(`⏳ Compiling: "${input.slice(0, 80)}${input.length > 80 ? '...' : ''}"`);

  const { IRMemory } = await import('./ir-memory');
  const memory = new IRMemory();

  const result = await compile(input, {
    provider: opts.provider,
    providerOpts: {
      ...(opts.model ? { model: opts.model } : {}),
      ...(opts.fast ? { model: process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL || 'deepseek-v4-flash' } : {}),
    },
    memory,
  });

  console.error(`✅ Compiled (${result.model}, ${result.usage?.input}+${result.usage?.output} tokens)`);

  // Output
  let output: string;
  if (opts.render === 'html') {
    output = renderHTML(result.ir);
  } else if (opts.render === 'react') {
    output = renderReact(result.ir);
  } else if (opts.render === 'markdown') {
    output = renderMarkdown(result.ir);
  } else if (opts.render === 'slide') {
    output = renderSlideDeck(result.ir);
  } else if (opts.render === 'document') {
    output = renderDocument(result.ir);
  } else {
    output = JSON.stringify(result.ir, null, 2);
  }

  if (opts.output) {
    const fs = await import('fs');
    const path = await import('path');
    const dir = path.dirname(opts.output);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(opts.output, output, 'utf-8');
    console.error(`📄 Written to ${opts.output}`);
  } else {
    process.stdout.write(output);
    if (!opts.render || opts.render === 'json') {
      process.stdout.write('\n');
    }
  }
}

function parseArgs(args: string[]): CLIOptions {
  const opts: CLIOptions = {};
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input':
      case '-i':
        opts.input = args[++i];
        break;
      case '--output':
      case '-o':
        opts.output = args[++i];
        break;
      case '--render':
      case '-r':
        opts.render = args[++i] as 'html' | 'json';
        break;
      case '--provider':
      case '-p':
        opts.provider = args[++i] as 'anthropic' | 'openai';
        break;
      case '--model':
      case '-m':
        opts.model = args[++i];
        break;
      case '--fast':
        opts.fast = true;
        break;
      case '--help':
      case '-h':
        console.log(`intent-compiler v0.1.0 — NL → Intent IR → Web Page

Usage:
  intentc "describe your web page"
  intentc --input desc.txt --output ir.json
  intentc --input desc.txt --render html --output page.html
  cat desc.txt | intentc --render html > page.html

Options:
  -i, --input <file>    Read input from file
  -o, --output <file>   Write output to file (default: stdout)
  -r, --render <type>   Output format: json (default), html, or react
  -p, --provider <p>    LLM provider: anthropic (default) or openai
  -m, --model <model>   Override default model
  -h, --help            Show this help

Environment:
  ANTHROPIC_API_KEY     Claude API key
  OPENAI_API_KEY        OpenAI API key
`);
        process.exit(0);
    }
  }
  return opts;
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
