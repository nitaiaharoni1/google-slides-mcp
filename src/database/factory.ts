/**
 * Database Factory
 * Creates appropriate database instances based on connection strings
 */

import DatabaseInterface from './base';
import PostgreSQLDatabase from './postgresql';
import MySQLDatabase from './mysql';
import SQLiteDatabase from './sqlite';
import { DatabaseType, ValidationResult } from '../types/database';
import { SQLITE_EXTENSIONS, SUPPORTED_DATABASE_TYPES } from '../config/constants';

class DatabaseFactory {
    /**
     * Create a database instance based on connection string
     * @param {string} connectionString - Database connection string
     * @returns {DatabaseInterface} - Database implementation instance
     */
    static create(connectionString: string): DatabaseInterface {
        const dbType = this.detectDatabaseType(connectionString);
        
        switch (dbType) {
            case 'postgresql':
                return new PostgreSQLDatabase(connectionString);
            case 'mysql':
                return new MySQLDatabase(connectionString);
            case 'sqlite':
                return new SQLiteDatabase(connectionString);
            default:
                throw new Error(`Unsupported database type: ${dbType}`);
        }
    }

    /**
     * Detect database type from connection string
     * @param {string} connectionString - Database connection string
     * @returns {string} - Database type (postgresql, mysql, sqlite)
     */
    static detectDatabaseType(connectionString: string): DatabaseType {
        const lowerStr = connectionString.toLowerCase();

        // PostgreSQL detection
        if (lowerStr.startsWith('postgresql://') || 
            lowerStr.startsWith('postgres://') ||
            lowerStr.includes('postgres')) {
            return 'postgresql';
        }

        // MySQL detection
        if (lowerStr.startsWith('mysql://') || 
            lowerStr.includes('mysql')) {
            return 'mysql';
        }

        // SQLite detection - file paths or sqlite:// protocol
        if (lowerStr.startsWith('sqlite://') ||
            lowerStr.startsWith('sqlite:') ||
            lowerStr.startsWith('./') ||
            lowerStr.startsWith('/') ||
            lowerStr.startsWith('../') ||
            SQLITE_EXTENSIONS.some(ext => lowerStr.endsWith(ext))) {
            return 'sqlite';
        }

        // Default fallback - try to parse as URL
        try {
            const url = new URL(connectionString);
            const protocol = url.protocol.replace(':', '');
            
            if (SUPPORTED_DATABASE_TYPES.includes(protocol as DatabaseType)) {
                return protocol as DatabaseType;
            }
        } catch {
            // Not a valid URL, might be a file path
            if (connectionString.includes('/') || connectionString.includes('\\')) {
                return 'sqlite';
            }
        }

        throw new Error(`Cannot detect database type from connection string: ${connectionString}`);
    }

    /**
     * Get supported database types
     * @returns {Array<string>} - Array of supported database types
     */
    static getSupportedTypes() {
        return ['postgresql', 'mysql', 'sqlite'];
    }

    /**
     * Get database type display name
     * @param {string} type - Database type
     * @returns {string} - Display name
     */
    static getDisplayName(type: DatabaseType): string {
        const displayNames: Record<DatabaseType, string> = {
            'postgresql': 'PostgreSQL',
            'mysql': 'MySQL',
            'sqlite': 'SQLite'
        };
        return displayNames[type] || type;
    }

    /**
     * Get example connection strings for each database type
     * @returns {Object} - Object with example connection strings
     */
    static getConnectionStringExamples() {
        return {
            postgresql: [
                'postgresql://username:password@hostname:5432/database',
                'postgres://user@localhost/mydb',
                'postgresql://user:pass@db.example.com:5432/production?sslmode=require'
            ],
            mysql: [
                'mysql://username:password@hostname:3306/database',
                'mysql://user@localhost/mydb',
                'mysql://user:pass@db.example.com:3306/production?ssl=true'
            ],
            sqlite: [
                './database.db',
                '/path/to/database.sqlite',
                '../data/app.sqlite3',
                'sqlite:///path/to/database.db'
            ]
        };
    }

    /**
     * Validate connection string format
     * @param {string} connectionString - Connection string to validate
     * @returns {Object} - Validation result with isValid and errors
     */
    static validateConnectionString(connectionString: string): ValidationResult {
        const errors: string[] = [];

        if (!connectionString || connectionString.trim().length === 0) {
            return {
                isValid: false,
                errors: ['Connection string is required'],
                type: null
            };
        }

        try {
            const type = this.detectDatabaseType(connectionString);
            
            // Type-specific validations
            switch (type) {
                case 'postgresql':
                    this._validatePostgreSQLString(connectionString, errors);
                    break;
                case 'mysql':
                    this._validateMySQLString(connectionString, errors);
                    break;
                case 'sqlite':
                    this._validateSQLiteString(connectionString, errors);
                    break;
            }

            return {
                isValid: errors.length === 0,
                errors,
                type
            };
        } catch (error) {
            return {
                isValid: false,
                errors: [(error as Error).message],
                type: null
            };
        }
    }

    // Private validation methods
    private static _validatePostgreSQLString(connectionString: string, errors: string[]): void {
        try {
            const url = new URL(connectionString);
            
            if (!url.hostname) {
                errors.push('PostgreSQL connection string must include hostname');
            }
            
            if (!url.pathname || url.pathname === '/') {
                errors.push('PostgreSQL connection string must include database name');
            }
            
            if (!url.username) {
                errors.push('PostgreSQL connection string must include username');
            }
        } catch {
            errors.push('Invalid PostgreSQL connection string format');
        }
    }

    private static _validateMySQLString(connectionString: string, errors: string[]): void {
        try {
            const url = new URL(connectionString);
            
            if (!url.hostname) {
                errors.push('MySQL connection string must include hostname');
            }
            
            if (!url.pathname || url.pathname === '/') {
                errors.push('MySQL connection string must include database name');
            }
            
            if (!url.username) {
                errors.push('MySQL connection string must include username');
            }
        } catch {
            errors.push('Invalid MySQL connection string format');
        }
    }

    private static _validateSQLiteString(connectionString: string, errors: string[]): void {
        const cleanPath = connectionString.replace(/^sqlite:\/\//, '').replace(/^sqlite:/, '');
        
        if (cleanPath.length === 0) {
            errors.push('SQLite connection string must include file path');
        }
        
        // Check for valid file extension
        const hasValidExtension = SQLITE_EXTENSIONS.some(ext => 
            cleanPath.toLowerCase().endsWith(ext)
        );
        
        if (!hasValidExtension && !cleanPath.includes('/')) {
            errors.push(`SQLite file should have one of these extensions: ${SQLITE_EXTENSIONS.join(', ')}`);
        }
    }
}

export default DatabaseFactory; 