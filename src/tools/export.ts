/**
 * Export-related MCP tools
 * Generate thumbnails and export slides
 */

import { ensureSlidesClient } from "../slides";
import { getOAuth2Client } from "../auth";
import { google } from "googleapis";
import { MCPToolDefinition } from "../types/mcp";
import { GetSlideThumbnailArgs, ExportToPdfArgs } from "../types/slides";
import { createStringParam, createBooleanParam } from "../utils/schema-builder";
import {
  PRESENTATION_ID_EXAMPLES,
  SLIDE_ID_EXAMPLES,
} from "../config/examples";
import { logger } from "../utils/logger";

/**
 * Get slide thumbnail (re-exported from slides.ts for convenience)
 */
const getThumbnail = async (args: GetSlideThumbnailArgs) => {
  const slides = await ensureSlidesClient();

  logger.progress(`🖼️  Generating thumbnail for slide: ${args.slideId}`);

  const response = await slides.presentations.pages.getThumbnail({
    presentationId: args.presentationId,
    pageObjectId: args.slideId,
    "thumbnailProperties.mimeType": args.mimeType || "PNG",
    "thumbnailProperties.thumbnailSize": args.thumbnailSize || "LARGE",
  });
  const thumbnail = response.data;
  logger.success(`✅ Generated thumbnail URL`);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            slideId: args.slideId,
            presentationId: args.presentationId,
            thumbnailUrl: thumbnail.contentUrl,
            width: thumbnail.width,
            height: thumbnail.height,
            mimeType: args.mimeType || "PNG",
          },
          null,
          2
        ),
      },
    ],
  };
};

/**
 * Export presentation to PDF
 */
const exportToPdf = async (args: ExportToPdfArgs) => {
  logger.progress(`📄 Exporting presentation to PDF: ${args.presentationId}`);

  // Get OAuth2 client for Drive API
  const auth = getOAuth2Client();
  const drive = google.drive({ version: "v3", auth });

  try {
    if (args.returnBase64) {
      const response = await drive.files.export(
        {
          fileId: args.presentationId,
          mimeType: "application/pdf",
        },
        {
          responseType: "arraybuffer",
        }
      );

      // Convert arraybuffer to base64
      const buffer = Buffer.from(response.data as ArrayBuffer);
      const base64 = buffer.toString("base64");

      logger.success(`✅ Exported to PDF (base64)`);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                presentationId: args.presentationId,
                format: "pdf",
                base64: base64,
                message: "Presentation exported as PDF (base64)",
              },
              null,
              2
            ),
          },
        ],
      };
    } else {
      // For URL-based export, provide download link
      logger.success(`✅ Exported to PDF`);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                presentationId: args.presentationId,
                format: "pdf",
                message:
                  "Presentation exported as PDF. Use Google Drive API or download from Google Slides UI to get the file.",
                downloadUrl: `https://drive.google.com/uc?export=download&id=${args.presentationId}`,
                instructions:
                  "To download: Use the downloadUrl or access via Google Drive API with export mimeType 'application/pdf'",
              },
              null,
              2
            ),
          },
        ],
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to export PDF: ${errorMessage}`);
  }
};

// Tool definitions
export const exportTools: MCPToolDefinition[] = [
  {
    name: "get_thumbnail",
    description:
      "Generate and get a thumbnail image URL for a slide. Useful for previewing slides. Example: Get PNG thumbnail of slide 'SLIDES_API123_0' in LARGE size. Returns a URL you can use to display the thumbnail image.",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        slideId: createStringParam({
          description: "The ID of the slide",
          examples: SLIDE_ID_EXAMPLES,
        }),
        mimeType: createStringParam({
          description: "Image format: PNG or JPEG. Default: PNG",
          enum: ["PNG", "JPEG"],
          examples: ["PNG"],
        }),
        thumbnailSize: createStringParam({
          description:
            "Thumbnail size: SMALL, MEDIUM, LARGE, XLARGE. Default: LARGE",
          enum: ["SMALL", "MEDIUM", "LARGE", "XLARGE"],
          examples: ["LARGE", "MEDIUM"],
        }),
      },
      required: ["presentationId", "slideId"],
    },
    handler: getThumbnail,
  },
  {
    name: "export_to_pdf",
    description:
      "Export a presentation as PDF. Returns download URL or base64 content if returnBase64 is true. Example: Export presentation '1abc123def456' to PDF. Use returnBase64=true to get base64 content for embedding, or false to get download URL.",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
        returnBase64: createBooleanParam({
          description:
            "If true, returns base64 encoded PDF content instead of download URL. Default: false",
          default: false,
          examples: [false, true],
        }),
      },
      required: ["presentationId"],
    },
    handler: exportToPdf,
  },
];
