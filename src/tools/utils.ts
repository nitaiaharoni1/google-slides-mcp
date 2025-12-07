/**
 * Shared utility functions for MCP tools
 */

import { CONVERSION } from "../config/constants";
import { ShapeType } from "../types/slides";

/**
 * Convert points to EMU (English Metric Units)
 */
export function ptToEmu(pt: number): number {
  return pt * CONVERSION.EMU_PER_POINT;
}

/**
 * Convert EMU to points
 */
export function emuToPt(emu: number): number {
  return emu / CONVERSION.EMU_PER_POINT;
}

/**
 * Normalize color object for Google Slides API
 * The API expects foregroundColor to be an OpaqueColor object with rgbColor field
 */
export function normalizeColorForAPI(
  color:
    | { rgbColor?: { red?: number; green?: number; blue?: number } }
    | undefined
):
  | { opaqueColor: { rgbColor: { red: number; green: number; blue: number } } }
  | undefined {
  if (!color || !color.rgbColor) {
    return undefined;
  }

  const { red = 0, green = 0, blue = 0 } = color.rgbColor;
  return {
    opaqueColor: {
      rgbColor: {
        red,
        green,
        blue,
      },
    },
  };
}

/**
 * Validate shape type
 */
export function isValidShapeType(shapeType: string): shapeType is ShapeType {
  const validTypes: ShapeType[] = [
    "RECTANGLE",
    "ROUND_RECTANGLE",
    "ELLIPSE",
    "ARC",
    "BENT_ARROW",
    "BENT_UP_ARROW",
    "BRACE",
    "BRACKET",
    "CAN",
    "CHEVRON",
    "CLOUD",
    "CORNER",
    "CUBE",
    "CURVED_DOWN_ARROW",
    "CURVED_LEFT_ARROW",
    "CURVED_RIGHT_ARROW",
    "CURVED_UP_ARROW",
    "DECAGON",
    "DIAGONAL_STRIPE",
    "DIAMOND",
    "DODECAGON",
    "DONUT",
    "DOUBLE_WAVE",
    "DOWN_ARROW",
    "DOWN_ARROW_CALLOUT",
    "FOLDED_CORNER",
    "FRAME",
    "FUNNEL",
    "GEAR_6",
    "GEAR_9",
    "HAILSTONE",
    "HEART",
    "HEPTAGON",
    "HEXAGON",
    "HOME_PLATE",
    "HORIZONTAL_SCROLL",
    "IRREGULAR_SEAL_1",
    "IRREGULAR_SEAL_2",
    "LEFT_ARROW",
    "LEFT_ARROW_CALLOUT",
    "LEFT_BRACE",
    "LEFT_BRACKET",
    "LEFT_RIGHT_ARROW",
    "LEFT_RIGHT_ARROW_CALLOUT",
    "LEFT_RIGHT_UP_ARROW",
    "LEFT_UP_ARROW",
    "LIGHTNING_BOLT",
    "MATH_DIVIDE",
    "MATH_EQUAL",
    "MATH_MINUS",
    "MATH_MULTIPLY",
    "MATH_NOT_EQUAL",
    "MATH_PLUS",
    "MOON",
    "NO_SMOKING",
    "NOTCHED_RIGHT_ARROW",
    "OCTAGON",
    "PARALLELOGRAM",
    "PENTAGON",
    "PIE",
    "PLAQUE",
    "PLUS",
    "QUAD_ARROW",
    "QUAD_ARROW_CALLOUT",
    "RIBBON",
    "RIBBON_2",
    "RIGHT_ARROW",
    "RIGHT_ARROW_CALLOUT",
    "RIGHT_BRACE",
    "RIGHT_BRACKET",
    "ROUND_1_RECTANGLE",
    "ROUND_2_DIAGONAL_RECTANGLE",
    "ROUND_2_SAME_RECTANGLE",
    "RIGHT_TRIANGLE",
    "SMILEY_FACE",
    "SNIP_1_RECTANGLE",
    "SNIP_2_DIAGONAL_RECTANGLE",
    "SNIP_2_SAME_RECTANGLE",
    "SNIP_ROUND_RECTANGLE",
    "STAR_10",
    "STAR_12",
    "STAR_16",
    "STAR_24",
    "STAR_32",
    "STAR_4",
    "STAR_5",
    "STAR_6",
    "STAR_7",
    "STAR_8",
    "STRIPED_RIGHT_ARROW",
    "SUN",
    "TRAPEZOID",
    "TRIANGLE",
    "UP_ARROW",
    "UP_ARROW_CALLOUT",
    "UP_DOWN_ARROW",
    "UTURN_ARROW",
    "VERTICAL_SCROLL",
    "WAVE",
    "WEDGE_ELLIPSE_CALLOUT",
    "WEDGE_RECTANGLE_CALLOUT",
    "WEDGE_ROUND_RECTANGLE_CALLOUT",
  ];
  return validTypes.includes(shapeType as ShapeType);
}
