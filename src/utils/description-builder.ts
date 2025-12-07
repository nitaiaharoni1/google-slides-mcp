/**
 * Description Builder Utilities
 * Helper functions to create consistent, well-structured tool descriptions
 * following the 6-component guideline: Action, Units, Constraints, Defaults, Examples, Recommendations
 */

/**
 * Build a complete tool description following guidelines
 */
export function buildToolDescription(options: {
  action: string; // What the tool does
  what: string; // What it operates on
  units?: string; // Units used (e.g., "in points", "in pixels")
  constraints?: string; // Constraints/limits
  defaults?: string; // Default values
  examples?: string; // Usage examples
  recommendations?: string; // When to use alternatives
}): string {
  const {
    action,
    what,
    units,
    constraints,
    defaults,
    examples,
    recommendations,
  } = options;

  let description = `${action} ${what}`;

  const parts: string[] = [];

  if (units) {
    parts.push(units);
  }

  if (constraints) {
    parts.push(constraints);
  }

  if (defaults) {
    parts.push(`Defaults: ${defaults}`);
  }

  if (examples) {
    parts.push(`Example: ${examples}`);
  }

  if (recommendations) {
    parts.push(`TIP: ${recommendations}`);
  }

  if (parts.length > 0) {
    description += ". " + parts.join(". ");
  }

  return description + ".";
}

/**
 * Add position description with examples
 */
export function addPositionDescription(
  axis: "x" | "y",
  slideDimension: number,
  examples: number[]
): string {
  const axisName = axis === "x" ? "X" : "Y";
  const dimensionName = axis === "x" ? "width" : "height";
  return `${axisName} position in points. Standard slide ${dimensionName} is ${slideDimension}pt. Examples: ${examples.join(", ")}`;
}

/**
 * Add size description with constraints
 */
export function addSizeDescription(
  dimension: "width" | "height",
  maxValue: number,
  examples: number[]
): string {
  const dimensionName = dimension === "width" ? "Width" : "Height";
  return `${dimensionName} in points. Maximum ${dimension} is ~${maxValue}pt for standard slides. Examples: ${examples.join(", ")}`;
}

/**
 * Common description patterns for Google Slides tools
 */
export const DESCRIPTION_PATTERNS = {
  POSITION: {
    X: "X position in points (0-700). Standard slide width is 720pt. Examples: 60 (left margin), 360 (center), 660 (right indent)",
    Y: "Y position in points (0-385). Standard slide height is 405pt. Examples: 50 (top), 202 (center), 355 (bottom)",
  },
  SIZE: {
    WIDTH:
      "Width in points (10-680). Maximum width is ~680pt for standard slides. Examples: 400 (caption), 600 (title/body), 680 (full width)",
    HEIGHT:
      "Height in points (10-365). Maximum height is ~365pt for standard slides. Examples: 40 (caption), 80 (title), 200 (body)",
  },
  FONT_SIZE:
    "Font size in points (8-144). Common sizes: 44 (title), 24 (subtitle), 14 (body), 10 (caption)",
  ALIGNMENT: "Text alignment: START (left), CENTER, END (right), or JUSTIFIED",
  PRESENTATION_ID:
    "The ID of the presentation. Example: '1abc123def456ghi789jkl012mno345pqr678'",
  PAGE_ID: "The ID of the slide/page. Example: 'SLIDES_API1234567890_0'",
  OBJECT_ID:
    "The ID of the element (text box, shape, image, etc.). Example: 'textbox_abc123-def456-ghi789'",
} as const;

/**
 * Build description for a position parameter
 */
export function buildPositionDescription(
  axis: "x" | "y",
  slideDimension: number,
  examples: number[]
): string {
  return addPositionDescription(axis, slideDimension, examples);
}

/**
 * Build description for a size parameter
 */
export function buildSizeDescription(
  dimension: "width" | "height",
  maxValue: number,
  examples: number[]
): string {
  return addSizeDescription(dimension, maxValue, examples);
}

/**
 * Common use case examples for tool descriptions
 */
export const USE_CASE_EXAMPLES = {
  TEXT_BOX: {
    TITLE: "Title at top: x=60, y=30, width=600, height=80",
    BODY: "Body text: x=60, y=120, width=600, height=200",
    CAPTION: "Caption: x=60, y=360, width=400, height=40",
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
