# Batch Operations & Efficiency Guide

## Overview

This Google Slides MCP server is designed to maximize efficiency by using **batch operations** wherever possible. The Google Slides API is much faster when multiple operations are combined into a single API call.

## Architecture

### How It Works

All tools in this MCP server use batch operations under the hood:

1. **High-Level Template Tools** - Create complete slides in one API call
2. **Batch Update Tool** - Combine up to 50 custom operations
3. **Low-Level Tools** - Even individual tools use mini-batches internally

### Example: Creating a Text Box

When you call `add_text_box`, the implementation does this in ONE API call:

```typescript
const requests = [
  {
    createShape: {
      /* create text box shape */
    },
  },
  {
    insertText: {
      /* add text content */
    },
  },
];

await slides.presentations.batchUpdate({
  presentationId,
  requestBody: { requests },
});
```

## Recommended Tools (Ordered by Efficiency)

### 1. 🚀 Template Tools (Most Efficient)

#### `create_designed_slide`

Creates complete, styled slides in **one batch API call**. Combines:

- Slide creation
- Adding all elements (title, content, shapes, tables)
- Text formatting (fonts, sizes, colors, bold, etc.)
- Positioning and sizing
- Theme application

**Templates:**

- `title` - Title + subtitle slide
- `title_bullets` - Title + bullet points
- `two_column` - Title + left/right columns
- `comparison_table` - Title + comparison table
- `metrics` - Title + metric cards (3 per row)
- `team` - Title + team member info

**Themes:**

- `dark_professional` - Dark background, light text
- `light_clean` - White background, dark text
- `startup_bold` - White background, bold colors

#### `create_table_with_data`

Creates and populates tables in **one batch API call**. Combines:

- Table creation with exact rows/columns
- Header population
- Data row population
- Optional header styling

#### `create_pitch_deck`

Creates entire presentations in **one operation**. Automatically:

- Creates presentation
- Maps slide types to templates
- Creates all slides with appropriate content

### 2. ⚡ Batch Update Tool

For custom operations not covered by templates:

```typescript
batch_update({
  presentationId: "abc123",
  requests: [
    { createSlide: { ... } },
    { createShape: { ... } },
    { insertText: { ... } },
    { updateTextStyle: { ... } },
    // ... up to 50 requests
  ]
})
```

### 3. 🔧 Low-Level Tools

Use only when templates don't fit your needs:

- `add_text_box` - Combines createShape + insertText
- `add_image` - Single createImage request
- `add_shape` - Single createShape request
- `create_table` - Single createTable request

## Performance Comparison

### Example: Creating a Bullet Point Slide

**Using Template Tool (1 API call, ~500ms):**

```javascript
create_designed_slide({
  presentationId: "abc123",
  template: "title_bullets",
  content: {
    title: "Our Achievements",
    bullets: ["Revenue up 50%", "Launched new product", "Team grew to 25"],
  },
  theme: "dark_professional",
});
```

**Using Individual Tools (6+ API calls, ~3000ms):**

```javascript
// 1. Create slide
create_slide({ presentationId: "abc123" });

// 2. Add title text box
add_text_box({ pageId: "slide_1", text: "Our Achievements", x: 50, y: 30 });

// 3. Format title
format_text({ objectId: "title_1", fontSize: 44, bold: true });

// 4. Add bullet text box
add_text_box({
  pageId: "slide_1",
  text: "• Revenue up 50%\n• Launched...",
  x: 160,
  y: 140,
});

// 5. Format bullets
format_text({ objectId: "bullets_1", fontSize: 14 });

// 6. Set background
// ... more operations
```

**Result: Template tools are 5-6x faster! 🚀**

## Guidelines for AI Assistants

When working with this MCP server, always:

### 1. Plan First, Execute in Batch

**❌ Don't do this:**

```
- Create slide
- Add title
- Format title
- Add content
- Format content
```

**✅ Do this:**

```
- Plan entire slide structure
- Use create_designed_slide with all content in one call
```

### 2. Choose the Right Tool

Ask yourself:

- Creating a complete slide? → `create_designed_slide`
- Creating a table with data? → `create_table_with_data`
- Creating a full presentation? → `create_pitch_deck`
- Custom complex operation? → `batch_update`
- Simple one-off operation? → Individual tool

### 3. Understand Tool Capabilities

Before using low-level tools, check if a template tool can handle it:

- Need title + bullets? Use `title_bullets` template
- Need two columns? Use `two_column` template
- Need metrics dashboard? Use `metrics` template
- Need comparison? Use `comparison_table` template

## API Limits

Google Slides API constraints:

- **Max 50 requests per batch** - Split larger operations
- **Max 500 requests per 100 seconds** - Pace your operations
- **Max text length: 1MB per element** - Split very long text

The template tools automatically handle these limits for common operations.

## Benefits Summary

### Speed

- **1 API call instead of 10+**
- **5-10x faster execution**
- **Lower latency**

### Reliability

- **Atomic operations** - All succeed or all fail
- **No partial states** - Slide is complete or not created
- **Fewer error points** - One call = one error to handle

### Simplicity

- **One tool call** instead of many
- **Automatic positioning** - No manual coordinate calculation
- **Automatic styling** - Consistent, professional appearance

### Cost Efficiency

- **Fewer API calls** = Lower quota usage
- **Better for rate limits** - Stay within API constraints
- **Reduced network overhead**

## Common Patterns

### Pattern 1: Title Slide

```javascript
create_designed_slide({
  template: "title",
  content: {
    title: "Quarterly Business Review",
    subtitle: "Q4 2024 Results",
  },
  theme: "dark_professional",
});
```

### Pattern 2: Content Slide with Bullets

```javascript
create_designed_slide({
  template: "title_bullets",
  content: {
    title: "Key Achievements",
    bullets: [
      "Revenue increased 50% YoY",
      "Launched 3 new products",
      "Expanded team to 25 people",
    ],
  },
});
```

### Pattern 3: Comparison Slide

```javascript
create_designed_slide({
  template: "two_column",
  content: {
    title: "Benefits vs Challenges",
    leftColumn: {
      heading: "Benefits",
      bullets: ["Fast", "Scalable", "Cost-effective"],
    },
    rightColumn: {
      heading: "Challenges",
      bullets: ["Complex", "Time-intensive", "Requires expertise"],
    },
  },
});
```

### Pattern 4: Data Table

```javascript
create_table_with_data({
  pageId: "slide_456",
  headers: ["Product", "Q3", "Q4", "Growth"],
  rows: [
    ["Product A", "$1M", "$1.5M", "+50%"],
    ["Product B", "$800K", "$1.2M", "+50%"],
    ["Product C", "$600K", "$900K", "+50%"],
  ],
  position: "center",
  headerStyle: {
    bold: true,
    backgroundColor: { rgbColor: { red: 0.2, green: 0.4, blue: 0.8 } },
  },
});
```

## Conclusion

This MCP server is built for efficiency. By using batch operations and high-level templates, you can create professional presentations **5-10x faster** than using individual operations.

**Always ask yourself: "Can I do this in one call instead of many?"**

