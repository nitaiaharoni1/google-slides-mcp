/**
 * Parameter Validation Utilities
 * Helper functions for validating parameters with helpful error messages
 */

import { createValidationError } from "../tools/index";
import { MCPResult } from "../types/mcp";

/**
 * Validate a number is within range and return helpful error if not
 */
export function validateNumberRange(
  value: number,
  paramName: string,
  min: number,
  max: number
): { valid: boolean; error?: MCPResult } {
  if (value < min || value > max) {
    return {
      valid: false,
      error: createValidationError(
        paramName,
        value,
        `Expected value between ${min} and ${max}`,
        `Use a value between ${min} and ${max}. Example: ${Math.round((min + max) / 2)}`
      ),
    };
  }
  return { valid: true };
}

/**
 * Clamp a value to range and return warning message
 */
export function clampWithWarning(
  value: number,
  min: number,
  max: number,
  paramName: string
): { value: number; warning?: string } {
  if (value < min) {
    return {
      value: min,
      warning: `${paramName} clamped from ${value} to ${min} (minimum)`,
    };
  }
  if (value > max) {
    return {
      value: max,
      warning: `${paramName} clamped from ${value} to ${max} (maximum)`,
    };
  }
  return { value };
}

/**
 * Validate enum value with "did you mean?" suggestions
 */
export function validateEnum(
  value: string,
  paramName: string,
  validOptions: string[],
  caseSensitive: boolean = false
): { valid: boolean; error?: MCPResult; suggestion?: string } {
  const normalizedValue = caseSensitive ? value : value.toUpperCase();
  const normalizedOptions = caseSensitive
    ? validOptions
    : validOptions.map((opt) => opt.toUpperCase());

  if (normalizedOptions.includes(normalizedValue)) {
    return { valid: true };
  }

  // Find closest match
  const suggestion = findClosestMatch(value, validOptions);

  return {
    valid: false,
    error: createValidationError(
      paramName,
      value,
      `Expected one of: ${validOptions.join(", ")}`,
      suggestion ? `Did you mean '${suggestion}'?` : undefined
    ),
    suggestion,
  };
}

/**
 * Find closest match in array using Levenshtein distance
 */
function findClosestMatch(
  value: string,
  options: string[]
): string | undefined {
  let minDistance = Infinity;
  let closest: string | undefined;

  for (const option of options) {
    const distance = levenshteinDistance(
      value.toLowerCase(),
      option.toLowerCase()
    );
    if (distance < minDistance && distance <= 2) {
      minDistance = distance;
      closest = option;
    }
  }

  return closest;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Validate with suggestions based on common patterns
 */
export function validateWithSuggestions(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any, // Value can be any type to validate
  paramName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validator: (val: any) => boolean, // Validator accepts any type
  expected: string,
  suggestion?: string
): { valid: boolean; error?: MCPResult } {
  if (validator(value)) {
    return { valid: true };
  }

  return {
    valid: false,
    error: createValidationError(paramName, value, expected, suggestion),
  };
}

/**
 * Validate string length
 */
export function validateStringLength(
  value: string,
  paramName: string,
  minLength?: number,
  maxLength?: number
): { valid: boolean; error?: MCPResult } {
  if (minLength !== undefined && value.length < minLength) {
    return {
      valid: false,
      error: createValidationError(
        paramName,
        value,
        `Expected at least ${minLength} characters`,
        `Provide a string with at least ${minLength} characters`
      ),
    };
  }

  if (maxLength !== undefined && value.length > maxLength) {
    return {
      valid: false,
      error: createValidationError(
        paramName,
        value,
        `Expected at most ${maxLength} characters`,
        `Provide a string with at most ${maxLength} characters. Current length: ${value.length}`
      ),
    };
  }

  return { valid: true };
}
