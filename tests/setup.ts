/**
 * Jest Test Setup
 * Global configuration and utilities for Google Slides MCP testing
 */

import * as dotenv from "dotenv";
import {
  toBeValidMCPResult,
  toBeMCPError,
  toHaveValidJSONContent,
} from "./helpers/matchers";
import { setupTestEnv } from "./helpers/setup-mocks";

// Load environment variables
dotenv.config();

// Setup test environment variables
setupTestEnv();

// Global test timeout for API operations
jest.setTimeout(30000);

// Global teardown
afterAll(async () => {
  // Allow time for async operations to complete
  await new Promise((resolve) => setTimeout(resolve, 500));
});

// Test utilities
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeValidMCPResult(): R;
      toBeMCPError(): R;
      toHaveValidJSONContent(): R;
    }
  }
}

// Custom matchers for MCP results
expect.extend({
  toBeValidMCPResult,
  toBeMCPError,
  toHaveValidJSONContent,
});

export {};
