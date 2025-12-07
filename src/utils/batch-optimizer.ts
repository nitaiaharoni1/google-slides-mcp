/**
 * Batch request optimizer
 * Merges compatible requests and chunks large batches
 */

import { slides_v1 } from "googleapis";
import { SLIDES_LIMITS } from "../config/constants";

/**
 * Google Slides API request
 */
type SlidesRequest = slides_v1.Schema$Request;

/**
 * Optimize batch requests by merging compatible operations
 */
export function optimizeBatchRequests(
  requests: SlidesRequest[]
): SlidesRequest[] {
  if (requests.length === 0) {
    return [];
  }

  const optimized: SlidesRequest[] = [];
  const textStyleUpdates = new Map<
    string,
    {
      objectId: string;
      style: Record<string, unknown>;
      textRange: slides_v1.Schema$Range;
    }
  >();

  // Group text style updates by objectId
  for (const request of requests) {
    if (request.updateTextStyle) {
      const { objectId, style, textRange } = request.updateTextStyle;
      if (objectId && style && textRange) {
        const key = objectId;
        const existing = textStyleUpdates.get(key);
        if (existing) {
          // Merge styles
          existing.style = { ...existing.style, ...style };
        } else {
          textStyleUpdates.set(key, {
            objectId,
            style: { ...style },
            textRange,
          });
        }
        continue; // Skip adding original request
      }
    }

    // Keep other requests as-is
    optimized.push(request);
  }

  // Add merged text style updates
  for (const [, update] of textStyleUpdates.entries()) {
    optimized.push({
      updateTextStyle: {
        objectId: update.objectId,
        style: update.style,
        textRange: update.textRange,
        fields: Object.keys(update.style).join(","),
      },
    });
  }

  return optimized;
}

/**
 * Chunk requests into batches respecting API limits
 */
export function chunkRequests(
  requests: SlidesRequest[],
  maxRequests: number = SLIDES_LIMITS.MAX_BATCH_REQUESTS
): SlidesRequest[][] {
  if (requests.length <= maxRequests) {
    return [requests];
  }

  const chunks: SlidesRequest[][] = [];
  for (let i = 0; i < requests.length; i += maxRequests) {
    chunks.push(requests.slice(i, i + maxRequests));
  }

  return chunks;
}

/**
 * Group requests by slide/page
 */
export function groupRequestsBySlide(
  requests: SlidesRequest[]
): Map<string, SlidesRequest[]> {
  const grouped = new Map<string, SlidesRequest[]>();

  for (const request of requests) {
    let slideId: string | undefined;

    // Extract slide ID from various request types
    if (request.createSlide) {
      // Will be assigned after creation
      slideId = "NEW";
    } else if (request.createShape) {
      slideId =
        request.createShape.elementProperties?.pageObjectId || "UNKNOWN";
    } else if (request.createImage) {
      slideId =
        request.createImage.elementProperties?.pageObjectId || "UNKNOWN";
    } else if (request.createTable) {
      slideId =
        request.createTable.elementProperties?.pageObjectId || "UNKNOWN";
    } else if (request.insertText) {
      // Text insertion doesn't have slide ID directly
      slideId = "UNKNOWN";
    } else {
      slideId = "UNKNOWN";
    }

    if (!grouped.has(slideId)) {
      grouped.set(slideId, []);
    }
    const group = grouped.get(slideId);
    if (group) {
      group.push(request);
    }
  }

  return grouped;
}

/**
 * Optimize and chunk requests for batch execution
 */
export function prepareBatchRequests(
  requests: SlidesRequest[],
  optimize: boolean = true,
  chunk: boolean = true
): SlidesRequest[][] {
  let processed = requests;

  // Optimize first
  if (optimize) {
    processed = optimizeBatchRequests(processed);
  }

  // Then chunk
  if (chunk) {
    return chunkRequests(processed);
  }

  return [processed];
}

/**
 * Estimate request complexity (for prioritization)
 */
export function estimateRequestComplexity(request: SlidesRequest): number {
  // Simple heuristic: more fields = more complex
  let complexity = 1;

  if (request.createShape) {
    complexity += 2;
  }
  if (request.createImage) {
    complexity += 2;
  }
  if (request.createTable) {
    complexity += 3;
  }
  if (request.updateTextStyle) {
    complexity += 1;
  }
  if (request.insertText) {
    const textLength = request.insertText.text?.length || 0;
    complexity += Math.ceil(textLength / 100); // 1 point per 100 chars
  }

  return complexity;
}

/**
 * Sort requests by complexity (simple first, complex last)
 * This can help with error recovery - simpler requests succeed first
 */
export function sortRequestsByComplexity(
  requests: SlidesRequest[]
): SlidesRequest[] {
  return [...requests].sort((a, b) => {
    return estimateRequestComplexity(a) - estimateRequestComplexity(b);
  });
}

/**
 * Validate batch size before execution
 */
export function validateBatchSize(requests: SlidesRequest[]): {
  valid: boolean;
  error?: string;
  suggestion?: string;
} {
  if (requests.length === 0) {
    return {
      valid: false,
      error: "Batch is empty",
      suggestion: "Add at least one request",
    };
  }

  if (requests.length > SLIDES_LIMITS.MAX_BATCH_REQUESTS) {
    return {
      valid: false,
      error: `Batch has ${requests.length} requests, exceeding limit of ${SLIDES_LIMITS.MAX_BATCH_REQUESTS}`,
      suggestion: `Split into ${Math.ceil(requests.length / SLIDES_LIMITS.MAX_BATCH_REQUESTS)} batches`,
    };
  }

  return { valid: true };
}
