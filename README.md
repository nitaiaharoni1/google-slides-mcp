# PostgreSQL MCP Server

A Model Context Protocol (MCP) server that provides Claude with direct access to PostgreSQL databases. This server enables Claude to query, analyze, and interact with your PostgreSQL database through natural language conversations.

## Features

- 🔐 **Secure SSL/TLS connections** - Works with cloud providers like DigitalOcean, AWS RDS, Google Cloud SQL
- 📊 **Database introspection** - List tables, describe schemas, and explore database structure
- 🔍 **Query execution** - Run SELECT queries and get formatted results
- 🛡️ **Safe by design** - Read-only operations to prevent accidental data modification
- ⚡ **Easy setup** - Simple configuration and deployment

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Claude Desktop](https://claude.ai/desktop) installed
- Access to a PostgreSQL database

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/postgresql-mcp-server.git
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

5. **Configure Claude Desktop:**
   
   Edit your Claude Desktop configuration file:
   
   **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   
   **Linux:** `~/.config/Claude/claude_desktop_config.json`
   
   **Windows:** `%APPDATA%/Claude/claude_desktop_config.json`

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

6. **Restart Claude Desktop**

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

### List Tables
```
"List all tables in my database"
```

### Describe Schema
```
"Describe the structure of the users table"
```

### Query Data
```
"Show me the first 10 rows from the orders table"
"How many users are registered?"
"What are the most popular products?"
```

### Data Analysis
```
"Analyze sales trends by month"
"Find users who haven't logged in recently"
"Show me the top customers by revenue"
```

## Available Tools

The MCP server provides three main tools:

1. **`query_database`** - Execute SQL queries (SELECT only)
2. **`list_tables`** - Get all tables and views in the database
3. **`describe_table`** - Get column information for a specific table

## Security Considerations

- **Read-only access**: The server is designed for SELECT queries only
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
├── package.json        # Node.js dependencies and scripts
├── .env.example        # Environment variables template
├── README.md          # This file
├── LICENSE            # MIT License
└── tests/             # Test files
```

### Running Tests

```bash
npm test
```

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests for new functionality
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## Examples

### E-commerce Database Analysis

```
"What are our best-selling products this month?"
"Show me customer acquisition trends"
"Find orders that haven't been shipped"
```

### User Analytics

```
"How many active users do we have?"
"What's the average session duration?"
"Show me user registration patterns"
```

### Financial Reporting

```
"Calculate monthly recurring revenue"
"Show me payment failure rates"
"Analyze transaction patterns"
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

- 🐛 **Bug reports**: [GitHub Issues](https://github.com/yourusername/postgresql-mcp-server/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/postgresql-mcp-server/discussions)
- 📧 **Email**: your-email@example.com

## Acknowledgments

- [Anthropic](https://www.anthropic.com/) for Claude and the MCP protocol
- [PostgreSQL](https://www.postgresql.org/) community
- Contributors and testers

---

**⚠️ Important**: This tool provides database access to AI. Always review queries and ensure appropriate access controls are in place.