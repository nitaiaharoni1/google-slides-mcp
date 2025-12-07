/**
 * Layout Tools Unit Tests
 * Tests for list page templates (layouts and masters)
 */

import { layoutTools } from "../../src/tools/layouts";
import { ensureSlidesClient } from "../../src/slides";
import { createMockSlidesClient } from "../helpers/mock-api";
import { TEST_PRESENTATION_ID } from "../helpers/test-data";
import { mockConsoleError, restoreConsoleError } from "../helpers/setup-mocks";

// Mock slides module
jest.mock("../../src/slides", () => ({
  ensureSlidesClient: jest.fn(),
}));

describe("Layout Tools", () => {
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

  describe("list_page_templates", () => {
    const tool = layoutTools.find((t) => t.name === "list_page_templates")!;

    test("should have correct tool definition", () => {
      expect(tool).toBeDefined();
      expect(tool.name).toBe("list_page_templates");
      expect(tool.inputSchema.required).toContain("presentationId");
    });

    test("should list layouts and masters", async () => {
      const args = {
        presentationId: TEST_PRESENTATION_ID,
      };

      const result = await tool.handler(args);

      expect(mockSlidesClient.presentations.get).toHaveBeenCalledWith({
        presentationId: TEST_PRESENTATION_ID,
      });
      expect(result).toBeValidMCPResult();

      const firstContent = result.content[0];
      if (firstContent.type === "text") {
        const content = JSON.parse(firstContent.text);
        expect(content.layouts).toBeDefined();
        expect(content.masters).toBeDefined();
        expect(Array.isArray(content.layouts)).toBe(true);
        expect(Array.isArray(content.masters)).toBe(true);
      }
    });
  });
});
