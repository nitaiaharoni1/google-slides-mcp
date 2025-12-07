/**
 * Formatting Tools Unit Tests
 * Tests for text formatting, shape formatting, positioning, paragraph styles
 */

import { textFormattingTools } from "../../src/tools/text-formatting";
import { shapeFormattingTools } from "../../src/tools/shape-formatting";
import { positioningTools } from "../../src/tools/positioning";
import { ensureSlidesClient } from "../../src/slides";
import { createMockSlidesClient } from "../helpers/mock-api";
import { TEST_PRESENTATION_ID, TEST_OBJECT_ID } from "../helpers/test-data";
import { mockConsoleError, restoreConsoleError } from "../helpers/setup-mocks";

// Combine all formatting tools for testing
const formattingTools = [
  ...textFormattingTools,
  ...shapeFormattingTools,
  ...positioningTools,
];

// Mock slides module
jest.mock("../../src/slides", () => ({
  ensureSlidesClient: jest.fn(),
}));

describe("Formatting Tools", () => {
  let consoleErrorSpy: jest.SpyInstance;
  let mockSlidesClient: any;

  beforeEach(() => {
    consoleErrorSpy = mockConsoleError();
    mockSlidesClient = createMockSlidesClient();
    (ensureSlidesClient as jest.Mock).mockResolvedValue(mockSlidesClient);
  });

  afterEach(() => {
    restoreConsoleError(consoleErrorSpy);
    jest.clearAllMocks();
  });

  describe("format_text", () => {
    const tool = formattingTools.find((t) => t.name === "format_text")!;

    test("should have correct tool definition", () => {
      expect(tool).toBeDefined();
      expect(tool.name).toBe("format_text");
      expect(tool.inputSchema.required).toContain("objectId");
    });

    test("should format text with font size", async () => {
      const args = {
        presentationId: TEST_PRESENTATION_ID,
        objectId: TEST_OBJECT_ID,
        fontSize: 24,
      };

      const result = await tool.handler(args);

      expect(mockSlidesClient.presentations.batchUpdate).toHaveBeenCalled();
      expect(result).toBeValidMCPResult();
    });

    test("should format text with multiple properties", async () => {
      const args = {
        presentationId: TEST_PRESENTATION_ID,
        objectId: TEST_OBJECT_ID,
        fontSize: 18,
        fontFamily: "Arial",
        bold: true,
        italic: true,
        foregroundColor: {
          rgbColor: {
            red: 1.0,
            green: 0.0,
            blue: 0.0,
          },
        },
      };

      await tool.handler(args);

      const calls = (mockSlidesClient.presentations.batchUpdate as jest.Mock)
        .mock.calls;
      const requestBody = calls[0][0].requestBody;
      const updateTextStyle = requestBody.requests[0].updateTextStyle;
      expect(updateTextStyle.style.fontSize).toBeDefined();
      expect(updateTextStyle.style.bold).toBe(true);
    });

    test("should throw error if no formatting properties provided", async () => {
      const args = {
        presentationId: TEST_PRESENTATION_ID,
        objectId: TEST_OBJECT_ID,
      };

      await expect(tool.handler(args)).rejects.toThrow(
        "No formatting properties provided"
      );
    });
  });

  describe("format_shape", () => {
    const tool = formattingTools.find((t) => t.name === "format_shape")!;

    test("should have correct tool definition", () => {
      expect(tool).toBeDefined();
      expect(tool.name).toBe("format_shape");
    });

    test("should format shape with fill color", async () => {
      const args = {
        presentationId: TEST_PRESENTATION_ID,
        objectId: TEST_OBJECT_ID,
        fillColor: {
          rgbColor: {
            red: 0.0,
            green: 0.5,
            blue: 1.0,
          },
        },
      };

      const result = await tool.handler(args);

      expect(mockSlidesClient.presentations.batchUpdate).toHaveBeenCalled();
      expect(result).toBeValidMCPResult();
    });
  });

  describe("set_element_position", () => {
    const tool = formattingTools.find(
      (t) => t.name === "set_element_position"
    )!;

    test("should have correct tool definition", () => {
      expect(tool).toBeDefined();
      expect(tool.name).toBe("set_element_position");
    });

    test("should set element position", async () => {
      const args = {
        presentationId: TEST_PRESENTATION_ID,
        objectId: TEST_OBJECT_ID,
        x: 100,
        y: 200,
        width: 300,
        height: 150,
      };

      const result = await tool.handler(args);

      expect(mockSlidesClient.presentations.batchUpdate).toHaveBeenCalled();
      expect(result).toBeValidMCPResult();
    });
  });

  describe("format_text with paragraph styles", () => {
    const tool = formattingTools.find((t) => t.name === "format_text")!;

    test("should apply paragraph style via format_text", async () => {
      const args = {
        presentationId: TEST_PRESENTATION_ID,
        objectId: TEST_OBJECT_ID,
        alignment: "CENTER",
        spacingMagnitude: 12,
      };

      const result = await tool.handler(args);

      expect(mockSlidesClient.presentations.batchUpdate).toHaveBeenCalled();
      expect(result).toBeValidMCPResult();

      const calls = (mockSlidesClient.presentations.batchUpdate as jest.Mock)
        .mock.calls;
      const requestBody = calls[0][0].requestBody;
      const updateParagraphStyle = requestBody.requests.find(
        (r: any) => r.updateParagraphStyle
      );
      expect(updateParagraphStyle).toBeDefined();
      expect(updateParagraphStyle.updateParagraphStyle.style.alignment).toBe(
        "CENTER"
      );
    });

    test("should apply both text and paragraph styles together", async () => {
      const args = {
        presentationId: TEST_PRESENTATION_ID,
        objectId: TEST_OBJECT_ID,
        fontSize: 18,
        bold: true,
        alignment: "CENTER",
        indentFirstLine: 20,
      };

      await tool.handler(args);

      const calls = (mockSlidesClient.presentations.batchUpdate as jest.Mock)
        .mock.calls;
      const requestBody = calls[0][0].requestBody;

      const updateTextStyle = requestBody.requests.find(
        (r: any) => r.updateTextStyle
      );
      const updateParagraphStyle = requestBody.requests.find(
        (r: any) => r.updateParagraphStyle
      );

      expect(updateTextStyle).toBeDefined();
      expect(updateParagraphStyle).toBeDefined();
      expect(updateTextStyle.updateTextStyle.style.fontSize).toBeDefined();
      expect(updateParagraphStyle.updateParagraphStyle.style.alignment).toBe(
        "CENTER"
      );
    });
  });
});
