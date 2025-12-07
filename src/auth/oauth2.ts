/**
 * OAuth2 Client Setup and Token Management
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { OAuth2Client, Credentials } from "google-auth-library";
import { GOOGLE_SLIDES_SCOPES } from "./scopes";
import open from "open";
import { logger } from "../utils/logger";

const TOKENS_DIR = path.join(os.homedir(), ".google-slides-mcp");
const TOKENS_FILE = path.join(TOKENS_DIR, "tokens.json");

let oauth2Client: OAuth2Client | null = null;

/**
 * Get or create OAuth2 client
 */
export function getOAuth2Client(): OAuth2Client {
  if (!oauth2Client) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/oauth2callback";

    if (!clientId || !clientSecret) {
      throw new Error(
        "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required. " +
          "Get them from https://console.cloud.google.com/apis/credentials"
      );
    }

    oauth2Client = new OAuth2Client({
      clientId,
      clientSecret,
      redirectUri,
    });

    // Load existing tokens if available
    loadTokens();
  }

  return oauth2Client;
}

/**
 * Load tokens from disk
 */
function loadTokens(): void {
  if (!oauth2Client) return;

  try {
    if (fs.existsSync(TOKENS_FILE)) {
      const tokens = JSON.parse(
        fs.readFileSync(TOKENS_FILE, "utf8")
      ) as Credentials;
      oauth2Client.setCredentials(tokens);
      logger.success("✅ Loaded existing OAuth2 tokens");
    }
  } catch (error) {
    logger.warn(`⚠️  Could not load tokens: ${(error as Error).message}`);
  }
}

/**
 * Save tokens to disk
 */
export function saveTokens(tokens: Credentials): void {
  try {
    // Ensure directory exists
    if (!fs.existsSync(TOKENS_DIR)) {
      fs.mkdirSync(TOKENS_DIR, { recursive: true });
    }

    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
    logger.success("✅ Saved OAuth2 tokens");
  } catch (error) {
    logger.error(`❌ Failed to save tokens: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Generate authorization URL
 */
export function getAuthUrl(): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: [...GOOGLE_SLIDES_SCOPES],
    prompt: "consent", // Force consent screen to get refresh token
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string
): Promise<Credentials> {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  saveTokens(tokens);
  client.setCredentials(tokens);
  return tokens;
}

/**
 * Check if tokens exist and are valid
 */
export function hasValidTokens(): boolean {
  if (!oauth2Client) {
    return false;
  }

  const credentials = oauth2Client.credentials;
  return !!(credentials.access_token || credentials.refresh_token);
}

/**
 * Refresh access token if needed
 */
export async function ensureValidToken(): Promise<void> {
  const client = getOAuth2Client();

  // If no refresh token in client, try to reload from disk
  if (!client.credentials.refresh_token) {
    loadTokens();
  }

  if (!client.credentials.refresh_token) {
    throw new Error(
      'No refresh token available. Please run "google-slides-mcp auth" to authenticate.'
    );
  }

  // Check if token is expired or will expire soon (within 5 minutes)
  const expiryDate = client.credentials.expiry_date;
  if (expiryDate && expiryDate <= Date.now() + 5 * 60 * 1000) {
    try {
      const { credentials } = await client.refreshAccessToken();
      client.setCredentials(credentials);
      saveTokens(credentials);
      logger.success("✅ Refreshed OAuth2 access token");
    } catch (error) {
      logger.error(`❌ Failed to refresh token: ${(error as Error).message}`);
      throw new Error(
        'Token refresh failed. Please run "google-slides-mcp auth" to re-authenticate.'
      );
    }
  }
}

/**
 * Get tokens file path
 */
export function getTokensPath(): string {
  return TOKENS_FILE;
}

/**
 * Clear stored tokens
 */
export function clearTokens(): void {
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      fs.unlinkSync(TOKENS_FILE);
      logger.success("✅ Cleared OAuth2 tokens");
    }
    if (oauth2Client) {
      oauth2Client.setCredentials({});
    }
  } catch (error) {
    logger.warn(`⚠️  Could not clear tokens: ${(error as Error).message}`);
  }
}

/**
 * Start OAuth2 flow - opens browser and returns auth URL
 */
export async function startAuthFlow(): Promise<string> {
  const authUrl = getAuthUrl();
  logger.info("🌐 Opening browser for authentication...");
  logger.info(`📋 If browser doesn't open, visit: ${authUrl}`);

  try {
    await open(authUrl);
  } catch {
    logger.warn("⚠️  Could not open browser automatically");
  }

  return authUrl;
}
