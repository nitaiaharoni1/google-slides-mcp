/**
 * Layout engine utilities
 * Grid system, auto-layout, distribution, and alignment helpers
 */

import { SlideDimensions } from "./bounds";
import { SPACING, LAYOUT } from "../config/design-system";

/**
 * Element bounds
 */
export interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Element with bounds
 */
export interface LayoutElement {
  id: string;
  bounds: ElementBounds;
}

/**
 * Snap coordinate to grid
 */
export function snapToGrid(
  value: number,
  gridSize: number = LAYOUT.GRID_SIZE
): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Snap element bounds to grid
 */
export function snapElementToGrid(
  element: ElementBounds,
  gridSize: number = LAYOUT.GRID_SIZE
): ElementBounds {
  return {
    x: snapToGrid(element.x, gridSize),
    y: snapToGrid(element.y, gridSize),
    width: snapToGrid(element.width, gridSize),
    height: snapToGrid(element.height, gridSize),
  };
}

/**
 * Check if two elements overlap
 */
export function elementsOverlap(a: ElementBounds, b: ElementBounds): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

/**
 * Calculate overlap area between two elements
 */
export function getOverlapArea(a: ElementBounds, b: ElementBounds): number {
  const xOverlap = Math.max(
    0,
    Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  );
  const yOverlap = Math.max(
    0,
    Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  );
  return xOverlap * yOverlap;
}

/**
 * Auto-layout elements to avoid overlap
 * Uses a simple algorithm: place elements in a grid or stack them
 */
export function autoLayoutElements(
  elements: LayoutElement[],
  slideSize: SlideDimensions,
  strategy: "grid" | "stack" | "flow" = "flow"
): LayoutElement[] {
  if (elements.length === 0) {
    return [];
  }

  const margin = SPACING.MARGIN;
  const gap = SPACING.ELEMENT_GAP;
  const slideWidth: number = slideSize.width;
  const slideHeight: number = slideSize.height;
  const availableWidth = slideWidth - margin * 2;
  const availableHeight = slideHeight - margin * 2;

  switch (strategy) {
    case "grid": {
      // Calculate grid dimensions
      const cols = Math.ceil(Math.sqrt(elements.length));
      const rows = Math.ceil(elements.length / cols);

      const cellWidth = (availableWidth - gap * (cols - 1)) / cols;
      const cellHeight = (availableHeight - gap * (rows - 1)) / rows;

      return elements.map((element, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);

        return {
          ...element,
          bounds: {
            x: margin + col * (cellWidth + gap),
            y: margin + row * (cellHeight + gap),
            width: Math.min(element.bounds.width, cellWidth),
            height: Math.min(element.bounds.height, cellHeight),
          },
        };
      });
    }

    case "stack": {
      // Stack elements vertically
      let currentY = margin;

      return elements.map((element) => {
        const result = {
          ...element,
          bounds: {
            ...element.bounds,
            x: margin,
            y: currentY,
          },
        };
        currentY += element.bounds.height + gap;
        return result;
      });
    }

    case "flow": {
      // Flow layout: place elements left-to-right, wrap when needed
      let currentX = margin;
      let currentY = margin;
      let rowHeight = 0;

      return elements.map((element) => {
        // Check if element fits on current line
        const slideWidth: number = slideSize.width;
        if (
          currentX + element.bounds.width > slideWidth - margin &&
          currentX > margin
        ) {
          // Wrap to next line
          currentX = margin;
          currentY += rowHeight + gap;
          rowHeight = 0;
        }

        const result = {
          ...element,
          bounds: {
            ...element.bounds,
            x: currentX,
            y: currentY,
          },
        };

        currentX += element.bounds.width + gap;
        rowHeight = Math.max(rowHeight, element.bounds.height);

        return result;
      });
    }

    default:
      return elements;
  }
}

/**
 * Distribute elements evenly along an axis
 */
export function distributeEvenly(
  elements: LayoutElement[],
  axis: "x" | "y",
  region: ElementBounds
): LayoutElement[] {
  if (elements.length === 0) {
    return [];
  }

  if (elements.length === 1) {
    return elements;
  }

  // Calculate total size of elements
  const totalSize =
    axis === "x"
      ? elements.reduce((sum, el) => sum + el.bounds.width, 0)
      : elements.reduce((sum, el) => sum + el.bounds.height, 0);

  const regionSize = axis === "x" ? region.width : region.height;
  const gap = (regionSize - totalSize) / (elements.length - 1);

  let currentPos = axis === "x" ? region.x : region.y;

  return elements.map((element) => {
    const newBounds = { ...element.bounds };

    if (axis === "x") {
      newBounds.x = currentPos;
      newBounds.y = region.y;
      currentPos += element.bounds.width + gap;
    } else {
      newBounds.x = region.x;
      newBounds.y = currentPos;
      currentPos += element.bounds.height + gap;
    }

    return {
      ...element,
      bounds: newBounds,
    };
  });
}

/**
 * Alignment options
 */
export type Alignment =
  | "left"
  | "center"
  | "right"
  | "top"
  | "bottom"
  | "middle";

/**
 * Align elements to a common edge or center
 */
export function alignElements(
  elements: LayoutElement[],
  alignment: Alignment,
  referenceBounds?: ElementBounds
): LayoutElement[] {
  if (elements.length === 0) {
    return [];
  }

  // Use first element as reference if none provided
  const ref = referenceBounds || elements[0].bounds;

  return elements.map((element) => {
    const newBounds = { ...element.bounds };

    switch (alignment) {
      case "left":
        newBounds.x = ref.x;
        break;
      case "center":
        newBounds.x = ref.x + (ref.width - element.bounds.width) / 2;
        break;
      case "right":
        newBounds.x = ref.x + ref.width - element.bounds.width;
        break;
      case "top":
        newBounds.y = ref.y;
        break;
      case "middle":
        newBounds.y = ref.y + (ref.height - element.bounds.height) / 2;
        break;
      case "bottom":
        newBounds.y = ref.y + ref.height - element.bounds.height;
        break;
    }

    return {
      ...element,
      bounds: newBounds,
    };
  });
}

/**
 * Center an element within a region
 */
export function centerElement(
  element: ElementBounds,
  region: ElementBounds
): ElementBounds {
  return {
    ...element,
    x: region.x + (region.width - element.width) / 2,
    y: region.y + (region.height - element.height) / 2,
  };
}

/**
 * Calculate bounding box of multiple elements
 */
export function getBoundingBox(elements: ElementBounds[]): ElementBounds {
  if (elements.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const element of elements) {
    minX = Math.min(minX, element.x);
    minY = Math.min(minY, element.y);
    maxX = Math.max(maxX, element.x + element.width);
    maxY = Math.max(maxY, element.y + element.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Detect and resolve overlaps in element layout
 */
export function resolveOverlaps(
  elements: LayoutElement[],
  slideSize: SlideDimensions
): LayoutElement[] {
  const margin = SPACING.MARGIN;
  const gap = SPACING.ELEMENT_GAP;
  const resolved: LayoutElement[] = [];

  for (const element of elements) {
    const newBounds = { ...element.bounds };
    let attempts = 0;
    const maxAttempts = 100;

    // Try to find a non-overlapping position
    while (attempts < maxAttempts) {
      let hasOverlap = false;

      // Check against already placed elements
      for (const placed of resolved) {
        if (elementsOverlap(newBounds, placed.bounds)) {
          hasOverlap = true;
          break;
        }
      }

      // Check slide bounds
      const slideWidth: number = slideSize.width;
      const slideHeight: number = slideSize.height;
      if (
        newBounds.x < margin ||
        newBounds.y < margin ||
        newBounds.x + newBounds.width > slideWidth - margin ||
        newBounds.y + newBounds.height > slideHeight - margin
      ) {
        hasOverlap = true;
      }

      if (!hasOverlap) {
        break;
      }

      // Try moving down
      newBounds.y += gap;
      if (newBounds.y + newBounds.height > slideHeight - margin) {
        // Try next column
        newBounds.y = margin;
        newBounds.x += gap + newBounds.width;
      }

      attempts++;
    }

    resolved.push({
      ...element,
      bounds: newBounds,
    });
  }

  return resolved;
}
