#!/usr/bin/env node

/**
 * PostgreSQL MCP Server
 *
 * A Model Context Protocol server that provides Claude with access to PostgreSQL databases.
 * Supports SSL connections, database introspection, and query execution.
 *
 * @author Your Name
 * @license MIT
 */

const {Server} = require('@modelcontextprotocol/sdk/server/index.js');
const {StdioServerTransport} = require('@modelcontextprotocol/sdk/server/stdio.js');
const {CallToolRequestSchema, ListToolsRequestSchema} = require('@modelcontextprotocol/sdk/types.js');
const {Client} = require('pg');
require('dotenv').config();

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

// Handle SSL configuration for cloud providers
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
    console.warn('⚠️  TLS certificate verification is disabled. Not recommended for production.');
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

    // Configure SSL for cloud providers
    if (process.env.DATABASE_URL.includes('sslmode=require') ||
        process.env.DATABASE_URL.includes('digitalocean.com') ||
        process.env.DATABASE_URL.includes('amazonaws.com')) {
        config.ssl = {
            rejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0',
            checkServerIdentity: () => undefined
        };
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
            console.error('💡 Try setting NODE_TLS_REJECT_UNAUTHORIZED=0 for development');
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

main().catch(console.error);