/**
 * MCP Result Formatter
 * Centralized formatting for MCP tool responses
 */

import { MCPResult, MCPContent } from '../types/mcp';
import { DatabaseType } from '../types/database';

/**
 * Format successful MCP result
 */
export function formatSuccessResult(
  data: any,
  databaseType?: DatabaseType | null,
): MCPResult {
  const content: MCPContent[] = [
    {
      type: 'text',
      text: JSON.stringify(
        {
          success: true,
          data,
          ...(databaseType && { databaseType }),
        },
        null,
        2,
      ),
    },
  ];

  return { content };
}

/**
 * Format error MCP result
 */
export function formatErrorResult(
  message: string,
  databaseType?: DatabaseType | null,
): MCPResult {
  const content: MCPContent[] = [
    {
      type: 'text',
      text: JSON.stringify(
        {
          success: false,
          error: message,
          ...(databaseType && { databaseType }),
        },
        null,
        2,
      ),
    },
  ];

  return { content, isError: true };
}

/**
 * Format table not found error
 */
export function formatTableNotFoundError(
  tableName: string,
  databaseType: DatabaseType,
): MCPResult {
  return formatErrorResult(`Table '${tableName}' not found`, databaseType);
}

/**
 * Format column not found error
 */
export function formatColumnNotFoundError(
  columnName: string,
  tableName: string,
  databaseType: DatabaseType,
): MCPResult {
  return formatErrorResult(
    `Column '${columnName}' not found in table '${tableName}'`,
    databaseType,
  );
}

/**
 * Format validation error
 */
export function formatValidationError(
  message: string,
  databaseType: DatabaseType,
): MCPResult {
  return formatErrorResult(`Validation error: ${message}`, databaseType);
}

/**
 * Format query result
 */
export function formatQueryResult(
  result: any,
  executionTime: number,
  databaseType: DatabaseType,
  maxRows: number,
): MCPResult {
  const truncated = result.rows.length > maxRows;
  const displayRows = truncated ? result.rows.slice(0, maxRows) : result.rows;

  const data = {
    rows: displayRows,
    rowCount: result.rowCount,
    command: result.command,
    executionTimeMs: executionTime,
    databaseType,
    truncated,
    ...(truncated && { message: `Results truncated to ${maxRows} rows` }),
  };

  return formatSuccessResult(data, databaseType);
}

/**
 * Format explain result
 */
export function formatExplainResult(
  query: string,
  executionPlan: any[],
  analyzed: boolean,
  databaseType: DatabaseType,
): MCPResult {
  const data = {
    query,
    execution_plan: executionPlan,
    analyzed,
    databaseType,
  };

  return formatSuccessResult(data, databaseType);
}
