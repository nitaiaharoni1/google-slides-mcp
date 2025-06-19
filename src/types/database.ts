/**
 * Database Type Definitions
 */

// Database connection result interface
export interface DatabaseConnectionInfo {
  serverTime?: string;
  version?: string;
  filePath?: string;
}

// Standardized query result interface
export interface DatabaseQueryResult {
  rows: any[];
  rowCount: number;
  command: string;
  fields?: any[];
}

// Database query field definition
export interface DatabaseField {
  name: string;
  dataTypeID?: number;
  tableID?: number;
  columnID?: number;
  dataTypeSize?: number;
  dataTypeModifier?: number;
  format?: string;
}

// Database types enum
export type DatabaseType = 'postgresql' | 'mysql' | 'sqlite' | 'snowflake';

// Database configuration interfaces
export interface DatabaseConfig {
  connectionString: string;
  connectionTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  max?: number;
  ssl?: SSLConfig | boolean;
}

export interface SSLConfig {
  rejectUnauthorized: boolean;
  checkServerIdentity?: (servername: string, cert: any) => undefined;
  requestCert?: boolean;
  agent?: boolean;
}

// Schema query interfaces
export interface SchemaQueries {
  listTables: string;
  listSchemas: string;
  describeTable: string;
  listIndexes: string;
}

// Info query interfaces
export interface InfoQueries {
  version: string;
  size: string;
  settings: string;
  activity: string;
}

// Data type mappings
export interface DataTypeMap {
  [key: string]: string;
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  type?: DatabaseType | null;
}

// Connection string examples
export interface ConnectionStringExamples {
  postgresql: string[];
  mysql: string[];
  sqlite: string[];
  snowflake: string[];
}

// Column information interface
export interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length?: number | null;
  numeric_precision?: number | null;
  numeric_scale?: number | null;
}

// Table information interface
export interface TableInfo {
  schemaname?: string;
  table_name: string;
  table_type: string;
}

// Index information interface
export interface IndexInfo {
  schemaname?: string;
  tablename: string;
  indexname: string;
  indexdef: string;
  index_type: string;
}

// Foreign key information interface
export interface ForeignKeyInfo {
  table_schema?: string;
  table_name: string;
  column_name: string;
  foreign_table_schema?: string;
  foreign_table_name: string;
  foreign_column_name: string;
  constraint_name: string;
}

// Function information interface
export interface FunctionInfo {
  schema_name: string;
  function_name: string;
  function_type: string;
  return_type?: string;
  arguments?: string;
  routine_definition?: string;
}

// Statistics interfaces
export interface TableStats {
  table_name: string;
  size: string;
  size_bytes: number;
  estimated_rows: number;
}

export interface ColumnStats {
  schemaname: string;
  tablename: string;
  attname: string;
  n_distinct: number | null;
  most_common_vals: string[] | null;
  most_common_freqs: number[] | null;
  histogram_bounds: string[] | null;
  correlation: number | null;
}

export interface ColumnAnalysis {
  total_rows: number;
  non_null_count: number;
  null_count: number;
  distinct_count: number;
  min_value: string | null;
  max_value: string | null;
}

export interface MostCommonValue {
  value: any;
  frequency: number;
}
