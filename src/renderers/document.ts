/**
 * Document Renderer — Intent IR → formatted HTML document (print-friendly).
 *
 * Produces a clean, paginated HTML document suitable for:
 * - Viewing as a formatted report/manual/brochure
 * - Printing to PDF (Ctrl+P → Save as PDF)
 * - Knowledge base / documentation
 */

import type { IntentIR, Section } from '../schema';

const COLOR_PRESETS: Record<string, { bg: string; surface: string; text: string; accent: string; muted: string }> = {
  'dark-gold': { bg: '#fafaf9', surface: '#ffffff', text: '#1a1a1a', accent: '#c9a84c', muted: '#666' },
  'dark-blue': { bg: '#f8fafc', surface: '#ffffff', text: '#1a1a1a', accent: '#3b82f6', muted: '#666' },
  'light-blue': { bg: '#ffffff', surface: '#f8fafc', text: '#1e293b', accent: '#2563eb', muted: '#64748b' },
  'minimal-white': { bg: '#ffffff', surface: '#fafafa', text: '#171717', accent: '#404040', muted: '#666' },
  'warm-brown': { bg: '#fdfaf7', surface: '#ffffff', text: '#2a1f1a', accent: '#c97a3c', muted: '#666' },
};

function getColors(cs: string) {
  for (const [key, val] of Object.entries(COLOR_PRESETS)) {
    if (cs.startsWith(key)) return val;
  }
  // Default: clean light theme for documents
  return { bg: '#ffffff', surface: '#fafafa', text: '#1a1a1a', accent: '#2563eb', muted: '#666' };
}

// ─── Section Renderers ──────────────────────────────────────────

function rDocTitle(s: Section, colors: ReturnType<typeof getColors>): string {
  const c = s.content as { title: string; subtitle?: string; author?: string; date?: string };
  return `
<div style="text-align:center;padding:80px 40px 60px;page-break-after:always">
  <h1 style="font-size:2.5rem;color:${colors.text};margin-bottom:12px;font-weight:800">${c.title}</h1>
  ${c.subtitle ? `<p style="font-size:1.25rem;color:${colors.muted};margin-bottom:24px">${c.subtitle}</p>` : ''}
  ${c.author || c.date ? `
  <div style="color:${colors.muted};font-size:0.9rem;margin-top:32px">
    ${c.author ? `<span>${c.author}</span>` : ''}
    ${c.author && c.date ? '<span> · </span>' : ''}
    ${c.date ? `<span>${c.date}</span>` : ''}
  </div>` : ''}
</div>`;
}

function rToc(s: Section): string {
  // TOC is handled in main renderer — this is a placeholder section marker
  return '';
}

function rChapter(s: Section, colors: ReturnType<typeof getColors>): string {
  const c = s.content as { number?: number; title: string };
  const num = c.number ? `Chapter ${c.number}` : '';
  return `
<div style="page-break-before:always;padding:40px 0 20px">
  <h2 style="font-size:2rem;color:${colors.accent};border-bottom:2px solid ${colors.accent};padding-bottom:12px;margin-bottom:24px">
    ${num ? `<span style="font-size:0.9rem;color:${colors.muted};display:block;margin-bottom:4px">${num}</span>` : ''}
    ${c.title}
  </h2>
</div>`;
}

function rBody(s: Section, colors: ReturnType<typeof getColors>): string {
  const c = s.content as { text: string; format?: 'plain' | 'markdown' };
  const paragraphs = c.text.split('\n').filter(Boolean);
  return paragraphs.map(p => `<p style="color:${colors.text};line-height:1.8;margin-bottom:16px;font-size:1.05rem;text-align:justify">${p}</p>`).join('\n');
}

function rDocTable(s: Section, colors: ReturnType<typeof getColors>): string {
  const c = s.content as { title?: string; headers: string[]; rows: string[][] };
  return `
<div style="margin:32px 0">
  ${c.title ? `<h3 style="color:${colors.text};margin-bottom:16px;font-size:1.1rem">${c.title}</h3>` : ''}
  <table style="width:100%;border-collapse:collapse;font-size:0.95rem">
    <thead>
      <tr style="background:${colors.surface};border-bottom:2px solid ${colors.accent}">
        ${c.headers.map(h => `<th style="padding:12px 16px;text-align:left;color:${colors.text};font-weight:600">${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${c.rows.map(row => `
      <tr style="border-bottom:1px solid ${colors.surface}">
        ${row.map(cell => `<td style="padding:10px 16px;color:${colors.text}">${cell}</td>`).join('')}
      </tr>`).join('')}
    </tbody>
  </table>
</div>`;
}

function rDocImage(s: Section, colors: ReturnType<typeof getColors>): string {
  const c = s.content as { src: string; alt: string; caption?: string };
  return `
<div style="margin:32px 0;text-align:center">
  <img src="${c.src}" alt="${c.alt}" style="max-width:100%;max-height:400px;border-radius:4px">
  ${c.caption ? `<p style="color:${colors.muted};font-size:0.9rem;margin-top:8px;font-style:italic">${c.caption}</p>` : ''}
</div>`;
}

// ─── Router ─────────────────────────────────────────────────────

type RenderFn = (s: Section, colors: ReturnType<typeof getColors>) => string;

const SECTION_RENDERERS: Record<string, RenderFn> = {
  document_title: rDocTitle,
  chapter: rChapter,
  body: rBody,
  doc_table: rDocTable,
  doc_image: rDocImage,
  toc: rToc,
};

// ─── Main ───────────────────────────────────────────────────────

export function renderDocument(ir: IntentIR): string {
  const colors = getColors(ir.design?.colorScheme || 'light-blue');
  const meta = ir.intent;
  const sorted = [...ir.layout].sort((a, b) => a.priority - b.priority);

  // Build TOC from chapters
  const chapters = sorted.filter(s => s.type === 'chapter');
  const tocHTML = chapters.length > 1 ? `
<div style="page-break-after:always;padding:40px 0">
  <h2 style="font-size:1.5rem;color:${colors.accent};margin-bottom:24px">Table of Contents</h2>
  <ol style="list-style:none;padding:0">
    ${chapters.map((ch, i) => {
      const c = ch.content as { title: string };
      return `<li style="padding:8px 0;border-bottom:1px solid ${colors.surface};color:${colors.text}">
        <span style="color:${colors.accent};font-weight:600;margin-right:12px">${i + 1}.</span>${c.title}
      </li>`;
    }).join('')}
  </ol>
</div>` : '';

  const sectionsHTML = sorted.map(s => {
    const renderer = SECTION_RENDERERS[s.type];
    if (renderer && s.type !== 'toc') return renderer(s, colors);
    if (s.type === 'toc') return ''; // TOC handled separately
    // Fallback for non-document section types (from web_page domain)
    const c = s.content as Record<string, unknown>;
    const title = (c.title as string) || (c.headline as string) || s.type;
    const body = (c.text as string) || (c.description as string) || JSON.stringify(c);
    return `<div style="margin:24px 0"><h3 style="color:${colors.text};margin-bottom:8px">${title}</h3><p style="color:${colors.muted}">${body}</p></div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="${meta.language?.split('-')[0] || 'en'}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${meta.summary}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Georgia','Noto Serif SC',serif;background:${colors.bg};color:${colors.text};line-height:1.7}
.page{max-width:800px;margin:0 auto;padding:60px 40px}
@media print {
  body{background:#fff;font-size:11pt}
  .page{max-width:100%;padding:0 1in}
  @page{margin:1in}
}
</style>
</head>
<body>
<div class="page">
${sectionsHTML}
</div>
</body>
</html>`;
}
