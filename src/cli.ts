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

interface CLIOptions {
  input?: string;
  output?: string;
  render?: 'html' | 'react' | 'markdown' | 'json';
  provider?: 'anthropic' | 'openai';
  model?: string;
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

  const result = await compile(input, {
    provider: opts.provider,
    providerOpts: opts.model ? { model: opts.model } : undefined,
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
  } else {
    output = JSON.stringify(result.ir, null, 2);
  }

  if (opts.output) {
    const fs = await import('fs');
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
