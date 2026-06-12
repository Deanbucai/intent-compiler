/**
 * Renderer Registry — pluggable renderer ecosystem.
 *
 * Anyone can write a renderer that consumes Intent IR and produces output.
 * Drop a file into the renderers directory, or register programmatically.
 *
 * A renderer is simply: { meta: RendererMeta, render: (ir: IntentIR) => string }
 */

import type { IntentIR } from '../schema';
import { readdirSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { pathToFileURL } from 'url';

// ─── Types ────────────────────────────────────────────────────────

export interface RendererMeta {
  /** Unique renderer ID, e.g. "my-email-renderer" */
  id: string;
  /** Human-readable name */
  name: string;
  /** One-line description */
  description: string;
  /** Target domain: web_page, slide_deck, document, or '*' for any */
  domain: string;
  /** Output format description, e.g. "html", "react", "pdf", "email" */
  outputFormat: string;
  /** Version string */
  version: string;
  /** Author name */
  author?: string;
  /** Priority: higher = checked first when multiple renderers match (default 100) */
  priority?: number;
}

export interface IntentRenderer {
  meta: RendererMeta;
  /** Render Intent IR to output string */
  render: (ir: IntentIR) => string;
}

// ─── Registry ─────────────────────────────────────────────────────

class RendererRegistry {
  private renderers = new Map<string, IntentRenderer>();

  /** Register a renderer. Throws if id already exists or contract violated. */
  register(r: IntentRenderer): void {
    if (!r.meta?.id) throw new Error('Renderer requires meta.id');
    if (typeof r.render !== 'function') throw new Error(`Renderer "${r.meta.id}" must export a render() function`);

    if (this.renderers.has(r.meta.id)) {
      throw new Error(`Renderer "${r.meta.id}" already registered. Use a unique id.`);
    }

    this.renderers.set(r.meta.id, r);
  }

  /** Unregister a renderer by id */
  unregister(id: string): boolean {
    return this.renderers.delete(id);
  }

  /** Get a renderer by id */
  get(id: string): IntentRenderer | undefined {
    return this.renderers.get(id);
  }

  /** List all registered renderers, sorted by priority (high first) */
  list(): IntentRenderer[] {
    return [...this.renderers.values()].sort(
      (a, b) => (b.meta.priority ?? 100) - (a.meta.priority ?? 100)
    );
  }

  /** Find renderers for a specific domain */
  listForDomain(domain: string): IntentRenderer[] {
    return this.list().filter((r) => r.meta.domain === domain || r.meta.domain === '*');
  }

  /** Get all registered renderer ids */
  get ids(): string[] {
    return [...this.renderers.keys()];
  }

  /** Number of registered renderers */
  get size(): number {
    return this.renderers.size;
  }
}

// ─── Singleton ────────────────────────────────────────────────────

export const registry = new RendererRegistry();

// ─── Auto-Discovery ───────────────────────────────────────────────

/**
 * Scan a directory for renderer files and register them.
 * Each file must export `{ meta: RendererMeta, render: fn }`.
 *
 * Supports .ts (via tsx) and .js files.
 */
export async function discoverRenderers(dir: string): Promise<IntentRenderer[]> {
  if (!existsSync(dir)) return [];

  const discovered: IntentRenderer[] = [];
  const files = readdirSync(dir).filter(
    (f) => ['.ts', '.js', '.mjs'].includes(extname(f)) && !f.startsWith('_') && !f.endsWith('.d.ts')
  );

  for (const file of files) {
    const fullPath = join(dir, file);
    try {
      // Dynamic import — works for both .ts (via tsx loader) and .js
      const mod = await import(pathToFileURL(fullPath).href);
      const renderer: IntentRenderer = mod.default || mod;

      if (renderer.meta && typeof renderer.render === 'function') {
        registry.register(renderer);
        discovered.push(renderer);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`intent-compiler: failed to load renderer ${file}: ${msg}`);
    }
  }

  return discovered;
}

// ─── Built-in Renderers Registration ──────────────────────────────

import { renderHTML } from './html';
import { renderReact } from './react';
import { renderMarkdown } from './markdown';
import { renderSlideDeck } from './slide';
import { renderDocument } from './document';

const BUILTIN_RENDERERS: IntentRenderer[] = [
  {
    meta: { id: 'html', name: 'HTML Page', description: 'Standalone HTML landing page', domain: 'web_page', outputFormat: 'html', version: '0.0.5', priority: 100 },
    render: renderHTML,
  },
  {
    meta: { id: 'react', name: 'React Components', description: 'React functional component .tsx file', domain: 'web_page', outputFormat: 'react', version: '0.0.5', priority: 90 },
    render: renderReact,
  },
  {
    meta: { id: 'markdown', name: 'Markdown Document', description: 'Formatted .md with table of contents', domain: 'web_page', outputFormat: 'markdown', version: '0.0.5', priority: 80 },
    render: renderMarkdown,
  },
  {
    meta: { id: 'slide', name: 'Slide Deck', description: 'Self-contained HTML presentation with keyboard nav', domain: 'slide_deck', outputFormat: 'html', version: '0.0.5', priority: 100 },
    render: renderSlideDeck,
  },
  {
    meta: { id: 'document', name: 'Document', description: 'Print-friendly HTML document/report', domain: 'document', outputFormat: 'html', version: '0.0.5', priority: 100 },
    render: renderDocument,
  },
];

/** Register all built-in renderers. Call once at startup. */
export function registerBuiltins(): void {
  for (const r of BUILTIN_RENDERERS) {
    try {
      registry.register(r);
    } catch {
      // Already registered — skip
    }
  }
}
