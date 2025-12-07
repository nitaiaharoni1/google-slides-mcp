/**
 * Content Tools Unit Tests
 * Tests for text boxes, images, shapes, text updates, element deletion
 */

import { elementTools } from "../../src/tools/elements";
import { textTools } from "../../src/tools/text";
import { imageTools } from "../../src/tools/images";
import { shapeTools } from "../../src/tools/shapes";
import { ensureSlidesClient } from "../../src/slides";
import { createMockSlidesClient } from "../helpers/mock-api";
import {
  TEST_PRESENTATION_ID,
  TEST_SLIDE_ID,
  TEST_OBJECT_ID,
  TEST_TEXT_CONTENT,
  TEST_IMAGE_URL,
  TEST_SHAPE_TYPE,
} from "../helpers/test-data";
import { mockConsoleError, restoreConsoleError } from "../helpers/setup-mocks";

// Mock slides module
jest.mock("../../src/slides", () => ({
  ensureSlidesClient: jest.fn(),
}));

describe("Content Tools", () => {
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

  describe("add_multiple_text_boxes", () => {
    const tool = textTools.find((t) => t.name === "add_multiple_text_boxes")!;

    test("should have correct tool definition", () => {
      expect(tool).toBeDefined();
      expect(tool.name).toBe("add_multiple_text_boxes");
      expect(tool.inputSchema.required).toContain("presentationId");
      expect(tool.inputSchema.required).toContain("pageId");
      expect(tool.inputSchema.required).toContain("textBoxes");
    });

    test("should add text box with default position", async () => {
      const args = {
        presentationId: TEST_PRESENTATION_ID,
        pageId: TEST_SLIDE_ID,
        textBoxes: [{ text: TEST_TEXT_CONTENT, fontSize: 14 }],
      };

      const result = await tool.handler(args);

      expect(mockSlidesClient.presentations.batchUpdate).toHaveBeenCalled();
      expect(result).toBeValidMCPResult();

      const firstContent = result.content[0];
      if (firstContent.type === "text") {
        const content = JSON.parse(firstContent.text);
        expect(content.objectIds).toBeDefined();
        // objectIds can be a single string or array depending on count
        expect(
          typeof content.objectIds === "string" ||
            Array.isArray(content.objectIds)
        ).toBe(true);
      }
    });

    test("should add text box with custom position and size", async () => {
      const args = {
        presentationId: TEST_PRESENTATION_ID,
        pageId: TEST_SLIDE_ID,
        textBoxes: [
          {
            text: TEST_TEXT_CONTENT,
            fontSize: 14,
            x: 100,
            y: 200,
            width: 300,
            height: 150,
          },
        ],
      };

      await tool.handler(args);

      const calls = (mockSlidesClient.presentations.batchUpdate as jest.Mock)
        .mock.calls;
      const requestBody = calls[0][0].requestBody;
      const createShape = requestBody.requests[0].createShape;
      expect(createShape.shapeType).toBe("TEXT_BOX");
      expect(
        createShape.elementProperties.transform.translateX
      ).toBeGreaterThan(0);
    });
  });

  describe("add_image", () => {
    const tool = imageTools.find((t) => t.name === "add_image")!;

    test("should have correct tool definition", () => {
      expect(tool).toBeDefined();
      expect(tool.name).toBe("add_image");
      expect(tool.inputSchema.required).toContain("imageUrl");
    });

    test("should add image with URL", async () => {
      const args = {
        presentationId: TEST_PRESENTATION_ID,
        pageId: TEST_SLIDE_ID,
        imageUrl: TEST_IMAGE_URL,
      };

      const result = await tool.handler(args);

      expect(mockSlidesClient.presentations.batchUpdate).toHaveBeenCalled();
      expect(result).toBeValidMCPResult();

      const firstContent = result.content[0];
      if (firstContent.type === "text") {
        const content = JSON.parse(firstContent.text);
        expect(content.objectId).toBeDefined();
        expect(content.imageUrl).toBe(TEST_IMAGE_URL);
      }
    });

    test("should add image with custom position and size", async () => {
      const args = {
        presentationId: TEST_PRESENTATION_ID,
        pageId: TEST_SLIDE_ID,
        imageUrl: TEST_IMAGE_URL,
        x: 50,
        y: 50,
        width: 500,
        height: 400,
      };

      await tool.handler(args);

      const calls = (mockSlidesClient.presentations.batchUpdate as jest.Mock)
        .mock.calls;
      const requestBody = calls[0][0].requestBody;
      const createImage = requestBody.requests[0].createImage;
      expect(createImage.url).toBe(TEST_IMAGE_URL);
    });
  });

  describe("add_shape", () => {
    const tool = shapeTools.find((t) => t.name === "add_shape")!;

    test("should have correct tool definition", () => {
      expect(tool).toBeDefined();
      expect(tool.name).toBe("add_shape");
      expect(tool.inputSchema.required).toContain("shapeType");
    });

    test("should add shape with valid shape type", async () => {
      const args = {
        presentationId: TEST_PRESENTATION_ID,
        pageId: TEST_SLIDE_ID,
        shapeType: TEST_SHAPE_TYPE,
      };

      const result = await tool.handler(args);

      expect(mockSlidesClient.presentations.batchUpdate).toHaveBeenCalled();
      expect(result).toBeValidMCPResult();

      const firstContent = result.content[0];
      if (firstContent.type === "text") {
        const content = JSON.parse(firstContent.text);
        expect(content.objectId).toBeDefined();
        expect(content.shapeType).toBe(TEST_SHAPE_TYPE);
      }
    });

    test("should return error result for invalid shape type", async () => {
      const args = {
        presentationId: TEST_PRESENTATION_ID,
        pageId: TEST_SLIDE_ID,
        shapeType: "INVALID_SHAPE",
      };

      const result = await tool.handler(args);

      expect(result.isError).toBe(true);
      const firstContent = result.content[0];
      if (firstContent.type === "text") {
        const content = JSON.parse(firstContent.text);
        expect(content.error).toBe("Invalid shape type");
        expect(content.provided).toBe("INVALID_SHAPE");
      }
    });
  });

  describe("update_text", () => {
    const tool = textTools.find((t) => t.name === "update_text")!;

    test("should have correct tool definition", () => {
      expect(tool).toBeDefined();
      expect(tool.name).toBe("update_text");
      expect(tool.inputSchema.required).toContain("objectId");
      expect(tool.inputSchema.required).toContain("text");
    });

    test("should update text in element", async () => {
      const args = {
        presentationId: TEST_PRESENTATION_ID,
        objectId: TEST_OBJECT_ID,
        text: TEST_TEXT_CONTENT,
      };

      const result = await tool.handler(args);

      expect(mockSlidesClient.presentations.batchUpdate).toHaveBeenCalled();
      expect(result).toBeValidMCPResult();

      const firstContent = result.content[0];
      if (firstContent.type === "text") {
        const content = JSON.parse(firstContent.text);
        expect(content.success).toBe(true);
        expect(content.objectId).toBe(TEST_OBJECT_ID);
      }
    });
  });

  describe("delete_element", () => {
    const tool = elementTools.find((t) => t.name === "delete_element")!;

    test("should have correct tool definition", () => {
      expect(tool).toBeDefined();
      expect(tool.name).toBe("delete_element");
      expect(tool.inputSchema.required).toContain("objectIds");
    });

    test("should delete single element", async () => {
      const args = {
        presentationId: TEST_PRESENTATION_ID,
        objectIds: [TEST_OBJECT_ID],
      };

      const result = await tool.handler(args);

      expect(mockSlidesClient.presentations.batchUpdate).toHaveBeenCalled();
      expect(result).toBeValidMCPResult();

      const firstContent = result.content[0];
      if (firstContent.type === "text") {
        const content = JSON.parse(firstContent.text);
        expect(content.success).toBe(true);
        expect(content.objectIds).toEqual([TEST_OBJECT_ID]);
      }
    });

    test("should delete multiple elements", async () => {
      const args = {
        presentationId: TEST_PRESENTATION_ID,
        objectIds: [TEST_OBJECT_ID, "element_2"],
      };

      const result = await tool.handler(args);

      expect(mockSlidesClient.presentations.batchUpdate).toHaveBeenCalledWith({
        presentationId: TEST_PRESENTATION_ID,
        requestBody: {
          requests: [
            { deleteObject: { objectId: TEST_OBJECT_ID } },
            { deleteObject: { objectId: "element_2" } },
          ],
        },
      });
      expect(result).toBeValidMCPResult();

      const firstContent = result.content[0];
      if (firstContent.type === "text") {
        const content = JSON.parse(firstContent.text);
        expect(content.success).toBe(true);
        expect(content.objectIds).toEqual([TEST_OBJECT_ID, "element_2"]);
        expect(content.message).toContain("2 element(s)");
      }
    });
  });
});
