/**
 * Database analysis and statistics MCP tools
 * Supports PostgreSQL, MySQL, and SQLite databases
 */

import { getDatabase, getDatabaseType } from '../database';
import { QUERY_LIMITS } from '../config/constants';
import { formatSuccessResult, formatColumnNotFoundError, formatValidationError } from '../utils/result-formatter';
import { QueryBuilder } from '../utils/query-builder';
import { 
    MCPToolDefinition, 
    GetTableStatsArgs, 
    AnalyzeColumnArgs 
} from '../types/mcp';
import { DatabaseType } from '../types/database';

/**
 * Get table statistics including sizes and row counts
 */
const getTableStats = async (args: GetTableStatsArgs) => {
    const db = getDatabase();
    const dbType = getDatabaseType();
    const schemaName = args.schema_name || 'public';

    console.error(`📊 Getting table statistics for ${dbType?.toUpperCase()} schema: ${schemaName}`);

    const queries = _buildTableStatsQueries(dbType!, schemaName);
    
    try {
        // Get table sizes
        const tableSizeResult = await db.query(queries.tableSizes);
        
        // Get column statistics (if supported)
        let columnStats = [];
        if (queries.columnStats) {
            const columnStatsResult = await db.query(queries.columnStats);
            columnStats = columnStatsResult.rows;
        }

        console.error(`✅ Retrieved stats for ${tableSizeResult.rows.length} tables`);

        return formatSuccessResult({
            schema: schemaName,
            table_sizes: tableSizeResult.rows,
            column_statistics: columnStats,
            databaseType: dbType
        }, dbType);
    } catch (error) {
        throw new Error(`Failed to get table statistics: ${(error as Error).message}`);
    }
};

/**
 * Analyze a specific column for data quality and distribution
 */
const analyzeColumn = async (args: AnalyzeColumnArgs) => {
    const db = getDatabase();
    const dbType = getDatabaseType();
    const { table_name, column_name } = args;

    console.error(`🔍 Analyzing column '${column_name}' in table '${table_name}' for ${dbType?.toUpperCase()}`);

    try {
        // First verify the column exists
        const columnQuery = db.getSchemaQueries().describeTable;
        const columnResult = await db.query(columnQuery, [table_name]);
        
        const columnExists = columnResult.rows.some(
            (row: any) => row.column_name?.toLowerCase() === column_name.toLowerCase()
        );

        if (!columnExists) {
            return formatColumnNotFoundError(column_name, table_name, dbType!);
        }

        // Get column information
        const columnInfo = columnResult.rows.find(
            (row: any) => row.column_name?.toLowerCase() === column_name.toLowerCase()
        );

        // Build and execute statistics query
        const statsQuery = QueryBuilder.buildColumnStatsQuery(dbType!, table_name, column_name);
        const statsResult = await db.query(statsQuery);

        // Get most common values
        const mcvQuery = QueryBuilder.buildMostCommonValuesQuery(dbType!, table_name, column_name, 10);
        const mcvResult = await db.query(mcvQuery);

        console.error(`✅ Column analysis complete`);

        return formatSuccessResult({
            table_name,
            column_name,
            column_info: columnInfo,
            statistics: statsResult.rows[0],
            most_common_values: mcvResult.rows,
            databaseType: dbType
        }, dbType);
    } catch (error) {
        throw new Error(`Failed to analyze column: ${(error as Error).message}`);
    }
};

/**
 * Get comprehensive database information
 */
const getDatabaseInfo = async (args: any) => {
    const db = getDatabase();
    const dbType = getDatabaseType();

    console.error(`ℹ️  Getting database information for ${dbType?.toUpperCase()}`);

    const infoQueries = db.getInfoQueries();
    const results: Record<string, any> = {};

    // Execute all info queries
    for (const [key, query] of Object.entries(infoQueries)) {
        try {
            const result = await db.query(query);
            results[key] = result.rows;
        } catch (error) {
            results[key] = { error: (error as Error).message };
        }
    }

    console.error(`✅ Database information retrieved`);

    return formatSuccessResult({
        ...results,
        databaseType: dbType
    }, dbType);
};

// Helper function to build database-specific table statistics queries
function _buildTableStatsQueries(dbType: DatabaseType, schemaName: string) {
    switch (dbType) {
        case 'postgresql':
            return {
                tableSizes: `
                    SELECT 
                        t.table_name,
                        pg_size_pretty(pg_total_relation_size(c.oid)) AS size,
                        pg_total_relation_size(c.oid) AS size_bytes,
                        (SELECT reltuples::bigint FROM pg_class WHERE oid = c.oid) AS estimated_rows
                    FROM information_schema.tables t
                    LEFT JOIN pg_class c ON c.relname = t.table_name
                    LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
                    WHERE t.table_schema = '${schemaName}' 
                      AND t.table_type = 'BASE TABLE'
                      AND n.nspname = '${schemaName}'
                    ORDER BY pg_total_relation_size(c.oid) DESC;
                `,
                columnStats: `
                    SELECT 
                        schemaname,
                        tablename,
                        attname,
                        n_distinct,
                        most_common_vals,
                        most_common_freqs,
                        histogram_bounds,
                        correlation
                    FROM pg_stats 
                    WHERE schemaname = '${schemaName}'
                    ORDER BY tablename, attname;
                `
            };

        case 'mysql':
            return {
                tableSizes: `
                    SELECT 
                        table_name,
                        ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb,
                        (data_length + index_length) AS size_bytes,
                        table_rows AS estimated_rows
                    FROM information_schema.tables
                    WHERE table_schema = DATABASE()
                      AND table_type = 'BASE TABLE'
                    ORDER BY (data_length + index_length) DESC;
                `,
                columnStats: null // MySQL doesn't have easily accessible column statistics
            };

        case 'sqlite':
            return {
                tableSizes: `
                    SELECT 
                        name AS table_name,
                        'N/A' AS size,
                        0 AS size_bytes,
                        0 AS estimated_rows
                    FROM sqlite_master 
                    WHERE type = 'table' 
                      AND name NOT LIKE 'sqlite_%'
                    ORDER BY name;
                `,
                columnStats: null // SQLite doesn't have column statistics
            };

        default:
            throw new Error(`Unsupported database type: ${dbType}`);
    }
}

// Helper function to build column information query
function _buildColumnInfoQuery(dbType: DatabaseType) {
    switch (dbType) {
        case 'postgresql':
            return `
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = $1 AND table_schema = 'public'
                ORDER BY ordinal_position;
            `;
        case 'mysql':
            return `
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = ? AND table_schema = DATABASE()
                ORDER BY ordinal_position;
            `;
        case 'sqlite':
            return `PRAGMA table_info(?)`;
        default:
            throw new Error(`Unsupported database type: ${dbType}`);
    }
}

// Tool definitions
export const analysisTools: MCPToolDefinition[] = [
    {
        name: 'get_table_stats',
        description: 'Get comprehensive statistics about tables including sizes and row counts. Works with PostgreSQL, MySQL, and SQLite.',
        inputSchema: {
            type: 'object',
            properties: {
                schema_name: {
                    type: 'string',
                    description: 'Schema name to analyze (defaults to public schema)',
                    default: 'public',
                },
            },
            required: [],
        },
        handler: getTableStats
    },
    {
        name: 'analyze_column',
        description: 'Analyze a specific column for data quality, distribution, and most common values. Works with PostgreSQL, MySQL, and SQLite.',
        inputSchema: {
            type: 'object',
            properties: {
                table_name: {
                    type: 'string',
                    description: 'Name of the table containing the column',
                },
                column_name: {
                    type: 'string',
                    description: 'Name of the column to analyze',
                },
            },
            required: ['table_name', 'column_name'],
        },
        handler: analyzeColumn
    },
    {
        name: 'get_database_info',
        description: 'Get comprehensive database information including version, size, settings, and activity. Works with PostgreSQL, MySQL, and SQLite.',
        inputSchema: {
            type: 'object',
            properties: {},
            required: [],
        },
        handler: getDatabaseInfo
    }
]; 