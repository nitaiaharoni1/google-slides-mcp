/**
 * Example Values for Tool Parameters
 * Common example values to use in tool descriptions and schemas
 */

import { COMMON_POSITIONS, COMMON_SIZES, TYPOGRAPHY } from "./design-system";

/**
 * Position Examples (in points)
 */
export const POSITION_EXAMPLES = {
  X: [
    COMMON_POSITIONS.X.LEFT_MARGIN,
    COMMON_POSITIONS.X.LEFT_INDENT,
    COMMON_POSITIONS.X.CENTER,
    COMMON_POSITIONS.X.RIGHT_INDENT,
  ],
  Y: [
    COMMON_POSITIONS.Y.TOP_MARGIN,
    COMMON_POSITIONS.Y.TOP_INDENT,
    COMMON_POSITIONS.Y.CENTER,
    COMMON_POSITIONS.Y.BOTTOM_INDENT,
  ],
} as const;

/**
 * Size Examples (in points)
 */
export const SIZE_EXAMPLES = {
  WIDTH: [
    COMMON_SIZES.CAPTION.width,
    COMMON_SIZES.TITLE.width,
    COMMON_SIZES.BODY.width,
    COMMON_SIZES.FULL_WIDTH,
  ],
  HEIGHT: [
    COMMON_SIZES.CAPTION.height,
    COMMON_SIZES.TITLE.height,
    COMMON_SIZES.BODY.height,
  ],
} as const;

/**
 * Font Size Examples (in points)
 */
export const FONT_SIZE_EXAMPLES = [
  TYPOGRAPHY.CAPTION,
  TYPOGRAPHY.BODY,
  TYPOGRAPHY.SUBTITLE,
  TYPOGRAPHY.TITLE,
  TYPOGRAPHY.HEADLINE,
];

/**
 * Common Text Examples
 */
export const TEXT_EXAMPLES = {
  TITLE: "My Presentation Title",
  SUBTITLE: "A compelling subtitle that explains the topic",
  BODY: "This is body text that provides detailed information about the topic. It can span multiple lines and paragraphs.",
  CAPTION: "Figure 1: Example caption text",
  BULLET: "Key point or feature",
} as const;

/**
 * Presentation ID Examples
 */
export const PRESENTATION_ID_EXAMPLES = [
  "1abc123def456ghi789jkl012mno345pqr678",
  "1BxiMVs0X38-PDtmylEKxZ8lbR4kRtvAuE0xLPBytX3E",
];

/**
 * Slide ID Examples
 */
export const SLIDE_ID_EXAMPLES = [
  "SLIDES_API1234567890_0",
  "SLIDES_API864296025_0",
  "p",
];

/**
 * Element ID Examples
 */
export const ELEMENT_ID_EXAMPLES = [
  "textbox_abc123-def456-ghi789",
  "shape_xyz789-uvw456-rst123",
  "image_img001-png-2024",
];

/**
 * Color Examples (RGB 0-1)
 */
export const COLOR_EXAMPLES = {
  BLACK: { red: 0, green: 0, blue: 0 },
  WHITE: { red: 1, green: 1, blue: 1 },
  RED: { red: 0.9, green: 0.2, blue: 0.2 },
  BLUE: { red: 0.2, green: 0.4, blue: 0.8 },
  GREEN: { red: 0.2, green: 0.7, blue: 0.3 },
  GRAY: { red: 0.5, green: 0.5, blue: 0.5 },
} as const;

/**
 * Alignment Examples
 */
export const ALIGNMENT_EXAMPLES = ["START", "CENTER", "END", "JUSTIFIED"];

/**
 * Shape Type Examples
 */
export const SHAPE_TYPE_EXAMPLES = [
  "RECTANGLE",
  "ELLIPSE",
  "ARROW",
  "DIAMOND",
  "TRIANGLE",
  "STAR_5",
];

/**
 * Image URL Examples
 */
export const IMAGE_URL_EXAMPLES = [
  "https://example.com/image.png",
  "https://example.com/photo.jpg",
  "https://via.placeholder.com/800x600",
];

/**
 * Use Case Examples for Tool Descriptions
 */
export const USE_CASE_EXAMPLES = {
  TEXT_BOX: {
    TITLE:
      "Title at top: x=60, y=30, width=600, height=80, fontSize=44, bold=true",
    SUBTITLE:
      "Subtitle below title: x=60, y=120, width=600, height=60, fontSize=24",
    BODY: "Body text: x=60, y=200, width=600, height=200, fontSize=14",
    CAPTION:
      "Caption at bottom: x=60, y=360, width=400, height=40, fontSize=10",
  },
  IMAGE: {
    FULL_WIDTH: "Full-width image: x=20, y=100, width=680, height=300",
    HALF_WIDTH: "Half-width image: x=20, y=100, width=340, height=250",
    THUMBNAIL: "Thumbnail: x=20, y=100, width=200, height=150",
  },
  MULTIPLE_ELEMENTS:
    "For multiple elements, use 'add_multiple_text_boxes' or 'batch_update'",
  COMPLETE_SLIDE: "Use add_multiple_text_boxes for batch text operations",
} as const;

/**
 * Table Examples
 */
export const TABLE_EXAMPLES = {
  HEADERS: ["Name", "Age", "City"],
  ROWS: [
    ["John Doe", "30", "New York"],
    ["Jane Smith", "25", "San Francisco"],
  ],
  CELL_TEXT: "Sample cell content",
} as const;

/**
 * Chart Data Examples
 */
export const CHART_DATA_EXAMPLES = {
  LABELS: ["Q1", "Q2", "Q3", "Q4"],
  VALUES: [100, 150, 120, 180],
  SERIES: [
    { name: "Sales", values: [100, 150, 120, 180] },
    { name: "Revenue", values: [80, 120, 100, 140] },
  ],
} as const;
