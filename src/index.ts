/**
 * intent-compiler — Natural Language → Structured Intent IR → Any Output
 *
 * @example
 * ```ts
 * import { compile, renderHTML } from 'intent-compiler';
 *
 * const { ir } = await compile("做一个牙刷工厂B2B官网，深色金色调");
 * const html = renderHTML(ir);
 * ```
 */
export { compile, compileStream } from './compiler';
export type { CompileOptions, CompileResult, Provider, StreamEvent } from './compiler';
export { renderHTML } from './renderers/html';
export { renderReact } from './renderers/react';
export { renderMarkdown } from './renderers/markdown';
export { renderSlideDeck } from './renderers/slide';
export { renderDocument } from './renderers/document';
export { registry, discoverRenderers, registerBuiltins } from './renderers/registry';
export type { IntentRenderer, RendererMeta } from './renderers/registry';
export { INTENT_IR_SCHEMA } from './schema';
export type {
  IntentIR,
  IntentMeta,
  DesignSystem,
  Section,
  SectionType,
  SectionContent,
  HeroContent,
  FeaturesContent,
  SpecsContent,
  FaqContent,
  ContactFormContent,
  TrustBadgesContent,
  FooterContent,
  CustomContent,
  Constraints,
} from './schema';
