/**
 * Slide Template Tools
 * 30 professionally-designed slide templates for instant professional slides
 */

import { MCPToolDefinition } from "../../types/mcp";
import { createSlideTemplate } from "./handler";
import {
  createStringParam,
  createNumberParam,
} from "../../utils/schema-builder";
import { PRESENTATION_ID_EXAMPLES } from "../../config/examples";

/**
 * Template descriptions for all 30 slide templates
 */
const TEMPLATE_DESCRIPTIONS: Record<string, string> = {
  // Opening & Closing (5)
  title_hero: "Hero title slide with large centered title and subtitle. Perfect for opening slides with maximum visual impact.",
  title_minimal: "Minimal title slide with clean typography. Ideal for professional presentations requiring subtle elegance.",
  title_image_split: "Title slide with image on left and text content on right. Great for visual storytelling and branding.",
  closing_cta: "Call-to-action closing slide with prominent CTA text and contact information. Perfect for conversion-focused endings.",
  closing_thank_you: "Thank you closing slide with centered message. Ideal for ending presentations on a gracious note.",
  
  // Content & Text (8)
  bullets_clean: "Clean bullet point slide with title and unnumbered bullet list. Perfect for feature lists and key points.",
  bullets_numbered: "Numbered bullet point slide with title and ordered list. Ideal for step-by-step processes and rankings.",
  two_column_text: "Two-column text layout with title. Great for comparing concepts or presenting parallel information.",
  two_column_image_left: "Two-column layout with image on left and text on right. Perfect for visual explanations and case studies.",
  two_column_image_right: "Two-column layout with text on left and image on right. Ideal for content-first presentations with supporting visuals.",
  three_column: "Three-column text layout with title. Excellent for comparing three options or presenting multiple features side-by-side.",
  quote_spotlight: "Quote spotlight slide with large quote text and attribution. Perfect for testimonials and key messages.",
  big_statement: "Single large statement slide with bold typography. Ideal for impactful one-liners and key messages.",
  
  // Data & Metrics (7)
  metrics_2x2: "2x2 grid of metric cards displaying four key performance indicators. Perfect for dashboard-style data presentation.",
  metrics_3_row: "Three metric cards in a horizontal row. Ideal for comparing three key metrics side-by-side.",
  metrics_4_row: "Four metric cards in a horizontal row. Great for displaying multiple KPIs in a compact format.",
  metrics_single: "Single large metric display with value, label, and description. Perfect for highlighting one key number.",
  comparison_table: "Comparison table for side-by-side feature comparison. Ideal for product comparisons and competitive analysis.",
  pricing_tiers: "Pricing tiers layout with three columns. Perfect for showcasing pricing plans and subscription options.",
  before_after: "Before and after comparison layout. Great for showing transformations, improvements, or changes over time.",
  
  // Visual & Process (6)
  timeline_horizontal: "Horizontal timeline with connected steps. Perfect for showing chronological processes and milestones.",
  timeline_vertical: "Vertical timeline with connected steps. Ideal for showing progression or history in a top-to-bottom flow.",
  funnel_3_level: "Three-level funnel visualization. Great for showing conversion funnels, sales processes, or filtering stages.",
  pyramid_3_level: "Three-level pyramid diagram. Perfect for hierarchical structures, priority levels, or Maslow-style representations.",
  process_flow: "Horizontal process flow with connected steps and arrows. Ideal for workflows and sequential processes.",
  cycle_4_step: "Four-step cycle diagram arranged in a circle. Perfect for showing circular processes and continuous loops.",
  
  // Team & People (3)
  team_2_founders: "Two-founder team layout with photos and information. Ideal for showcasing co-founders or key leadership pairs.",
  team_4_grid: "Four-person team grid layout. Perfect for displaying team members in a balanced 2x2 grid.",
  team_6_grid: "Six-person team grid layout. Great for larger teams displayed in a 2x3 or 3x2 grid format.",
  
  // Specialized (1)
  section_divider: "Section divider slide with large section number and title. Perfect for organizing presentation sections.",
};

/**
 * Build template description text with all options and their descriptions
 */
function buildTemplateDescription(): string {
  const categories = [
    {
      name: "Opening & Closing",
      templates: [
        "title_hero",
        "title_minimal",
        "title_image_split",
        "closing_cta",
        "closing_thank_you",
      ],
    },
    {
      name: "Content & Text",
      templates: [
        "bullets_clean",
        "bullets_numbered",
        "two_column_text",
        "two_column_image_left",
        "two_column_image_right",
        "three_column",
        "quote_spotlight",
        "big_statement",
      ],
    },
    {
      name: "Data & Metrics",
      templates: [
        "metrics_2x2",
        "metrics_3_row",
        "metrics_4_row",
        "metrics_single",
        "comparison_table",
        "pricing_tiers",
        "before_after",
      ],
    },
    {
      name: "Visual & Process",
      templates: [
        "timeline_horizontal",
        "timeline_vertical",
        "funnel_3_level",
        "pyramid_3_level",
        "process_flow",
        "cycle_4_step",
      ],
    },
    {
      name: "Team & People",
      templates: ["team_2_founders", "team_4_grid", "team_6_grid"],
    },
    {
      name: "Specialized",
      templates: ["section_divider"],
    },
  ];

  let description = "Template type. Available templates:\n\n";
  
  for (const category of categories) {
    description += `${category.name}:\n`;
    for (const template of category.templates) {
      description += `  - ${template}: ${TEMPLATE_DESCRIPTIONS[template]}\n`;
    }
    description += "\n";
  }

  return description.trim();
}

// Tool definition
export const slideTemplateTools: MCPToolDefinition[] = [
  {
    name: "create_slide_template",
    description:
      "Create a professionally-designed slide using one of 30 master templates. Templates include: title slides (hero, minimal, image split), closing slides (CTA, thank you), content slides (bullets, columns, quotes), metrics slides (2x2, 3-row, 4-row, single), comparison tables, pricing tiers, timelines (horizontal, vertical), funnels, pyramids, process flows, team slides (2, 4, 6 members), and section dividers. Each template automatically applies professional styling, spacing, and layout.",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        template: createStringParam({
          description: buildTemplateDescription(),
          enum: [
            "title_hero",
            "title_minimal",
            "title_image_split",
            "closing_cta",
            "closing_thank_you",
            "bullets_clean",
            "bullets_numbered",
            "two_column_text",
            "two_column_image_left",
            "two_column_image_right",
            "three_column",
            "quote_spotlight",
            "big_statement",
            "metrics_2x2",
            "metrics_3_row",
            "metrics_4_row",
            "metrics_single",
            "comparison_table",
            "pricing_tiers",
            "before_after",
            "timeline_horizontal",
            "timeline_vertical",
            "funnel_3_level",
            "pyramid_3_level",
            "process_flow",
            "cycle_4_step",
            "team_2_founders",
            "team_4_grid",
            "team_6_grid",
            "section_divider",
          ],
          examples: [
            "title_hero",
            "metrics_2x2",
            "timeline_horizontal",
            "team_2_founders",
          ],
        }),
        content: {
          type: "object",
          description:
            "Content for the slide. Fields vary by template. Common: title, subtitle, bullets, metrics, columns, team, steps, image_url",
          properties: {
            title: createStringParam({
              description: "Slide title",
            }),
            subtitle: createStringParam({
              description: "Slide subtitle",
            }),
            bullets: {
              type: "array",
              items: createStringParam({ description: "Bullet point text" }),
              description: "List of bullet points",
            },
            metrics: {
              type: "array",
              items: {
                type: "object",
                description: "Metric with value and label",
                properties: {
                  value: createStringParam({ description: "Metric value" }),
                  label: createStringParam({ description: "Metric label" }),
                },
              },
              description: "Array of metrics with value and label",
            },
            columns: {
              type: "array",
              items: {
                type: "object",
                description: "Column content with title and content",
                properties: {
                  title: createStringParam({ description: "Column title" }),
                  content: createStringParam({ description: "Column content" }),
                },
              },
              description: "Array of column content",
            },
            team: {
              type: "array",
              items: {
                type: "object",
                description: "Team member information",
                properties: {
                  name: createStringParam({ description: "Team member name" }),
                  role: createStringParam({ description: "Team member role" }),
                  image_url: createStringParam({
                    description: "Team member image URL",
                  }),
                },
              },
              description: "Array of team members",
            },
            steps: {
              type: "array",
              items: {
                type: "object",
                description: "Timeline or process step",
                properties: {
                  title: createStringParam({ description: "Step title" }),
                  description: createStringParam({
                    description: "Step description",
                  }),
                },
              },
              description: "Array of timeline/process steps",
            },
            image_url: createStringParam({
              description: "Image URL",
            }),
            quote: createStringParam({
              description: "Quote text",
            }),
            attribution: createStringParam({
              description: "Quote attribution",
            }),
            statement: createStringParam({
              description: "Big statement text",
            }),
            comparison_headers: {
              type: "array",
              items: createStringParam({
                description: "Comparison table header",
              }),
              description: "Table headers for comparison",
            },
            comparison_rows: {
              type: "array",
              items: {
                type: "object",
                description: "Comparison table row",
                properties: {
                  feature: createStringParam({
                    description: "Feature name",
                  }),
                  values: {
                    type: "array",
                    items: createStringParam({
                      description: "Feature value",
                    }),
                    description: "Array of feature values",
                  },
                },
              },
              description: "Table rows for comparison",
            },
            pricing_tiers: {
              type: "array",
              items: {
                type: "object",
                description: "Pricing tier information",
                properties: {
                  name: createStringParam({ description: "Tier name" }),
                  price: createStringParam({ description: "Tier price" }),
                  features: {
                    type: "array",
                    items: createStringParam({
                      description: "Feature description",
                    }),
                    description: "List of tier features",
                  },
                  highlighted: {
                    type: "boolean",
                    description: "Whether this tier is highlighted",
                  },
                },
              },
              description: "Pricing tiers",
            },
            funnel_levels: {
              type: "array",
              items: {
                type: "object",
                description: "Funnel level with label and value",
                properties: {
                  label: createStringParam({ description: "Funnel level label" }),
                  value: createStringParam({
                    description: "Funnel level value",
                  }),
                },
              },
              description: "Funnel levels",
            },
            section_number: createStringParam({
              description: "Section number",
            }),
            section_title: createStringParam({
              description: "Section title",
            }),
            cta_text: createStringParam({
              description: "Call-to-action text",
            }),
            contact_info: createStringParam({
              description: "Contact information",
            }),
            before_title: createStringParam({
              description: "Before title",
            }),
            before_content: createStringParam({
              description: "Before content",
            }),
            after_title: createStringParam({
              description: "After title",
            }),
            after_content: createStringParam({
              description: "After content",
            }),
          },
        },
        theme: createStringParam({
          description: "Optional theme override",
          enum: ["modern", "bold", "minimal", "corporate"],
        }),
        insertionIndex: createNumberParam({
          description: "Optional slide insertion index",
          minimum: 0,
        }),
      },
      required: ["presentationId", "template", "content"],
    },
    handler: createSlideTemplate,
  },
];
