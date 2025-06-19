/**
 * PostgreSQL System Catalog MCP tools
 * Provides advanced PostgreSQL-specific introspection capabilities
 */

import { getDatabase, getDatabaseType } from '../database';
import {
  formatSuccessResult,
  formatErrorResult,
} from '../utils/result-formatter';
import { MCPToolDefinition, MCPToolArgs } from '../types/mcp';

// Tool argument interfaces
export interface PostgresCatalogQueryArgs extends MCPToolArgs {
  query: string;
}

/**
 * Execute PostgreSQL system catalog queries
 * Supports advanced PostgreSQL-specific queries for constraints, indexes, and metadata
 */
const executePostgresCatalogQuery = async (args: PostgresCatalogQueryArgs) => {
  const db = getDatabase();
  const dbType = getDatabaseType();

  if (dbType !== 'postgresql') {
    throw new Error('This tool is only available for PostgreSQL databases');
  }

  if (!db) {
    throw new Error('Database not connected');
  }

  const query = args.query.trim();

  // Validate that this is a safe read-only query
  if (!_isValidCatalogQuery(query)) {
    throw new Error(
      'Only SELECT queries on PostgreSQL system catalogs are allowed',
    );
  }

  console.error(
    `🔍 Executing PostgreSQL catalog query: ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`,
  );

  const startTime = Date.now();
  const result = await db.query(query);
  const executionTime = Date.now() - startTime;

  console.error(
    `✅ Catalog query executed in ${executionTime}ms, returned ${result.rowCount} rows`,
  );

  return formatSuccessResult(
    {
      query: query,
      rows: result.rows,
      rowCount: result.rowCount,
      executionTimeMs: executionTime,
      databaseType: dbType,
    },
    dbType,
  );
};

/**
 * Get table constraints information
 */
const getTableConstraints = async (args: { table_name: string }) => {
  const db = getDatabase();
  const dbType = getDatabaseType();

  if (dbType !== 'postgresql') {
    throw new Error('This tool is only available for PostgreSQL databases');
  }

  const tableName = args.table_name;

  const query = `
        SELECT 
            conname as constraint_name,
            contype as constraint_type,
            pg_get_constraintdef(oid) as constraint_definition,
            CASE contype
                WHEN 'c' THEN 'CHECK'
                WHEN 'f' THEN 'FOREIGN KEY'
                WHEN 'p' THEN 'PRIMARY KEY'
                WHEN 'u' THEN 'UNIQUE'
                WHEN 'x' THEN 'EXCLUDE'
                ELSE contype::text
            END as constraint_type_desc
        FROM pg_constraint 
        WHERE conrelid = $1::regclass
        ORDER BY conname;
    `;

  console.error(`🔍 Getting constraints for table: ${tableName}`);

  const result = await db.query(query, [tableName]);

  console.error(
    `✅ Found ${result.rowCount} constraints for table '${tableName}'`,
  );

  return formatSuccessResult(
    {
      table_name: tableName,
      constraints: result.rows,
      rowCount: result.rowCount,
      databaseType: dbType,
    },
    dbType,
  );
};

/**
 * Get table indexes information
 */
const getTableIndexes = async (args: { table_name: string }) => {
  const db = getDatabase();
  const dbType = getDatabaseType();

  if (dbType !== 'postgresql') {
    throw new Error('This tool is only available for PostgreSQL databases');
  }

  const tableName = args.table_name;

  const query = `
        SELECT 
            schemaname,
            tablename,
            indexname,
            indexdef,
            CASE 
                WHEN indexdef LIKE '%UNIQUE%' THEN 'UNIQUE'
                WHEN indexdef LIKE '%PRIMARY KEY%' THEN 'PRIMARY KEY'
                ELSE 'INDEX'
            END as index_type,
            CASE 
                WHEN indexdef LIKE '%WHERE%' THEN 'PARTIAL'
                ELSE 'FULL'
            END as index_scope
        FROM pg_indexes 
        WHERE tablename = $1
        ORDER BY indexname;
    `;

  console.error(`🔍 Getting indexes for table: ${tableName}`);

  const result = await db.query(query, [tableName]);

  console.error(`✅ Found ${result.rowCount} indexes for table '${tableName}'`);

  return formatSuccessResult(
    {
      table_name: tableName,
      indexes: result.rows,
      rowCount: result.rowCount,
      databaseType: dbType,
    },
    dbType,
  );
};

/**
 * Analyze index patterns and potential duplicates
 */
const analyzeIndexPatterns = async (args: { table_name: string }) => {
  const db = getDatabase();
  const dbType = getDatabaseType();

  if (dbType !== 'postgresql') {
    throw new Error('This tool is only available for PostgreSQL databases');
  }

  const tableName = args.table_name;

  const query = `
        SELECT 
            indexname,
            indexdef,
            CASE 
                WHEN indexdef LIKE '%user_id, entity_id, type%' AND indexdef LIKE '%WHERE%' THEN 'Type-specific unique constraint'
                WHEN indexdef LIKE '%user_id, entity_id%' AND indexdef NOT LIKE '%WHERE%' THEN 'Generic constraint (potential duplicate)'
                WHEN indexdef LIKE '%entity_id, type%' AND indexdef NOT LIKE '%user_id%' THEN 'Missing user_id (incomplete)'
                WHEN indexdef LIKE '%PRIMARY KEY%' THEN 'Primary Key'
                WHEN indexdef LIKE '%UNIQUE%' THEN 'Unique Index'
                ELSE 'Other'
            END as index_category,
            CASE 
                WHEN indexdef LIKE '%WHERE%' THEN 'PARTIAL'
                ELSE 'FULL'
            END as index_scope
        FROM pg_indexes 
        WHERE tablename = $1
        ORDER BY index_category, indexname;
    `;

  console.error(`🔍 Analyzing index patterns for table: ${tableName}`);

  const result = await db.query(query, [tableName]);

  console.error(
    `✅ Analyzed ${result.rowCount} indexes for table '${tableName}'`,
  );

  return formatSuccessResult(
    {
      table_name: tableName,
      index_analysis: result.rows,
      rowCount: result.rowCount,
      databaseType: dbType,
    },
    dbType,
  );
};

/**
 * Search for indexes with specific patterns
 */
const searchIndexesByPattern = async (args: {
  pattern: string;
  include_columns?: string[];
}) => {
  const db = getDatabase();
  const dbType = getDatabaseType();

  if (dbType !== 'postgresql') {
    throw new Error('This tool is only available for PostgreSQL databases');
  }

  const pattern = args.pattern;
  const includeColumns = args.include_columns || [];

  let query = `
        SELECT 
            indexname,
            tablename,
            indexdef
        FROM pg_indexes 
        WHERE indexdef LIKE $1
    `;

  const params = [`%${pattern}%`];

  // Add column filters if specified
  if (includeColumns.length > 0) {
    const columnConditions = includeColumns
      .map((col, index) => {
        params.push(`%${col}%`);
        return `indexdef LIKE $${params.length}`;
      })
      .join(' OR ');

    query += ` AND (${columnConditions})`;
  }

  query += ` ORDER BY indexname;`;

  console.error(`🔍 Searching indexes with pattern: ${pattern}`);

  const result = await db.query(query, params);

  console.error(`✅ Found ${result.rowCount} indexes matching pattern`);

  return formatSuccessResult(
    {
      search_pattern: pattern,
      include_columns: includeColumns,
      indexes: result.rows,
      rowCount: result.rowCount,
      databaseType: dbType,
    },
    dbType,
  );
};

/**
 * Validate if a query is a safe catalog query
 */
function _isValidCatalogQuery(query: string): boolean {
  const normalizedQuery = query.toLowerCase().trim();

  // Must start with SELECT
  if (!normalizedQuery.startsWith('select')) {
    return false;
  }

  // Must not contain dangerous keywords
  const dangerousKeywords = [
    'insert',
    'update',
    'delete',
    'drop',
    'create',
    'alter',
    'truncate',
    'grant',
    'revoke',
    'commit',
    'rollback',
  ];

  for (const keyword of dangerousKeywords) {
    if (normalizedQuery.includes(keyword)) {
      return false;
    }
  }

  // Should reference PostgreSQL system catalogs or information_schema
  const validCatalogs = [
    'pg_constraint',
    'pg_indexes',
    'pg_class',
    'pg_namespace',
    'pg_attribute',
    'pg_type',
    'pg_proc',
    'pg_stats',
    'information_schema',
  ];

  const hasValidCatalog = validCatalogs.some((catalog) =>
    normalizedQuery.includes(catalog),
  );

  return hasValidCatalog;
}

/**
 * Get extension information
 */
const getExtensions = async () => {
  const db = getDatabase();
  const dbType = getDatabaseType();

  if (dbType !== 'postgresql') {
    throw new Error('This tool is only available for PostgreSQL databases');
  }

  const query = `
        SELECT 
            extname,
            extversion,
            nspname as schema_name,
            extrelocatable,
            extconfig
        FROM pg_extension e
        LEFT JOIN pg_namespace n ON e.extnamespace = n.oid
        ORDER BY extname
    `;

  console.error(`🔌 Getting installed extensions`);

  const result = await db.query(query);

  console.error(`✅ Found ${result.rowCount} installed extensions`);

  return formatSuccessResult(
    {
      extensions: result.rows,
      rowCount: result.rowCount,
      databaseType: dbType,
    },
    dbType,
  );
};

/**
 * Get user/role information
 */
const getUsersAndRoles = async () => {
  const db = getDatabase();
  const dbType = getDatabaseType();

  if (dbType !== 'postgresql') {
    throw new Error('This tool is only available for PostgreSQL databases');
  }

  const query = `
        SELECT 
            rolname,
            rolsuper,
            rolinherit,
            rolcreaterole,
            rolcreatedb,
            rolcanlogin,
            rolreplication,
            rolconnlimit,
            rolvaliduntil,
            ARRAY(
                SELECT b.rolname
                FROM pg_catalog.pg_auth_members m
                JOIN pg_catalog.pg_roles b ON (m.roleid = b.oid)
                WHERE m.member = r.oid
            ) as member_of
        FROM pg_roles r
        ORDER BY rolname
    `;

  console.error(`👥 Getting users and roles`);

  const result = await db.query(query);

  console.error(`✅ Found ${result.rowCount} users/roles`);

  return formatSuccessResult(
    {
      users_and_roles: result.rows,
      rowCount: result.rowCount,
      databaseType: dbType,
    },
    dbType,
  );
};

/**
 * Get tablespace information
 */
const getTablespaces = async () => {
  const db = getDatabase();
  const dbType = getDatabaseType();

  if (dbType !== 'postgresql') {
    throw new Error('This tool is only available for PostgreSQL databases');
  }

  const query = `
        SELECT 
            spcname,
            pg_catalog.pg_get_userbyid(spcowner) as owner,
            pg_catalog.pg_tablespace_location(oid) as location,
            spcacl,
            spcoptions
        FROM pg_tablespace
        ORDER BY spcname
    `;

  console.error(`💾 Getting tablespace information`);

  const result = await db.query(query);

  console.error(`✅ Found ${result.rowCount} tablespaces`);

  return formatSuccessResult(
    {
      tablespaces: result.rows,
      rowCount: result.rowCount,
      databaseType: dbType,
    },
    dbType,
  );
};

/**
 * Get function/procedure information
 */
const getFunctions = async (args: { schema_name?: string }) => {
  const db = getDatabase();
  const dbType = getDatabaseType();

  if (dbType !== 'postgresql') {
    throw new Error('This tool is only available for PostgreSQL databases');
  }

  const schemaName = args.schema_name || 'public';

  const query = `
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            pg_catalog.pg_get_function_result(p.oid) as result_type,
            pg_catalog.pg_get_function_arguments(p.oid) as arguments,
            CASE p.prokind
                WHEN 'f' THEN 'function'
                WHEN 'p' THEN 'procedure'
                WHEN 'a' THEN 'aggregate'
                WHEN 'w' THEN 'window'
                ELSE 'unknown'
            END as function_type,
            p.provolatile,
            p.proisstrict,
            p.prosecdef,
            l.lanname as language
        FROM pg_proc p
        LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
        LEFT JOIN pg_language l ON p.prolang = l.oid
        WHERE n.nspname = $1
        ORDER BY p.proname
    `;

  console.error(`🔧 Getting functions for schema: ${schemaName}`);

  const result = await db.query(query, [schemaName]);

  console.error(`✅ Found ${result.rowCount} functions/procedures`);

  return formatSuccessResult(
    {
      schema_name: schemaName,
      functions: result.rows,
      rowCount: result.rowCount,
      databaseType: dbType,
    },
    dbType,
  );
};

// Tool definitions
export const postgresCatalogTools: MCPToolDefinition[] = [
  {
    name: 'postgres_catalog_query',
    description:
      'Execute PostgreSQL system catalog queries for advanced database introspection. Supports queries on pg_constraint, pg_indexes, pg_class, and other system catalogs. Only SELECT queries are allowed for safety.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'PostgreSQL system catalog query (SELECT statements only)',
        },
      },
      required: ['query'],
    },
    handler: executePostgresCatalogQuery,
  },
  {
    name: 'get_table_constraints',
    description:
      'Get detailed constraint information for a PostgreSQL table including CHECK, FOREIGN KEY, PRIMARY KEY, UNIQUE, and EXCLUDE constraints.',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Name of the table to get constraints for',
        },
      },
      required: ['table_name'],
    },
    handler: getTableConstraints,
  },
  {
    name: 'get_table_indexes',
    description:
      'Get detailed index information for a PostgreSQL table including index definitions, types, and scope.',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Name of the table to get indexes for',
        },
      },
      required: ['table_name'],
    },
    handler: getTableIndexes,
  },
  {
    name: 'analyze_index_patterns',
    description:
      'Analyze index patterns on a PostgreSQL table to identify potential duplicates, incomplete indexes, and categorize index types.',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Name of the table to analyze index patterns for',
        },
      },
      required: ['table_name'],
    },
    handler: analyzeIndexPatterns,
  },
  {
    name: 'search_indexes_by_pattern',
    description:
      'Search PostgreSQL indexes by pattern and optionally filter by column names to find similar or related indexes.',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description:
            'Pattern to search for in index definitions (e.g., table name, column names)',
        },
        include_columns: {
          type: 'array',
          items: {
            type: 'string',
            description: 'Column name',
          },
          description:
            'Optional array of column names that should be present in the index definition',
        },
      },
      required: ['pattern'],
    },
    handler: searchIndexesByPattern,
  },
  {
    name: 'postgres_get_extensions',
    description: 'Get information about installed PostgreSQL extensions.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: getExtensions,
  },
  {
    name: 'postgres_get_users_roles',
    description:
      'Get information about PostgreSQL users and roles including permissions and memberships.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: getUsersAndRoles,
  },
  {
    name: 'postgres_get_tablespaces',
    description:
      'Get information about PostgreSQL tablespaces including locations and owners.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: getTablespaces,
  },
  {
    name: 'postgres_get_functions',
    description:
      'Get information about PostgreSQL functions and procedures in a specific schema.',
    inputSchema: {
      type: 'object',
      properties: {
        schema_name: {
          type: 'string',
          description:
            'Name of the schema to get functions from (defaults to public)',
          default: 'public',
        },
      },
    },
    handler: getFunctions,
  },
];
