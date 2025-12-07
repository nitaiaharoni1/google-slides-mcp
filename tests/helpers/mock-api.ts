/**
 * Google Slides API mocking utilities for tests
 */

import { slides_v1 } from "googleapis";
import presentationsFixture from "../fixtures/presentations.json";
import slidesFixture from "../fixtures/slides.json";

/**
 * Create a mock Slides API client
 */
export function createMockSlidesClient(): slides_v1.Slides {
  const mockClient = {
    presentations: {
      create: jest.fn(),
      get: jest.fn(),
      batchUpdate: jest.fn(),
      pages: {
        get: jest.fn(),
        getThumbnail: jest.fn(),
      },
    },
  } as unknown as slides_v1.Slides;

  // Set up default mock responses
  (mockClient.presentations.create as jest.Mock).mockResolvedValue({
    data: presentationsFixture.createPresentation,
  });

  (mockClient.presentations.get as jest.Mock).mockResolvedValue({
    data: presentationsFixture.getPresentation,
  });

  (mockClient.presentations.batchUpdate as jest.Mock).mockResolvedValue({
    data: {
      replies: [
        {
          createSlide: {
            objectId: "new-slide-123",
          },
        },
      ],
    },
  });

  (mockClient.presentations.pages.get as jest.Mock).mockResolvedValue({
    data: slidesFixture.getSlide,
  });

  (mockClient.presentations.pages.getThumbnail as jest.Mock).mockResolvedValue({
    data: slidesFixture.getThumbnail,
  });

  return mockClient;
}

/**
 * Create a mock Drive API client
 */
export function createMockDriveClient(): any {
  return {
    files: {
      delete: jest.fn().mockResolvedValue({}),
    },
  };
}

/**
 * Create an error response matching Google API error format
 */
export function createApiError(
  code: number,
  message: string,
  status: string
): Error {
  const error = new Error(message) as any;
  error.code = code;
  error.status = status;
  error.response = {
    data: {
      error: {
        code,
        message,
        status,
      },
    },
  };
  return error;
}

/**
 * Common error responses
 */
export const API_ERRORS = {
  NOT_FOUND: () => createApiError(404, "Presentation not found", "NOT_FOUND"),
  PERMISSION_DENIED: () =>
    createApiError(403, "Permission denied", "PERMISSION_DENIED"),
  INVALID_ARGUMENT: () =>
    createApiError(400, "Invalid argument", "INVALID_ARGUMENT"),
  UNAUTHENTICATED: () =>
    createApiError(401, "Unauthenticated", "UNAUTHENTICATED"),
};

/**
 * Reset all mocks
 */
export function resetMockSlidesClient(client: slides_v1.Slides): void {
  (client.presentations.create as jest.Mock).mockClear();
  (client.presentations.get as jest.Mock).mockClear();
  (client.presentations.batchUpdate as jest.Mock).mockClear();
  (client.presentations.pages.get as jest.Mock).mockClear();
  (client.presentations.pages.getThumbnail as jest.Mock).mockClear();
}
