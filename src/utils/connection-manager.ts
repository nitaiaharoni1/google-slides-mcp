/**
 * Database Connection Manager
 * Handles common connection concerns across all database types with proper SSL support
 */

import {
  DatabaseType,
  SSLConfig,
  DatabaseConnectionInfo,
} from '../types/database';
import { CLOUD_PROVIDERS } from '../config/constants';
import { URL } from 'url';

export interface ParsedConnection {
  type: DatabaseType;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database: string;
  ssl: boolean;
  sslMode?: string;
}

export interface ConnectionConfig {
  [key: string]: any;
}

/**
 * Connection Manager for handling database connections with SSL/non-SSL support
 */
export class ConnectionManager {
  /**
   * Parse a connection string into structured components
   * @param connectionString - Database connection string
   * @returns ParsedConnection object
   */
  static parseConnectionString(connectionString: string): ParsedConnection {
    // Handle SQLite file paths
    if (
      !connectionString.includes('://') &&
      (connectionString.endsWith('.db') ||
        connectionString.endsWith('.sqlite') ||
        connectionString.endsWith('.sqlite3') ||
        connectionString.includes('/'))
    ) {
      return {
        type: 'sqlite',
        database: connectionString,
        ssl: false,
      };
    }

    try {
      const url = new URL(connectionString);
      const protocol = url.protocol.replace(':', '');

      // Determine database type
      let type: DatabaseType;
      if (protocol === 'postgresql' || protocol === 'postgres') {
        type = 'postgresql';
      } else if (protocol === 'mysql') {
        type = 'mysql';
      } else if (protocol === 'sqlite') {
        type = 'sqlite';
      } else {
        throw new Error(`Unsupported database type: ${protocol}`);
      }

      // Parse SSL settings
      const sslMode =
        url.searchParams.get('sslmode') || url.searchParams.get('ssl');
      const isCloudDb = this.isCloudDatabase(url.hostname);

      let ssl: boolean;
      if (sslMode) {
        ssl = sslMode !== 'disable' && sslMode !== 'false';
      } else {
        // Default to SSL for cloud databases, no SSL for localhost
        ssl = isCloudDb;
      }

      // For SQLite with sqlite:// protocol
      if (type === 'sqlite') {
        return {
          type: 'sqlite',
          database: url.pathname,
          ssl: false,
        };
      }

      return {
        type,
        host: url.hostname,
        port: url.port ? parseInt(url.port) : type === 'mysql' ? 3306 : 5432,
        username: url.username,
        password: url.password,
        database: url.pathname.replace('/', ''),
        ssl,
        sslMode:
          sslMode || (ssl ? (isCloudDb ? 'require' : 'prefer') : 'disable'),
      };
    } catch (error) {
      throw new Error(`Invalid connection string: ${error}`);
    }
  }

  /**
   * Build SSL configuration based on database type and requirements
   * @param type - Database type
   * @param sslEnabled - Whether SSL is enabled
   * @param sslMode - SSL mode (for PostgreSQL)
   * @param options - Additional SSL options
   * @returns SSL configuration object or false/undefined
   */
  static buildSSLConfig(
    type: DatabaseType,
    sslEnabled: boolean,
    sslMode?: string,
    options?: { relaxedVerification?: boolean },
  ): SSLConfig | false | undefined {
    if (!sslEnabled) {
      return type === 'sqlite' ? undefined : false;
    }

    if (type === 'sqlite') {
      return undefined; // SQLite doesn't use SSL
    }

    const baseConfig: SSLConfig = {
      rejectUnauthorized: !options?.relaxedVerification,
    };

    if (type === 'postgresql') {
      return {
        ...baseConfig,
        checkServerIdentity: options?.relaxedVerification
          ? () => undefined
          : undefined,
      };
    }

    return baseConfig;
  }

  /**
   * Build database-specific connection configuration
   * @param parsed - Parsed connection information
   * @returns Database-specific connection config
   */
  static buildConnectionConfig(parsed: ParsedConnection): ConnectionConfig {
    const sslConfig = this.buildSSLConfig(
      parsed.type,
      parsed.ssl,
      parsed.sslMode,
      {
        relaxedVerification:
          process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0' ||
          process.env.NODE_ENV === 'test',
      },
    );

    switch (parsed.type) {
      case 'postgresql':
        return {
          host: parsed.host,
          port: parsed.port,
          user: parsed.username,
          password: parsed.password,
          database: parsed.database,
          ssl: sslConfig,
          connectionTimeoutMillis: 30000,
          query_timeout: 30000,
          statement_timeout: 30000,
        };

      case 'mysql':
        return {
          host: parsed.host,
          port: parsed.port,
          user: parsed.username,
          password: parsed.password,
          database: parsed.database,
          ssl: sslConfig,
          connectTimeout: 30000,
          acquireTimeout: 30000,
          timeout: 30000,
        };

      case 'sqlite':
        // Import sqlite3 constants if available
        let mode = 0;
        try {
          const sqlite3 = require('sqlite3');
          mode = sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE;
        } catch {
          // Fallback to basic mode
          mode = 6; // READWRITE | CREATE
        }

        return {
          filename: parsed.database,
          mode,
        };

      default:
        throw new Error(`Unsupported database type: ${parsed.type}`);
    }
  }

  /**
   * Detect cloud provider from hostname
   * @param hostname - Database hostname
   * @returns Cloud provider name or 'unknown'
   */
  static detectCloudProvider(hostname: string): string {
    if (
      hostname.includes('rds.amazonaws.com') ||
      hostname.includes('amazonaws.com')
    ) {
      return 'aws';
    }
    if (hostname.includes('database.windows.net')) {
      return 'azure';
    }
    if (hostname.includes('ondigitalocean.com')) {
      return 'digitalocean';
    }
    if (hostname.includes('compute-1.amazonaws.com')) {
      return 'heroku';
    }
    if (hostname.includes(':') && hostname.split(':').length === 3) {
      return 'gcp'; // Google Cloud SQL connection string format
    }
    return 'unknown';
  }

  /**
   * Check if hostname indicates a cloud database
   * @param hostname - Database hostname
   * @returns True if cloud database
   */
  static isCloudDatabase(hostname: string): boolean {
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.')
    ) {
      return false;
    }
    return this.detectCloudProvider(hostname) !== 'unknown';
  }

  /**
   * Get recommended SSL mode based on environment and database location
   * @param environment - Current environment (production, development, test)
   * @param isCloudDatabase - Whether this is a cloud database
   * @returns Recommended SSL mode
   */
  static getRecommendedSSLMode(
    environment: string,
    isCloudDatabase: boolean,
  ): string {
    if (!isCloudDatabase) {
      return 'disable';
    }

    switch (environment) {
      case 'production':
        return 'require';
      case 'development':
        return 'prefer';
      case 'test':
        return 'prefer';
      default:
        return 'prefer';
    }
  }
}

/**
 * SSL Configuration Manager
 * Handles SSL setup for cloud providers
 */
export class SSLConfigManager {
  /**
   * Check if connection string indicates a cloud provider
   * @param {string} connectionString - Database connection string
   * @returns {boolean} - True if cloud provider detected
   */
  static isCloudProvider(connectionString: string): boolean {
    return (
      CLOUD_PROVIDERS.some((provider) => connectionString.includes(provider)) ||
      connectionString.includes('sslmode=require')
    );
  }

  /**
   * Get SSL configuration for cloud providers
   * @param {string} connectionString - Database connection string
   * @returns {Object|boolean} - SSL configuration or false
   */
  static getSSLConfig(connectionString: string): SSLConfig | false {
    // Check if we should use SSL at all
    const isCloudProvider = this.isCloudProvider(connectionString);
    const isTestEnv =
      process.env.NODE_ENV === 'test' ||
      process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0';
    const hasSSLMode =
      connectionString.includes('sslmode=require') ||
      connectionString.includes('ssl=true');

    // Debug logging - always show for connection issues
    console.error(`🔍 SSL Config Debug:`);
    console.error(
      `   - Connection: ${connectionString.replace(/:[^:@]*@/, ':***@')}`,
    );
    console.error(`   - Is Cloud Provider: ${isCloudProvider}`);
    console.error(`   - Has SSL Mode: ${hasSSLMode}`);
    console.error(`   - Is Test Env: ${isTestEnv}`);
    console.error(
      `   - NODE_TLS_REJECT_UNAUTHORIZED: ${process.env.NODE_TLS_REJECT_UNAUTHORIZED}`,
    );

    // For cloud providers or any SSL requirement, handle SSL configuration
    if (isCloudProvider || hasSSLMode) {
      // Enhanced SSL configuration for cloud providers with comprehensive certificate handling
      const config: SSLConfig = {
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined, // Skip server identity checks for cloud providers
        servername: undefined, // Don't specify servername to avoid SNI issues
      };

      // Set environment variable for broader Node.js SSL handling
      if (isCloudProvider && process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0') {
        console.error(
          `   - Setting NODE_TLS_REJECT_UNAUTHORIZED=0 for cloud provider`,
        );
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      }

      console.error(`   - SSL Config Generated: enhanced for cloud providers`);
      console.error(`   - rejectUnauthorized: false`);
      console.error(`   - checkServerIdentity: disabled`);

      return config;
    }

    // No SSL for local databases without explicit SSL requirements
    console.error(`   - SSL Config: false (no SSL)`);
    return false;
  }

  /**
   * Log SSL configuration status
   * @param {string} databaseType - Type of database
   * @param {Object|boolean} sslConfig - SSL configuration
   */
  static logSSLStatus(
    databaseType: DatabaseType,
    sslConfig: SSLConfig | boolean,
  ): void {
    if (sslConfig) {
      if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
        console.error(
          `⚠️  ${databaseType.toUpperCase()} SSL verification disabled via NODE_TLS_REJECT_UNAUTHORIZED`,
        );
      } else {
        console.error(
          `🔒 ${databaseType.toUpperCase()} SSL enabled with relaxed certificate verification for cloud providers`,
        );
      }
    } else {
      console.error(`🔓 ${databaseType.toUpperCase()} SSL disabled`);
    }
  }
}

/**
 * Connection Error Handler
 * Centralized error handling for database connections
 */
export class ConnectionErrorHandler {
  /**
   * Handle PostgreSQL connection errors
   * @param {Error} error - Connection error
   */
  static handlePostgreSQLError(error: Error): void {
    if (error.message.includes('self-signed certificate')) {
      console.error(
        '💡 SSL certificate issue - this should be automatically handled for cloud providers',
      );
      console.error(
        '💡 If using a local database, try setting NODE_TLS_REJECT_UNAUTHORIZED=0',
      );
    }
    if (error.message.includes('no pg_hba.conf entry')) {
      console.error('💡 Check if SSL is required for your database connection');
    }
    if (error.message.includes('timeout')) {
      console.error(
        '💡 Check your network connection and database availability',
      );
    }
  }

  /**
   * Handle MySQL connection errors
   * @param {Error} error - Connection error
   */
  static handleMySQLError(error: any): void {
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 MySQL server is not running or not accessible');
    }
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Check your MySQL username and password');
    }
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('💡 The specified database does not exist');
    }
    if (error.message && error.message.includes('timeout')) {
      console.error(
        '💡 Check your network connection and database availability',
      );
    }
  }

  /**
   * Handle SQLite connection errors
   * @param {Error} error - Connection error
   */
  static handleSQLiteError(error: any): void {
    if (error.code === 'SQLITE_CANTOPEN') {
      console.error(
        '💡 Cannot open SQLite database file - check file path and permissions',
      );
    }
    if (error.code === 'ENOENT') {
      console.error('💡 SQLite database file not found - check the file path');
    }
    if (error.message && error.message.includes('permission')) {
      console.error('💡 Permission denied - check file permissions');
    }
  }

  /**
   * Handle connection error based on database type
   * @param {string} databaseType - Type of database
   * @param {Error} error - Connection error
   */
  static handleError(databaseType: DatabaseType, error: Error): void {
    switch (databaseType) {
      case 'postgresql':
        this.handlePostgreSQLError(error);
        break;
      case 'mysql':
        this.handleMySQLError(error);
        break;
      case 'sqlite':
        this.handleSQLiteError(error);
        break;
      default:
        console.error('💡 Check your database connection and credentials');
    }
  }
}

/**
 * Connection Logger
 * Centralized logging for database connections
 */
export class ConnectionLogger {
  /**
   * Log successful connection
   * @param {string} databaseType - Type of database
   * @param {Object} connectionInfo - Connection information
   */
  static logSuccess(
    databaseType: DatabaseType,
    connectionInfo: DatabaseConnectionInfo,
  ): void {
    console.error(`✅ Connected to ${databaseType.toUpperCase()} database`);

    if (connectionInfo.serverTime) {
      console.error(`📅 Server time: ${connectionInfo.serverTime}`);
    }

    if (connectionInfo.version) {
      console.error(`🔧 Version: ${connectionInfo.version}`);
    }

    if (connectionInfo.filePath) {
      console.error(`📁 Database file: ${connectionInfo.filePath}`);
    }
  }

  /**
   * Log connection attempt
   * @param {string} databaseType - Type of database
   */
  static logAttempt(databaseType: DatabaseType): void {
    console.error(`🔄 Connecting to ${databaseType.toUpperCase()} database...`);
  }

  /**
   * Log connection failure
   * @param {string} databaseType - Type of database
   * @param {string} message - Error message
   */
  static logFailure(databaseType: DatabaseType, message: string): void {
    console.error(
      `❌ ${databaseType.toUpperCase()} connection failed: ${message}`,
    );
  }
}
