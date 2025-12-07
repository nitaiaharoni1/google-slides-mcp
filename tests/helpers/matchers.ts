/**
 * Custom Jest matchers for MCP results
 */

/**
 * Custom matcher to check if result is a valid MCP result
 */
export function toBeValidMCPResult(received: any): jest.CustomMatcherResult {
  const pass =
    received &&
    typeof received === "object" &&
    Array.isArray(received.content) &&
    received.content.length > 0 &&
    received.content.every(
      (item: any) => item.type === "text" || item.type === "image"
    );

  if (pass) {
    return {
      message: () =>
        `Expected ${JSON.stringify(received)} not to be a valid MCP result`,
      pass: true,
    };
  } else {
    return {
      message: () =>
        `Expected ${JSON.stringify(received)} to be a valid MCP result with content array containing text or image items`,
      pass: false,
    };
  }
}

/**
 * Custom matcher to check if result is an error result
 */
export function toBeMCPError(received: any): jest.CustomMatcherResult {
  const pass =
    received &&
    typeof received === "object" &&
    received.isError === true &&
    Array.isArray(received.content) &&
    received.content.length > 0;

  if (pass) {
    return {
      message: () =>
        `Expected ${JSON.stringify(received)} not to be an MCP error result`,
      pass: true,
    };
  } else {
    return {
      message: () =>
        `Expected ${JSON.stringify(received)} to be an MCP error result with isError: true`,
      pass: false,
    };
  }
}

/**
 * Custom matcher to check if result contains valid JSON text
 */
export function toHaveValidJSONContent(
  received: any
): jest.CustomMatcherResult {
  if (!received || !received.content || !Array.isArray(received.content)) {
    return {
      message: () => `Expected result to have content array`,
      pass: false,
    };
  }

  const textContent = received.content.find(
    (item: any) => item.type === "text"
  );
  if (!textContent) {
    return {
      message: () => `Expected result to have text content`,
      pass: false,
    };
  }

  try {
    JSON.parse(textContent.text);
    return {
      message: () => `Expected text content not to be valid JSON`,
      pass: true,
    };
  } catch {
    return {
      message: () => `Expected text content to be valid JSON`,
      pass: false,
    };
  }
}

/**
 * Extend Jest matchers
 */
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidMCPResult(): R;
      toBeMCPError(): R;
      toHaveValidJSONContent(): R;
    }
  }
}
