/**
 * Renderer registry tests — no API key needed.
 */
import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { registry, registerBuiltins, type IntentRenderer, type IntentIR } from '../index';

describe('Renderer Registry', () => {
  it('registers built-in renderers', () => {
    registerBuiltins();
    const all = registry.list();
    assert.ok(all.length >= 5, `Expected >=5 renderers, got ${all.length}`);
  });

  it('has HTML renderer', () => {
    registerBuiltins();
    const r = registry.get('html');
    assert.ok(r, 'HTML renderer not found');
    assert.equal(r.meta.domain, 'web_page');
    assert.equal(r.meta.outputFormat, 'html');
  });

  it('has slide renderer', () => {
    registerBuiltins();
    const r = registry.get('slide');
    assert.ok(r, 'Slide renderer not found');
    assert.equal(r.meta.domain, 'slide_deck');
  });

  it('has document renderer', () => {
    registerBuiltins();
    const r = registry.get('document');
    assert.ok(r, 'Document renderer not found');
    assert.equal(r.meta.domain, 'document');
  });

  it('filters by domain', () => {
    registerBuiltins();
    const web = registry.listForDomain('web_page');
    assert.ok(web.length >= 3, `Expected >=3 web renderers, got ${web.length}`);

    const slides = registry.listForDomain('slide_deck');
    assert.ok(slides.length >= 1, `Expected >=1 slide renderer, got ${slides.length}`);
  });

  it('rejects duplicate registration', () => {
    const dummy: IntentRenderer = {
      meta: { id: 'html', name: 'Dup', description: '', domain: 'web_page', outputFormat: 'html', version: '1' },
      render: () => '',
    };
    assert.throws(() => registry.register(dummy));
  });

  it('rejects renderer without render function', () => {
    assert.throws(() => registry.register({ meta: { id: 'bad', name: 'B', description: '', domain: '*', outputFormat: 'x', version: '1' }, render: null as any }));
  });

  it('renders HTML from built-in', () => {
    registerBuiltins();
    const r = registry.get('html')!;
    const ir: IntentIR = {
      $schema: '', version: '0.1.0',
      intent: { domain: 'web_page', type: 'landing', language: 'en', summary: 'Test' },
      design: { colorScheme: 'dark-gold', tone: 'professional' },
      layout: [{ id: 'hero', type: 'hero', priority: 10, content: { headline: 'Hello' } }],
    };
    const output = r.render(ir);
    assert.ok(output.includes('Hello'));
    assert.ok(output.includes('<!DOCTYPE html>'));
  });
});
