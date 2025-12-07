/**
 * CLI Unit Tests
 * Tests for command-line interface commands and argument parsing
 */

import * as fs from "fs";
import * as readline from "readline";
import { handleCliCommands } from "../src/cli";
import {
  startAuthFlow,
  exchangeCodeForTokens,
  hasValidTokens,
  getTokensPath,
  clearTokens,
} from "../src/auth";
import {
  getClaudeConfigPath,
  mergeClaudeConfig,
  readClaudeConfig,
} from "../src/config/claude";
import { mockConsoleError, restoreConsoleError } from "./helpers/setup-mocks";

// Mock auth module
jest.mock("../src/auth", () => ({
  startAuthFlow: jest.fn(),
  exchangeCodeForTokens: jest.fn(),
  hasValidTokens: jest.fn(),
  getTokensPath: jest.fn(),
  clearTokens: jest.fn(),
}));

// Mock config module
jest.mock("../src/config/claude", () => ({
  getClaudeConfigPath: jest.fn(),
  mergeClaudeConfig: jest.fn(),
  readClaudeConfig: jest.fn(),
  generateNpxConfig: jest.fn(),
}));

// Mock readline
jest.mock("readline", () => ({
  createInterface: jest.fn(),
}));

// Mock fs
jest.mock("fs", () => ({
  existsSync: jest.fn(),
}));

describe("CLI Commands", () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = mockConsoleError();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    restoreConsoleError(consoleErrorSpy);
    consoleLogSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe("handleCliCommands", () => {
    test("should return false for empty args", async () => {
      const result = await handleCliCommands([]);
      expect(result).toBe(false);
    });

    test("should handle --help command", async () => {
      const result = await handleCliCommands(["--help"]);
      expect(result).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test("should handle -h command", async () => {
      const result = await handleCliCommands(["-h"]);
      expect(result).toBe(true);
    });

    test("should handle --version command", async () => {
      const result = await handleCliCommands(["--version"]);
      expect(result).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test("should handle -v command", async () => {
      const result = await handleCliCommands(["-v"]);
      expect(result).toBe(true);
    });

    test("should handle auth command", async () => {
      process.env.GOOGLE_CLIENT_ID = "test-id";
      process.env.GOOGLE_CLIENT_SECRET = "test-secret";
      (hasValidTokens as jest.Mock).mockReturnValue(false);
      (startAuthFlow as jest.Mock).mockResolvedValue("http://auth-url");

      const mockRl = {
        question: jest.fn(
          (prompt: string, callback: (answer: string) => void) => {
            callback("test-code");
          }
        ),
        close: jest.fn(),
      };
      (readline.createInterface as jest.Mock).mockReturnValue(mockRl);
      (exchangeCodeForTokens as jest.Mock).mockResolvedValue({});

      const result = await handleCliCommands(["auth"]);

      expect(result).toBe(true);
      expect(startAuthFlow).toHaveBeenCalled();

      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;
    });

    test("should handle auth --force command", async () => {
      process.env.GOOGLE_CLIENT_ID = "test-id";
      process.env.GOOGLE_CLIENT_SECRET = "test-secret";
      (hasValidTokens as jest.Mock).mockReturnValue(true);
      (startAuthFlow as jest.Mock).mockResolvedValue("http://auth-url");

      const result = await handleCliCommands(["auth", "--force"]);

      expect(result).toBe(true);
      expect(clearTokens).toHaveBeenCalled();

      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;
    });

    test("should handle status command", async () => {
      process.env.GOOGLE_CLIENT_ID = "test-id";
      process.env.GOOGLE_CLIENT_SECRET = "test-secret";
      (getTokensPath as jest.Mock).mockReturnValue("/path/to/tokens");
      (hasValidTokens as jest.Mock).mockReturnValue(true);
      (getClaudeConfigPath as jest.Mock).mockReturnValue("/path/to/config");
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (readClaudeConfig as jest.Mock).mockReturnValue({
        mcpServers: {
          "google-slides-mcp": {},
        },
      });

      const result = await handleCliCommands(["status"]);

      expect(result).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalled();

      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;
    });

    test("should handle init command", async () => {
      process.env.GOOGLE_CLIENT_ID = "test-id";
      process.env.GOOGLE_CLIENT_SECRET = "test-secret";
      (mergeClaudeConfig as jest.Mock).mockReturnValue(true);

      const result = await handleCliCommands(["init"]);

      expect(result).toBe(true);
      expect(mergeClaudeConfig).toHaveBeenCalled();

      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;
    });

    test("should return false for unknown command", async () => {
      const result = await handleCliCommands(["unknown"]);
      expect(result).toBe(false);
    });

    test("should show error if credentials missing for auth", async () => {
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;

      const result = await handleCliCommands(["auth"]);

      expect(result).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });
});
