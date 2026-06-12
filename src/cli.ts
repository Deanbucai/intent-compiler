#!/usr/bin/env node
/**
 * intent-compiler CLI
 *
 * Usage:
 *   intentc "做一个牙刷工厂B2B官网，深色金色调"
 *   intentc --input desc.txt --output ir.json
 *   intentc --input desc.txt --render html --output page.html
 *   echo "build a SaaS landing page" | intentc
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

async function main() {
  const args = process.argv.slice(2);
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
