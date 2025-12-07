/**
 * Batch Tools Unit Tests
 * Tests for batch update operations
 */

import { batchTools } from "../../src/tools/batch";
import { ensureSlidesClient } from "../../src/slides";
import { createMockSlidesClient } from "../helpers/mock-api";
import { TEST_PRESENTATION_ID } from "../helpers/test-data";
import { mockConsoleError, restoreConsoleError } from "../helpers/setup-mocks";

// Mock slides module
jest.mock("../../src/slides", () => ({
  ensureSlidesClient: jest.fn(),
}));

describe("Batch Tools", () => {
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

  describe("batch_update", () => {
    const tool = batchTools.find((t) => t.name === "batch_update")!;

    test("should have correct tool definition", () => {
      expect(tool).toBeDefined();
      expect(tool.name).toBe("batch_update");
      expect(tool.inputSchema.required).toContain("presentationId");
      expect(tool.inputSchema.required).toContain("requests");
    });

    test("should execute batch update with multiple requests", async () => {
      const requests = [
        {
          createSlide: {
            insertionIndex: 0,
          },
        },
        {
          insertText: {
            objectId: "textbox-1",
            text: "Hello",
          },
        },
      ];

      const args = {
        presentationId: TEST_PRESENTATION_ID,
        requests,
      };

      const result = await tool.handler(args);

      expect(mockSlidesClient.presentations.batchUpdate).toHaveBeenCalledWith({
        presentationId: TEST_PRESENTATION_ID,
        requestBody: {
          requests,
        },
      });
      expect(result).toBeValidMCPResult();

      const firstContent = result.content[0];
      if (firstContent.type === "text") {
        const content = JSON.parse(firstContent.text);
        expect(content.success).toBe(true);
        expect(content.numRequests).toBe(2);
      }
    });

    test("should throw error if no requests provided", async () => {
      const args = {
        presentationId: TEST_PRESENTATION_ID,
        requests: [],
      };

      await expect(tool.handler(args)).rejects.toThrow(
        "No requests provided for batch update"
      );
    });

    test("should throw error if too many requests", async () => {
      const requests = Array(51).fill({ createSlide: {} });

      const args = {
        presentationId: TEST_PRESENTATION_ID,
        requests,
      };

      await expect(tool.handler(args)).rejects.toThrow(
        "Too many requests. Maximum is 50"
      );
    });
  });
});
