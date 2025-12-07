/**
 * Text sizing utilities
 * Calculate appropriate font sizes and bounding boxes based on content
 * to ensure text NEVER overflows
 */

/**
 * Configuration for text estimation
 * These values include safety margins to prevent overflow
 */
export const TEXT_ESTIMATION_CONFIG = {
  // Average character width multiplier (conservative estimate to prevent overflow)
  // Typical fonts range from 0.5-0.7, we use 0.7 to be safe
  AVG_CHAR_WIDTH_MULTIPLIER: 0.7,

  // Safety margin percentage for width calculations (20% buffer to prevent overflow)
  WIDTH_SAFETY_MARGIN: 0.2,

  // Safety margin percentage for height calculations (20% buffer for line spacing variations)
  HEIGHT_SAFETY_MARGIN: 0.2,

  // Internal padding in text boxes (Google Slides adds this automatically)
  INTERNAL_PADDING_HORIZONTAL: 16, // points (increased from 10)
  INTERNAL_PADDING_VERTICAL: 12, // points (increased from 8)

  // Default line height multiplier
  DEFAULT_LINE_HEIGHT: 1.2,

  // Maximum chars per line before word wrapping is likely
  MAX_CHARS_PER_LINE: 80,
} as const;

/**
 * Estimate text width in points based on character count and font size
 * Includes safety margins and internal padding to PREVENT OVERFLOW
 *
 * @param text - Text content
 * @param fontSize - Font size in points
 * @param includeSafetyMargin - Whether to include safety margin (default: true)
 * @returns Estimated width in points (conservative to prevent overflow)
 */
export function estimateTextWidth(
  text: string,
  fontSize: number,
  includeSafetyMargin: boolean = true
): number {
  if (!text || text.length === 0) return 0;

  const avgCharWidth =
    fontSize * TEXT_ESTIMATION_CONFIG.AVG_CHAR_WIDTH_MULTIPLIER;

  // Find longest line (for multi-line text)
  const lines = text.split("\n");
  const longestLine = lines.reduce(
    (max, line) => (line.length > max.length ? line : max),
    ""
  );

  const baseWidth = longestLine.length * avgCharWidth;
  const withPadding =
    baseWidth + TEXT_ESTIMATION_CONFIG.INTERNAL_PADDING_HORIZONTAL * 2;

  if (includeSafetyMargin) {
    return withPadding * (1 + TEXT_ESTIMATION_CONFIG.WIDTH_SAFETY_MARGIN);
  }

  return withPadding;
}

/**
 * Estimate text height in points based on line count and font size
 * Includes safety margins and internal padding to PREVENT OVERFLOW
 *
 * @param text - Text content
 * @param fontSize - Font size in points
 * @param lineHeight - Line height multiplier (default: 1.2)
 * @param maxWidth - Maximum width for wrapping calculation (optional)
 * @param includeSafetyMargin - Whether to include safety margin (default: true)
 * @returns Estimated height in points (conservative to prevent overflow)
 */
export function estimateTextHeight(
  text: string,
  fontSize: number,
  lineHeight: number = TEXT_ESTIMATION_CONFIG.DEFAULT_LINE_HEIGHT,
  maxWidth?: number,
  includeSafetyMargin: boolean = true
): number {
  if (!text || text.length === 0) return 0;

  let totalLines = 0;
  const lines = text.split("\n");

  // If maxWidth is provided, calculate wrapping for each line
  if (maxWidth !== undefined && maxWidth > 0) {
    // Use slightly more accurate character width (0.65 instead of 0.7 for better estimation)
    // This accounts for average character width in typical fonts more accurately
    const avgCharWidth = fontSize * 0.65; // More accurate than 0.7, still conservative
    const availableWidth =
      maxWidth - TEXT_ESTIMATION_CONFIG.INTERNAL_PADDING_HORIZONTAL * 2;
    const maxCharsPerLine = Math.floor(availableWidth / avgCharWidth);

    for (const line of lines) {
      if (line.length === 0) {
        totalLines += 1; // Empty line still takes space
      } else if (line.length <= maxCharsPerLine) {
        totalLines += 1;
      } else {
        // Estimate wrapped lines - account for word boundaries more accurately
        // Use a more realistic estimate: most lines wrap at ~80% of max chars due to word boundaries
        const effectiveMaxChars = Math.floor(maxCharsPerLine * 0.85); // Account for word boundaries
        const estimatedWrappedLines = Math.ceil(
          line.length / effectiveMaxChars
        );
        // Don't add extra 20% here - we're already being conservative with effectiveMaxChars
        totalLines += estimatedWrappedLines;
      }
    }
  } else {
    // No wrapping calculation, just count explicit lines
    totalLines = lines.length;
  }

  const baseHeight = totalLines * fontSize * lineHeight;
  const withPadding =
    baseHeight + TEXT_ESTIMATION_CONFIG.INTERNAL_PADDING_VERTICAL * 2;

  if (includeSafetyMargin) {
    // Reduce safety margin for multi-line text (it's already conservative from wrapping calc)
    // Use smaller margin (10% instead of 20%) for text with wrapping
    const safetyMargin =
      maxWidth !== undefined && totalLines > lines.length
        ? 0.1 // 10% for wrapped text (already conservative)
        : TEXT_ESTIMATION_CONFIG.HEIGHT_SAFETY_MARGIN; // 20% for single-line or no wrapping
    return withPadding * (1 + safetyMargin);
  }

  return withPadding;
}

/**
 * Calculate minimum required bounding box dimensions for text
 * This ensures text will NEVER overflow
 *
 * @param text - Text content
 * @param fontSize - Font size in points
 * @param lineHeight - Line height multiplier (default: 1.2)
 * @param maxWidth - Optional maximum width constraint
 * @returns Object with required width and height in points
 */
export function calculateRequiredTextBoxSize(
  text: string,
  fontSize: number,
  lineHeight: number = TEXT_ESTIMATION_CONFIG.DEFAULT_LINE_HEIGHT,
  maxWidth?: number
): { width: number; height: number } {
  if (!text || text.length === 0) {
    return { width: 0, height: 0 };
  }

  // Calculate required width
  let requiredWidth = estimateTextWidth(text, fontSize, true);

  // If maxWidth is specified and required width exceeds it, use maxWidth
  // and calculate height with wrapping
  if (maxWidth !== undefined && requiredWidth > maxWidth) {
    requiredWidth = maxWidth;
  }

  // Calculate required height (with wrapping if width is constrained)
  const requiredHeight = estimateTextHeight(
    text,
    fontSize,
    lineHeight,
    requiredWidth,
    true
  );

  return {
    width: requiredWidth,
    height: requiredHeight,
  };
}

/**
 * Calculate appropriate font size for text to fit within container
 * @param text - Text content
 * @param maxWidth - Maximum width in points
 * @param maxHeight - Maximum height in points
 * @param baseFontSize - Starting font size in points
 * @param minFontSize - Minimum font size (default: 10pt)
 * @returns Calculated font size in points
 */
export function calculateFontSize(
  text: string,
  maxWidth: number,
  maxHeight: number,
  baseFontSize: number,
  minFontSize: number = 10
): number {
  if (!text || text.trim().length === 0) {
    return baseFontSize;
  }

  let fontSize = baseFontSize;
  const lineHeight = TEXT_ESTIMATION_CONFIG.DEFAULT_LINE_HEIGHT;

  // Check if text fits at base size (with safety margins)
  const width = estimateTextWidth(text, fontSize, true);
  const height = estimateTextHeight(text, fontSize, lineHeight, maxWidth, true);

  if (width <= maxWidth && height <= maxHeight) {
    return fontSize;
  }

  // Calculate scale factors needed
  const widthScale = maxWidth / width;
  const heightScale = maxHeight / height;
  const scale = Math.min(widthScale, heightScale);

  // Apply scale, but don't go below minimum
  fontSize = Math.max(fontSize * scale, minFontSize);

  // Verify it fits with additional safety check (90% of available space)
  const finalWidth = estimateTextWidth(text, fontSize, true);
  const finalHeight = estimateTextHeight(
    text,
    fontSize,
    lineHeight,
    maxWidth,
    true
  );

  // If still doesn't fit, reduce further
  if (finalWidth > maxWidth * 0.9 || finalHeight > maxHeight * 0.9) {
    const widthScale2 = (maxWidth * 0.9) / finalWidth;
    const heightScale2 = (maxHeight * 0.9) / finalHeight;
    fontSize = Math.max(
      fontSize * Math.min(widthScale2, heightScale2),
      minFontSize
    );
  }

  return Math.round(fontSize * 10) / 10; // Round to 1 decimal place
}

/**
 * Check if text will fit at given font size (with safety margins)
 */
export function textFits(
  text: string,
  fontSize: number,
  maxWidth: number,
  maxHeight: number
): boolean {
  const width = estimateTextWidth(text, fontSize, true);
  const height = estimateTextHeight(
    text,
    fontSize,
    TEXT_ESTIMATION_CONFIG.DEFAULT_LINE_HEIGHT,
    maxWidth,
    true
  );
  return width <= maxWidth && height <= maxHeight;
}

/**
 * Get recommended font size for title text
 */
export function getTitleFontSize(text: string, maxWidth: number): number {
  return calculateFontSize(text, maxWidth, 80, 44, 24);
}

/**
 * Get recommended font size for body text
 */
export function getBodyFontSize(
  text: string,
  maxWidth: number,
  maxHeight: number
): number {
  return calculateFontSize(text, maxWidth, maxHeight, 14, 10);
}
