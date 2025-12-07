/**
 * Template builders - Category A: Opening & Closing
 */

import { CreateSlideTemplateArgs } from "../../types/templates";
import { addMultipleTextBoxes } from "../text";
import { addImage } from "../images";
import { COLORS } from "../../config/design-system";

export async function buildTitleHero(
  pageId: string,
  presentationId: string,
  content: CreateSlideTemplateArgs["content"]
) {
  await addMultipleTextBoxes({
    presentationId,
    pageId,
    textBoxes: [
      {
        text: content.title || "Title",
        fontSize: 56,
        bold: true,
        alignment: "CENTER",
        y: 120,
      },
      {
        text: content.subtitle || "Subtitle",
        fontSize: 24,
        bold: false,
        alignment: "CENTER",
        foregroundColor: { rgbColor: COLORS.GRAY[600] },
        y: 240,
      },
    ],
    centerHorizontally: true,
  });

  if (content.image_url) {
    await addImage({
      presentationId,
      pageId,
      imageUrl: content.image_url,
      x: 260,
      y: 50,
      width: 200,
      height: 200,
    });
  }
}

export async function buildTitleMinimal(
  pageId: string,
  presentationId: string,
  content: CreateSlideTemplateArgs["content"]
) {
  await addMultipleTextBoxes({
    presentationId,
    pageId,
    textBoxes: [
      {
        text: content.title || "Title",
        fontSize: 48,
        bold: true,
        alignment: "CENTER",
        y: 160,
      },
      {
        text: content.subtitle || "Subtitle",
        fontSize: 18,
        bold: false,
        alignment: "CENTER",
        foregroundColor: { rgbColor: COLORS.GRAY[500] },
        y: 280,
      },
    ],
    centerHorizontally: true,
  });
}

export async function buildTitleImageSplit(
  pageId: string,
  presentationId: string,
  content: CreateSlideTemplateArgs["content"]
) {
  if (content.image_url) {
    await addImage({
      presentationId,
      pageId,
      imageUrl: content.image_url,
      x: 20,
      y: 20,
      width: 340,
      height: 365,
    });
  }

  await addMultipleTextBoxes({
    presentationId,
    pageId,
    textBoxes: [
      {
        text: content.title || "Title",
        fontSize: 44,
        bold: true,
        alignment: "START",
        x: 400,
        y: 120,
        width: 300,
      },
      {
        text: content.subtitle || "Subtitle",
        fontSize: 16,
        bold: false,
        alignment: "START",
        x: 400,
        y: 240,
        width: 300,
      },
    ],
    centerHorizontally: false,
  });
}

export async function buildClosingCTA(
  pageId: string,
  presentationId: string,
  content: CreateSlideTemplateArgs["content"]
) {
  await addMultipleTextBoxes({
    presentationId,
    pageId,
    textBoxes: [
      {
        text: content.cta_text || "Call to Action",
        fontSize: 48,
        bold: true,
        alignment: "CENTER",
        y: 120,
      },
      {
        text: content.subtitle || "Subtitle",
        fontSize: 18,
        bold: false,
        alignment: "CENTER",
        y: 240,
      },
      {
        text: content.contact_info || "Contact information",
        fontSize: 14,
        bold: false,
        alignment: "CENTER",
        foregroundColor: { rgbColor: COLORS.GRAY[600] },
        y: 320,
      },
    ],
    centerHorizontally: true,
  });
}

export async function buildClosingThankYou(
  pageId: string,
  presentationId: string,
  content: CreateSlideTemplateArgs["content"]
) {
  await addMultipleTextBoxes({
    presentationId,
    pageId,
    textBoxes: [
      {
        text: "Thank You",
        fontSize: 44,
        bold: true,
        alignment: "CENTER",
        y: 150,
      },
      {
        text: content.contact_info || "Contact information",
        fontSize: 16,
        bold: false,
        alignment: "CENTER",
        foregroundColor: { rgbColor: COLORS.GRAY[600] },
        y: 280,
      },
    ],
    centerHorizontally: true,
  });
}

