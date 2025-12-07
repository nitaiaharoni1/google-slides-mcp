/**
 * Centralized logging utility for MCP server
 *
 * Uses stderr for all output (required for MCP protocol - stdout is reserved for JSON-RPC)
 * Provides consistent formatting and prevents duplicate log entries
 */

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

/**
 * Logger class that writes to stderr with proper formatting
 * Uses a single write operation to prevent duplicate entries
 */
class Logger {
  private write(message: string, level: LogLevel = LogLevel.INFO): void {
    // Use process.stderr.write() synchronously to ensure single write operation
    // This prevents buffering issues that could cause duplicates
    const timestamp = new Date().toISOString();
    const levelTag = `[${level}]`;
    const logLine = `${timestamp} ${levelTag} ${message}\n`;

    try {
      // process.stderr.write() is synchronous when called with a string/buffer
      // and the stream is not in object mode (which stderr is not)
      process.stderr.write(logLine, "utf8");
    } catch {
      // Fallback to console.error if write fails
      console.error(logLine);
    }
  }

  debug(message: string): void {
    this.write(message, LogLevel.DEBUG);
  }

  info(message: string): void {
    this.write(message, LogLevel.INFO);
  }

  warn(message: string): void {
    this.write(message, LogLevel.WARN);
  }

  error(message: string): void {
    this.write(message, LogLevel.ERROR);
  }

  /**
   * Log success messages (operations that completed successfully)
   */
  success(message: string): void {
    this.write(message, LogLevel.INFO);
  }

  /**
   * Log operation start/progress messages
   */
  progress(message: string): void {
    this.write(message, LogLevel.INFO);
  }
}

// Export singleton instance
export const logger = new Logger();
