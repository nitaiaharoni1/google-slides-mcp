/**
 * Query-related MCP tools
 * Supports PostgreSQL, MySQL, and SQLite databases
 */

import { getDatabase, getDatabaseType } from '../database';
import { QUERY_LIMITS } from '../config/constants';
import {
  formatQueryResult,
  formatExplainResult,
  formatErrorResult,
} from '../utils/result-formatter';
import { QueryBuilder, ExplainResultParser } from '../utils/query-builder';
import {
  MCPToolDefinition,
  QueryDatabaseArgs,
  ExplainQueryArgs,
} from '../types/mcp';

/**
 * Execute a SQL query on the database
 */
const queryDatabase = async (args: QueryDatabaseArgs) => {
  const db = getDatabase();
  if (!db) {
    throw new Error('Database not connected');
  }

  const query = db.validateQuery(args.query);
  const dbType = getDatabaseType();

  console.error(
    `🔍 Executing ${dbType?.toUpperCase()} query: ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`,
  );

  const startTime = Date.now();
  const result = await db.query(query);
  const executionTime = Date.now() - startTime;

  console.error(
    `✅ Query executed in ${executionTime}ms, returned ${result.rowCount} rows`,
  );

  return formatQueryResult(
    result,
    executionTime,
    dbType!,
    QUERY_LIMITS.MAX_ROWS,
  );
};

/**
 * Get the execution plan for a SQL query
 */
const explainQuery = async (args: ExplainQueryArgs) => {
  const db = getDatabase();
  if (!db) {
    throw new Error('Database not connected');
  }

  const query = db.validateQuery(args.query);
  const analyze = args.analyze || false;
  const dbType = getDatabaseType();

  console.error(
    `🔍 Explaining ${dbType?.toUpperCase()} query${analyze ? ' with analysis' : ''}: ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`,
  );

  const explainQuery = QueryBuilder.buildExplainQuery(dbType!, query, analyze);
  const result = await db.query(explainQuery);

  console.error(`✅ Query plan generated`);

  const executionPlan = ExplainResultParser.parseExplainResult(
    dbType!,
    result.rows,
  );
  const wasAnalyzed = analyze && dbType !== 'sqlite';

  return formatExplainResult(query, executionPlan, wasAnalyzed, dbType!);
};

// Tool definitions
export const queryTools: MCPToolDefinition[] = [
  {
    name: 'query_database',
    description:
      'Execute a SQL query on the database. Supports PostgreSQL, MySQL, and SQLite. Allows SELECT, INSERT, UPDATE, ALTER, and CREATE operations. Destructive operations (DROP, DELETE, TRUNCATE) are blocked for safety.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'SQL query to execute (SELECT, INSERT, UPDATE, ALTER, CREATE statements allowed)',
        },
      },
      required: ['query'],
    },
    handler: queryDatabase,
  },
  {
    name: 'explain_query',
    description:
      'Get the execution plan for a SQL query without executing it. Supports PostgreSQL, MySQL, and SQLite.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'SQL query to explain (SELECT, INSERT, UPDATE, ALTER, CREATE statements allowed)',
        },
        analyze: {
          type: 'boolean',
          description:
            'Whether to include actual execution statistics (WARNING: this executes the query). Not supported for SQLite.',
          default: false,
        },
      },
      required: ['query'],
    },
    handler: explainQuery,
  },
];
