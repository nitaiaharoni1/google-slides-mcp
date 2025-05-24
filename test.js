#!/usr/bin/env node

/**
 * Simple test script for PostgreSQL MCP Server
 */

require('dotenv').config();

// Handle SSL certificate issues for development/testing
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '1') {
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
  console.warn('⚠️  TLS certificate verification disabled for testing');
}

const { Client } = require('pg');

async function testConnection() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined
    }
  });

  try {
    console.log('🔄 Testing database connection...');
    await client.connect();
    
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    const { current_time, db_version } = result.rows[0];
    
    console.log('✅ Connection successful!');
    console.log(`📅 Server time: ${current_time}`);
    console.log(`🔧 Version: ${db_version.split(',')[0]}`);
    
    // Test table listing
    const tables = await client.query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log(`📋 Found ${tables.rows[0].table_count} tables in public schema`);
    
    // Test a simple query
    const testQuery = await client.query('SELECT 1 as test_value');
    console.log(`🧪 Test query successful: ${testQuery.rows[0].test_value}`);
    
    console.log('\n🎉 All tests passed! Your PostgreSQL MCP server should work correctly.');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    // Provide helpful debugging info
    if (error.message.includes('self-signed certificate')) {
      console.error('💡 SSL certificate issue detected');
      console.error('   This is common with cloud providers like DigitalOcean');
      console.error('   The MCP server handles this automatically');
    }
    if (error.message.includes('no pg_hba.conf entry')) {
      console.error('💡 Database requires SSL connection');
      console.error('   Make sure your connection string includes sslmode=require');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

testConnection();
