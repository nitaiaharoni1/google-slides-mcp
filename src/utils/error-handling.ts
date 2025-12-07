/**
 * Error handling utilities
 * Retry logic, partial success handling, and graceful degradation
 */

import { logger } from "./logger";

/**
 * Error types
 */
export enum ErrorType {
  RATE_LIMIT = "RATE_LIMIT",
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
  INVALID_REQUEST = "INVALID_REQUEST",
  NOT_FOUND = "NOT_FOUND",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  NETWORK_ERROR = "NETWORK_ERROR",
  UNKNOWN = "UNKNOWN",
}

/**
 * Classify error type from error message or code
 */
export function classifyError(error: Error | string): ErrorType {
  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("rate limit") ||
    lowerMessage.includes("quota exceeded") ||
    lowerMessage.includes("write requests per minute")
  ) {
    return ErrorType.RATE_LIMIT;
  }

  if (lowerMessage.includes("quota")) {
    return ErrorType.QUOTA_EXCEEDED;
  }

  if (
    lowerMessage.includes("invalid") ||
    lowerMessage.includes("bad request") ||
    lowerMessage.includes("400")
  ) {
    return ErrorType.INVALID_REQUEST;
  }

  if (
    lowerMessage.includes("not found") ||
    lowerMessage.includes("404") ||
    lowerMessage.includes("does not exist")
  ) {
    return ErrorType.NOT_FOUND;
  }

  if (
    lowerMessage.includes("permission") ||
    lowerMessage.includes("forbidden") ||
    lowerMessage.includes("403") ||
    lowerMessage.includes("unauthorized") ||
    lowerMessage.includes("401")
  ) {
    return ErrorType.PERMISSION_DENIED;
  }

  if (
    lowerMessage.includes("network") ||
    lowerMessage.includes("timeout") ||
    lowerMessage.includes("econnreset") ||
    lowerMessage.includes("enotfound")
  ) {
    return ErrorType.NETWORK_ERROR;
  }

  return ErrorType.UNKNOWN;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  retryableErrors: ErrorType[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    ErrorType.RATE_LIMIT,
    ErrorType.QUOTA_EXCEEDED,
    ErrorType.NETWORK_ERROR,
  ],
};

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | string | undefined;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      lastError = errorObj;
      const errorType = classifyError(errorObj);

      // Check if error is retryable
      if (!finalConfig.retryableErrors.includes(errorType)) {
        throw errorObj; // Don't retry non-retryable errors
      }

      // Don't retry on last attempt
      if (attempt === finalConfig.maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        finalConfig.initialDelay *
          Math.pow(finalConfig.backoffMultiplier, attempt),
        finalConfig.maxDelay
      );

      logger.warn(
        `⚠️  Retry attempt ${attempt + 1}/${finalConfig.maxRetries} after ${delay}ms (${errorType})`
      );

      await sleep(delay);
    }
  }

  if (lastError === undefined) {
    throw new Error("Retry failed but no error was captured");
  }
  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error(String(lastError));
}

/**
 * Partial success result
 */
export interface PartialSuccessResult<T> {
  succeeded: T[];
  failed: Array<{ item: unknown; error: Error }>;
  partial: boolean;
}

/**
 * Execute operations with partial success handling
 * Continues processing remaining items even if some fail
 */
export async function executeWithPartialSuccess<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  stopOnFirstError: boolean = false
): Promise<PartialSuccessResult<R>> {
  const succeeded: R[] = [];
  const failed: Array<{ item: T; error: Error }> = [];

  for (const item of items) {
    try {
      const result = await operation(item);
      succeeded.push(result);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      failed.push({ item, error: err });

      if (stopOnFirstError) {
        break;
      }
    }
  }

  return {
    succeeded,
    failed,
    partial: failed.length > 0 && succeeded.length > 0,
  };
}

/**
 * Get user-friendly error message with suggestions
 */
export function getErrorMessage(
  error: Error | string,
  context?: string
): { message: string; suggestion?: string } {
  const errorType = classifyError(error);
  const baseMessage = error instanceof Error ? error.message : String(error);

  let suggestion: string | undefined;

  switch (errorType) {
    case ErrorType.RATE_LIMIT:
      suggestion =
        "Wait a moment and try again. Consider batching operations or reducing request frequency.";
      break;
    case ErrorType.QUOTA_EXCEEDED:
      suggestion =
        "API quota exceeded. Wait before retrying or check your quota limits.";
      break;
    case ErrorType.INVALID_REQUEST:
      suggestion =
        "Check that all required parameters are provided and valid. Review the API documentation.";
      break;
    case ErrorType.NOT_FOUND:
      suggestion =
        "The requested resource doesn't exist. Verify the ID is correct and the resource hasn't been deleted.";
      break;
    case ErrorType.PERMISSION_DENIED:
      suggestion =
        "You don't have permission to perform this operation. Check your authentication and access rights.";
      break;
    case ErrorType.NETWORK_ERROR:
      suggestion =
        "Network error occurred. Check your internet connection and try again.";
      break;
    default:
      suggestion = "An unexpected error occurred. Please try again.";
  }

  const message = context ? `${context}: ${baseMessage}` : baseMessage;

  return { message, suggestion };
}

/**
 * Wrap an async function with error handling
 */
export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      const { message, suggestion } = getErrorMessage(errorObj, context);
      const enhancedError = new Error(message) as Error & {
        suggestion?: string;
      };
      if (suggestion) {
        enhancedError.suggestion = suggestion;
      }
      throw enhancedError;
    }
  };
}
