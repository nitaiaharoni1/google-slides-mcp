/**
 * Command-line interface handling for Google Slides MCP Server
 * Focuses only on argument parsing, delegates command execution
 */

import * as fs from "fs";
import * as readline from "readline";
import {
  getClaudeConfigPath,
  mergeClaudeConfig,
  readClaudeConfig,
  generateNpxConfig,
} from "./config/claude";
import {
  startAuthFlow,
  exchangeCodeForTokens,
  hasValidTokens,
  getTokensPath,
  clearTokens,
} from "./auth";

// Type declaration for build-time injected constants
declare const __PACKAGE_VERSION__: string;

/**
 * CLI Command Handler
 * Handles command-line interface operations
 */
export async function handleCliCommands(args: string[]): Promise<boolean> {
  if (args.length === 0) {
    return false;
  }

  const command = args[0];

  switch (command) {
    case "--help":
    case "-h":
      showHelp();
      return true;
    case "--version":
    case "-v":
      showVersion();
      return true;
    case "auth":
      await handleAuth(args.slice(1));
      return true;
    case "status":
      showStatus();
      return true;
    case "init":
      interactiveSetup(args.slice(1));
      return true;
    default:
      return false;
  }
}

function showHelp(): void {
  console.log(`
Google Slides MCP Server

Usage (NPX - Recommended):
  npx google-slides-mcp [options]
  npx google-slides-mcp auth
  npx google-slides-mcp status
  npx google-slides-mcp init

Usage (Global Installation):
  google-slides-mcp [options]
  google-slides-mcp auth
  google-slides-mcp status
  google-slides-mcp init

Options:
  --help, -h        Show this help message
  --version, -v     Show version information
  auth [--force]    Authenticate with Google (OAuth2 flow). Use --force to re-authenticate.
  status            Show current authentication status
  init              Interactive setup for Claude Desktop

Examples (NPX):
  npx google-slides-mcp auth
  npx google-slides-mcp status
  npx google-slides-mcp init

Examples (Global):
  google-slides-mcp auth
  google-slides-mcp status

Environment Variables:
  GOOGLE_CLIENT_ID       OAuth2 client ID (required)
  GOOGLE_CLIENT_SECRET   OAuth2 client secret (required)
  GOOGLE_REDIRECT_URI    OAuth2 redirect URI (default: http://localhost:3000/oauth2callback)

Quick Start (NPX - No Installation Required):
  1. Get OAuth2 credentials from: https://console.cloud.google.com/apis/credentials
  2. Run: npx google-slides-mcp auth
  3. Follow the authentication flow
  4. Run: npx google-slides-mcp init
  5. Restart Claude Desktop

Quick Start (Global Installation):
  1. Install: npm install -g google-slides-mcp
  2. Setup: google-slides-mcp auth
  3. Check status: google-slides-mcp status
  4. Configure: google-slides-mcp init
  5. Restart Claude Desktop
`);
}

function showVersion(): void {
  let version = "1.0.0"; // Fallback version

  // Use injected version from build process
  if (typeof __PACKAGE_VERSION__ !== "undefined") {
    version = __PACKAGE_VERSION__;
  } else {
    // Try to load from package.json if running from source
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pkg = require("../../package.json") as { version: string };
      version = pkg.version;
    } catch {
      // Use fallback version if package.json not found
    }
  }

  console.log(`google-slides-mcp v${version}`);
}

async function handleAuth(args: string[]): Promise<void> {
  console.log("🔐 Google Slides MCP Authentication\n");

  // Check for --force flag
  const force = args.includes("--force");
  if (force) {
    console.log("🔄 Force flag detected, clearing existing tokens...");
    clearTokens();
  }

  // Check for client ID and secret
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.log(`
❌ GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required.

To get OAuth2 credentials:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID credentials
3. Set authorized redirect URI to: http://localhost:3000/oauth2callback
4. Set environment variables:
   export GOOGLE_CLIENT_ID="your-client-id"
   export GOOGLE_CLIENT_SECRET="your-client-secret"
5. Run this command again
`);
    return;
  }

  // Check if already authenticated (unless --force was used)
  if (!force && hasValidTokens()) {
    console.log("✅ Already authenticated");
    console.log(`📁 Tokens stored at: ${getTokensPath()}`);
    console.log("\nTo re-authenticate, run: google-slides-mcp auth --force");
    return;
  }

  // Start OAuth flow
  try {
    const _authUrl = await startAuthFlow();
    console.log("\n📋 Please complete the authentication in your browser.");
    console.log(
      "After authorizing, you will be redirected to a page with a code."
    );
    console.log("\nPaste the authorization code here:");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("Authorization code: ", (code) => {
      rl.close();

      void (async () => {
        try {
          await exchangeCodeForTokens(code.trim());
          console.log("\n✅ Authentication successful!");
          console.log(`📁 Tokens saved to: ${getTokensPath()}`);
          console.log("\nYou can now use the Google Slides MCP server.");
        } catch (error) {
          console.error(
            "\n❌ Authentication failed:",
            (error as Error).message
          );
          console.error("Please try again.");
        }
      })();
    });
  } catch (error) {
    console.error(
      "❌ Failed to start authentication:",
      (error as Error).message
    );
  }
}

function showStatus(): void {
  console.log("📊 Current Authentication Status\n");

  // Check environment variables
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (clientId) {
    const maskedId = clientId.substring(0, 10) + "...";
    console.log(`✅ GOOGLE_CLIENT_ID: ${maskedId}`);
  } else {
    console.log("❌ GOOGLE_CLIENT_ID: Not set");
  }

  if (clientSecret) {
    console.log("✅ GOOGLE_CLIENT_SECRET: Set");
  } else {
    console.log("❌ GOOGLE_CLIENT_SECRET: Not set");
  }

  // Check tokens
  const tokensPath = getTokensPath();
  if (fs.existsSync(tokensPath)) {
    console.log(`✅ Tokens file exists: ${tokensPath}`);
    if (hasValidTokens()) {
      console.log("✅ Authentication: Valid");
    } else {
      console.log("⚠️  Authentication: Tokens exist but may be invalid");
    }
  } else {
    console.log("❌ Tokens file: Not found");
    console.log('💡 Run "google-slides-mcp auth" to authenticate');
  }

  // Check Claude Desktop config
  const configPath = getClaudeConfigPath();
  console.log(`\n📁 Claude Desktop config: ${configPath}`);

  try {
    if (fs.existsSync(configPath)) {
      console.log("✅ Claude Desktop config file exists");
      const config = readClaudeConfig();
      if (config?.mcpServers?.["google-slides-mcp"]) {
        console.log("✅ google-slides-mcp server is configured");
      } else {
        console.log("⚠️  google-slides-mcp server not configured");
        console.log('💡 Run "google-slides-mcp init" to configure');
      }
    } else {
      console.log("❌ Claude Desktop config file does not exist");
      console.log('💡 Run "google-slides-mcp init" to create configuration');
    }
  } catch {
    console.log("⚠️  Unable to check Claude Desktop config");
  }
}

function interactiveSetup(_args: string[]): void {
  console.log("🚀 Setting up google-slides-mcp for Claude Desktop...\n");

  const configPath = getClaudeConfigPath();
  console.log(`Config file: ${configPath}`);

  // Check for client ID and secret
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret) {
    console.log(`
❌ GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required.

To get OAuth2 credentials:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID credentials
3. Set authorized redirect URI to: http://localhost:3000/oauth2callback
4. Set environment variables:
   export GOOGLE_CLIENT_ID="your-client-id"
   export GOOGLE_CLIENT_SECRET="your-client-secret"
5. Run this command again
`);
    return;
  }

  // Use the new configuration system with NPX as default
  const success = mergeClaudeConfig(clientId, clientSecret, true, redirectUri);

  if (success) {
    console.log("✅ Configuration saved successfully!");
    console.log(`
🎉 Setup complete!

Configuration Method: NPX (Recommended)
- Uses: npx google-slides-mcp
- No global installation required
- Always runs latest version

Configuration saved to: ${configPath}

Next steps:
1. Run: google-slides-mcp auth (if not already authenticated)
2. Restart Claude Desktop
3. Start a new conversation  
4. You should now have access to Google Slides tools

The following tools will be available:
- Create and manage presentations
- Add and edit slides
- Insert text, images, shapes, tables
- Format content and apply styles
- Batch operations
- And more!

💡 Try asking Claude: "Create a new presentation called 'My Presentation'"
`);
  } else {
    console.log("❌ Failed to save configuration");
    console.log("\n📝 Manual Configuration:");
    const manualConfig = generateNpxConfig(clientId, clientSecret, redirectUri);
    console.log(JSON.stringify(manualConfig, null, 2));
    console.log(`\nSave this to: ${configPath}`);
  }
}
