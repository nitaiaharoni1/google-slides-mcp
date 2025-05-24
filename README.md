# PostgreSQL MCP Server

A Model Context Protocol (MCP) server that provides Claude with direct access to PostgreSQL databases. This server enables Claude to query, analyze, and interact with your PostgreSQL database through natural language conversations.

## Quick Install

```bash
# Install globally (recommended)
npm install -g postgresql-mcp-server

# Automatically configure Claude Desktop
postgresql-mcp-server --configure

# Or use without installing
npx postgresql-mcp-server --configure
```

That's it! The server will automatically detect your OS and configure Claude Desktop for you.

**Prefer manual configuration?** Use `postgresql-mcp-server --find-config` to locate your Claude Desktop config file and get setup instructions.

Then configure Claude Desktop (see [Installation](#installation) for details).

## Features

- 🔐 **Secure SSL/TLS connections** - Works with cloud providers like DigitalOcean, AWS RDS, Google Cloud SQL
- 📊 **Comprehensive database introspection** - List tables, schemas, indexes, foreign keys, and functions
- 🔍 **Advanced query capabilities** - Execute SELECT queries with detailed results and execution plans
- 📈 **Database analytics** - Table statistics, column analysis, and performance insights
- 🔗 **Relationship mapping** - Discover foreign key relationships and database structure
- 🛡️ **Safe by design** - Read-only operations to prevent accidental data modification
- 🔎 **Smart search** - Find tables and columns by name patterns
- ⚡ **Easy setup** - Simple configuration and comprehensive testing

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Claude Desktop](https://claude.ai/desktop) installed
- Access to a PostgreSQL database

### Quick Start

Choose one of the installation methods below:

#### Method 1: Automatic Configuration (Recommended)

1. **Install globally via npm:**
   ```bash
   npm install -g postgresql-mcp-server
   ```

2. **Automatically configure Claude Desktop:**
   ```bash
   postgresql-mcp-server --configure
   ```
   
   This command will:
   - Detect your operating system (macOS, Linux, Windows)
   - Find your Claude Desktop configuration file
   - Add the PostgreSQL MCP server configuration
   - Use your existing `DATABASE_URL` environment variable
   
3. **Set your database connection (if not already set):**
   ```bash
   export DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
   ```

4. **Restart Claude Desktop** and start chatting!

#### Method 2: Using npx (No Installation)

```bash
# Configure Claude Desktop without installing
npx postgresql-mcp-server --configure
```

#### Method 3: Manual Configuration

If you prefer to configure manually or the automatic configuration doesn't work:

1. **Install the package:**
   ```bash
   npm install -g postgresql-mcp-server
   ```

2. **Find your Claude Desktop config file location:**
   ```bash
   postgresql-mcp-server --find-config
   ```
   
   This will show you:
   - Your OS-specific config file path
   - Whether the file already exists
   - Whether PostgreSQL MCP is already configured
   - Complete manual configuration instructions

3. **Manually edit Claude Desktop configuration:**
   
   Open the configuration file shown by the previous command in your text editor and add:

   ```json
   {
     "mcpServers": {
       "postgresql": {
         "command": "postgresql-mcp-server",
         "env": {
           "DATABASE_URL": "postgresql://username:password@host:port/database?sslmode=require"
         }
       }
     }
   }
   ```

4. **Restart Claude Desktop**

#### Method 4: Local Installation

1. **Create a project directory:**
   ```bash
   mkdir my-mcp-servers && cd my-mcp-servers
   npm init -y
   ```

2. **Install locally:**
   ```bash
   npm install postgresql-mcp-server
   ```

3. **Configure Claude Desktop:**

   ```json
   {
     "mcpServers": {
       "postgresql": {
         "command": "node",
         "args": ["/path/to/my-mcp-servers/node_modules/postgresql-mcp-server/server.js"],
         "env": {
           "DATABASE_URL": "postgresql://username:password@host:port/database?sslmode=require"
         }
       }
     }
   }
   ```

4. **Test the connection:**
   ```bash
   cd my-mcp-servers
   npx postgresql-mcp-server --test
   ```

#### Alternative: Manual Installation (Development)

If you want to modify the code or contribute:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nitaiaharoni/postgresql-mcp-server.git
   cd postgresql-mcp-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure your database connection:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Test the connection:**
   ```bash
   npm test
   ```

5. **Use automatic configuration:**
   ```bash
   npm run configure
   ```
   
   Or manually configure Claude Desktop with local path:
   ```json
   {
     "mcpServers": {
       "postgresql": {
         "command": "node",
         "args": ["/path/to/postgresql-mcp-server/server.js"],
         "env": {
           "DATABASE_URL": "postgresql://username:password@host:port/database?sslmode=require"
         }
       }
     }
   }
   ```

## Configuration

### Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `NODE_TLS_REJECT_UNAUTHORIZED` - Set to '0' for self-signed certificates (not recommended for production)

### Connection String Examples

```bash
# Standard connection
DATABASE_URL="postgresql://username:password@localhost:5432/mydb"

# SSL required (recommended for production)
DATABASE_URL="postgresql://username:password@host:5432/mydb?sslmode=require"

# Cloud providers (DigitalOcean, AWS RDS, etc.)
DATABASE_URL="postgresql://username:password@hostname:25060/database?sslmode=require"
```

## Usage

Once configured, you can interact with your database through Claude:

### Setup Commands

Before using with Claude, you may want to:

```bash
# Automatically configure Claude Desktop
postgresql-mcp-server --configure

# Find Claude Desktop config file location for manual setup
postgresql-mcp-server --find-config

# Test your database connection  
postgresql-mcp-server --test

# Check version
postgresql-mcp-server --version

# Get help
postgresql-mcp-server --help
```

### Basic Database Exploration
```
"List all tables in my database"
"What schemas are available?"
"Show me the structure of the users table"
```

### Data Querying
```
"Show me the first 10 rows from the orders table"
"How many users are registered?"
"What are the most popular products?"
```

### Database Analysis
```
"Analyze the distribution of values in the status column"
"Show me table sizes and statistics"
"What indexes exist on the users table?"
```

### Performance Optimization
```
"Explain the query plan for this SELECT statement"
"Which tables are the largest in my database?"
"Show me foreign key relationships"
```

### Discovery and Search
```
"Find all tables with 'user' in the name"
"Search for columns containing 'email'"
"List all functions in the database"
```

## Available Tools

The MCP server provides 12 comprehensive tools for database interaction:

### **Core Query Tools**
1. **`query_database`** - Execute SQL queries (SELECT only) with formatted results
2. **`explain_query`** - Get query execution plans for performance analysis

### **Schema & Structure Tools**
3. **`list_schemas`** - List all database schemas (system and user)
4. **`list_tables`** - Get all tables and views with their types
5. **`describe_table`** - Get detailed column information for specific tables
6. **`list_indexes`** - Show indexes for tables with type and uniqueness info
7. **`get_foreign_keys`** - Display foreign key relationships and constraints
8. **`list_functions`** - List stored functions, procedures, and aggregates

### **Analysis & Statistics Tools**
9. **`get_table_stats`** - Table sizes, row counts, and column statistics
10. **`analyze_column`** - Deep column analysis including distribution and common values
11. **`get_database_info`** - Database version, size, settings, and connection info

### **Discovery Tools**
12. **`search_tables`** - Search for tables, views, and columns by name patterns

## Security Considerations

- **Read-only access**: The server is designed for SELECT queries only
- **Input validation**: All queries are validated to prevent dangerous operations
- **SSL/TLS**: Always use encrypted connections in production
- **Credentials**: Store database credentials securely using environment variables
- **Network**: Ensure your database is properly firewalled
- **Monitoring**: Monitor database access and query patterns

## Troubleshooting

### SSL Certificate Issues

Cloud providers like DigitalOcean, AWS RDS often use self-signed certificates. If you encounter SSL certificate errors:

```bash
# For development/testing - disable certificate verification
export NODE_TLS_REJECT_UNAUTHORIZED=0
npm test

# Or run the server with SSL verification disabled
NODE_TLS_REJECT_UNAUTHORIZED=0 node server.js
```

**Production SSL Configuration:**
```bash
# Always use SSL in production
DATABASE_URL="postgresql://username:password@host:port/db?sslmode=require"

# For cloud providers, the server automatically handles certificate issues
# No additional configuration needed
```

**Common SSL errors and solutions:**
- `self-signed certificate in certificate chain` - Normal for cloud providers, server handles this
- `no pg_hba.conf entry for host` with `no encryption` - Add `?sslmode=require` to connection string
- Connection timeout - Check firewall settings and database accessibility

### Connection Failures

1. Verify database credentials
2. Check network connectivity
3. Ensure database accepts connections from your IP
4. Verify SSL/TLS settings

### MCP Server Not Recognized

1. Restart Claude Desktop after configuration changes
2. Check the configuration file syntax
3. Verify file paths in the configuration
4. Check server.js has executable permissions

## Development

### Project Structure

```
postgresql-mcp-server/
├── server.js           # Main MCP server implementation
├── test.js            # Comprehensive test suite
├── package.json        # Node.js dependencies and scripts
├── .env.example        # Environment variables template
├── README.md          # This file
└── LICENSE            # MIT License
```

### Running Tests

The included test suite validates all 12 tools:

```bash
npm test
```

Test coverage includes:
- Database connection and basic queries
- All schema introspection tools
- Table and column analysis
- Index and foreign key discovery
- Query explanation and performance tools
- Security validation

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests for new functionality
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

### Publishing (Maintainers)

To publish a new version to npm:

1. **Update version:**
   ```bash
   npm version patch|minor|major
   ```

2. **Test the package:**
   ```bash
   npm run test
   npm pack  # Test package creation
   ```

3. **Publish to npm:**
   ```bash
   npm publish
   ```

4. **Push changes:**
   ```bash
   git push origin main --tags
   ```

The `prepublishOnly` script will automatically run tests before publishing.

## Examples

### E-commerce Database Analysis

```
"What are our best-selling products this month?"
"Show me customer acquisition trends"
"Find orders that haven't been shipped"
"Analyze the distribution of order values"
"Which product categories have the most foreign key relationships?"
```

### Performance Optimization

```
"Show me the execution plan for our slow customer query"
"Which tables are taking up the most space?"
"What indexes exist on our high-traffic tables?"
"Analyze query performance bottlenecks"
```

### Data Discovery

```
"Find all tables related to user management"
"Search for columns that might contain email addresses"
"Show me all the stored functions available"
"Map out the foreign key relationships in our schema"
```

### Database Maintenance

```
"Which tables haven't been analyzed recently?"
"Show me database size and growth trends"
"List all schemas and their purposes"
"Find unused or redundant indexes"
```

## Supported PostgreSQL Versions

- PostgreSQL 12+
- Amazon RDS PostgreSQL
- Google Cloud SQL PostgreSQL
- Azure Database for PostgreSQL
- DigitalOcean Managed PostgreSQL
- Heroku PostgreSQL

## Related Projects

- [Model Context Protocol](https://github.com/modelcontextprotocol/protocol) - The underlying protocol
- [Claude Desktop](https://claude.ai/desktop) - The Claude desktop application
- [Other MCP Servers](https://github.com/modelcontextprotocol/servers) - Official MCP server implementations

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 🐛 **Bug reports**: Create an issue in this repository
- 💬 **Questions**: Use the discussion section
- 📧 **Contact**: For private inquiries

## Acknowledgments

- [Anthropic](https://www.anthropic.com/) for Claude and the MCP protocol
- [PostgreSQL](https://www.postgresql.org/) community
- Contributors and testers

---

**⚠️ Important**: This tool provides database access to AI. Always review queries and ensure appropriate access controls are in place.