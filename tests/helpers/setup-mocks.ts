/**
 * Global mock setup for tests
 */

/**
 * Setup environment variables for tests
 */
export function setupTestEnv(): void {
  process.env.GOOGLE_CLIENT_ID = "test-client-id.apps.googleusercontent.com";
  process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
  process.env.GOOGLE_REDIRECT_URI = "http://localhost:3000/oauth2callback";
  process.env.NODE_ENV = "test";
}

/**
 * Clean up environment variables after tests
 */
export function cleanupTestEnv(): void {
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
  delete process.env.GOOGLE_REDIRECT_URI;
}

/**
 * Mock console.error to avoid noise in test output
 */
export function mockConsoleError(): any {
  return jest.spyOn(console, "error").mockImplementation(() => {});
}

/**
 * Restore console.error
 */
export function restoreConsoleError(spy: any): void {
  spy.mockRestore();
}

/**
 * Mock the 'open' package for browser launching
 */
export function mockOpenPackage(): any {
  const mockOpen = jest.fn().mockResolvedValue(undefined);
  jest.mock("open", () => ({
    __esModule: true,
    default: mockOpen,
  }));
  return mockOpen;
}
