/**
 * Text-related MCP tools
 * Add and update text boxes
 */

import * as crypto from "crypto";
import { ensureSlidesClient } from "../slides";
import { MCPToolDefinition } from "../types/mcp";
import {
  UpdateTextArgs,
  AddMultipleTextBoxesArgs,
  CreateParagraphBulletsArgs,
  DeleteParagraphBulletsArgs,
} from "../types/slides";
import {
  validateAndClampBounds,
  SLIDE_DIMENSIONS,
  type SlideDimensions,
} from "../utils/bounds";
import {
  getCachedSlideSize,
  invalidatePresentationCache,
} from "../utils/cache";
import { SPACING } from "../config/design-system";
import { retryWithBackoff } from "../utils/error-handling";
import { logger } from "../utils/logger";
import {
  createXPositionParam,
  createYPositionParam,
  createWidthParam,
  createHeightParam,
  createFontSizeParam,
  createStringParam,
  createNumberParam,
  createBooleanParam,
} from "../utils/schema-builder";
import {
  PRESENTATION_ID_EXAMPLES,
  SLIDE_ID_EXAMPLES,
  TEXT_EXAMPLES,
  ELEMENT_ID_EXAMPLES,
} from "../config/examples";
import { ptToEmu, normalizeColorForAPI } from "./utils";
import { unescapeText } from "../utils/text-handling";
import {
  applySmartDefaults,
  snapToGrid,
  calculateVerticalGap,
  getRecommendedPositions,
  type ContentPreset,
} from "../utils/smart-layout";

/**
 * Update text content in an element
 */
const updateText = async (args: UpdateTextArgs) => {
  const slides = await ensureSlidesClient();

  logger.progress(`✏️  Updating text in element: ${args.objectId}`);

  // Convert escape sequences to actual characters
  const processedText = unescapeText(args.text);

  // First, delete existing text, then insert new text
  const requests = [
    {
      deleteText: {
        objectId: args.objectId,
        textRange: {
          type: "ALL",
        },
      },
    },
    {
      insertText: {
        objectId: args.objectId,
        insertionIndex: 0,
        text: processedText,
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

  logger.success(`✅ Updated text in element: ${args.objectId}`);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            objectId: args.objectId,
            presentationId: args.presentationId,
            text: args.text,
            message: "Text updated successfully",
          },
          null,
          2
        ),
      },
    ],
  };
};

/**
 * Add one or multiple text boxes with custom or automatic positioning
 * Each text box gets its own style. If y positions are not provided (or all have the same y value),
 * boxes are automatically stacked vertically with proper spacing.
 *
 * IMPORTANT: Always provide fontSize, bold, color etc. at creation time to ensure proper box sizing.
 * The box size is calculated based on the actual font size to prevent text overflow.
 */
export const addMultipleTextBoxes = async (args: AddMultipleTextBoxesArgs) => {
  const slides = await ensureSlidesClient();

  logger.progress(
    `📝 Adding ${args.textBoxes.length} text box${args.textBoxes.length === 1 ? "" : "es"} to slide: ${args.pageId}`
  );

  // Get slide dimensions
  const slideDimensionsResult = await getCachedSlideSize(
    slides,
    args.presentationId
  );
  const slideDimensions: SlideDimensions = slideDimensionsResult;

  // Default values
  const defaultWidth = args.defaultWidth ?? 500;
  const verticalGap = args.verticalGap ?? SPACING.ELEMENT_GAP;
  const startY = snapToGrid(args.startY ?? SPACING.MARGIN);
  const centerHorizontally = args.centerHorizontally ?? true;

  // Determine if we should use automatic vertical stacking
  // Use automatic stacking if:
  // 1. No y values are provided, OR
  // 2. All y values are the same (indicates accidental/default values)
  const yValues = args.textBoxes.map((tb) => tb.y);
  const uniqueYValues = new Set(yValues.filter((y) => y !== undefined));
  const useAutoStacking = uniqueYValues.size <= 1;

  if (useAutoStacking && uniqueYValues.size === 1) {
    logger.debug(
      `Using automatic vertical stacking (all boxes had same y position)`
    );
  }

  // Calculate starting X position
  let startX: number;
  if (args.startX !== undefined) {
    startX = args.startX;
  } else if (centerHorizontally) {
    // Center boxes horizontally - find the widest box
    const maxWidth = Math.max(
      ...args.textBoxes.map((tb) => tb.width ?? defaultWidth)
    );
    startX = (slideDimensions.width - maxWidth) / 2;
  } else {
    startX = SPACING.MARGIN;
  }

  // Create all text boxes with custom or automatic positioning
  let currentY = startY;
  const allRequests: Array<Record<string, unknown>> = [];
  const objectIds: string[] = [];
  const designSuggestions: Array<{
    preset: ContentPreset;
    recommendedY: number;
    applied: boolean;
  }> = [];
  let previousPreset: ContentPreset | undefined;

  // Import text sizing utility for proactive sizing
  const { calculateRequiredTextBoxSize: calcSize } =
    await import("../utils/text-sizing");

  for (let index = 0; index < args.textBoxes.length; index++) {
    const textBox = args.textBoxes[index];
    const objectId = `textbox_${crypto.randomUUID()}`;
    objectIds.push(objectId);

    // Apply smart defaults if not explicitly provided
    const smartDefaults = applySmartDefaults(
      textBox.text,
      index,
      textBox.y,
      previousPreset,
      textBox.width,
      textBox.height
    );

    // Use explicit values if provided, otherwise use smart defaults
    const fontSize = textBox.fontSize ?? smartDefaults.style.fontSize;
    const bold = textBox.bold ?? smartDefaults.style.bold;
    const alignment = textBox.alignment ?? smartDefaults.style.alignment;
    const foregroundColor =
      textBox.foregroundColor ?? smartDefaults.style.foregroundColor;

    // Calculate dimensions - use smart defaults with auto-sizing
    const requestedWidth = textBox.width ?? smartDefaults.width;
    const requestedHeight = textBox.height ?? smartDefaults.height ?? 100;

    // Calculate required size for this text with actual fontSize
    const requiredSize = calcSize(textBox.text, fontSize, 1.2, requestedWidth);

    // Use the larger of requested vs required height
    const widthPt = snapToGrid(requestedWidth);
    const isShortSingleLine =
      textBox.text.split("\n").length === 1 && textBox.text.length < 30;
    let heightPt = requestedHeight;

    // Only use calculated height if:
    // 1. It's significantly larger (>25% difference), OR
    // 2. Text is multi-line or long (needs calculated size)
    if (!isShortSingleLine || requiredSize.height > requestedHeight * 1.25) {
      heightPt = Math.max(requestedHeight, requiredSize.height);
    }
    heightPt = snapToGrid(heightPt);

    // Use custom position if explicitly provided
    // Always respect explicit x/y positions, even if auto-stacking is enabled
    let xPt = textBox.x ?? startX;
    xPt = snapToGrid(xPt);
    let yPt: number;
    if (textBox.y !== undefined) {
      // Explicit y position provided - always use it
      yPt = snapToGrid(textBox.y);
    } else if (useAutoStacking) {
      // No explicit y - use auto-stacking
      yPt = currentY;
    } else {
      // Fallback to smart defaults
      yPt = snapToGrid(smartDefaults.recommendedY);
    }

    // Track design suggestions
    designSuggestions.push({
      preset: smartDefaults.preset,
      recommendedY: smartDefaults.recommendedY,
      applied: textBox.fontSize === undefined && textBox.bold === undefined,
    });
    previousPreset = smartDefaults.preset;

    // Calculate max available height from this position
    const maxAvailableHeight =
      slideDimensions.height - yPt - SLIDE_DIMENSIONS.MIN_MARGIN;
    heightPt = Math.min(heightPt, maxAvailableHeight);

    // Validate bounds
    const boundsResult = validateAndClampBounds(
      xPt,
      yPt,
      widthPt,
      heightPt,
      slideDimensions
    );

    // Update currentY for next automatic positioning
    // Use golden ratio spacing when auto-stacking
    if (useAutoStacking || textBox.y === undefined) {
      const gap = useAutoStacking
        ? calculateVerticalGap(fontSize)
        : verticalGap;
      currentY = snapToGrid(boundsResult.y + boundsResult.height + gap);
    }

    // Convert to EMU
    const x = ptToEmu(boundsResult.x);
    const y = ptToEmu(boundsResult.y);
    const width = ptToEmu(boundsResult.width);
    const height = ptToEmu(boundsResult.height);

    // Create shape
    allRequests.push({
      createShape: {
        objectId,
        shapeType: "TEXT_BOX",
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
    });

    // Convert escape sequences to actual characters
    const processedText = unescapeText(textBox.text);

    // Insert text
    allRequests.push({
      insertText: {
        objectId,
        insertionIndex: 0,
        text: processedText,
      },
    });

    // Apply text formatting - all in same batch to prevent size issues
    // Use smart defaults if not explicitly provided
    const textStyleUpdates: Record<string, unknown> = {};
    const textStyleFields: string[] = [];

    // Always apply fontSize (from smart defaults or explicit)
    textStyleUpdates.fontSize = { magnitude: fontSize, unit: "PT" };
    textStyleFields.push("fontSize");

    if (textBox.fontFamily !== undefined) {
      textStyleUpdates.fontFamily = textBox.fontFamily;
      textStyleFields.push("fontFamily");
    }

    // Always apply bold (from smart defaults or explicit)
    textStyleUpdates.bold = bold;
    textStyleFields.push("bold");

    if (textBox.italic !== undefined) {
      textStyleUpdates.italic = textBox.italic;
      textStyleFields.push("italic");
    }
    if (textBox.underline !== undefined) {
      textStyleUpdates.underline = textBox.underline;
      textStyleFields.push("underline");
    }

    // Apply foregroundColor (from smart defaults or explicit)
    if (foregroundColor !== undefined) {
      const normalizedColor = normalizeColorForAPI(foregroundColor);
      if (normalizedColor) {
        textStyleUpdates.foregroundColor = normalizedColor;
        textStyleFields.push("foregroundColor");
      }
    }

    if (textStyleFields.length > 0) {
      allRequests.push({
        updateTextStyle: {
          objectId,
          style: textStyleUpdates,
          textRange: { type: "ALL" },
          fields: textStyleFields.join(","),
        },
      });
    }

    // Apply alignment (from smart defaults or explicit)
    allRequests.push({
      updateParagraphStyle: {
        objectId,
        style: {
          alignment: alignment,
        },
        textRange: { type: "ALL" },
        fields: "alignment",
      },
    });
  }

  // Execute all requests in a single batch
  await retryWithBackoff(async () => {
    await slides.presentations.batchUpdate({
      presentationId: args.presentationId,
      requestBody: { requests: allRequests },
    });
  });

  // Invalidate cache
  invalidatePresentationCache(args.presentationId);

  logger.success(
    `✅ Added ${args.textBoxes.length} text box${args.textBoxes.length === 1 ? "" : "es"}`
  );

  // Build design suggestions response
  const recommendedPositions = getRecommendedPositions();
  const appliedPresets = designSuggestions.filter((s) => s.applied);
  const designTips: string[] = [];
  if (appliedPresets.length > 0) {
    designTips.push(
      `Applied smart presets: ${appliedPresets.map((s) => s.preset).join(", ")}`
    );
  }
  designTips.push(
    `Recommended positions: Title y=${recommendedPositions.title}, Subtitle y=${recommendedPositions.subtitle}, Body y=${recommendedPositions.body}`
  );

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            presentationId: args.presentationId,
            pageId: args.pageId,
            objectIds: args.textBoxes.length === 1 ? objectIds[0] : objectIds,
            count: args.textBoxes.length,
            message: `Successfully created ${args.textBoxes.length} text box${args.textBoxes.length === 1 ? "" : "es"}`,
            designSuggestions: {
              positions: recommendedPositions,
              appliedPresets: designSuggestions.map((s) => ({
                preset: s.preset,
                recommendedY: s.recommendedY,
                applied: s.applied,
              })),
              tips: designTips,
            },
          },
          null,
          2
        ),
      },
    ],
  };
};

// Tool definitions
export const textTools: MCPToolDefinition[] = [
  {
    name: "add_multiple_text_boxes",
    description:
      "Add one or multiple text boxes to a slide. Can accept a single text box object or an array. IMPORTANT: Always provide fontSize, bold, color etc. at creation time to ensure proper box sizing. The box size is calculated based on the actual font size to prevent text overflow. Each text box can have its own style (font size, bold, italic, color, alignment) and custom position (x, y). If positions are not provided, boxes are automatically stacked vertically. Example: Single box (textBoxes={text:'Title', fontSize:44, bold:true}) or multiple (textBoxes=[{text:'Title', fontSize:44}, {text:'Subtitle', fontSize:24}]). Perfect for creating slides with styled text elements.",
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
        textBoxes: {
          type: "array",
          description:
            "Array of text box definitions (can be single element). Each can have its own text, styling (fontSize, bold, italic, color, fontFamily), and position. Example: [{text: 'Title', fontSize: 44, bold: true}] for single box or [{text: 'Title', fontSize: 44}, {text: 'Subtitle', fontSize: 24}] for multiple. IMPORTANT: Always provide fontSize at creation time to ensure proper box sizing and prevent overflow.",
          items: {
            type: "object",
            description:
              "Text box definition with text content and optional styling",
            properties: {
              text: createStringParam({
                description: "The text content for this text box",
                examples: [
                  TEXT_EXAMPLES.TITLE,
                  TEXT_EXAMPLES.SUBTITLE,
                  TEXT_EXAMPLES.BODY,
                ],
              }),
              x: createXPositionParam({
                description:
                  "Custom X position in points (optional, defaults to automatic positioning based on startX or centering)",
              }),
              y: createYPositionParam({
                description:
                  "Custom Y position in points (optional, defaults to automatic vertical stacking)",
              }),
              width: createWidthParam({
                description:
                  "Width in points (optional, defaults to defaultWidth or 500)",
              }),
              height: createHeightParam({
                description:
                  "Height in points (optional, defaults to defaultHeight or 100)",
              }),
              fontSize: createFontSizeParam({
                description:
                  "Font size in points. IMPORTANT: Provide this to ensure box is sized correctly. Common: 44 (title), 24 (subtitle), 16 (body)",
              }),
              fontFamily: createStringParam({
                description: "Font family name",
                examples: ["Arial", "Times New Roman", "Roboto"],
              }),
              bold: createBooleanParam({
                description: "Make text bold (optional). Default: false",
                default: false,
                examples: [true, false],
              }),
              italic: createBooleanParam({
                description: "Make text italic (optional). Default: false",
                default: false,
                examples: [false, true],
              }),
              underline: createBooleanParam({
                description: "Underline text (optional). Default: false",
                default: false,
                examples: [false],
              }),
              alignment: createStringParam({
                description:
                  "Text alignment: START (left), CENTER, END (right), or JUSTIFIED",
                enum: ["START", "CENTER", "END", "JUSTIFIED"],
                examples: ["CENTER", "START"],
              }),
              autoFit: createBooleanParam({
                description:
                  "Automatically adjust font size to fit text (optional). Default: false",
                default: false,
                examples: [false],
              }),
              foregroundColor: {
                type: "object",
                description:
                  "Text color as RGB object with red, green, blue (0-1). Example: {rgbColor: {red: 0.09, green: 0.64, blue: 0.29}}",
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
            },
            required: ["text"],
          },
        },
        startX: createXPositionParam({
          description:
            "Starting X position in points (optional, defaults to centered if centerHorizontally is true)",
        }),
        startY: createYPositionParam({
          description:
            "Starting Y position in points (optional, defaults to margin: 20)",
        }),
        defaultWidth: createWidthParam({
          description:
            "Default width for all boxes in points (optional, defaults to 500)",
        }),
        defaultHeight: createHeightParam({
          description:
            "Default height for boxes in points (optional, defaults to 100)",
        }),
        verticalGap: createNumberParam({
          description: "Space between boxes in points",
          minimum: 0,
          maximum: 100,
          default: 16,
          examples: [16, 24, 32],
        }),
        centerHorizontally: createBooleanParam({
          description:
            "Center all boxes horizontally on the slide (optional, defaults to true)",
          default: true,
          examples: [true, false],
        }),
      },
      required: ["presentationId", "pageId", "textBoxes"],
    },
    handler: addMultipleTextBoxes,
  },
  {
    name: "update_text",
    description:
      "Update the text content of a text element on a slide. Example: Change 'Old Title' to 'New Title' in an existing text box. Use this when you need to modify text without changing position or style.",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        objectId: createStringParam({
          description: "The ID of the text element to update",
          examples: ELEMENT_ID_EXAMPLES,
        }),
        text: createStringParam({
          description: "The new text content",
          examples: [
            TEXT_EXAMPLES.TITLE,
            TEXT_EXAMPLES.SUBTITLE,
            TEXT_EXAMPLES.BODY,
          ],
        }),
      },
      required: ["presentationId", "objectId", "text"],
    },
    handler: updateText,
  },
  {
    name: "create_paragraph_bullets",
    description:
      "Create bullets for paragraphs in a text element. Example: Add bullets to text range (objectId='textbox_123', startIndex=0, endIndex=50, bulletPreset='BULLET_DISC_CIRCLE_SQUARE').",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        objectId: createStringParam({
          description: "The ID of the text element or table",
          examples: ELEMENT_ID_EXAMPLES,
        }),
        startIndex: createNumberParam({
          description:
            "Optional start index for text range. If not provided, applies to all text.",
          minimum: 0,
          examples: [0, 10],
        }),
        endIndex: createNumberParam({
          description: "Optional end index for text range",
          minimum: 0,
          examples: [50, 100],
        }),
        bulletPreset: createStringParam({
          description:
            "Bullet preset style. Default: BULLET_DISC_CIRCLE_SQUARE",
          enum: [
            "BULLET_DISC_CIRCLE_SQUARE",
            "BULLET_DIAMONDX_ARROW3D_SQUARE",
            "BULLET_CHECKBOX",
            "BULLET_ARROW_DIAMOND_DISC",
            "BULLET_STAR_CIRCLE_SQUARE",
            "BULLET_ARROW3D_CIRCLE_SQUARE",
            "BULLET_LEFTTRIANGLE_DIAMOND_DISC",
            "BULLET_DIAMONDX_HOLLOWDIAMOND_SQUARE",
            "BULLET_DIAMOND_CIRCLE_SQUARE",
            "NUMBERED_DIGIT_ALPHA_ROMAN",
            "NUMBERED_DIGIT_ALPHA_ROMAN_PARENS",
            "NUMBERED_DIGIT_NESTED",
            "NUMBERED_UPPERALPHA_ALPHA_ROMAN",
            "NUMBERED_UPPERROMAN_UPPERALPHA_DIGIT",
            "NUMBERED_ZERODIGIT_ALPHA_ROMAN",
          ],
          examples: ["BULLET_DISC_CIRCLE_SQUARE", "NUMBERED_DIGIT_ALPHA_ROMAN"],
        }),
        rowIndex: createNumberParam({
          description:
            "Optional: Table cell row index if text is in a table cell",
          minimum: 0,
          examples: [0, 1],
        }),
        columnIndex: createNumberParam({
          description:
            "Optional: Table cell column index if text is in a table cell",
          minimum: 0,
          examples: [0, 1],
        }),
      },
      required: ["presentationId", "objectId"],
    },
    handler: async (args: CreateParagraphBulletsArgs) => {
      const slides = await ensureSlidesClient();

      logger.progress(`📝 Creating paragraph bullets: ${args.objectId}`);

      const textRange =
        args.startIndex !== undefined || args.endIndex !== undefined
          ? {
              type: "FIXED_RANGE" as const,
              ...(args.startIndex !== undefined && {
                startIndex: args.startIndex,
              }),
              ...(args.endIndex !== undefined && { endIndex: args.endIndex }),
            }
          : { type: "ALL" as const };

      const requests = [
        {
          createParagraphBullets: {
            objectId: args.objectId,
            ...(args.rowIndex !== undefined &&
              args.columnIndex !== undefined && {
                cellLocation: {
                  rowIndex: args.rowIndex,
                  columnIndex: args.columnIndex,
                },
              }),
            textRange,
            bulletPreset: args.bulletPreset || "BULLET_DISC_CIRCLE_SQUARE",
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

      logger.success(`✅ Created paragraph bullets`);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                objectId: args.objectId,
                presentationId: args.presentationId,
                bulletPreset: args.bulletPreset || "BULLET_DISC_CIRCLE_SQUARE",
                message: "Paragraph bullets created successfully",
              },
              null,
              2
            ),
          },
        ],
      };
    },
  },
  {
    name: "delete_paragraph_bullets",
    description:
      "Delete bullets from paragraphs in a text element. Example: Remove bullets from text range (objectId='textbox_123', startIndex=0, endIndex=50).",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        objectId: createStringParam({
          description: "The ID of the text element or table",
          examples: ELEMENT_ID_EXAMPLES,
        }),
        startIndex: createNumberParam({
          description:
            "Optional start index for text range. If not provided, applies to all text.",
          minimum: 0,
          examples: [0, 10],
        }),
        endIndex: createNumberParam({
          description: "Optional end index for text range",
          minimum: 0,
          examples: [50, 100],
        }),
        rowIndex: createNumberParam({
          description:
            "Optional: Table cell row index if text is in a table cell",
          minimum: 0,
          examples: [0, 1],
        }),
        columnIndex: createNumberParam({
          description:
            "Optional: Table cell column index if text is in a table cell",
          minimum: 0,
          examples: [0, 1],
        }),
      },
      required: ["presentationId", "objectId"],
    },
    handler: async (args: DeleteParagraphBulletsArgs) => {
      const slides = await ensureSlidesClient();

      logger.progress(`📝 Deleting paragraph bullets: ${args.objectId}`);

      const textRange =
        args.startIndex !== undefined || args.endIndex !== undefined
          ? {
              type: "FIXED_RANGE" as const,
              ...(args.startIndex !== undefined && {
                startIndex: args.startIndex,
              }),
              ...(args.endIndex !== undefined && { endIndex: args.endIndex }),
            }
          : { type: "ALL" as const };

      const requests = [
        {
          deleteParagraphBullets: {
            objectId: args.objectId,
            ...(args.rowIndex !== undefined &&
              args.columnIndex !== undefined && {
                cellLocation: {
                  rowIndex: args.rowIndex,
                  columnIndex: args.columnIndex,
                },
              }),
            textRange,
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

      logger.success(`✅ Deleted paragraph bullets`);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                objectId: args.objectId,
                presentationId: args.presentationId,
                message: "Paragraph bullets deleted successfully",
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
