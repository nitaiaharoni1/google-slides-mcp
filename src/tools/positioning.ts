/**
 * Positioning MCP tools
 * Move and resize elements
 */

import { ensureSlidesClient } from "../slides";
import { MCPToolDefinition } from "../types/mcp";
import { SetElementPositionArgs, UpdateZOrderArgs } from "../types/slides";
import { validateAndClampBounds, type BoundsResult } from "../utils/bounds";
import { invalidatePresentationCache } from "../utils/cache";
import { retryWithBackoff } from "../utils/error-handling";
import { logger } from "../utils/logger";
import {
  createXPositionParam,
  createYPositionParam,
  createWidthParam,
  createHeightParam,
  createStringParam,
} from "../utils/schema-builder";
import {
  PRESENTATION_ID_EXAMPLES,
  ELEMENT_ID_EXAMPLES,
} from "../config/examples";
import { ptToEmu, emuToPt } from "./utils";

/**
 * Set element position and size
 */
const setElementPosition = async (args: SetElementPositionArgs) => {
  const slides = await ensureSlidesClient();

  const changes: string[] = [];
  if (args.x !== undefined) changes.push(`x=${args.x}`);
  if (args.y !== undefined) changes.push(`y=${args.y}`);
  if (args.width !== undefined) changes.push(`w=${args.width}`);
  if (args.height !== undefined) changes.push(`h=${args.height}`);

  logger.progress(
    `📍 Positioning element: ${args.objectId.substring(0, 20)}... [${changes.join(", ")}]`
  );

  // Get current element to preserve existing transform
  const presentation = await slides.presentations.get({
    presentationId: args.presentationId,
  });

  interface Transform {
    scaleX?: number | null;
    scaleY?: number | null;
    translateX?: number | null;
    translateY?: number | null;
    unit?: string;
  }

  let currentTransform: Transform = {
    scaleX: 1,
    scaleY: 1,
    translateX: 0,
    translateY: 0,
    unit: "EMU",
  };

  // Find the element
  for (const slide of presentation.data.slides || []) {
    const element = slide.pageElements?.find(
      (el) => el.objectId === args.objectId
    );
    if (element?.transform) {
      const apiTransform = element.transform;
      currentTransform = {
        scaleX: apiTransform.scaleX ?? 1,
        scaleY: apiTransform.scaleY ?? 1,
        translateX: apiTransform.translateX ?? 0,
        translateY: apiTransform.translateY ?? 0,
        unit: apiTransform.unit ?? "EMU",
      };
      break;
    }
  }

  // Get current size in points for validation
  const currentSize = presentation.data.slides
    ?.flatMap((s) => s.pageElements || [])
    .find((el) => el.objectId === args.objectId)?.size;

  const currentWidthPt = currentSize?.width?.magnitude
    ? emuToPt(currentSize.width.magnitude)
    : 200;
  const currentHeightPt = currentSize?.height?.magnitude
    ? emuToPt(currentSize.height.magnitude)
    : 100;

  // Get current position in points
  const currentXPt =
    currentTransform.translateX !== undefined &&
    currentTransform.translateX !== null
      ? emuToPt(currentTransform.translateX)
      : 50;
  const currentYPt =
    currentTransform.translateY !== undefined &&
    currentTransform.translateY !== null
      ? emuToPt(currentTransform.translateY)
      : 50;

  // Use provided values or current values
  const xPt = args.x !== undefined ? args.x : currentXPt;
  const yPt = args.y !== undefined ? args.y : currentYPt;
  const widthPt = args.width !== undefined ? args.width : currentWidthPt;
  const heightPt = args.height !== undefined ? args.height : currentHeightPt;

  // Validate and clamp bounds to prevent overflow
  const boundsResult: BoundsResult = validateAndClampBounds(
    xPt,
    yPt,
    widthPt,
    heightPt
  );

  if (boundsResult.wasClamped) {
    logger.warn(`   ⚠️  Bounds clamped: ${boundsResult.warnings.join("; ")}`);
  }

  // Calculate scale factors if size is changing
  let scaleX = currentTransform.scaleX ?? 1;
  let scaleY = currentTransform.scaleY ?? 1;

  if (args.width !== undefined || args.height !== undefined) {
    const baseWidthEmu = currentSize?.width?.magnitude ?? ptToEmu(200);
    const baseHeightEmu = currentSize?.height?.magnitude ?? ptToEmu(100);

    const targetWidthEmu = ptToEmu(boundsResult.width);
    const targetHeightEmu = ptToEmu(boundsResult.height);

    scaleX = targetWidthEmu / baseWidthEmu;
    scaleY = targetHeightEmu / baseHeightEmu;
  }

  // Update transform with validated values
  const newTransform: Record<string, unknown> = {
    scaleX,
    scaleY,
    translateX: ptToEmu(boundsResult.x),
    translateY: ptToEmu(boundsResult.y),
    unit: "EMU",
  };

  const requests: Array<Record<string, unknown>> = [
    {
      updatePageElementTransform: {
        objectId: args.objectId,
        transform: newTransform,
        applyMode: "ABSOLUTE",
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

    logger.success(`✅ Element positioned successfully`);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              success: true,
              objectId: args.objectId,
              presentationId: args.presentationId,
              message: "Element position/size updated successfully",
              warnings:
                boundsResult.warnings.length > 0
                  ? boundsResult.warnings
                  : undefined,
              adjustments: boundsResult.wasClamped
                ? {
                    originalBounds: boundsResult.originalBounds,
                    clampedBounds: {
                      x: boundsResult.x,
                      y: boundsResult.y,
                      width: boundsResult.width,
                      height: boundsResult.height,
                    },
                  }
                : undefined,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`❌ Failed to position element: ${errorMessage}`);
    throw error;
  }
};

/**
 * Update z-order of elements (bring to front, send to back, etc.)
 */
const updateZOrder = async (args: UpdateZOrderArgs) => {
  const slides = await ensureSlidesClient();

  const operationLabels: Record<string, string> = {
    BRING_TO_FRONT: "bringing to front",
    BRING_FORWARD: "bringing forward",
    SEND_BACKWARD: "sending backward",
    SEND_TO_BACK: "sending to back",
  };

  logger.progress(
    `🔃 Z-order: ${operationLabels[args.operation]} ${args.objectIds.length} element(s)`
  );

  const requests = [
    {
      updatePageElementsZOrder: {
        pageElementObjectIds: args.objectIds,
        operation: args.operation,
      },
    },
  ];

  try {
    await retryWithBackoff(async () => {
      await slides.presentations.batchUpdate({
        presentationId: args.presentationId,
        requestBody: { requests },
      });
    });

    // Invalidate cache after mutation
    invalidatePresentationCache(args.presentationId);

    logger.success(`✅ Z-order updated successfully`);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              success: true,
              presentationId: args.presentationId,
              objectIds: args.objectIds,
              operation: args.operation,
              message: `Elements ${operationLabels[args.operation]} successfully`,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`❌ Failed to update z-order: ${errorMessage}`);
    throw error;
  }
};

// Tool definitions
export const positioningTools: MCPToolDefinition[] = [
  {
    name: "set_element_position",
    description:
      "Move and/or resize an element on a Google Slides slide. All positions and sizes in points. Example: Move element to center and resize (x=360, y=202, width=400, height=200). Values are automatically clamped to slide bounds.",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        objectId: createStringParam({
          description: "The ID of the element",
          examples: ELEMENT_ID_EXAMPLES,
        }),
        x: createXPositionParam({
          description:
            "X position in points (0-700 for standard slides). Values are automatically clamped to slide bounds.",
        }),
        y: createYPositionParam({
          description:
            "Y position in points (0-385 for standard slides). Values are automatically clamped to slide bounds.",
        }),
        width: createWidthParam({
          description:
            "Width in points. Maximum ~680pt for standard slides. Values are automatically clamped.",
        }),
        height: createHeightParam({
          description:
            "Height in points. Maximum ~365pt for standard slides. Values are automatically clamped.",
        }),
      },
      required: ["presentationId", "objectId"],
    },
    handler: setElementPosition,
  },
  {
    name: "update_z_order",
    description:
      "Change the z-order (layering) of elements on a slide. Use BRING_TO_FRONT to move elements above all others, SEND_TO_BACK to move behind all others, or BRING_FORWARD/SEND_BACKWARD to move one layer at a time. Example: Bring an image to front so it overlaps other elements.",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        objectIds: {
          type: "array",
          description:
            "Array of element IDs to reorder. All elements will be moved together. Example: ['shape_123', 'textbox_456']",
          items: {
            type: "string",
            description: "Element ID",
            examples: ELEMENT_ID_EXAMPLES,
          },
        },
        operation: {
          type: "string",
          description:
            "Z-order operation: BRING_TO_FRONT (top), BRING_FORWARD (up one), SEND_BACKWARD (down one), SEND_TO_BACK (bottom)",
          enum: [
            "BRING_TO_FRONT",
            "BRING_FORWARD",
            "SEND_BACKWARD",
            "SEND_TO_BACK",
          ],
          examples: ["BRING_TO_FRONT", "SEND_TO_BACK"],
        },
      },
      required: ["presentationId", "objectIds", "operation"],
    },
    handler: updateZOrder,
  },
];
