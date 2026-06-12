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
export { compile } from './compiler';
export type { CompileOptions, CompileResult, Provider } from './compiler';
export { renderHTML } from './renderers/html';
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
