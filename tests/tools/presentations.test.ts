/**
 * Presentation Tools Unit Tests
 * Tests for create, get, and delete presentation tools
 */

import { presentationTools } from "../../src/tools/presentations";
import { ensureSlidesClient } from "../../src/slides";
import { getOAuth2Client } from "../../src/auth";
import {
  createMockSlidesClient,
  createMockDriveClient,
} from "../helpers/mock-api";
import presentationsFixture from "../fixtures/presentations.json";
import {
  TEST_PRESENTATION_ID,
  TEST_PRESENTATION_TITLE,
} from "../helpers/test-data";
import { mockConsoleError, restoreConsoleError } from "../helpers/setup-mocks";

// Mock slides module
jest.mock("../../src/slides", () => ({
  ensureSlidesClient: jest.fn(),
}));

// Mock auth module
jest.mock("../../src/auth", () => ({
  getOAuth2Client: jest.fn(),
}));

// Mock googleapis
jest.mock("googleapis", () => ({
  google: {
    slides: jest.fn(),
    drive: jest.fn(),
  },
}));

describe("Presentation Tools", () => {
  let consoleErrorSpy: any;
  let mockSlidesClient: any;
  let mockDriveClient: any;

  beforeEach(() => {
    consoleErrorSpy = mockConsoleError();
    mockSlidesClient = createMockSlidesClient();
    mockDriveClient = createMockDriveClient();

    (ensureSlidesClient as jest.Mock).mockResolvedValue(mockSlidesClient);
    (getOAuth2Client as jest.Mock).mockReturnValue({});

    const { google: googleMock } = require("googleapis");
    googleMock.slides.mockReturnValue(mockSlidesClient);
    googleMock.drive.mockReturnValue(mockDriveClient);
  });

  afterEach(() => {
    restoreConsoleError(consoleErrorSpy);
    jest.clearAllMocks();
  });

  describe("create_presentation", () => {
    const tool = presentationTools.find(
      (t) => t.name === "create_presentation"
    )!;

    test("should have correct tool definition", () => {
      expect(tool).toBeDefined();
      expect(tool.name).toBe("create_presentation");
      expect(tool.description).toContain("Create");
      expect(tool.inputSchema.required).toContain("title");
    });

    test("should create presentation with title", async () => {
      const args = {
        title: TEST_PRESENTATION_TITLE,
      };

      const result = await tool.handler(args);

      expect(mockSlidesClient.presentations.create).toHaveBeenCalledWith({
        requestBody: {
          title: TEST_PRESENTATION_TITLE,
        },
      });
      expect(result).toBeValidMCPResult();
      expect(result).toHaveValidJSONContent();

      const firstContent = result.content[0];
      if (firstContent.type === "text") {
        const content = JSON.parse(firstContent.text);
        expect(content.presentationId).toBe(
          presentationsFixture.createPresentation.presentationId
        );
        expect(content.title).toBe(TEST_PRESENTATION_TITLE);
      }
    });

    test("should create presentation with custom presentationId", async () => {
      const customId = "custom-pres-id";
      const args = {
        title: TEST_PRESENTATION_TITLE,
        presentationId: customId,
      };

      await tool.handler(args);

      expect(mockSlidesClient.presentations.create).toHaveBeenCalledWith({
        requestBody: {
          title: TEST_PRESENTATION_TITLE,
          presentationId: customId,
        },
      });
    });

    test("should create presentation with locale", async () => {
      const args = {
        title: TEST_PRESENTATION_TITLE,
        locale: "fr-FR",
      };

      await tool.handler(args);

      expect(mockSlidesClient.presentations.create).toHaveBeenCalledWith({
        requestBody: {
          title: TEST_PRESENTATION_TITLE,
          locale: "fr-FR",
        },
      });
    });

    test("should handle API errors", async () => {
      const error = new Error("API Error");
      (mockSlidesClient.presentations.create as jest.Mock).mockRejectedValue(
        error
      );

      const args = {
        title: TEST_PRESENTATION_TITLE,
      };

      await expect(tool.handler(args)).rejects.toThrow("API Error");
    });
  });

  describe("get_presentation", () => {
    const tool = presentationTools.find((t) => t.name === "get_presentation")!;

    test("should have correct tool definition", () => {
      expect(tool).toBeDefined();
      expect(tool.name).toBe("get_presentation");
      expect(tool.description).toContain("Get");
      expect(tool.inputSchema.required).toContain("presentationId");
    });

    test("should get presentation details", async () => {
      const args = {
        presentationId: TEST_PRESENTATION_ID,
      };

      const result = await tool.handler(args);

      expect(mockSlidesClient.presentations.get).toHaveBeenCalledWith({
        presentationId: TEST_PRESENTATION_ID,
      });
      expect(result).toBeValidMCPResult();
      expect(result).toHaveValidJSONContent();

      const firstContent = result.content[0];
      if (firstContent.type === "text") {
        const content = JSON.parse(firstContent.text);
        expect(content.presentationId).toBe(
          presentationsFixture.getPresentation.presentationId
        );
        expect(content.title).toBe(presentationsFixture.getPresentation.title);
        expect(content.slides).toBeDefined();
        expect(Array.isArray(content.slides)).toBe(true);
      }
    });

    test("should include slides, layouts, and masters in response", async () => {
      const args = {
        presentationId: TEST_PRESENTATION_ID,
      };

      const result = await tool.handler(args);
      const firstContent = result.content[0];
      if (firstContent.type === "text") {
        const content = JSON.parse(firstContent.text);
        expect(content.slides).toBeDefined();
        expect(content.layouts).toBeDefined();
        expect(content.masters).toBeDefined();
      }
    });

    test("should handle API errors", async () => {
      const error = new Error("Presentation not found");
      (mockSlidesClient.presentations.get as jest.Mock).mockRejectedValue(
        error
      );

      const args = {
        presentationId: TEST_PRESENTATION_ID,
      };

      await expect(tool.handler(args)).rejects.toThrow(
        "Presentation not found"
      );
    });
  });

  describe("delete_presentation", () => {
    const tool = presentationTools.find(
      (t) => t.name === "delete_presentation"
    )!;

    test("should have correct tool definition", () => {
      expect(tool).toBeDefined();
      expect(tool.name).toBe("delete_presentation");
      expect(tool.description).toContain("Delete");
      expect(tool.inputSchema.required).toContain("presentationIds");
    });

    test("should delete single presentation via Drive API", async () => {
      const args = {
        presentationIds: [TEST_PRESENTATION_ID],
      };

      const result = await tool.handler(args);

      expect(mockDriveClient.files.delete).toHaveBeenCalledWith({
        fileId: TEST_PRESENTATION_ID,
      });
      expect(result).toBeValidMCPResult();
      expect(result).toHaveValidJSONContent();

      const firstContent = result.content[0];
      if (firstContent.type === "text") {
        const content = JSON.parse(firstContent.text);
        expect(content.success).toBe(true);
        expect(content.presentationIds).toEqual([TEST_PRESENTATION_ID]);
        expect(content.message).toContain("deleted");
      }
    });

    test("should delete multiple presentations via Drive API", async () => {
      const args = {
        presentationIds: [TEST_PRESENTATION_ID, "presentation_2"],
      };

      const result = await tool.handler(args);

      expect(mockDriveClient.files.delete).toHaveBeenCalledTimes(2);
      expect(mockDriveClient.files.delete).toHaveBeenCalledWith({
        fileId: TEST_PRESENTATION_ID,
      });
      expect(mockDriveClient.files.delete).toHaveBeenCalledWith({
        fileId: "presentation_2",
      });
      expect(result).toBeValidMCPResult();
      expect(result).toHaveValidJSONContent();

      const firstContent = result.content[0];
      if (firstContent.type === "text") {
        const content = JSON.parse(firstContent.text);
        expect(content.success).toBe(true);
        expect(content.presentationIds).toEqual([
          TEST_PRESENTATION_ID,
          "presentation_2",
        ]);
        expect(content.message).toContain("2 presentation(s)");
      }
    });

    test("should handle API errors", async () => {
      const error = new Error("Permission denied");
      (mockDriveClient.files.delete as jest.Mock).mockRejectedValue(error);

      const args = {
        presentationIds: [TEST_PRESENTATION_ID],
      };

      await expect(tool.handler(args)).rejects.toThrow("Permission denied");
    });
  });
});
