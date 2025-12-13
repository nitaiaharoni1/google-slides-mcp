#!/usr/bin/env node

/**
 * Google Slides MCP Server
 * Main entry point for the MCP server
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { getToolDefinitions, handleToolCall } from "./src/tools/index.js";
import { SERVER_CONFIG } from "./src/config/constants.js";
import { handleCliCommands } from "./src/cli.js";
import { logger } from "./src/utils/logger.js";
import { MCPToolArgs } from "./src/types/mcp.js";

// Interface for MCP tool call request (matches handleToolCall signature)
interface MCPToolCallRequest {
  params: {
    name: string;
    arguments: MCPToolArgs;
  };
}

// Handle CLI commands FIRST, before any server initialization
const args = process.argv.slice(2);

// Check if this is a CLI command invocation
handleCliCommands(args)
  .then(async (handled) => {
    if (handled) {
      // CLI command was executed, exit gracefully
      process.exit(0);
    } else {
      // No CLI command, start the MCP server
      await main();
    }
  })
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });

// Initialize MCP server
const server = new Server(
  {
    name: SERVER_CONFIG.name,
    version: SERVER_CONFIG.version,
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, () => {
  return { tools: getToolDefinitions() };
});

// Handle list prompts request
server.setRequestHandler(ListPromptsRequestSchema, () => {
  return {
    prompts: [
      {
        name: "google-slides-best-practices",
        description:
          "Best practices and guidelines for working with Google Slides presentations",
      },
    ],
  };
});

// Handle get prompt request
server.setRequestHandler(GetPromptRequestSchema, (request) => {
  if (request.params.name === "google-slides-best-practices") {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `# Google Slides MCP Server - Best Practices

## Essential Workflow: Inspect Before Modifying

⚠️ **CRITICAL**: Always get slide/presentation information BEFORE manipulating elements.

### Recommended Workflow:

1. **Get Presentation Structure** (for new work):
   - Use \`get_presentation\` to see all slides and their IDs
   - Use \`get_slide\` to inspect a specific slide's elements

2. **Inspect Existing Elements** (before modifying):
   - Use \`get_slide\` to see all element IDs, positions, and content
   - Identify the specific element IDs you need to modify

3. **Make Changes**:
   - Use element-specific tools with the correct objectIds
   - Reference the slide structure you retrieved

### Common Mistakes to Avoid:

❌ **DON'T**: Assume element IDs or positions
❌ **DON'T**: Try to modify elements without knowing their IDs
❌ **DON'T**: Stack multiple text boxes at the same Y position

✅ **DO**: Call \`get_presentation\` or \`get_slide\` first
✅ **DO**: Use the returned objectIds for modifications
✅ **DO**: Use \`add_multiple_text_boxes\` for automatic stacking (don't specify x/y for individual boxes)

### Example Correct Workflow:

\`\`\`
1. get_presentation(presentationId) → returns slide IDs
2. get_slide(presentationId, slideId) → returns element IDs and structure
3. update_text(presentationId, objectId, newText) → modify specific element
   OR
   delete_element(presentationId, objectId) → remove element
\`\`\`

### Tool Selection Guide:

**Creating Complete Slides:**
- 🌟 **BEST**: Use \`create_designed_slide\` for pre-built templates (cover, bullets, etc.)
- Use \`create_pitch_deck\` for multi-slide presentations

**Adding Multiple Elements:**
- 🌟 **BEST**: Use \`add_multiple_text_boxes\` (auto-stacks vertically, don't set x/y)
- Let centering and spacing happen automatically

**Adding Single Elements:**
- Use \`add_text_box\`, \`add_image\`, \`add_shape\` for individual elements
- Specify positions explicitly

**Modifying Existing Elements:**
- ⚠️ ALWAYS call \`get_slide\` first to get element objectIds
- Use \`update_text\`, \`format_text\`, \`format_shape\` with the correct objectId
- Use \`delete_element\` to remove unwanted elements

### Coordinate System:

- Standard slide: **720pt wide × 405pt tall**
- Origin: **Top-left corner** (0, 0)
- All measurements in **points (pt)**
- Center: **(360pt, 202pt)**

### Key Tips:

1. **Automatic Positioning**: When using \`add_multiple_text_boxes\`, omit \`x\` and \`y\` from individual text boxes - the server will stack them automatically with proper spacing
2. **Get Before Modify**: Always retrieve slide information before updating/deleting elements
3. **Use Templates**: Prefer \`create_designed_slide\` over manual element creation
4. **Batch Operations**: Use \`add_multiple_text_boxes\` or \`batch_update\` for efficiency
5. **Element IDs**: Object IDs are returned when you create elements - save them if you need to modify the elements later
6. **Slide IDs**: Each slide has a unique objectId (e.g., "p", "SLIDES_API123_0") - get this from \`get_presentation\` or \`create_slide\`

### Real-World Example Workflows:

**Example 1: Modify existing text on a slide**
\`\`\`
Step 1: get_slide(presentationId="abc123", slideId="p")
  → Returns: { pageElements: [{ objectId: "textbox_xyz", ... }] }

Step 2: update_text(presentationId="abc123", objectId="textbox_xyz", text="New content")
  → Success!
\`\`\`

**Example 2: Create a multi-element slide properly**
\`\`\`
Step 1: create_slide(presentationId="abc123")
  → Returns: { slideId: "SLIDES_API999_0" }

Step 2: add_multiple_text_boxes(
  presentationId="abc123",
  pageId="SLIDES_API999_0",
  textBoxes=[
    { text: "Title", fontSize: 44, bold: true },      // No x/y here!
    { text: "Subtitle", fontSize: 24 },               // No x/y here!
    { text: "Body text", fontSize: 16 }               // No x/y here!
  ],
  centerHorizontally=true  // Server handles positioning automatically
)
  → Creates 3 properly stacked, centered text boxes
\`\`\`

**Example 3: Create a complete slide (fastest method)**
\`\`\`
Step 1: create_designed_slide(
  presentationId="abc123",
  template="title_bullets",
  content={
    title: "My Slide Title",
    bullets: ["Point 1", "Point 2", "Point 3"]
  },
  theme="startup_bold"
)
  → Creates complete, styled slide in one API call!
\`\`\`

### Anti-Patterns to Avoid:

1. **❌ Modifying without inspection:**
   \`\`\`
   // BAD: Assuming objectId
   update_text(presentationId, "textbox_1", "new text")
   
   // GOOD: Get actual objectId first
   get_slide(presentationId, slideId) → see actual IDs
   update_text(presentationId, actualObjectId, "new text")
   \`\`\`

2. **❌ Manual positioning with same coordinates:**
   \`\`\`
   // BAD: All boxes at same position
   add_multiple_text_boxes([
     { text: "A", x: 20, y: 20 },
     { text: "B", x: 20, y: 20 },  // Overlaps!
     { text: "C", x: 20, y: 20 }   // Overlaps!
   ])
   
   // GOOD: Let server handle positioning
   add_multiple_text_boxes([
     { text: "A" },  // Auto-positioned
     { text: "B" },  // Auto-positioned
     { text: "C" }   // Auto-positioned
   ])
   \`\`\`

3. **❌ Multiple single-element operations:**
   \`\`\`
   // BAD: Multiple API calls
   add_text_box(...)
   add_text_box(...)
   add_text_box(...)
   
   // GOOD: Single batch operation
   add_multiple_text_boxes([...])
   
   // BEST: Use template
   create_designed_slide(...)
   \`\`\`

### Performance Tips:

- **Fastest**: \`create_designed_slide\` or \`create_pitch_deck\` (pre-built templates)
- **Fast**: \`add_multiple_text_boxes\`, \`create_table_with_data\`, \`batch_update\`
- **Slower**: Individual \`add_text_box\`, \`add_image\`, etc. calls
- **Slowest**: Individual operations followed by individual formatting calls

### Remember:

The server has smart defaults and auto-detection:
- Detects when all text boxes have the same Y position → auto-stacks them
- Automatically centers elements when requested
- Validates and clamps positions to prevent overflow
- Handles coordinate conversion (points ↔ EMU) automatically`,
          },
        },
      ],
    };
  }

  throw new Error(`Unknown prompt: ${request.params.name}`);
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // Convert MCP SDK request to our internal format
  const toolCallRequest: MCPToolCallRequest = {
    params: {
      name: request.params.name,
      arguments: request.params.arguments || {},
    },
  };
  const result = await handleToolCall(toolCallRequest);

  // Ensure we return the correct MCP SDK format
  return {
    content: result.content,
    isError: result.isError || false,
  };
});

// Main server function
async function main(): Promise<void> {
  try {
    // Check for authentication methods
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const hasOAuthCredentials = !!(clientId && clientSecret);
    const hasADC = !!(
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.GCLOUD_PROJECT ||
      process.env.GOOGLE_CLOUD_PROJECT
    );

    if (!hasOAuthCredentials && !hasADC) {
      logger.warn(
        "⚠️  No authentication method configured. The server will start but tools may fail."
      );
      logger.info("💡 Authentication options:");
      logger.info("   1. OAuth2: Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET");
      logger.info(
        "   2. ADC: Run 'gcloud auth application-default login --scopes=https://www.googleapis.com/auth/presentations,https://www.googleapis.com/auth/drive.file'"
      );
      logger.info(
        "   3. ADC: Set GOOGLE_APPLICATION_CREDENTIALS to service account JSON path"
      );
    } else if (hasOAuthCredentials) {
      logger.info("✅ OAuth2 credentials detected");
      logger.info('💡 Run "google-slides-mcp auth" if you need to authenticate');
    } else if (hasADC) {
      logger.info("✅ Application Default Credentials (ADC) detected");
      logger.info("💡 Using gcloud auth or GOOGLE_APPLICATION_CREDENTIALS");
    }

    // Note: We don't initialize the Slides client here anymore
    // It will be initialized lazily when the first tool is called
    // This allows the server to start even without authentication
    logger.info("🔌 Google Slides MCP Server starting...");
    logger.info("💡 Authentication will be checked when tools are used");

    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info("🚀 Google Slides MCP Server started successfully");
  } catch (error) {
    const errorMsg = (error as Error).message;
    logger.error(`❌ Server startup failed: ${errorMsg}`);

    // Provide specific guidance based on error type
    if (errorMsg.includes("CLIENT_ID") || errorMsg.includes("CLIENT_SECRET")) {
      logger.info("🔍 Troubleshooting suggestions:");
      logger.info("   1. Get OAuth2 credentials from Google Cloud Console");
      logger.info(
        "   2. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables"
      );
      logger.info(
        "   3. Ensure redirect URI is set to http://localhost:3000/oauth2callback"
      );
      logger.info("   4. Or use ADC: Run 'gcloud auth application-default login'");
    }

    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", () => {
  logger.info("🛑 Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("🛑 Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});
