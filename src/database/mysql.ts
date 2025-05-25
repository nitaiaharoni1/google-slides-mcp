/**
 * MySQL Database Implementation
 */

import mysql from 'mysql2/promise';
import DatabaseInterface from './base';
import { QUERY_LIMITS } from '../config/constants';
import { SSLConfigManager, ConnectionErrorHandler, ConnectionLogger } from '../utils/connection-manager';
import {
  DatabaseType,
  DatabaseQueryResult,
  DatabaseConnectionInfo,
  SchemaQueries,
  InfoQueries,
  DataTypeMap
} from '../types/database';

class MySQLDatabase extends DatabaseInterface {
  protected override client: mysql.Connection | null = null;
  protected override type: DatabaseType = 'mysql';

  constructor(connectionString: string) {
    super(connectionString);
  }

  async connect(): Promise<void> {
    ConnectionLogger.logAttempt(this.type);
    
    try {
      const config = this._buildConnectionConfig();
      this.client = await mysql.createConnection(config);

      const connectionInfo = await this._getConnectionInfo();
      ConnectionLogger.logSuccess(this.type, connectionInfo);

      this.isConnected = true;
    } catch (error) {
      ConnectionLogger.logFailure(this.type, (error as Error).message);
      ConnectionErrorHandler.handleError(this.type, error as Error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.end();
      this.isConnected = false;
      this.client = null;
    }
  }

  async query(query: string, params: any[] = []): Promise<DatabaseQueryResult> {
    if (!this.client) {
      throw new Error('Database not connected');
    }

    const [result] = await this.client.execute(query, params) as any[];
    
    return this._standardizeResult(result);
  }

  getType(): DatabaseType {
    return this.type;
  }

  override validateQuery(query: string): string {
    return this._validateMySQLQuery(query);
  }

  getInfoQueries(): InfoQueries {
    return {
      version: "SELECT VERSION() as version",
      size: `
        SELECT 
          ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS database_size_mb
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()
      `,
      settings: `
        SHOW VARIABLES WHERE Variable_name IN (
          'max_connections', 'innodb_buffer_pool_size', 'key_buffer_size',
          'query_cache_size', 'tmp_table_size', 'max_heap_table_size'
        )
      `,
      activity: `
        SELECT 
          STATE,
          COUNT(*) as connection_count
        FROM information_schema.PROCESSLIST 
        WHERE ID != CONNECTION_ID()
        GROUP BY STATE
        ORDER BY connection_count DESC
      `
    };
  }

  getSchemaQueries(): SchemaQueries {
    return {
      listTables: `
        SELECT 
          NULL as schemaname,
          table_name,
          table_type
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
        ORDER BY table_name
      `,
      
      listSchemas: `
        SELECT 
          schema_name,
          NULL as schema_owner,
          CASE 
            WHEN schema_name IN ('information_schema', 'mysql', 'performance_schema', 'sys') 
            THEN 'system'
            ELSE 'user'
          END as schema_type
        FROM information_schema.schemata
        ORDER BY schema_type, schema_name
      `,
      
      describeTable: `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns
        WHERE table_name = ? AND table_schema = DATABASE()
        ORDER BY ordinal_position
      `,
      
      listIndexes: `
        SELECT 
          NULL as schemaname,
          table_name as tablename,
          index_name as indexname,
          CONCAT('CREATE INDEX ', index_name, ' ON ', table_name) as indexdef,
          CASE WHEN non_unique = 0 THEN 'UNIQUE' ELSE 'NON-UNIQUE' END as index_type
        FROM information_schema.statistics
        WHERE table_schema = DATABASE()
        GROUP BY table_name, index_name, non_unique
        ORDER BY table_name, index_name
      `
    };
  }

  override getDataTypeMap(): DataTypeMap {
    return {
      'string': 'VARCHAR',
      'number': 'DECIMAL',
      'integer': 'INT',
      'boolean': 'BOOLEAN',
      'date': 'DATETIME',
      'json': 'JSON',
      'text': 'TEXT'
    };
  }

  // Private methods
  private _buildConnectionConfig(): mysql.ConnectionOptions {
    // Parse the connection string to extract components
    const parsedConfig = this._parseConnectionString(this.connectionString);
    
    const config: mysql.ConnectionOptions = {
      ...parsedConfig,
      connectTimeout: QUERY_LIMITS.CONNECTION_TIMEOUT,
    };

    const sslConfig = SSLConfigManager.getSSLConfig(this.connectionString);
    if (sslConfig) {
      config.ssl = sslConfig;
      SSLConfigManager.logSSLStatus(this.type, sslConfig);
    }

    return config;
  }

  protected async _getConnectionInfo(): Promise<DatabaseConnectionInfo> {
    if (!this.client) {
      throw new Error('Database not connected');
    }

    const [result] = await this.client.execute('SELECT NOW() as current_time, VERSION() as db_version') as any[];
    const { current_time, db_version } = result[0];
    
    return {
      serverTime: current_time,
      version: db_version.split('-')[0]
    };
  }

  private _standardizeResult(result: any): DatabaseQueryResult {
    return {
      rows: Array.isArray(result) ? result : [],
      rowCount: Array.isArray(result) ? result.length : 0,
      command: 'SELECT',
      fields: []
    };
  }

  private _parseConnectionString(connectionString: string): mysql.ConnectionOptions {
    try {
      const url = new URL(connectionString);
      return {
        host: url.hostname,
        port: parseInt(url.port) || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1)
      };
    } catch (error) {
      throw new Error(`Invalid MySQL connection string: ${(error as Error).message}`);
    }
  }

  private _validateMySQLQuery(query: string): string {
    const trimmedQuery = query.trim().toLowerCase();

    if (!trimmedQuery.startsWith('select') &&
        !trimmedQuery.startsWith('with') &&
        !trimmedQuery.startsWith('show') &&
        !trimmedQuery.startsWith('describe') &&
        !trimmedQuery.startsWith('explain')) {
      throw new Error('Only SELECT, WITH, SHOW, DESCRIBE, and EXPLAIN queries are allowed for MySQL');
    }

    const dangerousKeywords = ['drop', 'delete', 'insert', 'update', 'alter', 'create', 'truncate'];
    const hasRiskyKeywords = dangerousKeywords.some(keyword =>
      trimmedQuery.includes(keyword.toLowerCase())
    );

    if (hasRiskyKeywords) {
      throw new Error('Query contains potentially dangerous keywords. Only read operations are allowed.');
    }

    return query;
  }
}

export default MySQLDatabase; 