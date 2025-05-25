/**
 * Command-line interface handling for Multi-Database MCP Server
 * Focuses only on argument parsing, delegates command execution
 */

import { detectDatabaseType, validateConnectionString, getConnectionStringExamples } from './database';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

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
    case '--setup':
      interactiveSetup();
      return true;
    default:
      return false;
  }
}

function showHelp(): void {
  console.log(`
Claude Multi-Database MCP Server

Usage:
  database-mcp [options]

Options:
  --help, -h        Show this help message
  --version, -v     Show version information
  --configure       Show configuration instructions
  --find-config     Show config file location
  --setup           Interactive setup for Claude Desktop

Environment Variables:
  DATABASE_URL      Database connection string (required)

Supported Databases:
  - PostgreSQL: postgresql://user:pass@host:port/database
  - MySQL: mysql://user:pass@host:port/database  
  - SQLite: /path/to/database.db

Quick Start:
  1. Set your DATABASE_URL environment variable
  2. Run: database-mcp --setup
  3. Restart Claude Desktop

Example:
  DATABASE_URL="postgresql://user:pass@localhost:5432/mydb" database-mcp
`);
}

function showVersion(): void {
  const packageJson = require('../../package.json');
  console.log(`database-mcp v${packageJson.version}`);
}

function showConfiguration(): void {
  console.log(`
Configuration Instructions:

1. Set DATABASE_URL environment variable:
   export DATABASE_URL="your_connection_string"

2. Add to Claude Desktop configuration file:
`);
  
  const configPath = getClaudeConfigPath();
  console.log(`   Location: ${configPath}`);
  
  console.log(`
3. Configuration example:
   {
     "mcpServers": {
       "database-mcp": {
         "command": "database-mcp",
         "env": {
           "DATABASE_URL": "your_connection_string"
         }
       }
     }
   }

4. Restart Claude Desktop

Connection String Examples:`);
  
  const examples = getConnectionStringExamples();
  Object.entries(examples).forEach(([type, urls]) => {
    console.log(`\n${type.toUpperCase()}:`);
    urls.forEach((url: string) => console.log(`  ${url}`));
  });
}

function showConfigLocation(): void {
  const configPath = getClaudeConfigPath();
  console.log(`Claude Desktop config location: ${configPath}`);
  
  try {
    if (fs.existsSync(configPath)) {
      console.log('✅ Config file exists');
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.mcpServers && config.mcpServers['database-mcp']) {
          console.log('✅ database-mcp server already configured');
        } else {
          console.log('⚠️  database-mcp server not configured');
          console.log('💡 Run --setup to configure automatically');
        }
      } catch (parseError) {
        console.log('❌ Config file exists but cannot be parsed');
      }
    } else {
      console.log('⚠️  Config file does not exist');
      console.log('💡 Run --setup to create configuration');
    }
  } catch (error) {
    console.log('⚠️  Unable to check config file');
    console.log('💡 Run --setup to create configuration');
  }
}

function interactiveSetup(): void {
  console.log('🚀 Setting up database-mcp for Claude Desktop...\n');
  
  const configPath = getClaudeConfigPath();
  console.log(`Config file: ${configPath}`);
  
  // Ensure directory exists
  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) {
    console.log('📁 Creating Claude config directory...');
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  let config: any = {};
  
  // Read existing config if it exists
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      console.log('📖 Found existing configuration');
    } catch (error) {
      console.log('⚠️  Existing config file is invalid, creating new one');
      config = {};
    }
  }
  
  // Ensure mcpServers exists
  if (!config.mcpServers) {
    config.mcpServers = {};
  }
  
  // Check if DATABASE_URL is provided
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log(`
❌ DATABASE_URL environment variable is required

Please set it first:
  export DATABASE_URL="your_connection_string"

Then run setup again:
  database-mcp --setup
`);
    return;
  }
  
  // Validate the connection string
  try {
    const dbType = detectDatabaseType(databaseUrl);
    validateConnectionString(databaseUrl);
    console.log(`✅ Valid ${dbType} connection string detected`);
  } catch (error) {
    console.log(`❌ Invalid DATABASE_URL: ${(error as Error).message}`);
    return;
  }
  
  // Configure the MCP server
  config.mcpServers['database-mcp'] = {
    command: 'database-mcp',
    env: {
      DATABASE_URL: databaseUrl
    }
  };
  
  // Add SSL configuration for cloud databases if needed
  if (databaseUrl.includes('digitalocean.com') || 
      databaseUrl.includes('amazonaws.com') || 
      databaseUrl.includes('azure.com') ||
      databaseUrl.includes('googleusercontent.com')) {
    config.mcpServers['database-mcp'].env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.log('🔒 Added SSL configuration for cloud database');
  }
  
  // Write the configuration
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('✅ Configuration saved successfully!');
    console.log(`
🎉 Setup complete!

Next steps:
1. Restart Claude Desktop
2. Start a new conversation
3. You should now have access to database tools

The following tools will be available:
- Query database
- List tables and schemas  
- Describe table structure
- Analyze data
- And more!
`);
  } catch (error) {
    console.log(`❌ Failed to save configuration: ${(error as Error).message}`);
  }
}

function getClaudeConfigPath(): string {
  const platform = os.platform();
  
  switch (platform) {
    case 'darwin': // macOS
      return path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
    case 'win32': // Windows
      return path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
    default: // Linux and others
      return path.join(os.homedir(), '.config', 'claude', 'claude_desktop_config.json');
  }
}

module.exports = {
    handleCliCommands
}; 