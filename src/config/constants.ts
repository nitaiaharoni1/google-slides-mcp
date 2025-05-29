/**
 * Application Constants
 */

import { MCPServerConfig } from '../types/mcp';

// Query execution limits
export const QUERY_LIMITS = {
  MAX_ROWS: 1000,
  CONNECTION_TIMEOUT: 30000, // 30 seconds
  IDLE_TIMEOUT: 10000, // 10 seconds
  MAX_CONNECTIONS: 10,
  QUERY_TIMEOUT: 60000, // 60 seconds
} as const;

// Server configuration
export const SERVER_CONFIG: MCPServerConfig = {
  name: 'database-mcp',
  version: '1.0.0',
} as const;

// Supported database types
export const SUPPORTED_DATABASE_TYPES = ['postgresql', 'mysql', 'sqlite'] as const;

// Cloud provider domains for SSL configuration
export const CLOUD_PROVIDERS = [
  'digitalocean.com',
  'ondigitalocean.com',
  'amazonaws.com',
  'rds.amazonaws.com',
  'googleapis.com',
  'azure.com',
  'heroku.com',
] as const;

// Dangerous SQL keywords to block
export const DANGEROUS_KEYWORDS = [
  'drop',
  'delete',
  'insert',
  'update',
  'alter',
  'create',
  'truncate',
  'grant',
  'revoke',
] as const;

// Maximum search results
export const MAX_SEARCH_RESULTS = 50;

// Default schema name
export const DEFAULT_SCHEMA = 'public';

// File extensions for SQLite detection
export const SQLITE_EXTENSIONS = ['.db', '.sqlite', '.sqlite3'] as const;

// Tool categories for database operations
export const TOOL_CATEGORIES = {
  QUERY: 'Query Execution',
  SCHEMA: 'Schema Introspection',
  ANALYSIS: 'Data Analysis',
  DISCOVERY: 'Discovery',
  INFO: 'Database Information',
} as const;

// Database connection string patterns
export const CONNECTION_PATTERNS = {
  postgresql: /^postgresql:\/\/|^postgres:\/\//,
  mysql: /^mysql:\/\/|^mysql2:\/\//,
  sqlite: /^sqlite:\/\/|\.db$|\.sqlite$|\.sqlite3$/,
} as const;

// Default connection options
export const DEFAULT_CONNECTION_OPTIONS = {
  postgresql: {
    ssl: false,
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 10000,
    max: 10,
  },
  mysql: {
    ssl: false,
    connectTimeout: 30000,
    acquireTimeout: 30000,
    timeout: 60000,
  },
  sqlite: {
    timeout: 30000,
  },
} as const; 