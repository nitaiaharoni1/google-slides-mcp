# Contributing database-mcp to Docker MCP Registry

This guide will help you add `database-mcp` to the official Docker MCP Registry.

## Prerequisites

1. **Go v1.24+** - Install from https://go.dev/dl/
2. **Docker Desktop** - Install from https://www.docker.com/products/docker-desktop/
3. **Task** - Install Task runner: https://taskfile.dev/installation/

## Step-by-Step Process

### 1. Fork and Clone the Docker MCP Registry

```bash
# Fork the repository at: https://github.com/docker/mcp-registry
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/mcp-registry.git
cd mcp-registry
```

### 2. Use the Task Wizard (Easiest Method)

The wizard will guide you through creating the server configuration:

```bash
task wizard
```

When prompted:
- **GitHub repo URL**: `https://github.com/nitaiaharoni1/database-mcp`
- **Category**: `database`
- **Environment variables**: `DATABASE_URL` (required)

### 3. Alternative: Use Task Create Command

If you prefer the command line:

```bash
task create -- --category database https://github.com/nitaiaharoni1/database-mcp -e DATABASE_URL=postgresql://user:pass@localhost:5432/testdb
```

This will:
- Build the Docker image using the Dockerfile
- Verify the MCP server can list tools
- Create `./servers/database-mcp/server.yaml` with proper configuration

### 4. Review the Generated Configuration

The generated `server.yaml` should look similar to:

```yaml
name: database-mcp
image: mcp/database-mcp
type: server
meta:
  category: database
  tags:
    - database
    - postgresql
    - mysql
    - sqlite
    - snowflake
about:
  title: Database MCP Server
  description: Model Context Protocol server for multi-database access (PostgreSQL, MySQL, SQLite, Snowflake) with comprehensive introspection and analysis tools
  icon: https://avatars.githubusercontent.com/u/YOUR_USER_ID?s=200&v=4
source:
  project: https://github.com/nitaiaharoni1/database-mcp
  commit: <latest-commit-hash>
config:
  description: Configure the connection to your database
  secrets:
    - name: database-mcp.database_url
      env: DATABASE_URL
      example: postgresql://user:pass@host:port/db
```

### 5. Create tools.json (Important!)

Since `database-mcp` needs `DATABASE_URL` to be configured before it can list tools, create a `tools.json` file:

```bash
# Create tools.json in servers/database-mcp/
cat > servers/database-mcp/tools.json << 'EOF'
[
  {
    "name": "query_database",
    "description": "Execute a SQL query on the database. Supports PostgreSQL, MySQL, and SQLite.",
    "arguments": [
      {
        "name": "query",
        "type": "string",
        "desc": "SQL query to execute (SELECT, INSERT, UPDATE, ALTER, CREATE statements allowed)"
      }
    ]
  },
  {
    "name": "explain_query",
    "description": "Get the execution plan for a SQL query without executing it.",
    "arguments": [
      {
        "name": "query",
        "type": "string",
        "desc": "SQL query to explain"
      },
      {
        "name": "analyze",
        "type": "boolean",
        "desc": "Whether to include actual execution statistics"
      }
    ]
  },
  {
    "name": "list_schemas",
    "description": "List all available schemas/databases"
  },
  {
    "name": "list_tables",
    "description": "List tables and views with details"
  },
  {
    "name": "describe_table",
    "description": "Get detailed table structure and column information",
    "arguments": [
      {
        "name": "table_name",
        "type": "string",
        "desc": "Name of the table to describe"
      }
    ]
  },
  {
    "name": "list_indexes",
    "description": "List all indexes and their properties",
    "arguments": [
      {
        "name": "table_name",
        "type": "string",
        "desc": "Optional table name to filter indexes"
      }
    ]
  },
  {
    "name": "get_foreign_keys",
    "description": "Discover foreign key relationships",
    "arguments": [
      {
        "name": "table_name",
        "type": "string",
        "desc": "Optional table name to filter foreign keys"
      }
    ]
  },
  {
    "name": "list_functions",
    "description": "List stored procedures and functions"
  },
  {
    "name": "get_table_stats",
    "description": "Get table statistics (row counts, sizes)",
    "arguments": [
      {
        "name": "schema_name",
        "type": "string",
        "desc": "Schema name to analyze (defaults to public schema)"
      }
    ]
  },
  {
    "name": "get_database_info",
    "description": "Get database version and configuration"
  },
  {
    "name": "analyze_column",
    "description": "Analyze column data distribution and statistics",
    "arguments": [
      {
        "name": "table_name",
        "type": "string",
        "desc": "Name of the table containing the column"
      },
      {
        "name": "column_name",
        "type": "string",
        "desc": "Name of the column to analyze"
      }
    ]
  },
  {
    "name": "search_tables",
    "description": "Search for tables and columns by name patterns",
    "arguments": [
      {
        "name": "pattern",
        "type": "string",
        "desc": "Search pattern for table or column names"
      }
    ]
  },
  {
    "name": "export_to_csv",
    "description": "Execute a SQL query and export the results to a CSV file",
    "arguments": [
      {
        "name": "query",
        "type": "string",
        "desc": "SQL SELECT query to execute and export results"
      },
      {
        "name": "filepath",
        "type": "string",
        "desc": "Path where the CSV file should be created"
      },
      {
        "name": "include_headers",
        "type": "boolean",
        "desc": "Whether to include column headers in the CSV file"
      }
    ]
  },
  {
    "name": "get_connection_info",
    "description": "Check connection status and database details"
  }
]
EOF
```

### 6. Test Locally

Build and test your MCP server:

```bash
# Build the catalog (this will use tools.json instead of running the server)
task build -- --tools database-mcp

# Generate the catalog
task catalog -- database-mcp

# Import into Docker Desktop
docker mcp catalog import $PWD/catalogs/database-mcp/catalog.yaml

# Test in Docker Desktop MCP Toolkit
# Configure DATABASE_URL and enable the server
```

When done testing, reset the catalog:

```bash
docker mcp catalog reset
```

### 7. Open a Pull Request

1. **Commit your changes:**
   ```bash
   git add servers/database-mcp/
   git commit -m "Add database-mcp server"
   git push origin main
   ```

2. **Create PR on GitHub:**
   - Title: `Add database-mcp server`
   - Description: Include information about the server and what databases it supports

3. **Share test credentials:**
   - Use the form mentioned in CONTRIBUTING.md to share test database credentials with Docker team

4. **Wait for review:**
   - Docker team will review your PR
   - Once approved, it will be merged and available in 24 hours

## Important Notes

- ✅ **License**: Make sure your repository has a compatible license (MIT or Apache 2.0)
- ✅ **Dockerfile**: Must be at the root of your repository (already created)
- ✅ **tools.json**: Required since server needs DATABASE_URL before listing tools
- ✅ **Environment Variables**: Only `DATABASE_URL` is required
- ✅ **Documentation**: README.md should be clear and comprehensive

## Troubleshooting

### Build fails with "cannot list tools"
- Make sure `tools.json` exists in `servers/database-mcp/`
- The file should contain all available tools

### Docker build fails
- Ensure Dockerfile is at repository root
- Check that all dependencies are in package.json
- Verify Node.js version compatibility

### Catalog import fails
- Make sure you've run `task catalog -- database-mcp` first
- Check that catalog.yaml was generated successfully

## Resources

- [Docker MCP Registry](https://github.com/docker/mcp-registry)
- [MCP Documentation](https://modelcontextprotocol.io/)
- [Docker Desktop MCP Toolkit](https://docs.docker.com/desktop/mcp/)

