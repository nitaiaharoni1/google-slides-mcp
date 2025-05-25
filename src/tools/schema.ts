/**
 * Schema introspection MCP tools
 * Supports PostgreSQL, MySQL, and SQLite databases
 */

import { getDatabase, getDatabaseType } from '../database';
import { formatSuccessResult, formatTableNotFoundError } from '../utils/result-formatter';
import { QueryBuilder } from '../utils/query-builder';
import { 
    MCPToolDefinition, 
    DescribeTableArgs, 
    ListIndexesArgs, 
    GetForeignKeysArgs, 
    ListFunctionsArgs 
} from '../types/mcp';

/**
 * List all tables and views in the database
 */
const listTables = async (args: any) => {
    const db = getDatabase();
    const dbType = getDatabaseType();
    
    console.error(`🔍 Listing tables for ${dbType?.toUpperCase()}`);

    const query = db.getSchemaQueries().listTables;
    const result = await db.query(query);

    console.error(`✅ Found ${result.rows.length} tables and views`);

    return formatSuccessResult({
        tables: result.rows,
        databaseType: dbType
    }, dbType);
};

/**
 * Describe the structure of a specific table
 */
const describeTable = async (args: DescribeTableArgs) => {
    const db = getDatabase();
    const dbType = getDatabaseType();
    const tableName = args.table_name;

    console.error(`🔍 Describing table '${tableName}' for ${dbType?.toUpperCase()}`);

    // First check if table exists
    const tablesQuery = db.getSchemaQueries().listTables;
    const tablesResult = await db.query(tablesQuery);
    const tableExists = tablesResult.rows.some(
        (row: any) => row.table_name.toLowerCase() === tableName.toLowerCase()
    );

    if (!tableExists) {
        return formatTableNotFoundError(tableName, dbType!);
    }

    // Get column information
    const columnQuery = db.getSchemaQueries().describeTable;
    const columnResult = await db.query(columnQuery, [tableName]);

    // Get constraints (for PostgreSQL and MySQL)
    let constraints = [];
    if (dbType === 'postgresql') {
        const constraintQuery = `
            SELECT 
                tc.constraint_name,
                tc.constraint_type,
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            LEFT JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            WHERE tc.table_name = $1
            AND tc.table_schema = 'public'
            ORDER BY tc.constraint_name;
        `;
        const constraintResult = await db.query(constraintQuery, [tableName]);
        constraints = constraintResult.rows;
    } else if (dbType === 'mysql') {
        const constraintQuery = `
            SELECT 
                CONSTRAINT_NAME as constraint_name,
                CONSTRAINT_TYPE as constraint_type,
                TABLE_NAME as table_name,
                COLUMN_NAME as column_name,
                REFERENCED_TABLE_NAME as foreign_table_name,
                REFERENCED_COLUMN_NAME as foreign_column_name
            FROM information_schema.table_constraints tc
            LEFT JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            WHERE tc.table_name = ?
            AND tc.table_schema = DATABASE()
            ORDER BY tc.constraint_name;
        `;
        const constraintResult = await db.query(constraintQuery, [tableName]);
        constraints = constraintResult.rows;
    }

    console.error(`✅ Table '${tableName}' has ${columnResult.rows.length} columns`);

    return formatSuccessResult({
        table_name: tableName,
        columns: columnResult.rows,
        constraints: constraints,
        databaseType: dbType
    }, dbType);
};

/**
 * List all schemas in the database
 */
const listSchemas = async (args: any) => {
    const db = getDatabase();
    const dbType = getDatabaseType();

    console.error(`🔍 Listing schemas for ${dbType?.toUpperCase()}`);

    const query = db.getSchemaQueries().listSchemas;
    const result = await db.query(query);

    console.error(`✅ Found ${result.rows.length} schemas`);

    return formatSuccessResult({
        schemas: result.rows,
        databaseType: dbType
    }, dbType);
};

/**
 * List indexes for tables
 */
const listIndexes = async (args: ListIndexesArgs) => {
    const db = getDatabase();
    const dbType = getDatabaseType();

    console.error(`🔍 Listing indexes for ${dbType?.toUpperCase()}`);

    let query = db.getSchemaQueries().listIndexes;
    let params: any[] = [];

    // If specific table requested, filter by table name
    if (args.table_name) {
        const tableName = args.table_name;
        if (dbType === 'postgresql') {
            query += ` WHERE tablename = $1`;
            params = [tableName];
        } else if (dbType === 'mysql') {
            query += ` HAVING table_name = ?`;
            params = [tableName];
        } else if (dbType === 'sqlite') {
            // SQLite query already filters by table name
            params = [tableName];
        }
    }

    const result = await db.query(query, params);

    console.error(`✅ Found ${result.rows.length} indexes`);

    return formatSuccessResult({
        indexes: result.rows,
        databaseType: dbType
    }, dbType);
};

/**
 * Get foreign key relationships
 */
const getForeignKeys = async (args: GetForeignKeysArgs) => {
    const db = getDatabase();
    const dbType = getDatabaseType();

    console.error(`🔍 Getting foreign keys for ${dbType?.toUpperCase()}`);

    let query = '';
    let params: any[] = [];

    if (dbType === 'postgresql') {
        query = `
            SELECT 
                tc.table_schema,
                tc.constraint_name,
                tc.table_name,
                kcu.column_name,
                ccu.table_schema AS foreign_table_schema,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
        `;

        if (args.table_name) {
            query += ` AND tc.table_name = $1`;
            params = [args.table_name];
        }
    } else if (dbType === 'mysql') {
        query = `
            SELECT 
                TABLE_SCHEMA as table_schema,
                CONSTRAINT_NAME as constraint_name,
                TABLE_NAME as table_name,
                COLUMN_NAME as column_name,
                REFERENCED_TABLE_SCHEMA as foreign_table_schema,
                REFERENCED_TABLE_NAME as foreign_table_name,
                REFERENCED_COLUMN_NAME as foreign_column_name
            FROM information_schema.key_column_usage
            WHERE REFERENCED_TABLE_NAME IS NOT NULL
            AND TABLE_SCHEMA = DATABASE()
        `;

        if (args.table_name) {
            query += ` AND TABLE_NAME = ?`;
            params = [args.table_name];
        }
    } else {
        // SQLite doesn't have built-in foreign key introspection
        return formatSuccessResult({
            foreign_keys: [],
            message: 'Foreign key introspection not supported for SQLite',
            databaseType: dbType
        }, dbType);
    }

    const result = await db.query(query, params);

    console.error(`✅ Found ${result.rows.length} foreign key relationships`);

    return formatSuccessResult({
        foreign_keys: result.rows,
        databaseType: dbType
    }, dbType);
};

/**
 * List functions and procedures
 */
const listFunctions = async (args: ListFunctionsArgs) => {
    const db = getDatabase();
    const dbType = getDatabaseType();

    console.error(`🔍 Listing functions for ${dbType?.toUpperCase()}`);

    let query = '';
    let params: any[] = [];

    if (dbType === 'postgresql') {
        query = `
            SELECT 
                n.nspname AS schema_name,
                p.proname AS function_name,
                CASE 
                    WHEN p.prokind = 'f' THEN 'function'
                    WHEN p.prokind = 'p' THEN 'procedure'
                    WHEN p.prokind = 'a' THEN 'aggregate'
                    WHEN p.prokind = 'w' THEN 'window'
                    ELSE 'other'
                END AS function_type,
                pg_catalog.pg_get_function_result(p.oid) AS return_type,
                pg_catalog.pg_get_function_arguments(p.oid) AS arguments
            FROM pg_catalog.pg_proc p
            LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        `;

        if (args.schema_name) {
            query += ` AND n.nspname = $1`;
            params = [args.schema_name];
        } else {
            query += ` AND n.nspname = 'public'`;
        }

        query += ` ORDER BY n.nspname, p.proname`;
    } else if (dbType === 'mysql') {
        query = `
            SELECT 
                ROUTINE_SCHEMA as schema_name,
                ROUTINE_NAME as function_name,
                ROUTINE_TYPE as function_type,
                DATA_TYPE as return_type,
                ROUTINE_DEFINITION as routine_definition
            FROM information_schema.routines
            WHERE ROUTINE_SCHEMA = DATABASE()
        `;

        if (args.schema_name) {
            query += ` AND ROUTINE_SCHEMA = ?`;
            params = [args.schema_name];
        }

        query += ` ORDER BY ROUTINE_NAME`;
    } else {
        // SQLite doesn't have functions/procedures like PostgreSQL/MySQL
        return formatSuccessResult({
            functions: [],
            message: 'User-defined functions not supported for introspection in SQLite',
            databaseType: dbType
        }, dbType);
    }

    const result = await db.query(query, params);

    console.error(`✅ Found ${result.rows.length} functions`);

    return formatSuccessResult({
        functions: result.rows,
        databaseType: dbType
    }, dbType);
};

// Tool definitions
export const schemaTools: MCPToolDefinition[] = [
    {
        name: 'list_tables',
        description: 'List all tables and views in the database. Works with PostgreSQL, MySQL, and SQLite.',
        inputSchema: {
            type: 'object',
            properties: {},
            required: [],
        },
        handler: listTables
    },
    {
        name: 'describe_table',
        description: 'Get detailed information about a specific table including columns and constraints. Works with PostgreSQL, MySQL, and SQLite.',
        inputSchema: {
            type: 'object',
            properties: {
                table_name: {
                    type: 'string',
                    description: 'Name of the table to describe',
                },
            },
            required: ['table_name'],
        },
        handler: describeTable
    },
    {
        name: 'list_schemas',
        description: 'List all schemas in the database. Works with PostgreSQL, MySQL, and SQLite.',
        inputSchema: {
            type: 'object',
            properties: {},
            required: [],
        },
        handler: listSchemas
    },
    {
        name: 'list_indexes',
        description: 'List database indexes, optionally filtered by table name. Works with PostgreSQL, MySQL, and SQLite.',
        inputSchema: {
            type: 'object',
            properties: {
                table_name: {
                    type: 'string',
                    description: 'Optional table name to filter indexes',
                },
            },
            required: [],
        },
        handler: listIndexes
    },
    {
        name: 'get_foreign_keys',
        description: 'Get foreign key relationships, optionally filtered by table name. Works with PostgreSQL and MySQL.',
        inputSchema: {
            type: 'object',
            properties: {
                table_name: {
                    type: 'string',
                    description: 'Optional table name to filter foreign keys',
                },
            },
            required: [],
        },
        handler: getForeignKeys
    },
    {
        name: 'list_functions',
        description: 'List user-defined functions and procedures. Works with PostgreSQL and MySQL.',
        inputSchema: {
            type: 'object',
            properties: {
                schema_name: {
                    type: 'string',
                    description: 'Optional schema name to filter functions (defaults to public/current schema)',
                },
            },
            required: [],
        },
        handler: listFunctions
    }
]; 