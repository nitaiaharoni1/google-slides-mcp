/**
 * Schema Builder Utilities
 * Helper functions to create consistent, well-documented parameter schemas
 * following tool design guidelines
 */

import { MCPInputProperty } from "../types/mcp";
import { SLIDE_DIMENSIONS } from "./bounds";
import { SPACING, TYPOGRAPHY } from "../config/design-system";

/**
 * Common position examples for Google Slides (in points)
 */
export const COMMON_X_POSITIONS = {
  LEFT_MARGIN: 20,
  LEFT_INDENT: 60,
  CENTER: 360,
  RIGHT_INDENT: 660,
  RIGHT_MARGIN: 700,
} as const;

export const COMMON_Y_POSITIONS = {
  TOP_MARGIN: 20,
  TOP_INDENT: 50,
  CENTER: 202,
  BOTTOM_INDENT: 355,
  BOTTOM_MARGIN: 385,
} as const;

/**
 * Common size examples (in points)
 */
export const COMMON_SIZES = {
  TITLE_WIDTH: 600,
  TITLE_HEIGHT: 80,
  BODY_WIDTH: 600,
  BODY_HEIGHT: 200,
  CAPTION_WIDTH: 400,
  CAPTION_HEIGHT: 40,
  FULL_WIDTH: 680,
  FULL_HEIGHT: 365,
} as const;

/**
 * Create a number parameter with constraints and examples
 */
export function createNumberParam(options: {
  description: string;
  minimum?: number;
  maximum?: number;
  default?: number;
  examples?: number[];
  unit?: string;
}): MCPInputProperty {
  const {
    description,
    minimum,
    maximum,
    default: defaultValue,
    examples,
    unit = "points",
  } = options;

  let fullDescription = description;
  if (unit) {
    fullDescription += ` (in ${unit})`;
  }
  if (minimum !== undefined && maximum !== undefined) {
    fullDescription += ` Range: ${minimum}-${maximum}`;
  } else if (minimum !== undefined) {
    fullDescription += ` Min: ${minimum}`;
  } else if (maximum !== undefined) {
    fullDescription += ` Max: ${maximum}`;
  }
  if (defaultValue !== undefined) {
    fullDescription += `. Default: ${defaultValue}`;
  }
  if (examples && examples.length > 0) {
    fullDescription += `. Examples: ${examples.join(", ")}`;
  }

  const param: MCPInputProperty = {
    type: "number",
    description: fullDescription,
  };

  if (minimum !== undefined) param.minimum = minimum;
  if (maximum !== undefined) param.maximum = maximum;
  if (defaultValue !== undefined) param.default = defaultValue;
  if (examples) param.examples = examples;

  return param;
}

/**
 * Create a string parameter with enum and examples
 */
export function createStringParam(options: {
  description: string;
  enum?: string[];
  default?: string;
  examples?: string[];
  pattern?: string;
  minLength?: number;
  maxLength?: number;
}): MCPInputProperty {
  const {
    description,
    enum: enumValues,
    default: defaultValue,
    examples,
    pattern,
    minLength,
    maxLength,
  } = options;

  let fullDescription = description;
  if (enumValues && enumValues.length > 0) {
    fullDescription += `. Options: ${enumValues.join(", ")}`;
  }
  if (defaultValue !== undefined) {
    fullDescription += `. Default: ${defaultValue}`;
  }
  if (examples && examples.length > 0) {
    fullDescription += `. Examples: ${examples.join(", ")}`;
  }
  if (minLength !== undefined || maxLength !== undefined) {
    const lengthDesc = [];
    if (minLength !== undefined) lengthDesc.push(`min ${minLength} chars`);
    if (maxLength !== undefined) lengthDesc.push(`max ${maxLength} chars`);
    fullDescription += `. Length: ${lengthDesc.join(", ")}`;
  }

  const param: MCPInputProperty = {
    type: "string",
    description: fullDescription,
  };

  if (enumValues) param.enum = enumValues;
  if (defaultValue !== undefined) param.default = defaultValue;
  if (examples) param.examples = examples;
  if (pattern) param.pattern = pattern;
  if (minLength !== undefined) param.minLength = minLength;
  if (maxLength !== undefined) param.maxLength = maxLength;

  return param;
}

/**
 * Create an X position parameter for Google Slides
 */
export function createXPositionParam(options?: {
  default?: number;
  description?: string;
}): MCPInputProperty {
  return createNumberParam({
    description:
      options?.description ||
      "X position in points. Standard slide width is 720pt",
    minimum: 0,
    maximum: SLIDE_DIMENSIONS.WIDTH - SLIDE_DIMENSIONS.MIN_MARGIN,
    default: options?.default || SPACING.MARGIN,
    examples: [
      COMMON_X_POSITIONS.LEFT_MARGIN,
      COMMON_X_POSITIONS.LEFT_INDENT,
      COMMON_X_POSITIONS.CENTER,
      COMMON_X_POSITIONS.RIGHT_INDENT,
    ],
  });
}

/**
 * Create a Y position parameter for Google Slides
 */
export function createYPositionParam(options?: {
  default?: number;
  description?: string;
}): MCPInputProperty {
  return createNumberParam({
    description:
      options?.description ||
      "Y position in points. Standard slide height is 405pt",
    minimum: 0,
    maximum: SLIDE_DIMENSIONS.HEIGHT - SLIDE_DIMENSIONS.MIN_MARGIN,
    default: options?.default || SPACING.MARGIN,
    examples: [
      COMMON_Y_POSITIONS.TOP_MARGIN,
      COMMON_Y_POSITIONS.TOP_INDENT,
      COMMON_Y_POSITIONS.CENTER,
      COMMON_Y_POSITIONS.BOTTOM_INDENT,
    ],
  });
}

/**
 * Create a width parameter for Google Slides
 */
export function createWidthParam(options?: {
  default?: number;
  max?: number;
  description?: string;
}): MCPInputProperty {
  const maxWidth =
    options?.max || SLIDE_DIMENSIONS.WIDTH - SLIDE_DIMENSIONS.MIN_MARGIN * 2;
  return createNumberParam({
    description:
      options?.description ||
      "Width in points. Maximum width is ~680pt for standard slides",
    minimum: 10,
    maximum: maxWidth,
    default: options?.default || 500,
    examples: [
      COMMON_SIZES.CAPTION_WIDTH,
      COMMON_SIZES.TITLE_WIDTH,
      COMMON_SIZES.BODY_WIDTH,
      COMMON_SIZES.FULL_WIDTH,
    ],
  });
}

/**
 * Create a height parameter for Google Slides
 */
export function createHeightParam(options?: {
  default?: number;
  max?: number;
  description?: string;
}): MCPInputProperty {
  const maxHeight =
    options?.max || SLIDE_DIMENSIONS.HEIGHT - SLIDE_DIMENSIONS.MIN_MARGIN * 2;
  return createNumberParam({
    description:
      options?.description ||
      "Height in points. Maximum height is ~365pt for standard slides",
    minimum: 10,
    maximum: maxHeight,
    default: options?.default || 100,
    examples: [
      COMMON_SIZES.CAPTION_HEIGHT,
      COMMON_SIZES.TITLE_HEIGHT,
      COMMON_SIZES.BODY_HEIGHT,
    ],
  });
}

/**
 * Create a font size parameter with common examples
 */
export function createFontSizeParam(options?: {
  default?: number;
  min?: number;
  max?: number;
  description?: string;
}): MCPInputProperty {
  return createNumberParam({
    description:
      options?.description ||
      "Font size in points. Common sizes: 44 (title), 24 (subtitle), 14 (body), 10 (caption)",
    minimum: options?.min || 8,
    maximum: options?.max || 144,
    default: options?.default || TYPOGRAPHY.DEFAULT,
    examples: [
      TYPOGRAPHY.CAPTION,
      TYPOGRAPHY.BODY,
      TYPOGRAPHY.SUBTITLE,
      TYPOGRAPHY.TITLE,
      TYPOGRAPHY.HEADLINE,
    ],
  });
}

/**
 * Create a boolean parameter
 */
export function createBooleanParam(options: {
  description: string;
  default?: boolean;
  examples?: boolean[];
}): MCPInputProperty {
  const { description, default: defaultValue, examples } = options;

  let fullDescription = description;
  if (defaultValue !== undefined) {
    fullDescription += `. Default: ${defaultValue}`;
  }
  if (examples && examples.length > 0) {
    fullDescription += `. Examples: ${examples.join(", ")}`;
  }

  const param: MCPInputProperty = {
    type: "boolean",
    description: fullDescription,
  };

  if (defaultValue !== undefined) param.default = defaultValue;
  if (examples) param.examples = examples;

  return param;
}

