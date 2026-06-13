/**
 * IR Memory Store — SQLite-backed memory for intent compilations.
 *
 * Every compile() call is recorded. Past successful IRs are searched
 * and injected as few-shot examples into future compilations.
 *
 * Over time, the system learns domain-specific patterns:
 *   Factory sites → specs + faq + trust_badges
 *   SaaS → hero + features + pricing + cta
 *   Restaurant → hero + gallery + testimonials
 *
 * Uses Node.js built-in `node:sqlite` — zero external dependencies.
 * Single .db file, portable, no server needed.
 */

import { DatabaseSync } from 'node:sqlite';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// ─── Types ────────────────────────────────────────────────────────

export interface MemoryEntry {
  id: number;
  nl_input: string;
  ir_json: string;
  domain: string;
  industry: string;
  section_types: string; // comma-separated
  color_scheme: string;
  tone: string;
  token_input: number;
  token_output: number;
  model: string;
  quality_score: number;
  created_at: string;
}

export interface MemoryStats {
  total: number;
  by_domain: Record<string, number>;
  by_industry: Record<string, number>;
  most_common_sections: Array<{ types: string; count: number }>;
  recent: MemoryEntry[];
}

// ─── Store ────────────────────────────────────────────────────────

export class IRMemory {
  private db: DatabaseSync;

  constructor(dbPath?: string) {
    const dir = dbPath ? dbPath : join(process.cwd(), '.intent-compiler');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const file = join(dir, 'memory.db');
    this.db = new DatabaseSync(file);
    this._init();
  }

  private _init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nl_input TEXT NOT NULL,
        ir_json TEXT NOT NULL,
        domain TEXT NOT NULL DEFAULT 'web_page',
        industry TEXT DEFAULT '',
        section_types TEXT DEFAULT '',
        color_scheme TEXT DEFAULT '',
        tone TEXT DEFAULT '',
        token_input INTEGER DEFAULT 0,
        token_output INTEGER DEFAULT 0,
        model TEXT DEFAULT '',
        quality_score INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
        nl_input, industry, section_types, color_scheme, tone,
        content='memories', content_rowid='id'
      );

      -- Triggers to keep FTS in sync
      CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
        INSERT INTO memories_fts(rowid, nl_input, industry, section_types, color_scheme, tone)
        VALUES (new.id, new.nl_input, new.industry, new.section_types, new.color_scheme, new.tone);
      END;

      CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
        INSERT INTO memories_fts(memories_fts, rowid, nl_input, industry, section_types, color_scheme, tone)
        VALUES ('delete', old.id, old.nl_input, old.industry, old.section_types, old.color_scheme, old.tone);
      END;
    `);
  }

  // ─── Write ──────────────────────────────────────────────────────

  record(entry: {
    nl_input: string;
    ir_json: string;
    domain: string;
    industry?: string;
    section_types: string[];
    color_scheme: string;
    tone: string;
    token_input: number;
    token_output: number;
    model: string;
    quality_score?: number;
  }): number {
    const stmt = this.db.prepare(`
      INSERT INTO memories (nl_input, ir_json, domain, industry, section_types, color_scheme, tone, token_input, token_output, model, quality_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      entry.nl_input,
      entry.ir_json,
      entry.domain,
      entry.industry || '',
      entry.section_types.join(','),
      entry.color_scheme,
      entry.tone,
      entry.token_input,
      entry.token_output,
      entry.model,
      entry.quality_score || 0
    );
    return Number(result.lastInsertRowid);
  }

  // ─── Search ─────────────────────────────────────────────────────

  /**
   * Find similar past compilations using FTS5 full-text search.
   * Returns top matches sorted by relevance + recency.
   */
  search(query: string, limit = 5): MemoryEntry[] {
    // Build FTS5 query from meaningful words
    const terms = query
      .replace(/[，。！？、；：""''（）【】《》\s]+/g, ' ')
      .split(' ')
      .filter((t) => t.length > 0)
      .map((t) => `"${t}"`)
      .join(' OR ');

    if (!terms) return this.recent(limit);

    try {
      const stmt = this.db.prepare(`
        SELECT m.* FROM memories m
        INNER JOIN memories_fts fts ON m.id = fts.rowid
        WHERE memories_fts MATCH ?
        ORDER BY rank, m.created_at DESC
        LIMIT ?
      `);
      return stmt.all(terms, limit) as unknown as unknown as MemoryEntry[];
    } catch {
      // FTS5 match error (special chars, etc.) — fall back to recent
      return this.recent(limit);
    }
  }

  /**
   * Find IRs from the same industry.
   */
  findByIndustry(industry: string, limit = 5): MemoryEntry[] {
    const stmt = this.db.prepare(`
      SELECT * FROM memories WHERE industry = ? ORDER BY created_at DESC LIMIT ?
    `);
    return stmt.all(industry, limit) as unknown as MemoryEntry[];
  }

  /**
   * Find IRs with similar section type combinations.
   */
  findBySectionPattern(types: string[], limit = 3): MemoryEntry[] {
    // Match entries that share at least 2 section types
    const likeClauses = types.map(() => `section_types LIKE ?`).join(' OR ');
    const params = types.map((t) => `%${t}%`);
    const stmt = this.db.prepare(`
      SELECT * FROM memories WHERE ${likeClauses} ORDER BY created_at DESC LIMIT ?
    `);
    return stmt.all(...params, limit) as unknown as MemoryEntry[];
  }

  /**
   * Get most recent entries.
   */
  recent(limit = 10): MemoryEntry[] {
    const stmt = this.db.prepare('SELECT * FROM memories ORDER BY created_at DESC LIMIT ?');
    return stmt.all(limit) as unknown as MemoryEntry[];
  }

  // ─── Pattern Extraction ─────────────────────────────────────────

  /**
   * Extract common section patterns for a given industry.
   * Returns the top section type combinations and their counts.
   */
  getPatternsForIndustry(industry: string, limit = 5): Array<{ types: string[]; count: number }> {
    const stmt = this.db.prepare(`
      SELECT section_types, COUNT(*) as count
      FROM memories
      WHERE industry = ?
      GROUP BY section_types
      ORDER BY count DESC
      LIMIT ?
    `);
    const rows = stmt.all(industry, limit) as Array<{ section_types: string; count: number }>;
    return rows.map((r) => ({ types: r.section_types.split(',').filter(Boolean), count: r.count }));
  }

  /**
   * Get the best few-shot examples for a new compilation.
   * Strategy: industry match > section pattern match > recent.
   */
  getFewShotExamples(nlInput: string, industry?: string, limit = 2): MemoryEntry[] {
    const candidates: MemoryEntry[] = [];

    // Priority 1: Same industry
    if (industry) {
      candidates.push(...this.findByIndustry(industry, 10));
    }

    // Priority 2: FTS5 keyword match
    if (candidates.length < limit) {
      const ftsResults = this.search(nlInput, 10);
      const seen = new Set(candidates.map((r) => r.id));
      for (const r of ftsResults) {
        if (!seen.has(r.id)) candidates.push(r);
      }
    }

    // Priority 3: Recent fallback
    if (candidates.length === 0) {
      candidates.push(...this.recent(10));
    }

    // Sort: quality_score DESC (higher = better example), then recency
    candidates.sort((a, b) => {
      const scoreDiff = (b.quality_score || 0) - (a.quality_score || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return b.created_at.localeCompare(a.created_at);
    });

    return candidates.slice(0, limit);
  }

  // ─── Stats ──────────────────────────────────────────────────────

  getStats(): MemoryStats {
    const total = (this.db.prepare('SELECT COUNT(*) as c FROM memories').get() as { c: number }).c;

    const byDomain = this.db.prepare('SELECT domain, COUNT(*) as c FROM memories GROUP BY domain').all() as Array<{ domain: string; c: number }>;
    const byIndustry = this.db.prepare("SELECT industry, COUNT(*) as c FROM memories WHERE industry != '' GROUP BY industry ORDER BY c DESC").all() as Array<{ industry: string; c: number }>;
    const topSections = this.db.prepare('SELECT section_types, COUNT(*) as c FROM memories GROUP BY section_types ORDER BY c DESC LIMIT 5').all() as Array<{ section_types: string; c: number }>;
    const recent = this.recent(5);

    return {
      total,
      by_domain: Object.fromEntries(byDomain.map((r) => [r.domain, r.c])),
      by_industry: Object.fromEntries(byIndustry.map((r) => [r.industry, r.c])),
      most_common_sections: topSections.map((r) => ({ types: r.section_types, count: r.c })),
      recent,
    };
  }

  close(): void {
    this.db.close();
  }
}
