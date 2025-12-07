/**
 * Enhanced text handling utilities
 * Smart text size calculation, wrapping, and splitting (NO TRUNCATION)
 */

import {
  estimateTextWidth,
  estimateTextHeight,
  calculateRequiredTextBoxSize,
  TEXT_ESTIMATION_CONFIG,
} from "./text-sizing";
import { CONTENT_DENSITY } from "../config/design-system";
import { logger } from "./logger";

/**
 * Convert escape sequences in text to actual characters
 * Handles common escape sequences like \n, \t, \r, \\, etc.
 * This is needed because JSON/MCP parameters may contain literal escape sequences
 * that need to be converted to actual control characters for the Google Slides API
 */
export function unescapeText(text: string): string {
  if (!text) {
    return text;
  }

  // Replace escape sequences with actual characters
  return text
    .replace(/\\n/g, "\n") // newline
    .replace(/\\t/g, "\t") // tab
    .replace(/\\r/g, "\r") // carriage return
    .replace(/\\\\/g, "\\") // escaped backslash
    .replace(/\\"/g, '"') // escaped quote
    .replace(/\\'/g, "'"); // escaped single quote
}

/**
 * DEPRECATED - Use calculateRequiredTextBoxSize instead
 * This function is kept for backward compatibility but discouraged
 *
 * @deprecated Use calculateRequiredTextBoxSize to get proper box dimensions
 */
export function smartTruncate(
  text: string,
  maxWidth: number,
  maxHeight: number,
  fontSize: number,
  _lineHeight: number = 1.2
): { text: string; wasTruncated: boolean; originalLength: number } {
  logger.warn(
    "⚠️  smartTruncate is deprecated. Text should not be truncated. Use calculateRequiredTextBoxSize instead."
  );

  return {
    text,
    wasTruncated: false,
    originalLength: text.length,
  };
}

/**
 * Wrap text to fit within maximum width
 * Returns array of lines
 */
export function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number
): string[] {
  if (!text) {
    return [];
  }

  const lines: string[] = [];
  const paragraphs = text.split("\n");
  const avgCharWidth =
    fontSize * TEXT_ESTIMATION_CONFIG.AVG_CHAR_WIDTH_MULTIPLIER;
  const availableWidth =
    maxWidth - TEXT_ESTIMATION_CONFIG.INTERNAL_PADDING_HORIZONTAL * 2;
  const maxCharsPerLine = Math.floor(availableWidth / avgCharWidth);

  for (const paragraph of paragraphs) {
    if (paragraph.length <= maxCharsPerLine) {
      lines.push(paragraph);
      continue;
    }

    // Split paragraph into words
    const words = paragraph.split(/\s+/);
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;

      if (testLine.length <= maxCharsPerLine) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        // If word itself is too long, break it
        if (word.length > maxCharsPerLine) {
          let remaining = word;
          while (remaining.length > maxCharsPerLine) {
            lines.push(remaining.substring(0, maxCharsPerLine));
            remaining = remaining.substring(maxCharsPerLine);
          }
          currentLine = remaining;
        } else {
          currentLine = word;
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

/**
 * Split long text content across multiple slides
 * Returns array of text chunks, each suitable for one slide
 */
export function splitTextToSlides(
  text: string,
  maxLinesPerSlide: number = CONTENT_DENSITY.MAX_LINES_PER_TEXT_BOX,
  fontSize: number = 14,
  maxWidth: number = 600
): string[] {
  if (!text) {
    return [];
  }

  const wrappedLines = wrapText(text, maxWidth, fontSize);
  const slides: string[] = [];

  for (let i = 0; i < wrappedLines.length; i += maxLinesPerSlide) {
    const slideLines = wrappedLines.slice(i, i + maxLinesPerSlide);
    slides.push(slideLines.join("\n"));
  }

  return slides;
}

/**
 * Calculate optimal font size for text to fit in container
 * with optional minimum/maximum constraints
 */
export function calculateOptimalFontSize(
  text: string,
  maxWidth: number,
  maxHeight: number,
  minFontSize: number = 10,
  maxFontSize: number = 72,
  lineHeight: number = 1.2
): number {
  if (!text || text.trim().length === 0) {
    return minFontSize;
  }

  // Binary search for optimal font size
  let low = minFontSize;
  let high = maxFontSize;
  let bestSize = minFontSize;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const width = estimateTextWidth(text, mid);
    const height = estimateTextHeight(text, mid, lineHeight);

    if (width <= maxWidth && height <= maxHeight) {
      bestSize = mid;
      low = mid + 1; // Try larger
    } else {
      high = mid - 1; // Too large, try smaller
    }
  }

  return Math.max(minFontSize, Math.min(maxFontSize, bestSize));
}

/**
 * Validate text content density and provide warnings
 * Does NOT truncate - instead suggests appropriate actions
 */
export function validateTextDensity(
  text: string,
  fontSize: number,
  maxWidth: number,
  maxHeight: number
): {
  valid: boolean;
  warnings: string[];
  suggestions: string[];
  recommendedSize?: { width: number; height: number };
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check character count
  if (text.length > CONTENT_DENSITY.MAX_TEXT_LENGTH_PER_BOX) {
    warnings.push(
      `Text length (${text.length}) exceeds recommended maximum (${CONTENT_DENSITY.MAX_TEXT_LENGTH_PER_BOX} characters)`
    );
    suggestions.push(
      "Consider splitting content across multiple slides or text boxes"
    );
  }

  // Check line count
  const lines = text.split("\n");
  if (lines.length > CONTENT_DENSITY.MAX_LINES_PER_TEXT_BOX) {
    warnings.push(
      `Text has ${lines.length} lines, exceeding recommended maximum (${CONTENT_DENSITY.MAX_LINES_PER_TEXT_BOX})`
    );
    suggestions.push(
      "Consider reducing content or splitting into multiple text boxes"
    );
  }

  // Calculate required size for text
  const requiredSize = calculateRequiredTextBoxSize(
    text,
    fontSize,
    TEXT_ESTIMATION_CONFIG.DEFAULT_LINE_HEIGHT,
    maxWidth
  );

  // Check if text fits in provided dimensions
  if (requiredSize.width > maxWidth || requiredSize.height > maxHeight) {
    warnings.push(
      `Text requires ${Math.ceil(requiredSize.width)}pt × ${Math.ceil(requiredSize.height)}pt but box is ${maxWidth}pt × ${maxHeight}pt`
    );
    suggestions.push(
      `Increase box size to at least ${Math.ceil(requiredSize.width)}pt × ${Math.ceil(requiredSize.height)}pt, or reduce font size`
    );
  }

  // Check for very long lines
  const longLines = lines.filter(
    (line) => line.length > TEXT_ESTIMATION_CONFIG.MAX_CHARS_PER_LINE
  );
  if (longLines.length > 0) {
    warnings.push(
      `${longLines.length} line(s) exceed ${TEXT_ESTIMATION_CONFIG.MAX_CHARS_PER_LINE} characters (may be hard to read)`
    );
    suggestions.push("Consider breaking long lines or adding line breaks");
  }

  return {
    valid: warnings.length === 0,
    warnings,
    suggestions,
    recommendedSize: requiredSize,
  };
}
