/**
 * Jest Test Setup
 * Global configuration and utilities for database testing
 */

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Intelligent SSL handling based on environment and connection string
function configureSSL() {
  const databaseUrl = process.env.DATABASE_URL;
  const nodeEnv = process.env.NODE_ENV || 'test';
  
  if (!databaseUrl) {
    return;
  }

  // Parse connection string to determine SSL requirements
  const isLocalhost = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');
  const hasSSLMode = databaseUrl.includes('sslmode=');
  const sslMode = hasSSLMode ? new URL(databaseUrl).searchParams.get('sslmode') : null;
  
  // Only disable SSL verification for:
  // 1. Cloud databases with explicit relaxed verification needs
  // 2. Development/test environments with cloud databases that have certificate issues
  const shouldRelaxSSL = !isLocalhost && 
                        (nodeEnv === 'test' || nodeEnv === 'development') &&
                        sslMode !== 'require';

  if (shouldRelaxSSL && process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0') {
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = '0';
    console.warn('⚠️  TLS certificate verification relaxed for testing environment');
  }
}

// Configure SSL based on environment
configureSSL();

// Global test timeout for database operations
jest.setTimeout(30000);

// Global teardown
afterAll(async () => {
  // Allow time for connections to close
  await new Promise(resolve => setTimeout(resolve, 500));
});

// Test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidDatabaseResult(): R;
      toHaveValidQueryStructure(): R;
    }
  }
}

// Custom matchers
expect.extend({
  toBeValidDatabaseResult(received) {
    const pass = received && 
                 typeof received === 'object' &&
                 Array.isArray(received.rows) &&
                 typeof received.rowCount === 'number';
    
    if (pass) {
      return {
        message: () => `Expected ${received} not to be a valid database result`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected ${received} to be a valid database result with rows array and rowCount`,
        pass: false,
      };
    }
  },

  toHaveValidQueryStructure(received) {
    const pass = received &&
                 typeof received === 'object' &&
                 received.content &&
                 Array.isArray(received.content);
    
    if (pass) {
      return {
        message: () => `Expected ${received} not to have valid MCP query structure`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected ${received} to have valid MCP query structure with content array`,
        pass: false,
      };
    }
  },
});

export {}; 