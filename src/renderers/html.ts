import type { IntentIR, Section } from '../schema';

/**
 * Reference HTML renderer — Intent IR → standalone HTML page.
 *
 * Produces a self-contained HTML file with:
 * - Inline styles (no external CSS dependencies)
 * - Semantic HTML5 structure
 * - Responsive meta viewport
 * - Zero JavaScript dependency (except where interactivity is needed)
 */

// ─── Color Scheme Presets ───────────────────────────────────────

const COLOR_PRESETS: Record<string, { bg: string; surface: string; text: string; accent: string; muted: string }> = {
  'dark-gold': {
    bg: '#08080f',
    surface: '#12121a',
    text: '#e8e8e8',
    accent: '#c9a84c',
    muted: '#888',
  },
  'dark-blue': {
    bg: '#0a0e1a',
    surface: '#111827',
    text: '#e2e8f0',
    accent: '#3b82f6',
    muted: '#94a3b8',
  },
  'light-blue': {
    bg: '#ffffff',
    surface: '#f8fafc',
    text: '#1e293b',
    accent: '#2563eb',
    muted: '#64748b',
  },
  'minimal-white': {
    bg: '#ffffff',
    surface: '#f5f5f5',
    text: '#171717',
    accent: '#404040',
    muted: '#737373',
  },
};

function getColors(colorScheme: string) {
  // Exact match
  if (COLOR_PRESETS[colorScheme]) return COLOR_PRESETS[colorScheme];
  // Prefix match: "dark-gold-modern" → match "dark-gold"
  for (const [key, val] of Object.entries(COLOR_PRESETS)) {
    if (colorScheme.startsWith(key)) return val;
  }
  // Default: dark professional
  return COLOR_PRESETS['dark-gold'];
}

function getFontStack(typography?: string): string {
  if (typography?.includes('serif') || typography?.includes('classic')) {
    return "'Georgia', 'Noto Serif SC', serif";
  }
  return "'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif";
}

// ─── Component Renderers ────────────────────────────────────────

function renderHero(s: Section, colors: ReturnType<typeof getColors>, font: string, _lang: string): string {
  const c = s.content as { headline?: string; subheadline?: string; cta?: { text: string; action: string } };
  return `
<section id="${s.id}" style="
  padding: 120px 24px 80px;
  text-align: center;
  background: linear-gradient(135deg, ${colors.bg} 0%, ${colors.surface} 100%);
">
  <h1 style="
    font-size: clamp(2rem, 5vw, 3.5rem);
    font-weight: 700;
    color: ${colors.text};
    margin-bottom: 16px;
    line-height: 1.2;
    font-family: ${font};
  ">${c.headline || ''}</h1>
  ${c.subheadline ? `
  <p style="
    font-size: 1.125rem;
    color: ${colors.muted};
    max-width: 600px;
    margin: 0 auto 32px;
    line-height: 1.6;
    font-family: ${font};
  ">${c.subheadline}</p>` : ''}
  ${c.cta ? `
  <a href="#${c.cta.action}" style="
    display: inline-block;
    padding: 14px 40px;
    background: ${colors.accent};
    color: ${colors.bg};
    font-weight: 600;
    border-radius: 6px;
    text-decoration: none;
    font-size: 1rem;
    font-family: ${font};
    transition: opacity 0.2s;
  ">${c.cta.text}</a>` : ''}
</section>`;
}

function renderFeatures(s: Section, colors: ReturnType<typeof getColors>, font: string, _lang: string): string {
  const c = s.content as { title?: string; items: Array<{ icon?: string; title: string; description: string }> };
  const cols = Math.min((c.items || []).length, 3);
  return `
<section id="${s.id}" style="
  padding: 80px 24px;
  background: ${colors.surface};
  text-align: center;
">
  ${c.title ? `<h2 style="font-size: 2rem; color: ${colors.text}; margin-bottom: 48px; font-family: ${font};">${c.title}</h2>` : ''}
  <div style="
    display: grid;
    grid-template-columns: repeat(${cols}, 1fr);
    gap: 32px;
    max-width: 1000px;
    margin: 0 auto;
  ">
    ${(c.items || []).map((item) => `
    <div style="
      padding: 32px 24px;
      background: ${colors.bg};
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.06);
    ">
      ${item.icon ? `<div style="font-size: 2rem; margin-bottom: 16px;">${item.icon}</div>` : ''}
      <h3 style="color: ${colors.accent}; margin-bottom: 8px; font-size: 1.125rem; font-family: ${font};">${item.title}</h3>
      <p style="color: ${colors.muted}; line-height: 1.6; font-family: ${font};">${item.description}</p>
    </div>`).join('')}
  </div>
</section>`;
}

function renderSpecs(s: Section, colors: ReturnType<typeof getColors>, font: string, _lang: string): string {
  const c = s.content as { title?: string; items: Array<{ label: string; value: string; icon?: string }>; columns?: number };
  const cols = c.columns || Math.min((c.items || []).length, 3);
  return `
<section id="${s.id}" style="
  padding: 80px 24px;
  background: ${colors.bg};
  text-align: center;
">
  ${c.title ? `<h2 style="font-size: 2rem; color: ${colors.text}; margin-bottom: 48px; font-family: ${font};">${c.title}</h2>` : ''}
  <div style="
    display: grid;
    grid-template-columns: repeat(${cols}, 1fr);
    gap: 24px;
    max-width: 1000px;
    margin: 0 auto;
  ">
    ${(c.items || []).map((item) => `
    <div style="
      padding: 24px;
      background: ${colors.surface};
      border-radius: 6px;
      border-left: 3px solid ${colors.accent};
      text-align: left;
    ">
      ${item.icon ? `<span style="margin-right: 8px;">${item.icon}</span>` : ''}
      <div style="color: ${colors.muted}; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; font-family: ${font};">${item.label}</div>
      <div style="color: ${colors.text}; font-weight: 600; font-family: ${font};">${item.value}</div>
    </div>`).join('')}
  </div>
</section>`;
}

function renderFaq(s: Section, colors: ReturnType<typeof getColors>, font: string, _lang: string): string {
  const c = s.content as { title?: string; items: Array<{ question: string; answer: string }> };
  return `
<section id="${s.id}" style="
  padding: 80px 24px;
  background: ${colors.surface};
">
  ${c.title ? `<h2 style="font-size: 2rem; color: ${colors.text}; text-align: center; margin-bottom: 48px; font-family: ${font};">${c.title}</h2>` : ''}
  <div style="max-width: 720px; margin: 0 auto;">
    ${(c.items || []).map((item, i) => `
    <details style="
      margin-bottom: 12px;
      background: ${colors.bg};
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.06);
      cursor: pointer;
    " ${i === 0 ? 'open' : ''}>
      <summary style="
        padding: 20px 24px;
        color: ${colors.text};
        font-weight: 600;
        font-family: ${font};
        list-style: none;
      ">${item.question}</summary>
      <div style="
        padding: 0 24px 20px;
        color: ${colors.muted};
        line-height: 1.7;
        font-family: ${font};
      ">${item.answer}</div>
    </details>`).join('')}
  </div>
</section>`;
}

function renderContactForm(s: Section, colors: ReturnType<typeof getColors>, font: string, lang: string): string {
  const c = s.content as {
    title?: string;
    subtitle?: string;
    fields: Array<{ name: string; label: string; type: string; required?: boolean }>;
    endpoint?: string;
  };
  return `
<section id="${s.id}" style="
  padding: 80px 24px;
  background: ${colors.bg};
">
  ${c.title ? `<h2 style="font-size: 2rem; color: ${colors.text}; text-align: center; margin-bottom: 8px; font-family: ${font};">${c.title}</h2>` : ''}
  ${c.subtitle ? `<p style="text-align: center; color: ${colors.muted}; margin-bottom: 40px; font-family: ${font};">${c.subtitle}</p>` : ''}
  <form style="max-width: 520px; margin: 0 auto;" ${c.endpoint ? `action="${c.endpoint}" method="POST"` : ''}>
    ${(c.fields || []).map((f) => `
    <div style="margin-bottom: 16px;">
      <label style="display: block; color: ${colors.text}; margin-bottom: 6px; font-size: 0.9rem; font-family: ${font};">${f.label}${f.required ? ' *' : ''}</label>
      ${f.type === 'textarea'
        ? `<textarea name="${f.name}" ${f.required ? 'required' : ''} style="
            width: 100%; padding: 12px; background: ${colors.surface}; border: 1px solid rgba(255,255,255,0.1);
            border-radius: 6px; color: ${colors.text}; font-size: 1rem; resize: vertical; min-height: 100px;
            font-family: ${font}; box-sizing: border-box;
          "></textarea>`
        : `<input type="${f.type}" name="${f.name}" ${f.required ? 'required' : ''} style="
            width: 100%; padding: 12px; background: ${colors.surface}; border: 1px solid rgba(255,255,255,0.1);
            border-radius: 6px; color: ${colors.text}; font-size: 1rem;
            font-family: ${font}; box-sizing: border-box;
          " />`}
    </div>`).join('')}
    <button type="submit" style="
      width: 100%; padding: 14px; background: ${colors.accent}; color: ${colors.bg};
      border: none; border-radius: 6px; font-weight: 600; font-size: 1rem;
      cursor: pointer; font-family: ${font}; transition: opacity 0.2s;
    ">${lang.startsWith('zh') ? '提交' : 'Submit'}</button>
  </form>
</section>`;
}

function renderTrustBadges(s: Section, colors: ReturnType<typeof getColors>, font: string, _lang: string): string {
  const c = s.content as { title?: string; badges: Array<{ name: string; icon?: string }> };
  return `
<section id="${s.id}" style="
  padding: 48px 24px;
  background: ${colors.bg};
  text-align: center;
  border-top: 1px solid rgba(255,255,255,0.06);
  border-bottom: 1px solid rgba(255,255,255,0.06);
">
  ${c.title ? `<h3 style="color: ${colors.muted}; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 24px; font-family: ${font};">${c.title}</h3>` : ''}
  <div style="display: flex; justify-content: center; gap: 40px; flex-wrap: wrap;">
    ${(c.badges || []).map((b) => `
    <div style="
      padding: 8px 20px;
      background: rgba(255,255,255,0.04);
      border-radius: 4px;
      border: 1px solid rgba(201,168,76,0.2);
      color: ${colors.accent};
      font-weight: 600;
      font-size: 0.9rem;
      font-family: ${font};
    ">${b.icon ? b.icon + ' ' : ''}${b.name}</div>`).join('')}
  </div>
</section>`;
}

function renderFooter(s: Section, colors: ReturnType<typeof getColors>, font: string, _lang: string): string {
  const c = s.content as { brandName?: string; links?: Array<{ label: string; href: string }>; copyright?: string };
  return `
<footer id="${s.id}" style="
  padding: 48px 24px;
  background: ${colors.surface};
  text-align: center;
">
  ${c.brandName ? `<div style="color: ${colors.text}; font-weight: 700; font-size: 1.2rem; margin-bottom: 16px; font-family: ${font};">${c.brandName}</div>` : ''}
  ${c.links?.length ? `
  <nav style="margin-bottom: 16px;">
    ${c.links.map((l) => `
    <a href="${l.href}" style="
      color: ${colors.muted};
      text-decoration: none;
      margin: 0 12px;
      font-size: 0.9rem;
      font-family: ${font};
    ">${l.label}</a>`).join('')}
  </nav>` : ''}
  ${c.copyright ? `<div style="color: ${colors.muted}; font-size: 0.8rem; font-family: ${font};">${c.copyright}</div>` : ''}
</footer>`;
}

function renderCustom(s: Section, colors: ReturnType<typeof getColors>, font: string, _lang: string): string {
  const c = s.content as { component?: string; props?: Record<string, unknown> };
  return `
<section id="${s.id}" style="
  padding: 60px 24px;
  background: ${colors.bg};
">
  <div style="max-width: 1000px; margin: 0 auto; color: ${colors.muted}; font-family: ${font};">
    <!-- Custom component: ${c.component || 'unnamed'} -->
    ${JSON.stringify(c.props || {}, null, 2)}
  </div>
</section>`;
}

// ─── Section Router ─────────────────────────────────────────────

type RenderFn = (s: Section, colors: ReturnType<typeof getColors>, font: string, lang: string) => string;

const SECTION_RENDERERS: Record<string, RenderFn> = {
  hero: renderHero,
  features: renderFeatures,
  specs: renderSpecs,
  faq: renderFaq,
  contact_form: renderContactForm,
  trust_badges: renderTrustBadges,
  footer: renderFooter,
  custom: renderCustom,
};

// ─── Main Renderer ──────────────────────────────────────────────

/**
 * Render an Intent IR to a self-contained HTML page.
 *
 * @param ir — Validated Intent IR
 * @returns Complete HTML string
 */
export function renderHTML(ir: IntentIR): string {
  const colors = getColors(ir.design.colorScheme);
  const font = getFontStack(ir.design.typography);
  const meta = ir.intent;
  const sortedSections = [...ir.layout].sort((a, b) => a.priority - b.priority);

  const sectionsHTML = sortedSections
    .map((s) => {
      const renderer = SECTION_RENDERERS[s.type] || renderCustom;
      return renderer(s, colors, font, meta.language);
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="${meta.language.split('-')[0] || 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${meta.summary}">
  <title>${(ir.layout.find((s) => s.type === 'hero')?.content as { headline?: string } | undefined)?.headline || meta.summary}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: ${colors.bg};
      color: ${colors.text};
      font-family: ${font};
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    details summary::-webkit-details-marker { display: none; }
    details summary::marker { display: none; content: ""; }
    @media (max-width: 768px) {
      section { padding-left: 16px !important; padding-right: 16px !important; }
    }
  </style>
</head>
<body>
${sectionsHTML}
<!-- Generated by intent-compiler v0.1.0 -->
</body>
</html>`;
}
