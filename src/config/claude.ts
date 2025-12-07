/**
 * Claude Desktop Configuration Helper
 * Handles configuration file management for Claude Desktop integration
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface ClaudeConfig {
  mcpServers: {
    [key: string]: {
      command: string;
      args?: string[];
      env?: {
        [key: string]: string;
      };
    };
  };
}

/**
 * Get the path to Claude Desktop configuration file
 */
export function getClaudeConfigPath(): string {
  const homeDir = os.homedir();
  const platform = os.platform();

  switch (platform) {
    case "darwin": // macOS
      return path.join(
        homeDir,
        "Library",
        "Application Support",
        "Claude",
        "claude_desktop_config.json"
      );
    case "win32": // Windows
      return path.join(
        homeDir,
        "AppData",
        "Roaming",
        "Claude",
        "claude_desktop_config.json"
      );
    case "linux": // Linux
      return path.join(
        homeDir,
        ".config",
        "Claude",
        "claude_desktop_config.json"
      );
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Generate Claude Desktop configuration for NPX usage
 */
export function generateNpxConfig(
  clientId: string,
  clientSecret: string,
  redirectUri?: string
): ClaudeConfig {
  const env: { [key: string]: string } = {
    GOOGLE_CLIENT_ID: clientId,
    GOOGLE_CLIENT_SECRET: clientSecret,
  };
  if (redirectUri) {
    env.GOOGLE_REDIRECT_URI = redirectUri;
  }
  return {
    mcpServers: {
      "google-slides-mcp": {
        command: "npx",
        args: ["google-slides-mcp"],
        env,
      },
    },
  };
}

/**
 * Generate Claude Desktop configuration for global installation
 */
export function generateGlobalConfig(
  clientId: string,
  clientSecret: string,
  redirectUri?: string
): ClaudeConfig {
  const env: { [key: string]: string } = {
    GOOGLE_CLIENT_ID: clientId,
    GOOGLE_CLIENT_SECRET: clientSecret,
  };
  if (redirectUri) {
    env.GOOGLE_REDIRECT_URI = redirectUri;
  }
  return {
    mcpServers: {
      "google-slides-mcp": {
        command: "google-slides-mcp",
        env,
      },
    },
  };
}

/**
 * Generate Claude Desktop configuration for local development
 */
export function generateLocalConfig(
  clientId: string,
  clientSecret: string,
  projectPath: string
): ClaudeConfig {
  return {
    mcpServers: {
      "google-slides-mcp": {
        command: "node",
        args: [path.join(projectPath, "dist", "server.js")],
        env: {
          GOOGLE_CLIENT_ID: clientId,
          GOOGLE_CLIENT_SECRET: clientSecret,
        },
      },
    },
  };
}

/**
 * Read existing Claude Desktop configuration
 */
export function readClaudeConfig(): ClaudeConfig | null {
  const configPath = getClaudeConfigPath();

  try {
    if (!fs.existsSync(configPath)) {
      return null;
    }

    const configContent = fs.readFileSync(configPath, "utf8");
    const parsed = JSON.parse(configContent) as unknown;
    return parsed as ClaudeConfig;
  } catch (error) {
    console.error("Error reading Claude config:", error);
    return null;
  }
}

/**
 * Write Claude Desktop configuration
 */
export function writeClaudeConfig(config: ClaudeConfig): boolean {
  const configPath = getClaudeConfigPath();

  try {
    // Ensure config directory exists
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Write config file
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error("Error writing Claude config:", error);
    return false;
  }
}

/**
 * Merge google-slides-mcp configuration into existing Claude config
 */
export function mergeClaudeConfig(
  clientId: string,
  clientSecret: string,
  useNpx: boolean = true,
  redirectUri?: string
): boolean {
  try {
    let existingConfig = readClaudeConfig();

    if (!existingConfig) {
      existingConfig = { mcpServers: {} };
    }

    if (!existingConfig.mcpServers) {
      existingConfig.mcpServers = {};
    }

    // Generate the appropriate configuration
    const newConfig = useNpx
      ? generateNpxConfig(clientId, clientSecret, redirectUri)
      : generateGlobalConfig(clientId, clientSecret, redirectUri);

    // Merge google-slides-mcp server configuration
    existingConfig.mcpServers["google-slides-mcp"] =
      newConfig.mcpServers["google-slides-mcp"];

    return writeClaudeConfig(existingConfig);
  } catch (error) {
    console.error("Error merging Claude config:", error);
    return false;
  }
}
