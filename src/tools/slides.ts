/**
 * Slide-related MCP tools
 * Create, duplicate, delete, reorder, and get slides
 */

import { ensureSlidesClient } from "../slides";
import { MCPToolDefinition } from "../types/mcp";
import { logger } from "../utils/logger";
import { createStringParam, createNumberParam } from "../utils/schema-builder";
import {
  PRESENTATION_ID_EXAMPLES,
  SLIDE_ID_EXAMPLES,
} from "../config/examples";
import {
  CreateSlideArgs,
  DuplicateSlideArgs,
  DeleteSlideArgs,
  ReorderSlidesArgs,
  GetSlideArgs,
  AddSpeakerNotesArgs,
  GetSpeakerNotesArgs,
  SetSlideBackgroundArgs,
} from "../types/slides";
import { invalidatePresentationCache } from "../utils/cache";
import { retryWithBackoff } from "../utils/error-handling";
import { unescapeText } from "../utils/text-handling";
import {
  validateGradientFill,
  validateImageUrl,
  formatErrorForAI,
  createAPIError,
} from "../utils/api-validation";

/**
 * Create a new slide
 */
export const createSlide = async (args: CreateSlideArgs) => {
  const slides = await ensureSlidesClient();

  logger.progress(`📄 Creating slide in presentation: ${args.presentationId}`);

  const requests = [
    {
      createSlide: {
        ...(args.layoutId && { objectId: args.layoutId }),
        insertionIndex: args.insertionIndex ?? undefined,
        ...(args.layoutId && {
          slideLayoutReference: { layoutId: args.layoutId },
        }),
      },
    },
  ];

  const response = await slides.presentations.batchUpdate({
    presentationId: args.presentationId,
    requestBody: { requests },
  });

  const createSlideResponse = response.data.replies?.[0]?.createSlide;
  const slideId = createSlideResponse?.objectId;

  logger.success(`✅ Created slide: ${slideId}`);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            slideId,
            presentationId: args.presentationId,
          },
          null,
          2
        ),
      },
    ],
  };
};

/**
 * Duplicate a slide
 */
const duplicateSlide = async (args: DuplicateSlideArgs) => {
  const slides = await ensureSlidesClient();

  logger.progress(`📋 Duplicating slide: ${args.slideId}`);

  const requests = [
    {
      duplicateObject: {
        objectId: args.slideId,
      },
    },
  ];

  const response = await slides.presentations.batchUpdate({
    presentationId: args.presentationId,
    requestBody: { requests },
  });

  const duplicateObjectResponse = response.data.replies?.[0]?.duplicateObject;
  const newSlideId = duplicateObjectResponse?.objectId;

  logger.success(`✅ Duplicated slide: ${newSlideId}`);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            originalSlideId: args.slideId,
            newSlideId,
            presentationId: args.presentationId,
          },
          null,
          2
        ),
      },
    ],
  };
};

/**
 * Delete one or more slides
 */
const deleteSlide = async (args: DeleteSlideArgs) => {
  const slides = await ensureSlidesClient();

  logger.progress(`🗑️  Deleting ${args.slideIds.length} slide(s)`);

  const requests = args.slideIds.map((slideId) => ({
    deleteObject: {
      objectId: slideId,
    },
  }));

  await slides.presentations.batchUpdate({
    presentationId: args.presentationId,
    requestBody: { requests },
  });

  logger.success(`✅ Deleted ${args.slideIds.length} slide(s)`);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            slideIds: args.slideIds,
            presentationId: args.presentationId,
            message: `${args.slideIds.length} slide(s) deleted successfully`,
          },
          null,
          2
        ),
      },
    ],
  };
};

/**
 * Reorder slides
 */
const reorderSlides = async (args: ReorderSlidesArgs) => {
  const slides = await ensureSlidesClient();

  logger.progress(
    `🔄 Reordering slides in presentation: ${args.presentationId}`
  );

  const requests = args.slideIds.map((slideId, index) => ({
    updateSlidesPosition: {
      slideObjectIds: [slideId],
      insertionIndex: index,
    },
  }));

  await slides.presentations.batchUpdate({
    presentationId: args.presentationId,
    requestBody: { requests },
  });

  logger.success(`✅ Reordered ${args.slideIds.length} slides`);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            presentationId: args.presentationId,
            slideIds: args.slideIds,
            message: "Slides reordered successfully",
          },
          null,
          2
        ),
      },
    ],
  };
};

/**
 * Get slide details
 */
const getSlide = async (args: GetSlideArgs) => {
  const slides = await ensureSlidesClient();

  logger.progress(`📖 Getting slide: ${args.slideId}`);

  const response = await slides.presentations.pages.get({
    presentationId: args.presentationId,
    pageObjectId: args.slideId,
  });

  const page = response.data;
  logger.success(`✅ Retrieved slide: ${page.objectId}`);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            objectId: page.objectId,
            pageType: page.pageType,
            pageProperties: page.pageProperties,
            pageElements: page.pageElements?.map((element) => ({
              objectId: element.objectId,
              size: element.size,
              transform: element.transform,
              shape: element.shape
                ? { shapeType: element.shape.shapeType }
                : undefined,
              image: element.image
                ? { contentUrl: element.image.contentUrl }
                : undefined,
              table: element.table
                ? { rows: element.table.rows, columns: element.table.columns }
                : undefined,
            })),
          },
          null,
          2
        ),
      },
    ],
  };
};

/**
 * Add speaker notes to a slide
 */
const addSpeakerNotes = async (args: AddSpeakerNotesArgs) => {
  const slides = await ensureSlidesClient();

  logger.progress(`📝 Adding speaker notes to slide: ${args.slideId}`);

  // Get the presentation to find the notes page
  const presentationResponse = await slides.presentations.get({
    presentationId: args.presentationId,
  });

  const presentation = presentationResponse.data;

  // Find the slide index
  const slideIndex = presentation.slides?.findIndex(
    (slide) => slide.objectId === args.slideId
  );

  if (slideIndex === undefined || slideIndex === -1) {
    throw new Error("Slide not found");
  }

  // Find the corresponding notes page
  // Notes pages typically follow slides, but we need to search for a page with pageType NOTES
  // that corresponds to this slide. The relationship is implicit based on order.

  // For now, we'll try to find a notes page by getting the presentation's notes master
  // and using the speakerNotesObjectId from there, or we can create/update notes directly
  // The speaker notes object ID is typically available from the notes master
  const notesMaster = presentation.notesMaster;
  const speakerNotesObjectId =
    notesMaster?.notesProperties?.speakerNotesObjectId;

  if (!speakerNotesObjectId) {
    throw new Error(
      "Speaker notes element not found. Notes master may not be configured."
    );
  }

  // Convert escape sequences to actual characters
  const processedNotes = unescapeText(args.notes);

  await slides.presentations.batchUpdate({
    presentationId: args.presentationId,
    requestBody: {
      requests: [
        {
          insertText: {
            objectId: speakerNotesObjectId,
            text: processedNotes,
            insertionIndex: 0,
          },
        },
      ],
    },
  });

  logger.success(`✅ Added speaker notes`);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            slideId: args.slideId,
            presentationId: args.presentationId,
            message: "Speaker notes added successfully",
          },
          null,
          2
        ),
      },
    ],
  };
};

/**
 * Get speaker notes from a slide
 */
const getSpeakerNotes = async (args: GetSpeakerNotesArgs) => {
  const slides = await ensureSlidesClient();

  logger.progress(`📖 Getting speaker notes for slide: ${args.slideId}`);

  // Get the presentation to find the notes page
  const presentationResponse = await slides.presentations.get({
    presentationId: args.presentationId,
  });

  const presentation = presentationResponse.data;

  // Find the slide index
  const slideIndex = presentation.slides?.findIndex(
    (slide) => slide.objectId === args.slideId
  );

  if (slideIndex === undefined || slideIndex === -1) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              slideId: args.slideId,
              presentationId: args.presentationId,
              notes: "",
              message: "Slide not found",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  // Get the notes master to find the speaker notes object ID
  const notesMaster = presentation.notesMaster;
  const speakerNotesObjectId =
    notesMaster?.notesProperties?.speakerNotesObjectId;

  if (!speakerNotesObjectId) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              slideId: args.slideId,
              presentationId: args.presentationId,
              notes: "",
              message:
                "No speaker notes found. Notes master may not be configured.",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  // Get the notes master page to extract the notes text
  const notesMasterPage = await slides.presentations.pages.get({
    presentationId: args.presentationId,
    pageObjectId: notesMaster?.objectId || "",
  });

  const notesText =
    notesMasterPage.data.pageElements
      ?.find((el) => el.objectId === speakerNotesObjectId)
      ?.shape?.text?.textElements?.map((te) => te.textRun?.content || "")
      .join("") || "";

  logger.success(`✅ Retrieved speaker notes`);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            slideId: args.slideId,
            presentationId: args.presentationId,
            notes: notesText,
          },
          null,
          2
        ),
      },
    ],
  };
};

/**
 * Set slide background (supports solid color, gradient, or image)
 */
const setSlideBackground = async (args: SetSlideBackgroundArgs) => {
  const slides = await ensureSlidesClient();

  // Determine background type
  let backgroundType = "color";
  if (args.imageUrl) {
    backgroundType = "image";
  } else if (args.gradientFill) {
    backgroundType = "gradient";
  }

  logger.progress(
    `🎨 Setting background (${backgroundType}) for slide: ${args.slideId.substring(0, 20)}...`
  );

  // Build pageBackgroundFill based on provided options
  let pageBackgroundFill: Record<string, unknown> = {};

  if (args.imageUrl) {
    // Validate image URL before proceeding
    const imageValidation = validateImageUrl(args.imageUrl);
    if (!imageValidation.valid) {
      const error = createAPIError(
        "Image background",
        imageValidation.error || "Invalid image URL",
        imageValidation.suggestion,
        imageValidation.provided,
        imageValidation.expected
      );
      throw error;
    }

    if (imageValidation.suggestion) {
      logger.debug(`   💡 ${imageValidation.suggestion}`);
    }

    // Image background
    pageBackgroundFill = {
      pictureFill: {
        contentUrl: args.imageUrl,
      },
    };
    logger.debug(`   Image URL: ${args.imageUrl}`);
  } else if (args.gradientFill) {
    // Validate gradient fill before proceeding
    const gradientValidation = validateGradientFill(args.gradientFill);
    if (!gradientValidation.valid) {
      // For gradient fills, we'll still proceed with the workaround but log the limitation
      if (gradientValidation.workaround) {
        logger.info(`   ℹ️  ${gradientValidation.suggestion}`);
      } else {
        // If validation fails for other reasons (invalid colors, etc.), throw error
        const error = createAPIError(
          "Gradient background",
          gradientValidation.error || "Invalid gradient fill",
          gradientValidation.suggestion,
          gradientValidation.provided,
          gradientValidation.expected
        );
        throw error;
      }
    }

    // Gradient background - Google Slides API doesn't support gradient fills
    // directly on pageBackgroundFill, so we need to create a full-slide rectangle
    // with gradient fill and send it to the back as a workaround
    const gradientFill = args.gradientFill;

    const gradientStops = gradientFill.stops.map((stop, index) => ({
      color: stop.color,
      position: stop.position ?? index / (gradientFill.stops.length - 1 || 1),
    }));

    // Calculate angle in radians (Google Slides API uses radians, not degrees)
    // 0 degrees = 0 radians, 90 degrees = π/2 radians
    const angleRadians =
      gradientFill.angle !== undefined
        ? (gradientFill.angle * Math.PI) / 180
        : Math.PI / 2; // Default to 90 degrees (top to bottom)

    // Create a rectangle covering the entire slide (720pt x 405pt)
    // Slide dimensions: 720pt width, 405pt height
    const slideWidth = 720;
    const slideHeight = 405;

    // Use batch_update to create shape with gradient fill
    const requests: Array<Record<string, unknown>> = [
      {
        createShape: {
          objectId: `gradient_bg_${args.slideId}`,
          shapeType: "RECTANGLE",
          elementProperties: {
            pageObjectId: args.slideId,
            size: {
              width: { magnitude: slideWidth, unit: "PT" },
              height: { magnitude: slideHeight, unit: "PT" },
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 0,
              translateY: 0,
              unit: "PT",
            },
          },
        },
      },
      {
        updateShapeProperties: {
          objectId: `gradient_bg_${args.slideId}`,
          shapeProperties: {
            shapeBackgroundFill: {
              gradientFill: {
                gradientStops: gradientStops,
                type: "LINEAR",
                angle: angleRadians,
              },
            },
          },
          fields: "shapeBackgroundFill",
        },
      },
      {
        updatePageElementOrder: {
          objectId: `gradient_bg_${args.slideId}`,
          order: {
            kind: "ORDER_KIND_BACK",
          },
        },
      },
    ];

    logger.debug(
      `   Gradient: ${gradientStops.length} stops, angle: ${gradientFill.angle ?? 90}°`
    );

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

      logger.success(
        `✅ Gradient background set successfully (using shape workaround)`
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                slideId: args.slideId,
                presentationId: args.presentationId,
                backgroundType: "gradient",
                message:
                  "Gradient background set successfully using shape workaround",
                note: "Google Slides API doesn't support gradient fills directly on pageBackgroundFill, so a full-slide rectangle shape was created instead.",
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      const errorMessage = errorObj.message;
      const formattedError = formatErrorForAI(
        errorObj,
        "Setting gradient background"
      );

      logger.error(`❌ Failed to set gradient background: ${errorMessage}`);
      if (formattedError.suggestion) {
        logger.info(`   💡 ${formattedError.suggestion}`);
      }
      if (formattedError.workaround) {
        logger.info(`   🔧 Workaround: ${formattedError.workaround}`);
      }

      // Enhance error with additional context
      const enhancedError = new Error(formattedError.message) as Error & {
        suggestion?: string;
        workaround?: string;
        provided?: unknown;
        expected?: unknown;
      };
      enhancedError.suggestion = formattedError.suggestion;
      if (formattedError.workaround) {
        enhancedError.workaround = formattedError.workaround;
      }
      if (formattedError.provided !== undefined) {
        enhancedError.provided = formattedError.provided;
      }
      if (formattedError.expected !== undefined) {
        enhancedError.expected = formattedError.expected;
      }
      throw enhancedError;
    }
  } else if (args.backgroundColor) {
    // Solid color background
    pageBackgroundFill = {
      solidFill: {
        color: args.backgroundColor,
      },
    };
    logger.debug(
      `   Color: RGB(${args.backgroundColor.rgbColor.red.toFixed(2)}, ${args.backgroundColor.rgbColor.green.toFixed(2)}, ${args.backgroundColor.rgbColor.blue.toFixed(2)})`
    );
  } else {
    throw new Error("Must provide backgroundColor, gradientFill, or imageUrl");
  }

  const requests: Array<Record<string, unknown>> = [
    {
      updatePageProperties: {
        objectId: args.slideId,
        pageProperties: {
          pageBackgroundFill,
        },
        fields: "pageBackgroundFill",
      },
    },
  ];

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

    logger.success(`✅ Slide background set successfully`);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              success: true,
              slideId: args.slideId,
              presentationId: args.presentationId,
              backgroundType,
              message: `Slide background (${backgroundType}) set successfully`,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const errorMessage = errorObj.message;
    const formattedError = formatErrorForAI(
      errorObj,
      "Setting slide background"
    );

    logger.error(`❌ Failed to set slide background: ${errorMessage}`);

    // Provide informative error message for AI agents
    if (formattedError.suggestion) {
      logger.info(`   💡 ${formattedError.suggestion}`);
    }
    if (formattedError.workaround) {
      logger.info(`   🔧 Workaround: ${formattedError.workaround}`);
    }

    // Log the full request for debugging API format issues
    if (
      errorMessage.includes("Invalid JSON") ||
      errorMessage.includes("Cannot find field") ||
      errorMessage.includes("Unknown name")
    ) {
      logger.debug(
        `   Debug - Request payload: ${JSON.stringify(requests, null, 2)}`
      );
      logger.debug(
        `   Debug - This may indicate an API limitation. Check Google Slides API documentation for supported features.`
      );
    }

    // Enhance error with additional context for AI agents
    const enhancedError = new Error(formattedError.message) as Error & {
      suggestion?: string;
      workaround?: string;
      provided?: unknown;
      expected?: unknown;
      apiLimitation?: boolean;
    };
    enhancedError.suggestion = formattedError.suggestion;
    if (formattedError.workaround) {
      enhancedError.workaround = formattedError.workaround;
    }
    if (formattedError.provided !== undefined) {
      enhancedError.provided = formattedError.provided;
    }
    if (formattedError.expected !== undefined) {
      enhancedError.expected = formattedError.expected;
    }
    if (
      "isAPILimitation" in errorObj &&
      (errorObj as { isAPILimitation?: boolean }).isAPILimitation
    ) {
      enhancedError.apiLimitation = true;
    }
    throw enhancedError;
  }
};

// Tool definitions
export const slideTools: MCPToolDefinition[] = [
  {
    name: "create_slide",
    description:
      "Create a new slide in a presentation. Optionally specify a layout ID and insertion index. Example: Create slide at end (no insertionIndex) or at position 2 (insertionIndex=2).",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        layoutId: createStringParam({
          description: "Optional layout ID to apply to the new slide",
          examples: ["p2", "p3"],
        }),
        insertionIndex: createNumberParam({
          description:
            "Optional index where to insert the slide (0-based). Default: adds at end",
          minimum: 0,
          examples: [0, 1, 2],
        }),
      },
      required: ["presentationId"],
    },
    handler: createSlide,
  },
  {
    name: "duplicate_slide",
    description:
      "Create a copy of an existing slide in the presentation. Example: Duplicate slide 'SLIDES_API123_0' to create a template-based slide. Useful for creating similar slides with minor variations.",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        slideId: createStringParam({
          description: "The ID of the slide to duplicate",
          examples: SLIDE_ID_EXAMPLES,
        }),
        insertionIndex: createNumberParam({
          description:
            "Optional index where to insert the duplicated slide (0-based). Default: adds after original",
          minimum: 0,
          examples: [0, 1, 2],
        }),
      },
      required: ["presentationId", "slideId"],
    },
    handler: duplicateSlide,
  },
  {
    name: "delete_slide",
    description:
      "Delete one or more slides from a presentation. Example: Remove slides by their slideIds. Use this to clean up unwanted slides. Single delete operations will be a single element in the array.",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        slideIds: {
          type: "array",
          items: createStringParam({
            description: "The ID of the slide to delete",
            examples: SLIDE_ID_EXAMPLES,
          }),
          description:
            "Array of slide IDs to delete. Example: ['SLIDES_API123_0', 'SLIDES_API456_1']",
        },
      },
      required: ["presentationId", "slideIds"],
    },
    handler: deleteSlide,
  },
  {
    name: "reorder_slides",
    description:
      "Reorder slides in a presentation. Provide an array of slide IDs in the desired order. Example: Reorder slides to ['slide1', 'slide3', 'slide2'] to move slide3 before slide2. Useful for reorganizing presentation flow.",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        slideIds: {
          type: "array",
          items: createStringParam({
            description: "Slide ID",
            examples: SLIDE_ID_EXAMPLES,
          }),
          description:
            "Array of slide IDs in the desired order. Example: ['slide1', 'slide3', 'slide2']",
        },
      },
      required: ["presentationId", "slideIds"],
    },
    handler: reorderSlides,
  },
  {
    name: "get_slide",
    description:
      "Get detailed information about a specific slide including all its elements. Example: Retrieve slide 'SLIDES_API123_0' to see all text boxes, images, and shapes. Use this to inspect slide structure before modifying.",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        slideId: createStringParam({
          description: "The ID of the slide to retrieve",
          examples: SLIDE_ID_EXAMPLES,
        }),
      },
      required: ["presentationId", "slideId"],
    },
    handler: getSlide,
  },
  {
    name: "add_speaker_notes",
    description:
      "Add or update speaker notes for a slide. Example: Add notes 'Remember to mention the key metrics' to slide 'SLIDES_API123_0'. Speaker notes are visible in presenter mode but not in the slide itself.",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        slideId: createStringParam({
          description: "The ID of the slide",
          examples: SLIDE_ID_EXAMPLES,
        }),
        notes: createStringParam({
          description: "The speaker notes text",
          examples: [
            "Remember to mention key metrics",
            "Discuss the problem statement first",
          ],
        }),
      },
      required: ["presentationId", "slideId", "notes"],
    },
    handler: addSpeakerNotes,
  },
  {
    name: "get_speaker_notes",
    description:
      "Get speaker notes for a slide. Example: Retrieve notes from slide 'SLIDES_API123_0'. Use this to read existing speaker notes.",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        slideId: createStringParam({
          description: "The ID of the slide",
          examples: SLIDE_ID_EXAMPLES,
        }),
      },
      required: ["presentationId", "slideId"],
    },
    handler: getSpeakerNotes,
  },
  {
    name: "set_slide_background",
    description:
      "Set the background of a slide in a Google Slides presentation. Supports solid colors, gradients, or images. Example: Solid color (backgroundColor={rgbColor: {red: 0.85, green: 0.92, blue: 0.98}}), gradient (gradientFill={stops: [{color: {rgbColor: {red: 0.2, green: 0.4, blue: 0.8}}, position: 0}, {color: {rgbColor: {red: 0.8, green: 0.9, blue: 1}}, position: 1}], angle: 90}), or image (imageUrl='https://example.com/bg.jpg'). Provide exactly one: backgroundColor, gradientFill, or imageUrl.",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        slideId: createStringParam({
          description: "The ID of the slide",
          examples: SLIDE_ID_EXAMPLES,
        }),
        backgroundColor: {
          type: "object",
          description:
            "Solid background color as RGB object. Example: {rgbColor: {red: 0.85, green: 0.92, blue: 0.98}} for light blue",
          properties: {
            rgbColor: {
              type: "object",
              description: "RGB color values (0-1)",
              properties: {
                red: createNumberParam({
                  description: "Red component (0-1)",
                  minimum: 0,
                  maximum: 1,
                  examples: [0, 0.5, 0.85, 1],
                }),
                green: createNumberParam({
                  description: "Green component (0-1)",
                  minimum: 0,
                  maximum: 1,
                  examples: [0, 0.5, 0.92, 1],
                }),
                blue: createNumberParam({
                  description: "Blue component (0-1)",
                  minimum: 0,
                  maximum: 1,
                  examples: [0, 0.5, 0.98, 1],
                }),
              },
              required: ["red", "green", "blue"],
            },
          },
          required: ["rgbColor"],
        },
        gradientFill: {
          type: "object",
          description:
            "Gradient background. Example: {stops: [{color: {rgbColor: {red: 0.2, green: 0.4, blue: 0.8}}, position: 0}, {color: {rgbColor: {red: 0.8, green: 0.9, blue: 1}}, position: 1}], angle: 90}",
          properties: {
            stops: {
              type: "array",
              description:
                "Gradient color stops. At least 2 stops required. Positions are 0.0 (start) to 1.0 (end).",
              items: {
                type: "object",
                description:
                  "Gradient color stop with color and optional position",
                properties: {
                  color: {
                    type: "object",
                    description: "Color at this stop",
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
                    },
                    required: ["rgbColor"],
                  },
                  position: createNumberParam({
                    description:
                      "Position along gradient (0.0 to 1.0). If omitted, positions are evenly distributed.",
                    minimum: 0,
                    maximum: 1,
                    examples: [0, 0.5, 1],
                  }),
                },
                required: ["color"],
              },
            },
            angle: createNumberParam({
              description:
                "Gradient angle in degrees (0-360). 0 = left to right, 90 = top to bottom, 180 = right to left, 270 = bottom to top",
              minimum: 0,
              maximum: 360,
              examples: [0, 90, 180, 270],
            }),
          },
          required: ["stops"],
        },
        imageUrl: createStringParam({
          description:
            "URL of image to use as background. Must be publicly accessible. Example: https://example.com/background.jpg",
          examples: [
            "https://example.com/background.jpg",
            "https://example.com/pattern.png",
          ],
        }),
      },
      required: ["presentationId", "slideId"],
    },
    handler: setSlideBackground,
  },
];
