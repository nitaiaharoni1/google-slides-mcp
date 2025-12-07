/**
 * Template builders - Category D: Visual & Process
 */

import { CreateSlideTemplateArgs } from "../../types/templates";
import {
  batchCreateWithTitle,
  ShapeToCreate,
  TextBoxToCreate,
} from "./batch-utils";
import { COLORS } from "../../config/design-system";

export async function buildTimelineHorizontal(
  pageId: string,
  presentationId: string,
  content: CreateSlideTemplateArgs["content"]
) {
  const steps = content.steps || [
    { title: "Step 1", description: "Description" },
    { title: "Step 2", description: "Description" },
    { title: "Step 3", description: "Description" },
  ];

  const positions = [
    { x: 80, y: 180 },
    { x: 300, y: 180 },
    { x: 520, y: 180 },
  ];

  // Collect all shapes and text boxes for batch creation
  const shapesToCreate: ShapeToCreate[] = [];
  const textBoxesToCreate: TextBoxToCreate[] = [];

  for (let i = 0; i < Math.min(3, steps.length); i++) {
    const step = steps[i];
    if (step) {
      const shapeY = positions[i].y;
      const shapeHeight = 120;
      const shapeWidth = 120;
      const textHeight = 60;
      const textY = shapeY + (shapeHeight - textHeight) / 2;

      // Add shape
      shapesToCreate.push({
        shapeType: "ROUND_RECTANGLE",
        x: positions[i].x,
        y: shapeY,
        width: shapeWidth,
        height: shapeHeight,
        fillColor: COLORS.PRIMARY.LIGHT,
      });

      // Add text box inside shape
      textBoxesToCreate.push({
        text: step.title + (step.description ? `\n${step.description}` : ""),
        fontSize: 16,
        bold: true,
        alignment: "CENTER",
        x: positions[i].x,
        y: textY,
        width: shapeWidth,
        height: textHeight,
      });

      // Add arrow between steps
      if (i < steps.length - 1) {
        shapesToCreate.push({
          shapeType: "RIGHT_ARROW",
          x: positions[i].x + 120,
          y: positions[i].y + 40,
          width: 40,
          height: 40,
        });
      }
    }
  }

  // Create all elements (including title) in one batch
  await batchCreateWithTitle(
    presentationId,
    pageId,
    content.title || "Timeline",
    shapesToCreate,
    textBoxesToCreate
  );
}

export async function buildTimelineVertical(
  pageId: string,
  presentationId: string,
  content: CreateSlideTemplateArgs["content"]
) {
  const steps = content.steps || [
    { title: "Step 1", description: "Description" },
    { title: "Step 2", description: "Description" },
  ];

  const positions = [
    { x: 100, y: 120 },
    { x: 100, y: 260 },
  ];

  // Collect all shapes and text boxes for batch creation
  const shapesToCreate: ShapeToCreate[] = [];
  const textBoxesToCreate: TextBoxToCreate[] = [];

  for (let i = 0; i < Math.min(2, steps.length); i++) {
    const step = steps[i];
    if (step) {
      const shapeY = positions[i].y;
      const shapeHeight = 60;
      const shapeWidth = 200;
      const textHeight = 50;
      const textY = shapeY + (shapeHeight - textHeight) / 2;

      // Add shape
      shapesToCreate.push({
        shapeType: "ROUND_RECTANGLE",
        x: positions[i].x,
        y: shapeY,
        width: shapeWidth,
        height: shapeHeight,
        fillColor: COLORS.PRIMARY.LIGHT,
      });

      // Add text box inside shape
      textBoxesToCreate.push({
        text: step.title + (step.description ? `\n${step.description}` : ""),
        fontSize: 18,
        bold: true,
        alignment: "START",
        x: positions[i].x + 20,
        y: textY,
        width: 160,
        height: textHeight,
      });

      // Add arrow between steps
      if (i < steps.length - 1) {
        shapesToCreate.push({
          shapeType: "DOWN_ARROW",
          x: 320,
          y: positions[i].y + 60,
          width: 40,
          height: 40,
        });
      }
    }
  }

  // Create all elements (including title) in one batch
  await batchCreateWithTitle(
    presentationId,
    pageId,
    content.title || "Timeline",
    shapesToCreate,
    textBoxesToCreate
  );
}

export async function buildFunnel3Level(
  pageId: string,
  presentationId: string,
  content: CreateSlideTemplateArgs["content"]
) {
  const levels = content.funnel_levels || [
    { label: "TAM", value: "$1.4T" },
    { label: "SAM", value: "$750M" },
    { label: "SOM", value: "$50M" },
  ];

  const positions = [
    { x: 200, y: 120, width: 320 },
    { x: 240, y: 200, width: 240 },
    { x: 280, y: 280, width: 160 },
  ];

  // Collect all shapes and text boxes for batch creation
  const shapesToCreate: ShapeToCreate[] = [];
  const textBoxesToCreate: TextBoxToCreate[] = [];

  for (let i = 0; i < 3; i++) {
    const level = levels[i];
    if (level) {
      const shapeY = positions[i].y;
      const shapeHeight = 60;
      const shapeWidth = positions[i].width;
      const textHeight = 50;
      const textY = shapeY + (shapeHeight - textHeight) / 2;

      // Add shape
      shapesToCreate.push({
        shapeType: "ROUND_RECTANGLE",
        x: positions[i].x,
        y: shapeY,
        width: shapeWidth,
        height: shapeHeight,
        fillColor: COLORS.PRIMARY.LIGHT,
      });

      // Add text box inside shape
      const textContent = level.description
        ? `${level.label}\n${level.value}\n${level.description}`
        : `${level.label}\n${level.value}`;

      textBoxesToCreate.push({
        text: textContent,
        fontSize: 18,
        bold: true,
        alignment: "CENTER",
        x: positions[i].x,
        y: textY,
        width: shapeWidth,
        height: textHeight,
      });
    }
  }

  // Create all elements (including title) in one batch
  await batchCreateWithTitle(
    presentationId,
    pageId,
    content.title || "Funnel",
    shapesToCreate,
    textBoxesToCreate
  );
}

export async function buildPyramid3Level(
  pageId: string,
  presentationId: string,
  content: CreateSlideTemplateArgs["content"]
) {
  const levels = content.funnel_levels || [
    { label: "Level 1", value: "" },
    { label: "Level 2", value: "" },
    { label: "Level 3", value: "" },
  ];

  const positions = [
    { x: 280, y: 120, width: 160 },
    { x: 240, y: 200, width: 240 },
    { x: 200, y: 280, width: 320 },
  ];

  // Collect all shapes and text boxes for batch creation
  const shapesToCreate: ShapeToCreate[] = [];
  const textBoxesToCreate: TextBoxToCreate[] = [];

  for (let i = 0; i < 3; i++) {
    const level = levels[i];
    if (level) {
      // Add shape
      shapesToCreate.push({
        shapeType: "TRIANGLE",
        x: positions[i].x,
        y: positions[i].y,
        width: positions[i].width,
        height: 60,
        fillColor: COLORS.PRIMARY.LIGHT,
      });

      // Add text box
      textBoxesToCreate.push({
        text: level.label,
        fontSize: 20,
        bold: true,
        alignment: "CENTER",
        x: positions[i].x,
        y: positions[i].y + 15,
        width: positions[i].width,
        height: 30,
      });
    }
  }

  // Create all elements (including title) in one batch
  await batchCreateWithTitle(
    presentationId,
    pageId,
    content.title || "Pyramid",
    shapesToCreate,
    textBoxesToCreate
  );
}

export async function buildProcessFlow(
  pageId: string,
  presentationId: string,
  content: CreateSlideTemplateArgs["content"]
) {
  const steps = content.steps || [
    { title: "Step 1" },
    { title: "Step 2" },
    { title: "Step 3" },
  ];

  const positions = [
    { x: 80, y: 180 },
    { x: 300, y: 180 },
    { x: 520, y: 180 },
  ];

  // Collect all shapes and text boxes for batch creation
  const shapesToCreate: ShapeToCreate[] = [];
  const textBoxesToCreate: TextBoxToCreate[] = [];

  for (let i = 0; i < Math.min(3, steps.length); i++) {
    const step = steps[i];
    if (step) {
      const shapeY = positions[i].y;
      const shapeHeight = 80;
      const shapeWidth = 120;
      const textHeight = 60;
      const textY = shapeY + (shapeHeight - textHeight) / 2;

      // Add shape
      shapesToCreate.push({
        shapeType: "ROUND_RECTANGLE",
        x: positions[i].x,
        y: shapeY,
        width: shapeWidth,
        height: shapeHeight,
        fillColor: COLORS.PRIMARY.LIGHT,
      });

      // Add text box inside shape
      textBoxesToCreate.push({
        text: step.title + (step.description ? `\n${step.description}` : ""),
        fontSize: 16,
        bold: true,
        alignment: "CENTER",
        x: positions[i].x,
        y: textY,
        width: shapeWidth,
        height: textHeight,
      });

      // Add arrow between steps
      if (i < steps.length - 1) {
        shapesToCreate.push({
          shapeType: "RIGHT_ARROW",
          x: positions[i].x + 120,
          y: positions[i].y + 20,
          width: 40,
          height: 40,
        });
      }
    }
  }

  // Create all elements (including title) in one batch
  await batchCreateWithTitle(
    presentationId,
    pageId,
    content.title || "Process",
    shapesToCreate,
    textBoxesToCreate
  );
}

export async function buildCycle4Step(
  pageId: string,
  presentationId: string,
  content: CreateSlideTemplateArgs["content"]
) {
  const steps = content.steps || [
    { title: "Step 1" },
    { title: "Step 2" },
    { title: "Step 3" },
    { title: "Step 4" },
  ];

  const positions = [
    { x: 300, y: 120 },
    { x: 500, y: 220 },
    { x: 300, y: 320 },
    { x: 100, y: 220 },
  ];

  // Collect all shapes and text boxes for batch creation
  const shapesToCreate: ShapeToCreate[] = [];
  const textBoxesToCreate: TextBoxToCreate[] = [];

  for (let i = 0; i < Math.min(4, steps.length); i++) {
    const step = steps[i];
    if (step) {
      const shapeY = positions[i].y;
      const shapeHeight = 80;
      const shapeWidth = 120;
      const textHeight = 60;
      const textY = shapeY + (shapeHeight - textHeight) / 2;

      // Add shape
      shapesToCreate.push({
        shapeType: "ROUND_RECTANGLE",
        x: positions[i].x,
        y: shapeY,
        width: shapeWidth,
        height: shapeHeight,
        fillColor: COLORS.PRIMARY.LIGHT,
      });

      // Add text box inside shape
      textBoxesToCreate.push({
        text: step.title + (step.description ? `\n${step.description}` : ""),
        fontSize: 16,
        bold: true,
        alignment: "CENTER",
        x: positions[i].x,
        y: textY,
        width: shapeWidth,
        height: textHeight,
      });
    }
  }

  // Create all elements (including title) in one batch
  await batchCreateWithTitle(
    presentationId,
    pageId,
    content.title || "Process",
    shapesToCreate,
    textBoxesToCreate
  );
}
