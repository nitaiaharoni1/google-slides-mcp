/**
 * Template Specifications
 * Geometry, positioning, and styling for all 30 slide templates
 */

import { COLORS, COMMON_POSITIONS } from "./design-system";
import type { SlideTemplate } from "../types/templates";

/**
 * Template geometry specification
 */
export interface TemplateSpec {
  elements: Array<{
    type: "text" | "shape" | "image";
    position: { x: number; y: number };
    size: { width: number; height: number };
    style?: {
      fontSize?: number;
      bold?: boolean;
      alignment?: "START" | "CENTER" | "END" | "JUSTIFIED";
      color?: { rgbColor: { red: number; green: number; blue: number } };
      fillColor?: { rgbColor: { red: number; green: number; blue: number } };
    };
  }>;
}

/**
 * Get template specification by type
 */
export function getTemplateSpec(template: SlideTemplate): TemplateSpec {
  const specs: Record<SlideTemplate, TemplateSpec> = {
    // Category A: Opening & Closing (5)
    title_hero: {
      elements: [
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 120 },
          size: { width: 600, height: 100 },
          style: { fontSize: 56, bold: true, alignment: "CENTER" },
        },
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 240 },
          size: { width: 500, height: 60 },
          style: {
            fontSize: 24,
            bold: false,
            alignment: "CENTER",
            color: { rgbColor: COLORS.GRAY[600] },
          },
        },
      ],
    },
    title_minimal: {
      elements: [
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 160 },
          size: { width: 600, height: 100 },
          style: { fontSize: 48, bold: true, alignment: "CENTER" },
        },
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 280 },
          size: { width: 400, height: 50 },
          style: {
            fontSize: 18,
            bold: false,
            alignment: "CENTER",
            color: { rgbColor: COLORS.GRAY[500] },
          },
        },
      ],
    },
    title_image_split: {
      elements: [
        {
          type: "image",
          position: { x: 20, y: 20 },
          size: { width: 340, height: 365 },
        },
        {
          type: "text",
          position: { x: 400, y: 120 },
          size: { width: 300, height: 100 },
          style: { fontSize: 44, bold: true, alignment: "START" },
        },
        {
          type: "text",
          position: { x: 400, y: 240 },
          size: { width: 300, height: 120 },
          style: { fontSize: 16, bold: false, alignment: "START" },
        },
      ],
    },
    closing_cta: {
      elements: [
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 120 },
          size: { width: 600, height: 80 },
          style: { fontSize: 48, bold: true, alignment: "CENTER" },
        },
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 240 },
          size: { width: 400, height: 60 },
          style: { fontSize: 18, bold: false, alignment: "CENTER" },
        },
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 320 },
          size: { width: 300, height: 40 },
          style: {
            fontSize: 14,
            bold: false,
            alignment: "CENTER",
            color: { rgbColor: COLORS.GRAY[600] },
          },
        },
      ],
    },
    closing_thank_you: {
      elements: [
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 150 },
          size: { width: 500, height: 80 },
          style: { fontSize: 44, bold: true, alignment: "CENTER" },
        },
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 280 },
          size: { width: 400, height: 60 },
          style: {
            fontSize: 16,
            bold: false,
            alignment: "CENTER",
            color: { rgbColor: COLORS.GRAY[600] },
          },
        },
      ],
    },

    // Category B: Content & Text (8)
    bullets_clean: {
      elements: [
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 40 },
          size: { width: 600, height: 60 },
          style: { fontSize: 32, bold: true, alignment: "CENTER" },
        },
        {
          type: "text",
          position: { x: 100, y: 120 },
          size: { width: 520, height: 240 },
          style: { fontSize: 16, bold: false, alignment: "START" },
        },
      ],
    },
    bullets_numbered: {
      elements: [
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 40 },
          size: { width: 600, height: 60 },
          style: { fontSize: 32, bold: true, alignment: "CENTER" },
        },
        {
          type: "text",
          position: { x: 100, y: 120 },
          size: { width: 520, height: 240 },
          style: { fontSize: 18, bold: false, alignment: "START" },
        },
      ],
    },
    two_column_text: {
      elements: [
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 40 },
          size: { width: 600, height: 60 },
          style: { fontSize: 32, bold: true, alignment: "CENTER" },
        },
        {
          type: "text",
          position: { x: 60, y: 120 },
          size: { width: 280, height: 240 },
          style: { fontSize: 14, bold: false, alignment: "START" },
        },
        {
          type: "text",
          position: { x: 380, y: 120 },
          size: { width: 280, height: 240 },
          style: { fontSize: 14, bold: false, alignment: "START" },
        },
      ],
    },
    two_column_image_left: {
      elements: [
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 40 },
          size: { width: 600, height: 60 },
          style: { fontSize: 32, bold: true, alignment: "CENTER" },
        },
        {
          type: "image",
          position: { x: 60, y: 120 },
          size: { width: 280, height: 240 },
        },
        {
          type: "text",
          position: { x: 380, y: 120 },
          size: { width: 280, height: 240 },
          style: { fontSize: 14, bold: false, alignment: "START" },
        },
      ],
    },
    two_column_image_right: {
      elements: [
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 40 },
          size: { width: 600, height: 60 },
          style: { fontSize: 32, bold: true, alignment: "CENTER" },
        },
        {
          type: "text",
          position: { x: 60, y: 120 },
          size: { width: 280, height: 240 },
          style: { fontSize: 14, bold: false, alignment: "START" },
        },
        {
          type: "image",
          position: { x: 380, y: 120 },
          size: { width: 280, height: 240 },
        },
      ],
    },
    three_column: {
      elements: [
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 40 },
          size: { width: 600, height: 60 },
          style: { fontSize: 32, bold: true, alignment: "CENTER" },
        },
        {
          type: "text",
          position: { x: 40, y: 120 },
          size: { width: 200, height: 240 },
          style: { fontSize: 14, bold: false, alignment: "START" },
        },
        {
          type: "text",
          position: { x: 260, y: 120 },
          size: { width: 200, height: 240 },
          style: { fontSize: 14, bold: false, alignment: "START" },
        },
        {
          type: "text",
          position: { x: 480, y: 120 },
          size: { width: 200, height: 240 },
          style: { fontSize: 14, bold: false, alignment: "START" },
        },
      ],
    },
    quote_spotlight: {
      elements: [
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 100 },
          size: { width: 600, height: 150 },
          style: {
            fontSize: 32,
            bold: true,
            alignment: "CENTER",
            color: { rgbColor: COLORS.GRAY[700] },
          },
        },
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 280 },
          size: { width: 400, height: 50 },
          style: {
            fontSize: 16,
            bold: false,
            alignment: "CENTER",
            color: { rgbColor: COLORS.GRAY[600] },
          },
        },
      ],
    },
    big_statement: {
      elements: [
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 150 },
          size: { width: 650, height: 120 },
          style: { fontSize: 48, bold: true, alignment: "CENTER" },
        },
      ],
    },

    // Category C: Data & Metrics (7)
    metrics_2x2: {
      elements: [
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 40 },
          size: { width: 600, height: 60 },
          style: { fontSize: 32, bold: true, alignment: "CENTER" },
        },
        {
          type: "shape",
          position: { x: 80, y: 120 },
          size: { width: 260, height: 120 },
        },
        {
          type: "shape",
          position: { x: 380, y: 120 },
          size: { width: 260, height: 120 },
        },
        {
          type: "shape",
          position: { x: 80, y: 260 },
          size: { width: 260, height: 120 },
        },
        {
          type: "shape",
          position: { x: 380, y: 260 },
          size: { width: 260, height: 120 },
        },
      ],
    },
    metrics_3_row: {
      elements: [
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 40 },
          size: { width: 600, height: 60 },
          style: { fontSize: 32, bold: true, alignment: "CENTER" },
        },
        {
          type: "shape",
          position: { x: 60, y: 140 },
          size: { width: 180, height: 200 },
        },
        {
          type: "shape",
          position: { x: 270, y: 140 },
          size: { width: 180, height: 200 },
        },
        {
          type: "shape",
          position: { x: 480, y: 140 },
          size: { width: 180, height: 200 },
        },
      ],
    },
    metrics_4_row: {
      elements: [
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 40 },
          size: { width: 600, height: 60 },
          style: { fontSize: 32, bold: true, alignment: "CENTER" },
        },
        {
          type: "shape",
          position: { x: 40, y: 140 },
          size: { width: 150, height: 200 },
        },
        {
          type: "shape",
          position: { x: 210, y: 140 },
          size: { width: 150, height: 200 },
        },
        {
          type: "shape",
          position: { x: 380, y: 140 },
          size: { width: 150, height: 200 },
        },
        {
          type: "shape",
          position: { x: 550, y: 140 },
          size: { width: 150, height: 200 },
        },
      ],
    },
    metrics_single: {
      elements: [
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 100 },
          size: { width: 600, height: 120 },
          style: { fontSize: 72, bold: true, alignment: "CENTER" },
        },
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 240 },
          size: { width: 500, height: 60 },
          style: {
            fontSize: 24,
            bold: false,
            alignment: "CENTER",
            color: { rgbColor: COLORS.GRAY[600] },
          },
        },
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 320 },
          size: { width: 600, height: 50 },
          style: { fontSize: 16, bold: false, alignment: "CENTER" },
        },
      ],
    },
    comparison_table: {
      elements: [
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 40 },
          size: { width: 600, height: 60 },
          style: { fontSize: 32, bold: true, alignment: "CENTER" },
        },
        {
          type: "shape",
          position: { x: 60, y: 120 },
          size: { width: 600, height: 240 },
        },
      ],
    },
    pricing_tiers: {
      elements: [
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 40 },
          size: { width: 600, height: 60 },
          style: { fontSize: 32, bold: true, alignment: "CENTER" },
        },
        {
          type: "shape",
          position: { x: 40, y: 120 },
          size: { width: 200, height: 240 },
        },
        {
          type: "shape",
          position: { x: 260, y: 120 },
          size: { width: 200, height: 240 },
        },
        {
          type: "shape",
          position: { x: 480, y: 120 },
          size: { width: 200, height: 240 },
        },
      ],
    },
    before_after: {
      elements: [
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 40 },
          size: { width: 600, height: 60 },
          style: { fontSize: 32, bold: true, alignment: "CENTER" },
        },
        {
          type: "text",
          position: { x: 100, y: 120 },
          size: { width: 240, height: 200 },
          style: { fontSize: 20, bold: true, alignment: "CENTER" },
        },
        {
          type: "shape",
          position: { x: 360, y: 200 },
          size: { width: 40, height: 40 },
        },
        {
          type: "text",
          position: { x: 440, y: 120 },
          size: { width: 240, height: 200 },
          style: { fontSize: 20, bold: true, alignment: "CENTER" },
        },
      ],
    },

    // Category D: Visual & Process (6)
    timeline_horizontal: {
      elements: [
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 40 },
          size: { width: 600, height: 60 },
          style: { fontSize: 32, bold: true, alignment: "CENTER" },
        },
        {
          type: "shape",
          position: { x: 80, y: 180 },
          size: { width: 120, height: 120 },
        },
        {
          type: "shape",
          position: { x: 240, y: 220 },
          size: { width: 40, height: 40 },
        },
        {
          type: "shape",
          position: { x: 300, y: 180 },
          size: { width: 120, height: 120 },
        },
        {
          type: "shape",
          position: { x: 460, y: 220 },
          size: { width: 40, height: 40 },
        },
        {
          type: "shape",
          position: { x: 520, y: 180 },
          size: { width: 120, height: 120 },
        },
      ],
    },
    timeline_vertical: {
      elements: [
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 40 },
          size: { width: 600, height: 60 },
          style: { fontSize: 32, bold: true, alignment: "CENTER" },
        },
        {
          type: "shape",
          position: { x: 100, y: 120 },
          size: { width: 200, height: 60 },
        },
        {
          type: "shape",
          position: { x: 320, y: 200 },
          size: { width: 40, height: 40 },
        },
        {
          type: "shape",
          position: { x: 100, y: 260 },
          size: { width: 200, height: 60 },
        },
        {
          type: "shape",
          position: { x: 320, y: 340 },
          size: { width: 40, height: 40 },
        },
      ],
    },
    funnel_3_level: {
      elements: [
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 40 },
          size: { width: 600, height: 60 },
          style: { fontSize: 32, bold: true, alignment: "CENTER" },
        },
        {
          type: "shape",
          position: { x: 200, y: 120 },
          size: { width: 320, height: 60 },
        },
        {
          type: "shape",
          position: { x: 240, y: 200 },
          size: { width: 240, height: 60 },
        },
        {
          type: "shape",
          position: { x: 280, y: 280 },
          size: { width: 160, height: 60 },
        },
      ],
    },
    pyramid_3_level: {
      elements: [
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 40 },
          size: { width: 600, height: 60 },
          style: { fontSize: 32, bold: true, alignment: "CENTER" },
        },
        {
          type: "shape",
          position: { x: 280, y: 120 },
          size: { width: 160, height: 60 },
        },
        {
          type: "shape",
          position: { x: 240, y: 200 },
          size: { width: 240, height: 60 },
        },
        {
          type: "shape",
          position: { x: 200, y: 280 },
          size: { width: 320, height: 60 },
        },
      ],
    },
    process_flow: {
      elements: [
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 40 },
          size: { width: 600, height: 60 },
          style: { fontSize: 32, bold: true, alignment: "CENTER" },
        },
        {
          type: "shape",
          position: { x: 80, y: 180 },
          size: { width: 120, height: 80 },
        },
        {
          type: "shape",
          position: { x: 240, y: 200 },
          size: { width: 40, height: 40 },
        },
        {
          type: "shape",
          position: { x: 300, y: 180 },
          size: { width: 120, height: 80 },
        },
        {
          type: "shape",
          position: { x: 460, y: 200 },
          size: { width: 40, height: 40 },
        },
        {
          type: "shape",
          position: { x: 520, y: 180 },
          size: { width: 120, height: 80 },
        },
      ],
    },
    cycle_4_step: {
      elements: [
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 40 },
          size: { width: 600, height: 60 },
          style: { fontSize: 32, bold: true, alignment: "CENTER" },
        },
        {
          type: "shape",
          position: { x: 300, y: 120 },
          size: { width: 120, height: 80 },
        },
        {
          type: "shape",
          position: { x: 500, y: 220 },
          size: { width: 120, height: 80 },
        },
        {
          type: "shape",
          position: { x: 300, y: 320 },
          size: { width: 120, height: 80 },
        },
        {
          type: "shape",
          position: { x: 100, y: 220 },
          size: { width: 120, height: 80 },
        },
      ],
    },

    // Category E: Team & People (3)
    team_2_founders: {
      elements: [
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 40 },
          size: { width: 600, height: 60 },
          style: { fontSize: 32, bold: true, alignment: "CENTER" },
        },
        {
          type: "shape",
          position: { x: 140, y: 140 },
          size: { width: 180, height: 200 },
        },
        {
          type: "shape",
          position: { x: 400, y: 140 },
          size: { width: 180, height: 200 },
        },
      ],
    },
    team_4_grid: {
      elements: [
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 40 },
          size: { width: 600, height: 60 },
          style: { fontSize: 32, bold: true, alignment: "CENTER" },
        },
        {
          type: "shape",
          position: { x: 80, y: 140 },
          size: { width: 260, height: 120 },
        },
        {
          type: "shape",
          position: { x: 380, y: 140 },
          size: { width: 260, height: 120 },
        },
        {
          type: "shape",
          position: { x: 80, y: 280 },
          size: { width: 260, height: 120 },
        },
        {
          type: "shape",
          position: { x: 380, y: 280 },
          size: { width: 260, height: 120 },
        },
      ],
    },
    team_6_grid: {
      elements: [
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 40 },
          size: { width: 600, height: 60 },
          style: { fontSize: 32, bold: true, alignment: "CENTER" },
        },
        {
          type: "shape",
          position: { x: 40, y: 120 },
          size: { width: 200, height: 100 },
        },
        {
          type: "shape",
          position: { x: 260, y: 120 },
          size: { width: 200, height: 100 },
        },
        {
          type: "shape",
          position: { x: 480, y: 120 },
          size: { width: 200, height: 100 },
        },
        {
          type: "shape",
          position: { x: 40, y: 240 },
          size: { width: 200, height: 100 },
        },
        {
          type: "shape",
          position: { x: 260, y: 240 },
          size: { width: 200, height: 100 },
        },
        {
          type: "shape",
          position: { x: 480, y: 240 },
          size: { width: 200, height: 100 },
        },
      ],
    },

    // Category F: Specialized (1)
    section_divider: {
      elements: [
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 120 },
          size: { width: 600, height: 100 },
          style: {
            fontSize: 72,
            bold: true,
            alignment: "CENTER",
            color: { rgbColor: COLORS.GRAY[300] },
          },
        },
        {
          type: "text",
          position: { x: COMMON_POSITIONS.X.CENTER, y: 240 },
          size: { width: 600, height: 80 },
          style: { fontSize: 44, bold: true, alignment: "CENTER" },
        },
      ],
    },
  };

  return specs[template];
}
