/**
 * MCP (Model Context Protocol) Type Definitions
 */

// MCP Tool Result Content
export interface MCPTextContent {
  type: 'text';
  text: string;
}

export interface MCPImageContent {
  type: 'image';
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
  default?: any;
  enum?: string[];
  items?: MCPInputProperty;
  properties?: { [key: string]: MCPInputProperty };
  required?: string[];
}

// MCP Tool Input Schema
export interface MCPInputSchema {
  type: 'object';
  properties: { [key: string]: MCPInputProperty };
  required?: string[];
}

// MCP Tool Definition
export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: MCPInputSchema;
  handler: (args: any) => Promise<MCPResult>;
}

// MCP Tool Arguments (generic)
export interface MCPToolArgs {
  [key: string]: any;
}

// Specific tool argument interfaces
export interface QueryDatabaseArgs extends MCPToolArgs {
  query: string;
}

export interface ExplainQueryArgs extends MCPToolArgs {
  query: string;
  analyze?: boolean;
}

export interface DescribeTableArgs extends MCPToolArgs {
  table_name: string;
}

export interface ListIndexesArgs extends MCPToolArgs {
  table_name?: string;
}

export interface GetForeignKeysArgs extends MCPToolArgs {
  table_name?: string;
}

export interface ListFunctionsArgs extends MCPToolArgs {
  schema_name?: string;
}

export interface GetTableStatsArgs extends MCPToolArgs {
  schema_name?: string;
}

export interface AnalyzeColumnArgs extends MCPToolArgs {
  table_name: string;
  column_name: string;
}

export interface SearchTablesArgs extends MCPToolArgs {
  search_term: string;
  limit?: number;
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
  data?: any;
}

// CLI Command Interfaces
export interface ParsedCommand {
  command: string | null;
  databaseUrl?: string;
}

// Formatted result data interfaces
export interface FormattedQueryData {
  rows: any[];
  rowCount: number;
  command: string;
  executionTimeMs: number;
  databaseType: string;
  truncated: boolean;
  message?: string;
}

export interface FormattedExplainData {
  query: string;
  execution_plan: any[];
  analyzed: boolean;
  databaseType: string;
}

export interface FormattedTableData {
  tables: any[];
  databaseType: string;
}

export interface FormattedSchemaData {
  schemas: any[];
  databaseType: string;
}

export interface FormattedTableDescriptionData {
  table_name: string;
  columns: any[];
  constraints: any[];
  databaseType: string;
}

export interface FormattedIndexData {
  indexes: any[];
  databaseType: string;
}

export interface FormattedForeignKeyData {
  foreign_keys: any[];
  databaseType: string;
}

export interface FormattedFunctionData {
  functions: any[];
  databaseType: string;
}

export interface FormattedStatsData {
  schema: string;
  table_sizes: any[];
  column_statistics: any[];
  databaseType: string;
}

export interface FormattedColumnAnalysisData {
  table_name: string;
  column_name: string;
  column_info: any;
  statistics: any;
  most_common_values: any[];
  databaseType: string;
}

export interface FormattedDatabaseInfoData {
  [key: string]: any;
  databaseType: string;
} 