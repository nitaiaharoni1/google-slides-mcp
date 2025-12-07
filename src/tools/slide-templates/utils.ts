/**
 * Shared utilities for slide templates
 */

import * as crypto from "crypto";
import { ensureSlidesClient } from "../../slides";
import { ptToEmu } from "../utils";
import { retryWithBackoff } from "../../utils/error-handling";

/**
 * Helper: Create a shape with fill color using batch operations
 */
export async function createShapeWithFill(
  presentationId: string,
  pageId: string,
  shapeType: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fillColor?: { red: number; green: number; blue: number }
): Promise<string> {
  const slides = await ensureSlidesClient();
  const objectId = `shape_${crypto.randomUUID()}`;

  const requests: Array<Record<string, unknown>> = [
    {
      createShape: {
        objectId,
        shapeType,
        elementProperties: {
          pageObjectId: pageId,
          size: {
            height: { magnitude: ptToEmu(height), unit: "EMU" },
            width: { magnitude: ptToEmu(width), unit: "EMU" },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: ptToEmu(x),
            translateY: ptToEmu(y),
            unit: "EMU",
          },
        },
      },
    },
  ];

  if (fillColor) {
    requests.push({
      updateShapeProperties: {
        objectId,
        shapeProperties: {
          shapeBackgroundFill: {
            solidFill: {
              color: { rgbColor: fillColor },
            },
          },
        },
        fields: "shapeBackgroundFill",
      },
    });
  }

  await retryWithBackoff(async () => {
    await slides.presentations.batchUpdate({
      presentationId,
      requestBody: { requests },
    });
  });

  return objectId;
}

