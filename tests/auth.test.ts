/**
 * Auth Module Unit Tests
 * Tests for OAuth2 client, token management, and authentication flow
 */

// Mock fs before any other imports
jest.mock("fs");

// Mock google-auth-library (the actual package used)
jest.mock("google-auth-library", () => {
  const actual = jest.requireActual("google-auth-library");
  return {
    ...actual,
    OAuth2Client: jest.fn(),
  };
});

// Mock open package
jest.mock("open", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined),
}));

import * as path from "path";
import * as os from "os";
import { OAuth2Client, Credentials } from "google-auth-library";
import { GOOGLE_SLIDES_SCOPES } from "../src/auth/scopes";
import {
  TEST_CLIENT_ID,
  TEST_CLIENT_SECRET,
  TEST_REDIRECT_URI,
  TEST_AUTH_CODE,
  TEST_ACCESS_TOKEN,
  TEST_REFRESH_TOKEN,
  createTestCredentials,
  createExpiredCredentials,
} from "./helpers/test-data";
import { mockTokenFileSystem } from "./helpers/mock-oauth";
import { mockConsoleError, restoreConsoleError } from "./helpers/setup-mocks";

describe("Auth Module", () => {
  let consoleErrorSpy: any;
  let fileSystemMocks: any;
  let mockOAuth2Client: any;
  let authModule: any;

  beforeEach(() => {
    // Setup environment variables FIRST
    process.env.GOOGLE_CLIENT_ID = TEST_CLIENT_ID;
    process.env.GOOGLE_CLIENT_SECRET = TEST_CLIENT_SECRET;
    process.env.GOOGLE_REDIRECT_URI = TEST_REDIRECT_URI;

    // Mock console.error
    consoleErrorSpy = mockConsoleError();

    // Reset modules to clear the singleton - this will force re-import
    jest.resetModules();

    // Mock file system AFTER reset
    fileSystemMocks = mockTokenFileSystem();

    // Create mock OAuth2 client AFTER resetting modules
    mockOAuth2Client = {
      setCredentials: jest.fn(),
      credentials: {},
      generateAuthUrl: jest
        .fn()
        .mockReturnValue("https://accounts.google.com/o/oauth2/v2/auth"),
      getToken: jest.fn(),
      refreshAccessToken: jest.fn(),
    } as unknown as jest.Mocked<OAuth2Client>;

    // Setup the mock constructor AFTER resetting modules and creating mock client
    const { OAuth2Client } = require("google-auth-library");
    OAuth2Client.mockClear();
    OAuth2Client.mockImplementation(() => mockOAuth2Client);

    // Import auth module after mocks are set up
    authModule = require("../src/auth/oauth2");
  });

  afterEach(() => {
    restoreConsoleError(consoleErrorSpy);
    jest.clearAllMocks();
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_REDIRECT_URI;
  });

  describe("getOAuth2Client", () => {
    test("should create OAuth2 client with environment variables", () => {
      const client = authModule.getOAuth2Client();

      expect(client).toBeDefined();
      expect(client).toHaveProperty("setCredentials");
      expect(client).toHaveProperty("credentials");
    });

    test("should return same client instance on subsequent calls", () => {
      const client1 = authModule.getOAuth2Client();
      const client2 = authModule.getOAuth2Client();

      expect(client1).toBe(client2);
    });

    test("should throw error if client ID is missing", () => {
      delete process.env.GOOGLE_CLIENT_ID;
      authModule = require("../src/auth/oauth2");

      expect(() => authModule.getOAuth2Client()).toThrow(
        "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required"
      );
    });

    test("should throw error if client secret is missing", () => {
      delete process.env.GOOGLE_CLIENT_SECRET;
      authModule = require("../src/auth/oauth2");

      expect(() => authModule.getOAuth2Client()).toThrow(
        "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required"
      );
    });

    test("should use default redirect URI if not provided", () => {
      delete process.env.GOOGLE_REDIRECT_URI;

      // Reset modules and re-setup mock before requiring
      jest.resetModules();
      const { OAuth2Client } = require("google-auth-library");
      OAuth2Client.mockClear();
      OAuth2Client.mockImplementation(() => mockOAuth2Client);

      authModule = require("../src/auth/oauth2");
      authModule.getOAuth2Client();

      expect(OAuth2Client).toHaveBeenCalledWith({
        clientId: TEST_CLIENT_ID,
        clientSecret: TEST_CLIENT_SECRET,
        redirectUri: "http://localhost:3000/oauth2callback",
      });
    });

    test("should load existing tokens from disk if available", () => {
      const tokens = createTestCredentials();

      // Reset to ensure fresh module load with mocked file system
      jest.resetModules();

      // Re-setup file system mocks after reset
      const fs = require("fs");
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(tokens));

      // Re-setup OAuth2Client mock
      const { OAuth2Client } = require("google-auth-library");
      OAuth2Client.mockClear();
      OAuth2Client.mockImplementation(() => mockOAuth2Client);

      authModule = require("../src/auth/oauth2");
      const client = authModule.getOAuth2Client();

      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.readFileSync).toHaveBeenCalled();
      expect(client.setCredentials).toHaveBeenCalledWith(tokens);
    });

    test("should handle missing token file gracefully", () => {
      fileSystemMocks.existsSync.mockReturnValue(false);

      expect(() => authModule.getOAuth2Client()).not.toThrow();
    });

    test("should handle invalid token file gracefully", () => {
      fileSystemMocks.existsSync.mockReturnValue(true);
      fileSystemMocks.readFileSync.mockReturnValue("invalid json");

      expect(() => authModule.getOAuth2Client()).not.toThrow();
    });
  });

  describe("saveTokens", () => {
    test("should save tokens to disk", () => {
      const tokens = createTestCredentials();
      const tokensPath = path.join(
        os.homedir(),
        ".google-slides-mcp",
        "tokens.json"
      );
      fileSystemMocks.existsSync.mockReturnValue(false); // Directory doesn't exist

      authModule.saveTokens(tokens);

      expect(fileSystemMocks.mkdirSync).toHaveBeenCalledWith(
        path.join(os.homedir(), ".google-slides-mcp"),
        { recursive: true }
      );
      expect(fileSystemMocks.writeFileSync).toHaveBeenCalledWith(
        tokensPath,
        JSON.stringify(tokens, null, 2)
      );
    });

    test("should create directory if it doesn't exist", () => {
      const tokens = createTestCredentials();
      fileSystemMocks.existsSync.mockReturnValue(false);

      authModule.saveTokens(tokens);

      expect(fileSystemMocks.mkdirSync).toHaveBeenCalled();
    });

    test("should throw error if file write fails", () => {
      const tokens = createTestCredentials();
      fileSystemMocks.existsSync.mockReturnValue(false);
      fileSystemMocks.writeFileSync.mockImplementation(() => {
        throw new Error("Write failed");
      });

      expect(() => authModule.saveTokens(tokens)).toThrow("Write failed");
    });
  });

  describe("getAuthUrl", () => {
    test("should generate authorization URL with correct scopes", () => {
      const expectedUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${TEST_CLIENT_ID}&redirect_uri=${encodeURIComponent(TEST_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(GOOGLE_SLIDES_SCOPES.join(" "))}&access_type=offline&prompt=consent`;
      mockOAuth2Client.generateAuthUrl = jest.fn().mockReturnValue(expectedUrl);

      authModule.getOAuth2Client(); // Initialize client
      const url = authModule.getAuthUrl();

      expect(mockOAuth2Client.generateAuthUrl).toHaveBeenCalledWith({
        access_type: "offline",
        scope: GOOGLE_SLIDES_SCOPES,
        prompt: "consent",
      });
      expect(url).toBe(expectedUrl);
    });
  });

  describe("exchangeCodeForTokens", () => {
    test("should exchange authorization code for tokens", async () => {
      const tokens = createTestCredentials();
      mockOAuth2Client.getToken = jest.fn().mockResolvedValue({ tokens });

      authModule.getOAuth2Client(); // Initialize client
      const result = await authModule.exchangeCodeForTokens(TEST_AUTH_CODE);

      expect(mockOAuth2Client.getToken).toHaveBeenCalledWith(TEST_AUTH_CODE);
      expect(mockOAuth2Client.setCredentials).toHaveBeenCalledWith(tokens);
      expect(fileSystemMocks.writeFileSync).toHaveBeenCalled();
      expect(result).toEqual(tokens);
    });

    test("should save tokens after exchange", async () => {
      const tokens = createTestCredentials();
      mockOAuth2Client.getToken = jest.fn().mockResolvedValue({ tokens });

      authModule.getOAuth2Client(); // Initialize client
      await authModule.exchangeCodeForTokens(TEST_AUTH_CODE);

      expect(fileSystemMocks.writeFileSync).toHaveBeenCalled();
    });
  });

  describe("hasValidTokens", () => {
    test("should return true if access token exists", () => {
      const client = authModule.getOAuth2Client();
      client.credentials = { access_token: TEST_ACCESS_TOKEN };

      expect(authModule.hasValidTokens()).toBe(true);
    });

    test("should return true if refresh token exists", () => {
      const client = authModule.getOAuth2Client();
      client.credentials = { refresh_token: TEST_REFRESH_TOKEN };

      expect(authModule.hasValidTokens()).toBe(true);
    });

    test("should return false if no tokens exist", () => {
      const client = authModule.getOAuth2Client();
      client.credentials = {};

      expect(authModule.hasValidTokens()).toBe(false);
    });

    test("should return false if client not initialized", () => {
      // Reset the module to clear singleton
      jest.resetModules();
      const freshAuth = require("../src/auth/oauth2");

      expect(freshAuth.hasValidTokens()).toBe(false);
    });
  });

  describe("ensureValidToken", () => {
    test("should refresh token if expired", async () => {
      const expiredTokens = createExpiredCredentials();
      const newTokens = createTestCredentials();

      const client = authModule.getOAuth2Client(); // Initialize client
      client.credentials = expiredTokens; // Set expired tokens with refresh_token
      mockOAuth2Client.refreshAccessToken = jest.fn().mockResolvedValue({
        credentials: newTokens,
      });

      await authModule.ensureValidToken();

      expect(mockOAuth2Client.refreshAccessToken).toHaveBeenCalled();
      expect(mockOAuth2Client.setCredentials).toHaveBeenCalledWith(newTokens);
      expect(fileSystemMocks.writeFileSync).toHaveBeenCalled();
    });

    test("should refresh token if expiring soon (within 5 minutes)", async () => {
      const expiringSoonTokens: Credentials = {
        ...createTestCredentials(),
        expiry_date: Date.now() + 4 * 60 * 1000, // 4 minutes from now
      };
      const newTokens = createTestCredentials();

      const client = authModule.getOAuth2Client(); // Initialize client
      client.credentials = expiringSoonTokens; // Set expiring tokens
      mockOAuth2Client.refreshAccessToken = jest.fn().mockResolvedValue({
        credentials: newTokens,
      });

      await authModule.ensureValidToken();

      expect(mockOAuth2Client.refreshAccessToken).toHaveBeenCalled();
    });

    test("should not refresh token if still valid", async () => {
      const validTokens: Credentials = {
        ...createTestCredentials(),
        expiry_date: Date.now() + 10 * 60 * 1000, // 10 minutes from now
      };
      mockOAuth2Client.credentials = validTokens;

      const client = authModule.getOAuth2Client(); // Initialize client
      client.credentials = validTokens; // Set valid tokens
      await authModule.ensureValidToken();

      expect(mockOAuth2Client.refreshAccessToken).not.toHaveBeenCalled();
    });

    test("should throw error if no refresh token available", async () => {
      const client = authModule.getOAuth2Client(); // Initialize client
      client.credentials = { access_token: TEST_ACCESS_TOKEN }; // No refresh_token

      await expect(authModule.ensureValidToken()).rejects.toThrow(
        'No refresh token available. Please run "google-slides-mcp auth" to authenticate.'
      );
    });

    test("should throw error if token refresh fails", async () => {
      const expiredTokens = createExpiredCredentials();

      const client = authModule.getOAuth2Client(); // Initialize client
      client.credentials = expiredTokens; // Set expired tokens with refresh_token
      mockOAuth2Client.refreshAccessToken = jest
        .fn()
        .mockRejectedValue(new Error("Refresh failed"));

      await expect(authModule.ensureValidToken()).rejects.toThrow(
        'Token refresh failed. Please run "google-slides-mcp auth" to re-authenticate.'
      );
    });
  });

  describe("getTokensPath", () => {
    test("should return correct tokens file path", () => {
      const expectedPath = path.join(
        os.homedir(),
        ".google-slides-mcp",
        "tokens.json"
      );
      const tokensPath = authModule.getTokensPath();

      expect(tokensPath).toBe(expectedPath);
    });
  });

  describe("clearTokens", () => {
    test("should delete tokens file if it exists", () => {
      fileSystemMocks.existsSync.mockReturnValue(true);
      authModule.getOAuth2Client(); // Initialize client first

      authModule.clearTokens();

      expect(fileSystemMocks.existsSync).toHaveBeenCalled();
      expect(fileSystemMocks.unlinkSync).toHaveBeenCalled();
      expect(mockOAuth2Client.setCredentials).toHaveBeenCalledWith({});
    });

    test("should clear client credentials even if file doesn't exist", () => {
      fileSystemMocks.existsSync.mockReturnValue(false);
      authModule.getOAuth2Client(); // Initialize client

      authModule.clearTokens();

      expect(mockOAuth2Client.setCredentials).toHaveBeenCalledWith({});
    });

    test("should handle file deletion errors gracefully", () => {
      fileSystemMocks.existsSync.mockReturnValue(true);
      fileSystemMocks.unlinkSync.mockImplementation(() => {
        throw new Error("Delete failed");
      });

      expect(() => authModule.clearTokens()).not.toThrow();
    });
  });

  describe("startAuthFlow", () => {
    test("should generate auth URL and open browser", async () => {
      const expectedUrl = "https://accounts.google.com/o/oauth2/v2/auth";
      mockOAuth2Client.generateAuthUrl = jest.fn().mockReturnValue(expectedUrl);
      const open = require("open").default;

      authModule.getOAuth2Client(); // Initialize client
      const url = await authModule.startAuthFlow();

      expect(mockOAuth2Client.generateAuthUrl).toHaveBeenCalled();
      expect(open).toHaveBeenCalledWith(expectedUrl);
      expect(url).toBe(expectedUrl);
    });

    test("should handle browser open failure gracefully", async () => {
      const expectedUrl = "https://accounts.google.com/o/oauth2/v2/auth";
      mockOAuth2Client.generateAuthUrl = jest.fn().mockReturnValue(expectedUrl);
      const open = require("open").default;
      open.mockRejectedValue(new Error("Browser failed"));

      authModule.getOAuth2Client(); // Initialize client

      const url = await authModule.startAuthFlow();
      expect(url).toBe(expectedUrl);
    });
  });
});
