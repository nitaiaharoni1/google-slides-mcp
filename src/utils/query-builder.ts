/**
 * Query Builder Utilities
 * Database-agnostic query building for different database types
 */

import { DatabaseType } from '../types/database';

export class QueryBuilder {
    /**
     * Build an EXPLAIN query for different database types
     */
    static buildExplainQuery(databaseType: DatabaseType, query: string, analyze: boolean = false): string {
        switch (databaseType) {
            case 'postgresql':
                const explainType = analyze ? 'EXPLAIN (ANALYZE, FORMAT JSON)' : 'EXPLAIN (FORMAT JSON)';
                return `${explainType} ${query}`;
            
            case 'mysql':
                const mysqlType = analyze ? 'EXPLAIN ANALYZE' : 'EXPLAIN FORMAT=JSON';
                return `${mysqlType} ${query}`;
            
            case 'sqlite':
                // SQLite doesn't support ANALYZE in EXPLAIN
                return `EXPLAIN QUERY PLAN ${query}`;
            
            case 'snowflake':
                // Snowflake uses EXPLAIN for query plans
                return `EXPLAIN ${query}`;
            
            default:
                throw new Error(`Unsupported database type for EXPLAIN: ${databaseType}`);
        }
    }

    /**
     * Build column statistics query for different database types
     */
    static buildColumnStatsQuery(databaseType: DatabaseType, tableName: string, columnName: string): string {
        const escapedTable = this.escapeIdentifier(databaseType, tableName);
        const escapedColumn = this.escapeIdentifier(databaseType, columnName);

        switch (databaseType) {
            case 'postgresql':
                return `
                    SELECT 
                        COUNT(*) as total_rows,
                        COUNT(${escapedColumn}) as non_null_count,
                        COUNT(*) - COUNT(${escapedColumn}) as null_count,
                        COUNT(DISTINCT ${escapedColumn}) as distinct_count,
                        MIN(${escapedColumn}::text) as min_value,
                        MAX(${escapedColumn}::text) as max_value
                    FROM ${escapedTable}
                `;
            
            case 'mysql':
                return `
                    SELECT 
                        COUNT(*) as total_rows,
                        COUNT(${escapedColumn}) as non_null_count,
                        COUNT(*) - COUNT(${escapedColumn}) as null_count,
                        COUNT(DISTINCT ${escapedColumn}) as distinct_count,
                        MIN(CAST(${escapedColumn} AS CHAR)) as min_value,
                        MAX(CAST(${escapedColumn} AS CHAR)) as max_value
                    FROM ${escapedTable}
                `;
            
            case 'sqlite':
                return `
                    SELECT 
                        COUNT(*) as total_rows,
                        COUNT(${escapedColumn}) as non_null_count,
                        COUNT(*) - COUNT(${escapedColumn}) as null_count,
                        COUNT(DISTINCT ${escapedColumn}) as distinct_count,
                        MIN(${escapedColumn}) as min_value,
                        MAX(${escapedColumn}) as max_value
                    FROM ${escapedTable}
                `;
            
            case 'snowflake':
                return `
                    SELECT 
                        COUNT(*) as total_rows,
                        COUNT(${escapedColumn}) as non_null_count,
                        COUNT(*) - COUNT(${escapedColumn}) as null_count,
                        COUNT(DISTINCT ${escapedColumn}) as distinct_count,
                        MIN(TO_VARCHAR(${escapedColumn})) as min_value,
                        MAX(TO_VARCHAR(${escapedColumn})) as max_value
                    FROM ${escapedTable}
                `;
            
            default:
                throw new Error(`Unsupported database type for column stats: ${databaseType}`);
        }
    }

    /**
     * Build most common values query for different database types
     */
    static buildMostCommonValuesQuery(databaseType: DatabaseType, tableName: string, columnName: string, limit: number = 10): string {
        const escapedTable = this.escapeIdentifier(databaseType, tableName);
        const escapedColumn = this.escapeIdentifier(databaseType, columnName);

        switch (databaseType) {
            case 'postgresql':
            case 'mysql':
            case 'snowflake':
                return `
                    SELECT ${escapedColumn} as value, COUNT(*) as frequency
                    FROM ${escapedTable}
                    WHERE ${escapedColumn} IS NOT NULL
                    GROUP BY ${escapedColumn}
                    ORDER BY frequency DESC
                    LIMIT ${limit}
                `;
            
            case 'sqlite':
                return `
                    SELECT ${escapedColumn} as value, COUNT(*) as frequency
                    FROM ${escapedTable}
                    WHERE ${escapedColumn} IS NOT NULL
                    GROUP BY ${escapedColumn}
                    ORDER BY frequency DESC
                    LIMIT ${limit}
                `;
            
            default:
                throw new Error(`Unsupported database type for most common values: ${databaseType}`);
        }
    }

    /**
     * Escape identifiers for different database types
     */
    static escapeIdentifier(databaseType: DatabaseType, identifier: string): string {
        switch (databaseType) {
            case 'postgresql':
                return `"${identifier.replace(/"/g, '""')}"`;
            
            case 'mysql':
                return `\`${identifier.replace(/`/g, '``')}\``;
            
            case 'sqlite':
                return `"${identifier.replace(/"/g, '""')}"`;
            
            case 'snowflake':
                return `"${identifier.replace(/"/g, '""')}"`;
            
            default:
                throw new Error(`Unsupported database type for identifier escaping: ${databaseType}`);
        }
    }

    /**
     * Build table filter for parameterized queries
     */
    static buildTableFilter(databaseType: DatabaseType, tableName: string, paramIndex: number = 1): string {
        switch (databaseType) {
            case 'postgresql':
                return `table_name = $${paramIndex}`;
            
            case 'mysql':
                return `table_name = ?`;
            
            case 'sqlite':
                return `name = ?`;
            
            case 'snowflake':
                return `table_name = ?`;
            
            default:
                throw new Error(`Unsupported database type for table filter: ${databaseType}`);
        }
    }
}

/**
 * EXPLAIN Result Parser
 * Parses EXPLAIN query results from different database types
 */
export class ExplainResultParser {
    /**
     * Parse EXPLAIN result based on database type
     */
    static parseExplainResult(databaseType: DatabaseType, rows: any[]): any[] {
        switch (databaseType) {
            case 'postgresql':
                return rows.map((row: any) => row['QUERY PLAN']);
            
            case 'mysql':
                return rows.map((row: any) =>
                    row.EXPLAIN ? JSON.parse(row.EXPLAIN) : row
                );
            
            case 'sqlite':
                return rows;
            
            case 'snowflake':
                return rows;
            
            default:
                throw new Error(`Unsupported database type for EXPLAIN parsing: ${databaseType}`);
        }
    }
} 