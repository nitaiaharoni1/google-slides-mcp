/**
 * Shape-related MCP tools
 * Add shapes to slides
 */

import * as crypto from "crypto";
import { ensureSlidesClient } from "../slides";
import { MCPToolDefinition } from "../types/mcp";
import { AddShapeArgs } from "../types/slides";
import { validateAndClampBounds, getSlideSize } from "../utils/bounds";
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
  createFontSizeParam,
  createBooleanParam,
  createNumberParam,
} from "../utils/schema-builder";
import {
  PRESENTATION_ID_EXAMPLES,
  SLIDE_ID_EXAMPLES,
  SHAPE_TYPE_EXAMPLES,
} from "../config/examples";
import { ptToEmu, isValidShapeType, normalizeColorForAPI } from "./utils";
import { unescapeText } from "../utils/text-handling";

/**
 * Add a shape to a slide
 */
export const addShape = async (args: AddShapeArgs) => {
  // Validate shape type
  if (!isValidShapeType(args.shapeType)) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              error: "Invalid shape type",
              provided: args.shapeType,
              message:
                "Please provide a valid shape type. Common types include: RECTANGLE, ELLIPSE, ARROW, DIAMOND, TRIANGLE, STAR_5, etc.",
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }

  const slides = await ensureSlidesClient();

  logger.progress(`🔷 Adding shape to slide: ${args.pageId}`);

  const objectId = `shape_${crypto.randomUUID()}`;

  // Get default or provided values in points (using design system)
  const defaultX = SPACING.MARGIN;
  const defaultY = SPACING.MARGIN;
  const defaultWidth = 200;
  const defaultHeight = 100;

  const xPt = args.x !== undefined ? args.x : defaultX;
  const yPt = args.y !== undefined ? args.y : defaultY;
  const widthPt = args.width !== undefined ? args.width : defaultWidth;
  const heightPt = args.height !== undefined ? args.height : defaultHeight;

  // Get slide dimensions for dynamic validation
  const slideDimensions = await getSlideSize(slides, args.presentationId);

  // Validate and clamp bounds to prevent overflow
  const boundsResult = validateAndClampBounds(
    xPt,
    yPt,
    widthPt,
    heightPt,
    slideDimensions
  );

  // Convert validated points to EMU
  const x = ptToEmu(boundsResult.x);
  const y = ptToEmu(boundsResult.y);
  const width = ptToEmu(boundsResult.width);
  const height = ptToEmu(boundsResult.height);

  const requests: Array<Record<string, unknown>> = [
    {
      createShape: {
        objectId,
        shapeType: args.shapeType,
        elementProperties: {
          pageObjectId: args.pageId,
          size: {
            height: { magnitude: height, unit: "EMU" },
            width: { magnitude: width, unit: "EMU" },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: x,
            translateY: y,
            unit: "EMU",
          },
        },
      },
    },
  ];

  // Add text if provided
  if (args.text !== undefined && args.text !== null) {
    // Convert escape sequences to actual characters
    const processedText = unescapeText(args.text);

    requests.push({
      insertText: {
        objectId,
        insertionIndex: 0,
        text: processedText,
      },
    });

    // Apply text formatting if provided
    const textStyleUpdates: Record<string, unknown> = {};
    const textStyleFields: string[] = [];

    if (args.fontSize !== undefined) {
      textStyleUpdates.fontSize = { magnitude: args.fontSize, unit: "PT" };
      textStyleFields.push("fontSize");
    }
    if (args.fontFamily !== undefined) {
      textStyleUpdates.fontFamily = args.fontFamily;
      textStyleFields.push("fontFamily");
    }
    if (args.bold !== undefined) {
      textStyleUpdates.bold = args.bold;
      textStyleFields.push("bold");
    }
    if (args.italic !== undefined) {
      textStyleUpdates.italic = args.italic;
      textStyleFields.push("italic");
    }
    if (args.underline !== undefined) {
      textStyleUpdates.underline = args.underline;
      textStyleFields.push("underline");
    }
    if (args.foregroundColor !== undefined) {
      const normalizedColor = normalizeColorForAPI(args.foregroundColor);
      if (normalizedColor) {
        textStyleUpdates.foregroundColor = normalizedColor;
        textStyleFields.push("foregroundColor");
      }
    }

    if (textStyleFields.length > 0) {
      requests.push({
        updateTextStyle: {
          objectId,
          style: textStyleUpdates,
          textRange: { type: "ALL" },
          fields: textStyleFields.join(","),
        },
      });
    }

    // Apply alignment if provided
    if (args.alignment !== undefined) {
      requests.push({
        updateParagraphStyle: {
          objectId,
          style: {
            alignment: args.alignment,
          },
          textRange: { type: "ALL" },
          fields: "alignment",
        },
      });
    }
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

  const successMessage = args.text
    ? `✅ Added shape with text: ${objectId}`
    : `✅ Added shape: ${objectId}`;
  logger.success(successMessage);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            objectId,
            presentationId: args.presentationId,
            pageId: args.pageId,
            shapeType: args.shapeType,
            hasText: args.text !== undefined && args.text !== null,
            ...(args.text && { text: args.text }),
          },
          null,
          2
        ),
      },
    ],
  };
};

// Tool definitions
export const shapeTools: MCPToolDefinition[] = [
  {
    name: "add_shape",
    description:
      "Add a shape to a slide. All positions and sizes in points. Common shapes: RECTANGLE, ELLIPSE, ARROW, DIAMOND, TRIANGLE, STAR_5. Defaults: x=50, y=50, width=200, height=100. Optionally include text and formatting. Example: Add a rectangle at center (shapeType='RECTANGLE', x=360, y=202, width=200, height=100). Example with text: Add a rectangle with text (shapeType='RECTANGLE', text='Hello', fontSize=16, bold=true, foregroundColor={rgbColor: {red: 0.09, green: 0.64, blue: 0.29}}).",
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
        shapeType: createStringParam({
          description:
            "Type of shape. Common: RECTANGLE, ELLIPSE, ARROW, DIAMOND, TRIANGLE, STAR_5",
          examples: SHAPE_TYPE_EXAMPLES,
        }),
        x: createXPositionParam({ default: 50 }),
        y: createYPositionParam({ default: 50 }),
        width: createWidthParam({ default: 200 }),
        height: createHeightParam({ default: 100 }),
        text: createStringParam({
          description:
            "Optional text content to add to the shape. If provided, text will be inserted into the shape with optional formatting.",
        }),
        fontSize: createFontSizeParam({
          description:
            "Font size in points. Common: 44 (title), 24 (subtitle), 14 (body). Only applies if text is provided.",
        }),
        fontFamily: createStringParam({
          description:
            "Font family name. Examples: Arial, Times New Roman, Roboto. Only applies if text is provided.",
          examples: ["Arial", "Times New Roman", "Roboto"],
        }),
        bold: createBooleanParam({
          description:
            "Make text bold. Default: false. Only applies if text is provided.",
          default: false,
          examples: [true, false],
        }),
        italic: createBooleanParam({
          description:
            "Make text italic. Default: false. Only applies if text is provided.",
          default: false,
          examples: [false, true],
        }),
        underline: createBooleanParam({
          description:
            "Underline text. Default: false. Only applies if text is provided.",
          default: false,
          examples: [false],
        }),
        foregroundColor: {
          type: "object",
          description:
            "Text color as RGB object with red, green, blue (0-1). Example: {rgbColor: {red: 0.09, green: 0.64, blue: 0.29}}. Only applies if text is provided.",
          properties: {
            rgbColor: {
              type: "object",
              description: "RGB color values (0-1)",
              properties: {
                red: createNumberParam({
                  description: "Red component (0-1)",
                  minimum: 0,
                  maximum: 1,
                  examples: [0, 0.09, 0.9, 1],
                }),
                green: createNumberParam({
                  description: "Green component (0-1)",
                  minimum: 0,
                  maximum: 1,
                  examples: [0, 0.64, 0.7, 1],
                }),
                blue: createNumberParam({
                  description: "Blue component (0-1)",
                  minimum: 0,
                  maximum: 1,
                  examples: [0, 0.29, 0.8, 1],
                }),
              },
            },
          },
        },
        alignment: createStringParam({
          description:
            "Text alignment: START (left), CENTER, END (right), or JUSTIFIED. Only applies if text is provided.",
          enum: ["START", "CENTER", "END", "JUSTIFIED"],
          examples: ["CENTER", "START"],
        }),
      },
      required: ["presentationId", "pageId", "shapeType"],
    },
    handler: addShape,
  },
];
