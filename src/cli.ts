/**
 * Command-line interface handling for Multi-Database MCP Server
 * Focuses only on argument parsing, delegates command execution
 */

import { detectDatabaseType, validateConnectionString, getConnectionStringExamples } from './database';

/**
 * CLI Command Handler
 * Handles command-line interface operations
 */
export function handleCliCommands(args: string[]): boolean {
  if (args.length === 0) {
    return false;
  }

  const command = args[0];

  switch (command) {
    case '--help':
    case '-h':
      showHelp();
      return true;
    case '--version':
    case '-v':
      showVersion();
      return true;
    case '--configure':
      showConfiguration();
      return true;
    case '--find-config':
      showConfigLocation();
      return true;
    default:
      return false;
  }
}

function showHelp(): void {
  console.log(`
Claude Multi-Database MCP Server

Usage:
  claude-multi-database-mcp [options]

Options:
  --help, -h        Show this help message
  --version, -v     Show version information
  --configure       Show configuration instructions
  --find-config     Show config file location

Environment Variables:
  DATABASE_URL      Database connection string (required)

Supported Databases:
  - PostgreSQL
  - MySQL  
  - SQLite

Examples:
  DATABASE_URL="postgresql://user:pass@localhost:5432/db" claude-multi-database-mcp
  DATABASE_URL="mysql://user:pass@localhost:3306/db" claude-multi-database-mcp
  DATABASE_URL="./database.db" claude-multi-database-mcp
`);
}

function showVersion(): void {
  const packageJson = require('../package.json');
  console.log(`Claude Multi-Database MCP Server v${packageJson.version}`);
}

function showConfiguration(): void {
  console.log(`
Configuration Instructions:

1. Set DATABASE_URL environment variable
2. Add to Claude Desktop configuration

Example connection strings:
`);
  
  const examples = getConnectionStringExamples();
  Object.entries(examples).forEach(([type, urls]) => {
    console.log(`\n${type.toUpperCase()}:`);
    urls.forEach((url: string) => console.log(`  ${url}`));
  });
}

function showConfigLocation(): void {
  console.log('Claude Desktop config location:');
  console.log('  macOS: ~/Library/Application Support/Claude/claude_desktop_config.json');
  console.log('  Windows: %APPDATA%\\Claude\\claude_desktop_config.json');
  console.log('  Linux: ~/.config/claude/claude_desktop_config.json');
}

module.exports = {
    handleCliCommands
}; 