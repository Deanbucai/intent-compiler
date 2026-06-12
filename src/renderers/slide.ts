/**
 * Slide Deck Renderer — Intent IR → self-contained HTML presentation.
 *
 * Produces a standalone HTML file with:
 * - One full-screen slide per section
 * - Keyboard navigation (← → arrows, Space)
 * - Slide counter
 * - Dark theme by default, respects IR design colors
 * - Zero dependencies, no JavaScript frameworks
 */

import type { IntentIR, Section, TitleSlideContent, ContentSlideContent, BulletsSlideContent, QuoteSlideContent, ImageSlideContent, EndingSlideContent } from '../schema';

const COLOR_PRESETS: Record<string, { bg: string; surface: string; text: string; accent: string; muted: string }> = {
  'dark-gold': { bg: '#08080f', surface: '#12121a', text: '#e8e8e8', accent: '#c9a84c', muted: '#888' },
  'dark-blue': { bg: '#0a0e1a', surface: '#111827', text: '#e2e8f0', accent: '#3b82f6', muted: '#94a3b8' },
  'light-blue': { bg: '#ffffff', surface: '#f8fafc', text: '#1e293b', accent: '#2563eb', muted: '#64748b' },
  'minimal-white': { bg: '#ffffff', surface: '#f5f5f5', text: '#171717', accent: '#404040', muted: '#737373' },
  'warm-brown': { bg: '#1a1410', surface: '#2a2018', text: '#e8d5c4', accent: '#c97a3c', muted: '#8a7060' },
};

function getColors(cs: string) {
  for (const [key, val] of Object.entries(COLOR_PRESETS)) {
    if (cs.startsWith(key)) return val;
  }
  return COLOR_PRESETS['dark-gold'];
}

// ─── Section Renderers ──────────────────────────────────────────

function rTitle(s: Section, colors: ReturnType<typeof getColors>): string {
  const c = s.content as TitleSlideContent;
  return `
<div class="slide" style="background:linear-gradient(135deg,${colors.bg},${colors.surface});display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:80px 40px">
  <h1 style="font-size:clamp(2rem,5vw,3.5rem);color:${colors.text};margin-bottom:16px;font-weight:800">${c.title}</h1>
  ${c.subtitle ? `<p style="font-size:1.25rem;color:${colors.muted};margin-bottom:8px">${c.subtitle}</p>` : ''}
  ${c.presenter ? `<p style="font-size:1rem;color:${colors.accent};margin-top:24px">${c.presenter}</p>` : ''}
  ${c.date ? `<p style="font-size:0.85rem;color:${colors.muted};margin-top:4px">${c.date}</p>` : ''}
</div>`;
}

function rContent(s: Section, colors: ReturnType<typeof getColors>): string {
  const c = s.content as ContentSlideContent;
  return `
<div class="slide" style="background:${colors.bg};padding:80px 60px">
  <h2 style="font-size:2rem;color:${colors.accent};margin-bottom:32px;font-weight:700">${c.title}</h2>
  <div style="font-size:1.1rem;color:${colors.text};line-height:1.8;max-width:800px">
    ${c.body.split('\n').map(p => `<p style="margin-bottom:16px">${p}</p>`).join('')}
  </div>
  ${c.image ? `<img src="${c.image}" style="max-width:60%;margin-top:24px;border-radius:8px" alt="">` : ''}
</div>`;
}

function rBullets(s: Section, colors: ReturnType<typeof getColors>): string {
  const c = s.content as BulletsSlideContent;
  return `
<div class="slide" style="background:${colors.bg};padding:80px 60px">
  <h2 style="font-size:2rem;color:${colors.accent};margin-bottom:40px;font-weight:700">${c.title}</h2>
  <ul style="font-size:1.2rem;color:${colors.text};line-height:2.2;list-style:none;padding:0">
    ${c.bullets.map((b, i) => `
    <li style="padding:8px 0;padding-left:24px;border-left:3px solid ${colors.accent};margin-bottom:12px">
      <span style="color:${colors.accent};font-weight:700;margin-right:12px">${String(i + 1).padStart(2, '0')}</span>${b}
    </li>`).join('')}
  </ul>
</div>`;
}

function rQuote(s: Section, colors: ReturnType<typeof getColors>): string {
  const c = s.content as QuoteSlideContent;
  return `
<div class="slide" style="background:${colors.surface};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:80px 60px">
  <div style="font-size:clamp(1.5rem,4vw,2.5rem);color:${colors.text};font-style:italic;line-height:1.5;max-width:700px;margin-bottom:24px">"${c.quote}"</div>
  ${c.author ? `<div style="font-size:1.1rem;color:${colors.accent};font-weight:600">— ${c.author}</div>` : ''}
  ${c.context ? `<div style="font-size:0.9rem;color:${colors.muted};margin-top:8px">${c.context}</div>` : ''}
</div>`;
}

function rImage(s: Section, colors: ReturnType<typeof getColors>): string {
  const c = s.content as ImageSlideContent;
  return `
<div class="slide" style="background:${colors.bg};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px">
  ${c.title ? `<h2 style="font-size:1.8rem;color:${colors.text};margin-bottom:24px">${c.title}</h2>` : ''}
  <img src="${c.image}" style="max-width:80%;max-height:60vh;border-radius:8px;object-fit:contain" alt="${c.caption || ''}">
  ${c.caption ? `<p style="color:${colors.muted};margin-top:16px;font-size:0.9rem">${c.caption}</p>` : ''}
</div>`;
}

function rEnding(s: Section, colors: ReturnType<typeof getColors>): string {
  const c = s.content as EndingSlideContent;
  return `
<div class="slide" style="background:linear-gradient(135deg,${colors.accent}22,${colors.bg});display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:80px 40px">
  <h2 style="font-size:2.5rem;color:${colors.accent};margin-bottom:16px">${c.title || 'Thank You'}</h2>
  ${c.message ? `<p style="font-size:1.25rem;color:${colors.text};margin-bottom:8px">${c.message}</p>` : ''}
  ${c.contact ? `<p style="font-size:1rem;color:${colors.muted};margin-top:24px">${c.contact}</p>` : ''}
</div>`;
}

// ─── Router ─────────────────────────────────────────────────────

type RenderFn = (s: Section, colors: ReturnType<typeof getColors>) => string;

const SECTION_RENDERERS: Record<string, RenderFn> = {
  title_slide: rTitle,
  content_slide: rContent,
  bullets_slide: rBullets,
  quote_slide: rQuote,
  image_slide: rImage,
  ending_slide: rEnding,
};

// ─── Main ───────────────────────────────────────────────────────

export function renderSlideDeck(ir: IntentIR): string {
  const colors = getColors(ir.design?.colorScheme || 'dark-gold');
  const meta = ir.intent;
  const sorted = [...ir.layout].sort((a, b) => a.priority - b.priority);
  const total = sorted.length;

  const slides = sorted.map((s, i) => {
    const renderer = SECTION_RENDERERS[s.type];
    if (!renderer) {
      // Fallback: render as content slide for web_page sections
      const c = s.content as Record<string, unknown>;
      return rContent({ ...s, content: { title: (c.title as string) || (c.headline as string) || s.type, body: JSON.stringify(c, null, 2) } } as Section, colors);
    }
    return renderer(s, colors);
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="${meta.language?.split('-')[0] || 'en'}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${meta.summary}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter','PingFang SC','Microsoft YaHei',sans-serif;background:${colors.bg};color:${colors.text};overflow:hidden;height:100vh}
.slide{width:100vw;height:100vh;overflow-y:auto;display:none;scroll-snap-align:start}
.slide.active{display:flex}
#counter{position:fixed;bottom:16px;right:24px;font-size:12px;color:${colors.muted};z-index:10;font-family:monospace}
#hint{position:fixed;bottom:16px;left:24px;font-size:11px;color:${colors.muted};z-index:10;opacity:0.6}
</style>
</head>
<body>
${slides}
<div id="counter">1 / ${total}</div>
<div id="hint">← → 导航</div>
<script>
let current=0;const slides=document.querySelectorAll('.slide');const counter=document.getElementById('counter');
function show(i){slides.forEach((s,j)=>{s.classList.toggle('active',j===i)});counter.textContent=(i+1)+' / ${total}'}
show(0);
document.addEventListener('keydown',e=>{
  if(e.key==='ArrowRight'||e.key===' '){e.preventDefault();current=Math.min(current+1,${total}-1);show(current)}
  if(e.key==='ArrowLeft'){e.preventDefault();current=Math.max(current-1,0);show(current)}
});
document.addEventListener('click',e=>{if(e.clientX>window.innerWidth/2){current=Math.min(current+1,${total}-1)}else{current=Math.max(current-1,0)}show(current)});
</script>
</body>
</html>`;
}
