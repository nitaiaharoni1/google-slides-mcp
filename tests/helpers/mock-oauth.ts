/**
 * OAuth2 mocking utilities for tests
 */

import { OAuth2Client, Credentials } from "google-auth-library";

// Type definitions for OAuth2Client methods (not exported from google-auth-library)
type GetTokenResponse = { tokens: Credentials; res: any };
type GetTokenOptions = { code: string; [key: string]: any };
type GetTokenCallback = (
  err: Error | null,
  tokens?: Credentials | null,
  res?: any
) => void;
import * as path from "path";
import * as os from "os";
import {
  TEST_CLIENT_ID,
  TEST_CLIENT_SECRET,
  TEST_REDIRECT_URI,
  createTestCredentials,
} from "./test-data";

const _TOKENS_DIR = path.join(os.homedir(), ".google-slides-mcp");

/**
 * Mock OAuth2 client for testing
 */
export class MockOAuth2Client extends OAuth2Client {
  private mockCredentials: Credentials | null = null;
  private mockTokenRefresh: jest.Mock;
  private mockGetToken: jest.Mock;

  constructor() {
    super({
      clientId: TEST_CLIENT_ID,
      clientSecret: TEST_CLIENT_SECRET,
      redirectUri: TEST_REDIRECT_URI,
    });

    this.mockTokenRefresh = jest.fn();
    this.mockGetToken = jest.fn();
  }

  override async refreshAccessToken(): Promise<{
    credentials: Credentials;
    res: any;
  }> {
    const credentials = this.mockTokenRefresh() || createTestCredentials();
    this.setCredentials(credentials);
    return { credentials, res: null };
  }

  // Implement all getToken overloads
  override async getToken(code: string): Promise<GetTokenResponse>;
  override async getToken(options: GetTokenOptions): Promise<GetTokenResponse>;
  override getToken(code: string, callback: GetTokenCallback): void;
  override getToken(options: GetTokenOptions, callback: GetTokenCallback): void;
  override getToken(
    codeOrOptions: string | GetTokenOptions,
    callback?: GetTokenCallback
  ): any {
    const code =
      typeof codeOrOptions === "string"
        ? codeOrOptions
        : (codeOrOptions as any).code;
    const tokens = this.mockGetToken(code) || createTestCredentials();
    this.setCredentials(tokens);
    const result: GetTokenResponse = { tokens, res: null as any };

    if (callback) {
      // Callback version - call synchronously
      callback(null, result.tokens, result.res);
      return;
    }
    // Promise version
    return Promise.resolve(result);
  }

  override generateAuthUrl(options?: any): string {
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${TEST_CLIENT_ID}&redirect_uri=${encodeURIComponent(TEST_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(options?.scope || "")}&access_type=offline&prompt=consent`;
  }

  setMockCredentials(credentials: Credentials | null): void {
    this.mockCredentials = credentials;
    if (credentials) {
      this.setCredentials(credentials);
    }
  }

  setMockTokenRefresh(fn: jest.Mock): void {
    this.mockTokenRefresh = fn;
  }

  setMockGetToken(fn: jest.Mock): void {
    this.mockGetToken = fn;
  }
}

/**
 * Setup OAuth2 mocks
 */
export function setupOAuth2Mocks(): MockOAuth2Client {
  const mockClient = new MockOAuth2Client();
  return mockClient;
}

/**
 * Mock file system operations for token storage
 * Uses jest.mock('fs') for clean, reliable mocking
 */
export function mockTokenFileSystem(): {
  readFileSync: jest.Mock;
  writeFileSync: jest.Mock;
  existsSync: jest.Mock;
  mkdirSync: jest.Mock;
  unlinkSync: jest.Mock;
} {
  const fs = require("fs");

  // Reset all mocks to clear previous test state
  jest.clearAllMocks();

  // Set up default implementations
  fs.existsSync.mockReturnValue(false);
  fs.readFileSync.mockImplementation(() => {
    throw new Error("File not found");
  });
  fs.writeFileSync.mockImplementation(() => {});
  fs.mkdirSync.mockImplementation(() => undefined);
  fs.unlinkSync.mockImplementation(() => {});

  return {
    readFileSync: fs.readFileSync,
    writeFileSync: fs.writeFileSync,
    existsSync: fs.existsSync,
    mkdirSync: fs.mkdirSync,
    unlinkSync: fs.unlinkSync,
  };
}
