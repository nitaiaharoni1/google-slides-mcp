/**
 * Database Connection Manager
 * Manages database connections and provides utility functions
 */

import dotenv from 'dotenv';
import DatabaseFactory from './database/factory';
import DatabaseInterface from './database/base';
import { DatabaseType } from './types/database';

// Load environment variables
dotenv.config();

let database: DatabaseInterface | null = null;
let currentDatabaseType: DatabaseType | null = null;

/**
 * Initialize database connection
 */
export async function initializeDatabase(connectionString?: string): Promise<void> {
  const connStr = connectionString || process.env.DATABASE_URL;
  
  if (!connStr) {
    throw new Error('No database connection string provided');
  }

  try {
    // Close existing connection if any
    if (database) {
      await database.close();
    }

    // Create new database instance
    database = DatabaseFactory.create(connStr);
    currentDatabaseType = database.getType();
    
    // Connect to the database
    await database.connect();
    
    console.error(`✅ Database initialized: ${currentDatabaseType.toUpperCase()}`);
  } catch (error) {
    console.error('❌ Database initialization failed:', (error as Error).message);
    throw error;
  }
}

/**
 * Get the current database instance
 */
export function getDatabase(): DatabaseInterface {
  if (!database) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return database;
}

/**
 * Check if database is connected
 */
export function isDatabaseConnected(): boolean {
  return database ? database.getConnectionStatus() : false;
}

/**
 * Get current database type
 */
export function getDatabaseType(): DatabaseType | null {
  return currentDatabaseType;
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (database) {
    await database.close();
    database = null;
    currentDatabaseType = null;
    console.error('📴 Database connection closed');
  }
}

/**
 * Detect database type from connection string
 */
export function detectDatabaseType(connectionString: string): DatabaseType {
  return DatabaseFactory.detectDatabaseType(connectionString);
}

/**
 * Validate connection string
 */
export function validateConnectionString(connectionString: string) {
  return DatabaseFactory.validateConnectionString(connectionString);
}

/**
 * Get connection string examples
 */
export function getConnectionStringExamples() {
  return DatabaseFactory.getConnectionStringExamples();
}

/**
 * Ensure database is connected (utility function for tools)
 */
export function ensureDatabaseConnection(): DatabaseInterface {
  const db = getDatabase();
  
  if (!db.getConnectionStatus()) {
    throw new Error('Database connection lost. Please reconnect.');
  }
  
  return db;
} 