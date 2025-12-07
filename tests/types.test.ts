/**
 * Type Tests
 * Tests for type definitions and type safety
 */

import {
  MCPTextContent,
  MCPImageContent,
  MCPToolDefinition,
  MCPResult,
} from "../src/types/mcp";
import {
  CreatePresentationArgs,
  AddTextBoxArgs,
  ShapeType,
  Alignment,
} from "../src/types/slides";

describe("Type Definitions", () => {
  describe("MCP Types", () => {
    test("MCPResult should have correct structure", () => {
      const result: MCPResult = {
        content: [
          {
            type: "text",
            text: "test",
          },
        ],
        isError: false,
      };

      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
    });

    test("MCPTextContent should be valid", () => {
      const content: MCPTextContent = {
        type: "text",
        text: "test content",
      };

      expect(content.type).toBe("text");
      expect(typeof content.text).toBe("string");
    });

    test("MCPImageContent should be valid", () => {
      const content: MCPImageContent = {
        type: "image",
        data: "base64data",
        mimeType: "image/png",
      };

      expect(content.type).toBe("image");
      expect(typeof content.data).toBe("string");
      expect(typeof content.mimeType).toBe("string");
    });

    test("MCPToolDefinition should have required properties", () => {
      const tool: MCPToolDefinition = {
        name: "test_tool",
        description: "Test tool",
        inputSchema: {
          type: "object",
          properties: {},
        },
        handler: async () => ({
          content: [{ type: "text", text: "test" }],
        }),
      };

      expect(tool.name).toBe("test_tool");
      expect(tool.inputSchema.type).toBe("object");
      expect(typeof tool.handler).toBe("function");
    });
  });

  describe("Slides Types", () => {
    test("CreatePresentationArgs should be valid", () => {
      const args: CreatePresentationArgs = {
        title: "Test Presentation",
      };

      expect(args.title).toBe("Test Presentation");
    });

    test("AddTextBoxArgs should be valid", () => {
      const args: AddTextBoxArgs = {
        presentationId: "pres-123",
        pageId: "page-123",
        text: "Hello",
      };

      expect(args.presentationId).toBe("pres-123");
      expect(args.text).toBe("Hello");
    });

    test("ShapeType should accept valid values", () => {
      const validTypes: ShapeType[] = [
        "RECTANGLE",
        "ELLIPSE",
        "DIAMOND",
        "TRIANGLE",
      ];

      validTypes.forEach((type) => {
        expect(typeof type).toBe("string");
      });
    });

    test("Alignment should accept valid values", () => {
      const validAlignments: Alignment[] = [
        "START",
        "CENTER",
        "END",
        "JUSTIFIED",
      ];

      validAlignments.forEach((alignment) => {
        expect(typeof alignment).toBe("string");
      });
    });
  });
});
