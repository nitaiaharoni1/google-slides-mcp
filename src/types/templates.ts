/**
 * Template-related type definitions
 */

/**
 * All available slide template types
 */
export type SlideTemplate =
  // Opening & Closing (5)
  | "title_hero"
  | "title_minimal"
  | "title_image_split"
  | "closing_cta"
  | "closing_thank_you"
  // Content & Text (8)
  | "bullets_clean"
  | "bullets_numbered"
  | "two_column_text"
  | "two_column_image_left"
  | "two_column_image_right"
  | "three_column"
  | "quote_spotlight"
  | "big_statement"
  // Data & Metrics (7)
  | "metrics_2x2"
  | "metrics_3_row"
  | "metrics_4_row"
  | "metrics_single"
  | "comparison_table"
  | "pricing_tiers"
  | "before_after"
  // Visual & Process (6)
  | "timeline_horizontal"
  | "timeline_vertical"
  | "funnel_3_level"
  | "pyramid_3_level"
  | "process_flow"
  | "cycle_4_step"
  // Team & People (3)
  | "team_2_founders"
  | "team_4_grid"
  | "team_6_grid"
  // Specialized (1)
  | "section_divider";

/**
 * Theme options
 */
export type Theme = "modern" | "bold" | "minimal" | "corporate";

/**
 * Metric definition
 */
export interface Metric {
  value: string;
  label: string;
}

/**
 * Column content definition
 */
export interface ColumnContent {
  title: string;
  content: string;
}

/**
 * Team member definition
 */
export interface TeamMember {
  name: string;
  role: string;
  image_url?: string;
  bio?: string;
}

/**
 * Timeline step definition
 */
export interface TimelineStep {
  title: string;
  description?: string;
  icon_url?: string;
}

/**
 * Funnel level definition
 */
export interface FunnelLevel {
  label: string;
  value: string;
  description?: string;
}

/**
 * Pricing tier definition
 */
export interface PricingTier {
  name: string;
  price: string;
  features: string[];
  highlighted?: boolean;
}

/**
 * Comparison table row
 */
export interface ComparisonRow {
  feature: string;
  values: string[]; // One value per column
}

/**
 * Template content interface - varies by template type
 */
export interface TemplateContent {
  // Common fields
  title?: string;
  subtitle?: string;
  bullets?: string[];
  image_url?: string;

  // Multi-column content
  columns?: ColumnContent[];

  // Metrics
  metrics?: Metric[];

  // Team
  team?: TeamMember[];

  // Timeline/Process
  steps?: TimelineStep[];

  // Funnel
  funnel_levels?: FunnelLevel[];

  // Pricing
  pricing_tiers?: PricingTier[];

  // Comparison table
  comparison_headers?: string[];
  comparison_rows?: ComparisonRow[];
  highlight_column?: number;

  // Quote
  quote?: string;
  attribution?: string;

  // Statement
  statement?: string;

  // Before/After
  before_title?: string;
  before_content?: string;
  after_title?: string;
  after_content?: string;

  // Section divider
  section_number?: string;
  section_title?: string;

  // CTA/Closing
  cta_text?: string;
  contact_info?: string;
  qr_code_url?: string;
  social_links?: string[];
}

/**
 * Create slide template arguments
 */
export interface CreateSlideTemplateArgs {
  presentationId: string;
  template: SlideTemplate;
  content: TemplateContent;
  theme?: Theme;
  insertionIndex?: number;
}

