/**
 * Slides Client Unit Tests
 * Tests for Google Slides API client initialization and management
 */

import { slides_v1 } from "googleapis";
import {
  getSlidesClient,
  isSlidesClientInitialized,
  ensureSlidesClient,
  __resetForTesting,
} from "../src/slides";
import { ensureValidToken, getOAuth2Client } from "../src/auth";
import { createMockSlidesClient } from "./helpers/mock-api";
import { createTestCredentials } from "./helpers/test-data";
import { mockConsoleError, restoreConsoleError } from "./helpers/setup-mocks";

// Mock auth module
jest.mock("../src/auth", () => ({
  ensureValidToken: jest.fn(),
  getOAuth2Client: jest.fn(),
}));

// Mock googleapis
jest.mock("googleapis", () => ({
  google: {
    slides: jest.fn(),
  },
}));

describe("Slides Client", () => {
  let consoleErrorSpy: jest.SpyInstance;
  let mockSlidesClient: slides_v1.Slides;

  beforeEach(() => {
    consoleErrorSpy = mockConsoleError();
    mockSlidesClient = createMockSlidesClient();

    // Setup mocks before requiring modules
    (getOAuth2Client as jest.Mock).mockReturnValue({
      credentials: createTestCredentials(),
    });
    (ensureValidToken as jest.Mock).mockResolvedValue(undefined);
    const { google } = require("googleapis");
    google.slides.mockReturnValue(mockSlidesClient);
  });

  afterEach(() => {
    restoreConsoleError(consoleErrorSpy);
    jest.clearAllMocks();
    // Reset singleton state for clean test isolation
    __resetForTesting();
  });

  describe("initializeSlidesClient", () => {
    test("should initialize client with valid tokens", async () => {
      const mockAuth = {
        credentials: createTestCredentials(),
      };
      (getOAuth2Client as jest.Mock).mockReturnValue(mockAuth);
      (ensureValidToken as jest.Mock).mockResolvedValue(undefined);
      const { google } = require("googleapis");
      google.slides.mockReturnValue(mockSlidesClient);

      const { initializeSlidesClient: initClient } = require("../src/slides");
      await initClient();

      expect(ensureValidToken).toHaveBeenCalled();
      expect(getOAuth2Client).toHaveBeenCalled();
      expect(google.slides).toHaveBeenCalledWith({
        version: "v1",
        auth: mockAuth,
      });
    });

    test("should throw error if token validation fails", async () => {
      (ensureValidToken as jest.Mock).mockRejectedValue(
        new Error("Token validation failed")
      );

      const { initializeSlidesClient: initClient } = require("../src/slides");

      await expect(initClient()).rejects.toThrow("Token validation failed");
    });

    test("should handle initialization errors", async () => {
      (ensureValidToken as jest.Mock).mockResolvedValue(undefined);
      (getOAuth2Client as jest.Mock).mockReturnValue({});
      const { google } = require("googleapis");
      google.slides.mockImplementation(() => {
        throw new Error("Initialization failed");
      });

      const { initializeSlidesClient: initClient } = require("../src/slides");

      await expect(initClient()).rejects.toThrow("Initialization failed");
    });
  });

  describe("getSlidesClient", () => {
    test("should return initialized client", async () => {
      const mockAuth = {
        credentials: createTestCredentials(),
      };
      (getOAuth2Client as jest.Mock).mockReturnValue(mockAuth);
      (ensureValidToken as jest.Mock).mockResolvedValue(undefined);
      const { google } = require("googleapis");
      google.slides.mockReturnValue(mockSlidesClient);

      const {
        initializeSlidesClient: initClient,
        getSlidesClient: getClient,
      } = require("../src/slides");

      await initClient();
      const client = getClient();

      expect(client).toBe(mockSlidesClient);
    });

    test("should throw error if client not initialized", () => {
      // Ensure clean state
      __resetForTesting();

      expect(() => getSlidesClient()).toThrow(
        "Slides client not initialized. Call initializeSlidesClient() first."
      );
    });
  });

  describe("isSlidesClientInitialized", () => {
    test("should return false if client not initialized", () => {
      // Ensure clean state
      __resetForTesting();

      expect(isSlidesClientInitialized()).toBe(false);
    });

    test("should return true if client initialized", async () => {
      const mockAuth = {
        credentials: createTestCredentials(),
      };
      (getOAuth2Client as jest.Mock).mockReturnValue(mockAuth);
      (ensureValidToken as jest.Mock).mockResolvedValue(undefined);
      const { google } = require("googleapis");
      google.slides.mockReturnValue(mockSlidesClient);

      const {
        initializeSlidesClient: initClient,
        isSlidesClientInitialized: isInitialized,
      } = require("../src/slides");

      await initClient();

      expect(isInitialized()).toBe(true);
    });
  });

  describe("ensureSlidesClient", () => {
    test("should initialize client if not initialized", async () => {
      // Ensure clean state
      __resetForTesting();

      const mockAuth = {
        credentials: createTestCredentials(),
      };
      (getOAuth2Client as jest.Mock).mockReturnValue(mockAuth);
      (ensureValidToken as jest.Mock).mockResolvedValue(undefined);
      const { google } = require("googleapis");
      google.slides.mockReturnValue(mockSlidesClient);

      const client = await ensureSlidesClient();

      expect(ensureValidToken).toHaveBeenCalled();
      expect(client).toBe(mockSlidesClient);
    });

    test("should refresh token if client already initialized", async () => {
      const mockAuth = {
        credentials: createTestCredentials(),
      };
      (getOAuth2Client as jest.Mock).mockReturnValue(mockAuth);
      (ensureValidToken as jest.Mock).mockResolvedValue(undefined);
      const { google } = require("googleapis");
      google.slides.mockReturnValue(mockSlidesClient);

      const {
        initializeSlidesClient: initClient,
        ensureSlidesClient: ensureClient,
      } = require("../src/slides");

      await initClient();
      // Clear the mock call history
      (ensureValidToken as jest.Mock).mockClear();

      await ensureClient();

      // ensureValidToken should be called when client is already initialized
      expect(ensureValidToken).toHaveBeenCalled();
    });

    test("should return existing client if already initialized", async () => {
      const mockAuth = {
        credentials: createTestCredentials(),
      };
      (getOAuth2Client as jest.Mock).mockReturnValue(mockAuth);
      (ensureValidToken as jest.Mock).mockResolvedValue(undefined);
      const { google } = require("googleapis");
      google.slides.mockReturnValue(mockSlidesClient);

      const {
        initializeSlidesClient: initClient,
        ensureSlidesClient: ensureClient,
      } = require("../src/slides");

      await initClient();
      const client1 = await ensureClient();
      const client2 = await ensureClient();

      expect(client1).toBe(client2);
      expect(client1).toBe(mockSlidesClient);
    });
  });
});
