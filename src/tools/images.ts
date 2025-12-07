/**
 * Image-related MCP tools
 * Add images to slides and update image properties
 */

import * as crypto from "crypto";
import { ensureSlidesClient } from "../slides";
import { MCPToolDefinition } from "../types/mcp";
import {
  AddImageArgs,
  UpdateImagePropertiesArgs,
  ReplaceImageArgs,
} from "../types/slides";
import {
  validateAndClampBounds,
  validateAndClampBoundsWithAspectRatio,
  getSlideSize,
} from "../utils/bounds";
import { invalidatePresentationCache } from "../utils/cache";
import { SPACING } from "../config/design-system";
import { retryWithBackoff } from "../utils/error-handling";
import { logger } from "../utils/logger";
import {
  createXPositionParam,
  createYPositionParam,
  createWidthParam,
  createHeightParam,
  createStringParam,
  createBooleanParam,
  createNumberParam,
} from "../utils/schema-builder";
import {
  PRESENTATION_ID_EXAMPLES,
  SLIDE_ID_EXAMPLES,
  ELEMENT_ID_EXAMPLES,
} from "../config/examples";
import { ptToEmu } from "./utils";

/**
 * Add an image to a slide
 */
export const addImage = async (args: AddImageArgs) => {
  const slides = await ensureSlidesClient();

  logger.progress(`🖼️  Adding image to slide: ${args.pageId}`);

  const objectId = `image_${crypto.randomUUID()}`;

  // Get default or provided values in points (using design system)
  const defaultX = SPACING.MARGIN;
  const defaultY = SPACING.MARGIN;
  const defaultWidth = 400;
  const defaultHeight = 300;

  const xPt = args.x !== undefined ? args.x : defaultX;
  const yPt = args.y !== undefined ? args.y : defaultY;
  const widthPt = args.width !== undefined ? args.width : defaultWidth;
  const heightPt = args.height !== undefined ? args.height : defaultHeight;

  // Get slide dimensions for dynamic validation
  const slideDimensionsResult = await getSlideSize(slides, args.presentationId);
  const slideDimensions =
    slideDimensionsResult instanceof Error
      ? { width: 720, height: 405 }
      : slideDimensionsResult;

  // Validate and clamp bounds - preserve aspect ratio if requested
  const boundsResult = args.preserveAspectRatio
    ? validateAndClampBoundsWithAspectRatio(
        xPt,
        yPt,
        widthPt,
        heightPt,
        slideDimensions
      )
    : validateAndClampBounds(xPt, yPt, widthPt, heightPt, slideDimensions);

  // Convert validated points to EMU
  const x = ptToEmu(boundsResult.x);
  const y = ptToEmu(boundsResult.y);
  const width = ptToEmu(boundsResult.width);
  const height = ptToEmu(boundsResult.height);

  // Build elementProperties with optional title and description for accessibility
  const elementProperties: Record<string, unknown> = {
    pageObjectId: args.pageId,
    size: {
      height: { magnitude: height, unit: "EMU" },
      width: { magnitude: width, unit: "EMU" },
    },
    transform: {
      scaleX: 1,
      scaleY: 1,
      shearX: 0,
      shearY: 0,
      translateX: x,
      translateY: y,
      unit: "EMU",
    },
  };

  // Add title and description for accessibility (alt text)
  if (args.title !== undefined) {
    elementProperties.title = args.title;
  }
  if (args.description !== undefined) {
    elementProperties.description = args.description;
  }

  const requests: Array<Record<string, unknown>> = [
    {
      createImage: {
        objectId,
        url: args.imageUrl,
        elementProperties,
      },
    },
  ];

  // Add image properties if provided
  const imageProperties: Record<string, unknown> = {};

  if (args.outline) {
    const outlineProperties: Record<string, unknown> = {};

    if (args.outline.color) {
      outlineProperties.outlineFill = {
        solidFill: {
          color: args.outline.color,
        },
      };
    }

    if (args.outline.weight !== undefined) {
      outlineProperties.weight = {
        magnitude: args.outline.weight,
        unit: "PT",
      };
    }

    if (args.outline.dashStyle) {
      outlineProperties.dashStyle = args.outline.dashStyle;
    }

    imageProperties.outline = outlineProperties;
  }

  if (args.shadow) {
    const shadowProperties: Record<string, unknown> = {
      type: args.shadow.type || "OUTER",
    };

    if (args.shadow.color) {
      shadowProperties.color = args.shadow.color;
      if (args.shadow.color.alpha !== undefined) {
        shadowProperties.alpha = args.shadow.color.alpha;
      }
    } else {
      // Default shadow color (dark gray with opacity)
      shadowProperties.color = {
        rgbColor: { red: 0, green: 0, blue: 0 },
      };
      shadowProperties.alpha = 0.3;
    }

    if (args.shadow.blurRadius !== undefined) {
      shadowProperties.blurRadius = {
        magnitude: args.shadow.blurRadius,
        unit: "PT",
      };
    }

    if (
      args.shadow.offsetX !== undefined ||
      args.shadow.offsetY !== undefined
    ) {
      shadowProperties.transform = {
        scaleX: 1,
        scaleY: 1,
        shearX: 0,
        shearY: 0,
        translateX: ptToEmu(args.shadow.offsetX || 2),
        translateY: ptToEmu(args.shadow.offsetY || 2),
        unit: "EMU",
      };
    }

    imageProperties.shadow = shadowProperties;
  }

  if (args.link) {
    const linkProperties: Record<string, unknown> = {};

    if (args.link.url) {
      linkProperties.url = args.link.url;
    } else if (args.link.relativeLink) {
      linkProperties.relativeLink = args.link.relativeLink;
    } else if (args.link.pageObjectId) {
      linkProperties.pageObjectId = args.link.pageObjectId;
    } else if (args.link.slideIndex !== undefined) {
      linkProperties.slideIndex = args.link.slideIndex;
    }

    imageProperties.link = linkProperties;
  }

  // Add updateImageProperties request if any properties were specified
  if (Object.keys(imageProperties).length > 0) {
    requests.push({
      updateImageProperties: {
        objectId,
        imageProperties,
        fields: Object.keys(imageProperties).join(","),
      },
    });
  }

  // Execute with retry logic
  await retryWithBackoff(async () => {
    await slides.presentations.batchUpdate({
      presentationId: args.presentationId,
      requestBody: { requests },
    });
  });

  // Invalidate cache after mutation
  invalidatePresentationCache(args.presentationId);

  logger.success(`✅ Added image: ${objectId}`);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            objectId,
            presentationId: args.presentationId,
            pageId: args.pageId,
            imageUrl: args.imageUrl,
          },
          null,
          2
        ),
      },
    ],
  };
};

/**
 * Update image properties (outline, shadow, link)
 */
const updateImageProperties = async (args: UpdateImagePropertiesArgs) => {
  const slides = await ensureSlidesClient();

  logger.progress(`🖼️  Updating image properties: ${args.objectId}`);

  const imageProperties: Record<string, unknown> = {};
  const fields: string[] = [];

  if (args.outline !== undefined) {
    if (args.outline === null) {
      // Remove outline
      imageProperties.outline = {
        propertyState: "NOT_RENDERED",
      };
      fields.push("outline");
    } else {
      const outlineProperties: Record<string, unknown> = {};

      if (args.outline.color) {
        outlineProperties.outlineFill = {
          solidFill: {
            color: args.outline.color,
          },
        };
      }

      if (args.outline.weight !== undefined) {
        outlineProperties.weight = {
          magnitude: args.outline.weight,
          unit: "PT",
        };
      }

      if (args.outline.dashStyle) {
        outlineProperties.dashStyle = args.outline.dashStyle;
      }

      imageProperties.outline = outlineProperties;
      fields.push("outline");
    }
  }

  if (args.shadow !== undefined) {
    if (args.shadow === null) {
      // Remove shadow
      imageProperties.shadow = {
        propertyState: "NOT_RENDERED",
      };
      fields.push("shadow");
    } else {
      const shadowProperties: Record<string, unknown> = {
        type: args.shadow.type || "OUTER",
      };

      if (args.shadow.color) {
        shadowProperties.color = args.shadow.color;
        if (args.shadow.color.alpha !== undefined) {
          shadowProperties.alpha = args.shadow.color.alpha;
        }
      } else {
        // Default shadow color
        shadowProperties.color = {
          rgbColor: { red: 0, green: 0, blue: 0 },
        };
        shadowProperties.alpha = 0.3;
      }

      if (args.shadow.blurRadius !== undefined) {
        shadowProperties.blurRadius = {
          magnitude: args.shadow.blurRadius,
          unit: "PT",
        };
      }

      if (
        args.shadow.offsetX !== undefined ||
        args.shadow.offsetY !== undefined
      ) {
        shadowProperties.transform = {
          scaleX: 1,
          scaleY: 1,
          shearX: 0,
          shearY: 0,
          translateX: ptToEmu(args.shadow.offsetX || 2),
          translateY: ptToEmu(args.shadow.offsetY || 2),
          unit: "EMU",
        };
      }

      imageProperties.shadow = shadowProperties;
      fields.push("shadow");
    }
  }

  if (args.link !== undefined) {
    if (args.link === null) {
      // Remove link - set to empty object
      imageProperties.link = {};
      fields.push("link");
    } else {
      const linkProperties: Record<string, unknown> = {};

      if (args.link.url) {
        linkProperties.url = args.link.url;
      } else if (args.link.relativeLink) {
        linkProperties.relativeLink = args.link.relativeLink;
      } else if (args.link.pageObjectId) {
        linkProperties.pageObjectId = args.link.pageObjectId;
      } else if (args.link.slideIndex !== undefined) {
        linkProperties.slideIndex = args.link.slideIndex;
      }

      imageProperties.link = linkProperties;
      fields.push("link");
    }
  }

  if (fields.length === 0) {
    throw new Error("No image properties provided to update");
  }

  const requests = [
    {
      updateImageProperties: {
        objectId: args.objectId,
        imageProperties,
        fields: fields.join(","),
      },
    },
  ];

  // Execute with retry logic
  await retryWithBackoff(async () => {
    await slides.presentations.batchUpdate({
      presentationId: args.presentationId,
      requestBody: { requests },
    });
  });

  // Invalidate cache after mutation
  invalidatePresentationCache(args.presentationId);

  logger.success(`✅ Updated image properties: ${args.objectId}`);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            objectId: args.objectId,
            presentationId: args.presentationId,
            updatedProperties: fields,
            message: "Image properties updated successfully",
          },
          null,
          2
        ),
      },
    ],
  };
};

// Tool definitions
export const imageTools: MCPToolDefinition[] = [
  {
    name: "add_image",
    description:
      "Add an image to a slide from a URL. All positions and sizes in points. Defaults: x=50, y=50, width=400, height=300. Supports optional outline, shadow, and link properties. Example: Full-width image (x=20, y=100, width=680, height=300). TIP: For multiple elements, use 'batch_update'.",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        pageId: createStringParam({
          description: "The ID of the slide/page",
          examples: SLIDE_ID_EXAMPLES,
        }),
        imageUrl: createStringParam({
          description: "URL of the image to add. Must be publicly accessible.",
          examples: [
            "https://example.com/image.png",
            "https://example.com/photo.jpg",
          ],
        }),
        x: createXPositionParam({ default: 50 }),
        y: createYPositionParam({ default: 50 }),
        width: createWidthParam({ default: 400 }),
        height: createHeightParam({ default: 300 }),
        preserveAspectRatio: createBooleanParam({
          description:
            "Preserve image aspect ratio when clamping size. Default: false",
          default: false,
          examples: [false, true],
        }),
        title: createStringParam({
          description:
            "Title for accessibility (alt text). Combined with description to display alt text.",
          examples: ["Company Logo", "Product Photo"],
        }),
        description: createStringParam({
          description:
            "Description for accessibility (alt text). Combined with title to display alt text.",
          examples: ["Logo of our company", "Photo of the product"],
        }),
        outline: {
          type: "object",
          description: "Optional outline/border for the image",
          properties: {
            color: {
              type: "object",
              description: "Outline color as RGB object",
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
            dashStyle: createStringParam({
              description: "Outline dash style",
              enum: [
                "SOLID",
                "DOT",
                "DASH",
                "DASH_DOT",
                "LONG_DASH",
                "LONG_DASH_DOT",
              ],
              examples: ["SOLID", "DASH"],
            }),
          },
        },
        shadow: {
          type: "object",
          description: "Optional shadow for the image",
          properties: {
            type: createStringParam({
              description: "Shadow type",
              enum: ["OUTER"],
              examples: ["OUTER"],
            }),
            color: {
              type: "object",
              description: "Shadow color as RGB object with optional alpha",
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
                alpha: createNumberParam({
                  description: "Shadow opacity (0-1)",
                  minimum: 0,
                  maximum: 1,
                  examples: [0.3, 0.5],
                }),
              },
            },
            blurRadius: createNumberParam({
              description: "Shadow blur radius in points",
              minimum: 0,
              examples: [4, 8],
            }),
            offsetX: createNumberParam({
              description: "Horizontal shadow offset in points",
              examples: [2, 4],
            }),
            offsetY: createNumberParam({
              description: "Vertical shadow offset in points",
              examples: [2, 4],
            }),
          },
        },
        link: {
          type: "object",
          description: "Optional hyperlink for the image",
          properties: {
            url: createStringParam({
              description: "External URL link",
              examples: ["https://example.com"],
            }),
            relativeLink: createStringParam({
              description: "Relative slide link",
              enum: [
                "NEXT_SLIDE",
                "PREVIOUS_SLIDE",
                "FIRST_SLIDE",
                "LAST_SLIDE",
              ],
              examples: ["NEXT_SLIDE"],
            }),
            pageObjectId: createStringParam({
              description: "Link to specific slide by object ID",
              examples: SLIDE_ID_EXAMPLES,
            }),
            slideIndex: createNumberParam({
              description: "Link to slide by zero-based index",
              minimum: 0,
              examples: [0, 1, 2],
            }),
          },
        },
      },
      required: ["presentationId", "pageId", "imageUrl"],
    },
    handler: addImage,
  },
  {
    name: "update_image_properties",
    description:
      "Update properties of an existing image (outline, shadow, link). Set a property to null to remove it. Example: Add shadow to image (shadow={type:'OUTER', color:{rgbColor:{red:0, green:0, blue:0}, alpha:0.3}, blurRadius:4, offsetX:2, offsetY:2}).",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        objectId: createStringParam({
          description: "The ID of the image element",
          examples: ELEMENT_ID_EXAMPLES,
        }),
        outline: {
          type: "object",
          description: "Outline/border for the image. Set to null to remove.",
          properties: {
            color: {
              type: "object",
              description: "Outline color as RGB object",
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
            }),
            dashStyle: createStringParam({
              description: "Outline dash style",
              enum: [
                "SOLID",
                "DOT",
                "DASH",
                "DASH_DOT",
                "LONG_DASH",
                "LONG_DASH_DOT",
              ],
            }),
          },
        },
        shadow: {
          type: "object",
          description: "Shadow for the image. Set to null to remove.",
          properties: {
            type: createStringParam({
              description: "Shadow type",
              enum: ["OUTER"],
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
                  required: ["red", "green", "blue"],
                },
                alpha: createNumberParam({
                  description: "Shadow opacity (0-1)",
                  minimum: 0,
                  maximum: 1,
                }),
              },
            },
            blurRadius: createNumberParam({
              description: "Shadow blur radius in points",
              minimum: 0,
            }),
            offsetX: createNumberParam({
              description: "Horizontal shadow offset in points",
            }),
            offsetY: createNumberParam({
              description: "Vertical shadow offset in points",
            }),
          },
        },
        link: {
          type: "object",
          description: "Hyperlink for the image. Set to null to remove.",
          properties: {
            url: createStringParam({
              description: "External URL link",
            }),
            relativeLink: createStringParam({
              description: "Relative slide link",
              enum: [
                "NEXT_SLIDE",
                "PREVIOUS_SLIDE",
                "FIRST_SLIDE",
                "LAST_SLIDE",
              ],
            }),
            pageObjectId: createStringParam({
              description: "Link to specific slide by object ID",
            }),
            slideIndex: createNumberParam({
              description: "Link to slide by zero-based index",
              minimum: 0,
            }),
          },
        },
      },
      required: ["presentationId", "objectId"],
    },
    handler: updateImageProperties,
  },
  {
    name: "replace_image",
    description:
      "Replace an existing image with a new image from a URL. Example: Replace image 'image_123' with new image from URL (objectId='image_123', imageUrl='https://example.com/new-image.png').",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        objectId: createStringParam({
          description: "The ID of the existing image to replace",
          examples: ELEMENT_ID_EXAMPLES,
        }),
        imageUrl: createStringParam({
          description: "URL of the new image. Must be publicly accessible.",
          examples: [
            "https://example.com/image.png",
            "https://example.com/photo.jpg",
          ],
        }),
        imageReplaceMethod: createStringParam({
          description:
            "How to replace the image: CENTER_INSIDE (fit within bounds) or CENTER_CROP (fill bounds, may crop). Default: CENTER_INSIDE",
          enum: ["CENTER_INSIDE", "CENTER_CROP"],
          examples: ["CENTER_INSIDE", "CENTER_CROP"],
        }),
      },
      required: ["presentationId", "objectId", "imageUrl"],
    },
    handler: async (args: ReplaceImageArgs) => {
      const slides = await ensureSlidesClient();

      logger.progress(`🖼️  Replacing image: ${args.objectId}`);

      const requests = [
        {
          replaceImage: {
            imageObjectId: args.objectId,
            url: args.imageUrl,
            ...(args.imageReplaceMethod && {
              imageReplaceMethod: args.imageReplaceMethod,
            }),
          },
        },
      ];

      await retryWithBackoff(async () => {
        await slides.presentations.batchUpdate({
          presentationId: args.presentationId,
          requestBody: { requests },
        });
      });

      // Invalidate cache after mutation
      invalidatePresentationCache(args.presentationId);

      logger.success(`✅ Replaced image: ${args.objectId}`);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                objectId: args.objectId,
                presentationId: args.presentationId,
                imageUrl: args.imageUrl,
                message: "Image replaced successfully",
              },
              null,
              2
            ),
          },
        ],
      };
    },
  },
];
