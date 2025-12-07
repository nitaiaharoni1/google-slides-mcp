/**
 * Presentation-related MCP tools
 * Create, get, and delete presentations
 */

import { ensureSlidesClient } from "../slides";
import { getOAuth2Client } from "../auth";
import { google } from "googleapis";
import { MCPToolDefinition } from "../types/mcp";
import { createStringParam } from "../utils/schema-builder";
import { PRESENTATION_ID_EXAMPLES } from "../config/examples";
import {
  CreatePresentationArgs,
  GetPresentationArgs,
  DeletePresentationArgs,
} from "../types/slides";
import { logger } from "../utils/logger";

/**
 * Create a new presentation
 */
const createPresentation = async (args: CreatePresentationArgs) => {
  const slides = await ensureSlidesClient();

  logger.progress(`📝 Creating presentation: ${args.title}`);

  const response = await slides.presentations.create({
    requestBody: {
      title: args.title,
      ...(args.presentationId && { presentationId: args.presentationId }),
      ...(args.locale && { locale: args.locale }),
    },
  });

  const presentation = response.data;
  logger.success(`✅ Created presentation: ${presentation.presentationId}`);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            presentationId: presentation.presentationId,
            title: presentation.title,
            revisionId: presentation.revisionId,
            slides: presentation.slides?.map((slide) => ({
              objectId: slide.objectId,
              pageType: slide.pageType,
            })),
          },
          null,
          2
        ),
      },
    ],
  };
};

/**
 * Get presentation details
 */
const getPresentation = async (args: GetPresentationArgs) => {
  const slides = await ensureSlidesClient();

  logger.progress(`📖 Getting presentation: ${args.presentationId}`);

  const response = await slides.presentations.get({
    presentationId: args.presentationId,
  });

  const presentation = response.data;
  logger.success(`✅ Retrieved presentation: ${presentation.title}`);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            presentationId: presentation.presentationId,
            title: presentation.title,
            revisionId: presentation.revisionId,
            locale: presentation.locale,
            pageSize: presentation.pageSize,
            slides: presentation.slides?.map((slide) => ({
              objectId: slide.objectId,
              pageType: slide.pageType,
            })),
            layouts: presentation.layouts?.map((layout) => ({
              objectId: layout.objectId,
              pageType: layout.pageType,
            })),
            masters: presentation.masters?.map((master) => ({
              objectId: master.objectId,
              pageType: master.pageType,
            })),
          },
          null,
          2
        ),
      },
    ],
  };
};

/**
 * Delete one or more presentations (via Drive API)
 */
const deletePresentation = async (args: DeletePresentationArgs) => {
  await ensureSlidesClient(); // Ensure slides client is initialized
  const auth = getOAuth2Client();
  const drive = google.drive({ version: "v3", auth });

  logger.progress(
    `🗑️  Deleting ${args.presentationIds.length} presentation(s)`
  );

  // Delete all presentations in parallel
  await Promise.all(
    args.presentationIds.map((presentationId) =>
      drive.files.delete({
        fileId: presentationId,
      })
    )
  );

  logger.success(`✅ Deleted ${args.presentationIds.length} presentation(s)`);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            presentationIds: args.presentationIds,
            message: `${args.presentationIds.length} presentation(s) deleted successfully`,
          },
          null,
          2
        ),
      },
    ],
  };
};

// Tool definitions
export const presentationTools: MCPToolDefinition[] = [
  {
    name: "create_presentation",
    description:
      "Create a new Google Slides presentation with the given title. Returns the presentation ID and basic information. Example: Create presentation titled 'My Pitch Deck' (title='My Pitch Deck'). The returned presentationId is needed for all subsequent operations.",
    inputSchema: {
      type: "object",
      properties: {
        title: createStringParam({
          description: "The title of the presentation",
          examples: ["My Pitch Deck", "Product Launch", "Quarterly Review"],
        }),
        presentationId: createStringParam({
          description:
            "Optional custom presentation ID. If not provided, Google will generate one. Example: 'my-custom-id-123'",
        }),
        locale: createStringParam({
          description:
            'Optional locale as IETF BCP 47 language tag. Examples: "en-US" (English US), "fr-FR" (French), "de-DE" (German)',
          examples: ["en-US", "fr-FR", "de-DE", "es-ES"],
        }),
      },
      required: ["title"],
    },
    handler: createPresentation,
  },
  {
    name: "get_presentation",
    description:
      "Get the full details of a Google Slides presentation including slides, layouts, and masters. Example: Retrieve presentation '1abc123def456' to see all slides, their IDs, and available layouts. Use this to inspect presentation structure.",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation to retrieve",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
      },
      required: ["presentationId"],
    },
    handler: getPresentation,
  },
  {
    name: "delete_presentation",
    description:
      "Delete one or more Google Slides presentations. This permanently removes the presentations from Google Drive. Example: Delete presentations by their presentationIds. WARNING: This action cannot be undone. Use with caution. Single delete operations will be a single element in the array.",
    inputSchema: {
      type: "object",
      properties: {
        presentationIds: {
          type: "array",
          items: createStringParam({
            description: "The ID of the presentation to delete",
            examples: PRESENTATION_ID_EXAMPLES,
          }),
          description:
            "Array of presentation IDs to delete. Example: ['1abc123def456', '2xyz789ghi012']",
        },
      },
      required: ["presentationIds"],
    },
    handler: deletePresentation,
  },
];
