/**
 * Claude Desktop configuration utilities
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface ClaudeConfig {
  mcpServers?: {
    [key: string]: {
      command: string;
      env: {
        DATABASE_URL: string;
      };
    };
  };
}

/**
 * Configure Claude Desktop with Multi-Database MCP server
 */
export function configureClaudeDesktop(databaseUrl?: string): void {
  console.log('🔧 Configuring Claude Desktop for Multi-Database MCP Server...\n');
  
  try {
    // Detect OS and get config path
    const configPath = getClaudeConfigPath();
    console.log(`📁 Config path: ${configPath}`);
    
    // Read or create config
    let config: ClaudeConfig = {};
    if (fs.existsSync(configPath)) {
      try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        config = JSON.parse(configContent);
        console.log('✅ Found existing Claude Desktop configuration');
      } catch (error) {
        console.log('⚠️  Existing config file has invalid JSON, creating new configuration');
        config = {};
      }
    } else {
      console.log('📝 No existing config found, creating new configuration');
      // Create directory if it doesn't exist
      const configDir = path.dirname(configPath);
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Initialize mcpServers if it doesn't exist
    if (!config.mcpServers) {
      config.mcpServers = {};
    }
    
    // Get DATABASE_URL from user if not set
    let databaseUrlToUse = databaseUrl || process.env.DATABASE_URL;
    if (!databaseUrlToUse) {
      console.log('\n⚠️  DATABASE_URL environment variable not found.');
      console.log('Please set it first, for example:');
      console.log('  PostgreSQL: export DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"');
      console.log('  MySQL:      export DATABASE_URL="mysql://user:pass@host:3306/db"');
      console.log('  SQLite:     export DATABASE_URL="sqlite://./database.db"');
      console.log('\nOr you can manually edit the config file later at:');
      console.log(configPath);
      databaseUrlToUse = "postgresql://username:password@host:port/database?sslmode=require";
    }
    
    // Add or update the multi-database MCP server configuration
    config.mcpServers['multi-database'] = {
      command: "claude-multi-database-mcp",
      env: {
        DATABASE_URL: databaseUrlToUse
      }
    };
    
    // Write updated config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    console.log('\n✅ Claude Desktop configuration updated successfully!');
    console.log('\nConfiguration added:');
    console.log(JSON.stringify({ mcpServers: { 'multi-database': config.mcpServers['multi-database'] } }, null, 2));
    
    console.log('\n📋 Next steps:');
    console.log('1. Restart Claude Desktop');
    if (!databaseUrlToUse || databaseUrlToUse === "postgresql://username:password@host:port/database?sslmode=require") {
      console.log('2. Set your DATABASE_URL environment variable');
      console.log('3. Or edit the config file manually to add your database connection string');
    } else {
      if (databaseUrl) {
        console.log('2. Database URL configured from parameter ✅');
      } else {
        console.log('2. Database URL configured from environment variable ✅');
      }
      console.log('3. Start chatting with Claude - it now has access to your database!');
    }
    
    console.log('\n💡 Test the connection with: claude-multi-database-mcp --test');
    
  } catch (error) {
    console.error('❌ Failed to configure Claude Desktop:', (error as Error).message);
    console.error('\n💡 You can manually configure Claude Desktop by editing:');
    console.error(getClaudeConfigPath());
    console.error('\nAdd this configuration:');
    console.error(JSON.stringify({
      mcpServers: {
        'multi-database': {
          command: "claude-multi-database-mcp",
          env: {
            DATABASE_URL: process.env.DATABASE_URL || "postgresql://username:password@host:port/database?sslmode=require"
          }
        }
      }
    }, null, 2));
    process.exit(1);
  }
}

/**
 * Get Claude Desktop configuration file path based on OS
 */
export function getClaudeConfigPath(): string {
  const platform = os.platform();
  const homeDir = os.homedir();
  
  switch (platform) {
    case 'darwin': // macOS
      return path.join(homeDir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
    case 'linux':
      return path.join(homeDir, '.config', 'Claude', 'claude_desktop_config.json');
    case 'win32': // Windows
      const appData = process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming');
      return path.join(appData, 'Claude', 'claude_desktop_config.json');
    default:
      throw new Error(`Unsupported operating system: ${platform}. Please configure manually.`);
  }
}

/**
 * Show Claude Desktop configuration file location and status
 */
export function showConfigLocation(): void {
  console.log('🔍 Finding Claude Desktop configuration file...\n');
  
  try {
    const configPath = getClaudeConfigPath();
    const platform = os.platform();
    
    console.log(`🖥️  Operating System: ${platform === 'darwin' ? 'macOS' : platform === 'win32' ? 'Windows' : platform}`);
    console.log(`📁 Configuration file location:`);
    console.log(`   ${configPath}`);
    
    // Check if file exists
    const fileExists = fs.existsSync(configPath);
    console.log(`📄 File exists: ${fileExists ? '✅ Yes' : '❌ No (will be created when you add config)'}`);
    
    if (fileExists) {
      try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);
        const hasMultiDatabase = config.mcpServers && config.mcpServers['multi-database'];
        console.log(`🔗 Multi-Database MCP configured: ${hasMultiDatabase ? '✅ Yes' : '❌ No'}`);
      } catch (error) {
        console.log(`⚠️  Config file exists but has invalid JSON`);
      }
    }
    
    console.log('\n📝 Manual Configuration Instructions:');
    console.log('1. Open the configuration file in your text editor');
    console.log('2. Add or update the following configuration:');
    
    const exampleConfig = {
      mcpServers: {
        'multi-database': {
          command: "claude-multi-database-mcp",
          env: {
            DATABASE_URL: process.env.DATABASE_URL || "postgresql://username:password@host:port/database?sslmode=require"
          }
        }
      }
    };
    
    console.log('\n```json');
    console.log(JSON.stringify(exampleConfig, null, 2));
    console.log('```');
    
    console.log('\n💡 Alternative commands:');
    console.log('   Automatic config: claude-multi-database-mcp --configure');
    console.log('   Test connection:  claude-multi-database-mcp --test');
    
    if (!process.env.DATABASE_URL) {
      console.log('\n⚠️  Don\'t forget to set your DATABASE_URL environment variable:');
      console.log('   PostgreSQL: export DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"');
      console.log('   MySQL:      export DATABASE_URL="mysql://user:pass@host:3306/db"');
      console.log('   SQLite:     export DATABASE_URL="sqlite://./database.db"');
    }
    
  } catch (error) {
    console.error('❌ Failed to locate Claude Desktop configuration:', (error as Error).message);
    console.error('\n💡 Supported operating systems: macOS, Linux, Windows');
    console.error('For manual configuration, please refer to the Claude Desktop documentation.');
    process.exit(1);
  }
} 