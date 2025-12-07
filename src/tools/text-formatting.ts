/**
 * Text formatting MCP tools
 * Apply text formatting to elements
 */

import { ensureSlidesClient } from "../slides";
import { MCPToolDefinition } from "../types/mcp";
import { FormatTextArgs } from "../types/slides";
import { invalidatePresentationCache } from "../utils/cache";
import { retryWithBackoff } from "../utils/error-handling";
import { logger } from "../utils/logger";
import {
  createFontSizeParam,
  createStringParam,
  createNumberParam,
  createBooleanParam,
} from "../utils/schema-builder";
import {
  PRESENTATION_ID_EXAMPLES,
  ELEMENT_ID_EXAMPLES,
  ALIGNMENT_EXAMPLES,
  SLIDE_ID_EXAMPLES,
} from "../config/examples";
import { normalizeColorForAPI } from "./utils";

/**
 * Format text in an element (includes both text style and paragraph style)
 */
const formatText = async (args: FormatTextArgs) => {
  const slides = await ensureSlidesClient();

  const formatDetails: string[] = [];
  if (args.fontSize !== undefined) formatDetails.push(`${args.fontSize}pt`);
  if (args.bold) formatDetails.push("bold");
  if (args.italic) formatDetails.push("italic");
  if (args.foregroundColor) formatDetails.push("color");
  if (args.alignment) formatDetails.push(args.alignment.toLowerCase());

  logger.progress(
    `🎨 Formatting text: ${args.objectId.substring(0, 20)}... [${formatDetails.join(", ")}]`
  );

  const requests: Array<Record<string, unknown>> = [];

  // Build updateTextStyle request
  const textStyle: Record<string, unknown> = {};
  if (args.fontSize !== undefined) {
    textStyle.fontSize = { magnitude: args.fontSize, unit: "PT" };
  }
  if (args.fontFamily !== undefined) {
    textStyle.fontFamily = args.fontFamily;
  }
  if (args.bold !== undefined) {
    textStyle.bold = args.bold;
  }
  if (args.italic !== undefined) {
    textStyle.italic = args.italic;
  }
  if (args.underline !== undefined) {
    textStyle.underline = args.underline;
  }
  if (args.strikethrough !== undefined) {
    textStyle.strikethrough = args.strikethrough;
  }
  if (args.smallCaps !== undefined) {
    textStyle.smallCaps = args.smallCaps;
  }
  if (args.baselineOffset !== undefined) {
    textStyle.baselineOffset = args.baselineOffset;
  }
  if (args.foregroundColor !== undefined) {
    const normalizedColor = normalizeColorForAPI(args.foregroundColor);
    if (normalizedColor) {
      textStyle.foregroundColor = normalizedColor;
      logger.debug(
        `   Foreground Color: RGB(${args.foregroundColor.rgbColor?.red?.toFixed(2)}, ${args.foregroundColor.rgbColor?.green?.toFixed(2)}, ${args.foregroundColor.rgbColor?.blue?.toFixed(2)})`
      );
    }
  }
  if (args.backgroundColor !== undefined) {
    const normalizedColor = normalizeColorForAPI(args.backgroundColor);
    if (normalizedColor) {
      textStyle.backgroundColor = normalizedColor;
      logger.debug(
        `   Background Color: RGB(${args.backgroundColor.rgbColor?.red?.toFixed(2)}, ${args.backgroundColor.rgbColor?.green?.toFixed(2)}, ${args.backgroundColor.rgbColor?.blue?.toFixed(2)})`
      );
    }
  }
  if (args.link !== undefined) {
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
    textStyle.link = linkProperties;
  }
  if (args.weightedFontFamily !== undefined) {
    textStyle.weightedFontFamily = {
      fontFamily: args.weightedFontFamily.fontFamily,
      weight: args.weightedFontFamily.weight ?? 400,
    };
    // If weightedFontFamily is set, fontFamily should match
    if (args.fontFamily === undefined) {
      textStyle.fontFamily = args.weightedFontFamily.fontFamily;
    }
  }

  const textRange = {
    type:
      args.startIndex !== undefined || args.endIndex !== undefined
        ? "FIXED_RANGE"
        : "ALL",
    ...(args.startIndex !== undefined && { startIndex: args.startIndex }),
    ...(args.endIndex !== undefined && { endIndex: args.endIndex }),
  };

  if (Object.keys(textStyle).length > 0) {
    requests.push({
      updateTextStyle: {
        objectId: args.objectId,
        style: textStyle,
        textRange,
        fields: Object.keys(textStyle).join(","),
      },
    });
  }

  // Build updateParagraphStyle request (paragraph formatting)
  const paragraphStyle: Record<string, unknown> = {};
  if (args.alignment !== undefined) {
    paragraphStyle.alignment = args.alignment;
  }
  if (args.spacingMode !== undefined) {
    paragraphStyle.spacingMode = args.spacingMode;
  }
  if (args.spacingMagnitude !== undefined) {
    paragraphStyle.spaceAbove = {
      magnitude: args.spacingMagnitude,
      unit: "PT",
    };
  }
  if (args.spaceBelow !== undefined) {
    paragraphStyle.spaceBelow = {
      magnitude: args.spaceBelow,
      unit: "PT",
    };
  }
  if (args.lineSpacing !== undefined) {
    paragraphStyle.lineSpacing = args.lineSpacing; // Percentage, e.g., 100.0 = normal
  }
  if (args.indentFirstLine !== undefined) {
    paragraphStyle.indentFirstLine = {
      magnitude: args.indentFirstLine,
      unit: "PT",
    };
  }
  if (args.indentStart !== undefined) {
    paragraphStyle.indentStart = {
      magnitude: args.indentStart,
      unit: "PT",
    };
  }
  if (args.indentEnd !== undefined) {
    paragraphStyle.indentEnd = {
      magnitude: args.indentEnd,
      unit: "PT",
    };
  }
  if (args.direction !== undefined) {
    paragraphStyle.direction = args.direction;
  }

  if (Object.keys(paragraphStyle).length > 0) {
    requests.push({
      updateParagraphStyle: {
        objectId: args.objectId,
        style: paragraphStyle,
        textRange,
        fields: Object.keys(paragraphStyle).join(","),
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

    logger.success(`✅ Text formatted successfully`);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              success: true,
              objectId: args.objectId,
              presentationId: args.presentationId,
              message: "Text formatted successfully",
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`❌ Failed to format text: ${errorMessage}`);

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
export const textFormattingTools: MCPToolDefinition[] = [
  {
    name: "format_text",
    description:
      "Apply comprehensive text formatting to a Google Slides element. Includes text style (font size, bold, italic, color) and paragraph style (alignment, spacing). Example: Make title bold and centered (fontSize=44, bold=true, alignment='CENTER'). Use this to change formatting of existing text elements. Optionally specify text range for partial formatting.",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        objectId: createStringParam({
          description: "The ID of the text element",
          examples: ELEMENT_ID_EXAMPLES,
        }),
        startIndex: createNumberParam({
          description:
            "Optional start index for text range (if not provided, formats all text)",
          minimum: 0,
          examples: [0, 10],
        }),
        endIndex: createNumberParam({
          description: "Optional end index for text range",
          minimum: 0,
          examples: [5, 20],
        }),
        fontSize: createFontSizeParam({
          description:
            "Font size in points. Common: 44 (title), 24 (subtitle), 14 (body)",
        }),
        fontFamily: createStringParam({
          description: "Font family name",
          examples: ["Arial", "Times New Roman", "Roboto"],
        }),
        bold: createBooleanParam({
          description: "Make text bold. Default: false",
          default: false,
          examples: [true, false],
        }),
        italic: createBooleanParam({
          description: "Make text italic. Default: false",
          default: false,
          examples: [false, true],
        }),
        underline: createBooleanParam({
          description: "Underline text. Default: false",
          default: false,
          examples: [false],
        }),
        strikethrough: createBooleanParam({
          description: "Strikethrough text. Default: false",
          default: false,
          examples: [false, true],
        }),
        smallCaps: createBooleanParam({
          description: "Use small capital letters. Default: false",
          default: false,
          examples: [false, true],
        }),
        baselineOffset: createStringParam({
          description: "Vertical text offset: NONE, SUPERSCRIPT, or SUBSCRIPT",
          enum: ["NONE", "SUPERSCRIPT", "SUBSCRIPT"],
          examples: ["NONE", "SUPERSCRIPT", "SUBSCRIPT"],
        }),
        foregroundColor: {
          type: "object",
          description:
            "Text color as RGB object with red, green, blue (0-1). Example: {rgbColor: {red: 0, green: 0, blue: 0}} for black",
          properties: {
            rgbColor: {
              type: "object",
              description: "RGB color values (0-1)",
              properties: {
                red: createNumberParam({
                  description: "Red component (0-1)",
                  minimum: 0,
                  maximum: 1,
                  examples: [0, 0.9, 1],
                }),
                green: createNumberParam({
                  description: "Green component (0-1)",
                  minimum: 0,
                  maximum: 1,
                  examples: [0, 0.7, 1],
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
        backgroundColor: {
          type: "object",
          description:
            "Text background color as RGB object with red, green, blue (0-1). Example: {rgbColor: {red: 1, green: 1, blue: 0}} for yellow",
          properties: {
            rgbColor: {
              type: "object",
              description: "RGB color values (0-1)",
              properties: {
                red: createNumberParam({
                  description: "Red component (0-1)",
                  minimum: 0,
                  maximum: 1,
                  examples: [0, 0.9, 1],
                }),
                green: createNumberParam({
                  description: "Green component (0-1)",
                  minimum: 0,
                  maximum: 1,
                  examples: [0, 0.7, 1],
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
        link: {
          type: "object",
          description: "Hyperlink for the text",
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
        weightedFontFamily: {
          type: "object",
          description:
            "Font family with explicit weight (100-900, multiples of 100). Example: {fontFamily: 'Roboto', weight: 700}",
          properties: {
            fontFamily: createStringParam({
              description: "Font family name",
              examples: ["Roboto", "Arial", "Times New Roman"],
            }),
            weight: createNumberParam({
              description:
                "Font weight (100-900, multiples of 100). 400 = normal, >=700 = bold",
              minimum: 100,
              maximum: 900,
              examples: [400, 700, 900],
            }),
          },
          required: ["fontFamily"],
        },
        alignment: createStringParam({
          description:
            "Text alignment: START (left), CENTER, END (right), or JUSTIFIED. Applies to entire text element or specified range.",
          enum: ["START", "CENTER", "END", "JUSTIFIED"],
          examples: ALIGNMENT_EXAMPLES,
        }),
        spacingMode: createStringParam({
          description: "Spacing mode: NEVER_COLLAPSE, COLLAPSE_LISTS",
          enum: ["NEVER_COLLAPSE", "COLLAPSE_LISTS"],
          examples: ["NEVER_COLLAPSE"],
        }),
        spacingMagnitude: createNumberParam({
          description: "Spacing magnitude in points",
          minimum: 0,
          examples: [0, 12, 24],
        }),
        indentFirstLine: createNumberParam({
          description: "First line indent in points",
          minimum: 0,
          examples: [0, 20, 40],
        }),
        indentStart: createNumberParam({
          description: "Start indent in points",
          minimum: 0,
          examples: [0, 20, 40],
        }),
        indentEnd: createNumberParam({
          description: "End indent in points",
          minimum: 0,
          examples: [0, 20, 40],
        }),
        spaceBelow: createNumberParam({
          description: "Space below paragraph in points",
          minimum: 0,
          examples: [0, 12, 24],
        }),
        lineSpacing: createNumberParam({
          description:
            "Line spacing as percentage of normal (100.0 = normal, 150.0 = 1.5x, etc.)",
          minimum: 0,
          examples: [100, 120, 150, 200],
        }),
        direction: createStringParam({
          description: "Text direction: LEFT_TO_RIGHT or RIGHT_TO_LEFT",
          enum: ["LEFT_TO_RIGHT", "RIGHT_TO_LEFT"],
          examples: ["LEFT_TO_RIGHT", "RIGHT_TO_LEFT"],
        }),
      },
      required: ["presentationId", "objectId"],
    },
    handler: formatText,
  },
];
