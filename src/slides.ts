/**
 * Google Slides API Client Manager
 * Manages Google Slides API client and provides utility functions
 */

import dotenv from "dotenv";
import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import { getOAuth2Client, ensureValidToken } from "./auth";
import { slides_v1 } from "googleapis";
import { logger } from "./utils/logger";
import { GOOGLE_SLIDES_SCOPES } from "./auth/scopes";

// Load environment variables
dotenv.config();

let slidesClient: slides_v1.Slides | null = null;
let authMethod: "oauth2" | "adc" = "oauth2";

/**
 * Initialize Google Slides API client
 * Supports both OAuth2 and Application Default Credentials (ADC)
 */
export async function initializeSlidesClient(): Promise<void> {
  try {
    let auth: any = null;

    // Try OAuth2 first if credentials are available
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (clientId && clientSecret) {
      try {
        logger.info("🔐 Attempting OAuth2 authentication...");
        // Ensure we have valid tokens
        await ensureValidToken();

        // Get OAuth2 client
        auth = getOAuth2Client();
        authMethod = "oauth2";
        logger.success("✅ Using OAuth2 authentication");
      } catch (oauthError) {
        logger.warn(
          `⚠️  OAuth2 authentication failed: ${(oauthError as Error).message}`
        );
        logger.info("🔄 Falling back to Application Default Credentials...");
      }
    }

    // Fall back to Application Default Credentials (ADC)
    if (!auth) {
      try {
        logger.info("🔐 Attempting Application Default Credentials (ADC)...");
        logger.info(
          "💡 ADC checks: GOOGLE_APPLICATION_CREDENTIALS, gcloud auth, metadata service"
        );

        // Use GoogleAuth for ADC - automatically checks:
        // 1. GOOGLE_APPLICATION_CREDENTIALS env var
        // 2. gcloud auth application-default login credentials
        // 3. GCE/Cloud Run metadata service
        const googleAuth = new GoogleAuth({
          scopes: [...GOOGLE_SLIDES_SCOPES],
        });

        auth = await googleAuth.getClient();
        authMethod = "adc";

        // Get project info if available
        const projectId = await googleAuth.getProjectId().catch(() => null);
        if (projectId) {
          logger.success(
            `✅ Using Application Default Credentials for project: ${projectId}`
          );
        } else {
          logger.success("✅ Using Application Default Credentials");
        }
      } catch (adcError) {
        logger.error(
          `❌ Application Default Credentials failed: ${(adcError as Error).message}`
        );
        throw new Error(
          "All authentication methods failed. Please configure either:\n" +
            "1. OAuth2: Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, then run 'google-slides-mcp auth'\n" +
            "2. ADC: Run 'gcloud auth application-default login --scopes=https://www.googleapis.com/auth/presentations,https://www.googleapis.com/auth/drive.file'"
        );
      }
    }

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
    // Refresh token if needed (only for OAuth2, ADC handles refresh automatically)
    if (authMethod === "oauth2") {
      await ensureValidToken();
    }
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
