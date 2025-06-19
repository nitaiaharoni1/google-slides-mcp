/**
 * PostgreSQL Database Implementation
 */

import { Client, ClientConfig } from 'pg';
import DatabaseInterface from './base';
import { QUERY_LIMITS } from '../config/constants';
import {
  SSLConfigManager,
  ConnectionErrorHandler,
  ConnectionLogger,
} from '../utils/connection-manager';
import {
  DatabaseType,
  DatabaseQueryResult,
  DatabaseConnectionInfo,
  SchemaQueries,
  InfoQueries,
  DataTypeMap,
  DatabaseConfig,
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

      // Debug logging
      if (process.env.NODE_ENV === 'test') {
        console.error(`🔍 PostgreSQL Connection Debug:`);
        console.error(
          `   - Connection String: ${this.connectionString.replace(/:[^:@]*@/, ':***@')}`,
        );
        console.error(`   - Config:`, JSON.stringify(config, null, 2));
      }

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
      version: 'SELECT version() as version',
      size: 'SELECT pg_size_pretty(pg_database_size(current_database())) as database_size',
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
      `,
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
      `,
    };
  }

  override getDataTypeMap(): DataTypeMap {
    return {
      string: 'TEXT',
      number: 'NUMERIC',
      integer: 'INTEGER',
      boolean: 'BOOLEAN',
      date: 'TIMESTAMP',
      json: 'JSONB',
      uuid: 'UUID',
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
    } else {
      SSLConfigManager.logSSLStatus(this.type, false);
    }

    return config;
  }

  protected async _getConnectionInfo(): Promise<DatabaseConnectionInfo> {
    if (!this.client) {
      throw new Error('Database not connected');
    }

    const result = await this.client.query(
      'SELECT NOW() as current_time, version() as db_version',
    );
    const { current_time, db_version } = result.rows[0];

    return {
      serverTime: current_time,
      version: db_version.split(',')[0],
    };
  }

  private _standardizeResult(result: any): DatabaseQueryResult {
    return {
      rows: result.rows,
      rowCount: result.rowCount,
      command: result.command,
      fields: result.fields,
    };
  }

  private _validatePostgreSQLQuery(query: string): string {
    const trimmedQuery = query.trim().toLowerCase();

    // Allow read operations
    const allowedReadStarts = [
      'select',
      'with',
      'show',
      'explain',
      'describe',
      'desc',
    ];

    // Allow write operations (non-destructive)
    const allowedWriteStarts = ['insert', 'update', 'alter', 'create'];

    // Allow PostgreSQL-specific operations
    const allowedPGSpecificStarts = [
      'vacuum',
      'analyze',
      'reindex',
      'cluster',
      'comment',
      'grant',
      'revoke',
      'copy',
      'listen',
      'notify',
      'unlisten',
      'prepare',
      'execute',
      'deallocate',
      'begin',
      'commit',
      'rollback',
      'savepoint',
      'release',
      'set',
      'reset',
      'discard',
    ];

    // Allow utility operations
    const allowedUtilityStarts = ['refresh', 'checkpoint', 'load'];

    const allAllowedStarts = [
      ...allowedReadStarts,
      ...allowedWriteStarts,
      ...allowedPGSpecificStarts,
      ...allowedUtilityStarts,
    ];

    const isAllowedOperation = allAllowedStarts.some((keyword) =>
      trimmedQuery.startsWith(keyword),
    );

    if (!isAllowedOperation) {
      throw new Error(
        `Operation not allowed. Supported operations: ${allAllowedStarts.join(', ').toUpperCase()}`,
      );
    }

    // Block destructive operations (but allow them in specific contexts)
    const destructivePatterns = [
      /\bdrop\s+(table|database|schema|index|view|function|procedure|trigger)\b/i,
      /\bdelete\s+from\b/i,
      /\btruncate\s+table\b/i,
    ];

    const hasDestructivePattern = destructivePatterns.some((pattern) =>
      pattern.test(trimmedQuery),
    );

    if (hasDestructivePattern) {
      throw new Error(
        'Destructive operations (DROP TABLE/DATABASE/SCHEMA, DELETE FROM, TRUNCATE TABLE) are blocked for safety. Use specific admin tools if needed.',
      );
    }

    return query;
  }
}

export default PostgreSQLDatabase;
