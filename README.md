# Database MCP Server

[![GitHub stars](https://img.shields.io/github/stars/nitaiaharoni1/database-mcp?style=social)](https://github.com/nitaiaharoni1/database-mcp/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/nitaiaharoni1/database-mcp?style=social)](https://github.com/nitaiaharoni1/database-mcp/network/members)
[![npm version](https://img.shields.io/npm/v/database-mcp)](https://www.npmjs.com/package/database-mcp)
[![npm downloads](https://img.shields.io/npm/dm/database-mcp)](https://www.npmjs.com/package/database-mcp)

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

# Quick setup with init command
database-mcp init

# Or setup with database URL directly (no environment variable needed)
database-mcp init "postgresql://username:password@host:port/database?sslmode=require"

# Check your current configuration
database-mcp status

# Update your database connection
database-mcp update "postgresql://user:pass@newhost:port/db"

# Or use without installing
npx database-mcp init "postgresql://username:password@host:port/database"
```

That's it! The server will automatically detect your OS and configure Claude Desktop for you.

**New in v1.2.4:** Use the simple `database-mcp init` command for streamlined setup!

**Added in v1.2.4:** 
- ✨ **`database-mcp status`** - Check your current database configuration
- ✨ **`database-mcp update`** - Update your database connection easily  
- ⚠️ **Deprecated** `--setup` and `--configure` (still work but show warnings)

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

3. **Quick setup with init command:**
   ```bash
   # Use environment variable DATABASE_URL
   database-mcp init
   
   # Or provide database URL directly (no environment variable needed)
   database-mcp init "postgresql://username:password@host:port/database"
   
   # Check your current configuration
   database-mcp status
   
   # Update database connection if needed
   database-mcp update "postgresql://user:pass@newhost:port/db"
   ```
   
   This command will:
   - Detect your operating system (macOS, Linux, Windows)
   - Find your Claude Desktop configuration file
   - Add the Database MCP server configuration
   - Use your provided database URL or existing `DATABASE_URL` environment variable
   
4. **Restart Claude Desktop** and start chatting!

#### Method 2: Using npx (No Installation)

```bash
# Configure Claude Desktop without installing (recommended)
npx database-mcp init "postgresql://username:password@host:port/database"

# Or use environment variable
export DATABASE_URL="mysql://username:password@localhost:3306/database"
npx database-mcp init

# Check status
npx database-mcp status

# Update database connection
npx database-mcp update "mysql://user:pass@newhost:3306/db"
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
   
   **Tip:** Instead of manual configuration, try `database-mcp init` for automatic setup!

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

## 🖥️ CLI Commands

The database-mcp package provides several command-line tools for easy configuration:

### Setup Commands
- **`database-mcp init [connection_string]`** - Interactive setup for Claude Desktop
  ```bash
  database-mcp init "postgresql://user:pass@host:port/db"
  database-mcp init  # Uses DATABASE_URL environment variable
  ```

### Management Commands  
- **`database-mcp status`** - Show current database configuration and connection status
  ```bash
  database-mcp status
  ```

- **`database-mcp update <connection_string>`** - Update database connection string
  ```bash
  database-mcp update "mysql://user:pass@newhost:3306/db"
  ```

### Information Commands
- **`database-mcp --help/-h`** - Show help information
- **`database-mcp --version/-v`** - Show version information
- **`database-mcp --find-config`** - Show Claude Desktop config file location

### Deprecated Commands ⚠️
- **`database-mcp --setup`** - Use `database-mcp init` instead
- **`database-mcp --configure`** - Use `database-mcp init` instead

These deprecated commands still work but will show warning messages encouraging use of the new commands.

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

### CLI Management Examples
```bash
# Initial setup
database-mcp init "postgresql://user:pass@host:port/db"

# Check current configuration
database-mcp status

# Update to a different database
database-mcp update "mysql://user:pass@newhost:3306/newdb"

# Find config file location
database-mcp --find-config
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
   
   This will automatically set up pre-commit hooks via Husky to ensure code quality.

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

### Pre-commit Hooks

This project uses **Husky** to enforce code quality standards:

#### 🔒 **Pre-commit Checks** (Run on every commit)
- ✅ **TypeScript compilation** - Ensures code compiles without errors
- ✅ **Unit tests** - Validates all unit tests pass
- ✅ **Package validation** - Verifies npm package integrity

#### 🚀 **Pre-push Checks** (Run before pushing to remote)
- ✅ **Clean build** - Full clean build from scratch
- ✅ **Unit tests with coverage** - Comprehensive test coverage analysis
- ✅ **Package verification** - Ensures package can be published

These hooks prevent broken code from being committed or pushed, maintaining high code quality standards for all contributors.

## 🔄 CI/CD Pipeline

This project uses **GitHub Actions** for automated continuous integration and deployment:

### 📋 **Workflows**

#### 🧪 **CI Workflow** (`.github/workflows/ci.yml`)
**Triggers:** Push to `main`/`develop`, Pull Requests
- ✅ **Multi-Node Testing** - Tests on Node.js 18.x and 20.x
- ✅ **Build Verification** - Ensures TypeScript compilation succeeds
- ✅ **Unit Test Execution** - Runs comprehensive unit test suite
- ✅ **Coverage Reporting** - Uploads test coverage to Codecov
- ✅ **Security Audit** - Checks for vulnerabilities in dependencies
- ✅ **Package Validation** - Verifies npm package can be built

#### 🚀 **Release Workflow** (`.github/workflows/release.yml`)
**Triggers:** GitHub Releases, Version Tags (`v*`)
- ✅ **Automated Testing** - Full test suite execution
- ✅ **Production Build** - Clean build for distribution
- ✅ **NPM Publishing** - Automatic publish to npm registry
- ✅ **Release Notes** - Auto-generated GitHub release notes

#### 🔗 **Integration Tests** (`.github/workflows/integration.yml`)
**Triggers:** Manual dispatch, Scheduled (daily)
- ✅ **Local Database Testing** - Tests with containerized PostgreSQL/MySQL
- ✅ **External Database Support** - Tests with provided database URLs
- ✅ **Multi-Database Matrix** - Tests PostgreSQL, MySQL, and SQLite
- ✅ **SSL Configuration** - Validates cloud database connectivity

#### 🤖 **Dependabot Auto-merge** (`.github/workflows/dependabot-auto-merge.yml`)
**Triggers:** Dependabot Pull Requests
- ✅ **Automated Dependency Updates** - Weekly dependency updates
- ✅ **Auto-merge** - Automatically merges patch/minor updates after CI passes
- ✅ **Security Updates** - Prioritizes security vulnerability fixes

### 🔧 **Setup Instructions**

#### **For Repository Maintainers:**

1. **NPM Token Setup:**
   ```bash
   # Create npm access token at https://www.npmjs.com/settings/tokens
   # Add to GitHub Secrets as NPM_TOKEN
   ```

2. **Optional Database Testing:**
   ```bash
   # Add to GitHub Secrets for integration testing
   TEST_DATABASE_URL="postgresql://user:pass@host:port/db"
   ```

3. **Dependabot Configuration:**
   - Automatically configured in `.github/dependabot.yml`
   - Updates dependencies weekly on Mondays
   - Auto-assigns to `nitaiaharoni1`

#### **Manual Workflow Triggers:**

- **Integration Tests:** Go to Actions → Integration Tests → Run workflow
- **Manual Release:** Create a new release or push a version tag

### 📊 **Status Badges**

Add these badges to monitor build status:

```markdown
![CI](https://github.com/nitaiaharoni1/database-mcp/workflows/CI/badge.svg)
![Release](https://github.com/nitaiaharoni1/database-mcp/workflows/Release/badge.svg)
[![npm version](https://badge.fury.io/js/database-mcp.svg)](https://badge.fury.io/js/database-mcp)
[![codecov](https://codecov.io/gh/nitaiaharoni1/database-mcp/branch/main/graph/badge.svg)](https://codecov.io/gh/nitaiaharoni1/database-mcp)
```

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