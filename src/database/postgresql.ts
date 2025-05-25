/**
 * PostgreSQL Database Implementation
 */

import { Client, ClientConfig } from 'pg';
import DatabaseInterface from './base';
import { QUERY_LIMITS } from '../config/constants';
import { SSLConfigManager, ConnectionErrorHandler, ConnectionLogger } from '../utils/connection-manager';
import {
  DatabaseType,
  DatabaseQueryResult,
  DatabaseConnectionInfo,
  SchemaQueries,
  InfoQueries,
  DataTypeMap,
  DatabaseConfig
} from '../types/database';

class PostgreSQLDatabase extends DatabaseInterface {
  protected override client: Client | null = null;
  protected override type: DatabaseType = 'postgresql';

  constructor(connectionString: string) {
    super(connectionString);
  }

  async connect(): Promise<void> {
    ConnectionLogger.logAttempt(this.type);
    
    try {
      const config = this._buildConnectionConfig();
      this.client = new Client(config);
      await this.client.connect();

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

    const result = await this.client.query(query, params);
    
    return this._standardizeResult(result);
  }

  getType(): DatabaseType {
    return this.type;
  }

  override validateQuery(query: string): string {
    return this._validatePostgreSQLQuery(query);
  }

  getInfoQueries(): InfoQueries {
    return {
      version: "SELECT version() as version",
      size: "SELECT pg_size_pretty(pg_database_size(current_database())) as database_size",
      settings: `
        SELECT name, setting, unit, short_desc 
        FROM pg_settings 
        WHERE name IN (
          'max_connections', 'shared_buffers', 'effective_cache_size',
          'maintenance_work_mem', 'checkpoint_completion_target',
          'wal_buffers', 'default_statistics_target'
        )
        ORDER BY name
      `,
      activity: `
        SELECT 
          state,
          COUNT(*) as connection_count
        FROM pg_stat_activity 
        WHERE pid != pg_backend_pid()
        GROUP BY state
        ORDER BY connection_count DESC
      `
    };
  }

  getSchemaQueries(): SchemaQueries {
    return {
      listTables: `
        SELECT schemaname,
               tablename as table_name,
               'BASE TABLE' as table_type
        FROM pg_tables
        WHERE schemaname = 'public'
        
        UNION ALL
        
        SELECT schemaname,
               viewname as table_name,
               'VIEW' as table_type
        FROM pg_views
        WHERE schemaname = 'public'
        
        ORDER BY table_name
      `,
      
      listSchemas: `
        SELECT schema_name,
               schema_owner,
               CASE 
                 WHEN schema_name IN ('information_schema', 'pg_catalog', 'pg_toast') 
                 THEN 'system'
                 ELSE 'user'
               END as schema_type
        FROM information_schema.schemata
        ORDER BY schema_type, schema_name
      `,
      
      describeTable: `
        SELECT column_name,
               data_type,
               is_nullable,
               column_default,
               character_maximum_length,
               numeric_precision,
               numeric_scale
        FROM information_schema.columns
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `,
      
      listIndexes: `
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef,
          CASE WHEN indisunique THEN 'UNIQUE' ELSE 'NON-UNIQUE' END as index_type
        FROM pg_indexes 
        LEFT JOIN pg_class c ON c.relname = indexname
        LEFT JOIN pg_index i ON i.indexrelid = c.oid
      `
    };
  }

  override getDataTypeMap(): DataTypeMap {
    return {
      'string': 'TEXT',
      'number': 'NUMERIC',
      'integer': 'INTEGER',
      'boolean': 'BOOLEAN',
      'date': 'TIMESTAMP',
      'json': 'JSONB',
      'uuid': 'UUID'
    };
  }

  // Private methods for single responsibility
  private _buildConnectionConfig(): ClientConfig {
    const config: ClientConfig = {
      connectionString: this.connectionString,
      connectionTimeoutMillis: QUERY_LIMITS.CONNECTION_TIMEOUT,
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

    const result = await this.client.query('SELECT NOW() as current_time, version() as db_version');
    const { current_time, db_version } = result.rows[0];
    
    return {
      serverTime: current_time,
      version: db_version.split(',')[0]
    };
  }

  private _standardizeResult(result: any): DatabaseQueryResult {
    return {
      rows: result.rows,
      rowCount: result.rowCount,
      command: result.command,
      fields: result.fields
    };
  }

  private _validatePostgreSQLQuery(query: string): string {
    const trimmedQuery = query.trim().toLowerCase();

    if (!trimmedQuery.startsWith('select') &&
        !trimmedQuery.startsWith('with') &&
        !trimmedQuery.startsWith('show') &&
        !trimmedQuery.startsWith('explain')) {
      throw new Error('Only SELECT, WITH, SHOW, and EXPLAIN queries are allowed for PostgreSQL');
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

export default PostgreSQLDatabase; 