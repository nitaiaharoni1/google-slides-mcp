/**
 * Google Slides API Client Manager
 * Manages Google Slides API client and provides utility functions
 */

import dotenv from "dotenv";
import { google } from "googleapis";
import { getOAuth2Client, ensureValidToken } from "./auth";
import { slides_v1 } from "googleapis";
import { logger } from "./utils/logger";

// Load environment variables
dotenv.config();

let slidesClient: slides_v1.Slides | null = null;

/**
 * Initialize Google Slides API client
 */
export async function initializeSlidesClient(): Promise<void> {
  try {
    // Ensure we have valid tokens
    await ensureValidToken();

    // Get OAuth2 client
    const auth = getOAuth2Client();

    // Create Slides API client
    slidesClient = google.slides({
      version: "v1",
      auth,
    });

    logger.success("✅ Google Slides API client initialized");
  } catch (error) {
    logger.error(
      `❌ Google Slides API initialization failed: ${(error as Error).message}`
    );
    throw error;
  }
}

/**
 * Get the current Slides API client instance
 */
export function getSlidesClient(): slides_v1.Slides {
  if (!slidesClient) {
    throw new Error(
      "Slides client not initialized. Call initializeSlidesClient() first."
    );
  }
  return slidesClient;
}

/**
 * Check if Slides client is initialized
 */
export function isSlidesClientInitialized(): boolean {
  return slidesClient !== null;
}

/**
 * Ensure Slides client is initialized (utility function for tools)
 */
export async function ensureSlidesClient(): Promise<slides_v1.Slides> {
  if (!slidesClient) {
    await initializeSlidesClient();
  } else {
    // Refresh token if needed
    await ensureValidToken();
  }
  return getSlidesClient();
}

/**
 * Reset the Slides client singleton (for testing only)
 * @internal
 */
export function __resetForTesting(): void {
  slidesClient = null;
}
