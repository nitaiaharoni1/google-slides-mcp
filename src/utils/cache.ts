/**
 * Caching layer for presentation metadata
 * Reduces redundant API calls by caching slide dimensions, layouts, and masters
 */

import { slides_v1 } from "googleapis";
import { SlideDimensions } from "./bounds";
import { logger } from "./logger";

/**
 * Cached presentation metadata
 */
interface CachedPresentation {
  dimensions: SlideDimensions;
  layouts: Array<{ objectId: string; name?: string }>;
  masters: Array<{ objectId: string; name?: string }>;
  timestamp: number;
}

/**
 * Presentation cache with TTL
 */
class PresentationCache {
  private cache: Map<string, CachedPresentation> = new Map();
  private ttl: number; // Time to live in milliseconds

  constructor(ttlMs: number = 5 * 60 * 1000) {
    // Default: 5 minutes
    this.ttl = ttlMs;
  }

  /**
   * Get cached presentation data
   */
  get(presentationId: string): CachedPresentation | null {
    const cached = this.cache.get(presentationId);
    if (!cached) {
      return null;
    }

    // Check if expired
    const age = Date.now() - cached.timestamp;
    if (age > this.ttl) {
      this.cache.delete(presentationId);
      return null;
    }

    return cached;
  }

  /**
   * Set cached presentation data
   */
  set(
    presentationId: string,
    dimensions: SlideDimensions,
    layouts: Array<{ objectId: string; name?: string }> = [],
    masters: Array<{ objectId: string; name?: string }> = []
  ): void {
    const cachedData: CachedPresentation = {
      dimensions: dimensions,
      layouts,
      masters,
      timestamp: Date.now(),
    };
    this.cache.set(presentationId, cachedData);
  }

  /**
   * Invalidate cache for a presentation
   */
  invalidate(presentationId: string): void {
    this.cache.delete(presentationId);
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    entries: Array<{ id: string; age: number }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([id, data]) => ({
      id,
      age: Date.now() - data.timestamp,
    }));

    return {
      size: this.cache.size,
      entries,
    };
  }
}

// Singleton instance
const presentationCache = new PresentationCache();

/**
 * Get cached slide dimensions or fetch and cache
 */
export async function getCachedSlideSize(
  slides: slides_v1.Slides,
  presentationId: string
): Promise<SlideDimensions> {
  // Check cache first
  const cached = presentationCache.get(presentationId);
  if (cached) {
    return cached.dimensions;
  }

  // Fetch from API
  try {
    const presentation = await slides.presentations.get({
      presentationId,
    });
    const pageSize = presentation.data.pageSize;

    let dimensions: SlideDimensions;
    if (pageSize?.width?.magnitude && pageSize?.height?.magnitude) {
      // Convert EMU to points
      const EMU_PER_POINT = 12700;
      dimensions = {
        width: pageSize.width.magnitude / EMU_PER_POINT,
        height: pageSize.height.magnitude / EMU_PER_POINT,
      };
    } else {
      // Default dimensions
      dimensions = {
        width: 720,
        height: 405,
      };
    }

    // Cache the result
    presentationCache.set(presentationId, dimensions);
    return dimensions;
  } catch (error) {
    logger.warn(
      `⚠️  Failed to fetch slide size for ${presentationId}, using defaults: ${(error as Error).message}`
    );
    // Return defaults
    const dimensions = { width: 720, height: 405 };
    presentationCache.set(presentationId, dimensions);
    return dimensions;
  }
}

/**
 * Get cached layouts or fetch and cache
 */
export async function getCachedLayouts(
  slides: slides_v1.Slides,
  presentationId: string
): Promise<Array<{ objectId: string; name?: string }>> {
  const cached = presentationCache.get(presentationId);
  if (cached && cached.layouts.length > 0) {
    return cached.layouts;
  }

  try {
    const presentation = await slides.presentations.get({
      presentationId,
    });

    const layouts =
      presentation.data.layouts?.map((layout) => {
        const name = layout.layoutProperties?.name;
        return {
          objectId: layout.objectId || "",
          name: name === null || name === undefined ? undefined : name,
        };
      }) || [];

    // Update cache
    const dimensions: SlideDimensions = cached?.dimensions || {
      width: 720,
      height: 405,
    };
    presentationCache.set(
      presentationId,
      dimensions,
      layouts,
      cached?.masters || []
    );

    return layouts;
  } catch (error) {
    logger.warn(
      `⚠️  Failed to fetch layouts for ${presentationId}: ${(error as Error).message}`
    );
    return [];
  }
}

/**
 * Invalidate cache for a presentation
 * Call this after mutations (create/delete/update operations)
 */
export function invalidatePresentationCache(presentationId: string): void {
  presentationCache.invalidate(presentationId);
}

/**
 * Clear all cached data
 */
export function clearCache(): void {
  presentationCache.clear();
}

/**
 * Get cache statistics (for debugging)
 */
export function getCacheStats() {
  return presentationCache.getStats();
}
