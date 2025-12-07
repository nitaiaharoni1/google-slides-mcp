/**
 * Element-related MCP tools
 * Delete elements from slides
 */

import { ensureSlidesClient } from "../slides";
import { MCPToolDefinition } from "../types/mcp";
import { DeleteElementArgs } from "../types/slides";
import { invalidatePresentationCache } from "../utils/cache";
import { retryWithBackoff } from "../utils/error-handling";
import { logger } from "../utils/logger";
import { createStringParam } from "../utils/schema-builder";
import {
  PRESENTATION_ID_EXAMPLES,
  ELEMENT_ID_EXAMPLES,
} from "../config/examples";

/**
 * Delete one or more elements from a slide
 */
const deleteElement = async (args: DeleteElementArgs) => {
  const slides = await ensureSlidesClient();

  logger.progress(`🗑️  Deleting ${args.objectIds.length} element(s)`);

  const requests = args.objectIds.map((objectId) => ({
    deleteObject: {
      objectId,
    },
  }));

  // Execute with retry logic
  await retryWithBackoff(async () => {
    await slides.presentations.batchUpdate({
      presentationId: args.presentationId,
      requestBody: { requests },
    });
  });

  // Invalidate cache after mutation
  invalidatePresentationCache(args.presentationId);

  logger.success(`✅ Deleted ${args.objectIds.length} element(s)`);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            objectIds: args.objectIds,
            presentationId: args.presentationId,
            message: `${args.objectIds.length} element(s) deleted successfully`,
          },
          null,
          2
        ),
      },
    ],
  };
};

// Tool definitions
export const elementTools: MCPToolDefinition[] = [
  {
    name: "delete_element",
    description:
      "Delete one or more elements (text box, image, shape, etc.) from a slide. Example: Remove elements by their objectIds. Use this to clean up slides or remove unwanted elements. Single delete operations will be a single element in the array.",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        objectIds: {
          type: "array",
          items: createStringParam({
            description: "The ID of the element to delete",
            examples: ELEMENT_ID_EXAMPLES,
          }),
          description:
            "Array of element IDs to delete. Example: ['textbox_123', 'image_456']",
        },
      },
      required: ["presentationId", "objectIds"],
    },
    handler: deleteElement,
  },
];
