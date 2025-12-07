/**
 * Content validation utilities
 * Validate slide content before creation to prevent overflow and issues
 */

import { calculateFontSize, textFits } from "./text-sizing";
import { SLIDE_REGIONS } from "../config/constants";

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  suggestions: string[];
}

/**
 * Validate text content for a slide region
 */
export function validateTextContent(
  text: string,
  regionName: keyof typeof SLIDE_REGIONS,
  fontSize: number
): ValidationResult {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (!text || text.trim().length === 0) {
    return { valid: true, warnings, suggestions };
  }

  const region = SLIDE_REGIONS[regionName];
  const fits = textFits(text, fontSize, region.width, region.height);

  if (!fits) {
    warnings.push(
      `Text may overflow ${regionName} region (${region.width}x${region.height}pt) at ${fontSize}pt`
    );
    const recommendedSize = calculateFontSize(
      text,
      region.width,
      region.height,
      fontSize
    );
    if (recommendedSize < fontSize) {
      suggestions.push(`Consider reducing font size to ${recommendedSize}pt`);
    }
  }

  // Check for very long lines (hard to read)
  const lines = text.split("\n");
  const longLines = lines.filter((line) => line.length > 80);
  if (longLines.length > 0) {
    warnings.push(
      `${longLines.length} line(s) exceed 80 characters (may be hard to read)`
    );
    suggestions.push("Consider breaking long lines or reducing content");
  }

  // Check for too many lines
  if (lines.length > 15) {
    warnings.push(`Text has ${lines.length} lines (may be too dense)`);
    suggestions.push("Consider splitting content across multiple slides");
  }

  return {
    valid: warnings.length === 0,
    warnings,
    suggestions,
  };
}

/**
 * Validate table dimensions
 */
export function validateTableDimensions(
  rows: number,
  columns: number,
  _regionName: keyof typeof SLIDE_REGIONS = "CENTER"
): ValidationResult {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (rows > 15) {
    warnings.push(`Table has ${rows} rows (may be too large for slide)`);
    suggestions.push("Consider splitting into multiple tables or slides");
  }

  if (columns > 8) {
    warnings.push(`Table has ${columns} columns (may be too wide for slide)`);
    suggestions.push(
      "Consider reducing columns or using landscape orientation"
    );
  }

  if (rows * columns > 50) {
    warnings.push(`Table has ${rows * columns} cells (may be too dense)`);
    suggestions.push("Consider simplifying the table structure");
  }

  return {
    valid: warnings.length === 0,
    warnings,
    suggestions,
  };
}

/**
 * Validate slide content before creation
 */
export function validateSlideContent(content: {
  title?: string;
  subtitle?: string;
  bullets?: string[];
  text?: string;
  tableData?: { headers: string[]; rows: string[][] };
}): ValidationResult {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Validate title
  if (content.title) {
    const titleValidation = validateTextContent(content.title, "TITLE", 44);
    warnings.push(...titleValidation.warnings);
    suggestions.push(...titleValidation.suggestions);
  }

  // Validate subtitle
  if (content.subtitle) {
    const subtitleValidation = validateTextContent(
      content.subtitle,
      "SUBTITLE",
      24
    );
    warnings.push(...subtitleValidation.warnings);
    suggestions.push(...subtitleValidation.suggestions);
  }

  // Validate bullets
  if (content.bullets && content.bullets.length > 0) {
    const bulletsText = content.bullets.join("\n");
    const bulletsValidation = validateTextContent(bulletsText, "CENTER", 14);
    warnings.push(...bulletsValidation.warnings);
    suggestions.push(...bulletsValidation.suggestions);

    if (content.bullets.length > 8) {
      warnings.push(
        `Slide has ${content.bullets.length} bullet points (may be too many)`
      );
      suggestions.push("Consider grouping bullets or splitting across slides");
    }
  }

  // Validate table
  if (content.tableData) {
    const tableValidation = validateTableDimensions(
      content.tableData.rows.length + 1, // +1 for header
      content.tableData.headers.length
    );
    warnings.push(...tableValidation.warnings);
    suggestions.push(...tableValidation.suggestions);
  }

  return {
    valid: warnings.length === 0,
    warnings,
    suggestions,
  };
}
