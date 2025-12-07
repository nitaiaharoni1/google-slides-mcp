/**
 * Template builders - Category C: Data & Metrics
 */

import * as crypto from "crypto";
import { CreateSlideTemplateArgs } from "../../types/templates";
import {
  batchCreateWithTitle,
  ShapeToCreate,
  TextBoxToCreate,
} from "./batch-utils";
import { ensureSlidesClient } from "../../slides";
import { ptToEmu } from "../utils";
import { retryWithBackoff } from "../../utils/error-handling";
import { COLORS } from "../../config/design-system";
import { addMultipleTextBoxes } from "../text";
import { createShapeWithFill } from "./utils";
import { addShape } from "../shapes";

export async function buildMetrics2x2(
  pageId: string,
  presentationId: string,
  content: CreateSlideTemplateArgs["content"]
) {
  const metrics = content.metrics || [
    { value: "0", label: "Metric 1" },
    { value: "0", label: "Metric 2" },
    { value: "0", label: "Metric 3" },
    { value: "0", label: "Metric 4" },
  ];

  // Create 4 metric cards
  const positions = [
    { x: 80, y: 120 },
    { x: 380, y: 120 },
    { x: 80, y: 260 },
    { x: 380, y: 260 },
  ];

  // Collect all shapes and text boxes for batch creation
  const shapesToCreate: ShapeToCreate[] = [];
  const textBoxesToCreate: TextBoxToCreate[] = [];

  for (let i = 0; i < 4; i++) {
    const metric = metrics[i];
    if (metric) {
      // Background shape
      shapesToCreate.push({
        shapeType: "ROUND_RECTANGLE",
        x: positions[i].x,
        y: positions[i].y,
        width: 260,
        height: 120,
        fillColor: COLORS.PRIMARY.LIGHT,
      });

      // Metric value text box
      textBoxesToCreate.push({
        text: metric.value,
        fontSize: 36,
        bold: true,
        alignment: "CENTER",
        foregroundColor: { rgbColor: COLORS.PRIMARY.MAIN },
        x: positions[i].x,
        y: positions[i].y + 20,
        width: 260,
        height: 50,
      });

      // Metric label text box
      textBoxesToCreate.push({
        text: metric.label.toUpperCase(),
        fontSize: 11,
        bold: false,
        alignment: "CENTER",
        foregroundColor: { rgbColor: COLORS.GRAY[600] },
        x: positions[i].x,
        y: positions[i].y + 80,
        width: 260,
        height: 30,
      });
    }
  }

  // Create all elements (including title) in one batch
  await batchCreateWithTitle(
    presentationId,
    pageId,
    content.title || "Metrics",
    shapesToCreate,
    textBoxesToCreate
  );
}

export async function buildMetrics3Row(
  pageId: string,
  presentationId: string,
  content: CreateSlideTemplateArgs["content"]
) {
  const metrics = content.metrics || [
    { value: "0", label: "Metric 1" },
    { value: "0", label: "Metric 2" },
    { value: "0", label: "Metric 3" },
  ];

  const positions = [
    { x: 60, y: 140 },
    { x: 270, y: 140 },
    { x: 480, y: 140 },
  ];

  // Collect all shapes and text boxes for batch creation
  const shapesToCreate: ShapeToCreate[] = [];
  const textBoxesToCreate: TextBoxToCreate[] = [];

  for (let i = 0; i < 3; i++) {
    const metric = metrics[i];
    if (metric) {
      shapesToCreate.push({
        shapeType: "ROUND_RECTANGLE",
        x: positions[i].x,
        y: positions[i].y,
        width: 180,
        height: 200,
        fillColor: COLORS.PRIMARY.LIGHT,
      });

      textBoxesToCreate.push({
        text: metric.value,
        fontSize: 48,
        bold: true,
        alignment: "CENTER",
        foregroundColor: { rgbColor: COLORS.PRIMARY.MAIN },
        x: positions[i].x,
        y: positions[i].y + 40,
        width: 180,
        height: 80,
      });

      textBoxesToCreate.push({
        text: metric.label.toUpperCase(),
        fontSize: 12,
        bold: false,
        alignment: "CENTER",
        foregroundColor: { rgbColor: COLORS.GRAY[600] },
        x: positions[i].x,
        y: positions[i].y + 140,
        width: 180,
        height: 40,
      });
    }
  }

  // Create all elements (including title) in one batch
  await batchCreateWithTitle(
    presentationId,
    pageId,
    content.title || "Metrics",
    shapesToCreate,
    textBoxesToCreate
  );
}

export async function buildMetrics4Row(
  pageId: string,
  presentationId: string,
  content: CreateSlideTemplateArgs["content"]
) {
  const metrics = content.metrics || [
    { value: "0", label: "Metric 1" },
    { value: "0", label: "Metric 2" },
    { value: "0", label: "Metric 3" },
    { value: "0", label: "Metric 4" },
  ];

  const positions = [
    { x: 40, y: 140 },
    { x: 210, y: 140 },
    { x: 380, y: 140 },
    { x: 550, y: 140 },
  ];

  // Collect all shapes and text boxes for batch creation
  const shapesToCreate: ShapeToCreate[] = [];
  const textBoxesToCreate: TextBoxToCreate[] = [];

  for (let i = 0; i < 4; i++) {
    const metric = metrics[i];
    if (metric) {
      shapesToCreate.push({
        shapeType: "ROUND_RECTANGLE",
        x: positions[i].x,
        y: positions[i].y,
        width: 150,
        height: 200,
        fillColor: COLORS.PRIMARY.LIGHT,
      });

      textBoxesToCreate.push({
        text: metric.value,
        fontSize: 40,
        bold: true,
        alignment: "CENTER",
        foregroundColor: { rgbColor: COLORS.PRIMARY.MAIN },
        x: positions[i].x,
        y: positions[i].y + 30,
        width: 150,
        height: 70,
      });

      textBoxesToCreate.push({
        text: metric.label.toUpperCase(),
        fontSize: 11,
        bold: false,
        alignment: "CENTER",
        foregroundColor: { rgbColor: COLORS.GRAY[600] },
        x: positions[i].x,
        y: positions[i].y + 120,
        width: 150,
        height: 60,
      });
    }
  }

  // Create all elements (including title) in one batch
  await batchCreateWithTitle(
    presentationId,
    pageId,
    content.title || "Metrics",
    shapesToCreate,
    textBoxesToCreate
  );
}

export async function buildMetricsSingle(
  pageId: string,
  presentationId: string,
  content: CreateSlideTemplateArgs["content"]
) {
  const metric = content.metrics?.[0] || { value: "0", label: "Metric" };

  await addMultipleTextBoxes({
    presentationId,
    pageId,
    textBoxes: [
      {
        text: metric.value,
        fontSize: 72,
        bold: true,
        alignment: "CENTER",
        y: 100,
      },
      {
        text: metric.label.toUpperCase(),
        fontSize: 24,
        bold: false,
        alignment: "CENTER",
        foregroundColor: { rgbColor: COLORS.GRAY[600] },
        y: 240,
      },
      {
        text: content.subtitle || "",
        fontSize: 16,
        bold: false,
        alignment: "CENTER",
        y: 320,
      },
    ],
    centerHorizontally: true,
  });
}

export async function buildComparisonTable(
  pageId: string,
  presentationId: string,
  content: CreateSlideTemplateArgs["content"]
) {
  const headers = content.comparison_headers || [
    "Feature",
    "Option 1",
    "Option 2",
  ];
  const rows = content.comparison_rows || [
    { feature: "Feature 1", values: ["Yes", "No"] },
    { feature: "Feature 2", values: ["No", "Yes"] },
  ];

  await addMultipleTextBoxes({
    presentationId,
    pageId,
    textBoxes: [
      {
        text: content.title || "Comparison",
        fontSize: 32,
        bold: true,
        alignment: "CENTER",
        y: 40,
      },
    ],
    centerHorizontally: true,
  });

  const tableData = [
    headers,
    ...rows.map((row) => [row.feature, ...row.values]),
  ];

  // Create table using API directly
  const slides = await ensureSlidesClient();
  const tableObjectId = `table_${crypto.randomUUID()}`;

  await retryWithBackoff(async () => {
    await slides.presentations.batchUpdate({
      presentationId,
      requestBody: {
        requests: [
          {
            createTable: {
              objectId: tableObjectId,
              elementProperties: {
                pageObjectId: pageId,
                size: {
                  height: { magnitude: ptToEmu(240), unit: "EMU" },
                  width: { magnitude: ptToEmu(600), unit: "EMU" },
                },
                transform: {
                  scaleX: 1,
                  scaleY: 1,
                  translateX: ptToEmu(60),
                  translateY: ptToEmu(120),
                  unit: "EMU",
                },
              },
              rows: tableData.length,
              columns: headers.length,
            },
          },
        ],
      },
    });
  });

  // Populate table cells
  for (let rowIndex = 0; rowIndex < tableData.length; rowIndex++) {
    const row = tableData[rowIndex];
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      await retryWithBackoff(async () => {
        await slides.presentations.batchUpdate({
          presentationId,
          requestBody: {
            requests: [
              {
                insertText: {
                  objectId: tableObjectId,
                  cellLocation: {
                    rowIndex,
                    columnIndex: colIndex,
                  },
                  text: row[colIndex] || "",
                },
              },
            ],
          },
        });
      });
    }
  }
}

export async function buildPricingTiers(
  pageId: string,
  presentationId: string,
  content: CreateSlideTemplateArgs["content"]
) {
  const tiers = content.pricing_tiers || [
    { name: "Basic", price: "$0", features: ["Feature 1"] },
    {
      name: "Pro",
      price: "$10",
      features: ["Feature 1", "Feature 2"],
      highlighted: true,
    },
    { name: "Enterprise", price: "$50", features: ["All features"] },
  ];

  await addMultipleTextBoxes({
    presentationId,
    pageId,
    textBoxes: [
      {
        text: content.title || "Pricing",
        fontSize: 32,
        bold: true,
        alignment: "CENTER",
        y: 40,
      },
    ],
    centerHorizontally: true,
  });

  const positions = [
    { x: 40, y: 120 },
    { x: 260, y: 120 },
    { x: 480, y: 120 },
  ];

  for (let i = 0; i < 3; i++) {
    const tier = tiers[i];
    if (tier) {
      await createShapeWithFill(
        presentationId,
        pageId,
        "ROUND_RECTANGLE",
        positions[i].x,
        positions[i].y,
        200,
        240,
        tier.highlighted ? COLORS.PRIMARY.LIGHT : COLORS.GRAY[100]
      );

      await addMultipleTextBoxes({
        presentationId,
        pageId,
        textBoxes: [
          {
            text: tier.name,
            fontSize: 24,
            bold: true,
            alignment: "CENTER",
            x: positions[i].x,
            y: positions[i].y + 20,
            width: 200,
            height: 40,
          },
          {
            text: tier.price,
            fontSize: 32,
            bold: true,
            alignment: "CENTER",
            x: positions[i].x,
            y: positions[i].y + 70,
            width: 200,
            height: 50,
          },
          {
            text: tier.features.join("\n"),
            fontSize: 14,
            bold: false,
            alignment: "START",
            x: positions[i].x + 20,
            y: positions[i].y + 140,
            width: 160,
            height: 80,
          },
        ],
        centerHorizontally: false,
      });
    }
  }
}

export async function buildBeforeAfter(
  pageId: string,
  presentationId: string,
  content: CreateSlideTemplateArgs["content"]
) {
  await addMultipleTextBoxes({
    presentationId,
    pageId,
    textBoxes: [
      {
        text: content.title || "Before & After",
        fontSize: 32,
        bold: true,
        alignment: "CENTER",
        y: 40,
      },
      {
        text: `${content.before_title || "Before"}\n\n${content.before_content || ""}`,
        fontSize: 20,
        bold: true,
        alignment: "CENTER",
        x: 100,
        y: 120,
        width: 240,
      },
      {
        text: `${content.after_title || "After"}\n\n${content.after_content || ""}`,
        fontSize: 20,
        bold: true,
        alignment: "CENTER",
        x: 440,
        y: 120,
        width: 240,
      },
    ],
    centerHorizontally: false,
  });

  // Arrow shape
  await addShape({
    presentationId,
    pageId,
    shapeType: "RIGHT_ARROW",
    x: 360,
    y: 200,
    width: 40,
    height: 40,
  });
}
