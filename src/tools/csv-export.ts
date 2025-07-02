/**
 * CSV Export MCP tool
 * Execute SQL queries and export results to CSV files
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as createCsvWriter from 'csv-writer';
import { getDatabase, getDatabaseType } from '../database';
import { formatSuccessResult, formatErrorResult } from '../utils/result-formatter';
import { MCPToolDefinition } from '../types/mcp';

export interface ExportToCsvArgs {
  query: string;
  filepath: string;
  include_headers?: boolean;
}

/**
 * Get the desktop path for the current user
 */
function getDesktopPath(): string {
  const homeDir = os.homedir();
  return path.join(homeDir, 'Desktop');
}

/**
 * Resolve the file path - if it's just a filename, save to desktop
 */
function resolveFilePath(filepath: string): string {
  // If it's already an absolute path, use it as is
  if (path.isAbsolute(filepath)) {
    return filepath;
  }
  
  // If it contains path separators, treat it as a relative path from current directory
  if (filepath.includes('/') || filepath.includes('\\')) {
    return path.resolve(filepath);
  }
  
  // If it's just a filename, save to desktop
  return path.join(getDesktopPath(), filepath);
}

/**
 * Execute a SQL query and export results to CSV file
 */
const exportToCSV = async (args: ExportToCsvArgs) => {
  const db = getDatabase();
  if (!db) {
    throw new Error('Database not connected');
  }

  const { query, filepath, include_headers = true } = args;
  
  // Resolve the file path (defaults to desktop if just a filename)
  const resolvedFilePath = resolveFilePath(filepath);

  // Validate the query
  const validatedQuery = db.validateQuery(query);
  const dbType = getDatabaseType();

  console.error(
    `🔍 Executing ${dbType?.toUpperCase()} query for CSV export: ${validatedQuery.substring(0, 100)}${validatedQuery.length > 100 ? '...' : ''}`,
  );

  try {
    // Execute the query
    const startTime = Date.now();
    const result = await db.query(validatedQuery);
    const executionTime = Date.now() - startTime;

    console.error(
      `✅ Query executed in ${executionTime}ms, returned ${result.rowCount} rows`,
    );

    // Check if we have results
    if (!result.rows || result.rows.length === 0) {
      return formatSuccessResult(
        {
          message: 'Query executed successfully but returned no rows',
          filepath: resolvedFilePath,
          rowCount: 0,
          executionTimeMs: executionTime,
          databaseType: dbType,
        },
        dbType!,
      );
    }

    // Ensure directory exists
    const dir = path.dirname(resolvedFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Get column names from the first row
    const columns = Object.keys(result.rows[0]);
    
    // Create CSV writer configuration
    const csvWriter = createCsvWriter.createObjectCsvWriter({
      path: resolvedFilePath,
      header: columns.map(col => ({ id: col, title: col })),
      append: false, // Always create a new file
    });

    // Write data to CSV
    await csvWriter.writeRecords(result.rows);

    console.error(`📄 CSV file written successfully: ${resolvedFilePath}`);

    return formatSuccessResult(
      {
        message: 'Query results exported to CSV successfully',
        filepath: resolvedFilePath,
        rowCount: result.rowCount,
        columnCount: columns.length,
        columns,
        executionTimeMs: executionTime,
        databaseType: dbType,
        fileSize: fs.statSync(resolvedFilePath).size,
      },
      dbType!,
    );

  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error(`❌ CSV export failed: ${errorMessage}`);
    
    // Clean up partial file if it exists
    try {
      if (fs.existsSync(resolvedFilePath)) {
        fs.unlinkSync(resolvedFilePath);
      }
    } catch (cleanupError) {
      console.error(`⚠️ Failed to clean up partial file: ${cleanupError}`);
    }

    return formatErrorResult(
      `Failed to export query results to CSV: ${errorMessage}`,
      dbType!,
    );
  }
};

// Tool definition
export const csvExportTools: MCPToolDefinition[] = [
  {
    name: 'export_to_csv',
    description:
      'Execute a SQL query and export the results to a CSV file. Supports PostgreSQL, MySQL, and SQLite. Allows SELECT queries only for CSV export. The CSV file will include column headers by default and will be created with proper formatting. If only a filename is provided, the file will be saved to the user\'s Desktop.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'SQL SELECT query to execute and export results. Only SELECT statements are recommended for CSV export.',
        },
        filepath: {
          type: 'string',
          description:
            'Path where the CSV file should be created. Can be:\n' +
            '- Full absolute path: "/path/to/output/results.csv"\n' +
            '- Relative path: "folder/results.csv"\n' +
            '- Just filename: "results.csv" (will be saved to Desktop)\n' +
            'Directory will be created if it doesn\'t exist.',
        },
        include_headers: {
          type: 'boolean',
          description:
            'Whether to include column headers in the CSV file. Defaults to true.',
          default: true,
        },
      },
      required: ['query', 'filepath'],
    },
    handler: exportToCSV,
  },
]; 