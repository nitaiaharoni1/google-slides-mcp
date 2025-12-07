/**
 * Slide Tools Unit Tests
 * Tests for create, duplicate, delete, reorder, get slide tools
 */

import { slideTools } from "../../src/tools/slides";
import { ensureSlidesClient } from "../../src/slides";
import { createMockSlidesClient } from "../helpers/mock-api";
import slidesFixture from "../fixtures/slides.json";
import {
  TEST_PRESENTATION_ID,
  TEST_SLIDE_ID,
  TEST_LAYOUT_ID,
} from "../helpers/test-data";
import { mockConsoleError, restoreConsoleError } from "../helpers/setup-mocks";

// Mock slides module
jest.mock("../../src/slides", () => ({
  ensureSlidesClient: jest.fn(),
}));

describe("Slide Tools", () => {
  let consoleErrorSpy: any;
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

  describe("create_slide", () => {
    const tool = slideTools.find((t) => t.name === "create_slide");
    if (!tool) throw new Error("Tool not found");

    test("should have correct tool definition", () => {
      expect(tool).toBeDefined();
      expect(tool.name).toBe("create_slide");
      expect(tool.inputSchema.required).toContain("presentationId");
    });

    test("should create slide without layout", async () => {
      const args = {
        presentationId: TEST_PRESENTATION_ID,
      };

      const result = await tool.handler(args);

      expect(mockSlidesClient.presentations.batchUpdate).toHaveBeenCalled();
      expect(result).toBeValidMCPResult();
      expect(result).toHaveValidJSONContent();

      const firstContent = result.content[0];
      if (firstContent.type === "text") {
        const content = JSON.parse(firstContent.text);
        expect(content.slideId).toBeDefined();
        expect(content.presentationId).toBe(TEST_PRESENTATION_ID);
      }
    });

    test("should create slide with layout", async () => {
      const args = {
        presentationId: TEST_PRESENTATION_ID,
        layoutId: TEST_LAYOUT_ID,
      };

      await tool.handler(args);

      const calls = (mockSlidesClient.presentations.batchUpdate as jest.Mock)
        .mock.calls;
      const requestBody = calls[0][0].requestBody;
      expect(
        requestBody.requests[0].createSlide.slideLayoutReference.layoutId
      ).toBe(TEST_LAYOUT_ID);
    });

    test("should create slide at specific index", async () => {
      const args = {
        presentationId: TEST_PRESENTATION_ID,
        insertionIndex: 2,
      };

      await tool.handler(args);

      const calls = (mockSlidesClient.presentations.batchUpdate as jest.Mock)
        .mock.calls;
      const requestBody = calls[0][0].requestBody;
      expect(requestBody.requests[0].createSlide.insertionIndex).toBe(2);
    });
  });

  describe("duplicate_slide", () => {
    const tool = slideTools.find((t) => t.name === "duplicate_slide");
    if (!tool) throw new Error("Tool not found");

    test("should have correct tool definition", () => {
      expect(tool).toBeDefined();
      expect(tool.name).toBe("duplicate_slide");
      expect(tool.inputSchema.required).toContain("presentationId");
      expect(tool.inputSchema.required).toContain("slideId");
    });

    test("should duplicate slide", async () => {
      const args = {
        presentationId: TEST_PRESENTATION_ID,
        slideId: TEST_SLIDE_ID,
      };

      // Mock the duplicate response
      (
        mockSlidesClient.presentations.batchUpdate as jest.Mock
      ).mockResolvedValueOnce({
        data: slidesFixture.duplicateSlide,
      });

      const result = await tool.handler(args);

      expect(mockSlidesClient.presentations.batchUpdate).toHaveBeenCalled();
      expect(result).toBeValidMCPResult();

      const firstContent = result.content[0];
      if (firstContent.type === "text") {
        const content = JSON.parse(firstContent.text);
        expect(content.originalSlideId).toBe(TEST_SLIDE_ID);
        expect(content.newSlideId).toBeDefined();
      }
    });
  });

  describe("delete_slide", () => {
    const tool = slideTools.find((t) => t.name === "delete_slide");
    if (!tool) throw new Error("Tool not found");

    test("should have correct tool definition", () => {
      expect(tool).toBeDefined();
      expect(tool.name).toBe("delete_slide");
      expect(tool.inputSchema.required).toContain("slideIds");
    });

    test("should delete single slide", async () => {
      const args = {
        presentationId: TEST_PRESENTATION_ID,
        slideIds: [TEST_SLIDE_ID],
      };

      const result = await tool.handler(args);

      expect(mockSlidesClient.presentations.batchUpdate).toHaveBeenCalled();
      expect(result).toBeValidMCPResult();

      const firstContent = result.content[0];
      if (firstContent.type === "text") {
        const content = JSON.parse(firstContent.text);
        expect(content.success).toBe(true);
        expect(content.slideIds).toEqual([TEST_SLIDE_ID]);
      }
    });

    test("should delete multiple slides", async () => {
      const args = {
        presentationId: TEST_PRESENTATION_ID,
        slideIds: [TEST_SLIDE_ID, "slide_2"],
      };

      const result = await tool.handler(args);

      expect(mockSlidesClient.presentations.batchUpdate).toHaveBeenCalledWith({
        presentationId: TEST_PRESENTATION_ID,
        requestBody: {
          requests: [
            { deleteObject: { objectId: TEST_SLIDE_ID } },
            { deleteObject: { objectId: "slide_2" } },
          ],
        },
      });
      expect(result).toBeValidMCPResult();

      const firstContent = result.content[0];
      if (firstContent.type === "text") {
        const content = JSON.parse(firstContent.text);
        expect(content.success).toBe(true);
        expect(content.slideIds).toEqual([TEST_SLIDE_ID, "slide_2"]);
        expect(content.message).toContain("2 slide(s)");
      }
    });
  });

  describe("reorder_slides", () => {
    const tool = slideTools.find((t) => t.name === "reorder_slides");
    if (!tool) throw new Error("Tool not found");

    test("should have correct tool definition", () => {
      expect(tool).toBeDefined();
      expect(tool.name).toBe("reorder_slides");
      expect(tool.inputSchema.required).toContain("slideIds");
    });

    test("should reorder slides", async () => {
      const slideIds = ["slide-1", "slide-2", "slide-3"];
      const args = {
        presentationId: TEST_PRESENTATION_ID,
        slideIds,
      };

      const result = await tool.handler(args);

      expect(mockSlidesClient.presentations.batchUpdate).toHaveBeenCalled();
      expect(result).toBeValidMCPResult();

      const firstContent = result.content[0];
      if (firstContent.type === "text") {
        const content = JSON.parse(firstContent.text);
        expect(content.success).toBe(true);
        expect(content.slideIds).toEqual(slideIds);
      }
    });
  });

  describe("get_slide", () => {
    const tool = slideTools.find((t) => t.name === "get_slide");
    if (!tool) throw new Error("Tool not found");

    test("should have correct tool definition", () => {
      expect(tool).toBeDefined();
      expect(tool.name).toBe("get_slide");
    });

    test("should get slide details", async () => {
      const args = {
        presentationId: TEST_PRESENTATION_ID,
        slideId: TEST_SLIDE_ID,
      };

      const result = await tool.handler(args);

      expect(mockSlidesClient.presentations.pages.get).toHaveBeenCalledWith({
        presentationId: TEST_PRESENTATION_ID,
        pageObjectId: TEST_SLIDE_ID,
      });
      expect(result).toBeValidMCPResult();

      const firstContent = result.content[0];
      if (firstContent.type === "text") {
        const content = JSON.parse(firstContent.text);
        expect(content.objectId).toBe(slidesFixture.getSlide.objectId);
        expect(content.pageElements).toBeDefined();
      }
    });
  });
});
