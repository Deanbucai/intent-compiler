/**
 * React Renderer — Intent IR → React functional component code.
 *
 * Produces a complete `.tsx` file with:
 * - Typed functional components for each section type
 * - Inline styles as JS objects (no CSS dependency)
 * - Proper React imports
 * - Responsive design via CSS-in-JS
 */

import type { IntentIR, Section } from '../schema';

// ─── Helpers ─────────────────────────────────────────────────────

function indent(code: string, level: number): string {
  const pad = '  '.repeat(level);
  return code
    .split('\n')
    .map((line) => (line.trim() ? pad + line : line))
    .join('\n');
}

function jsxAttr(key: string, value: string, isDynamic = false): string {
  if (isDynamic) return `${key}={${value}}`;
  return `${key}="${value}"`;
}

function styleObject(styles: Record<string, string>): string {
  const entries = Object.entries(styles)
    .map(([k, v]) => `${k}: '${v}'`)
    .join(',\n');
  return `{\n${indent(entries, 1)}\n}`;
}

// ─── Color Presets ────────────────────────────────────────────────

const COLOR_PRESETS: Record<string, { bg: string; surface: string; text: string; accent: string; muted: string }> = {
  'dark-gold': { bg: '#08080f', surface: '#12121a', text: '#e8e8e8', accent: '#c9a84c', muted: '#888' },
  'dark-blue': { bg: '#0a0e1a', surface: '#111827', text: '#e2e8f0', accent: '#3b82f6', muted: '#94a3b8' },
  'light-blue': { bg: '#ffffff', surface: '#f8fafc', text: '#1e293b', accent: '#2563eb', muted: '#64748b' },
  'minimal-white': { bg: '#ffffff', surface: '#f5f5f5', text: '#171717', accent: '#404040', muted: '#737373' },
};

function getColors(cs: string) {
  for (const [key, val] of Object.entries(COLOR_PRESETS)) {
    if (cs.startsWith(key)) return val;
  }
  return COLOR_PRESETS['dark-gold'];
}

// ─── Section Renderers ────────────────────────────────────────────

function renderHero(s: Section, colors: ReturnType<typeof getColors>): string {
  const c = s.content as { headline?: string; subheadline?: string; cta?: { text: string; action: string } };
  return `
function Hero() {
  return (
    <section style={${styleObject({
      padding: '120px 24px 80px',
      textAlign: 'center',
      background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.surface} 100%)`,
    })}}>
      <h1 style={${styleObject({
        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
        fontWeight: '700',
        color: colors.text,
        marginBottom: '16px',
        lineHeight: '1.2',
      })}}>
        ${c.headline || ''}
      </h1>
      ${c.subheadline ? `<p style={${styleObject({ fontSize: '1.125rem', color: colors.muted, maxWidth: '600px', margin: '0 auto 32px', lineHeight: '1.6' })}}>${c.subheadline}</p>` : ''}
      ${c.cta ? `<a href="#${c.cta.action}" style={${styleObject({ display: 'inline-block', padding: '14px 40px', background: colors.accent, color: colors.bg, fontWeight: '600', borderRadius: '6px', textDecoration: 'none', fontSize: '1rem', transition: 'opacity 0.2s' })}}>${c.cta.text}</a>` : ''}
    </section>
  );
}`;
}

function renderFeatures(s: Section, colors: ReturnType<typeof getColors>): string {
  const c = s.content as { title?: string; items: Array<{ icon?: string; title: string; description: string }> };
  const items = (c.items || []).map((item) =>
    indent(`
<div key="${item.title}" style={${styleObject({ padding: '32px 24px', background: colors.bg, borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' })}}>
  ${item.icon ? `<div style={${styleObject({ fontSize: '2rem', marginBottom: '16px' })}}>${item.icon}</div>` : ''}
  <h3 style={${styleObject({ color: colors.accent, marginBottom: '8px', fontSize: '1.125rem' })}}>${item.title}</h3>
  <p style={${styleObject({ color: colors.muted, lineHeight: '1.6' })}}>${item.description}</p>
</div>`, 2)
  ).join('\n');

  return `
function Features() {
  const items = ${JSON.stringify(c.items || [])};

  return (
    <section style={${styleObject({ padding: '80px 24px', background: colors.surface, textAlign: 'center' })}}>
      ${c.title ? `<h2 style={${styleObject({ fontSize: '2rem', color: colors.text, marginBottom: '48px' })}}>${c.title}</h2>` : ''}
      <div style={${styleObject({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', maxWidth: '1000px', margin: '0 auto' })}}>
        {items.map((item) => (
${indent(items, 3)}
        ))}
      </div>
    </section>
  );
}`;
}

function renderSpecs(s: Section, colors: ReturnType<typeof getColors>): string {
  const c = s.content as { title?: string; items: Array<{ label: string; value: string; icon?: string }>; columns?: number };
  return `
function Specs() {
  const data = ${JSON.stringify(c.items || [])};

  return (
    <section style={${styleObject({ padding: '80px 24px', background: colors.bg, textAlign: 'center' })}}>
      ${c.title ? `<h2 style={${styleObject({ fontSize: '2rem', color: colors.text, marginBottom: '48px' })}}>${c.title}</h2>` : ''}
      <div style={${styleObject({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', maxWidth: '1000px', margin: '0 auto' })}}>
        {data.map((item) => (
          <div key={item.label} style={${styleObject({ padding: '24px', background: colors.surface, borderRadius: '6px', borderLeft: `3px solid ${colors.accent}`, textAlign: 'left' })}}>
            {item.icon && <span>{item.icon}</span>}
            <div style={${styleObject({ color: colors.muted, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' })}}>{item.label}</div>
            <div style={${styleObject({ color: colors.text, fontWeight: '600' })}}>{item.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}`;
}

function renderFaq(s: Section, colors: ReturnType<typeof getColors>): string {
  const c = s.content as { title?: string; items: Array<{ question: string; answer: string }> };
  return `
function Faq() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);
  const faqs = ${JSON.stringify(c.items || [])};

  return (
    <section style={${styleObject({ padding: '80px 24px', background: colors.surface })}}>
      ${c.title ? `<h2 style={${styleObject({ fontSize: '2rem', color: colors.text, textAlign: 'center', marginBottom: '48px' })}}>${c.title}</h2>` : ''}
      <div style={${styleObject({ maxWidth: '720px', margin: '0 auto' })}}>
        {faqs.map((faq, i) => (
          <div key={i} style={${styleObject({ marginBottom: '12px', background: colors.bg, borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' })}}>
            <div
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              style={${styleObject({ padding: '20px 24px', color: colors.text, fontWeight: '600' })}}>
              {faq.question}
            </div>
            {openIndex === i && (
              <div style={${styleObject({ padding: '0 24px 20px', color: colors.muted, lineHeight: '1.7' })}}>
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}`;
}

function renderContactForm(s: Section, colors: ReturnType<typeof getColors>, lang: string): string {
  const c = s.content as { title?: string; subtitle?: string; fields: Array<{ name: string; label: string; type: string; required?: boolean }> };
  const submitLabel = lang.startsWith('zh') ? '提交' : 'Submit';
  return `
function ContactForm() {
  const [form, setForm] = React.useState<Record<string, string>>({});

  const handleChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', form);
  };

  return (
    <section style={${styleObject({ padding: '80px 24px', background: colors.bg })}}>
      ${c.title ? `<h2 style={${styleObject({ fontSize: '2rem', color: colors.text, textAlign: 'center', marginBottom: '8px' })}}>${c.title}</h2>` : ''}
      ${c.subtitle ? `<p style={${styleObject({ textAlign: 'center', color: colors.muted, marginBottom: '40px' })}}>${c.subtitle}</p>` : ''}
      <form onSubmit={handleSubmit} style={${styleObject({ maxWidth: '520px', margin: '0 auto' })}}>
        ${(c.fields || []).map((f) => `
        <div key="${f.name}" style={${styleObject({ marginBottom: '16px' })}}>
          <label style={${styleObject({ display: 'block', color: colors.text, marginBottom: '6px', fontSize: '0.9rem' })}}>${f.label}${f.required ? ' *' : ''}</label>
          ${f.type === 'textarea'
            ? `<textarea name="${f.name}" required={${!!f.required}} value={form['${f.name}'] || ''} onChange={(e) => handleChange('${f.name}', e.target.value)} style={${styleObject({ width: '100%', padding: '12px', background: colors.surface, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: colors.text, fontSize: '1rem', resize: 'vertical', minHeight: '100px', boxSizing: 'border-box' })}} />`
            : `<input type="${f.type}" name="${f.name}" required={${!!f.required}} value={form['${f.name}'] || ''} onChange={(e) => handleChange('${f.name}', e.target.value)} style={${styleObject({ width: '100%', padding: '12px', background: colors.surface, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: colors.text, fontSize: '1rem', boxSizing: 'border-box' })}} />`
          }
        </div>`).join('')}
        <button type="submit" style={${styleObject({ width: '100%', padding: '14px', background: colors.accent, color: colors.bg, border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '1rem', cursor: 'pointer', transition: 'opacity 0.2s' })}}>${submitLabel}</button>
      </form>
    </section>
  );
}`;
}

function renderTrustBadges(s: Section, colors: ReturnType<typeof getColors>): string {
  const c = s.content as { title?: string; badges: Array<{ name: string; icon?: string }> };
  return `
function TrustBadges() {
  const badges = ${JSON.stringify(c.badges || [])};

  return (
    <section style={${styleObject({ padding: '48px 24px', background: colors.bg, textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' })}}>
      ${c.title ? `<h3 style={${styleObject({ color: colors.muted, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '24px' })}}>${c.title}</h3>` : ''}
      <div style={${styleObject({ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' })}}>
        {badges.map((b) => (
          <div key={b.name} style={${styleObject({ padding: '8px 20px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', border: `1px solid ${colors.accent}33`, color: colors.accent, fontWeight: '600', fontSize: '0.9rem' })}}>
            {b.icon}{b.name}
          </div>
        ))}
      </div>
    </section>
  );
}`;
}

function renderFooter(s: Section, colors: ReturnType<typeof getColors>): string {
  const c = s.content as { brandName?: string; links?: Array<{ label: string; href: string }>; copyright?: string };
  return `
function Footer() {
  return (
    <footer style={${styleObject({ padding: '48px 24px', background: colors.surface, textAlign: 'center' })}}>
      ${c.brandName ? `<div style={${styleObject({ color: colors.text, fontWeight: '700', fontSize: '1.2rem', marginBottom: '16px' })}}>${c.brandName}</div>` : ''}
      ${c.links?.length ? `<nav style={${styleObject({ marginBottom: '16px' })}}>${c.links.map((l) => `<a key="${l.label}" href="${l.href}" style={${styleObject({ color: colors.muted, textDecoration: 'none', margin: '0 12px', fontSize: '0.9rem' })}}>${l.label}</a>`).join('')}</nav>` : ''}
      ${c.copyright ? `<div style={${styleObject({ color: colors.muted, fontSize: '0.8rem' })}}>${c.copyright}</div>` : ''}
    </footer>
  );
}`;
}

function renderCustom(s: Section): string {
  const c = s.content as { component?: string; props?: Record<string, unknown> };
  return `
function ${c.component || 'Custom'}() {
  const props = ${JSON.stringify(c.props || {}, null, 2)};
  return (
    <section>
      {/* Custom component: ${c.component || 'unnamed'} — implement me */}
      <pre>{JSON.stringify(props, null, 2)}</pre>
    </section>
  );
}`;
}

function renderPricing(s: Section, colors: ReturnType<typeof getColors>): string {
  const c = s.content as { title?: string; items: Array<{ name: string; price: string; description?: string; features?: string[]; highlighted?: boolean }> };
  const cards = (c.items || []).map((plan) => {
    const isHL = plan.highlighted;
    return indent(`
<div key="${plan.name}" style={${styleObject({
      padding: '40px 24px',
      background: isHL ? colors.accent : colors.bg,
      color: isHL ? colors.bg : colors.text,
      borderRadius: '8px',
      border: isHL ? 'none' : '1px solid rgba(255,255,255,0.06)',
    })}}>
  <h3 style={${styleObject({ fontSize: '1.25rem', marginBottom: '8px' })}}>${plan.name}</h3>
  <div style={${styleObject({ fontSize: '2.5rem', fontWeight: '700', marginBottom: '4px' })}}>${plan.price}</div>
  ${plan.description ? `<p style={${styleObject({ color: isHL ? colors.bg : colors.muted, marginBottom: '24px' })}}>${plan.description}</p>` : ''}
  ${plan.features ? `
  <ul style={${styleObject({ listStyle: 'none', padding: '0', textAlign: 'left' })}}>
    ${plan.features.map((f) => `<li key="${f}" style={${styleObject({ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' })}}>✓ ${f}</li>`).join('\n    ')}
  </ul>` : ''}
</div>`, 3);
  }).join('\n');

  return `
function Pricing() {
  const plans = ${JSON.stringify(c.items || [])};

  return (
    <section style={${styleObject({ padding: '80px 24px', background: colors.surface, textAlign: 'center' })}}>
      ${c.title ? `<h2 style={${styleObject({ fontSize: '2rem', color: colors.text, marginBottom: '48px' })}}>${c.title}</h2>` : ''}
      <div style={${styleObject({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', maxWidth: '1000px', margin: '0 auto' })}}>
${cards}
      </div>
    </section>
  );
}`;
}

function renderGallery(s: Section, colors: ReturnType<typeof getColors>): string {
  const c = s.content as { title?: string; images: Array<{ src: string; alt: string; caption?: string }> };
  const cards = (c.images || []).map((img) =>
    indent(`
<div key="${img.src}" style={${styleObject({ borderRadius: '8px', overflow: 'hidden', background: colors.surface })}}>
  <img src="${img.src}" alt="${img.alt}" style={${styleObject({ width: '100%', height: '250px', objectFit: 'cover' })}} />
  ${img.caption ? `<p style={${styleObject({ padding: '12px', color: colors.muted, fontSize: '0.9rem' })}}>${img.caption}</p>` : ''}
</div>`, 3)
  ).join('\n');

  return `
function Gallery() {
  const images = ${JSON.stringify(c.images || [])};

  return (
    <section style={${styleObject({ padding: '80px 24px', background: colors.bg, textAlign: 'center' })}}>
      ${c.title ? `<h2 style={${styleObject({ fontSize: '2rem', color: colors.text, marginBottom: '48px' })}}>${c.title}</h2>` : ''}
      <div style={${styleObject({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', maxWidth: '1000px', margin: '0 auto' })}}>
${cards}
      </div>
    </section>
  );
}`;
}

function renderCta(s: Section, colors: ReturnType<typeof getColors>): string {
  const c = s.content as { headline?: string; body?: string; buttonText: string; buttonAction: string };
  return `
function CtaSection() {
  return (
    <section style={${styleObject({ padding: '80px 24px', background: colors.accent, textAlign: 'center' })}}>
      ${c.headline ? `<h2 style={${styleObject({ fontSize: '2rem', color: colors.bg, marginBottom: '16px' })}}>${c.headline}</h2>` : ''}
      ${c.body ? `<p style={${styleObject({ color: colors.bg, opacity: '0.85', maxWidth: '600px', margin: '0 auto 32px', lineHeight: '1.6' })}}>${c.body}</p>` : ''}
      <a href="#${c.buttonAction}" style={${styleObject({ display: 'inline-block', padding: '14px 40px', background: colors.bg, color: colors.accent, fontWeight: '600', borderRadius: '6px', textDecoration: 'none', fontSize: '1rem' })}}>${c.buttonText}</a>
    </section>
  );
}`;
}

function renderTestimonials(s: Section, colors: ReturnType<typeof getColors>): string {
  const c = s.content as { title?: string; items: Array<{ quote: string; name: string; role?: string }> };
  const cards = (c.items || []).map((t) =>
    indent(`
<div key="${t.name}" style={${styleObject({ padding: '32px', background: colors.bg, borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' })}}>
  <p style={${styleObject({ color: colors.text, fontStyle: 'italic', lineHeight: '1.7', marginBottom: '16px' })}}>"${t.quote}"</p>
  <div style={${styleObject({ color: colors.accent, fontWeight: '600' })}}>${t.name}</div>
  ${t.role ? `<div style={${styleObject({ color: colors.muted, fontSize: '0.9rem' })}}>${t.role}</div>` : ''}
</div>`, 3)
  ).join('\n');

  return `
function Testimonials() {
  const items = ${JSON.stringify(c.items || [])};

  return (
    <section style={${styleObject({ padding: '80px 24px', background: colors.surface, textAlign: 'center' })}}>
      ${c.title ? `<h2 style={${styleObject({ fontSize: '2rem', color: colors.text, marginBottom: '48px' })}}>${c.title}</h2>` : ''}
      <div style={${styleObject({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', maxWidth: '1000px', margin: '0 auto' })}}>
${cards}
      </div>
    </section>
  );
}`;
}

// ─── Section Router ──────────────────────────────────────────────

type RenderFn = (s: Section, colors: ReturnType<typeof getColors>, lang: string) => string;

const SECTION_RENDERERS: Record<string, RenderFn> = {
  hero: (s, c, _l) => renderHero(s, c),
  features: (s, c, _l) => renderFeatures(s, c),
  specs: (s, c, _l) => renderSpecs(s, c),
  faq: (s, c, _l) => renderFaq(s, c),
  contact_form: (s, c, l) => renderContactForm(s, c, l),
  trust_badges: (s, c, _l) => renderTrustBadges(s, c),
  footer: (s, c, _l) => renderFooter(s, c),
  pricing: (s, c, _l) => renderPricing(s, c),
  gallery: (s, c, _l) => renderGallery(s, c),
  cta: (s, c, _l) => renderCta(s, c),
  testimonials: (s, c, _l) => renderTestimonials(s, c),
  custom: (s, _c, _l) => renderCustom(s),
};

// ─── Main Renderer ────────────────────────────────────────────────

/**
 * Render an Intent IR to a complete React functional component file (.tsx).
 */
export function renderReact(ir: IntentIR): string {
  const colors = getColors(ir.design.colorScheme);
  const meta = ir.intent;
  const sorted = [...ir.layout].sort((a, b) => a.priority - b.priority);

  const componentName = meta.summary
    ? meta.summary
        .replace(/[^a-zA-Z0-9一-鿿\s]/g, '')
        .split(/\s+/)
        .slice(0, 3)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join('')
    : 'LandingPage';

  const sectionsCode = sorted
    .map((s) => {
      const renderer = SECTION_RENDERERS[s.type] || SECTION_RENDERERS.custom;
      return renderer(s, colors, meta.language);
    })
    .join('\n\n');

  return `import React, { useState } from 'react';

/**
 * ${meta.summary}
 * Generated by intent-compiler v0.1.0
 * Target: ${meta.language} · ${meta.type} · ${ir.design.colorScheme}
 */

// ─── Color Tokens ──────────────────────────────────────────────

const colors = ${JSON.stringify(colors, null, 2)} as const;

// ─── Components ────────────────────────────────────────────────

${sectionsCode}

// ─── Main App ──────────────────────────────────────────────────

export default function ${componentName}() {
  return (
    <div style={{
      background: colors.bg,
      color: colors.text,
      fontFamily: "${ir.design.typography === 'classic-serif' ? 'Georgia, serif' : 'Inter, PingFang SC, Microsoft YaHei, sans-serif'}",
      WebkitFontSmoothing: 'antialiased',
    }}>
${indent(sorted.map((s) => `<${s.type.charAt(0).toUpperCase() + s.type.slice(1).replace(/_./g, (m) => m[1].toUpperCase())} />`).join('\n'), 3)}
    </div>
  );
}
`;
}
