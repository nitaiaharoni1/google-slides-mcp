/**
 * Accessibility utilities
 * WCAG compliance checking and accessibility validation
 */

import { ACCESSIBILITY } from "../config/design-system";

/**
 * RGB color in 0-1 range
 */
export interface RGBColor {
  red: number;
  green: number;
  blue: number;
}

/**
 * Contrast ratio result
 */
export interface ContrastResult {
  ratio: number;
  passesAA: boolean;
  passesAALarge: boolean;
  passesAAA: boolean;
  level: "AA" | "AAA" | "FAIL";
  message: string;
}

/**
 * Convert RGB (0-1) to relative luminance
 * Based on WCAG 2.1 formula
 */
function getLuminance(color: RGBColor): number {
  const { red, green, blue } = color;

  // Convert to 0-255 range
  const r = red <= 0.03928 ? red / 12.92 : Math.pow((red + 0.055) / 1.055, 2.4);
  const g =
    green <= 0.03928 ? green / 12.92 : Math.pow((green + 0.055) / 1.055, 2.4);
  const b =
    blue <= 0.03928 ? blue / 12.92 : Math.pow((blue + 0.055) / 1.055, 2.4);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 * Returns ratio from 1:1 (no contrast) to 21:1 (maximum contrast)
 */
export function calculateContrastRatio(
  foreground: RGBColor,
  background: RGBColor
): number {
  const lum1 = getLuminance(foreground);
  const lum2 = getLuminance(background);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check color contrast against WCAG standards
 */
export function checkColorContrast(
  foreground: RGBColor,
  background: RGBColor,
  fontSize?: number
): ContrastResult {
  const ratio = calculateContrastRatio(foreground, background);

  // Determine if text is "large" (18pt+ or 14pt+ bold)
  const isLargeText = fontSize ? fontSize >= 18 : false;

  const passesAA = ratio >= ACCESSIBILITY.MIN_CONTRAST_RATIO.AA;
  const passesAALarge =
    ratio >= ACCESSIBILITY.MIN_CONTRAST_RATIO.AA_LARGE && isLargeText;
  const passesAAA = ratio >= ACCESSIBILITY.MIN_CONTRAST_RATIO.AAA;

  let level: "AA" | "AAA" | "FAIL";
  if (passesAAA) {
    level = "AAA";
  } else if (passesAA || passesAALarge) {
    level = "AA";
  } else {
    level = "FAIL";
  }

  let message = `Contrast ratio: ${ratio.toFixed(2)}:1`;
  if (level === "AAA") {
    message += " (WCAG AAA ✓)";
  } else if (level === "AA") {
    message += ` (WCAG AA ✓${isLargeText ? " - Large text" : ""})`;
  } else {
    const required = isLargeText
      ? ACCESSIBILITY.MIN_CONTRAST_RATIO.AA_LARGE
      : ACCESSIBILITY.MIN_CONTRAST_RATIO.AA;
    message += ` (WCAG AA ✗ - requires ${required}:1)`;
  }

  return {
    ratio,
    passesAA,
    passesAALarge,
    passesAAA,
    level,
    message,
  };
}

/**
 * Suggest a more accessible color
 * Adjusts foreground color to meet contrast requirements
 */
export function suggestAccessibleColor(
  foreground: RGBColor,
  background: RGBColor,
  targetLevel: "AA" | "AAA" = "AA",
  fontSize?: number
): RGBColor | null {
  const isLargeText = fontSize ? fontSize >= 18 : false;
  const requiredRatio =
    targetLevel === "AAA"
      ? ACCESSIBILITY.MIN_CONTRAST_RATIO.AAA
      : isLargeText
        ? ACCESSIBILITY.MIN_CONTRAST_RATIO.AA_LARGE
        : ACCESSIBILITY.MIN_CONTRAST_RATIO.AA;

  const currentRatio = calculateContrastRatio(foreground, background);

  if (currentRatio >= requiredRatio) {
    return null; // Already accessible
  }

  const bgLuminance = getLuminance(background);

  // If background is dark, lighten foreground; if light, darken foreground
  const isDarkBackground = bgLuminance < 0.5;

  // Try adjusting the color
  let adjusted = { ...foreground };
  const step = 0.05;
  const maxIterations = 20;

  for (let i = 0; i < maxIterations; i++) {
    const ratio = calculateContrastRatio(adjusted, background);
    if (ratio >= requiredRatio) {
      return adjusted;
    }

    // Adjust towards white (if dark bg) or black (if light bg)
    if (isDarkBackground) {
      adjusted = {
        red: Math.min(1, adjusted.red + step),
        green: Math.min(1, adjusted.green + step),
        blue: Math.min(1, adjusted.blue + step),
      };
    } else {
      adjusted = {
        red: Math.max(0, adjusted.red - step),
        green: Math.max(0, adjusted.green - step),
        blue: Math.max(0, adjusted.blue - step),
      };
    }
  }

  // Fallback: return high contrast color
  return isDarkBackground
    ? { red: 1, green: 1, blue: 1 } // White
    : { red: 0, green: 0, blue: 0 }; // Black
}

/**
 * Validate text size meets accessibility standards
 */
export function validateTextSize(
  fontSize: number,
  elementType: "body" | "title" | "caption" = "body"
): { valid: boolean; warning?: string; suggestion?: string } {
  const minSize =
    ACCESSIBILITY.MIN_FONT_SIZE[
      elementType.toUpperCase() as keyof typeof ACCESSIBILITY.MIN_FONT_SIZE
    ];

  if (fontSize < minSize) {
    return {
      valid: false,
      warning: `Font size ${fontSize}pt is below minimum ${minSize}pt for ${elementType} text`,
      suggestion: `Increase font size to at least ${minSize}pt for better readability`,
    };
  }

  return { valid: true };
}

/**
 * Comprehensive accessibility check for text element
 */
export interface AccessibilityCheckResult {
  contrast: ContrastResult;
  fontSize: { valid: boolean; warning?: string; suggestion?: string };
  overall: "PASS" | "WARN" | "FAIL";
  warnings: string[];
  suggestions: string[];
}

export function checkTextAccessibility(
  foreground: RGBColor,
  background: RGBColor,
  fontSize: number,
  elementType: "body" | "title" | "caption" = "body"
): AccessibilityCheckResult {
  const contrast = checkColorContrast(foreground, background, fontSize);
  const fontSizeCheck = validateTextSize(fontSize, elementType);

  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (contrast.level === "FAIL") {
    warnings.push(contrast.message);
    const suggestedColor = suggestAccessibleColor(
      foreground,
      background,
      "AA",
      fontSize
    );
    if (suggestedColor) {
      suggestions.push(
        `Consider using RGB(${Math.round(suggestedColor.red * 255)}, ${Math.round(suggestedColor.green * 255)}, ${Math.round(suggestedColor.blue * 255)}) for better contrast`
      );
    }
  } else if (contrast.level === "AA") {
    warnings.push(`Consider improving contrast for WCAG AAA compliance`);
  }

  if (!fontSizeCheck.valid) {
    warnings.push(fontSizeCheck.warning || "");
    if (fontSizeCheck.suggestion) {
      suggestions.push(fontSizeCheck.suggestion);
    }
  }

  let overall: "PASS" | "WARN" | "FAIL";
  if (contrast.level === "FAIL" || !fontSizeCheck.valid) {
    overall = "FAIL";
  } else if (contrast.level === "AA" || warnings.length > 0) {
    overall = "WARN";
  } else {
    overall = "PASS";
  }

  return {
    contrast,
    fontSize: fontSizeCheck,
    overall,
    warnings,
    suggestions,
  };
}

