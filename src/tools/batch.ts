/**
 * Batch update MCP tool
 * Execute multiple updates atomically
 */

import { ensureSlidesClient } from "../slides";
import { SLIDES_LIMITS } from "../config/constants";
import { MCPToolDefinition } from "../types/mcp";
import { BatchUpdateArgs } from "../types/slides";
import { logger } from "../utils/logger";
import { createStringParam } from "../utils/schema-builder";
import { PRESENTATION_ID_EXAMPLES } from "../config/examples";

/**
 * Execute batch update with multiple requests
 */
const batchUpdate = async (args: BatchUpdateArgs) => {
  const slides = await ensureSlidesClient();

  if (args.requests.length === 0) {
    throw new Error("No requests provided for batch update");
  }

  if (args.requests.length > SLIDES_LIMITS.MAX_BATCH_REQUESTS) {
    throw new Error(
      `Too many requests. Maximum is ${SLIDES_LIMITS.MAX_BATCH_REQUESTS}, got ${args.requests.length}`
    );
  }

  logger.progress(
    `🔄 Executing batch update with ${args.requests.length} request(s)`
  );

  const response = await slides.presentations.batchUpdate({
    presentationId: args.presentationId,
    requestBody: {
      requests: args.requests,
    },
  });

  logger.success(`✅ Batch update completed`);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            presentationId: args.presentationId,
            numRequests: args.requests.length,
            replies: response.data.replies?.map((reply, index) => {
              // Type-safe access to reply properties
              const replyObj = reply as {
                createSlide?: unknown;
                createShape?: unknown;
                createImage?: unknown;
                createTable?: unknown;
                duplicateObject?: unknown;
                updateTextStyle?: unknown;
                updateShapeProperties?: unknown;
                insertText?: unknown;
                deleteObject?: unknown;
              };

              const result: Record<string, unknown> = { index };

              if (replyObj.createSlide) {
                result.createSlide = replyObj.createSlide;
              }
              if (replyObj.createShape) {
                result.createShape = replyObj.createShape;
              }
              if (replyObj.createImage) {
                result.createImage = replyObj.createImage;
              }
              if (replyObj.createTable) {
                result.createTable = replyObj.createTable;
              }
              if (replyObj.duplicateObject) {
                result.duplicateObject = replyObj.duplicateObject;
              }
              if (replyObj.updateTextStyle) {
                result.updateTextStyle = "success";
              }
              if (replyObj.updateShapeProperties) {
                result.updateShapeProperties = "success";
              }
              if (replyObj.insertText) {
                result.insertText = "success";
              }
              if (replyObj.deleteObject) {
                result.deleteObject = "success";
              }

              return result;
            }),
            writeControl: response.data.writeControl,
          },
          null,
          2
        ),
      },
    ],
  };
};

// Tool definitions
export const batchTools: MCPToolDefinition[] = [
  {
    name: "batch_update",
    description:
      "Execute multiple Google Slides update requests atomically in a single batch operation. Useful for complex custom operations that require precise control. Maximum 50 requests per batch. Example: Batch create multiple shapes and format them in one call.",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        requests: {
          type: "array",
          description:
            "Array of request objects. Each request should be a valid Google Slides API request (createSlide, createShape, insertText, updateTextStyle, etc.). Example: [{createShape: {...}}, {insertText: {...}}]",
          items: {
            type: "object",
            description: "A Google Slides API request object",
          },
        },
      },
      required: ["presentationId", "requests"],
    },
    handler: batchUpdate,
  },
];
