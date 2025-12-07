/**
 * Template builders - Category B: Content & Text
 */

import { CreateSlideTemplateArgs } from "../../types/templates";
import { addMultipleTextBoxes } from "../text";
import { addImage } from "../images";
import { COLORS } from "../../config/design-system";

export async function buildBulletsClean(
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
        fontSize: 32,
        bold: true,
        alignment: "CENTER",
        y: 40,
      },
      {
        text: (content.bullets || []).join("\n"),
        fontSize: 16,
        bold: false,
        alignment: "START",
        x: 100,
        y: 120,
        width: 520,
      },
    ],
    centerHorizontally: true,
  });
}

export async function buildBulletsNumbered(
  pageId: string,
  presentationId: string,
  content: CreateSlideTemplateArgs["content"]
) {
  const numberedBullets = (content.bullets || []).map(
    (bullet, i) => `${i + 1}. ${bullet}`
  );

  await addMultipleTextBoxes({
    presentationId,
    pageId,
    textBoxes: [
      {
        text: content.title || "Title",
        fontSize: 32,
        bold: true,
        alignment: "CENTER",
        y: 40,
      },
      {
        text: numberedBullets.join("\n"),
        fontSize: 18,
        bold: false,
        alignment: "START",
        x: 100,
        y: 120,
        width: 520,
      },
    ],
    centerHorizontally: true,
  });
}

export async function buildTwoColumnText(
  pageId: string,
  presentationId: string,
  content: CreateSlideTemplateArgs["content"]
) {
  const columns = content.columns || [
    { title: "Column 1", content: "Content 1" },
    { title: "Column 2", content: "Content 2" },
  ];

  await addMultipleTextBoxes({
    presentationId,
    pageId,
    textBoxes: [
      {
        text: content.title || "Title",
        fontSize: 32,
        bold: true,
        alignment: "CENTER",
        y: 40,
      },
      {
        text: `${columns[0]?.title || ""}\n\n${columns[0]?.content || ""}`,
        fontSize: 14,
        bold: false,
        alignment: "START",
        x: 60,
        y: 120,
        width: 280,
      },
      {
        text: `${columns[1]?.title || ""}\n\n${columns[1]?.content || ""}`,
        fontSize: 14,
        bold: false,
        alignment: "START",
        x: 380,
        y: 120,
        width: 280,
      },
    ],
    centerHorizontally: false,
  });
}

export async function buildTwoColumnImageLeft(
  pageId: string,
  presentationId: string,
  content: CreateSlideTemplateArgs["content"]
) {
  if (content.image_url) {
    await addImage({
      presentationId,
      pageId,
      imageUrl: content.image_url,
      x: 60,
      y: 120,
      width: 280,
      height: 240,
    });
  }

  const columns = content.columns || [{ title: "Title", content: "Content" }];

  await addMultipleTextBoxes({
    presentationId,
    pageId,
    textBoxes: [
      {
        text: content.title || "Title",
        fontSize: 32,
        bold: true,
        alignment: "CENTER",
        y: 40,
      },
      {
        text: `${columns[0]?.title || ""}\n\n${columns[0]?.content || ""}`,
        fontSize: 14,
        bold: false,
        alignment: "START",
        x: 380,
        y: 120,
        width: 280,
      },
    ],
    centerHorizontally: false,
  });
}

export async function buildTwoColumnImageRight(
  pageId: string,
  presentationId: string,
  content: CreateSlideTemplateArgs["content"]
) {
  const columns = content.columns || [{ title: "Title", content: "Content" }];

  await addMultipleTextBoxes({
    presentationId,
    pageId,
    textBoxes: [
      {
        text: content.title || "Title",
        fontSize: 32,
        bold: true,
        alignment: "CENTER",
        y: 40,
      },
      {
        text: `${columns[0]?.title || ""}\n\n${columns[0]?.content || ""}`,
        fontSize: 14,
        bold: false,
        alignment: "START",
        x: 60,
        y: 120,
        width: 280,
      },
    ],
    centerHorizontally: false,
  });

  if (content.image_url) {
    await addImage({
      presentationId,
      pageId,
      imageUrl: content.image_url,
      x: 380,
      y: 120,
      width: 280,
      height: 240,
    });
  }
}

export async function buildThreeColumn(
  pageId: string,
  presentationId: string,
  content: CreateSlideTemplateArgs["content"]
) {
  const columns = content.columns || [
    { title: "Column 1", content: "Content 1" },
    { title: "Column 2", content: "Content 2" },
    { title: "Column 3", content: "Content 3" },
  ];

  await addMultipleTextBoxes({
    presentationId,
    pageId,
    textBoxes: [
      {
        text: content.title || "Title",
        fontSize: 32,
        bold: true,
        alignment: "CENTER",
        y: 40,
      },
      {
        text: `${columns[0]?.title || ""}\n\n${columns[0]?.content || ""}`,
        fontSize: 14,
        bold: false,
        alignment: "START",
        x: 40,
        y: 120,
        width: 200,
      },
      {
        text: `${columns[1]?.title || ""}\n\n${columns[1]?.content || ""}`,
        fontSize: 14,
        bold: false,
        alignment: "START",
        x: 260,
        y: 120,
        width: 200,
      },
      {
        text: `${columns[2]?.title || ""}\n\n${columns[2]?.content || ""}`,
        fontSize: 14,
        bold: false,
        alignment: "START",
        x: 480,
        y: 120,
        width: 200,
      },
    ],
    centerHorizontally: false,
  });
}

export async function buildQuoteSpotlight(
  pageId: string,
  presentationId: string,
  content: CreateSlideTemplateArgs["content"]
) {
  await addMultipleTextBoxes({
    presentationId,
    pageId,
    textBoxes: [
      {
        text: `"${content.quote || "Quote"}"`,
        fontSize: 32,
        bold: true,
        alignment: "CENTER",
        foregroundColor: { rgbColor: COLORS.GRAY[700] },
        y: 100,
      },
      {
        text: `— ${content.attribution || "Attribution"}`,
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

export async function buildBigStatement(
  pageId: string,
  presentationId: string,
  content: CreateSlideTemplateArgs["content"]
) {
  await addMultipleTextBoxes({
    presentationId,
    pageId,
    textBoxes: [
      {
        text: content.statement || content.title || "Big Statement",
        fontSize: 48,
        bold: true,
        alignment: "CENTER",
        y: 150,
      },
    ],
    centerHorizontally: true,
  });
}

