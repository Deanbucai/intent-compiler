/**
 * IR Compliance Tracker — verify output matches IR spec.
 *
 * Measures how well a generated HTML file follows its Intent IR:
 * - Section presence (are all IR sections rendered?)
 * - Item counts (does features have 3 items? specs 6?)
 * - Design consistency (is the color scheme applied?)
 *
 * Used by intentc track and as a quality gate for Agent-driven development.
 */

import { readFileSync } from 'fs';
import type { IntentIR } from './schema';

export interface TrackResult {
  score: number;
  maxScore: number;
  sectionResults: Array<{
    type: string;
    present: boolean;
    expectedItems?: number;
    actualItems?: number;
    headline?: string;
  }>;
  designMatch: boolean;
  irSections: number;
  htmlSections: number;
}

export function trackCompliance(irPath: string, htmlPath: string): TrackResult {
  const ir: IntentIR = JSON.parse(readFileSync(irPath, 'utf-8'));
  const html = readFileSync(htmlPath, 'utf-8');
  const body = html.split('<body>')[1]?.split('</body>')[0] || html;
  const irSections = [...ir.layout].sort((a, b) => a.priority - b.priority);

  const results: TrackResult['sectionResults'] = [];
  let score = 0;
  let maxScore = irSections.length + 2; // sections + design + CTA

  for (const s of irSections) {
    const c = s.content as Record<string, unknown>;
    const headline = (c.headline || c.title || s.id) as string;
    const present = body.includes(headline.slice(0, 30)) || body.includes(s.id);

    const result: TrackResult['sectionResults'][0] = { type: s.type, present, headline: headline.slice(0, 60) };
    if (present) score++;

    // Check item counts for collection-based sections
    const items = c.items as unknown[];
    if (items && items.length > 0) {
      const classToMatch = s.type === 'features' ? 'class="feature-card"'
        : s.type === 'specs' ? 'class="spec-card"'
        : s.type === 'trust_badges' ? 'class="hero-badge"'
        : s.type === 'pricing' ? 'class="pricing-card"'
        : s.type === 'gallery' ? 'class="gallery-card"'
        : s.type === 'testimonials' ? 'class="testimonial-card"'
        : null;

      if (classToMatch) {
        result.expectedItems = items.length;
        result.actualItems = (body.match(new RegExp(classToMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        if (result.actualItems === result.expectedItems) {
          score++;
          maxScore++;
        }
      }
    }

    results.push(result);
  }

  // Design check
  const designMatch = ir.design.colorScheme.startsWith('dark') ? body.includes('#0d0d12') || body.includes('#08080f') || body.includes('#0a0e1a') || body.includes('dark')
    : ir.design.colorScheme.startsWith('light') || ir.design.colorScheme.startsWith('minimal') ? body.includes('#fff') || body.includes('light') || body.includes('minimal')
    : true;
  if (designMatch) score++;

  return { score, maxScore, sectionResults: results, designMatch, irSections: irSections.length, htmlSections: results.filter(r => r.present).length };
}
