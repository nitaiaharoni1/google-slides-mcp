/**
 * Template builders - Category F: Specialized
 */

import { CreateSlideTemplateArgs } from "../../types/templates";
import { addMultipleTextBoxes } from "../text";
import { COLORS } from "../../config/design-system";

export async function buildSectionDivider(
  pageId: string,
  presentationId: string,
  content: CreateSlideTemplateArgs["content"]
) {
  await addMultipleTextBoxes({
    presentationId,
    pageId,
    textBoxes: [
      {
        text: content.section_number || "01",
        fontSize: 72,
        bold: true,
        alignment: "CENTER",
        foregroundColor: { rgbColor: COLORS.GRAY[300] },
        y: 120,
      },
      {
        text: content.section_title || content.title || "Section Title",
        fontSize: 44,
        bold: true,
        alignment: "CENTER",
        y: 240,
      },
    ],
    centerHorizontally: true,
  });
}

