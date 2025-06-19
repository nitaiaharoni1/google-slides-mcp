/**
 * Snowflake Database Implementation
 */

import * as snowflake from 'snowflake-sdk';
import DatabaseInterface from './base';
import { QUERY_LIMITS } from '../config/constants';
import {
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
} from '../types/database';

class SnowflakeDatabase extends DatabaseInterface {
  protected override client: snowflake.Connection | null = null;
  protected override type: DatabaseType = 'snowflake';
  private connectionConfig: any = null;

  constructor(connectionString: string) {
    super(connectionString);
    this.connectionConfig = this._parseConnectionString(connectionString);
  }

  async connect(): Promise<void> {
    ConnectionLogger.logAttempt(this.type);

    try {
      const config = this._buildConnectionConfig();

      // Debug logging
      if (process.env.NODE_ENV === 'test') {
        console.error(`🔍 Snowflake Connection Debug:`);
        console.error(`   - Account: ${config.account}`);
        console.error(`   - Username: ${config.username}`);
        console.error(`   - Database: ${config.database || 'default'}`);
        console.error(`   - Warehouse: ${config.warehouse || 'default'}`);
      }

      this.client = snowflake.createConnection(config);

      await new Promise<void>((resolve, reject) => {
        this.client!.connect((err: any, conn: any) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

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
      await new Promise<void>((resolve) => {
        this.client!.destroy((err: any, conn: any) => {
          // Always resolve, even if there's an error during destruction
          resolve();
        });
      });
      this.isConnected = false;
      this.client = null;
    }
  }

  async query(query: string, params: any[] = []): Promise<DatabaseQueryResult> {
    if (!this.client) {
      throw new Error('Database not connected');
    }

    return new Promise((resolve, reject) => {
      this.client!.execute({
        sqlText: query,
        binds: params,
        complete: (err: any, stmt: any, rows?: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(this._standardizeResult(stmt, rows || []));
          }
        },
      });
    });
  }

  getType(): DatabaseType {
    return this.type;
  }

  override validateQuery(query: string): string {
    return this._validateSnowflakeQuery(query);
  }

  getInfoQueries(): InfoQueries {
    return {
      version: 'SELECT CURRENT_VERSION() as version',
      size: `
        SELECT 
          SUM(BYTES) / (1024*1024*1024) as database_size_gb,
          COUNT(*) as table_count
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = CURRENT_SCHEMA()
      `,
      settings: `
        SHOW PARAMETERS LIKE '%WAREHOUSE%'
      `,
      activity: `
        SELECT 
          QUERY_TYPE,
          COUNT(*) as query_count
        FROM INFORMATION_SCHEMA.QUERY_HISTORY 
        WHERE START_TIME >= DATEADD(hour, -1, CURRENT_TIMESTAMP())
        GROUP BY QUERY_TYPE
        ORDER BY query_count DESC
        LIMIT 10
      `,
    };
  }

  getSchemaQueries(): SchemaQueries {
    return {
      listTables: `
        SELECT 
          TABLE_SCHEMA as schemaname,
          TABLE_NAME as table_name,
          TABLE_TYPE as table_type
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = CURRENT_SCHEMA()
        ORDER BY TABLE_NAME
      `,

      listSchemas: `
        SELECT 
          SCHEMA_NAME as schema_name,
          SCHEMA_OWNER as schema_owner,
          CASE 
            WHEN SCHEMA_NAME IN ('INFORMATION_SCHEMA') 
            THEN 'system'
            ELSE 'user'
          END as schema_type
        FROM INFORMATION_SCHEMA.SCHEMATA
        WHERE CATALOG_NAME = CURRENT_DATABASE()
        ORDER BY schema_type, SCHEMA_NAME
      `,

      describeTable: `
        SELECT 
          COLUMN_NAME as column_name,
          DATA_TYPE as data_type,
          IS_NULLABLE as is_nullable,
          COLUMN_DEFAULT as column_default,
          CHARACTER_MAXIMUM_LENGTH as character_maximum_length,
          NUMERIC_PRECISION as numeric_precision,
          NUMERIC_SCALE as numeric_scale
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = ? 
          AND TABLE_SCHEMA = CURRENT_SCHEMA()
        ORDER BY ORDINAL_POSITION
      `,

      listIndexes: `
        SELECT 
          TABLE_SCHEMA as schemaname,
          TABLE_NAME as tablename,
          'N/A' as indexname,
          'Snowflake uses automatic clustering' as indexdef,
          'CLUSTERING' as index_type
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = CURRENT_SCHEMA()
          AND TABLE_TYPE = 'BASE TABLE'
      `,
    };
  }

  override getDataTypeMap(): DataTypeMap {
    return {
      string: 'VARCHAR',
      number: 'NUMBER',
      integer: 'INTEGER',
      boolean: 'BOOLEAN',
      date: 'TIMESTAMP_NTZ',
      json: 'VARIANT',
      array: 'ARRAY',
      object: 'OBJECT',
    };
  }

  // Private methods for single responsibility
  private _parseConnectionString(connectionString: string): any {
    // Handle different Snowflake connection string formats
    if (connectionString.startsWith('snowflake://')) {
      // Parse snowflake:// URL format
      const url = new URL(connectionString);
      return {
        account: url.hostname.replace('.snowflakecomputing.com', ''),
        username: url.username,
        password: url.password,
        database: url.pathname.slice(1).split('/')[0] || undefined,
        schema: url.pathname.slice(1).split('/')[1] || undefined,
        warehouse: url.searchParams.get('warehouse') || undefined,
        role: url.searchParams.get('role') || undefined,
      };
    } else if (connectionString.includes('.snowflakecomputing.com')) {
      // Handle account.snowflakecomputing.com format
      // This is a simplified parser - in production you might want more robust parsing
      throw new Error(
        'Please use snowflake:// URL format for connection string',
      );
    } else {
      // Try to parse as JSON configuration
      try {
        return JSON.parse(connectionString);
      } catch {
        throw new Error(
          'Invalid Snowflake connection string format. Use snowflake://username:password@account.snowflakecomputing.com/database/schema?warehouse=wh&role=role',
        );
      }
    }
  }

  private _buildConnectionConfig(): any {
    const config: any = {
      account: this.connectionConfig.account,
      username: this.connectionConfig.username,
      password: this.connectionConfig.password,
      timeout: QUERY_LIMITS.CONNECTION_TIMEOUT,
      clientSessionKeepAlive: true,
      clientSessionKeepAliveHeartbeatFrequency: 3600,
    };

    // Optional parameters
    if (this.connectionConfig.database) {
      config.database = this.connectionConfig.database;
    }
    if (this.connectionConfig.schema) {
      config.schema = this.connectionConfig.schema;
    }
    if (this.connectionConfig.warehouse) {
      config.warehouse = this.connectionConfig.warehouse;
    }
    if (this.connectionConfig.role) {
      config.role = this.connectionConfig.role;
    }

    return config;
  }

  protected async _getConnectionInfo(): Promise<DatabaseConnectionInfo> {
    if (!this.client) {
      throw new Error('Database not connected');
    }

    try {
      const result = await this.query(
        'SELECT CURRENT_VERSION() as version, CURRENT_TIMESTAMP() as server_time',
      );
      return {
        version: result.rows[0]?.version || 'Unknown',
        serverTime: result.rows[0]?.server_time || new Date().toISOString(),
      };
    } catch (error) {
      return {
        version: 'Unknown',
        serverTime: new Date().toISOString(),
      };
    }
  }

  private _standardizeResult(stmt: any, rows: any[]): DatabaseQueryResult {
    return {
      rows: rows || [],
      rowCount: rows ? rows.length : 0,
      command: stmt.getSqlText() || 'UNKNOWN',
      fields: stmt.getColumns() || [],
    };
  }

  private _validateSnowflakeQuery(query: string): string {
    // Call parent validation first
    const baseValidated = super.validateQuery(query);

    const trimmedQuery = baseValidated.trim().toLowerCase();

    // Snowflake-specific validations
    if (trimmedQuery.includes('put ') || trimmedQuery.includes('get ')) {
      throw new Error(
        'PUT and GET commands are not allowed for security reasons',
      );
    }

    if (trimmedQuery.includes('copy into')) {
      throw new Error(
        'COPY INTO commands are not allowed for security reasons',
      );
    }

    return baseValidated;
  }
}

export default SnowflakeDatabase;
