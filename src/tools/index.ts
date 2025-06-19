/**
 * MCP Tools Registry - combines all tool modules
 */

import { isDatabaseConnected } from '../database';
import { queryTools } from './query';
import { schemaTools } from './schema';
import { analysisTools } from './analysis';
import { discoveryTools } from './discovery';
import { postgresCatalogTools } from './postgres-catalog';
import { postgresAdvancedTools } from './postgres-advanced';
import { MCPToolDefinition, MCPResult } from '../types/mcp';

// Combine all tools
const allTools: MCPToolDefinition[] = [
  ...queryTools,
  ...schemaTools,
  ...analysisTools,
  ...discoveryTools,
  ...postgresCatalogTools,
  ...postgresAdvancedTools,
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
export const handleToolCall = async (request: any) => {
  const { name, arguments: args } = request.params;

  if (!isDatabaseConnected()) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: Database connection not established. Please check your configuration.',
        },
      ],
      isError: true,
    };
  }

  try {
    // Find the tool handler
    const tool = allTools.find((t) => t.name === name);

    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    // Execute the tool handler
    const result = await tool.handler(args);
    return result;
  } catch (error) {
    console.error(`❌ Error in ${name}:`, (error as Error).message);

    return {
      content: [
        {
          type: 'text',
          text: `Error: ${(error as Error).message}`,
        },
      ],
      isError: true,
    };
  }
};
