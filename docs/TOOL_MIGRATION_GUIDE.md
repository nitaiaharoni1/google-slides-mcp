# Tool Migration Guide

This guide helps you update existing tools to follow the [Tool Design Guidelines](../src/TOOL_GUIDELINES.md).

## Quick Checklist

Before updating a tool, verify:

- [ ] Description includes: action, units, constraints, defaults, examples, recommendations
- [ ] All numeric parameters have `minimum`, `maximum`, `default`, and `examples`
- [ ] All string parameters with fixed options use `enum` and `examples`
- [ ] Required fields are minimal (only truly required)
- [ ] Response includes success/error, message, and relevant IDs
- [ ] Errors include suggestions for resolution
- [ ] Higher-level alternative tools are mentioned when appropriate

## Before & After Examples

### Example 1: Simple Parameter Update

**Before:**

```typescript
x: {
  type: "number",
  description: "X position in points",
}
```

**After:**

```typescript
x: createXPositionParam()
// OR manually:
x: {
  type: "number",
  description: "X position in points (0-700). Standard slide width is 720pt. Examples: 60 (left margin), 360 (center), 660 (right indent)",
  minimum: 0,
  maximum: 700,
  examples: [60, 360, 660],
}
```

### Example 2: Enhanced Description

**Before:**

```typescript
{
  name: "add_text_box",
  description: "Add a text box to a slide with specified text content.",
}
```

**After:**

```typescript
{
  name: "add_text_box",
  description:
    "Add a text box to a slide with specified text content. " +
    "All positions and sizes in points. " +
    "Standard slide dimensions: 720pt wide × 405pt tall. " +
    "Defaults: x=50, y=50, width=500, height=100. " +
    "Example: Title at top (x=60, y=30, width=600, height=80, fontSize=44, bold=true). " +
    "TIP: For multiple elements, use 'add_multiple_text_boxes'. " +
    "Use batch_update for multiple operations at once.",
}
```

### Example 3: Using Schema Builder Helpers

**Before:**

```typescript
properties: {
  presentationId: {
    type: "string",
    description: "The ID of the presentation",
  },
  x: {
    type: "number",
    description: "X position in points",
  },
  fontSize: {
    type: "number",
    description: "Font size in points",
  },
}
```

**After:**

```typescript
import {
  createStringParam,
  createXPositionParam,
  createFontSizeParam,
} from "../utils/schema-builder";
import { PRESENTATION_ID_EXAMPLES } from "../config/examples";

properties: {
  presentationId: createStringParam({
    description: "The ID of the presentation",
    examples: PRESENTATION_ID_EXAMPLES,
  }),
  x: createXPositionParam(),
  fontSize: createFontSizeParam(),
}
```

## Step-by-Step Migration Process

### Step 1: Add Imports

Add schema builder and examples imports at the top of your tool file:

```typescript
import {
  createStringParam,
  createNumberParam,
  createXPositionParam,
  createYPositionParam,
  createWidthParam,
  createHeightParam,
  createFontSizeParam,
} from "../utils/schema-builder";
import {
  PRESENTATION_ID_EXAMPLES,
  SLIDE_ID_EXAMPLES,
  ELEMENT_ID_EXAMPLES,
  // ... other relevant examples
} from "../config/examples";
```

### Step 2: Update Tool Description

Enhance the description to include all 6 components:

1. **Action** - What it does
2. **Units** - What units/formats
3. **Constraints** - Limits/ranges
4. **Defaults** - Default values
5. **Examples** - Usage examples
6. **Recommendations** - When to use alternatives

### Step 3: Replace Parameter Definitions

Replace manual parameter definitions with schema builder functions:

- `createXPositionParam()` for X positions
- `createYPositionParam()` for Y positions
- `createWidthParam()` for widths
- `createHeightParam()` for heights
- `createFontSizeParam()` for font sizes
- `createStringParam()` for strings with examples/enums
- `createNumberParam()` for numbers with constraints

### Step 4: Add Examples to Complex Parameters

For complex nested objects (like colors, table data), add examples in descriptions:

```typescript
foregroundColor: {
  type: "object",
  description: "Text color as RGB object with red, green, blue (0-1). Example: {rgbColor: {red: 0, green: 0, blue: 0}} for black",
  properties: {
    rgbColor: {
      type: "object",
      description: "RGB color values (0-1)",
      properties: {
        red: {
          type: "number",
          minimum: 0,
          maximum: 1,
          examples: [0, 0.9, 1],
        },
        // ...
      },
    },
  },
}
```

### Step 5: Enhance Error Handling

Update error responses to include suggestions:

```typescript
// Before
throw new Error("Invalid port");

// After
return createErrorResult("Invalid port", {
  error: "ValidationError",
  suggestion: "Use a port between 1024 and 65535",
  provided: port,
  validRange: [1024, 65535],
});
```

## Common Patterns

### Pattern 1: ID Parameters

Always use examples from `config/examples.ts`:

```typescript
presentationId: createStringParam({
  description: "The ID of the presentation",
  examples: PRESENTATION_ID_EXAMPLES,
});
```

### Pattern 2: Position Parameters

Use preset functions:

```typescript
x: createXPositionParam(),
y: createYPositionParam(),
```

### Pattern 3: Size Parameters

Use preset functions:

```typescript
width: createWidthParam(),
height: createHeightParam(),
```

### Pattern 4: Enum Parameters

Always include examples:

```typescript
alignment: createStringParam({
  description:
    "Text alignment: START (left), CENTER, END (right), or JUSTIFIED",
  enum: ["START", "CENTER", "END", "JUSTIFIED"],
  examples: ["CENTER", "START"],
});
```

### Pattern 5: Boolean Parameters

Include default and examples:

```typescript
bold: {
  type: "boolean",
  description: "Make text bold. Default: false",
  default: false,
  examples: [true, false],
}
```

## Testing Your Updates

After updating a tool:

1. **Check linting**: Run `npm run lint` to ensure no errors
2. **Verify examples**: Ensure all examples are valid and realistic
3. **Test tool call**: Try calling the tool with example values
4. **Check error messages**: Verify error messages include helpful suggestions

## Common Mistakes to Avoid

❌ **Forgetting units**: Always specify "in points", "in pixels", etc.

❌ **Missing constraints**: Numeric parameters should have min/max

❌ **No examples**: Every parameter should have at least one example

❌ **Vague descriptions**: "The ID" → "The ID of the presentation. Example: '1abc123def456'"

❌ **No recommendations**: Always mention higher-level alternatives when appropriate

## Resources

- [Tool Design Guidelines](../src/TOOL_GUIDELINES.md) - Complete guidelines
- [Schema Builder](../src/utils/schema-builder.ts) - Helper functions
- [Examples Config](../src/config/examples.ts) - Common example values
- [Description Builder](../src/utils/description-builder.ts) - Description templates
