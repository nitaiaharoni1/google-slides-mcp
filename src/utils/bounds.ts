/**
 * Bounds validation utilities
 * Centralized functions for validating and clamping element coordinates
 * to prevent overflow off slides
 */

import { slides_v1 } from "googleapis";
import { CONVERSION } from "../config/constants";
import { logger } from "./logger";

/**
 * Standard slide dimensions in points (16:9 aspect ratio)
 */
export const SLIDE_DIMENSIONS = {
  WIDTH: 720, // 10 inches
  HEIGHT: 405, // 5.625 inches
  MIN_MARGIN: 20, // Minimum margin from edges
} as const;

/**
 * Slide dimensions interface
 */
export interface SlideDimensions {
  width: number;
  height: number;
}

/**
 * Default slide dimensions object
 */
export const DEFAULT_SLIDE_DIMENSIONS: SlideDimensions = {
  width: SLIDE_DIMENSIONS.WIDTH,
  height: SLIDE_DIMENSIONS.HEIGHT,
};

/**
 * Result of bounds validation/clamping
 */
export interface BoundsResult {
  x: number;
  y: number;
  width: number;
  height: number;
  wasClamped: boolean;
  warnings: string[];
  originalBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Convert EMU to points
 */
function emuToPt(emu: number): number {
  return emu / CONVERSION.EMU_PER_POINT;
}

/**
 * Get actual slide dimensions from presentation
 * Falls back to default dimensions if not available
 */
export async function getSlideSize(
  slides: slides_v1.Slides,
  presentationId: string
): Promise<SlideDimensions> {
  try {
    const presentation = await slides.presentations.get({
      presentationId,
    });
    const pageSize = presentation.data.pageSize;

    if (pageSize?.width?.magnitude && pageSize?.height?.magnitude) {
      return {
        width: emuToPt(pageSize.width.magnitude),
        height: emuToPt(pageSize.height.magnitude),
      };
    }
  } catch (error) {
    logger.warn(
      `⚠️  Failed to fetch slide size for ${presentationId}, using defaults: ${(error as Error).message}`
    );
  }

  // Fallback to default dimensions
  return {
    width: SLIDE_DIMENSIONS.WIDTH,
    height: SLIDE_DIMENSIONS.HEIGHT,
  };
}

/**
 * Validate and clamp element coordinates to stay within slide bounds
 * Returns adjusted x, y, width, height values with warnings
 */
export function validateAndClampBounds(
  x: number,
  y: number,
  width: number,
  height: number,
  slideDimensions: SlideDimensions = DEFAULT_SLIDE_DIMENSIONS
): BoundsResult {
  const warnings: string[] = [];
  const originalBounds = { x, y, width, height };
  let wasClamped = false;

  // Ensure minimum size
  const minSize = 10;
  if (width < minSize) {
    warnings.push(`Width clamped from ${width}pt to ${minSize}pt (minimum)`);
    width = minSize;
    wasClamped = true;
  }
  if (height < minSize) {
    warnings.push(`Height clamped from ${height}pt to ${minSize}pt (minimum)`);
    height = minSize;
    wasClamped = true;
  }

  // Clamp width and height to slide dimensions
  const maxWidth = slideDimensions.width - SLIDE_DIMENSIONS.MIN_MARGIN * 2;
  const maxHeight = slideDimensions.height - SLIDE_DIMENSIONS.MIN_MARGIN * 2;

  if (width > maxWidth) {
    warnings.push(
      `Width clamped from ${width}pt to ${maxWidth}pt (slide limit)`
    );
    width = maxWidth;
    wasClamped = true;
  }
  if (height > maxHeight) {
    warnings.push(
      `Height clamped from ${height}pt to ${maxHeight}pt (slide limit)`
    );
    height = maxHeight;
    wasClamped = true;
  }

  // Clamp x position to keep element within bounds
  const minX = SLIDE_DIMENSIONS.MIN_MARGIN;
  const maxX = slideDimensions.width - width - SLIDE_DIMENSIONS.MIN_MARGIN;

  if (x < minX) {
    warnings.push(`X position clamped from ${x}pt to ${minX}pt`);
    x = minX;
    wasClamped = true;
  } else if (x > maxX) {
    warnings.push(`X position clamped from ${x}pt to ${maxX}pt`);
    x = maxX;
    wasClamped = true;
  }

  // Clamp y position to keep element within bounds
  const minY = SLIDE_DIMENSIONS.MIN_MARGIN;
  const maxY = slideDimensions.height - height - SLIDE_DIMENSIONS.MIN_MARGIN;

  if (y < minY) {
    warnings.push(`Y position clamped from ${y}pt to ${minY}pt`);
    y = minY;
    wasClamped = true;
  } else if (y > maxY) {
    warnings.push(`Y position clamped from ${y}pt to ${maxY}pt`);
    y = maxY;
    wasClamped = true;
  }

  return {
    x,
    y,
    width,
    height,
    wasClamped,
    warnings,
    originalBounds,
  };
}

/**
 * Clamp dimensions while preserving aspect ratio
 * Useful for images
 */
export function clampWithAspectRatio(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number; wasClamped: boolean } {
  const aspectRatio = width / height;
  let wasClamped = false;

  // If width exceeds max, scale both dimensions
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
    wasClamped = true;
  }

  // If height still exceeds max after width adjustment, scale again
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
    wasClamped = true;
  }

  return { width, height, wasClamped };
}

/**
 * Validate and clamp bounds with aspect ratio preservation
 */
export function validateAndClampBoundsWithAspectRatio(
  x: number,
  y: number,
  width: number,
  height: number,
  slideDimensions: SlideDimensions = DEFAULT_SLIDE_DIMENSIONS
): BoundsResult {
  const warnings: string[] = [];
  const originalBounds = { x, y, width, height };
  let wasClamped = false;

  // First clamp dimensions with aspect ratio preservation
  const maxWidth = slideDimensions.width - SLIDE_DIMENSIONS.MIN_MARGIN * 2;
  const maxHeight = slideDimensions.height - SLIDE_DIMENSIONS.MIN_MARGIN * 2;

  const {
    width: clampedWidth,
    height: clampedHeight,
    wasClamped: sizeClamped,
  } = clampWithAspectRatio(width, height, maxWidth, maxHeight);

  if (sizeClamped) {
    warnings.push(
      `Dimensions clamped from ${width}x${height}pt to ${clampedWidth}x${clampedHeight}pt (preserving aspect ratio)`
    );
    wasClamped = true;
  }

  width = clampedWidth;
  height = clampedHeight;

  // Ensure minimum size
  const minSize = 10;
  if (width < minSize || height < minSize) {
    // Scale up proportionally if below minimum
    const scale = Math.max(minSize / width, minSize / height);
    width = width * scale;
    height = height * scale;
    warnings.push(
      `Dimensions scaled up to ${width}x${height}pt (minimum size)`
    );
    wasClamped = true;
  }

  // Clamp x position
  const minX = SLIDE_DIMENSIONS.MIN_MARGIN;
  const maxX = slideDimensions.width - width - SLIDE_DIMENSIONS.MIN_MARGIN;

  if (x < minX) {
    warnings.push(`X position clamped from ${x}pt to ${minX}pt`);
    x = minX;
    wasClamped = true;
  } else if (x > maxX) {
    warnings.push(`X position clamped from ${x}pt to ${maxX}pt`);
    x = maxX;
    wasClamped = true;
  }

  // Clamp y position
  const minY = SLIDE_DIMENSIONS.MIN_MARGIN;
  const maxY = slideDimensions.height - height - SLIDE_DIMENSIONS.MIN_MARGIN;

  if (y < minY) {
    warnings.push(`Y position clamped from ${y}pt to ${minY}pt`);
    y = minY;
    wasClamped = true;
  } else if (y > maxY) {
    warnings.push(`Y position clamped from ${y}pt to ${maxY}pt`);
    y = maxY;
    wasClamped = true;
  }

  return {
    x,
    y,
    width,
    height,
    wasClamped,
    warnings,
    originalBounds,
  };
}
