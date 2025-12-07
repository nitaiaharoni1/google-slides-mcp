/**
 * MCP (Model Context Protocol) Type Definitions
 */

// MCP Tool Result Content
export interface MCPTextContent {
  type: "text";
  text: string;
}

export interface MCPImageContent {
  type: "image";
  data: string;
  mimeType: string;
}

export type MCPContent = MCPTextContent | MCPImageContent;

// MCP Tool Result
export interface MCPResult {
  content: MCPContent[];
  isError?: boolean;
}

// MCP Tool Input Schema Property
export interface MCPInputProperty {
  type: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default?: any; // Default value can be any JSON-serializable type
  enum?: string[];
  items?: MCPInputProperty;
  properties?: { [key: string]: MCPInputProperty };
  required?: string[];
  // Enhanced fields for better tool descriptions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  examples?: any[]; // Example values for this parameter (can be any type)
  minimum?: number; // Minimum value for numeric types
  maximum?: number; // Maximum value for numeric types
  minLength?: number; // Minimum length for string types
  maxLength?: number; // Maximum length for string types
  pattern?: string; // Regex pattern for string types
}

// MCP Tool Input Schema
export interface MCPInputSchema {
  type: "object";
  properties: { [key: string]: MCPInputProperty };
  required?: string[];
}

// MCP Tool Definition
export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: MCPInputSchema;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (args: any) => Promise<MCPResult>;
}

// MCP Tool Arguments (generic)
export interface MCPToolArgs {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Tool arguments can be any JSON-serializable type
}

// MCP Server Configuration
export interface MCPServerConfig {
  name: string;
  version: string;
}

// MCP Error Response
export interface MCPError {
  code: number;
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any; // Error data can be any type
}

// Standardized error response with suggestions
export interface MCPErrorResponse {
  success: false;
  error: string;
  message: string;
  suggestion?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provided?: any; // Provided value can be any type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expected?: any; // Expected value description can be any type
  validRange?: [number, number];
  validOptions?: string[];
}
