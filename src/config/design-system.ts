/**
 * Design System Constants
 * Typography, spacing, colors, and content density guidelines
 * Following modern design system principles
 */

/**
 * Typography Scale (in points)
 * Based on 1.2 ratio (minor third) for harmonious scaling
 */
export const TYPOGRAPHY = {
  // Semantic sizes
  CAPTION: 10,
  SMALL: 12,
  BODY: 14,
  LEAD: 18,
  SUBTITLE: 24,
  TITLE: 32,
  HEADLINE: 44,
  DISPLAY: 56,

  // Legacy support (mapped to semantic names)
  MINIMUM: 10,
  DEFAULT: 14,
  LARGE: 24,
  XLARGE: 32,
  XXLARGE: 44,
} as const;

/**
 * Spacing System (4pt base unit grid)
 * Ensures consistent, harmonious spacing throughout slides
 */
export const SPACING = {
  XS: 4, // 1 unit
  SM: 8, // 2 units
  MD: 12, // 3 units
  BASE: 16, // 4 units
  LG: 24, // 6 units
  XL: 32, // 8 units
  XXL: 48, // 12 units
  XXXL: 64, // 16 units

  // Semantic spacing
  TIGHT: 4,
  COMFORTABLE: 8,
  RELAXED: 16,
  LOOSE: 24,

  // Common use cases
  ELEMENT_GAP: 16, // Space between elements
  SECTION_GAP: 32, // Space between sections
  MARGIN: 20, // Slide margins
  PADDING: 16, // Element padding
} as const;

/**
 * Color Palettes
 * RGB values (0-1 range for Google Slides API)
 */
export const COLORS = {
  // Primary palette
  PRIMARY: {
    MAIN: { red: 0.2, green: 0.4, blue: 0.8 },
    LIGHT: { red: 0.4, green: 0.6, blue: 0.9 },
    DARK: { red: 0.1, green: 0.2, blue: 0.6 },
  },

  // Secondary palette
  SECONDARY: {
    MAIN: { red: 0.6, green: 0.4, blue: 0.8 },
    LIGHT: { red: 0.8, green: 0.6, blue: 0.9 },
    DARK: { red: 0.4, green: 0.2, blue: 0.6 },
  },

  // Accent colors
  ACCENT: {
    MAIN: { red: 0.9, green: 0.2, blue: 0.2 },
    LIGHT: { red: 1.0, green: 0.4, blue: 0.4 },
    DARK: { red: 0.7, green: 0.1, blue: 0.1 },
  },

  // Semantic colors
  SUCCESS: {
    MAIN: { red: 0.2, green: 0.7, blue: 0.3 },
    LIGHT: { red: 0.4, green: 0.9, blue: 0.5 },
    DARK: { red: 0.1, green: 0.5, blue: 0.2 },
  },

  WARNING: {
    MAIN: { red: 1.0, green: 0.7, blue: 0.0 },
    LIGHT: { red: 1.0, green: 0.9, blue: 0.4 },
    DARK: { red: 0.8, green: 0.5, blue: 0.0 },
  },

  ERROR: {
    MAIN: { red: 0.9, green: 0.2, blue: 0.2 },
    LIGHT: { red: 1.0, green: 0.4, blue: 0.4 },
    DARK: { red: 0.7, green: 0.1, blue: 0.1 },
  },

  // Neutral grays
  GRAY: {
    50: { red: 0.98, green: 0.98, blue: 0.98 },
    100: { red: 0.95, green: 0.95, blue: 0.95 },
    200: { red: 0.9, green: 0.9, blue: 0.9 },
    300: { red: 0.8, green: 0.8, blue: 0.8 },
    400: { red: 0.6, green: 0.6, blue: 0.6 },
    500: { red: 0.5, green: 0.5, blue: 0.5 },
    600: { red: 0.4, green: 0.4, blue: 0.4 },
    700: { red: 0.3, green: 0.3, blue: 0.3 },
    800: { red: 0.2, green: 0.2, blue: 0.2 },
    900: { red: 0.1, green: 0.1, blue: 0.1 },
  },

  // Standard colors
  WHITE: { red: 1.0, green: 1.0, blue: 1.0 },
  BLACK: { red: 0.0, green: 0.0, blue: 0.0 },
} as const;

/**
 * Content Density Limits
 * Guidelines to prevent slides from being too cluttered
 */
export const CONTENT_DENSITY = {
  MAX_BULLETS_PER_SLIDE: 8,
  MAX_TABLE_ROWS: 12,
  MAX_TABLE_COLUMNS: 8,
  MAX_TEXT_LENGTH_PER_BOX: 500, // characters
  MAX_LINES_PER_TEXT_BOX: 15,
  MAX_ELEMENTS_PER_SLIDE: 10,
  MIN_ELEMENT_SIZE: 10, // points
  MAX_ELEMENT_SIZE: 680, // points (slide width - margins)
} as const;

/**
 * Accessibility Standards
 */
export const ACCESSIBILITY = {
  MIN_FONT_SIZE: {
    BODY: 12,
    TITLE: 18,
    CAPTION: 10,
  },
  MIN_CONTRAST_RATIO: {
    AA: 4.5, // Normal text
    AA_LARGE: 3.0, // Large text (18pt+)
    AAA: 7.0, // Enhanced contrast
  },
  MIN_TOUCH_TARGET: 44, // points (for interactive elements)
} as const;

/**
 * Layout Guidelines
 */
export const LAYOUT = {
  GRID_SIZE: 8, // Snap-to-grid unit
  MAX_COLUMNS: 3, // Maximum columns in multi-column layout
  MIN_COLUMN_WIDTH: 200, // Minimum width for a column
  VERTICAL_RHYTHM: 8, // Base unit for vertical spacing
} as const;

/**
 * Common Positions (in points)
 * Standard slide: 720pt × 405pt
 */
export const COMMON_POSITIONS = {
  X: {
    LEFT_MARGIN: 20,
    LEFT_INDENT: 60,
    CENTER: 360,
    RIGHT_INDENT: 660,
    RIGHT_MARGIN: 700,
  },
  Y: {
    TOP_MARGIN: 20,
    TOP_INDENT: 50,
    CENTER: 202,
    BOTTOM_INDENT: 355,
    BOTTOM_MARGIN: 385,
  },
} as const;

/**
 * Common Sizes (in points)
 */
export const COMMON_SIZES = {
  TITLE: { width: 600, height: 80 },
  SUBTITLE: { width: 600, height: 60 },
  BODY: { width: 600, height: 200 },
  CAPTION: { width: 400, height: 40 },
  FULL_WIDTH: 680,
  FULL_HEIGHT: 365,
  IMAGE_THUMBNAIL: { width: 200, height: 150 },
  IMAGE_HALF: { width: 340, height: 250 },
  IMAGE_FULL: { width: 680, height: 300 },
} as const;

/**
 * Content Type Presets
 * Font size and style by content type
 */
export const CONTENT_TYPE_PRESETS = {
  title: {
    fontSize: TYPOGRAPHY.HEADLINE,
    bold: true,
    alignment: "CENTER" as const,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.SUBTITLE,
    bold: true,
    alignment: "CENTER" as const,
  },
  body: {
    fontSize: TYPOGRAPHY.BODY,
    bold: false,
    alignment: "START" as const,
  },
  caption: {
    fontSize: TYPOGRAPHY.CAPTION,
    bold: false,
    alignment: "START" as const,
  },
  heading: {
    fontSize: TYPOGRAPHY.TITLE,
    bold: true,
    alignment: "START" as const,
  },
} as const;

/**
 * Get typography size by semantic name
 */
export function getTypographySize(name: keyof typeof TYPOGRAPHY): number {
  return TYPOGRAPHY[name];
}

/**
 * Get spacing value by semantic name
 */
export function getSpacing(name: keyof typeof SPACING): number {
  return SPACING[name];
}

/**
 * Get color by palette path (e.g., 'PRIMARY.MAIN', 'GRAY.500')
 */
export function getColor(
  path: string
): { red: number; green: number; blue: number } | undefined {
  const parts = path.split(".");
  let current: Record<string, unknown> = COLORS as Record<string, unknown>;

  for (const part of parts) {
    if (typeof current === "object" && current !== null && part in current) {
      const next: unknown = current[part];
      if (typeof next === "object" && next !== null) {
        current = next as Record<string, unknown>;
      } else {
        return undefined;
      }
    } else {
      return undefined;
    }
  }

  // Check if the final result has the color properties
  if (
    typeof current === "object" &&
    current !== null &&
    "red" in current &&
    "green" in current &&
    "blue" in current &&
    typeof current.red === "number" &&
    typeof current.green === "number" &&
    typeof current.blue === "number"
  ) {
    return {
      red: current.red,
      green: current.green,
      blue: current.blue,
    };
  }
  return undefined;
}
