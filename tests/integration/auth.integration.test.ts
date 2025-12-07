/**
 * Auth Integration Tests
 * Tests for full OAuth2 flow and token management
 */

// Mock fs before any other imports
jest.mock("fs");
import {
  TEST_CLIENT_ID,
  TEST_CLIENT_SECRET,
  TEST_AUTH_CODE,
  createTestCredentials,
  createExpiredCredentials,
} from "../helpers/test-data";
import { mockTokenFileSystem } from "../helpers/mock-oauth";
import { mockConsoleError, restoreConsoleError } from "../helpers/setup-mocks";

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

describe("Auth Integration", () => {
  let consoleErrorSpy: any;
  let fileSystemMocks: any;
  let mockOAuth2Client: any;

  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = TEST_CLIENT_ID;
    process.env.GOOGLE_CLIENT_SECRET = TEST_CLIENT_SECRET;
    consoleErrorSpy = mockConsoleError();

    // Reset modules first
    jest.resetModules();

    // Setup file system mocks AFTER reset
    fileSystemMocks = mockTokenFileSystem();

    // Create mock OAuth2 client with all required methods
    mockOAuth2Client = {
      setCredentials: jest.fn(),
      credentials: {},
      generateAuthUrl: jest
        .fn()
        .mockReturnValue(
          "https://accounts.google.com/o/oauth2/v2/auth?code=test"
        ),
      getToken: jest.fn(),
      refreshAccessToken: jest.fn(),
    };

    const { OAuth2Client } = require("google-auth-library");
    OAuth2Client.mockImplementation(() => mockOAuth2Client);
  });

  afterEach(() => {
    restoreConsoleError(consoleErrorSpy);
    jest.clearAllMocks();
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    jest.resetModules();
  });

  describe("Full OAuth2 Flow", () => {
    test("should complete full authentication flow", async () => {
      // Step 1: Get auth URL
      mockOAuth2Client.generateAuthUrl = jest
        .fn()
        .mockReturnValue(
          "https://accounts.google.com/o/oauth2/v2/auth?code=test"
        );

      // Import functions from the current module (not reset)
      const {
        getOAuth2Client,
        getAuthUrl,
        exchangeCodeForTokens,
      } = require("../../src/auth/oauth2");

      getOAuth2Client();
      const authUrl = getAuthUrl();

      expect(authUrl).toContain("accounts.google.com");

      // Step 2: Exchange code for tokens
      const tokens = createTestCredentials();
      mockOAuth2Client.getToken = jest.fn().mockResolvedValue({ tokens });
      fileSystemMocks.existsSync.mockReturnValue(false);

      const result = await exchangeCodeForTokens(TEST_AUTH_CODE);

      expect(mockOAuth2Client.getToken).toHaveBeenCalledWith(TEST_AUTH_CODE);
      expect(result).toEqual(tokens);
      expect(fileSystemMocks.writeFileSync).toHaveBeenCalled();

      // Step 3: Verify tokens are saved
      jest.resetModules();
      // Re-setup file system mocks after reset
      const fs = require("fs");
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(tokens));

      // Re-setup OAuth2Client mock
      const { OAuth2Client } = require("google-auth-library");
      OAuth2Client.mockImplementation(() => mockOAuth2Client);

      const {
        getOAuth2Client: getClientFresh,
      } = require("../../src/auth/oauth2");
      getClientFresh();

      expect(fs.readFileSync).toHaveBeenCalled();
    });

    test("should handle token refresh flow", async () => {
      const expiredTokens = createExpiredCredentials();
      const newTokens = createTestCredentials();

      // Import from current module
      const {
        getOAuth2Client,
        ensureValidToken,
      } = require("../../src/auth/oauth2");

      const client = getOAuth2Client();
      client.credentials = expiredTokens; // Set expired tokens with refresh_token

      mockOAuth2Client.refreshAccessToken = jest.fn().mockResolvedValue({
        credentials: newTokens,
      });

      await ensureValidToken();

      expect(mockOAuth2Client.refreshAccessToken).toHaveBeenCalled();
      expect(mockOAuth2Client.setCredentials).toHaveBeenCalledWith(newTokens);
      expect(fileSystemMocks.writeFileSync).toHaveBeenCalled();
    });

    test("should persist tokens across sessions", async () => {
      const tokens = createTestCredentials();

      // Reset and re-setup mocks to simulate new session
      jest.resetModules();
      const fs = require("fs");
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(tokens));

      // Create a fresh mock client that will track setCredentials calls
      const freshMockClient = {
        setCredentials: jest.fn((creds) => {
          freshMockClient.credentials = creds;
        }),
        credentials: {},
        generateAuthUrl: jest
          .fn()
          .mockReturnValue(
            "https://accounts.google.com/o/oauth2/v2/auth?code=test"
          ),
        getToken: jest.fn(),
        refreshAccessToken: jest.fn(),
      };

      const { OAuth2Client } = require("google-auth-library");
      OAuth2Client.mockImplementation(() => freshMockClient);

      const {
        getOAuth2Client: getClientFresh,
        hasValidTokens: hasValidTokensFresh,
      } = require("../../src/auth/oauth2");

      getClientFresh();
      const isValid = hasValidTokensFresh();

      expect(isValid).toBe(true);
      expect(freshMockClient.setCredentials).toHaveBeenCalledWith(tokens);
    });
  });

  describe("Token Management", () => {
    test("should clear tokens and reset state", () => {
      fileSystemMocks.existsSync.mockReturnValue(true);

      // Import from current module
      const { getOAuth2Client, clearTokens } = require("../../src/auth/oauth2");

      getOAuth2Client(); // Initialize client first
      clearTokens();

      expect(fileSystemMocks.unlinkSync).toHaveBeenCalled();
      expect(mockOAuth2Client.setCredentials).toHaveBeenCalledWith({});
    });
  });
});
