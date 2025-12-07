/**
 * Template builders - Category E: Team & People
 */

import { CreateSlideTemplateArgs, TeamMember } from "../../types/templates";
import { addMultipleTextBoxes } from "../text";
import { addImage } from "../images";
import { createShapeWithFill } from "./utils";
import { COLORS } from "../../config/design-system";

export async function buildTeam2Founders(
  pageId: string,
  presentationId: string,
  content: CreateSlideTemplateArgs["content"]
) {
  const team = content.team || [
    { name: "Founder 1", role: "CEO" },
    { name: "Founder 2", role: "CTO" },
  ];

  await addMultipleTextBoxes({
    presentationId,
    pageId,
    textBoxes: [
      {
        text: content.title || "Team",
        fontSize: 32,
        bold: true,
        alignment: "CENTER",
        y: 40,
      },
    ],
    centerHorizontally: true,
  });

  const positions = [
    { x: 140, y: 140 },
    { x: 400, y: 140 },
  ];

  for (let i = 0; i < Math.min(2, team.length); i++) {
    const member: TeamMember | undefined = team[i];
    if (member) {
      if (member.image_url) {
        await addImage({
          presentationId,
          pageId,
          imageUrl: member.image_url,
          x: positions[i].x + 50,
          y: positions[i].y,
          width: 80,
          height: 80,
        });
      } else {
        await createShapeWithFill(
          presentationId,
          pageId,
          "ELLIPSE",
          positions[i].x + 50,
          positions[i].y,
          80,
          80,
          COLORS.GRAY[300]
        );
      }

      await addMultipleTextBoxes({
        presentationId,
        pageId,
        textBoxes: [
          {
            text: member.name,
            fontSize: 20,
            bold: true,
            alignment: "CENTER",
            x: positions[i].x,
            y: positions[i].y + 100,
            width: 180,
            height: 30,
          },
          {
            text: member.role,
            fontSize: 14,
            bold: false,
            alignment: "CENTER",
            foregroundColor: { rgbColor: COLORS.GRAY[600] },
            x: positions[i].x,
            y: positions[i].y + 140,
            width: 180,
            height: 30,
          },
        ],
        centerHorizontally: false,
      });
    }
  }
}

export async function buildTeam4Grid(
  pageId: string,
  presentationId: string,
  content: CreateSlideTemplateArgs["content"]
) {
  const team = content.team || [
    { name: "Member 1", role: "Role" },
    { name: "Member 2", role: "Role" },
    { name: "Member 3", role: "Role" },
    { name: "Member 4", role: "Role" },
  ];

  await addMultipleTextBoxes({
    presentationId,
    pageId,
    textBoxes: [
      {
        text: content.title || "Team",
        fontSize: 32,
        bold: true,
        alignment: "CENTER",
        y: 40,
      },
    ],
    centerHorizontally: true,
  });

  const positions = [
    { x: 80, y: 140 },
    { x: 380, y: 140 },
    { x: 80, y: 280 },
    { x: 380, y: 280 },
  ];

  for (let i = 0; i < Math.min(4, team.length); i++) {
    const member: TeamMember | undefined = team[i];
    if (member) {
      await createShapeWithFill(
        presentationId,
        pageId,
        "ROUND_RECTANGLE",
        positions[i].x,
        positions[i].y,
        260,
        120,
        COLORS.GRAY[100]
      );

      await addMultipleTextBoxes({
        presentationId,
        pageId,
        textBoxes: [
          {
            text: member.name,
            fontSize: 18,
            bold: true,
            alignment: "START",
            x: positions[i].x + 20,
            y: positions[i].y + 20,
            width: 220,
            height: 30,
          },
          {
            text: member.role,
            fontSize: 14,
            bold: false,
            alignment: "START",
            foregroundColor: { rgbColor: COLORS.GRAY[600] },
            x: positions[i].x + 20,
            y: positions[i].y + 60,
            width: 220,
            height: 40,
          },
        ],
        centerHorizontally: false,
      });
    }
  }
}

export async function buildTeam6Grid(
  pageId: string,
  presentationId: string,
  content: CreateSlideTemplateArgs["content"]
) {
  const team: TeamMember[] =
    content.team ||
    (Array(6).fill({ name: "Member", role: "Role" }) as TeamMember[]);

  await addMultipleTextBoxes({
    presentationId,
    pageId,
    textBoxes: [
      {
        text: content.title || "Team",
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
    { x: 40, y: 240 },
    { x: 260, y: 240 },
    { x: 480, y: 240 },
  ];

  for (let i = 0; i < Math.min(6, team.length); i++) {
    const member: TeamMember | undefined = team[i];
    if (member) {
      await createShapeWithFill(
        presentationId,
        pageId,
        "ROUND_RECTANGLE",
        positions[i].x,
        positions[i].y,
        200,
        100,
        COLORS.GRAY[100]
      );

      await addMultipleTextBoxes({
        presentationId,
        pageId,
        textBoxes: [
          {
            text: member.name,
            fontSize: 16,
            bold: true,
            alignment: "START",
            x: positions[i].x + 15,
            y: positions[i].y + 15,
            width: 170,
            height: 25,
          },
          {
            text: member.role,
            fontSize: 12,
            bold: false,
            alignment: "START",
            foregroundColor: { rgbColor: COLORS.GRAY[600] },
            x: positions[i].x + 15,
            y: positions[i].y + 50,
            width: 170,
            height: 35,
          },
        ],
        centerHorizontally: false,
      });
    }
  }
}
