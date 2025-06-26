/**
 * Command-line interface handling for Multi-Database MCP Server
 * Focuses only on argument parsing, delegates command execution
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  detectDatabaseType,
  validateConnectionString,
  getConnectionStringExamples,
} from './database';
import {
  getClaudeConfigPath,
  mergeClaudeConfig,
  readClaudeConfig,
  generateNpxConfig,
  generateGlobalConfig,
} from './config/claude';

// Type declaration for build-time injected constants
declare const __PACKAGE_VERSION__: string;

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
      console.log(
        '⚠️  WARNING: --configure is deprecated. Use "database-mcp init" instead.',
      );
      showConfiguration();
      return true;
    case '--find-config':
      showConfigLocation();
      return true;
    case 'init':
      // Pass the connection string if provided as second argument
      const connectionString = args[1];
      interactiveSetup(connectionString);
      return true;
    case 'status':
      showStatus();
      return true;
    case 'update':
      // Pass the new connection string as second argument
      const newConnectionString = args[1];
      updateDatabaseUrl(newConnectionString);
      return true;
    case '--setup':
      console.log(
        '⚠️  WARNING: --setup is deprecated. Use "database-mcp init" instead.',
      );
      // Keep --setup for backward compatibility
      interactiveSetup();
      return true;
    default:
      return false;
  }
}

function showHelp(): void {
  console.log(`
Claude Multi-Database MCP Server

Usage (NPX - Recommended):
  npx database-mcp [options]
  npx database-mcp init [connection_string]
  npx database-mcp status
  npx database-mcp update <connection_string>

Usage (Global Installation):
  database-mcp [options]
  database-mcp init [connection_string]
  database-mcp status
  database-mcp update <connection_string>

Options:
  --help, -h        Show this help message
  --version, -v     Show version information
  --find-config     Show config file location
  init              Interactive setup for Claude Desktop
  status            Show current database configuration
  update            Update database connection string
  --configure       Show configuration instructions (DEPRECATED - use init)
  --setup           Interactive setup (DEPRECATED - use init)

Examples (NPX):
  npx database-mcp init "postgresql://user:pass@host:port/db"
  npx database-mcp init "mysql://user:pass@localhost:3306/mydb"
  npx database-mcp init "./database.sqlite"
  npx database-mcp init "snowflake://user:pass@account.snowflakecomputing.com/db"
  npx database-mcp status
  npx database-mcp update "postgresql://user:pass@newhost:port/db"

Examples (Global):
  database-mcp init "postgresql://user:pass@host:port/db"
  database-mcp status

Environment Variables:
  DATABASE_URL      Database connection string (used if not provided as argument)

Supported Databases:
  - PostgreSQL: postgresql://user:pass@host:port/database
  - MySQL: mysql://user:pass@host:port/database  
  - SQLite: /path/to/database.db
  - Snowflake: snowflake://user:pass@account.snowflakecomputing.com/database

Quick Start (NPX - No Installation Required):
  1. Run: npx database-mcp init "your_connection_string"
  2. Check: npx database-mcp status
  3. Restart Claude Desktop

Quick Start (Global Installation):
  1. Install: npm install -g database-mcp
  2. Setup: database-mcp init "your_connection_string"
  3. Check status: database-mcp status
  4. Restart Claude Desktop

Alternative Setup:
  export DATABASE_URL="your_connection_string"
  npx database-mcp init
`);
}

function showVersion(): void {
  const version =
    typeof __PACKAGE_VERSION__ !== 'undefined'
      ? __PACKAGE_VERSION__
      : require('../../package.json').version;
  console.log(`database-mcp v${version}`);
}

function showConfiguration(): void {
  console.log(`
Configuration Instructions:

Choose one of the following methods:

1. NPX Usage (Recommended - No Installation Required):
   {
     "mcpServers": {
       "database-mcp": {
         "command": "npx",
         "args": ["database-mcp"],
         "env": {
           "DATABASE_URL": "your_connection_string"
         }
       }
     }
   }

2. Global Installation:
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

3. Manual Setup:
   - Config location: ${getClaudeConfigPath()}
   - Restart Claude Desktop after configuration

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

function interactiveSetup(connectionString?: string): void {
  console.log('🚀 Setting up database-mcp for Claude Desktop...\n');

  const configPath = getClaudeConfigPath();
  console.log(`Config file: ${configPath}`);

  // Check if DATABASE_URL is provided via argument or environment
  const databaseUrl = connectionString || process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log(`
❌ DATABASE_URL is required

Provide it as an argument:
  database-mcp init "postgresql://user:pass@host:port/db"
  npx database-mcp init "postgresql://user:pass@host:port/db"

Or set as environment variable:
  export DATABASE_URL="your_connection_string"
  database-mcp init
`);
    console.log('\nConnection string examples:');
    const examples = getConnectionStringExamples();
    Object.entries(examples).forEach(([type, urls]) => {
      console.log(`\n${type.toUpperCase()}:`);
      (urls as string[]).slice(0, 1).forEach((url: string) => console.log(`  ${url}`));
    });
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

  // Use the new configuration system with NPX as default
  const success = mergeClaudeConfig(databaseUrl, true);
  
  if (success) {
    console.log('✅ Configuration saved successfully!');
    console.log(`
🎉 Setup complete!

Configuration Method: NPX (Recommended)
- Uses: npx database-mcp
- No global installation required
- Always runs latest version

Configuration saved to: ${configPath}

Next steps:
1. Restart Claude Desktop
2. Start a new conversation  
3. You should now have access to database tools

The following tools will be available:
- Query database with natural language
- List tables and schemas
- Describe table structure
- Analyze data distributions
- Get foreign key relationships
- And more database introspection tools!

💡 Try asking Claude: "What tables are in my database?"
`);
  } else {
    console.log('❌ Failed to save configuration');
    console.log('\n📝 Manual Configuration:');
    const manualConfig = generateNpxConfig(databaseUrl);
    console.log(JSON.stringify(manualConfig, null, 2));
    console.log(`\nSave this to: ${configPath}`);
  }
}

function showStatus(): void {
  console.log('📊 Current Database Configuration Status\n');

  const configPath = getClaudeConfigPath();
  console.log(`Config file: ${configPath}`);

  // Check if config file exists and has database-mcp configured
  try {
    if (fs.existsSync(configPath)) {
      console.log('✅ Claude Desktop config file exists');
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.mcpServers && config.mcpServers['database-mcp']) {
          const dbConfig = config.mcpServers['database-mcp'];
          const dbUrl = dbConfig.env?.DATABASE_URL;

          console.log('✅ database-mcp server is configured');

          if (dbUrl) {
            // Mask password in URL for display
            const maskedUrl = dbUrl.replace(/:[^:@]*@/, ':***@');
            console.log(`📂 Current DATABASE_URL: ${maskedUrl}`);

            // Validate the connection string
            try {
              const dbType = detectDatabaseType(dbUrl);
              validateConnectionString(dbUrl);
              console.log(`✅ Valid ${dbType} connection string`);
            } catch (error) {
              console.log(
                `❌ Invalid connection string: ${(error as Error).message}`,
              );
            }
          } else {
            console.log('⚠️  No DATABASE_URL configured');
          }

          // Check for SSL config
          if (dbConfig.env?.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
            console.log('🔒 SSL verification disabled (cloud database)');
          }
        } else {
          console.log('❌ database-mcp server not configured');
          console.log('💡 Run "database-mcp init" to configure');
        }
      } catch (parseError) {
        console.log('❌ Config file exists but cannot be parsed');
      }
    } else {
      console.log('❌ Claude Desktop config file does not exist');
      console.log('💡 Run "database-mcp init" to create configuration');
    }
  } catch (error) {
    console.log('⚠️  Unable to check config file');
    console.log('💡 Run "database-mcp init" to create configuration');
  }

  // Check environment variable
  const envUrl = process.env.DATABASE_URL;
  if (envUrl) {
    const maskedEnvUrl = envUrl.replace(/:[^:@]*@/, ':***@');
    console.log(`\n🌍 Environment DATABASE_URL: ${maskedEnvUrl}`);
  } else {
    console.log('\n⚠️  No DATABASE_URL environment variable set');
  }
}

function updateDatabaseUrl(newConnectionString?: string): void {
  console.log('🔄 Updating database connection...\n');

  if (!newConnectionString) {
    console.log(`
❌ Connection string is required

Usage:
  database-mcp update "postgresql://user:pass@host:port/db"
  database-mcp update "mysql://user:pass@localhost:3306/mydb"
  database-mcp update "./database.sqlite"
`);
    return;
  }

  // Validate the new connection string
  try {
    const dbType = detectDatabaseType(newConnectionString);
    validateConnectionString(newConnectionString);
    console.log(`✅ Valid ${dbType} connection string detected`);
  } catch (error) {
    console.log(`❌ Invalid connection string: ${(error as Error).message}`);
    return;
  }

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
  } else {
    console.log('📝 Creating new configuration file');
  }

  // Ensure mcpServers exists
  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  // Update or create the MCP server configuration
  config.mcpServers['database-mcp'] = {
    command: 'database-mcp',
    env: {
      DATABASE_URL: newConnectionString,
    },
  };

  // Add SSL configuration for cloud databases if needed
  if (
    newConnectionString.includes('digitalocean.com') ||
    newConnectionString.includes('amazonaws.com') ||
    newConnectionString.includes('azure.com') ||
    newConnectionString.includes('googleusercontent.com')
  ) {
    config.mcpServers['database-mcp'].env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.log('🔒 Added SSL configuration for cloud database');
  }

  // Write the configuration
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('✅ Configuration updated successfully!');

    const maskedUrl = newConnectionString.replace(/:[^:@]*@/, ':***@');
    console.log(`📂 New DATABASE_URL: ${maskedUrl}`);

    console.log(`
🎉 Update complete!

Next steps:
1. Restart Claude Desktop
2. Start a new conversation
3. Your database connection has been updated

To check the status: database-mcp status
`);
  } catch (error) {
    console.log(
      `❌ Failed to update configuration: ${(error as Error).message}`,
    );
  }
}


