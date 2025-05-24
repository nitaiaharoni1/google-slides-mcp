#!/usr/bin/env node

/**
 * PostgreSQL MCP Server
 *
 * A Model Context Protocol server that provides Claude with access to PostgreSQL databases.
 * Supports SSL connections, database introspection, and query execution.
 *
 * @author Nitai Aharoni <nitaiaharoni1@gmail.com>
 * @license MIT
 */

const {Server} = require('@modelcontextprotocol/sdk/server/index.js');
const {StdioServerTransport} = require('@modelcontextprotocol/sdk/server/stdio.js');
const {CallToolRequestSchema, ListToolsRequestSchema} = require('@modelcontextprotocol/sdk/types.js');
const {Client} = require('pg');
const fs = require('fs');
const path = require('path');
const os = require('os');
require('dotenv').config();

// Handle CLI arguments
const args = process.argv.slice(2);
if (args.includes('--version') || args.includes('-v')) {
    const packageJson = require('./package.json');
    console.log(`${packageJson.name} v${packageJson.version}`);
    process.exit(0);
}

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
PostgreSQL MCP Server v${require('./package.json').version}

Usage:
  claude-postgres-mcp [options]

Options:
  --version, -v         Show version number
  --help, -h           Show this help message
  --test               Test database connection (requires DATABASE_URL)
  --configure          Automatically configure Claude Desktop
  --find-config        Show Claude Desktop config file location

Environment Variables:
  DATABASE_URL          PostgreSQL connection string (required)

Examples:
  claude-postgres-mcp
  DATABASE_URL="postgresql://user:pass@host:5432/db" claude-postgres-mcp
  claude-postgres-mcp --test
  claude-postgres-mcp --configure
  claude-postgres-mcp --find-config

For more information, visit:
https://github.com/nitaiaharoni/claude-postgres-mcp
`);
    process.exit(0);
}

if (args.includes('--test')) {
    console.log('🧪 Testing database connection...');
    require('./test.js');
    return;
}

if (args.includes('--configure')) {
    configureClaudeDesktop();
    return;
}

if (args.includes('--find-config')) {
    showConfigLocation();
    return;
}

// Server configuration
const SERVER_CONFIG = {
    name: 'postgresql-mcp-server',
    version: '1.0.0',
    description: 'PostgreSQL database access for Claude via MCP'
};

// Validate environment variables
if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
}

// Handle SSL for cloud providers globally
const isDigitalOceanDB = process.env.DATABASE_URL.includes('ondigitalocean.com');
if (isDigitalOceanDB && !process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.error('🔒 SSL verification disabled for DigitalOcean cloud database');
}

const server = new Server(SERVER_CONFIG, {
    capabilities: {
        tools: {},
    },
});

// Create PostgreSQL client with robust SSL configuration
const createDatabaseClient = () => {
    const config = {
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 10000, // 10 second timeout
        idleTimeoutMillis: 30000,       // 30 second idle timeout
        max: 1,                         // Single connection for MCP
    };

    // Configure SSL for cloud providers - automatically handle self-signed certificates
    const isCloudProvider = process.env.DATABASE_URL.includes('digitalocean.com') ||
                           process.env.DATABASE_URL.includes('ondigitalocean.com') ||
                           process.env.DATABASE_URL.includes('amazonaws.com') ||
                           process.env.DATABASE_URL.includes('rds.amazonaws.com') ||
                           process.env.DATABASE_URL.includes('googleapis.com') ||
                           process.env.DATABASE_URL.includes('azure.com') ||
                           process.env.DATABASE_URL.includes('heroku.com') ||
                           process.env.DATABASE_URL.includes('sslmode=require');

    if (isCloudProvider) {
        config.ssl = {
            rejectUnauthorized: false, // Allow self-signed certificates for cloud providers
            checkServerIdentity: () => undefined, // Skip hostname verification
            requestCert: true,
            agent: false
        };
        console.error('🔒 SSL enabled with cloud provider certificate handling');
    } else if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
        config.ssl = {
            rejectUnauthorized: false,
            checkServerIdentity: () => undefined
        };
        console.error('⚠️  SSL verification disabled via NODE_TLS_REJECT_UNAUTHORIZED');
    }

    return new Client(config);
};

const client = createDatabaseClient();

// Database connection management
let isConnected = false;

const connectDatabase = async () => {
    try {
        await client.connect();

        // Test connection with a simple query
        const result = await client.query('SELECT NOW() as current_time, version() as db_version');
        const {current_time, db_version} = result.rows[0];

        console.error('✅ Connected to PostgreSQL database');
        console.error(`📅 Server time: ${current_time}`);
        console.error(`🔧 Version: ${db_version.split(',')[0]}`);

        isConnected = true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);

        // Provide helpful error messages
        if (error.message.includes('self-signed certificate')) {
            console.error('💡 SSL certificate issue - this should be automatically handled for cloud providers');
            console.error('💡 If using a local database, try setting NODE_TLS_REJECT_UNAUTHORIZED=0');
        }
        if (error.message.includes('no pg_hba.conf entry')) {
            console.error('💡 Check if SSL is required for your database connection');
        }
        if (error.message.includes('timeout')) {
            console.error('💡 Check your network connection and database availability');
        }

        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGINT', async () => {
    console.error('🔄 Shutting down PostgreSQL MCP server...');
    if (isConnected) {
        await client.end();
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    if (isConnected) {
        await client.end();
    }
    process.exit(0);
});

// Initialize database connection
connectDatabase();

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'query_database',
                description: 'Execute a SQL query on the PostgreSQL database. Only SELECT queries are allowed for safety.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'SQL query to execute (SELECT statements only)',
                        },
                    },
                    required: ['query'],
                },
            },
            {
                name: 'list_tables',
                description: 'List all tables and views in the database with their types',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'describe_table',
                description: 'Get detailed schema information for a specific table including columns, data types, and constraints',
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
            },
            {
                name: 'list_schemas',
                description: 'List all schemas in the database',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'get_table_stats',
                description: 'Get statistics for tables including row counts, sizes, and last vacuum/analyze times',
                inputSchema: {
                    type: 'object',
                    properties: {
                        schema_name: {
                            type: 'string',
                            description: 'Schema name (defaults to public)',
                            default: 'public',
                        },
                    },
                },
            },
            {
                name: 'list_indexes',
                description: 'List all indexes for a specific table or all tables',
                inputSchema: {
                    type: 'object',
                    properties: {
                        table_name: {
                            type: 'string',
                            description: 'Name of the table (optional - if not provided, lists all indexes)',
                        },
                    },
                },
            },
            {
                name: 'get_foreign_keys',
                description: 'List foreign key relationships for a specific table or all tables',
                inputSchema: {
                    type: 'object',
                    properties: {
                        table_name: {
                            type: 'string',
                            description: 'Name of the table (optional - if not provided, lists all foreign keys)',
                        },
                    },
                },
            },
            {
                name: 'explain_query',
                description: 'Get the execution plan for a SQL query without executing it',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'SQL query to explain (SELECT statements only)',
                        },
                        analyze: {
                            type: 'boolean',
                            description: 'Whether to include actual execution statistics (WARNING: this executes the query)',
                            default: false,
                        },
                    },
                    required: ['query'],
                },
            },
            {
                name: 'list_functions',
                description: 'List stored functions and procedures in the database',
                inputSchema: {
                    type: 'object',
                    properties: {
                        schema_name: {
                            type: 'string',
                            description: 'Schema name (defaults to public)',
                            default: 'public',
                        },
                    },
                },
            },
            {
                name: 'get_database_info',
                description: 'Get general database information including size, version, and settings',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'analyze_column',
                description: 'Get statistical analysis of a specific column including distribution, nulls, and unique values',
                inputSchema: {
                    type: 'object',
                    properties: {
                        table_name: {
                            type: 'string',
                            description: 'Name of the table',
                        },
                        column_name: {
                            type: 'string',
                            description: 'Name of the column to analyze',
                        },
                    },
                    required: ['table_name', 'column_name'],
                },
            },
            {
                name: 'search_tables',
                description: 'Search for tables and columns by name pattern',
                inputSchema: {
                    type: 'object',
                    properties: {
                        pattern: {
                            type: 'string',
                            description: 'Search pattern (supports SQL LIKE patterns with % and _)',
                        },
                        search_columns: {
                            type: 'boolean',
                            description: 'Whether to also search column names',
                            default: false,
                        },
                    },
                    required: ['pattern'],
                },
            },
        ],
    };
});

// Utility function to validate and sanitize queries
const validateQuery = (query) => {
    const trimmedQuery = query.trim().toLowerCase();

    // Only allow SELECT statements for safety
    if (!trimmedQuery.startsWith('select') &&
        !trimmedQuery.startsWith('with') &&
        !trimmedQuery.startsWith('show')) {
        throw new Error('Only SELECT, WITH, and SHOW queries are allowed for security reasons');
    }

    // Block potentially dangerous statements
    const dangerousKeywords = ['drop', 'delete', 'insert', 'update', 'alter', 'create', 'truncate'];
    const hasRiskyKeywords = dangerousKeywords.some(keyword =>
        trimmedQuery.includes(keyword.toLowerCase())
    );

    if (hasRiskyKeywords) {
        throw new Error('Query contains potentially dangerous keywords. Only read operations are allowed.');
    }

    return query;
};

// Tool handlers
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const {name, arguments: args} = request.params;

    if (!isConnected) {
        return {
            content: [
                {
                    type: 'text',
                    text: 'Error: Database connection not established. Please check your configuration.',
                },
            ],
            isError: true,
        };
    }

    try {
        switch (name) {
            case 'query_database': {
                const query = validateQuery(args.query);

                console.error(`🔍 Executing query: ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`);

                const startTime = Date.now();
                const result = await client.query(query);
                const executionTime = Date.now() - startTime;

                console.error(`✅ Query executed in ${executionTime}ms, returned ${result.rowCount} rows`);

                // Limit result size to prevent overwhelming responses
                const maxRows = 1000;
                const rows = result.rows.slice(0, maxRows);
                const wasTruncated = result.rows.length > maxRows;

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                rows,
                                rowCount: result.rowCount,
                                command: result.command,
                                executionTimeMs: executionTime,
                                truncated: wasTruncated,
                                ...(wasTruncated && {
                                    message: `Results truncated to ${maxRows} rows. Total rows: ${result.rowCount}`
                                })
                            }, null, 2),
                        },
                    ],
                };
            }

            case 'list_tables': {
                console.error('📋 Listing database tables...');

                const result = await client.query(`
                    SELECT schemaname,
                           tablename    as table_name,
                           'BASE TABLE' as table_type
                    FROM pg_tables
                    WHERE schemaname = 'public'

                    UNION ALL

                    SELECT schemaname,
                           viewname as table_name,
                           'VIEW'   as table_type
                    FROM pg_views
                    WHERE schemaname = 'public'

                    ORDER BY table_name;
                `);

                console.error(`✅ Found ${result.rowCount} tables and views`);

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result.rows, null, 2),
                        },
                    ],
                };
            }

            case 'describe_table': {
                const tableName = args.table_name;
                console.error(`🔍 Describing table: ${tableName}`);

                // Get column information
                const columnQuery = `
                    SELECT column_name,
                           data_type,
                           is_nullable,
                           column_default,
                           character_maximum_length,
                           numeric_precision,
                           numeric_scale
                    FROM information_schema.columns
                    WHERE table_name = $1
                      AND table_schema = 'public'
                    ORDER BY ordinal_position;
                `;

                // Get constraints information
                const constraintQuery = `
                    SELECT tc.constraint_name,
                           tc.constraint_type,
                           kcu.column_name
                    FROM information_schema.table_constraints tc
                             JOIN information_schema.key_column_usage kcu
                                  ON tc.constraint_name = kcu.constraint_name
                    WHERE tc.table_name = $1
                      AND tc.table_schema = 'public';
                `;

                const [columnResult, constraintResult] = await Promise.all([
                    client.query(columnQuery, [tableName]),
                    client.query(constraintQuery, [tableName])
                ]);

                if (columnResult.rows.length === 0) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Table '${tableName}' not found in the public schema.`,
                            },
                        ],
                        isError: true,
                    };
                }

                console.error(`✅ Table ${tableName} has ${columnResult.rows.length} columns`);

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                table_name: tableName,
                                columns: columnResult.rows,
                                constraints: constraintResult.rows
                            }, null, 2),
                        },
                    ],
                };
            }

            case 'list_schemas': {
                console.error('📋 Listing database schemas...');

                const result = await client.query(`
                    SELECT schema_name,
                           schema_owner,
                           CASE 
                               WHEN schema_name IN ('information_schema', 'pg_catalog', 'pg_toast') 
                               THEN 'system'
                               ELSE 'user'
                           END as schema_type
                    FROM information_schema.schemata
                    ORDER BY schema_type, schema_name;
                `);

                console.error(`✅ Found ${result.rowCount} schemas`);

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result.rows, null, 2),
                        },
                    ],
                };
            }

            case 'get_table_stats': {
                const schemaName = args.schema_name || 'public';
                console.error(`📊 Getting table statistics for schema: ${schemaName}`);

                const result = await client.query(`
                    SELECT 
                        schemaname,
                        tablename,
                        attname,
                        n_distinct,
                        most_common_vals,
                        most_common_freqs,
                        histogram_bounds,
                        correlation,
                        most_common_elems,
                        most_common_elem_freqs,
                        elem_count_histogram
                    FROM pg_stats 
                    WHERE schemaname = $1
                    ORDER BY tablename, attname;
                `, [schemaName]);

                // Also get table sizes
                const sizeResult = await client.query(`
                    SELECT 
                        t.table_name,
                        pg_size_pretty(pg_total_relation_size(c.oid)) AS size,
                        pg_total_relation_size(c.oid) AS size_bytes,
                        (SELECT reltuples::bigint FROM pg_class WHERE oid = c.oid) AS estimated_rows
                    FROM information_schema.tables t
                    LEFT JOIN pg_class c ON c.relname = t.table_name
                    LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
                    WHERE t.table_schema = $1 
                      AND t.table_type = 'BASE TABLE'
                      AND n.nspname = $1
                    ORDER BY pg_total_relation_size(c.oid) DESC;
                `, [schemaName]);

                console.error(`✅ Found statistics for ${sizeResult.rowCount} tables`);

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                schema: schemaName,
                                table_sizes: sizeResult.rows,
                                column_statistics: result.rows
                            }, null, 2),
                        },
                    ],
                };
            }

            case 'list_indexes': {
                const tableName = args.table_name;
                console.error(tableName ? `📋 Listing indexes for table: ${tableName}` : '📋 Listing all indexes...');

                let query = `
                    SELECT 
                        schemaname,
                        tablename,
                        indexname,
                        indexdef,
                        CASE WHEN indisunique THEN 'UNIQUE' ELSE 'NON-UNIQUE' END as index_type,
                        CASE WHEN indisprimary THEN 'PRIMARY KEY' 
                             WHEN indisunique THEN 'UNIQUE'
                             ELSE 'INDEX' END as constraint_type
                    FROM pg_indexes 
                    LEFT JOIN pg_class c ON c.relname = indexname
                    LEFT JOIN pg_index i ON i.indexrelid = c.oid
                `;
                
                const params = [];
                if (tableName) {
                    query += ` WHERE tablename = $1`;
                    params.push(tableName);
                }
                
                query += ` ORDER BY schemaname, tablename, indexname;`;

                const result = await client.query(query, params);

                console.error(`✅ Found ${result.rowCount} indexes`);

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result.rows, null, 2),
                        },
                    ],
                };
            }

            case 'get_foreign_keys': {
                const tableName = args.table_name;
                console.error(tableName ? `🔗 Getting foreign keys for table: ${tableName}` : '🔗 Getting all foreign keys...');

                let query = `
                    SELECT 
                        tc.table_schema,
                        tc.table_name,
                        kcu.column_name,
                        ccu.table_schema AS foreign_table_schema,
                        ccu.table_name AS foreign_table_name,
                        ccu.column_name AS foreign_column_name,
                        tc.constraint_name,
                        rc.update_rule,
                        rc.delete_rule
                    FROM information_schema.table_constraints AS tc 
                    JOIN information_schema.key_column_usage AS kcu
                        ON tc.constraint_name = kcu.constraint_name
                        AND tc.table_schema = kcu.table_schema
                    JOIN information_schema.constraint_column_usage AS ccu
                        ON ccu.constraint_name = tc.constraint_name
                        AND ccu.table_schema = tc.table_schema
                    JOIN information_schema.referential_constraints AS rc
                        ON tc.constraint_name = rc.constraint_name
                        AND tc.table_schema = rc.constraint_schema
                    WHERE tc.constraint_type = 'FOREIGN KEY'
                `;
                
                const params = [];
                if (tableName) {
                    query += ` AND tc.table_name = $1`;
                    params.push(tableName);
                }
                
                query += ` ORDER BY tc.table_schema, tc.table_name, kcu.column_name;`;

                const result = await client.query(query, params);

                console.error(`✅ Found ${result.rowCount} foreign key relationships`);

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result.rows, null, 2),
                        },
                    ],
                };
            }

            case 'explain_query': {
                const query = validateQuery(args.query);
                const analyze = args.analyze || false;
                
                console.error(`🔍 Explaining query${analyze ? ' with analysis' : ''}: ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`);

                const explainQuery = `EXPLAIN ${analyze ? 'ANALYZE ' : ''}${query}`;
                const result = await client.query(explainQuery);

                console.error(`✅ Query plan generated`);

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                query: query,
                                execution_plan: result.rows.map(row => row['QUERY PLAN']),
                                analyzed: analyze
                            }, null, 2),
                        },
                    ],
                };
            }

            case 'list_functions': {
                const schemaName = args.schema_name || 'public';
                console.error(`📋 Listing functions in schema: ${schemaName}`);

                const result = await client.query(`
                    SELECT 
                        p.proname as function_name,
                        pg_catalog.pg_get_function_result(p.oid) as return_type,
                        pg_catalog.pg_get_function_arguments(p.oid) as arguments,
                        CASE p.prokind 
                            WHEN 'f' THEN 'function'
                            WHEN 'p' THEN 'procedure'
                            WHEN 'a' THEN 'aggregate'
                            WHEN 'w' THEN 'window'
                            ELSE 'unknown'
                        END as function_type,
                        p.provolatile as volatility,
                        obj_description(p.oid, 'pg_proc') as description
                    FROM pg_proc p
                    LEFT JOIN pg_namespace n ON n.oid = p.pronamespace
                    WHERE n.nspname = $1
                    ORDER BY function_type, function_name;
                `, [schemaName]);

                console.error(`✅ Found ${result.rowCount} functions`);

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result.rows, null, 2),
                        },
                    ],
                };
            }

            case 'get_database_info': {
                console.error('🔍 Getting database information...');

                const queries = {
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

                const results = {};
                for (const [key, query] of Object.entries(queries)) {
                    try {
                        const result = await client.query(query);
                        results[key] = result.rows;
                    } catch (error) {
                        results[key] = { error: error.message };
                    }
                }

                console.error(`✅ Database information collected`);

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(results, null, 2),
                        },
                    ],
                };
            }

            case 'analyze_column': {
                const tableName = args.table_name;
                const columnName = args.column_name;
                console.error(`📊 Analyzing column: ${tableName}.${columnName}`);

                // Get column basic info
                const columnInfo = await client.query(`
                    SELECT data_type, is_nullable, column_default
                    FROM information_schema.columns
                    WHERE table_name = $1 AND column_name = $2 AND table_schema = 'public'
                `, [tableName, columnName]);

                if (columnInfo.rows.length === 0) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Column '${columnName}' not found in table '${tableName}'.`,
                            },
                        ],
                        isError: true,
                    };
                }

                // Validate table and column names to prevent SQL injection
                const validNamePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
                if (!validNamePattern.test(tableName) || !validNamePattern.test(columnName)) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: 'Invalid table or column name. Names must contain only letters, numbers, and underscores.',
                            },
                        ],
                        isError: true,
                    };
                }

                // Get column statistics using pg_format to safely build the query
                const statsQuery = `
                    SELECT 
                        COUNT(*) as total_rows,
                        COUNT("${columnName}") as non_null_count,
                        COUNT(*) - COUNT("${columnName}") as null_count,
                        COUNT(DISTINCT "${columnName}") as distinct_count,
                        MIN("${columnName}"::text) as min_value,
                        MAX("${columnName}"::text) as max_value
                    FROM "${tableName}"
                `;

                const commonValuesQuery = `
                    SELECT "${columnName}" as value, COUNT(*) as frequency
                    FROM "${tableName}"
                    WHERE "${columnName}" IS NOT NULL
                    GROUP BY "${columnName}"
                    ORDER BY frequency DESC
                    LIMIT 10
                `;

                const [stats, commonValues] = await Promise.all([
                    client.query(statsQuery),
                    client.query(commonValuesQuery)
                ]);

                console.error(`✅ Column analysis completed`);

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                table_name: tableName,
                                column_name: columnName,
                                column_info: columnInfo.rows[0],
                                statistics: stats.rows[0],
                                most_common_values: commonValues.rows
                            }, null, 2),
                        },
                    ],
                };
            }

            case 'search_tables': {
                const pattern = args.pattern;
                const searchColumns = args.search_columns || false;
                console.error(`🔍 Searching for tables with pattern: ${pattern}`);

                let query = `
                    SELECT 'table' as object_type, 
                           schemaname as schema_name,
                           tablename as object_name,
                           NULL as column_name
                    FROM pg_tables
                    WHERE schemaname = 'public' 
                      AND tablename LIKE $1
                    
                    UNION ALL
                    
                    SELECT 'view' as object_type,
                           schemaname as schema_name, 
                           viewname as object_name,
                           NULL as column_name
                    FROM pg_views
                    WHERE schemaname = 'public'
                      AND viewname LIKE $1
                `;

                if (searchColumns) {
                    query += `
                        UNION ALL
                        
                        SELECT 'column' as object_type,
                               table_schema as schema_name,
                               table_name as object_name,
                               column_name
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND column_name LIKE $1
                    `;
                }

                query += ` ORDER BY object_type, schema_name, object_name;`;

                const result = await client.query(query, [pattern]);

                console.error(`✅ Found ${result.rowCount} matching objects`);

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                search_pattern: pattern,
                                searched_columns: searchColumns,
                                results: result.rows
                            }, null, 2),
                        },
                    ],
                };
            }

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        console.error(`❌ Error in ${name}:`, error.message);

        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
});

// Start the MCP server
async function main() {
    try {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error(`🚀 PostgreSQL MCP server v${SERVER_CONFIG.version} running`);
    } catch (error) {
        console.error('❌ Failed to start MCP server:', error);
        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Claude Desktop configuration function
function configureClaudeDesktop() {
    console.log('🔧 Configuring Claude Desktop for PostgreSQL MCP Server...\n');
    
    try {
        // Detect OS and get config path
        const configPath = getClaudeConfigPath();
        console.log(`📁 Config path: ${configPath}`);
        
        // Read or create config
        let config = {};
        if (fs.existsSync(configPath)) {
            try {
                const configContent = fs.readFileSync(configPath, 'utf8');
                config = JSON.parse(configContent);
                console.log('✅ Found existing Claude Desktop configuration');
            } catch (error) {
                console.log('⚠️  Existing config file has invalid JSON, creating new configuration');
                config = {};
            }
        } else {
            console.log('📝 No existing config found, creating new configuration');
            // Create directory if it doesn't exist
            const configDir = path.dirname(configPath);
            fs.mkdirSync(configDir, { recursive: true });
        }
        
        // Initialize mcpServers if it doesn't exist
        if (!config.mcpServers) {
            config.mcpServers = {};
        }
        
        // Get DATABASE_URL from user if not set
        let databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            console.log('\n⚠️  DATABASE_URL environment variable not found.');
            console.log('Please set it first, for example:');
            console.log('export DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"');
            console.log('\nOr you can manually edit the config file later at:');
            console.log(configPath);
            databaseUrl = "postgresql://username:password@host:port/database?sslmode=require";
        }
        
        // Add or update the postgresql MCP server configuration
        config.mcpServers.postgresql = {
            command: "claude-postgres-mcp",
            env: {
                DATABASE_URL: databaseUrl
            }
        };
        
        // Write updated config
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        console.log('\n✅ Claude Desktop configuration updated successfully!');
        console.log('\nConfiguration added:');
        console.log(JSON.stringify({ mcpServers: { postgresql: config.mcpServers.postgresql } }, null, 2));
        
        console.log('\n📋 Next steps:');
        console.log('1. Restart Claude Desktop');
        if (!process.env.DATABASE_URL) {
            console.log('2. Set your DATABASE_URL environment variable');
            console.log('3. Or edit the config file manually to add your database connection string');
        } else {
            console.log('2. Start chatting with Claude - it now has access to your PostgreSQL database!');
        }
        
        console.log('\n💡 Test the connection with: claude-postgres-mcp --test');
        
    } catch (error) {
        console.error('❌ Failed to configure Claude Desktop:', error.message);
        console.error('\n💡 You can manually configure Claude Desktop by editing:');
        console.error(getClaudeConfigPath());
        console.error('\nAdd this configuration:');
        console.error(JSON.stringify({
            mcpServers: {
                postgresql: {
                    command: "claude-postgres-mcp",
                    env: {
                        DATABASE_URL: "postgresql://username:password@host:port/database?sslmode=require"
                    }
                }
            }
        }, null, 2));
        process.exit(1);
    }
}

function getClaudeConfigPath() {
    const platform = os.platform();
    const homeDir = os.homedir();
    
    switch (platform) {
        case 'darwin': // macOS
            return path.join(homeDir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
        case 'linux':
            return path.join(homeDir, '.config', 'Claude', 'claude_desktop_config.json');
        case 'win32': // Windows
            const appData = process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming');
            return path.join(appData, 'Claude', 'claude_desktop_config.json');
        default:
            throw new Error(`Unsupported operating system: ${platform}. Please configure manually.`);
    }
}

function showConfigLocation() {
    console.log('🔍 Finding Claude Desktop configuration file...\n');
    
    try {
        const configPath = getClaudeConfigPath();
        const platform = os.platform();
        
        console.log(`🖥️  Operating System: ${platform === 'darwin' ? 'macOS' : platform === 'win32' ? 'Windows' : platform}`);
        console.log(`📁 Configuration file location:`);
        console.log(`   ${configPath}`);
        
        // Check if file exists
        const fileExists = fs.existsSync(configPath);
        console.log(`📄 File exists: ${fileExists ? '✅ Yes' : '❌ No (will be created when you add config)'}`);
        
        if (fileExists) {
            try {
                const configContent = fs.readFileSync(configPath, 'utf8');
                const config = JSON.parse(configContent);
                const hasPostgresql = config.mcpServers && config.mcpServers.postgresql;
                console.log(`🔗 PostgreSQL MCP configured: ${hasPostgresql ? '✅ Yes' : '❌ No'}`);
            } catch (error) {
                console.log(`⚠️  Config file exists but has invalid JSON`);
            }
        }
        
        console.log('\n📝 Manual Configuration Instructions:');
        console.log('1. Open the configuration file in your text editor');
        console.log('2. Add or update the following configuration:');
        
        const exampleConfig = {
            mcpServers: {
                postgresql: {
                    command: "claude-postgres-mcp",
                    env: {
                        DATABASE_URL: process.env.DATABASE_URL || "postgresql://username:password@host:port/database?sslmode=require"
                    }
                }
            }
        };
        
        console.log('\n```json');
        console.log(JSON.stringify(exampleConfig, null, 2));
        console.log('```');
        
        console.log('\n💡 Alternative commands:');
        console.log('   Automatic config: claude-postgres-mcp --configure');
        console.log('   Test connection:  claude-postgres-mcp --test');
        
        if (!process.env.DATABASE_URL) {
            console.log('\n⚠️  Don\'t forget to set your DATABASE_URL environment variable:');
            console.log('   export DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"');
        }
        
    } catch (error) {
        console.error('❌ Failed to locate Claude Desktop configuration:', error.message);
        console.error('\n💡 Supported operating systems: macOS, Linux, Windows');
        console.error('For manual configuration, please refer to the Claude Desktop documentation.');
        process.exit(1);
    }
}

main().catch(console.error);