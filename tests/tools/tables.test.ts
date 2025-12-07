/**
 * Table Tools Unit Tests
 * Tests for create table, update cells, insert/delete rows
 */

import { tableTools } from "../../src/tools/tables";
import { ensureSlidesClient } from "../../src/slides";
import { createMockSlidesClient } from "../helpers/mock-api";
import {
  TEST_PRESENTATION_ID,
  TEST_OBJECT_ID,
  TEST_TEXT_CONTENT,
} from "../helpers/test-data";
import { mockConsoleError, restoreConsoleError } from "../helpers/setup-mocks";

// Mock slides module
jest.mock("../../src/slides", () => ({
  ensureSlidesClient: jest.fn(),
}));

describe("Table Tools", () => {
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

  describe("update_table_cell", () => {
    const tool = tableTools.find((t) => t.name === "update_table_cell")!;

    test("should have correct tool definition", () => {
      expect(tool).toBeDefined();
      expect(tool.name).toBe("update_table_cell");
      expect(tool.inputSchema.required).toContain("rowIndex");
      expect(tool.inputSchema.required).toContain("columnIndex");
    });

    test("should update table cell", async () => {
      const args = {
        presentationId: TEST_PRESENTATION_ID,
        objectId: TEST_OBJECT_ID,
        rowIndex: 0,
        columnIndex: 0,
        text: TEST_TEXT_CONTENT,
      };

      const result = await tool.handler(args);

      expect(mockSlidesClient.presentations.batchUpdate).toHaveBeenCalled();
      expect(result).toBeValidMCPResult();

      const firstContent = result.content[0];
      if (firstContent.type === "text") {
        const content = JSON.parse(firstContent.text);
        expect(content.success).toBe(true);
      }
    });
  });

  describe("insert_table_rows", () => {
    const tool = tableTools.find((t) => t.name === "insert_table_rows")!;

    test("should have correct tool definition", () => {
      expect(tool).toBeDefined();
      expect(tool.name).toBe("insert_table_rows");
      expect(tool.inputSchema.required).toContain("rowIndex");
      expect(tool.inputSchema.required).toContain("numRows");
    });

    test("should insert table rows", async () => {
      const args = {
        presentationId: TEST_PRESENTATION_ID,
        objectId: TEST_OBJECT_ID,
        rowIndex: 1,
        numRows: 2,
      };

      const result = await tool.handler(args);

      expect(mockSlidesClient.presentations.batchUpdate).toHaveBeenCalled();
      expect(result).toBeValidMCPResult();
    });
  });

  describe("delete_table_rows", () => {
    const tool = tableTools.find((t) => t.name === "delete_table_rows")!;

    test("should have correct tool definition", () => {
      expect(tool).toBeDefined();
      expect(tool.name).toBe("delete_table_rows");
    });

    test("should delete table rows", async () => {
      const args = {
        presentationId: TEST_PRESENTATION_ID,
        objectId: TEST_OBJECT_ID,
        rowIndex: 1,
        numRows: 1,
      };

      const result = await tool.handler(args);

      expect(mockSlidesClient.presentations.batchUpdate).toHaveBeenCalled();
      expect(result).toBeValidMCPResult();
    });
  });
});
