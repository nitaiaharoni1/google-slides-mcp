/**
 * Database discovery and search MCP tools
 * Supports PostgreSQL, MySQL, and SQLite databases
 */

import { getDatabase, getDatabaseType } from '../database';
import { MAX_SEARCH_RESULTS } from '../config/constants';
import { formatSuccessResult } from '../utils/result-formatter';
import { MCPToolDefinition, SearchTablesArgs } from '../types/mcp';

/**
 * Search for tables and columns by name or pattern
 */
const searchTables = async (args: SearchTablesArgs) => {
  const db = getDatabase();
  const dbType = getDatabaseType();
  const searchTerm = args.search_term.toLowerCase();
  const limit = args.limit || MAX_SEARCH_RESULTS;

  console.error(
    `🔍 Searching for '${searchTerm}' in ${dbType?.toUpperCase()} database`,
  );

  // Get all tables first
  const tablesQuery = db.getSchemaQueries().listTables;
  const tablesResult = await db.query(tablesQuery);

  // Filter tables by search term
  const matchingTables = tablesResult.rows
    .filter((table: any) =>
      table.table_name?.toLowerCase().includes(searchTerm),
    )
    .slice(0, limit);

  // Search columns in all tables
  const columnMatches = [];
  for (const table of tablesResult.rows.slice(0, 50)) {
    // Limit to avoid too many queries
    try {
      const columnQuery = db.getSchemaQueries().describeTable;
      const columnResult = await db.query(columnQuery, [table.table_name]);

      const matchingColumns = columnResult.rows.filter((column: any) =>
        column.column_name?.toLowerCase().includes(searchTerm),
      );

      for (const column of matchingColumns) {
        columnMatches.push({
          table_name: table.table_name,
          column_name: column.column_name,
          data_type: column.data_type,
          is_nullable: column.is_nullable,
        });
      }

      // Stop if we have enough matches
      if (columnMatches.length >= limit) {
        break;
      }
    } catch (error) {
      // Skip tables we can't access
      continue;
    }
  }

  // Limit column matches
  const limitedColumnMatches = columnMatches.slice(0, limit);

  console.error(
    `✅ Found ${matchingTables.length} table matches and ${limitedColumnMatches.length} column matches`,
  );

  return formatSuccessResult(
    {
      search_term: args.search_term,
      table_matches: matchingTables,
      column_matches: limitedColumnMatches,
      total_table_matches: matchingTables.length,
      total_column_matches: limitedColumnMatches.length,
      databaseType: dbType,
    },
    dbType,
  );
};

// Tool definitions
export const discoveryTools: MCPToolDefinition[] = [
  {
    name: 'search_tables',
    description:
      'Search for tables and columns by name or pattern. Works with PostgreSQL, MySQL, and SQLite.',
    inputSchema: {
      type: 'object',
      properties: {
        search_term: {
          type: 'string',
          description: 'Search term to find in table and column names',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 50)',
          default: 50,
        },
      },
      required: ['search_term'],
    },
    handler: searchTables,
  },
];
