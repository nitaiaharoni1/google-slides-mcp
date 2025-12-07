/**
 * MCP Tools Registry - combines all tool modules
 */

import { presentationTools } from "./presentations";
import { slideTools } from "./slides";
import { textTools } from "./text";
import { imageTools } from "./images";
import { shapeTools } from "./shapes";
import { elementTools } from "./elements";
import { tableTools } from "./tables";
import { textFormattingTools } from "./text-formatting";
import { shapeFormattingTools } from "./shape-formatting";
import { positioningTools } from "./positioning";
import { layoutTools } from "./layouts";
import { batchTools } from "./batch";
import { chartTools } from "./charts";
import { exportTools } from "./export";
import { slideTemplateTools } from "./slide-templates";
import { logger } from "../utils/logger";
import {
  MCPToolDefinition,
  MCPResult,
  MCPErrorResponse,
  MCPToolArgs,
} from "../types/mcp";

// Interface for MCP tool call request
interface MCPToolCallRequest {
  params: {
    name: string;
    arguments: MCPToolArgs;
  };
}

/**
 * Create a standardized error result with suggestions
 */
export function createErrorResult(
  message: string,
  options?: {
    error?: string;
    suggestion?: string;
    provided?: unknown;
    expected?: unknown;
    validRange?: [number, number];
    validOptions?: string[];
  }
): MCPResult {
  const errorResponse: MCPErrorResponse = {
    success: false,
    error: options?.error || "Error",
    message,
  };

  if (options?.suggestion) {
    errorResponse.suggestion = options.suggestion;
  }
  if (options?.provided !== undefined) {
    errorResponse.provided = options.provided;
  }
  if (options?.expected !== undefined) {
    errorResponse.expected = options.expected;
  }
  if (options?.validRange) {
    errorResponse.validRange = options.validRange;
  }
  if (options?.validOptions) {
    errorResponse.validOptions = options.validOptions;
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(errorResponse, null, 2),
      },
    ],
    isError: true,
  };
}

/**
 * Create a validation error with helpful suggestions
 */
export function createValidationError(
  paramName: string,
  provided: unknown,
  expected: string,
  suggestion?: string
): MCPResult {
  return createErrorResult(
    `Invalid value for '${paramName}': ${JSON.stringify(provided)}. ${expected}`,
    {
      error: "ValidationError",
      suggestion:
        suggestion || `Please provide a valid value for '${paramName}'`,
      provided,
      expected,
    }
  );
}

// Combine all tools
const allTools: MCPToolDefinition[] = [
  ...presentationTools,
  ...slideTools,
  ...textTools,
  ...imageTools,
  ...shapeTools,
  ...elementTools,
  ...tableTools,
  ...textFormattingTools,
  ...shapeFormattingTools,
  ...positioningTools,
  ...layoutTools,
  ...batchTools,
  ...chartTools,
  ...exportTools,
  ...slideTemplateTools,
];

/**
 * Get all available tools for MCP server registration
 * @returns Array of tool definitions
 */
export const getToolDefinitions = () => {
  return allTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));
};

/**
 * Handle MCP tool call requests
 * @param request - MCP tool call request
 * @returns Tool response in MCP format
 */
export const handleToolCall = async (
  request: MCPToolCallRequest
): Promise<MCPResult> => {
  const { name, arguments: args } = request.params;

  try {
    // Find the tool handler
    const tool = allTools.find((t) => t.name === name);

    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    // Execute the tool handler
    // The tool handler will call ensureSlidesClient() which will initialize if needed
    const result = await tool.handler(args);
    return result;
  } catch (error) {
    const errorMsg = (error as Error).message;

    // Log the error with helpful context
    logger.error(`❌ Tool '${name}' failed: ${errorMsg}`);

    // Provide helpful guidance for common errors
    // Check if error has enhanced properties (from api-validation utilities)
    const enhancedError = error as Error & {
      suggestion?: string;
      workaround?: string;
      provided?: unknown;
      expected?: unknown;
      apiLimitation?: boolean;
    };

    let suggestion: string | undefined = enhancedError.suggestion;
    const workaround: string | undefined = enhancedError.workaround;

    // If no enhanced suggestion, use default error classification
    if (!suggestion) {
      if (
        errorMsg.includes("token") ||
        errorMsg.includes("refresh") ||
        errorMsg.includes("authenticate")
      ) {
        suggestion =
          'Run "google-slides-mcp auth" to authenticate with Google.';
        logger.info(`   💡 ${suggestion}`);
      } else if (
        errorMsg.includes("not found") ||
        errorMsg.includes("invalid")
      ) {
        suggestion =
          "Verify the presentation ID, slide ID, or element ID is correct.";
        logger.info(`   💡 ${suggestion}`);
      } else if (
        errorMsg.includes("permission") ||
        errorMsg.includes("access")
      ) {
        suggestion = "Check that you have permission to access this resource.";
        logger.info(`   💡 ${suggestion}`);
      } else if (errorMsg.includes("size") || errorMsg.includes("too large")) {
        suggestion =
          "Reduce the size or number of elements. Maximum slide width: 720pt, height: 405pt.";
        logger.info(`   💡 ${suggestion}`);
      } else if (
        errorMsg.includes("Invalid JSON") ||
        errorMsg.includes("Cannot find field") ||
        errorMsg.includes("Unknown name")
      ) {
        suggestion =
          "This is likely an API limitation or unsupported feature. The Google Slides API may not support this operation directly. Check the API documentation for supported features.";
        if (enhancedError.apiLimitation) {
          suggestion +=
            " The tool may automatically apply a workaround if available.";
        }
        logger.info(`   💡 ${suggestion}`);
        // Log the arguments for debugging
        logger.debug(`   🔍 Tool arguments: ${JSON.stringify(args, null, 2)}`);
      }
    } else {
      // Log enhanced suggestion if available
      logger.info(`   💡 ${suggestion}`);
    }

    // Log workaround if available
    if (workaround) {
      logger.info(`   🔧 Workaround: ${workaround}`);
    }

    // Return error result instead of throwing
    // This allows the MCP SDK to properly handle the error response
    return createErrorResult(errorMsg, {
      error: enhancedError.apiLimitation
        ? "APILimitationError"
        : "ToolExecutionError",
      suggestion,
      provided: enhancedError.provided,
      expected: enhancedError.expected,
    });
  }
};
