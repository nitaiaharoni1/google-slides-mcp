/**
 * Advanced PostgreSQL MCP tools
 * Provides PostgreSQL-specific functionality for maintenance, performance, and administration
 */

import { getDatabase, getDatabaseType } from '../database';
import {
  formatSuccessResult,
  formatErrorResult,
} from '../utils/result-formatter';
import { MCPToolDefinition, MCPToolArgs } from '../types/mcp';

// Tool argument interfaces
export interface PostgresMaintenanceArgs extends MCPToolArgs {
  table_name?: string;
  analyze?: boolean;
  verbose?: boolean;
}

export interface PostgresIndexMaintenanceArgs extends MCPToolArgs {
  index_name?: string;
  table_name?: string;
}

export interface PostgresPermissionArgs extends MCPToolArgs {
  grant_type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  object_name: string;
  object_type: 'TABLE' | 'SCHEMA' | 'DATABASE';
  username: string;
}

export interface PostgresCommentArgs extends MCPToolArgs {
  object_type: 'TABLE' | 'COLUMN' | 'INDEX' | 'SCHEMA';
  object_name: string;
  column_name?: string;
  comment: string;
}

export interface PostgresSessionArgs extends MCPToolArgs {
  setting_name: string;
  setting_value: string;
  scope?: 'SESSION' | 'LOCAL';
}

/**
 * Run VACUUM on tables for maintenance
 */
const vacuumTable = async (args: PostgresMaintenanceArgs) => {
  const db = getDatabase();
  const dbType = getDatabaseType();

  if (dbType !== 'postgresql') {
    throw new Error('This tool is only available for PostgreSQL databases');
  }

  if (!db) {
    throw new Error('Database not connected');
  }

  const tableName = args.table_name;
  const analyze = args.analyze || false;
  const verbose = args.verbose || false;

  let query = 'VACUUM';
  if (verbose) query += ' VERBOSE';
  if (analyze) query += ' ANALYZE';
  if (tableName) query += ` ${tableName}`;

  console.error(
    `🔧 Running VACUUM${analyze ? ' ANALYZE' : ''}${verbose ? ' VERBOSE' : ''} ${tableName || 'on all tables'}`,
  );

  const startTime = Date.now();
  const result = await db.query(query);
  const executionTime = Date.now() - startTime;

  console.error(`✅ VACUUM completed in ${executionTime}ms`);

  return formatSuccessResult(
    {
      operation: 'VACUUM',
      table_name: tableName || 'ALL_TABLES',
      analyze_included: analyze,
      verbose_output: verbose,
      execution_time_ms: executionTime,
      message: `VACUUM ${analyze ? 'ANALYZE ' : ''}completed successfully`,
    },
    dbType,
  );
};

/**
 * Run ANALYZE on tables for statistics
 */
const analyzeTable = async (args: PostgresMaintenanceArgs) => {
  const db = getDatabase();
  const dbType = getDatabaseType();

  if (dbType !== 'postgresql') {
    throw new Error('This tool is only available for PostgreSQL databases');
  }

  const tableName = args.table_name;
  const verbose = args.verbose || false;

  let query = 'ANALYZE';
  if (verbose) query += ' VERBOSE';
  if (tableName) query += ` ${tableName}`;

  console.error(
    `📊 Running ANALYZE${verbose ? ' VERBOSE' : ''} ${tableName || 'on all tables'}`,
  );

  const startTime = Date.now();
  const result = await db.query(query);
  const executionTime = Date.now() - startTime;

  console.error(`✅ ANALYZE completed in ${executionTime}ms`);

  return formatSuccessResult(
    {
      operation: 'ANALYZE',
      table_name: tableName || 'ALL_TABLES',
      verbose_output: verbose,
      execution_time_ms: executionTime,
      message: 'Table statistics updated successfully',
    },
    dbType,
  );
};

/**
 * Reindex tables or indexes
 */
const reindexObject = async (args: PostgresIndexMaintenanceArgs) => {
  const db = getDatabase();
  const dbType = getDatabaseType();

  if (dbType !== 'postgresql') {
    throw new Error('This tool is only available for PostgreSQL databases');
  }

  const indexName = args.index_name;
  const tableName = args.table_name;

  if (!indexName && !tableName) {
    throw new Error('Either index_name or table_name must be provided');
  }

  let query = 'REINDEX';
  let objectName = '';

  if (indexName) {
    query += ` INDEX ${indexName}`;
    objectName = indexName;
  } else if (tableName) {
    query += ` TABLE ${tableName}`;
    objectName = tableName;
  }

  console.error(
    `🔄 Reindexing ${indexName ? 'index' : 'table'}: ${objectName}`,
  );

  const startTime = Date.now();
  const result = await db.query(query);
  const executionTime = Date.now() - startTime;

  console.error(`✅ REINDEX completed in ${executionTime}ms`);

  return formatSuccessResult(
    {
      operation: 'REINDEX',
      object_type: indexName ? 'INDEX' : 'TABLE',
      object_name: objectName,
      execution_time_ms: executionTime,
      message: `${indexName ? 'Index' : 'Table'} reindexed successfully`,
    },
    dbType,
  );
};

/**
 * Add comments to database objects
 */
const addComment = async (args: PostgresCommentArgs) => {
  const db = getDatabase();
  const dbType = getDatabaseType();

  if (dbType !== 'postgresql') {
    throw new Error('This tool is only available for PostgreSQL databases');
  }

  const { object_type, object_name, column_name, comment } = args;

  let query = `COMMENT ON ${object_type}`;

  if (object_type === 'COLUMN') {
    if (!column_name) {
      throw new Error('column_name is required when object_type is COLUMN');
    }
    query += ` ${object_name}.${column_name}`;
  } else {
    query += ` ${object_name}`;
  }

  query += ` IS '${comment.replace(/'/g, "''")}'`;

  console.error(
    `💬 Adding comment to ${object_type}: ${object_name}${column_name ? `.${column_name}` : ''}`,
  );

  const result = await db.query(query);

  console.error(`✅ Comment added successfully`);

  return formatSuccessResult(
    {
      operation: 'COMMENT',
      object_type,
      object_name,
      column_name,
      comment,
      message: 'Comment added successfully',
    },
    dbType,
  );
};

/**
 * Manage database permissions
 */
const managePermissions = async (args: PostgresPermissionArgs) => {
  const db = getDatabase();
  const dbType = getDatabaseType();

  if (dbType !== 'postgresql') {
    throw new Error('This tool is only available for PostgreSQL databases');
  }

  const { grant_type, object_name, object_type, username } = args;

  const query = `GRANT ${grant_type} ON ${object_type} ${object_name} TO ${username}`;

  console.error(
    `🔐 Granting ${grant_type} permission on ${object_type} ${object_name} to user ${username}`,
  );

  const result = await db.query(query);

  console.error(`✅ Permission granted successfully`);

  return formatSuccessResult(
    {
      operation: 'GRANT',
      grant_type,
      object_type,
      object_name,
      username,
      message: `${grant_type} permission granted to ${username} on ${object_type} ${object_name}`,
    },
    dbType,
  );
};

/**
 * Configure session settings
 */
const configureSession = async (args: PostgresSessionArgs) => {
  const db = getDatabase();
  const dbType = getDatabaseType();

  if (dbType !== 'postgresql') {
    throw new Error('This tool is only available for PostgreSQL databases');
  }

  const { setting_name, setting_value, scope = 'SESSION' } = args;

  const query = `SET ${scope === 'LOCAL' ? 'LOCAL ' : ''}${setting_name} = '${setting_value}'`;

  console.error(
    `⚙️ Setting ${scope} configuration: ${setting_name} = ${setting_value}`,
  );

  const result = await db.query(query);

  console.error(`✅ Configuration updated successfully`);

  return formatSuccessResult(
    {
      operation: 'SET',
      setting_name,
      setting_value,
      scope,
      message: `${setting_name} set to ${setting_value} for ${scope}`,
    },
    dbType,
  );
};

/**
 * Get current session settings
 */
const getSessionSettings = async () => {
  const db = getDatabase();
  const dbType = getDatabaseType();

  if (dbType !== 'postgresql') {
    throw new Error('This tool is only available for PostgreSQL databases');
  }

  const query = `
        SELECT 
            name,
            setting,
            unit,
            context,
            vartype,
            source,
            min_val,
            max_val,
            short_desc
        FROM pg_settings 
        WHERE context IN ('user', 'superuser')
        ORDER BY name
    `;

  console.error(`📋 Retrieving current session settings`);

  const result = await db.query(query);

  console.error(`✅ Retrieved ${result.rowCount} session settings`);

  return formatSuccessResult(
    {
      operation: 'GET_SETTINGS',
      settings: result.rows,
      rowCount: result.rowCount,
      message: 'Session settings retrieved successfully',
    },
    dbType,
  );
};

/**
 * Get database activity and locks
 */
const getDatabaseActivity = async () => {
  const db = getDatabase();
  const dbType = getDatabaseType();

  if (dbType !== 'postgresql') {
    throw new Error('This tool is only available for PostgreSQL databases');
  }

  const query = `
        SELECT 
            pid,
            usename,
            application_name,
            client_addr,
            state,
            query_start,
            state_change,
            wait_event_type,
            wait_event,
            LEFT(query, 100) as query_preview
        FROM pg_stat_activity 
        WHERE pid != pg_backend_pid()
        AND state IS NOT NULL
        ORDER BY query_start DESC
    `;

  console.error(`🔍 Retrieving database activity`);

  const result = await db.query(query);

  console.error(`✅ Retrieved ${result.rowCount} active connections`);

  return formatSuccessResult(
    {
      operation: 'GET_ACTIVITY',
      active_connections: result.rows,
      rowCount: result.rowCount,
      message: 'Database activity retrieved successfully',
    },
    dbType,
  );
};

/**
 * Get database locks information
 */
const getDatabaseLocks = async () => {
  const db = getDatabase();
  const dbType = getDatabaseType();

  if (dbType !== 'postgresql') {
    throw new Error('This tool is only available for PostgreSQL databases');
  }

  const query = `
        SELECT 
            l.locktype,
            l.database,
            l.relation,
            l.page,
            l.tuple,
            l.virtualxid,
            l.transactionid,
            l.classid,
            l.objid,
            l.objsubid,
            l.virtualtransaction,
            l.pid,
            l.mode,
            l.granted,
            a.usename,
            a.query,
            a.query_start,
            a.state
        FROM pg_locks l
        LEFT JOIN pg_stat_activity a ON l.pid = a.pid
        WHERE l.granted = false
        ORDER BY l.pid
    `;

  console.error(`🔒 Retrieving database locks`);

  const result = await db.query(query);

  console.error(`✅ Retrieved ${result.rowCount} lock entries`);

  return formatSuccessResult(
    {
      operation: 'GET_LOCKS',
      locks: result.rows,
      rowCount: result.rowCount,
      message: 'Database locks retrieved successfully',
    },
    dbType,
  );
};

/**
 * Get table statistics and sizes
 */
const getTableStatistics = async () => {
  const db = getDatabase();
  const dbType = getDatabaseType();

  if (dbType !== 'postgresql') {
    throw new Error('This tool is only available for PostgreSQL databases');
  }

  const query = `
        SELECT 
            schemaname,
            tablename,
            attname,
            n_distinct,
            correlation,
            most_common_vals,
            most_common_freqs,
            histogram_bounds
        FROM pg_stats
        WHERE schemaname = 'public'
        ORDER BY schemaname, tablename, attname
    `;

  console.error(`📊 Retrieving table statistics`);

  const result = await db.query(query);

  console.error(`✅ Retrieved statistics for ${result.rowCount} columns`);

  return formatSuccessResult(
    {
      operation: 'GET_TABLE_STATS',
      statistics: result.rows,
      rowCount: result.rowCount,
      message: 'Table statistics retrieved successfully',
    },
    dbType,
  );
};

/**
 * Get slow queries from pg_stat_statements
 */
const getSlowQueries = async (args: { limit?: number }) => {
  const db = getDatabase();
  const dbType = getDatabaseType();

  if (dbType !== 'postgresql') {
    throw new Error('This tool is only available for PostgreSQL databases');
  }

  const limit = args.limit || 10;

  // Check if pg_stat_statements extension is available
  const extensionCheck = await db.query(`
        SELECT EXISTS(
            SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
        ) as extension_exists
    `);

  if (!extensionCheck.rows[0].extension_exists) {
    throw new Error(
      'pg_stat_statements extension is not installed. Please install it first: CREATE EXTENSION pg_stat_statements;',
    );
  }

  const query = `
        SELECT 
            query,
            calls,
            total_time,
            mean_time,
            stddev_time,
            rows,
            100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
        FROM pg_stat_statements
        ORDER BY total_time DESC
        LIMIT $1
    `;

  console.error(`🐌 Retrieving top ${limit} slow queries`);

  const result = await db.query(query, [limit]);

  console.error(`✅ Retrieved ${result.rowCount} slow queries`);

  return formatSuccessResult(
    {
      operation: 'GET_SLOW_QUERIES',
      queries: result.rows,
      rowCount: result.rowCount,
      limit: limit,
      message: 'Slow queries retrieved successfully',
    },
    dbType,
  );
};

/**
 * Get database bloat information
 */
const getDatabaseBloat = async () => {
  const db = getDatabase();
  const dbType = getDatabaseType();

  if (dbType !== 'postgresql') {
    throw new Error('This tool is only available for PostgreSQL databases');
  }

  const query = `
        SELECT 
            schemaname,
            tablename,
            attname,
            n_distinct,
            correlation,
            most_common_vals
        FROM pg_stats
        WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
        AND n_distinct > 100
        ORDER BY n_distinct DESC
        LIMIT 20
    `;

  console.error(`💾 Analyzing database bloat`);

  const result = await db.query(query);

  console.error(
    `✅ Analyzed bloat for ${result.rowCount} high-cardinality columns`,
  );

  return formatSuccessResult(
    {
      operation: 'GET_BLOAT_ANALYSIS',
      bloat_analysis: result.rows,
      rowCount: result.rowCount,
      message: 'Database bloat analysis completed',
    },
    dbType,
  );
};

// Tool definitions
export const postgresAdvancedTools: MCPToolDefinition[] = [
  {
    name: 'postgres_vacuum_table',
    description:
      'Run VACUUM on PostgreSQL tables for maintenance. Can include ANALYZE for statistics update and VERBOSE for detailed output.',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description:
            'Name of the table to vacuum (optional, vacuums all tables if not specified)',
        },
        analyze: {
          type: 'boolean',
          description:
            'Whether to run ANALYZE along with VACUUM to update statistics',
          default: false,
        },
        verbose: {
          type: 'boolean',
          description: 'Whether to output detailed vacuum information',
          default: false,
        },
      },
    },
    handler: vacuumTable,
  },
  {
    name: 'postgres_analyze_table',
    description:
      'Run ANALYZE on PostgreSQL tables to update query planner statistics.',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description:
            'Name of the table to analyze (optional, analyzes all tables if not specified)',
        },
        verbose: {
          type: 'boolean',
          description: 'Whether to output detailed analyze information',
          default: false,
        },
      },
    },
    handler: analyzeTable,
  },
  {
    name: 'postgres_reindex',
    description:
      'Rebuild PostgreSQL indexes to improve performance and reclaim space.',
    inputSchema: {
      type: 'object',
      properties: {
        index_name: {
          type: 'string',
          description: 'Name of the specific index to reindex',
        },
        table_name: {
          type: 'string',
          description: 'Name of the table to reindex all indexes for',
        },
      },
    },
    handler: reindexObject,
  },
  {
    name: 'postgres_add_comment',
    description:
      'Add comments to PostgreSQL database objects (tables, columns, indexes, schemas).',
    inputSchema: {
      type: 'object',
      properties: {
        object_type: {
          type: 'string',
          enum: ['TABLE', 'COLUMN', 'INDEX', 'SCHEMA'],
          description: 'Type of database object to comment on',
        },
        object_name: {
          type: 'string',
          description: 'Name of the database object',
        },
        column_name: {
          type: 'string',
          description:
            'Name of the column (required when object_type is COLUMN)',
        },
        comment: {
          type: 'string',
          description: 'Comment text to add',
        },
      },
      required: ['object_type', 'object_name', 'comment'],
    },
    handler: addComment,
  },
  {
    name: 'postgres_grant_permission',
    description: 'Grant permissions on PostgreSQL database objects to users.',
    inputSchema: {
      type: 'object',
      properties: {
        grant_type: {
          type: 'string',
          enum: ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'ALL'],
          description: 'Type of permission to grant',
        },
        object_name: {
          type: 'string',
          description: 'Name of the database object',
        },
        object_type: {
          type: 'string',
          enum: ['TABLE', 'SCHEMA', 'DATABASE'],
          description: 'Type of database object',
        },
        username: {
          type: 'string',
          description: 'Username to grant permission to',
        },
      },
      required: ['grant_type', 'object_name', 'object_type', 'username'],
    },
    handler: managePermissions,
  },
  {
    name: 'postgres_configure_session',
    description: 'Configure PostgreSQL session settings.',
    inputSchema: {
      type: 'object',
      properties: {
        setting_name: {
          type: 'string',
          description:
            'Name of the setting to configure (e.g., work_mem, random_page_cost)',
        },
        setting_value: {
          type: 'string',
          description: 'Value to set',
        },
        scope: {
          type: 'string',
          enum: ['SESSION', 'LOCAL'],
          description:
            'Scope of the setting (SESSION or LOCAL to current transaction)',
          default: 'SESSION',
        },
      },
      required: ['setting_name', 'setting_value'],
    },
    handler: configureSession,
  },
  {
    name: 'postgres_get_session_settings',
    description: 'Get current PostgreSQL session configuration settings.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: getSessionSettings,
  },
  {
    name: 'postgres_get_activity',
    description:
      'Get current PostgreSQL database activity including active connections and running queries.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: getDatabaseActivity,
  },
  {
    name: 'postgres_get_locks',
    description:
      'Get current PostgreSQL database locks information to identify blocking queries.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: getDatabaseLocks,
  },
  {
    name: 'postgres_get_table_stats',
    description:
      'Get detailed PostgreSQL table statistics including column distributions and correlations.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: getTableStatistics,
  },
  {
    name: 'postgres_get_slow_queries',
    description:
      'Get slow queries from pg_stat_statements extension (requires pg_stat_statements to be installed).',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
          description: 'Maximum number of slow queries to return',
          default: 10,
        },
      },
    },
    handler: getSlowQueries,
  },
  {
    name: 'postgres_get_bloat_analysis',
    description:
      'Analyze PostgreSQL database bloat by examining high-cardinality columns and table statistics.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: getDatabaseBloat,
  },
];
