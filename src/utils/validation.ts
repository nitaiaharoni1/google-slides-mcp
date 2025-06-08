/**
 * Validation Utilities
 */

import { DANGEROUS_KEYWORDS } from '../config/constants';

/**
 * Validate SQL query for security
 */
export const validateQuery = (query: string): void => {
  if (!query || typeof query !== 'string') {
    throw new Error('Query must be a non-empty string');
  }

  const trimmedQuery = query.trim().toLowerCase();

  // Check for destructive keywords (only block truly dangerous operations)
  const hasDestructiveKeywords = DANGEROUS_KEYWORDS.some((keyword: string) =>
    trimmedQuery.includes(keyword.toLowerCase())
  );

  if (hasDestructiveKeywords) {
    throw new Error('Destructive operations (DROP, DELETE, TRUNCATE, GRANT, REVOKE) are not allowed for safety.');
  }
};

/**
 * Validate SQL identifier (table name, column name, etc.)
 */
export const validateIdentifier = (name: string): void => {
  if (!name || typeof name !== 'string') {
    throw new Error('Identifier must be a non-empty string');
  }

  // Basic SQL identifier validation
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw new Error('Invalid identifier format');
  }

  if (name.length > 63) {
    throw new Error('Identifier too long (max 63 characters)');
  }
}; 