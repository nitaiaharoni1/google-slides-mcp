/**
 * Application Constants
 */

import { MCPServerConfig } from "../types/mcp";

// Read version from package.json
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-member-access
const packageVersion = require("../../package.json").version as string;

// Server configuration
export const SERVER_CONFIG: MCPServerConfig = {
  name: "google-slides-mcp",
  version: packageVersion,
} as const;

// Google Slides API limits
export const SLIDES_LIMITS = {
  MAX_BATCH_REQUESTS: 50,
  MAX_TEXT_LENGTH: 1000000, // 1MB per text element
  MAX_IMAGE_SIZE_MB: 50,
  MAX_PRESENTATION_SIZE_MB: 100,
} as const;

// Default page size (in EMU - English Metric Units)
// Standard 16:9 slide: 9144000 x 5143500 EMU (10" x 5.625")
export const DEFAULT_PAGE_SIZE = {
  width: { magnitude: 9144000, unit: "EMU" as const },
  height: { magnitude: 5143500, unit: "EMU" as const },
} as const;

// Common element types
export const ELEMENT_TYPES = {
  SHAPE: "SHAPE",
  IMAGE: "IMAGE",
  VIDEO: "VIDEO",
  TABLE: "TABLE",
  WORD_ART: "WORD_ART",
  SHEETS_CHART: "SHEETS_CHART",
  GROUP: "GROUP",
  LINE: "LINE",
  AUTO_TEXT: "AUTO_TEXT",
} as const;

// Common shape types
export const SHAPE_TYPES = {
  RECTANGLE: "RECTANGLE",
  ROUND_RECTANGLE: "ROUND_RECTANGLE",
  ELLIPSE: "ELLIPSE",
  TEXT_BOX: "TEXT_BOX",
  ARROW: "BENT_ARROW",
  DIAMOND: "DIAMOND",
  TRIANGLE: "TRIANGLE",
  STAR: "STAR_5",
} as const;

// Alignment options
export const ALIGNMENT = {
  START: "START",
  CENTER: "CENTER",
  END: "END",
  JUSTIFIED: "JUSTIFIED",
} as const;

// Spacing modes
export const SPACING_MODE = {
  NEVER_COLLAPSE: "NEVER_COLLAPSE",
  COLLAPSE_LISTS: "COLLAPSE_LISTS",
} as const;

// Units
export const UNITS = {
  EMU: "EMU", // English Metric Units (1/360,000 cm)
  PT: "PT", // Points (1/72 inch)
} as const;

// Conversion factors
export const CONVERSION = {
  EMU_PER_INCH: 914400,
  EMU_PER_POINT: 12700,
  PT_PER_INCH: 72,
} as const;

// Tool categories for Google Slides operations
export const TOOL_CATEGORIES = {
  PRESENTATION: "Presentation Management",
  SLIDE: "Slide Management",
  CONTENT: "Content Creation",
  FORMATTING: "Formatting",
  LAYOUT: "Layout & Design",
  BATCH: "Batch Operations",
  EXPORT: "Export & Sharing",
} as const;

// Default thumbnail settings
export const THUMBNAIL_DEFAULTS = {
  MIME_TYPE: "PNG",
  SIZE: "LARGE", // SMALL, MEDIUM, LARGE, XLARGE
} as const;

// Slide regions for semantic positioning (in points)
// Standard slide size: 720pt x 405pt (10" x 5.625")
export const SLIDE_REGIONS = {
  FULL: { x: 50, y: 100, width: 620, height: 300 },
  TITLE: { x: 50, y: 30, width: 620, height: 60 },
  SUBTITLE: { x: 50, y: 90, width: 620, height: 40 },
  LEFT_HALF: { x: 50, y: 140, width: 300, height: 250 },
  RIGHT_HALF: { x: 370, y: 140, width: 300, height: 250 },
  CENTER: { x: 160, y: 140, width: 400, height: 250 },
  FOOTER: { x: 50, y: 360, width: 620, height: 30 },
  TOP_THIRD: { x: 50, y: 100, width: 620, height: 100 },
  MIDDLE_THIRD: { x: 50, y: 200, width: 620, height: 100 },
  BOTTOM_THIRD: { x: 50, y: 300, width: 620, height: 100 },
} as const;

// Design presets (colors, fonts, styling)
export const DESIGN_PRESETS = {
  DARK_PROFESSIONAL: {
    background: { red: 0.1, green: 0.12, blue: 0.21 },
    title: {
      color: { rgbColor: { red: 1, green: 1, blue: 1 } },
      fontSize: 44,
      bold: true,
    },
    subtitle: {
      color: { rgbColor: { red: 0.7, green: 0.7, blue: 0.7 } },
      fontSize: 24,
      bold: false,
    },
    body: {
      color: { rgbColor: { red: 0.9, green: 0.9, blue: 0.9 } },
      fontSize: 14,
      bold: false,
    },
    accent: { red: 0.2, green: 0.6, blue: 1 },
  },
  LIGHT_CLEAN: {
    background: { red: 1, green: 1, blue: 1 },
    title: {
      color: { rgbColor: { red: 0.1, green: 0.1, blue: 0.1 } },
      fontSize: 44,
      bold: true,
    },
    subtitle: {
      color: { rgbColor: { red: 0.3, green: 0.3, blue: 0.3 } },
      fontSize: 24,
      bold: false,
    },
    body: {
      color: { rgbColor: { red: 0.2, green: 0.2, blue: 0.2 } },
      fontSize: 14,
      bold: false,
    },
    accent: { red: 0.2, green: 0.4, blue: 0.8 },
  },
  STARTUP_BOLD: {
    background: { red: 1, green: 1, blue: 1 },
    title: {
      color: { rgbColor: { red: 0.9, green: 0.2, blue: 0.2 } },
      fontSize: 48,
      bold: true,
    },
    subtitle: {
      color: { rgbColor: { red: 0.3, green: 0.3, blue: 0.3 } },
      fontSize: 28,
      bold: true,
    },
    body: {
      color: { rgbColor: { red: 0.2, green: 0.2, blue: 0.2 } },
      fontSize: 16,
      bold: false,
    },
    accent: { red: 0.9, green: 0.2, blue: 0.2 },
  },
} as const;
