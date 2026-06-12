/**
 * Markdown Renderer — Intent IR → formatted Markdown document.
 *
 * Useful for: documentation, README generation, blog posts,
 * knowledge base articles — from the same IR that drives HTML and React.
 */

import type { IntentIR, Section } from '../schema';

// ─── Section Renderers ────────────────────────────────────────────

function renderHero(s: Section): string {
  const c = s.content as { headline?: string; subheadline?: string; cta?: { text: string; action: string } };
  const lines = [`# ${c.headline || ''}`];
  if (c.subheadline) lines.push('', c.subheadline);
  if (c.cta) lines.push('', `> [${c.cta.text}](#${c.cta.action})`);
  return lines.join('\n');
}

function renderFeatures(s: Section): string {
  const c = s.content as { title?: string; items: Array<{ icon?: string; title: string; description: string }> };
  const lines = [c.title ? `## ${c.title}` : '## Features'];
  lines.push('');
  for (const item of c.items || []) {
    lines.push(`### ${item.icon ? item.icon + ' ' : ''}${item.title}`);
    lines.push('', item.description, '');
  }
  return lines.join('\n');
}

function renderSpecs(s: Section): string {
  const c = s.content as { title?: string; items: Array<{ label: string; value: string }> };
  const lines = [c.title ? `## ${c.title}` : '## Specifications'];
  lines.push('');
  lines.push('| Specification | Value |');
  lines.push('|--------------|-------|');
  for (const item of c.items || []) {
    lines.push(`| ${item.label} | ${item.value} |`);
  }
  return lines.join('\n');
}

function renderFaq(s: Section): string {
  const c = s.content as { title?: string; items: Array<{ question: string; answer: string }> };
  const lines = [c.title ? `## ${c.title}` : '## FAQ'];
  lines.push('');
  for (const item of c.items || []) {
    lines.push(`**Q: ${item.question}**`, '', item.answer, '');
  }
  return lines.join('\n');
}

function renderContactForm(s: Section): string {
  const c = s.content as { title?: string; subtitle?: string; fields: Array<{ name: string; label: string; type: string; required?: boolean }> };
  const lines = [c.title ? `## ${c.title}` : '## Contact'];
  if (c.subtitle) lines.push('', c.subtitle);
  lines.push('');
  for (const f of c.fields || []) {
    lines.push(`- **${f.label}**${f.required ? ' (required)' : ''}: _${f.type}_`);
  }
  return lines.join('\n');
}

function renderTrustBadges(s: Section): string {
  const c = s.content as { title?: string; badges: Array<{ name: string; icon?: string }> };
  const lines = [c.title ? `## ${c.title}` : '## Certifications'];
  lines.push('');
  const badges = (c.badges || []).map(b => `${b.icon ? b.icon + ' ' : ''}**${b.name}**`).join(' · ');
  lines.push(badges);
  return lines.join('\n');
}

function renderPricing(s: Section): string {
  const c = s.content as { title?: string; items: Array<{ name: string; price: string; description?: string; features?: string[]; highlighted?: boolean }> };
  const lines = [c.title ? `## ${c.title}` : '## Pricing'];
  lines.push('');
  for (const plan of c.items || []) {
    const hl = plan.highlighted ? ' 🔥 *Recommended*' : '';
    lines.push(`### ${plan.name} — ${plan.price}${hl}`);
    if (plan.description) lines.push('', plan.description);
    if (plan.features) {
      lines.push('');
      for (const f of plan.features) lines.push(`- ${f}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function renderGallery(s: Section): string {
  const c = s.content as { title?: string; images: Array<{ src: string; alt: string; caption?: string }> };
  const lines = [c.title ? `## ${c.title}` : '## Gallery'];
  lines.push('');
  for (const img of c.images || []) {
    lines.push(`![${img.alt}](${img.src})`);
    if (img.caption) lines.push(`*${img.caption}*`);
    lines.push('');
  }
  return lines.join('\n');
}

function renderCta(s: Section): string {
  const c = s.content as { headline?: string; body?: string; buttonText: string; buttonAction: string };
  const lines: string[] = [];
  if (c.headline) lines.push(`## ${c.headline}`);
  if (c.body) lines.push('', c.body);
  lines.push('', `> **[${c.buttonText}](#${c.buttonAction})**`);
  return lines.join('\n');
}

function renderTestimonials(s: Section): string {
  const c = s.content as { title?: string; items: Array<{ quote: string; name: string; role?: string }> };
  const lines = [c.title ? `## ${c.title}` : '## Testimonials'];
  lines.push('');
  for (const t of c.items || []) {
    lines.push(`> "${t.quote}"`);
    lines.push(`> — **${t.name}**${t.role ? `, ${t.role}` : ''}`);
    lines.push('');
  }
  return lines.join('\n');
}

function renderFooter(s: Section): string {
  const c = s.content as { brandName?: string; links?: Array<{ label: string; href: string }>; copyright?: string };
  const lines = ['---'];
  if (c.brandName) lines.push('', `**${c.brandName}**`);
  if (c.links?.length) {
    const linkStr = c.links.map(l => `[${l.label}](${l.href})`).join(' · ');
    lines.push('', linkStr);
  }
  if (c.copyright) lines.push('', `*${c.copyright}*`);
  return lines.join('\n');
}

function renderCustom(s: Section): string {
  const c = s.content as { component?: string; props?: Record<string, unknown> };
  return `<!-- Custom component: ${c.component || 'unnamed'} -->\n\`\`\`json\n${JSON.stringify(c.props || {}, null, 2)}\n\`\`\``;
}

// ─── Section Router ──────────────────────────────────────────────

const SECTION_RENDERERS: Record<string, (s: Section) => string> = {
  hero: renderHero,
  features: renderFeatures,
  specs: renderSpecs,
  faq: renderFaq,
  contact_form: renderContactForm,
  trust_badges: renderTrustBadges,
  pricing: renderPricing,
  gallery: renderGallery,
  cta: renderCta,
  testimonials: renderTestimonials,
  footer: renderFooter,
  custom: renderCustom,
};

// ─── Main Renderer ────────────────────────────────────────────────

/**
 * Render an Intent IR to a formatted Markdown document.
 */
export function renderMarkdown(ir: IntentIR): string {
  const meta = ir.intent;
  const sorted = [...ir.layout].sort((a, b) => a.priority - b.priority);

  const lines: string[] = [];

  // Title
  const title = ir.layout.find(s => s.type === 'hero')?.content as { headline?: string } | undefined;
  lines.push(`# ${title?.headline || meta.summary}`);
  lines.push('');

  // Meta info
  lines.push(`> ${meta.summary} | ${meta.type} · ${ir.design.colorScheme} · ${ir.design.tone}`);
  lines.push('');

  // Table of contents
  lines.push('## Contents');
  lines.push('');
  for (const s of sorted) {
    if (s.type !== 'hero') {
      const c = s.content as { title?: string };
      const label = c.title || s.type;
      lines.push(`- [${label}](#${label.toLowerCase().replace(/[^a-z0-9一-鿿]+/g, '-')})`);
    }
  }
  lines.push('');

  // Sections
  for (const s of sorted) {
    const renderer = SECTION_RENDERERS[s.type] || renderCustom;
    lines.push(renderer(s), '');
  }

  return lines.join('\n');
}
