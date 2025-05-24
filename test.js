#!/usr/bin/env node

/**
 * Simple test script for PostgreSQL MCP Server
 */

require('dotenv').config();

const { Client } = require('pg');

async function testConnection() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('sslmode=require') ? {
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined
    } : false
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
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testConnection();
