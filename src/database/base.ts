/**
 * Base Database Interface
 * Abstract class that defines the interface for all database implementations
 */

import {
  DatabaseType,
  DatabaseQueryResult,
  DatabaseConnectionInfo,
  SchemaQueries,
  InfoQueries,
  DataTypeMap,
} from '../types/database';

abstract class DatabaseInterface {
  protected connectionString: string;
  protected client: any = null;
  protected isConnected: boolean = false;
  protected abstract type: DatabaseType;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
  }

  /**
   * Connect to the database
   */
  abstract connect(): Promise<void>;

  /**
   * Close the database connection
   */
  abstract close(): Promise<void>;

  /**
   * Execute a query
   * @param query - SQL query to execute
   * @param params - Query parameters
   * @returns Query result with standardized format
   */
  abstract query(query: string, params?: any[]): Promise<DatabaseQueryResult>;

  /**
   * Get database type
   * @returns Database type (postgresql, mysql, sqlite, etc.)
   */
  abstract getType(): DatabaseType;

  /**
   * Get connection status
   * @returns True if connected
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Get database-specific information queries
   * @returns Object containing database-specific queries
   */
  abstract getInfoQueries(): InfoQueries;

  /**
   * Get schema introspection queries
   * @returns Object containing schema queries for this database type
   */
  abstract getSchemaQueries(): SchemaQueries;

  /**
   * Validate and transform query for this database type
   * @param query - SQL query
   * @returns Validated/transformed query
   */
  validateQuery(query: string): string {
    // Default implementation - override for database-specific validation
    const trimmedQuery = query.trim().toLowerCase();

    // Allow read operations
    const allowedReadStarts = ['select', 'with', 'show', 'describe', 'explain'];
    // Allow write operations (non-destructive)
    const allowedWriteStarts = ['insert', 'update', 'alter', 'create'];

    const isAllowedOperation =
      allowedReadStarts.some((keyword) => trimmedQuery.startsWith(keyword)) ||
      allowedWriteStarts.some((keyword) => trimmedQuery.startsWith(keyword));

    if (!isAllowedOperation) {
      throw new Error(
        'Only SELECT, WITH, SHOW, DESCRIBE, EXPLAIN, INSERT, UPDATE, ALTER, and CREATE queries are allowed for security reasons',
      );
    }

    // Block destructive operations
    const destructiveKeywords = ['drop', 'delete', 'truncate'];
    const hasDestructiveKeywords = destructiveKeywords.some((keyword) =>
      trimmedQuery.includes(keyword.toLowerCase()),
    );

    if (hasDestructiveKeywords) {
      throw new Error(
        'Destructive operations (DROP, DELETE, TRUNCATE) are not allowed for safety.',
      );
    }

    return query;
  }

  /**
   * Get database-specific data type mappings
   * @returns Data type mappings
   */
  getDataTypeMap(): DataTypeMap {
    return {
      // Default mappings - override in specific implementations
      string: 'TEXT',
      number: 'NUMERIC',
      boolean: 'BOOLEAN',
      date: 'TIMESTAMP',
    };
  }

  /**
   * Get connection information (implemented by subclasses)
   */
  protected abstract _getConnectionInfo(): Promise<DatabaseConnectionInfo>;
}

export default DatabaseInterface;
