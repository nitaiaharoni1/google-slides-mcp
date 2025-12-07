/**
 * Layout-related MCP tools
 * List layouts and master slides
 */

import { ensureSlidesClient } from "../slides";
import { MCPToolDefinition } from "../types/mcp";
import { ListLayoutsArgs } from "../types/slides";
import { createStringParam } from "../utils/schema-builder";
import { PRESENTATION_ID_EXAMPLES } from "../config/examples";
import { logger } from "../utils/logger";

/**
 * List available layouts and master slides in a presentation
 */
const listPageTemplates = async (args: ListLayoutsArgs) => {
  const slides = await ensureSlidesClient();

  logger.progress(
    `📋 Listing page templates for presentation: ${args.presentationId}`
  );

  const response = await slides.presentations.get({
    presentationId: args.presentationId,
  });

  const layouts = response.data.layouts || [];
  const masters = response.data.masters || [];

  logger.success(
    `✅ Found ${layouts.length} layout(s) and ${masters.length} master slide(s)`
  );

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            presentationId: args.presentationId,
            layouts: layouts.map((layout) => ({
              objectId: layout.objectId,
              pageType: layout.pageType,
            })),
            masters: masters.map((master) => ({
              objectId: master.objectId,
              pageType: master.pageType,
              pageProperties: master.pageProperties,
            })),
          },
          null,
          2
        ),
      },
    ],
  };
};

// Tool definitions
export const layoutTools: MCPToolDefinition[] = [
  {
    name: "list_page_templates",
    description:
      "List all available layouts and master slides in a presentation. Returns both layouts and masters in a single response. Example: List templates for presentation '1abc123def456' to see available slide layouts. Use layout IDs when creating slides with specific layouts.",
    inputSchema: {
      type: "object",
      properties: {
        presentationId: createStringParam({
          description: "The ID of the presentation",
          examples: PRESENTATION_ID_EXAMPLES,
        }),
      },
      required: ["presentationId"],
    },
    handler: listPageTemplates,
  },
];
