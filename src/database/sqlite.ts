/**
 * SQLite Database Implementation
 */

import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import DatabaseInterface from './base';
import { ConnectionLogger, ConnectionErrorHandler } from '../utils/connection-manager';
import {
  DatabaseType,
  DatabaseQueryResult,
  DatabaseConnectionInfo,
  SchemaQueries,
  InfoQueries,
  DataTypeMap
} from '../types/database';

class SQLiteDatabase extends DatabaseInterface {
  protected override client: sqlite3.Database | null = null;
  protected override type: DatabaseType = 'sqlite';
  private filePath: string;

  constructor(connectionString: string) {
    super(connectionString);
    this.filePath = this._parseConnectionString(connectionString);
  }

  async connect(): Promise<void> {
    ConnectionLogger.logAttempt(this.type);
    
    try {
      await this._ensureDirectoryExists();
      
      this.client = new sqlite3.Database(this.filePath);
      
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
      return new Promise((resolve, reject) => {
        this.client!.close((err) => {
          if (err) {
            reject(err);
          } else {
            this.isConnected = false;
            this.client = null;
            resolve();
          }
        });
      });
    }
  }

  async query(query: string, params: any[] = []): Promise<DatabaseQueryResult> {
    if (!this.client) {
      throw new Error('Database not connected');
    }

    return new Promise((resolve, reject) => {
      this.client!.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(this._standardizeResult(rows || []));
        }
      });
    });
  }

  getType(): DatabaseType {
    return this.type;
  }

  override validateQuery(query: string): string {
    return this._validateSQLiteQuery(query);
  }

  getInfoQueries(): InfoQueries {
    return {
      version: "SELECT sqlite_version() as version",
      size: "SELECT page_count * page_size as database_size FROM pragma_page_count(), pragma_page_size()",
      settings: `
        PRAGMA compile_options;
      `,
      activity: "SELECT 'no_activity_tracking' as status"
    };
  }

  getSchemaQueries(): SchemaQueries {
    return {
      listTables: `
        SELECT name as table_name, 
               type as table_type
        FROM sqlite_master 
        WHERE type IN ('table', 'view')
        AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `,
      
      listSchemas: `
        SELECT 'main' as schema_name,
               '' as schema_owner,
               'default' as schema_type
      `,
      
      describeTable: `
        PRAGMA table_info(?)
      `,
      
      listIndexes: `
        SELECT name as indexname,
               tbl_name as tablename,
               sql as indexdef,
               'INDEX' as index_type
        FROM sqlite_master 
        WHERE type = 'index' 
        AND tbl_name = ?
        ORDER BY name
      `
    };
  }

  override getDataTypeMap(): DataTypeMap {
    return {
      'string': 'TEXT',
      'number': 'REAL',
      'integer': 'INTEGER',
      'boolean': 'INTEGER',
      'date': 'TEXT',
      'json': 'TEXT'
    };
  }

  protected async _getConnectionInfo(): Promise<DatabaseConnectionInfo> {
    return {
      filePath: this.filePath,
      version: '3.x.x' // Default version, could query for actual
    };
  }

  private _parseConnectionString(connectionString: string): string {
    let cleanPath = connectionString;
    
    // Remove sqlite:// or sqlite: prefixes
    cleanPath = cleanPath.replace(/^sqlite:\/\//, '').replace(/^sqlite:/, '');
    
    // If it's a relative path, resolve it
    if (!path.isAbsolute(cleanPath)) {
      cleanPath = path.resolve(process.cwd(), cleanPath);
    }
    
    return cleanPath;
  }

  private async _ensureDirectoryExists(): Promise<void> {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
  }

  private _standardizeResult(rows: any[]): DatabaseQueryResult {
    return {
      rows: rows,
      rowCount: rows.length,
      command: 'SELECT',
      fields: []
    };
  }

  private _validateSQLiteQuery(query: string): string {
    const trimmedQuery = query.trim().toLowerCase();

    if (!trimmedQuery.startsWith('select') &&
        !trimmedQuery.startsWith('with') &&
        !trimmedQuery.startsWith('pragma') &&
        !trimmedQuery.startsWith('explain')) {
      throw new Error('Only SELECT, WITH, PRAGMA, and EXPLAIN queries are allowed for SQLite');
    }

    const dangerousKeywords = ['drop', 'delete', 'insert', 'update', 'alter', 'create'];
    const hasRiskyKeywords = dangerousKeywords.some(keyword =>
      trimmedQuery.includes(keyword.toLowerCase())
    );

    if (hasRiskyKeywords) {
      throw new Error('Query contains potentially dangerous keywords. Only read operations are allowed.');
    }

    return query;
  }
}

export default SQLiteDatabase; 