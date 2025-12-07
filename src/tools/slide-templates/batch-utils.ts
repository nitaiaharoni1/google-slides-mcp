/**
 * Batch utilities for template builders
 * Collects all operations and executes them in minimal API calls
 */

import * as crypto from "crypto";
import { ensureSlidesClient } from "../../slides";
import { ptToEmu } from "../utils";
import { retryWithBackoff } from "../../utils/error-handling";
import { unescapeText } from "../../utils/text-handling";
import { normalizeColorForAPI } from "../utils";

export interface ShapeToCreate {
  shapeType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor?: { red: number; green: number; blue: number };
  text?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  alignment?: "START" | "CENTER" | "END" | "JUSTIFIED";
  foregroundColor?: { rgbColor: { red: number; green: number; blue: number } };
}

export interface TextBoxToCreate {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  bold?: boolean;
  italic?: boolean;
  alignment?: "START" | "CENTER" | "END" | "JUSTIFIED";
  foregroundColor?: { rgbColor: { red: number; green: number; blue: number } };
}

/**
 * Batch create multiple shapes and text boxes in minimal API calls
 * Returns object IDs for created elements
 */
export async function batchCreateElements(
  presentationId: string,
  pageId: string,
  shapes: ShapeToCreate[] = [],
  textBoxes: TextBoxToCreate[] = []
): Promise<{
  shapeIds: string[];
  textBoxIds: string[];
}> {
  const slides = await ensureSlidesClient();
  const allRequests: Array<Record<string, unknown>> = [];
  const shapeIds: string[] = [];
  const textBoxIds: string[] = [];

  // Create all shapes first
  for (const shape of shapes) {
    const objectId = `shape_${crypto.randomUUID()}`;
    shapeIds.push(objectId);

    allRequests.push({
      createShape: {
        objectId,
        shapeType: shape.shapeType,
        elementProperties: {
          pageObjectId: pageId,
          size: {
            height: { magnitude: ptToEmu(shape.height), unit: "EMU" },
            width: { magnitude: ptToEmu(shape.width), unit: "EMU" },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: ptToEmu(shape.x),
            translateY: ptToEmu(shape.y),
            unit: "EMU",
          },
        },
      },
    });

    // Add fill color if provided
    if (shape.fillColor) {
      allRequests.push({
        updateShapeProperties: {
          objectId,
          shapeProperties: {
            shapeBackgroundFill: {
              solidFill: {
                color: { rgbColor: shape.fillColor },
              },
            },
          },
          fields: "shapeBackgroundFill",
        },
      });
    }

    // Add text to shape if provided
    if (shape.text !== undefined && shape.text !== null) {
      const processedText = unescapeText(shape.text);
      allRequests.push({
        insertText: {
          objectId,
          insertionIndex: 0,
          text: processedText,
        },
      });

      // Apply text formatting
      const textStyleUpdates: Record<string, unknown> = {};
      const textStyleFields: string[] = [];

      if (shape.fontSize !== undefined) {
        textStyleUpdates.fontSize = { magnitude: shape.fontSize, unit: "PT" };
        textStyleFields.push("fontSize");
      }
      if (shape.bold !== undefined) {
        textStyleUpdates.bold = shape.bold;
        textStyleFields.push("bold");
      }
      if (shape.italic !== undefined) {
        textStyleUpdates.italic = shape.italic;
        textStyleFields.push("italic");
      }
      if (shape.foregroundColor !== undefined) {
        const normalizedColor = normalizeColorForAPI(shape.foregroundColor);
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

      // Apply alignment
      if (shape.alignment) {
        allRequests.push({
          updateParagraphStyle: {
            objectId,
            style: {
              alignment: shape.alignment,
            },
            textRange: { type: "ALL" },
            fields: "alignment",
          },
        });
      }
    }
  }

  // Create all text boxes
  for (const textBox of textBoxes) {
    const objectId = `textbox_${crypto.randomUUID()}`;
    textBoxIds.push(objectId);

    allRequests.push({
      createShape: {
        objectId,
        shapeType: "TEXT_BOX",
        elementProperties: {
          pageObjectId: pageId,
          size: {
            height: { magnitude: ptToEmu(textBox.height), unit: "EMU" },
            width: { magnitude: ptToEmu(textBox.width), unit: "EMU" },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: ptToEmu(textBox.x),
            translateY: ptToEmu(textBox.y),
            unit: "EMU",
          },
        },
      },
    });

    // Insert text
    const processedText = unescapeText(textBox.text);
    allRequests.push({
      insertText: {
        objectId,
        insertionIndex: 0,
        text: processedText,
      },
    });

    // Apply text formatting
    const textStyleUpdates: Record<string, unknown> = {};
    const textStyleFields: string[] = [];

    textStyleUpdates.fontSize = { magnitude: textBox.fontSize, unit: "PT" };
    textStyleFields.push("fontSize");

    if (textBox.bold !== undefined) {
      textStyleUpdates.bold = textBox.bold;
      textStyleFields.push("bold");
    }
    if (textBox.italic !== undefined) {
      textStyleUpdates.italic = textBox.italic;
      textStyleFields.push("italic");
    }
    if (textBox.foregroundColor !== undefined) {
      const normalizedColor = normalizeColorForAPI(textBox.foregroundColor);
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

    // Apply alignment
    const alignment = textBox.alignment || "START";
    allRequests.push({
      updateParagraphStyle: {
        objectId,
        style: {
          alignment,
        },
        textRange: { type: "ALL" },
        fields: "alignment",
      },
    });
  }

  // Execute all requests in a single batch (up to 50 requests per batch)
  // Split into chunks if needed
  const MAX_REQUESTS_PER_BATCH = 50;
  for (let i = 0; i < allRequests.length; i += MAX_REQUESTS_PER_BATCH) {
    const chunk = allRequests.slice(i, i + MAX_REQUESTS_PER_BATCH);
    await retryWithBackoff(async (): Promise<void> => {
      await slides.presentations.batchUpdate({
        presentationId,
        requestBody: { requests: chunk },
      });
    });
  }

  return { shapeIds, textBoxIds };
}

/**
 * Create a standard title text box
 * Common pattern used across most templates
 */
export function createTitleTextBox(
  title: string,
  options?: {
    fontSize?: number;
    y?: number;
    foregroundColor?: {
      rgbColor: { red: number; green: number; blue: number };
    };
  }
): TextBoxToCreate {
  return {
    text: title,
    fontSize: options?.fontSize ?? 32,
    bold: true,
    alignment: "CENTER",
    x: 0, // Will be centered by batchCreateElements
    y: options?.y ?? 40,
    width: 600, // Standard width for titles
    height: 60,
    foregroundColor: options?.foregroundColor,
  };
}

/**
 * Batch create elements with optional title
 * This is the main helper that templates should use - it handles title + content in one batch
 */
export async function batchCreateWithTitle(
  presentationId: string,
  pageId: string,
  title: string | undefined,
  shapes: ShapeToCreate[] = [],
  textBoxes: TextBoxToCreate[] = [],
  titleOptions?: {
    fontSize?: number;
    y?: number;
    foregroundColor?: {
      rgbColor: { red: number; green: number; blue: number };
    };
  }
): Promise<{
  shapeIds: string[];
  textBoxIds: string[];
}> {
  const allTextBoxes: TextBoxToCreate[] = [];

  // Add title if provided
  if (title) {
    const titleBox = createTitleTextBox(title, titleOptions);
    // Calculate centered x position (slide width 720pt, so center is 360pt)
    titleBox.x = (720 - titleBox.width) / 2;
    allTextBoxes.push(titleBox);
  }

  // Add all other text boxes
  allTextBoxes.push(...textBoxes);

  // Create everything in one batch
  return batchCreateElements(presentationId, pageId, shapes, allTextBoxes);
}
