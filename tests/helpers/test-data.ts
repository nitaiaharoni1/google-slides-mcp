/**
 * Test data fixtures for Google Slides MCP tests
 */

import { Credentials } from "google-auth-library";

export const TEST_PRESENTATION_ID = "test-pres-123";
export const TEST_SLIDE_ID = "slide-123";
export const TEST_OBJECT_ID = "object-123";
export const TEST_LAYOUT_ID = "layout-123";
export const TEST_MASTER_ID = "master-123";

export const TEST_CLIENT_ID = "test-client-id.apps.googleusercontent.com";
export const TEST_CLIENT_SECRET = "test-client-secret";
export const TEST_REDIRECT_URI = "http://localhost:3000/oauth2callback";

export const TEST_ACCESS_TOKEN = "test-access-token-12345";
export const TEST_REFRESH_TOKEN = "test-refresh-token-12345";

export const createTestCredentials = (): Credentials => ({
  access_token: TEST_ACCESS_TOKEN,
  refresh_token: TEST_REFRESH_TOKEN,
  expiry_date: Date.now() + 3600000, // 1 hour from now
  token_type: "Bearer",
  scope: "https://www.googleapis.com/auth/presentations",
});

export const createExpiredCredentials = (): Credentials => ({
  access_token: TEST_ACCESS_TOKEN,
  refresh_token: TEST_REFRESH_TOKEN,
  expiry_date: Date.now() - 3600000, // 1 hour ago
  token_type: "Bearer",
  scope: "https://www.googleapis.com/auth/presentations",
});

export const TEST_AUTH_CODE = "4/0AbCDefGHIjKlMnOpQrStUvWxYz123456789";

export const TEST_PRESENTATION_TITLE = "Test Presentation";

export const TEST_TEXT_CONTENT = "Hello, World!";

export const TEST_IMAGE_URL = "https://example.com/image.png";

export const TEST_SHAPE_TYPE = "RECTANGLE";

