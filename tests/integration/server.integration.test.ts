/**
 * MCP Server Integration Tests
 * Tests for MCP server initialization and tool execution
 */

import { getToolDefinitions, handleToolCall } from "../../src/tools/index";
import { isSlidesClientInitialized } from "../../src/slides";
import { createMockSlidesClient } from "../helpers/mock-api";
import { TEST_PRESENTATION_TITLE } from "../helpers/test-data";
import { mockConsoleError, restoreConsoleError } from "../helpers/setup-mocks";

// Mock slides module
jest.mock("../../src/slides", () => ({
  initializeSlidesClient: jest.fn(),
  isSlidesClientInitialized: jest.fn(),
  ensureSlidesClient: jest.fn(),
}));

describe("MCP Server Integration", () => {
  let consoleErrorSpy: jest.SpyInstance;
  let mockSlidesClient: any;

  beforeEach(() => {
    consoleErrorSpy = mockConsoleError();
    mockSlidesClient = createMockSlidesClient();
    (isSlidesClientInitialized as jest.Mock).mockReturnValue(true);
  });

  afterEach(() => {
    restoreConsoleError(consoleErrorSpy);
    jest.clearAllMocks();
  });

  describe("Tool Listing", () => {
    test("should list all available tools", () => {
      const tools = getToolDefinitions();

      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);

      const toolNames = tools.map((t) => t.name);
      expect(toolNames).toContain("create_presentation");
      expect(toolNames).toContain("get_presentation");
      expect(toolNames).toContain("create_slide");
      expect(toolNames).toContain("add_multiple_text_boxes");
    });

    test("should have valid tool schemas", () => {
      const tools = getToolDefinitions();

      tools.forEach((tool) => {
        expect(tool).toHaveProperty("name");
        expect(tool).toHaveProperty("description");
        expect(tool).toHaveProperty("inputSchema");
        expect(tool.inputSchema.type).toBe("object");
        expect(tool.inputSchema.properties).toBeDefined();
      });
    });
  });

  describe("Tool Execution", () => {
    test("should execute tool call successfully", async () => {
      const { ensureSlidesClient } = require("../../src/slides");
      (ensureSlidesClient as jest.Mock).mockResolvedValue(mockSlidesClient);

      const request = {
        params: {
          name: "create_presentation",
          arguments: {
            title: TEST_PRESENTATION_TITLE,
          },
        },
      };

      const result = await handleToolCall(request);

      expect(result).toBeValidMCPResult();
      expect(result.isError).toBeFalsy();
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
    });

    test("should return error if client not initialized", async () => {
      const { ensureSlidesClient } = require("../../src/slides");
      (ensureSlidesClient as jest.Mock).mockRejectedValue(
        new Error(
          "Slides client not initialized. Call initializeSlidesClient() first."
        )
      );

      const request = {
        params: {
          name: "create_presentation",
          arguments: {
            title: TEST_PRESENTATION_TITLE,
          },
        },
      };

      const result = await handleToolCall(request);

      expect(result.isError).toBe(true);
      const firstContent = result.content[0];
      if (firstContent.type === "text") {
        expect(firstContent.text).toContain("not initialized");
      }
    });

    test("should return error for unknown tool", async () => {
      const request = {
        params: {
          name: "unknown_tool",
          arguments: {},
        },
      };

      const result = await handleToolCall(request);
      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe("text");
      if (result.content[0].type === "text") {
        expect(result.content[0].text).toContain("Unknown tool");
      }
    });

    test("should handle tool execution errors", async () => {
      const { ensureSlidesClient } = require("../../src/slides");
      (ensureSlidesClient as jest.Mock).mockRejectedValue(
        new Error("API Error")
      );

      const request = {
        params: {
          name: "create_presentation",
          arguments: {
            title: TEST_PRESENTATION_TITLE,
          },
        },
      };

      const result = await handleToolCall(request);

      expect(result.isError).toBe(true);
      const firstContent = result.content[0];
      if (firstContent.type === "text") {
        expect(firstContent.text).toContain("Error");
      }
    });
  });
});
