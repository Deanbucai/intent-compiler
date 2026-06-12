/**
 * Intent IR v0.1.0 — The "LLVM IR" for vibe coding.
 *
 * Natural language intent is compiled into this structured JSON,
 * which any renderer can consume to produce final output (HTML, React, PDF, etc.)
 */

// ─── TypeScript Types ───────────────────────────────────────────

export interface IntentIR {
  /** Schema URI for validation and versioning */
  $schema: string;
  /** IR spec version */
  version: '0.1.0';
  /** What this intent is about */
  intent: IntentMeta;
  /** Visual design system */
  design: DesignSystem;
  /** Ordered list of page sections */
  layout: Section[];
  /** Optional constraints */
  constraints?: Constraints;
}

export interface IntentMeta {
  /** Domain — v0.1.0 only supports 'web_page' */
  domain: 'web_page';
  /** Page type */
  type: 'landing' | 'dashboard' | 'blog' | 'form' | 'portfolio';
  /** Industry context, e.g. 'manufacturing', 'saas', 'healthcare' */
  industry?: string;
  /** Target language code, e.g. 'zh-CN', 'en-US' */
  language: string;
  /** One-line summary of what this page is for */
  summary: string;
}

export interface DesignSystem {
  /** Color scheme descriptor, e.g. 'dark-gold', 'light-blue', 'minimal-white' */
  colorScheme: string;
  /** Tone / personality, e.g. 'professional', 'playful', 'luxury', 'industrial' */
  tone: string;
  /** Typography style, e.g. 'modern-sans', 'classic-serif' */
  typography?: string;
  /** Whether the page should be responsive (default true) */
  responsive?: boolean;
}

export interface Section {
  /** Unique section identifier within this page */
  id: string;
  /** Section type — determines how renderers handle this section */
  type: SectionType;
  /** Display order (lower = earlier) */
  priority: number;
  /** Section-specific content — structure depends on `type` */
  content: SectionContent;
}

/** Supported section types in v0.1.0 */
export type SectionType =
  | 'hero'
  | 'features'
  | 'specs'
  | 'faq'
  | 'contact_form'
  | 'trust_badges'
  | 'pricing'
  | 'gallery'
  | 'cta'
  | 'testimonials'
  | 'footer'
  | 'custom';

/** Content shapes by section type */
export interface HeroContent {
  headline: string;
  subheadline?: string;
  cta?: { text: string; action: string };
  background?: string;
}

export interface FeaturesContent {
  title?: string;
  items: Array<{
    icon?: string;
    title: string;
    description: string;
  }>;
}

export interface SpecsContent {
  title?: string;
  /** Key-value specification pairs */
  items: Array<{
    label: string;
    value: string;
    icon?: string;
  }>;
  /** Number of columns in grid (default auto) */
  columns?: 2 | 3 | 4 | 6;
}

export interface FaqContent {
  title?: string;
  items: Array<{
    question: string;
    answer: string;
  }>;
}

export interface ContactFormContent {
  title?: string;
  subtitle?: string;
  /** Fields to include in the form */
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'email' | 'tel' | 'textarea';
    required?: boolean;
  }>;
  /** Where the form data is sent */
  endpoint?: string;
}

export interface TrustBadgesContent {
  title?: string;
  badges: Array<{
    name: string;
    /** Optional icon/logo URL */
    icon?: string;
  }>;
}

export interface FooterContent {
  brandName?: string;
  links?: Array<{
    label: string;
    href: string;
  }>;
  copyright?: string;
}

export interface PricingContent {
  title?: string;
  items: Array<{
    name: string;
    price: string;
    description?: string;
    features?: string[];
    highlighted?: boolean;
  }>;
}

export interface GalleryContent {
  title?: string;
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
  }>;
}

export interface CtaContent {
  headline?: string;
  body?: string;
  buttonText: string;
  buttonAction: string;
}

export interface TestimonialsContent {
  title?: string;
  items: Array<{
    quote: string;
    name: string;
    role?: string;
  }>;
}

export interface CustomContent {
  component: string;
  props?: Record<string, unknown>;
}

/** Union of all section content types */
export type SectionContent =
  | HeroContent
  | FeaturesContent
  | SpecsContent
  | FaqContent
  | ContactFormContent
  | TrustBadgesContent
  | PricingContent
  | GalleryContent
  | CtaContent
  | TestimonialsContent
  | FooterContent
  | CustomContent;

export interface Constraints {
  /** Maximum number of sections */
  maxSections?: number;
  /** Budget tier for content volume */
  budgetTier?: 'minimal' | 'standard' | 'premium';
  /** Deadline in hours from now */
  deadlineHours?: number;
}

// ─── JSON Schema ────────────────────────────────────────────────

/**
 * Full JSON Schema for Intent IR validation.
 * This is embedded in the compiler prompt so LLMs know the exact contract.
 */
export const INTENT_IR_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://intent-compiler.dev/schema/v0.1.0',
  title: 'Intent IR',
  description: 'Structured intermediate representation for AI-generated web pages.',
  type: 'object',
  required: ['$schema', 'version', 'intent', 'design', 'layout'],
  properties: {
    $schema: {
      type: 'string',
      const: 'https://intent-compiler.dev/schema/v0.1.0',
      description: 'IR schema version identifier',
    },
    version: {
      type: 'string',
      const: '0.1.0',
      description: 'IR spec version',
    },
    intent: {
      type: 'object',
      required: ['domain', 'type', 'language', 'summary'],
      properties: {
        domain: {
          type: 'string',
          const: 'web_page',
          description: 'Intent domain',
        },
        type: {
          type: 'string',
          enum: ['landing', 'dashboard', 'blog', 'form', 'portfolio'],
          description: 'Page type',
        },
        industry: {
          type: 'string',
          description: 'Industry context',
        },
        language: {
          type: 'string',
          description: 'Target language code (e.g. zh-CN, en-US)',
        },
        summary: {
          type: 'string',
          description: 'One-line summary',
        },
      },
    },
    design: {
      type: 'object',
      required: ['colorScheme', 'tone'],
      properties: {
        colorScheme: {
          type: 'string',
          description: 'Color scheme descriptor',
        },
        tone: {
          type: 'string',
          description: 'Visual tone / personality',
        },
        typography: {
          type: 'string',
          description: 'Typography style',
        },
        responsive: {
          type: 'boolean',
          default: true,
          description: 'Enable responsive design',
        },
      },
    },
    layout: {
      type: 'array',
      description: 'Ordered list of page sections',
      minItems: 1,
      items: {
        type: 'object',
        required: ['id', 'type', 'priority', 'content'],
        properties: {
          id: {
            type: 'string',
            description: 'Unique section identifier',
          },
          type: {
            type: 'string',
            enum: [
              'hero',
              'features',
              'specs',
              'faq',
              'contact_form',
              'trust_badges',
              'pricing',
              'gallery',
              'cta',
              'testimonials',
              'footer',
              'custom',
            ],
            description: 'Section type',
          },
          priority: {
            type: 'number',
            description: 'Display order (lower = earlier)',
          },
          content: {
            type: 'object',
            description: 'Section-specific content',
          },
        },
      },
    },
    constraints: {
      type: 'object',
      properties: {
        maxSections: { type: 'number' },
        budgetTier: {
          type: 'string',
          enum: ['minimal', 'standard', 'premium'],
        },
        deadlineHours: { type: 'number' },
      },
    },
  },
} as const;
