/**
 * Slides API Integration Tests
 * Tests for Google Slides API interactions with mocked responses
 */

import { getSlidesClient, initializeSlidesClient } from "../../src/slides";
import { ensureValidToken, getOAuth2Client } from "../../src/auth";
import { createMockSlidesClient } from "../helpers/mock-api";
import presentationsFixture from "../fixtures/presentations.json";
import {
  TEST_PRESENTATION_ID,
  TEST_PRESENTATION_TITLE,
} from "../helpers/test-data";
import { mockConsoleError, restoreConsoleError } from "../helpers/setup-mocks";

// Mock auth module
jest.mock("../../src/auth", () => ({
  ensureValidToken: jest.fn(),
  getOAuth2Client: jest.fn(),
}));

// Mock googleapis
jest.mock("googleapis", () => ({
  google: {
    slides: jest.fn(),
  },
}));

describe("Slides API Integration", () => {
  let consoleErrorSpy: jest.SpyInstance;
  let mockSlidesClient: any;

  beforeEach(() => {
    consoleErrorSpy = mockConsoleError();
    mockSlidesClient = createMockSlidesClient();

    (ensureValidToken as jest.Mock).mockResolvedValue(undefined);
    (getOAuth2Client as jest.Mock).mockReturnValue({});

    const { google: googleMock } = require("googleapis");
    googleMock.slides.mockReturnValue(mockSlidesClient);
  });

  afterEach(() => {
    restoreConsoleError(consoleErrorSpy);
    jest.clearAllMocks();
  });

  describe("Presentation Operations", () => {
    test("should create and retrieve presentation", async () => {
      await initializeSlidesClient();
      const client = getSlidesClient();

      // Create presentation
      const createResponse = await client.presentations.create({
        requestBody: {
          title: TEST_PRESENTATION_TITLE,
        },
      });

      expect(createResponse.data.presentationId).toBe(
        presentationsFixture.createPresentation.presentationId
      );

      // Get presentation
      const getResponse = await client.presentations.get({
        presentationId: createResponse.data.presentationId!,
      });

      expect(getResponse.data.title).toBe(
        presentationsFixture.getPresentation.title
      );
    });

    test("should handle API errors gracefully", async () => {
      await initializeSlidesClient();
      const client = getSlidesClient();

      const error = new Error("Presentation not found");
      // Clear previous mock and set it to reject
      (mockSlidesClient.presentations.get as jest.Mock).mockClear();
      (mockSlidesClient.presentations.get as jest.Mock).mockRejectedValueOnce(
        error
      );

      await expect(
        client.presentations.get({
          presentationId: "invalid-id",
        })
      ).rejects.toThrow("Presentation not found");
    });
  });

  describe("Batch Operations", () => {
    test("should execute batch update with multiple requests", async () => {
      await initializeSlidesClient();
      const client = getSlidesClient();

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

      // Clear previous calls and set up new mock
      (mockSlidesClient.presentations.batchUpdate as jest.Mock).mockClear();
      (
        mockSlidesClient.presentations.batchUpdate as jest.Mock
      ).mockResolvedValueOnce({
        data: { replies: [] },
      });

      await client.presentations.batchUpdate({
        presentationId: TEST_PRESENTATION_ID,
        requestBody: { requests },
      });

      expect(mockSlidesClient.presentations.batchUpdate).toHaveBeenCalledWith({
        presentationId: TEST_PRESENTATION_ID,
        requestBody: { requests },
      });
    });
  });
});
