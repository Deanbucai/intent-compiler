/**
 * Site Config — multi-page site support.
 *
 * A site is:
 *   site.json          ← shared design, nav, footer, page list
 *   index.ir.json      ← homepage (regular IR, design inherited from site)
 *   products.ir.json   ← products page
 *   about.ir.json      ← about page
 *
 * site.json is optional. Without it, each IR file is standalone (single-page mode).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import type { IntentIR, DesignSystem, FooterContent } from './schema';
import { renderHTML } from './renderers/html';

// ─── Types ────────────────────────────────────────────────────────

export interface SiteNav {
  label: string;
  href: string;
}

export interface SiteConfig {
  /** Site name (used in <title> suffix) */
  name?: string;
  /** Default language */
  language?: string;
  /** Shared design — pages without their own design inherit this */
  design: DesignSystem;
  /** Site-wide navigation */
  nav?: SiteNav[];
  /** Shared footer */
  footer?: FooterContent;
  /** Page mapping: URL path → IR file path (relative to site.json) */
  pages?: Record<string, string>;
}

// ─── Default Site Config ──────────────────────────────────────────

const DEFAULT_DESIGN: DesignSystem = {
  colorScheme: 'dark-gold',
  tone: 'professional',
  typography: 'modern-sans',
  responsive: true,
};

export function createDefaultSite(name?: string): SiteConfig {
  return {
    name: name || 'My Site',
    language: 'zh-CN',
    design: DEFAULT_DESIGN,
    nav: [
      { label: '首页', href: '/' },
      { label: '关于', href: '/about' },
      { label: '联系', href: '/contact' },
    ],
    footer: {
      brandName: name || 'My Site',
      links: [
        { label: '首页', href: '/' },
        { label: '关于', href: '/about' },
        { label: '联系', href: '/contact' },
      ],
      copyright: `© 2026 ${name || 'My Site'}`,
    },
  };
}

// ─── Build ────────────────────────────────────────────────────────

export interface BuildResult {
  path: string;
  url: string;
  size: number;
}

/**
 * Build a multi-page site from a site.json directory.
 *
 * 1. Reads site.json for shared design + nav + footer
 * 2. Renders each page IR as HTML
 * 3. Injects shared nav and footer
 * 4. Outputs to _site/ directory
 */
export function buildSite(siteDir: string): BuildResult[] {
  const sitePath = join(siteDir, 'site.json');
  if (!existsSync(sitePath)) {
    throw new Error(`site.json not found in ${siteDir}. Run "intentc site init" first.`);
  }

  const site: SiteConfig = JSON.parse(readFileSync(sitePath, 'utf-8'));
  const results: BuildResult[] = [];
  const outputDir = join(siteDir, '_site');
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  // If site has explicit page list, use it. Otherwise auto-discover *.ir.json files.
  if (site.pages) {
    for (const [url, irFile] of Object.entries(site.pages)) {
      const irPath = join(siteDir, irFile);
      if (!existsSync(irPath)) {
        console.error(`  ⚠ Missing: ${irFile} — skipping`);
        continue;
      }
      const result = buildPage(irPath, site, url, outputDir);
      if (result) results.push(result);
    }
  } else {
    // Auto-discover: all *.ir.json files in the directory (excluding site.json)
    const files = readdirSync(siteDir).filter(
      (f) => f.endsWith('.ir.json') && f !== 'site.json'
    );
    for (const file of files) {
      const irPath = join(siteDir, file);
      const url = '/' + file.replace('.ir.json', '').replace(/^index$/, '');
      const result = buildPage(irPath, site, url, outputDir);
      if (result) results.push(result);
    }
  }

  return results;
}

function buildPage(
  irPath: string,
  site: SiteConfig,
  url: string,
  outputDir: string
): BuildResult | null {
  try {
    const ir: IntentIR = JSON.parse(readFileSync(irPath, 'utf-8'));

    // Inherit design from site if page doesn't have its own
    if (!ir.design || !ir.design.colorScheme) {
      ir.design = site.design;
    }

    // Render page HTML
    let html = renderHTML(ir);

    // Inject site nav (after <body>)
    if (site.nav && site.nav.length > 0) {
      const navHTML = `
<nav style="position:fixed;top:0;left:0;right:0;z-index:100;padding:14px 40px;display:flex;justify-content:space-between;align-items:center;background:rgba(8,8,15,0.85);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,0.04);font-family:'Inter','PingFang SC',sans-serif">
  <a href="/" style="color:#c9a84c;font-weight:800;text-decoration:none;letter-spacing:2px;font-size:1rem">${site.name || ''}</a>
  <div style="display:flex;gap:24px">
    ${site.nav.map((n) => `
    <a href="${n.href}" style="color:#888;text-decoration:none;font-size:0.85rem;transition:color .2s" onmouseover="this.style.color='#c9a84c'" onmouseout="this.style.color='#888'">${n.label}</a>
    `).join('')}
  </div>
</nav>`;
      html = html.replace('<body>', '<body>\n' + navHTML);
    }

    // Inject site footer (before </body>)
    if (site.footer) {
      const f = site.footer;
      const footerHTML = `
<footer style="padding:48px 40px;background:#12121a;text-align:center;border-top:1px solid rgba(255,255,255,0.04);font-family:'Inter','PingFang SC',sans-serif">
  ${f.brandName ? `<div style="color:#e8e8e8;font-weight:700;font-size:1.1rem;margin-bottom:12px;letter-spacing:2px">${f.brandName}</div>` : ''}
  ${f.links?.length ? `
  <nav style="margin-bottom:12px">
    ${f.links.map((l) => `<a href="${l.href}" style="color:#888;text-decoration:none;margin:0 12px;font-size:0.85rem">${l.label}</a>`).join('')}
  </nav>` : ''}
  ${f.copyright ? `<div style="color:#666;font-size:0.75rem">${f.copyright}</div>` : ''}
</footer>`;
      html = html.replace('</body>', footerHTML + '\n</body>');
    }

    // Write output
    const outFile = url === '/' ? 'index.html' : url.replace(/^\//, '') + '.html';
    const outDir = join(outputDir, dirname(outFile));
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outputDir, outFile), html);

    return { path: join(outputDir, outFile), url, size: html.length };
  } catch (err: unknown) {
    console.error(`  ✗ ${url}: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}
