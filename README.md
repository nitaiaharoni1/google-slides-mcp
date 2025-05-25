# Database MCP Server

A Model Context Protocol (MCP) server that provides AI assistants with direct access to multiple database types. This server enables natural language interactions with PostgreSQL, MySQL, and SQLite databases through comprehensive introspection and analysis tools.

## 🚀 Quick Install

```bash
# Install globally (recommended)
npm install -g database-mcp

# Set your database connection
export DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
# or
export DATABASE_URL="mysql://username:password@host:port/database"
# or
export DATABASE_URL="./path/to/database.sqlite"

# Automatically configure Claude Desktop
database-mcp --configure

# Or configure with database URL directly (no environment variable needed)
database-mcp --configure "postgresql://username:password@host:port/database?sslmode=require"

# Or use without installing
npx database-mcp --configure
```

That's it! The server will automatically detect your OS and configure Claude Desktop for you.

**Prefer manual configuration?** Use `database-mcp --find-config` to locate your Claude Desktop config file and get setup instructions.

## ✨ Features

### 🗄️ **Multi-Database Support**
- **PostgreSQL** - Full support for cloud providers (AWS RDS, Google Cloud SQL, DigitalOcean, Azure)
- **MySQL** - Complete MySQL 5.7+ and 8.0+ compatibility  
- **SQLite** - Local and embedded database support

### 🔐 **Secure Connections**
- **Smart SSL/TLS** - Automatic SSL detection for cloud databases
- **Environment-aware** - Different security modes for development/production
- **Certificate handling** - Built-in support for cloud provider certificates

### 📊 **Comprehensive Database Introspection**
- **Schema exploration** - List databases, tables, views, and schemas
- **Structure analysis** - Detailed table descriptions, column info, data types
- **Relationship mapping** - Foreign key relationships and constraints
- **Index information** - Primary keys, indexes, and performance insights
- **Function discovery** - Stored procedures and database functions

### 🔍 **Advanced Query Capabilities**
- **Safe execution** - Read-only operations to prevent data modification
- **Query planning** - EXPLAIN query execution plans and optimization
- **Result formatting** - Structured output with metadata
- **Error handling** - Graceful error management and helpful messages

### 📈 **Database Analytics**
- **Table statistics** - Row counts, size information, and storage details
- **Column analysis** - Data distribution, null values, and unique counts
- **Performance insights** - Query performance and optimization suggestions
- **Database health** - Connection status and system information

### 🔎 **Smart Discovery**
- **Pattern search** - Find tables and columns by name patterns
- **Content search** - Search across table and column names
- **Relationship discovery** - Automatic foreign key relationship detection
- **Schema navigation** - Browse complex database structures easily

### ⚡ **Developer Experience**
- **Easy setup** - Automatic configuration for Claude Desktop
- **Comprehensive testing** - 100% unit test coverage with Jest
- **TypeScript** - Full type safety and excellent IDE support
- **CLI tools** - Command-line utilities for configuration and testing

## 🛠️ Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Claude Desktop](https://claude.ai/desktop) or any MCP-compatible AI client
- Access to a PostgreSQL, MySQL, or SQLite database

### Quick Start

Choose one of the installation methods below:

#### Method 1: Automatic Configuration (Recommended)

1. **Install globally via npm:**
   ```bash
   npm install -g database-mcp
   ```

2. **Set your database connection (optional):**
   ```bash
   # PostgreSQL (cloud or local)
   export DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
   
   # MySQL
   export DATABASE_URL="mysql://username:password@host:port/database"
   
   # SQLite
   export DATABASE_URL="./path/to/database.sqlite"
   ```

3. **Automatically configure Claude Desktop:**
   ```bash
   # Use environment variable DATABASE_URL
   database-mcp --configure
   
   # Or provide database URL directly
   database-mcp --configure "postgresql://username:password@host:port/database"
   ```
   
   This command will:
   - Detect your operating system (macOS, Linux, Windows)
   - Find your Claude Desktop configuration file
   - Add the Database MCP server configuration
   - Use your provided database URL or existing `DATABASE_URL` environment variable
   
4. **Restart Claude Desktop** and start chatting!

#### Method 2: Using npx (No Installation)

```bash
# Configure Claude Desktop without installing
npx database-mcp --configure

# Or provide database URL directly
npx database-mcp --configure "mysql://username:password@localhost:3306/database"
```

#### Method 3: Manual Configuration

If you prefer to configure manually or the automatic configuration doesn't work:

1. **Install the package:**
   ```bash
   npm install -g database-mcp
   ```

2. **Find your Claude Desktop config file location:**
   ```bash
   database-mcp --find-config
   ```
   
   This will show you:
   - Your OS-specific config file path
   - Whether the file already exists
   - Whether Database MCP is already configured
   - Complete manual configuration instructions

3. **Manually edit Claude Desktop configuration:**
   
   Open the configuration file shown by the previous command in your text editor and add:

   ```json
   {
     "mcpServers": {
       "database": {
         "command": "database-mcp",
         "env": {
           "DATABASE_URL": "your-database-connection-string"
         }
       }
     }
   }
   ```

4. **Restart Claude Desktop**

## 🔗 Connection String Examples

### PostgreSQL
```bash
# Cloud providers (SSL automatically enabled)
postgresql://user:pass@host.amazonaws.com:5432/db
postgresql://user:pass@host.ondigitalocean.com:25060/db?sslmode=require
postgresql://user:pass@host.database.windows.net:5432/db

# Local PostgreSQL (SSL disabled)
postgresql://user:pass@localhost:5432/database
```

### MySQL
```bash
# Cloud MySQL
mysql://user:pass@host.amazonaws.com:3306/database

# Local MySQL
mysql://user:pass@localhost:3306/database
```

### SQLite
```bash
# Absolute path
/absolute/path/to/database.sqlite

# Relative path
./relative/path/to/database.db

# Memory database (for testing)
:memory:
```

## 🎯 Available Tools

The Database MCP server provides 13 powerful tools for database interaction:

### Query Tools
- **`query_database`** - Execute SELECT queries with formatted results
- **`explain_query`** - Analyze query execution plans and performance

### Schema Tools  
- **`list_schemas`** - List all available schemas/databases
- **`list_tables`** - List tables and views with details
- **`describe_table`** - Get detailed table structure and column information
- **`list_indexes`** - List all indexes and their properties
- **`get_foreign_keys`** - Discover foreign key relationships
- **`list_functions`** - List stored procedures and functions

### Analysis Tools
- **`get_table_stats`** - Get table statistics (row counts, sizes)
- **`get_database_info`** - Get database version and configuration
- **`analyze_column`** - Analyze column data distribution and statistics

### Discovery Tools
- **`search_tables`** - Search for tables and columns by name patterns

### Administrative Tools
- **`get_connection_info`** - Check connection status and database details

## 💡 Usage Examples

### Basic Database Exploration
```
"What tables are in my database?"
"Show me the structure of the users table"
"What are the foreign key relationships in my database?"
```

### Data Analysis
```
"How many records are in each table?"
"Show me the column statistics for the orders table"
"What's the distribution of values in the status column?"
```

### Query Assistance
```
"Find all customers who placed orders in the last 30 days"
"Show me the execution plan for this query: SELECT * FROM users WHERE email = ?"
"What indexes exist on the products table?"
```

### Schema Discovery
```
"Find all tables related to user management"
"What columns contain the word 'email'?"
"Show me all tables that reference the users table"
```

## 🔧 Configuration

### Environment Variables

- **`DATABASE_URL`** - Your database connection string (required)
- **`NODE_TLS_REJECT_UNAUTHORIZED`** - Set to '0' to disable SSL verification for development (not recommended for production)

### Database-Specific Options

#### PostgreSQL SSL Modes
- **`require`** - Always use SSL (recommended for production)
- **`prefer`** - Use SSL if available, fall back to non-SSL
- **`disable`** - Never use SSL (local development only)

#### Example with SSL options:
```bash
export DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

## 🧪 Testing

The Database MCP server includes comprehensive testing:

```bash
# Run all tests
npm test

# Run only unit tests (recommended for CI)
npm run test:unit

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (development)
npm run test:watch

# Test CLI functionality
npm run test:cli
```

**Test Coverage:**
- ✅ **72/72 Unit Tests** passing (100% success rate)
- ✅ **CLI Tools** - Complete command-line interface testing
- ✅ **Database Factory** - Multi-database detection and validation
- ✅ **Query Builder** - Database-agnostic query utilities
- ✅ **Tools** - All 13 MCP tools with schema validation

## 🏗️ Development

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nitaiaharoni1/database-mcp.git
   cd database-mcp
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

4. **Run tests:**
   ```bash
   npm test
   ```

5. **Build the project:**
   ```bash
   npm run build
   ```

6. **Test locally:**
   ```bash
   npm run dev
   ```

### Building and Publishing

```bash
# Clean build
npm run clean && npm run build

# Run tests before publish
npm run test:unit

# Publish to npm
npm publish
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines

1. **Code Quality**: All code must pass TypeScript compilation and ESLint checks
2. **Testing**: Maintain 100% unit test coverage for new features
3. **Documentation**: Update README and inline documentation for new features
4. **Compatibility**: Ensure changes work across all supported database types

## 📋 Requirements

- **Node.js** v16.0.0 or higher
- **TypeScript** for development
- **Database Access**: 
  - PostgreSQL 9.6+ (cloud or local)
  - MySQL 5.7+ or 8.0+ 
  - SQLite 3.0+

## 🐛 Troubleshooting

### Common Issues

**SSL Certificate Problems (PostgreSQL)**
```bash
# For development/testing only
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

**Permission Denied (SQLite)**
```bash
# Check file permissions
chmod 644 /path/to/database.sqlite
```

**Connection Refused**
- Verify database server is running
- Check firewall settings
- Confirm connection string format

**Claude Desktop Not Detecting Server**
- Restart Claude Desktop after configuration
- Check config file location with `database-mcp --find-config`
- Verify JSON syntax in configuration file

### Getting Help

1. **Check the logs** in Claude Desktop's developer console
2. **Test connection** with `database-mcp --test` (if available)
3. **Verify configuration** with `database-mcp --find-config`
4. **Open an issue** on GitHub with error details

## 📄 License

**Non-Commercial License** - All rights reserved to Nitai Aharoni.

This software is available for:
- ✅ Personal use (non-commercial)
- ✅ Educational and research purposes  
- ✅ Evaluation and testing

**Commercial use is prohibited** without explicit permission. For commercial licensing inquiries, please contact: nitaiaharoni1@gmail.com

See the [LICENSE](LICENSE) file for complete terms and conditions.

## 🙋‍♂️ Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/nitaiaharoni1/database-mcp/issues)
- **Documentation**: This README and inline code documentation
- **Community**: Contributions and discussions welcome!

---

**Made with ❤️ for the AI and database community**