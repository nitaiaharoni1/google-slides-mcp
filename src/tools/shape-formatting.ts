/**
 * Shape formatting MCP tools
 * Apply formatting to shapes
 */

import { ensureSlidesClient } from "../slides";
import { MCPToolDefinition } from "../types/mcp";
import { FormatShapeArgs } from "../types/slides";
import { invalidatePresentationCache } from "../utils/cache";
import { retryWithBackoff } from "../utils/error-handling";
import { logger } from "../utils/logger";
import { createStringParam, createNumberParam } from "../utils/schema-builder";
import {
  PRESENTATION_ID_EXAMPLES,
  ELEMENT_ID_EXAMPLES,
} from "../config/examples";

/**
 * Format a shape (fill color, border, etc.)
 */
const formatShape = async (args: FormatShapeArgs) => {
  const slides = await ensureSlidesClient();

  const formatDetails: string[] = [];
  if (args.fillColor) formatDetails.push("fill");
  if (args.outline)
    formatDetails.push(`outline (${args.outline.weight || "default"}pt)`);
  if (args.shadow) formatDetails.push("shadow");

  logger.progress(
    `🎨 Formatting shape: ${args.objectId.substring(0, 20)}... [${formatDetails.join(", ")}]`
  );

  const requests: Array<Record<string, unknown>> = [];

  // Build updateShapeProperties request
  const shapeProperties: Record<string, unknown> = {};

  if (args.fillColor !== undefined) {
    shapeProperties.shapeBackgroundFill = {
      solidFill: {
        color: args.fillColor,
      },
    };
    if (args.fillColor.rgbColor) {
      logger.debug(
        `   Fill: RGB(${args.fillColor.rgbColor.red?.toFixed(2)}, ${args.fillColor.rgbColor.green?.toFixed(2)}, ${args.fillColor.rgbColor.blue?.toFixed(2)})`
      );
    }
  }

  if (args.outline !== undefined) {
    shapeProperties.outline = {
      ...(args.outline.color && {
        outlineFill: { solidFill: { color: args.outline.color } },
      }),
      ...(args.outline.weight !== undefined && {
        weight: { magnitude: args.outline.weight, unit: "PT" },
      }),
    };
  }

  if (args.shadow !== undefined) {
    // Note: Shadow support may be limited in the Google Slides API.
    // Some shadow properties may be read-only. If shadow formatting fails,
    // it may indicate that the API doesn't support programmatic shadow modification.
    const shadowProperties: Record<string, unknown> = {};

    // Shadow type (defaults to OUTER if not specified)
    shadowProperties.type = args.shadow.type || "OUTER";

    // Shadow color and opacity
    if (args.shadow.color) {
      const shadowColor: Record<string, unknown> = {};

      if (args.shadow.color.rgbColor) {
        shadowColor.rgbColor = args.shadow.color.rgbColor;
      }

      // Alpha/opacity (0-1), defaults to 0.3 for subtle shadow
      const alpha =
        args.shadow.color.alpha !== undefined ? args.shadow.color.alpha : 0.3;
      shadowColor.alpha = alpha;

      shadowProperties.shadowColor = shadowColor;
    } else {
      // Default shadow color (dark gray with opacity)
      shadowProperties.shadowColor = {
        rgbColor: { red: 0, green: 0, blue: 0 },
        alpha: 0.3,
      };
    }

    // Blur radius (in points)
    if (args.shadow.blurRadius !== undefined) {
      shadowProperties.blurRadius = {
        magnitude: args.shadow.blurRadius,
        unit: "PT",
      };
    } else {
      // Default blur radius
      shadowProperties.blurRadius = {
        magnitude: 4,
        unit: "PT",
      };
    }

    // Shadow offset (in points)
    if (
      args.shadow.offsetX !== undefined ||
      args.shadow.offsetY !== undefined
    ) {
      shadowProperties.offset = {
        x: {
          magnitude:
            args.shadow.offsetX !== undefined ? args.shadow.offsetX : 2,
          unit: "PT",
        },
        y: {
          magnitude:
            args.shadow.offsetY !== undefined ? args.shadow.offsetY : 2,
          unit: "PT",
        },
      };
    } else {
      // Default offset (slight bottom-right shadow)
      shadowProperties.offset = {
        x: { magnitude: 2, unit: "PT" },
        y: { magnitude: 2, unit: "PT" },
      };
    }

    // Rotation angle (in degrees) - Note: API may expect this in a different format
    if (args.shadow.rotation !== undefined) {
      shadowProperties.rotationAngle = {
        magnitude: args.shadow.rotation,
        unit: "PT", // Note: API may require different unit or format
      };
    }

    shapeProperties.shadow = shadowProperties;

    if (args.shadow.color?.rgbColor) {
      logger.debug(
        `   Shadow: ${args.shadow.type || "OUTER"}, RGB(${args.shadow.color.rgbColor.red?.toFixed(2)}, ${args.shadow.color.rgbColor.green?.toFixed(2)}, ${args.shadow.color.rgbColor.blue?.toFixed(2)}), opacity: ${args.shadow.color.alpha !== undefined ? args.shadow.color.alpha : 0.3}`
      );
    }
  }

  if (Object.keys(shapeProperties).length > 0) {
    requests.push({
      updateShapeProperties: {
        objectId: args.objectId,
        shapeProperties,
        fields: Object.keys(shapeProperties).join(","),
      },
    });
  }

  if (requests.length === 0) {
    throw new Error("No formatting properties provided");
  }

  // Execute with retry logic
  try {
    await retryWithBackoff(async () => {
      await slides.presentations.batchUpdate({
        presentationId: args.presentationId,
        requestBody: { requests },
      });
    });

    // Invalidate cache after mutation
    invalidatePresentationCache(args.presentationId);

    logger.success(`✅ Shape formatted successfully`);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              success: true,
              objectId: args.objectId,
              presentationId: args.presentationId,
              message: "Shape formatted successfully",
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`❌ Failed to format shape: ${errorMessage}`);

    // Log the full request for debugging
    if (
      errorMessage.includes("Invalid JSON") ||
      errorMessage.includes("Cannot find field")
    ) {
      logger.debug(
        `   Debug - Request payload: ${JSON.stringify(requests, null, 2)}`
      );
    }

    throw error;
  }
};

// Tool definitions
export const shapeFormattingTools: MCPToolDefinition[] = [
  {
    name: "format_shape",
    description:
      "Apply formatting to a shape (fill color, outline/border, shadow) in a Google Slides presentation. Example: Fill rectangle with blue and add black border (fillColor={rgbColor: {red: 0.2, green: 0.4, blue: 0.8}}, outline={color: {rgbColor: {red: 0, green: 0, blue: 0}}, weight: 2}). Example with shadow: Add shadow to shape (shadow={type: 'OUTER', color: {rgbColor: {red: 0, green: 0, blue: 0}, alpha: 0.3}, blurRadius: 4, offsetX: 2, offsetY: 2}).",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        objectId: createStringParam({
          description: "The ID of the shape",
          examples: ELEMENT_ID_EXAMPLES,
        }),
        fillColor: {
          type: "object",
          description:
            "Fill color as RGB object. Example: {rgbColor: {red: 0.2, green: 0.4, blue: 0.8}} for blue",
          properties: {
            rgbColor: {
              type: "object",
              description: "RGB color values (0-1)",
              properties: {
                red: createNumberParam({
                  description: "Red component (0-1)",
                  minimum: 0,
                  maximum: 1,
                  examples: [0, 0.2, 0.9],
                }),
                green: createNumberParam({
                  description: "Green component (0-1)",
                  minimum: 0,
                  maximum: 1,
                  examples: [0, 0.4, 0.7],
                }),
                blue: createNumberParam({
                  description: "Blue component (0-1)",
                  minimum: 0,
                  maximum: 1,
                  examples: [0, 0.8, 1],
                }),
              },
            },
          },
        },
        outline: {
          type: "object",
          description:
            "Outline/border properties. Example: {color: {rgbColor: {red: 0, green: 0, blue: 0}}, weight: 2} for 2pt black border",
          properties: {
            color: {
              type: "object",
              description: "Outline color",
              properties: {
                rgbColor: {
                  type: "object",
                  description: "RGB color values (0-1)",
                  properties: {
                    red: createNumberParam({
                      description: "Red component (0-1)",
                      minimum: 0,
                      maximum: 1,
                    }),
                    green: createNumberParam({
                      description: "Green component (0-1)",
                      minimum: 0,
                      maximum: 1,
                    }),
                    blue: createNumberParam({
                      description: "Blue component (0-1)",
                      minimum: 0,
                      maximum: 1,
                    }),
                  },
                },
              },
            },
            weight: createNumberParam({
              description: "Outline weight in points",
              minimum: 0,
              maximum: 20,
              examples: [1, 2, 5],
            }),
          },
        },
        shadow: {
          type: "object",
          description:
            "Shadow properties. Example: {type: 'OUTER', color: {rgbColor: {red: 0, green: 0, blue: 0}, alpha: 0.3}, blurRadius: 4, offsetX: 2, offsetY: 2}",
          properties: {
            type: createStringParam({
              description: "Shadow type: OUTER (default) or INNER",
              enum: ["OUTER", "INNER"],
              examples: ["OUTER", "INNER"],
            }),
            color: {
              type: "object",
              description: "Shadow color and opacity",
              properties: {
                rgbColor: {
                  type: "object",
                  description: "RGB color values (0-1)",
                  properties: {
                    red: createNumberParam({
                      description: "Red component (0-1)",
                      minimum: 0,
                      maximum: 1,
                      examples: [0, 0.2, 0.5],
                    }),
                    green: createNumberParam({
                      description: "Green component (0-1)",
                      minimum: 0,
                      maximum: 1,
                      examples: [0, 0.2, 0.5],
                    }),
                    blue: createNumberParam({
                      description: "Blue component (0-1)",
                      minimum: 0,
                      maximum: 1,
                      examples: [0, 0.2, 0.5],
                    }),
                  },
                },
                alpha: createNumberParam({
                  description: "Shadow opacity (0-1). Default: 0.3",
                  minimum: 0,
                  maximum: 1,
                  examples: [0.2, 0.3, 0.5, 0.8],
                }),
              },
            },
            blurRadius: createNumberParam({
              description: "Blur radius in points. Default: 4",
              minimum: 0,
              maximum: 50,
              examples: [2, 4, 8, 12],
            }),
            offsetX: createNumberParam({
              description: "Horizontal offset in points. Default: 2",
              minimum: -50,
              maximum: 50,
              examples: [-5, 0, 2, 5],
            }),
            offsetY: createNumberParam({
              description: "Vertical offset in points. Default: 2",
              minimum: -50,
              maximum: 50,
              examples: [-5, 0, 2, 5],
            }),
            rotation: createNumberParam({
              description: "Rotation angle in degrees. Optional",
              minimum: 0,
              maximum: 360,
              examples: [0, 45, 90, 180],
            }),
          },
        },
      },
      required: ["presentationId", "objectId"],
    },
    handler: formatShape,
  },
];
