/**
 * Schema validation tests — no API key needed.
 */
import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import Ajv from 'ajv';
import { INTENT_IR_SCHEMA } from '../schema';

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(INTENT_IR_SCHEMA);

const validIR = {
  $schema: 'https://intent-compiler.dev/schema/v0.1.0',
  version: '0.1.0',
  intent: {
    domain: 'web_page',
    type: 'landing',
    language: 'zh-CN',
    summary: 'Test page',
  },
  design: {
    colorScheme: 'dark-gold',
    tone: 'professional',
    responsive: true,
  },
  layout: [
    {
      id: 'hero',
      type: 'hero',
      priority: 10,
      content: {
        headline: 'Hello World',
        cta: { text: 'Click', action: 'signup' },
      },
    },
  ],
};

describe('IR Schema', () => {
  it('validates a correct IR', () => {
    assert.ok(validate(validIR), validate.errors?.map(e => e.message).join('; '));
  });

  it('rejects missing required fields', () => {
    const bad = { ...validIR, intent: undefined };
    assert.ok(!validate(bad));
  });

  it('rejects unknown section type', () => {
    const bad = JSON.parse(JSON.stringify(validIR));
    bad.layout[0].type = 'not_a_real_type';
    assert.ok(!validate(bad));
  });

  it('validates slide_deck domain', () => {
    const slide = JSON.parse(JSON.stringify(validIR));
    slide.intent.domain = 'slide_deck';
    slide.layout[0].type = 'title_slide';
    slide.layout[0].content = { title: 'Hello' };
    assert.ok(validate(slide), validate.errors?.map(e => e.message).join('; '));
  });

  it('validates document domain', () => {
    const doc = JSON.parse(JSON.stringify(validIR));
    doc.intent.domain = 'document';
    doc.layout[0].type = 'document_title';
    doc.layout[0].content = { title: 'Report' };
    assert.ok(validate(doc), validate.errors?.map(e => e.message).join('; '));
  });

  it('rejects empty layout', () => {
    const bad = JSON.parse(JSON.stringify(validIR));
    bad.layout = [];
    assert.ok(!validate(bad));
  });

  it('rejects missing content', () => {
    const bad = JSON.parse(JSON.stringify(validIR));
    bad.layout[0].content = undefined;
    assert.ok(!validate(bad));
  });
});
