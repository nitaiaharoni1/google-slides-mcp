# Google Slides MCP Server

[![GitHub stars](https://img.shields.io/github/stars/nitaiaharoni1/mcp-google-slides?style=social)](https://github.com/nitaiaharoni1/mcp-google-slides/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/nitaiaharoni1/mcp-google-slides?style=social)](https://github.com/nitaiaharoni1/mcp-google-slides/network/members)
[![npm version](https://img.shields.io/npm/v/mcp-google-slides)](https://www.npmjs.com/package/mcp-google-slides)
[![npm downloads](https://img.shields.io/npm/dm/mcp-google-slides)](https://www.npmjs.com/package/mcp-google-slides)

A Model Context Protocol (MCP) server that provides AI assistants with direct access to Google Slides API. This server enables natural language interactions to create, edit, format, and manage Google Slides presentations through comprehensive slide manipulation tools.

## 🚀 Quick Install

### NPX (Recommended - No Installation Required)

```bash
# Authenticate with Google
npx mcp-google-slides auth

# Check authentication status
npx mcp-google-slides status

# Setup Claude Desktop configuration
npx mcp-google-slides init
```

### Global Installation

```bash
# Install globally for repeated use
npm install -g mcp-google-slides

# Authenticate with Google
mcp-google-slides auth

# Check status
mcp-google-slides status

# Setup Claude Desktop
mcp-google-slides init
```

Restart Claude Desktop after setup.

**✨ New:** Use with NPX - no installation required! Just run `npx mcp-google-slides` directly.

**Current Version:** v1.0.0

**Key Features:**

- ✨ **`mcp-google-slides auth`** - OAuth2 authentication with Google
- ✨ **`mcp-google-slides status`** - Check authentication and configuration status
- ✨ **`mcp-google-slides init`** - Interactive setup for Claude Desktop
- 🔐 **OAuth2 Authentication** - Secure token management with automatic refresh

## ✨ Features

### 📋 **Built-in Best Practices Prompt**

- **`google-slides-best-practices`** prompt - Access comprehensive guidelines for working with Google Slides
  - Essential workflow: inspect before modifying
  - Tool selection guide
  - Common mistakes to avoid
  - Coordinate system reference

> 💡 **Best Practice:** In Claude Desktop, use the prompt picker to access the best practices guide before starting work on presentations.

### 🚀 **High-Level Slide Templates (Recommended - Most Efficient)**

- **`create_slide_template`** - Create professionally-designed slides using one of 30 master templates
  - **Title slides**: hero, minimal, image split
  - **Closing slides**: CTA, thank you
  - **Content slides**: bullets (clean, numbered), two-column (text, image left/right), three-column, quotes, big statements
  - **Metrics slides**: 2x2 grid, 3-row, 4-row, single metric
  - **Data slides**: comparison tables, pricing tiers, before/after
  - **Visual/Process**: timelines (horizontal, vertical), funnels, pyramids, process flows, cycles
  - **Team slides**: 2 founders, 4-grid, 6-grid
  - **Specialized**: section dividers
  - Automatic positioning, styling, spacing, and professional layout
  - Optional themes: modern, bold, minimal, corporate

> 💡 **Best Practice:** Always use `create_slide_template` when possible! It combines multiple operations into a single Google API call, making it **much faster and more efficient** than calling individual content tools sequentially.

### 📊 **Presentation Management**

- **Create presentations** - Generate new Google Slides presentations with custom titles
- **Get presentation details** - Retrieve full presentation information including slides, layouts, and masters
- **Delete presentations** - Remove presentations from Google Drive

### 📄 **Slide Operations**

- **Create slides** - Add new slides with optional layout templates
- **Duplicate slides** - Copy existing slides within presentations
- **Delete slides** - Remove slides from presentations
- **Reorder slides** - Change slide order within presentations
- **Get slide details** - Retrieve comprehensive slide information
- **Get slide thumbnails** - Generate thumbnail images for slides

### ✏️ **Content Creation (Low-Level)**

- **Text boxes** - Add multiple text boxes with `add_multiple_text_boxes` (supports single or multiple boxes with automatic positioning)
- **Text updates** - Update text content in elements with `update_text`
- **Paragraph bullets** - Create and delete paragraph bullets
- **Images** - Add images from URLs, update image properties, replace images
- **Shapes** - Add various shapes (rectangles, circles, arrows, stars, diamonds, triangles, etc.)
- **Tables** - Update cells, insert/delete rows and columns, merge/unmerge cells, update borders
- **Charts** - Create bar, column, line, and pie charts
- **Element management** - Delete slide elements, update z-order

> ⚠️ **Note:** For better efficiency, use `create_slide_template` or `batch_update` instead of multiple individual content operations.

### 🎨 **Formatting & Styling**

- **Text formatting** - Apply fonts, sizes, colors, bold, italic, underline, strikethrough, small caps, baseline offset
- **Shape formatting** - Customize fill colors, outlines, shadows, rotation
- **Positioning** - Set precise element positions and sizes with automatic bounds clamping
- **Z-order** - Control element layering (bring to front, send to back, etc.)

### 📐 **Layouts & Masters**

- **List page templates** - Discover available slide layouts and master slides in a presentation

### ⚡ **Batch Operations**

- **Batch updates** - Execute up to 50 Google Slides API requests atomically in a single call
- Useful for complex custom operations not covered by templates

### 🖼️ **Export & Sharing**

- **Thumbnails** - Generate thumbnail images for slides in PNG or JPEG format (SMALL, MEDIUM, LARGE, XLARGE)
- **PDF Export** - Export entire presentations as PDF files

### 🔐 **Secure Authentication**

- **OAuth2 flow** - Industry-standard Google OAuth2 authentication
- **Token management** - Automatic token refresh and secure storage
- **Environment variables** - Flexible configuration options

### ⚡ **Developer Experience**

- **Easy setup** - Automatic configuration for Claude Desktop
- **TypeScript** - Full type safety and excellent IDE support
- **CLI tools** - Command-line utilities for configuration and testing
- **Comprehensive tools** - 30+ MCP tools for complete Google Slides control
- **Parallel test execution** - Tests run in parallel for faster feedback

## 🛠️ Installation

### Prerequisites

- Node.js (v16 or higher)
- Claude Desktop or any MCP-compatible AI client
- Google Cloud Project with Google Slides API enabled
- OAuth2 credentials (Client ID and Client Secret)

### Quick Setup (NPX - Recommended)

1. **Get OAuth2 credentials from Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create OAuth 2.0 Client ID credentials
   - Set authorized redirect URI to: `http://localhost:3000/oauth2callback`
   - Download or copy your Client ID and Client Secret

2. **Set environment variables:**

   ```bash
   export GOOGLE_CLIENT_ID="your-client-id"
   export GOOGLE_CLIENT_SECRET="your-client-secret"
   export GOOGLE_REDIRECT_URI="http://localhost:3000/oauth2callback"  # Optional, defaults to this
   ```

3. **Authenticate:**

   ```bash
   npx mcp-google-slides auth
   ```

   This will:
   - Open your browser for Google authentication
   - Prompt you to authorize the application
   - Save tokens securely to `~/.mcp-google-slides/tokens.json`

4. **Setup Claude Desktop:**

   ```bash
   npx mcp-google-slides init
   ```

5. **Restart Claude Desktop** and you're ready!

### Alternative Installation Methods

**Install globally:**

```bash
npm install -g mcp-google-slides
mcp-google-slides auth
mcp-google-slides init
```

**Use from source:**

```bash
git clone https://github.com/nitaiaharoni1/mcp-google-slides.git
cd mcp-google-slides
npm install
npm run build
# Set environment variables
export GOOGLE_CLIENT_ID="your-client-id"
export GOOGLE_CLIENT_SECRET="your-client-secret"
# Then use the CLI to configure
npm run build && node dist/server.js auth
npm run build && node dist/server.js init
```

**Manual configuration:** Use `npx mcp-google-slides --find-config` to locate your Claude Desktop config file and add the server manually.

## 🔗 OAuth2 Setup Guide

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Slides API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Slides API"
   - Click "Enable"

### Step 2: Create OAuth2 Credentials

1. Navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" (unless you have a Google Workspace)
   - Fill in required fields (App name, User support email)
   - Add scopes: `https://www.googleapis.com/auth/presentations` and `https://www.googleapis.com/auth/drive.file`
   - Add test users (if needed)
4. Create OAuth client ID:
   - Application type: "Desktop app" or "Web application"
   - Name: "Google Slides MCP"
   - Authorized redirect URIs: `http://localhost:3000/oauth2callback`
5. Copy your **Client ID** and **Client Secret**

### Step 3: Configure Environment Variables

```bash
export GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="your-client-secret"
export GOOGLE_REDIRECT_URI="http://localhost:3000/oauth2callback"  # Optional
```

### Step 4: Authenticate

```bash
npx mcp-google-slides auth
```

Follow the prompts to complete authentication.

## 🎯 Available Tools

The Google Slides MCP server provides 30+ powerful tools for presentation management:

### 🚀 High-Level Template Tools (⭐ RECOMMENDED - Most Efficient)

**Always prefer this tool!** It creates complete, professionally-designed slides in a single Google API call, making it much faster than using individual content tools.

- **`create_slide_template`** - Create a professionally-designed slide using one of 30 master templates
  - **30 template types**: title_hero, title_minimal, title_image_split, closing_cta, closing_thank_you, bullets_clean, bullets_numbered, two_column_text, two_column_image_left, two_column_image_right, three_column, quote_spotlight, big_statement, metrics_2x2, metrics_3_row, metrics_4_row, metrics_single, comparison_table, pricing_tiers, before_after, timeline_horizontal, timeline_vertical, funnel_3_level, pyramid_3_level, process_flow, cycle_4_step, team_2_founders, team_4_grid, team_6_grid, section_divider
  - **Themes**: modern, bold, minimal, corporate
  - Handles all positioning, styling, fonts, colors, and spacing automatically

### Presentation Tools

- **`create_presentation`** - Create a new Google Slides presentation with a title
- **`get_presentation`** - Get full details of a presentation including slides, layouts, and masters
- **`delete_presentation`** - Delete a presentation from Google Drive

### Slide Tools

- **`create_slide`** - Create a new slide with optional layout template and insertion index
- **`duplicate_slide`** - Duplicate an existing slide (optionally at a specific position)
- **`delete_slide`** - Delete one or more slides from a presentation
- **`reorder_slides`** - Reorder slides within a presentation
- **`get_slide`** - Get detailed information about a specific slide including all elements
- **`add_speaker_notes`** - Add or update speaker notes for a slide
- **`get_speaker_notes`** - Get speaker notes for a slide
- **`set_slide_background`** - Set slide background (solid color, gradient, or image)

### Content Tools (Low-Level)

⚠️ **Note:** Consider using `create_slide_template` or `batch_update` instead for better efficiency.

- **`add_multiple_text_boxes`** - Add one or multiple text boxes to a slide (supports automatic vertical stacking and horizontal centering)
- **`update_text`** - Update text content in a text element
- **`create_paragraph_bullets`** - Add bullets to paragraphs in text elements
- **`delete_paragraph_bullets`** - Remove bullets from paragraphs
- **`add_image`** - Add an image to a slide from a URL
- **`update_image_properties`** - Update image properties (outline, shadow, link)
- **`replace_image`** - Replace an existing image with a new one
- **`add_shape`** - Add a shape (rectangle, circle, arrow, star, diamond, triangle, etc.) to a slide
- **`delete_element`** - Delete one or more elements (text box, image, shape, etc.) from a slide

### Table Tools

- **`update_table_cell`** - Update text content and formatting in a table cell
- **`insert_table_rows`** - Insert one or more rows into a table
- **`delete_table_rows`** - Delete one or more rows from a table
- **`insert_table_columns`** - Insert one or more columns into a table
- **`delete_table_column`** - Delete one or more columns from a table
- **`merge_table_cells`** - Merge cells in a table
- **`unmerge_table_cells`** - Unmerge cells in a table
- **`update_table_border_properties`** - Update border properties (color, weight, dash style)

### Formatting Tools

- **`format_text`** - Apply comprehensive text formatting (font size, family, bold, italic, underline, strikethrough, small caps, baseline offset, colors, alignment, spacing, indentation)
- **`format_shape`** - Format shape properties (fill color, outline/border, shadow, rotation)
- **`set_element_position`** - Set position and size of an element (automatically clamped to slide bounds)
- **`update_z_order`** - Change element layering (bring to front, send to back, bring forward, send backward)

### Layout Tools

- **`list_page_templates`** - List all available layouts and master slides in a presentation

### Batch & Export Tools

- **`batch_update`** - Execute up to 50 Google Slides API requests atomically in a single batch operation (for complex custom operations not covered by templates)
- **`get_thumbnail`** - Generate thumbnail images for slides (PNG or JPEG, various sizes)
- **`export_to_pdf`** - Export a presentation as PDF (returns download URL or base64 content)

## 🖥️ CLI Commands

The mcp-google-slides package provides several command-line tools for easy configuration:

### Authentication Commands

- **`mcp-google-slides auth [--force]`** - Authenticate with Google (OAuth2 flow)
  ```bash
  mcp-google-slides auth
  mcp-google-slides auth --force  # Re-authenticate (clears existing tokens)
  ```

### Management Commands

- **`mcp-google-slides status`** - Show current authentication status and configuration

  ```bash
  mcp-google-slides status
  ```

- **`mcp-google-slides init`** - Interactive setup for Claude Desktop
  ```bash
  mcp-google-slides init
  ```

### Information Commands

- **`mcp-google-slides --help/-h`** - Show help information
- **`mcp-google-slides --version/-v`** - Show version information
- **`mcp-google-slides --find-config`** - Show Claude Desktop config file location

## 💡 Usage Examples

### ⭐ Recommended: Using High-Level Template Tools (Most Efficient)

```
"Create a title slide in presentation abc123 using template title_hero with title 'Q4 Results' and subtitle '2024 Performance Review'"

"Create a bullet point slide in presentation abc123 using template bullets_clean with title 'Key Achievements' and bullets: ['Revenue up 50%', 'New product launched', 'Team expanded to 25']"

"Create a two-column slide in presentation abc123 using template two_column_text with columns comparing 'Benefits' and 'Challenges'"

"Create a metrics slide in presentation abc123 using template metrics_2x2 showing our KPIs: Revenue: $5M, Users: 100K, Growth: 200%"

"Create a comparison table slide in presentation abc123 using template comparison_table with headers ['Feature', 'Basic', 'Pro'] and comparison data"

"Create a team slide in presentation abc123 using template team_4_grid with our team members"

"Create a timeline slide in presentation abc123 using template timeline_horizontal showing our milestones"
```

### Basic Presentation Operations

```
"Create a new presentation called 'Quarterly Report'"
"Get details about presentation ID abc123"
"Delete the presentation with ID xyz789"
```

### Slide Management

```
"Add a new slide to presentation abc123"
"Duplicate slide slide_456 in presentation abc123"
"Delete slide slide_789 from presentation abc123"
"Reorder slides in presentation abc123 to [slide_1, slide_3, slide_2]"
"Show me slide slide_456 from presentation abc123"
```

### Content Creation (Low-Level - Use Templates Instead When Possible)

Instead of:

```
"Add a text box to slide slide_456 with text 'Hello World'"
"Format the text to be bold and size 24"
"Move it to position x=100, y=200"
```

Use this (much more efficient):

```
"Create a title slide in presentation abc123 using template title_hero with title 'Hello World'"
```

Individual operations:

```
"Add multiple text boxes to slide slide_456 with text ['Title', 'Subtitle'] and fontSize [44, 24]"
"Add an image from https://example.com/image.png to slide slide_456"
"Add a rectangle shape to slide slide_456"
"Update the text in element textbox_123 to 'Updated Text'"
"Delete elements [image_456, shape_789] from slide slide_456"
```

### Table Operations

Use comparison_table template for complete tables (recommended):

```
"Create a comparison table slide in presentation abc123 using template comparison_table with headers ['Product', 'Price', 'Stock'] and comparison data"
```

Individual operations:

```
"Update table cell in table table_123 at row 2, column 1 with text 'Data'"
"Insert 2 rows at index 1 in table table_123"
"Delete 1 row starting at index 0 from table table_123"
"Insert 2 columns at index 1 in table table_123"
"Merge cells in table table_123 starting at row 0, column 0 spanning 2 rows and 3 columns"
```

### Formatting

```
"Format text in element textbox_123 with fontSize 24, bold true, and foregroundColor red"
"Format shape shape_456 with blue fill color and black outline"
"Set element textbox_123 position to x=100, y=200, width=300, height=150"
"Format text in element textbox_123 with alignment CENTER"
"Bring element image_123 to front"
```

### Layouts

```
"List all page templates (layouts and masters) in presentation abc123"
```

### CLI Management Examples

```bash
# Initial authentication
mcp-google-slides auth

# Check authentication status
mcp-google-slides status

# Setup Claude Desktop
mcp-google-slides init

# Re-authenticate (if needed)
mcp-google-slides auth --force

# Find config file location
mcp-google-slides --find-config
```

## 🎯 Best Practices for Efficiency

### Always Prefer Template Tools

The Google Slides API is **much faster** when you combine multiple operations into a single call. This MCP server is designed with this principle in mind:

**✅ DO THIS (Fast - 1 API call):**

```
"Create a title slide in presentation abc123 using template title_hero with title 'Welcome' and subtitle 'Join Us'"
```

**❌ NOT THIS (Slow - 5+ API calls):**

```
"Create a slide in presentation abc123"
"Add a text box with 'Welcome'"
"Format it to size 44 and bold"
"Add another text box with 'Join Us'"
"Format it to size 24"
```

### Use the Right Tool for the Job

1. **Creating complete slides?** → Use `create_slide_template` (30 professional templates available)
2. **Complex custom operations?** → Use `batch_update` (up to 50 operations in one call)
3. **Simple one-off operations?** → Use individual tools (`add_multiple_text_boxes`, `add_image`, etc.)

### Template Tool Benefits

- **Speed**: 5-10x faster than individual operations
- **Consistency**: Automatic positioning, styling, and professional design
- **Simplicity**: One tool call instead of many
- **Reliability**: Atomic operations (all succeed or all fail)
- **30 Templates**: Wide variety of slide types for any use case

## 🔧 Configuration

### Environment Variables

- **`GOOGLE_CLIENT_ID`** - Your Google OAuth2 Client ID (required)
- **`GOOGLE_CLIENT_SECRET`** - Your Google OAuth2 Client Secret (required)
- **`GOOGLE_REDIRECT_URI`** - OAuth2 redirect URI (default: `http://localhost:3000/oauth2callback`)

### Claude Desktop Configuration

The `init` command automatically configures Claude Desktop. Manual configuration:

```json
{
  "mcpServers": {
    "mcp-google-slides": {
      "command": "npx",
      "args": ["mcp-google-slides"],
      "env": {
        "GOOGLE_CLIENT_ID": "your-client-id",
        "GOOGLE_CLIENT_SECRET": "your-client-secret",
        "GOOGLE_REDIRECT_URI": "http://localhost:3000/oauth2callback"
      }
    }
  }
}
```

### Token Storage

Tokens are securely stored in `~/.mcp-google-slides/tokens.json`. The server automatically refreshes expired access tokens using the refresh token.

## 🧪 Testing

The Google Slides MCP server includes comprehensive testing:

```bash
# Run all tests
npm test

# Run only unit tests (recommended for CI)
npm run test:unit

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (development)
npm run test:watch
```

## 🏗️ Development

### Local Development Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/nitaiaharoni1/mcp-google-slides.git
   cd mcp-google-slides
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

   This will automatically set up pre-commit hooks via Husky to ensure code quality.

3. **Configure OAuth2 credentials:**

   ```bash
   export GOOGLE_CLIENT_ID="your-client-id"
   export GOOGLE_CLIENT_SECRET="your-client-secret"
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
- ✅ **Unit tests** - Validates all unit tests pass (runs in parallel for faster feedback)
- ✅ **Package validation** - Verifies npm package integrity

#### 🚀 **Pre-push Checks** (Run before pushing to remote)

- ✅ **Clean build** - Full clean build from scratch
- ✅ **Package verification** - Ensures package can be published

These hooks prevent broken code from being committed or pushed, maintaining high code quality standards for all contributors. Tests run in pre-commit for faster feedback before commits.

## 📄 License

**MIT License** - See the [LICENSE](LICENSE) file for complete terms and conditions.

## 🙋‍♂️ Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/nitaiaharoni1/mcp-google-slides/issues)
- **Documentation**: This README and inline code documentation
- **Community**: Contributions and discussions welcome!

---

**Made with ❤️ for the AI and Google Slides community**
