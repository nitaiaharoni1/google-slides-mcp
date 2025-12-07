/**
 * Smart Layout Utilities
 * Golden ratio spacing, grid snapping, auto-sizing, and content-aware presets
 */

import { TYPOGRAPHY, COLORS } from "../config/design-system";
import { calculateRequiredTextBoxSize } from "./text-sizing";

/**
 * Golden ratio constant (phi = 1.618...)
 */
export const GOLDEN_RATIO = 1.618;

/**
 * Grid size for snapping (8pt)
 */
export const GRID_SIZE = 8;

/**
 * Snap a value to the nearest grid point (8pt increments)
 */
export function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

/**
 * Calculate golden ratio spacing between elements
 * @param baseSize - Base size (usually fontSize) to multiply by golden ratio
 * @returns Spacing value snapped to grid
 */
export function goldenRatioSpacing(baseSize: number): number {
  return snapToGrid(baseSize * GOLDEN_RATIO);
}

/**
 * Content type detection for auto-presets
 */
export type ContentPreset = "title" | "subtitle" | "body" | "metric" | "bullet";

/**
 * Detect content type based on text and position
 */
export function detectContentPreset(
  text: string,
  index: number,
  y?: number,
  previousPreset?: ContentPreset
): ContentPreset {
  // Metric detection: short text with numbers or %
  if (text.length < 20 && /\d|%/.test(text)) {
    return "metric";
  }

  // Bullet detection: starts with bullet character
  if (/^[•\-*+]/.test(text.trim())) {
    return "bullet";
  }

  // Title detection: first box, or top position, or short text at top
  if (
    index === 0 ||
    (y !== undefined && y < 80) ||
    (text.length < 50 && y !== undefined && y < 100)
  ) {
    return "title";
  }

  // Subtitle detection: second box, or follows title, or middle position
  if (
    index === 1 ||
    previousPreset === "title" ||
    (y !== undefined && y >= 80 && y < 150)
  ) {
    return "subtitle";
  }

  // Body: long text or lower position
  if (text.length > 100 || (y !== undefined && y >= 150)) {
    return "body";
  }

  // Default to body for safety
  return "body";
}

/**
 * Preset styling configuration
 */
export interface PresetStyle {
  fontSize: number;
  bold: boolean;
  alignment: "START" | "CENTER" | "END" | "JUSTIFIED";
  foregroundColor?: { rgbColor: { red: number; green: number; blue: number } };
}

/**
 * Get preset style based on content type
 */
export function getPresetStyle(preset: ContentPreset): PresetStyle {
  switch (preset) {
    case "title":
      return {
        fontSize: TYPOGRAPHY.HEADLINE, // 44pt
        bold: true,
        alignment: "CENTER",
      };
    case "subtitle":
      return {
        fontSize: TYPOGRAPHY.SUBTITLE, // 24pt
        bold: true,
        alignment: "CENTER",
        foregroundColor: {
          rgbColor: COLORS.GRAY[600], // Gray for subtitle
        },
      };
    case "metric":
      return {
        fontSize: 48, // Large for metrics
        bold: true,
        alignment: "CENTER",
      };
    case "bullet":
      return {
        fontSize: TYPOGRAPHY.BODY, // 14pt
        bold: false,
        alignment: "START",
      };
    case "body":
    default:
      return {
        fontSize: TYPOGRAPHY.BODY, // 14pt
        bold: false,
        alignment: "START",
      };
  }
}

/**
 * Calculate auto-sized dimensions for a text box
 * @param text - Text content
 * @param fontSize - Font size in points
 * @param requestedWidth - Requested width (optional)
 * @param requestedHeight - Requested height (optional)
 * @returns Auto-calculated width and height
 */
export function autoSizeTextBox(
  text: string,
  fontSize: number,
  requestedWidth?: number,
  requestedHeight?: number
): { width: number; height: number } {
  const charCount = text.length;
  const lineCount = text.split("\n").length;

  // Calculate width
  let width: number;
  if (requestedWidth !== undefined) {
    width = requestedWidth;
  } else {
    // Auto-calculate width based on content
    const estimatedWidth = Math.min(
      680, // Max slide width minus margins
      Math.max(200, charCount * fontSize * 0.5)
    );
    width = snapToGrid(estimatedWidth);
  }

  // Calculate height
  let height: number;
  if (requestedHeight !== undefined) {
    height = requestedHeight;
  } else {
    if (lineCount === 1 && text.length < 30) {
      // Single line short text
      height = fontSize * 2;
    } else {
      // Multi-line or long text - use text sizing utility
      const requiredSize = calculateRequiredTextBoxSize(
        text,
        fontSize,
        1.2,
        width
      );
      height = requiredSize.height;
    }
    height = snapToGrid(height);
  }

  return { width, height };
}

/**
 * Calculate recommended Y positions for common slide elements
 */
export function getRecommendedPositions(): {
  title: number;
  subtitle: number;
  body: number;
} {
  return {
    title: snapToGrid(32), // y=32
    subtitle: snapToGrid(88), // y=88 (32 + 44*1.618 ≈ 88)
    body: snapToGrid(136), // y=136 (88 + 24*1.618 ≈ 136)
  };
}

/**
 * Calculate vertical gap using golden ratio
 * @param fontSize - Font size of the element
 * @returns Gap size snapped to grid
 */
export function calculateVerticalGap(fontSize: number): number {
  return goldenRatioSpacing(fontSize);
}

/**
 * Apply smart defaults to a text box configuration
 * @param text - Text content
 * @param index - Index in the array
 * @param y - Y position (optional)
 * @param previousPreset - Previous preset type (optional)
 * @param requestedWidth - Requested width (optional)
 * @param requestedHeight - Requested height (optional)
 * @returns Enhanced text box configuration with smart defaults
 */
export function applySmartDefaults(
  text: string,
  index: number,
  y?: number,
  previousPreset?: ContentPreset,
  requestedWidth?: number,
  requestedHeight?: number
): {
  preset: ContentPreset;
  style: PresetStyle;
  width: number;
  height: number;
  recommendedY: number;
} {
  const preset = detectContentPreset(text, index, y, previousPreset);
  const style = getPresetStyle(preset);
  const { width, height } = autoSizeTextBox(
    text,
    style.fontSize,
    requestedWidth,
    requestedHeight
  );

  // Calculate recommended Y position
  const positions = getRecommendedPositions();
  let recommendedY: number;
  if (y !== undefined) {
    recommendedY = snapToGrid(y);
  } else {
    switch (preset) {
      case "title":
        recommendedY = positions.title;
        break;
      case "subtitle":
        recommendedY = positions.subtitle;
        break;
      case "body":
      case "bullet":
      default:
        recommendedY = positions.body;
        break;
    }
  }

  return {
    preset,
    style,
    width,
    height,
    recommendedY,
  };
}
