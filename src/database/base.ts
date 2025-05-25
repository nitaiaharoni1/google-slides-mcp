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
  DataTypeMap
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
    
    if (!trimmedQuery.startsWith('select') && 
        !trimmedQuery.startsWith('with') && 
        !trimmedQuery.startsWith('show') &&
        !trimmedQuery.startsWith('describe') &&
        !trimmedQuery.startsWith('explain')) {
      throw new Error('Only SELECT, WITH, SHOW, DESCRIBE, and EXPLAIN queries are allowed for security reasons');
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
      'string': 'TEXT',
      'number': 'NUMERIC',
      'boolean': 'BOOLEAN',
      'date': 'TIMESTAMP'
    };
  }

  /**
   * Get connection information (implemented by subclasses)
   */
  protected abstract _getConnectionInfo(): Promise<DatabaseConnectionInfo>;
}

export default DatabaseInterface; 