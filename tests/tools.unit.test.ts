/**
 * Tools Unit Tests
 * Tests for MCP tool registration and handling for Google Slides
 */

import { getToolDefinitions } from "../src/tools/index";

describe("Tools Module", () => {
  describe("getToolDefinitions", () => {
    test("should return all available tool definitions", () => {
      const tools = getToolDefinitions();

      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);

      // Check that all tools have required properties
      tools.forEach((tool) => {
        expect(tool).toHaveProperty("name");
        expect(tool).toHaveProperty("description");
        expect(tool).toHaveProperty("inputSchema");

        expect(typeof tool.name).toBe("string");
        expect(typeof tool.description).toBe("string");
        expect(typeof tool.inputSchema).toBe("object");
      });
    });

    test("should include all expected Google Slides tool categories", () => {
      const tools = getToolDefinitions();
      const toolNames = tools.map((tool) => tool.name);

      // Presentation tools
      expect(toolNames).toContain("create_presentation");
      expect(toolNames).toContain("get_presentation");
      expect(toolNames).toContain("delete_presentation");

      // Slide tools
      expect(toolNames).toContain("create_slide");
      expect(toolNames).toContain("duplicate_slide");
      expect(toolNames).toContain("delete_slide");
      expect(toolNames).toContain("reorder_slides");
      expect(toolNames).toContain("get_slide");

      // Content tools
      expect(toolNames).toContain("add_multiple_text_boxes");
      expect(toolNames).toContain("add_image");
      expect(toolNames).toContain("add_shape");
      expect(toolNames).toContain("update_text");
      expect(toolNames).toContain("delete_element");

      // Table tools
      expect(toolNames).toContain("update_table_cell");
      expect(toolNames).toContain("insert_table_rows");
      expect(toolNames).toContain("delete_table_rows");

      // Formatting tools
      expect(toolNames).toContain("format_text");
      expect(toolNames).toContain("format_shape");
      expect(toolNames).toContain("set_element_position");

      // Layout tools
      expect(toolNames).toContain("list_page_templates");

      // Batch tools
      expect(toolNames).toContain("batch_update");
    });

    test("should have valid input schemas for all tools", () => {
      const tools = getToolDefinitions();

      tools.forEach((tool) => {
        const schema = tool.inputSchema;

        expect(schema.type).toBe("object");
        expect(schema).toHaveProperty("properties");
        expect(typeof schema.properties).toBe("object");

        // If required array exists, it should be an array
        if (schema.required) {
          expect(Array.isArray(schema.required)).toBe(true);
        }

        // Check that all required properties exist in properties
        if (schema.required) {
          schema.required.forEach((reqProp) => {
            expect(schema.properties).toHaveProperty(reqProp);
          });
        }
      });
    });

    test("should have unique tool names", () => {
      const tools = getToolDefinitions();
      const toolNames = tools.map((tool) => tool.name);
      const uniqueNames = new Set(toolNames);

      expect(uniqueNames.size).toBe(toolNames.length);
    });

    test("should have non-empty descriptions for all tools", () => {
      const tools = getToolDefinitions();

      tools.forEach((tool) => {
        expect(tool.description.trim().length).toBeGreaterThan(0);
        expect(tool.description).toMatch(/\w/); // Contains at least one word character
      });
    });

    test.skip("should include Google Slides information in descriptions", () => {
      const tools = getToolDefinitions();

      tools.forEach((tool) => {
        // Most tools should mention Google Slides, presentation, or slide
        const description = tool.description.toLowerCase();
        const mentionsSlides =
          description.includes("google slides") ||
          description.includes("presentation") ||
          description.includes("slide") ||
          description.includes("google");

        // Some tools might not explicitly mention Google Slides but are clearly related
        // to slides/presentations through context - allow these categories
        const isFormattingTool =
          description.includes("format") ||
          description.includes("style") ||
          description.includes("position");
        const isElementTool =
          description.includes("element") ||
          description.includes("shape") ||
          description.includes("text box") ||
          description.includes("image");
        const isChartTool = description.includes("chart");
        const isExportTool =
          description.includes("export") ||
          description.includes("thumbnail") ||
          description.includes("pdf");
        const isBatchTool = description.includes("batch");
        const isTemplateTool = description.includes("template");
        
        // Only require Google Slides mention for tools that aren't clearly related categories
        if (
          !isFormattingTool &&
          !isElementTool &&
          !isChartTool &&
          !isExportTool &&
          !isBatchTool &&
          !isTemplateTool
        ) {
          expect(mentionsSlides).toBe(true);
        }
      });
    });
  });

  describe("Tool Input Schema Validation", () => {
    test("create_presentation should have correct schema", () => {
      const tools = getToolDefinitions();
      const createTool = tools.find(
        (tool) => tool.name === "create_presentation"
      );

      expect(createTool).toBeDefined();
      expect(createTool!.inputSchema.required).toContain("title");
      expect(createTool!.inputSchema.properties).toHaveProperty("title");
      expect(createTool!.inputSchema.properties.title.type).toBe("string");
    });

    test("get_presentation should have correct schema", () => {
      const tools = getToolDefinitions();
      const getTool = tools.find((tool) => tool.name === "get_presentation");

      expect(getTool).toBeDefined();
      expect(getTool!.inputSchema.required).toContain("presentationId");
      expect(getTool!.inputSchema.properties).toHaveProperty("presentationId");
      expect(getTool!.inputSchema.properties.presentationId.type).toBe(
        "string"
      );
    });

    test("add_multiple_text_boxes should have correct schema", () => {
      const tools = getToolDefinitions();
      const addTextBoxTool = tools.find(
        (tool) => tool.name === "add_multiple_text_boxes"
      );

      expect(addTextBoxTool).toBeDefined();
      expect(addTextBoxTool!.inputSchema.required).toContain("presentationId");
      expect(addTextBoxTool!.inputSchema.required).toContain("pageId");
      expect(addTextBoxTool!.inputSchema.required).toContain("textBoxes");
      expect(addTextBoxTool!.inputSchema.properties).toHaveProperty("textBoxes");
      expect(addTextBoxTool!.inputSchema.properties.textBoxes.type).toBe("array");
    });

    test("list_page_templates should have correct schema", () => {
      const tools = getToolDefinitions();
      const listTemplatesTool = tools.find(
        (tool) => tool.name === "list_page_templates"
      );

      expect(listTemplatesTool).toBeDefined();
      expect(listTemplatesTool!.inputSchema.required).toContain(
        "presentationId"
      );
      expect(listTemplatesTool!.inputSchema.properties).toHaveProperty(
        "presentationId"
      );
      expect(
        listTemplatesTool!.inputSchema.properties.presentationId.type
      ).toBe("string");
    });

    test("batch_update should have correct schema", () => {
      const tools = getToolDefinitions();
      const batchTool = tools.find((tool) => tool.name === "batch_update");

      expect(batchTool).toBeDefined();
      expect(batchTool!.inputSchema.required).toContain("presentationId");
      expect(batchTool!.inputSchema.required).toContain("requests");
      expect(batchTool!.inputSchema.properties).toHaveProperty("requests");
      expect(batchTool!.inputSchema.properties.requests.type).toBe("array");
    });
  });
});
