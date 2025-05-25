#!/usr/bin/env node

/**
 * Claude Multi-Database MCP Server
 * Main entry point for the MCP server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { initializeDatabase, closeDatabase } from './src/database.js';
import { getToolDefinitions, handleToolCall } from './src/tools/index.js';
import { SERVER_CONFIG } from './src/config/constants.js';
import { handleCliCommands } from './src/cli.js';

// Handle CLI commands first, before starting the server
if (require.main === module) {
  const args = process.argv.slice(2);
  
  // If CLI command was handled, exit
  if (handleCliCommands(args)) {
    process.exit(0);
  }
  
  // Otherwise start the MCP server
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

// Initialize MCP server
const server = new Server({
  name: SERVER_CONFIG.name,
  version: SERVER_CONFIG.version,
}, {
  capabilities: {
    tools: {},
  },
});

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: getToolDefinitions() };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const result = await handleToolCall(request);
  
  // Ensure we return the correct MCP SDK format
  return {
    content: result.content,
    isError: result.isError || false
  };
});

// Main server function
async function main(): Promise<void> {
  try {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.error('❌ DATABASE_URL environment variable is required');
      console.error('💡 Use --help for configuration instructions');
      process.exit(1);
    }

    await initializeDatabase(connectionString);
    console.error('✅ Database connected successfully');

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('🚀 Claude Multi-Database MCP Server started');
  } catch (error) {
    console.error('❌ Server startup failed:', (error as Error).message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.error('🛑 Received SIGINT, shutting down gracefully...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('🛑 Received SIGTERM, shutting down gracefully...');
  await closeDatabase();
  process.exit(0);
});