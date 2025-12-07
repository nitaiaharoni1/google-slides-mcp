/**
 * Claude Config Unit Tests
 * Tests for Claude Desktop configuration management
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  getClaudeConfigPath,
  generateNpxConfig,
  generateGlobalConfig,
  generateLocalConfig,
  readClaudeConfig,
  writeClaudeConfig,
  mergeClaudeConfig,
  ClaudeConfig,
} from "../../src/config/claude";
import { mockConsoleError, restoreConsoleError } from "../helpers/setup-mocks";

// Mock fs module
jest.mock("fs", () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

describe("Claude Config", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = mockConsoleError();
  });

  afterEach(() => {
    restoreConsoleError(consoleErrorSpy);
    jest.clearAllMocks();
  });

  describe("getClaudeConfigPath", () => {
    test("should return correct path for macOS", () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, "platform", {
        value: "darwin",
        writable: true,
      });

      const configPath = getClaudeConfigPath();
      const expectedPath = path.join(
        os.homedir(),
        "Library",
        "Application Support",
        "Claude",
        "claude_desktop_config.json"
      );

      expect(configPath).toBe(expectedPath);

      Object.defineProperty(process, "platform", {
        value: originalPlatform,
        writable: true,
      });
    });

    test("should return correct path for Windows", () => {
      // Skip on non-Windows platforms since we can't actually change the platform
      if (process.platform !== "win32") {
        return;
      }

      const configPath = getClaudeConfigPath();
      const expectedPath = path.join(
        os.homedir(),
        "AppData",
        "Roaming",
        "Claude",
        "claude_desktop_config.json"
      );

      expect(configPath).toBe(expectedPath);
    });

    test("should return correct path for Linux", () => {
      // Skip on non-Linux platforms since we can't actually change the platform
      if (process.platform !== "linux") {
        return;
      }

      const configPath = getClaudeConfigPath();
      const expectedPath = path.join(
        os.homedir(),
        ".config",
        "Claude",
        "claude_desktop_config.json"
      );

      expect(configPath).toBe(expectedPath);
    });
  });

  describe("generateNpxConfig", () => {
    test("should generate NPX config with client credentials", () => {
      const config = generateNpxConfig("client-id", "client-secret");

      expect(config.mcpServers["google-slides-mcp"]).toBeDefined();
      expect(config.mcpServers["google-slides-mcp"].command).toBe("npx");
      expect(config.mcpServers["google-slides-mcp"].args).toEqual([
        "google-slides-mcp",
      ]);
      expect(config.mcpServers["google-slides-mcp"].env?.GOOGLE_CLIENT_ID).toBe(
        "client-id"
      );
      expect(
        config.mcpServers["google-slides-mcp"].env?.GOOGLE_CLIENT_SECRET
      ).toBe("client-secret");
    });

    test("should include redirect URI if provided", () => {
      const config = generateNpxConfig(
        "client-id",
        "client-secret",
        "http://custom-redirect"
      ) as any;

      expect(
        config.mcpServers["google-slides-mcp"].env?.GOOGLE_REDIRECT_URI
      ).toBe("http://custom-redirect");
    });
  });

  describe("generateGlobalConfig", () => {
    test("should generate global config", () => {
      const config = generateGlobalConfig("client-id", "client-secret");

      expect(config.mcpServers["google-slides-mcp"].command).toBe(
        "google-slides-mcp"
      );
      expect(config.mcpServers["google-slides-mcp"].args).toBeUndefined();
    });
  });

  describe("generateLocalConfig", () => {
    test("should generate local config", () => {
      const projectPath = "/path/to/project";
      const config = generateLocalConfig(
        "client-id",
        "client-secret",
        projectPath
      );

      expect(config.mcpServers["google-slides-mcp"].command).toBe("node");
      expect(config.mcpServers["google-slides-mcp"].args).toContain(
        path.join(projectPath, "dist", "server.js")
      );
    });
  });

  describe("readClaudeConfig", () => {
    test("should return null if config file doesn't exist", () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const config = readClaudeConfig();

      expect(config).toBeNull();
    });

    test("should read existing config file", () => {
      const mockConfig: ClaudeConfig = {
        mcpServers: {
          "other-server": {
            command: "other",
          },
        },
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify(mockConfig)
      );

      const config = readClaudeConfig();

      expect(config).toEqual(mockConfig);
    });

    test("should return null on parse error", () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue("invalid json");

      const config = readClaudeConfig();

      expect(config).toBeNull();
    });
  });

  describe("writeClaudeConfig", () => {
    test("should write config file", () => {
      const config: ClaudeConfig = {
        mcpServers: {
          "google-slides-mcp": {
            command: "npx",
            args: ["google-slides-mcp"],
          },
        },
      };

      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = writeClaudeConfig(config);

      expect(result).toBe(true);
      expect(fs.mkdirSync).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    test("should create directory if it doesn't exist", () => {
      const config: ClaudeConfig = {
        mcpServers: {},
      };

      (fs.existsSync as jest.Mock).mockReturnValue(false);

      writeClaudeConfig(config);

      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), {
        recursive: true,
      });
    });
  });

  describe("mergeClaudeConfig", () => {
    test("should merge config into existing config", () => {
      const existingConfig: ClaudeConfig = {
        mcpServers: {
          "other-server": {
            command: "other",
          },
        },
      };

      jest
        .spyOn(require("../../src/config/claude"), "readClaudeConfig")
        .mockReturnValue(existingConfig);
      jest
        .spyOn(require("../../src/config/claude"), "writeClaudeConfig")
        .mockReturnValue(true);

      const {
        mergeClaudeConfig: mergeConfig,
      } = require("../../src/config/claude");
      const result = mergeConfig("client-id", "client-secret");

      expect(result).toBe(true);
    });

    test("should create new config if none exists", () => {
      jest
        .spyOn(require("../../src/config/claude"), "readClaudeConfig")
        .mockReturnValue(null);
      jest
        .spyOn(require("../../src/config/claude"), "writeClaudeConfig")
        .mockReturnValue(true);

      const {
        mergeClaudeConfig: mergeConfig,
      } = require("../../src/config/claude");
      const result = mergeConfig("client-id", "client-secret");

      expect(result).toBe(true);
    });

    test("should use NPX by default", () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = mergeClaudeConfig("client-id", "client-secret");

      expect(result).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalled();
      const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0];
      const configWritten = JSON.parse(writeCall[1] as string);
      expect(configWritten.mcpServers["google-slides-mcp"].command).toBe("npx");
    });
  });
});
