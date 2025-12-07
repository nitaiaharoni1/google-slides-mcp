/**
 * Utility Tests
 * Tests for utility functions and helpers
 */

import { createErrorResult } from "../src/tools/index";
import { CONVERSION } from "../src/config/constants";

describe("Utilities", () => {
  describe("createErrorResult", () => {
    test("should create error result with message", () => {
      const errorMessage = "Test error message";
      const result = createErrorResult(errorMessage);

      expect(result.isError).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.content.length).toBe(1);
      expect(result.content[0].type).toBe("text");

      const firstContent = result.content[0];
      if (firstContent.type === "text") {
        const errorData = JSON.parse(firstContent.text);
        expect(errorData.message).toBe(errorMessage);
        expect(errorData.error).toBe("Error"); // Default error type
      }
    });

    test("should create valid MCP error format", () => {
      const result = createErrorResult("Error occurred");

      expect(result).toBeMCPError();
      const firstContent = result.content[0];
      if (firstContent.type === "text") {
        expect(firstContent.text).toBeDefined();
      }
    });
  });

  describe("CONVERSION constants", () => {
    test("should have correct EMU conversion values", () => {
      expect(CONVERSION.EMU_PER_INCH).toBe(914400);
      expect(CONVERSION.EMU_PER_POINT).toBe(12700);
      expect(CONVERSION.PT_PER_INCH).toBe(72);
    });

    test("should convert points to EMU correctly", () => {
      const points = 10;
      const emu = points * CONVERSION.EMU_PER_POINT;
      expect(emu).toBe(127000);
    });
  });
});
