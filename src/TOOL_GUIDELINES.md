# Tool Design Guidelines for MCP Servers

## 1. Units & Coordinate Systems

### Always Be Explicit About Units

- Never assume users know what units you're using
- Document units in every description: "in pixels", "in points", "in seconds", "in bytes"
- Keep external API consistent (e.g., always points), convert internally

```typescript
// GOOD
description: "Width in pixels (10-1920). Default: 800";

// BAD
description: "Width of the element";
```

### Document Reference Frames

- State the coordinate system origin (top-left? center?)
- Provide dimensions of the working area
- Give examples of common positions

```typescript
// GOOD
description: "X position in pixels (0-1920). Origin is top-left. Example: 960 centers horizontally.";

// BAD
description: "X position";
```

---

## 2. Tool Description Best Practices

### The 6 Components of Good Descriptions:

1. **Action** - What does the tool do?
2. **Units** - What units/formats are expected?
3. **Constraints** - What are the limits/valid ranges?
4. **Defaults** - What happens if parameters are omitted?
5. **Examples** - Show concrete usage patterns
6. **Recommendations** - When to use alternatives

### Template:

```
[ACTION]. [UNITS & CONSTRAINTS]. [DEFAULTS]. [EXAMPLES]. [RECOMMENDATIONS].
```

### Examples:

```typescript
// EXCELLENT - Contains all 6 components
description: "Crop an image to specified dimensions. Width/height in pixels (min: 1, max: 4096). Defaults: preserve aspect ratio, center crop. Example: width=800, height=600 creates 800×600 crop. For multiple images, use 'batch_crop_images'.";

// GOOD - Clear and informative
description: "Send an email. Body supports plain text or HTML. Max size: 10MB including attachments. Defaults: from=configured address, priority=normal.";

// BAD - Vague and unhelpful
description: "Sends an email message";
```

---

## 3. Parameter Schema Design

### Numeric Parameters - Always Include Constraints:

```typescript
{
  type: "number",
  description: "Port number (1024-65535). Common: 3000 (dev), 8080 (proxy), 443 (HTTPS)",
  minimum: 1024,
  maximum: 65535,
  default: 3000,
  examples: [3000, 8080, 443]
}
```

### String Parameters - Use Enums for Fixed Options:

```typescript
// GOOD - Clear, constrained
{
  type: "string",
  description: "Log level: debug (verbose), info (normal), warn (important), error (critical only)",
  enum: ["debug", "info", "warn", "error"],
  default: "info"
}

// BAD - Open-ended, error-prone
{
  type: "string",
  description: "Log level"
}
```

### Provide Semantic Shortcuts:

```typescript
// Allow both precise AND convenient options
{
  size: {
    oneOf: [
      { type: "number", description: "Exact size in bytes" },
      {
        type: "string",
        enum: ["small", "medium", "large"],
        description: "Preset sizes: small=1MB, medium=5MB, large=10MB",
      },
    ];
  }
}
```

---

## 4. Tool Naming Conventions

### Use Clear, Consistent Verb Patterns:

| Pattern    | Purpose                | Examples                             |
| ---------- | ---------------------- | ------------------------------------ |
| `create_*` | Create new resources   | `create_user`, `create_database`     |
| `get_*`    | Retrieve information   | `get_user`, `get_status`             |
| `list_*`   | Get multiple items     | `list_files`, `list_users`           |
| `update_*` | Modify existing        | `update_settings`, `update_profile`  |
| `delete_*` | Remove resources       | `delete_file`, `delete_record`       |
| `set_*`    | Set configuration      | `set_env_variable`, `set_permission` |
| `add_*`    | Add to collection      | `add_tag`, `add_member`              |
| `remove_*` | Remove from collection | `remove_tag`, `remove_member`        |

### Compound Tools for Complex Operations:

- `create_*_with_*` - Create + initialize: `create_database_with_schema`
- `*_multiple_*` - Batch operations: `delete_multiple_files`
- `*_and_*` - Combine related actions: `save_and_publish`

---

## 5. Tool Hierarchy & Composition

### Organize Tools by Abstraction Level:

```
Level 3 (High): Complete workflows
    ↓
Level 2: Multi-step operations
    ↓
Level 1: Single operations with options
    ↓
Level 0 (Low): Atomic operations
```

### Example Hierarchy:

```
deploy_application              ← Level 3: Full workflow
    ↓
build_and_deploy               ← Level 2: Multi-step
    ↓
build_docker_image             ← Level 1: Single operation
    ↓
run_docker_command             ← Level 0: Atomic
```

### Guide Users to Higher Levels:

```typescript
description: "Run a shell command. For building Docker images, use 'build_docker_image'. For full deployments, use 'deploy_application'.";
```

---

## 6. Error Handling & Validation

### Fail Gracefully with Helpful Messages:

```typescript
// GOOD - Informative error
{
  success: false,
  error: "InvalidPort",
  message: "Port 80 requires root privileges. Try ports 1024-65535.",
  suggestion: "Use port 8080 for development",
  provided: 80,
  validRange: [1024, 65535]
}

// BAD - Cryptic error
{
  error: "EACCES"
}
```

### Auto-Fix When Possible:

```typescript
// Clamp values to valid ranges
const port = Math.max(1024, Math.min(65535, userPort));

// Return warnings when auto-fixing
if (port !== userPort) {
  warnings.push(`Port ${userPort} out of range, clamped to ${port}`);
}
```

---

## 7. Response Consistency

### Standard Success Response:

```typescript
{
  success: true,
  [resourceId]: "unique_id",      // e.g., userId, fileId, jobId
  message: "Human-readable result",
  data?: { /* relevant data */ },
  warnings?: ["Optional warnings"]
}
```

### Standard Error Response:

```typescript
{
  success: false,
  error: "ErrorType",
  message: "What went wrong",
  suggestion?: "How to fix it",
  provided?: "What user gave",
  expected?: "What was expected"
}
```

---

## 8. Batch Operations

### When to Provide Batch Tools:

- User might need to apply same operation to multiple items
- Significant performance gain from batching
- Common use case in your domain

### Batch Response Format:

```typescript
{
  success: true,
  count: 5,
  [resourceIds]: ["id1", "id2", "id3", "id4", "id5"],
  message: "Processed 5 items",
  failed?: [{ id: "id3", reason: "..." }],
  partial: false  // true if some items failed
}
```

---

## 9. Examples in Schemas

### Include Real-World Examples:

```typescript
{
  name: "send_notification",
  description: "Send a push notification to users. Message max 256 chars. Example: 'Your order #1234 has shipped!'",
  inputSchema: {
    properties: {
      message: {
        type: "string",
        description: "Notification message (max 256 chars)",
        maxLength: 256,
        examples: [
          "Your order has shipped!",
          "Payment received - thank you!",
          "New message from @user"
        ]
      },
      priority: {
        type: "string",
        enum: ["low", "normal", "high"],
        description: "Delivery priority. 'high' wakes device immediately.",
        examples: ["normal"],
        default: "normal"
      }
    }
  }
}
```

---

## 10. Documentation Patterns

### Use Concrete Examples Over Abstract Descriptions:

```typescript
// GOOD - Shows real usage
description: "Filter logs by level. Example: level='error' returns only error logs. Use 'warn' to include warnings and errors.";

// BAD - Abstract and unclear
description: "Filter logs according to specified criteria";
```

### Provide Use-Case Examples:

```typescript
description: "Schedule a task. Use cron format for recurring tasks: '0 9 * * *' runs daily at 9am. For one-time tasks: timestamp=1704067200 runs at specific time.";
```

---

## 11. Progressive Disclosure

### Start Simple, Add Detail Progressively:

```typescript
// Basic description for quick understanding
description: "Upload a file to cloud storage.";

// Then add details
description: "Upload a file to cloud storage. Max size: 100MB. Supports: jpg, png, pdf. Returns: downloadUrl.";

// Full description with examples and alternatives
description: "Upload a file to cloud storage. Max size: 100MB. Supported formats: jpg, png, pdf, doc, zip. Returns: downloadUrl and fileId. Example: Upload 'logo.png' to folder 'assets/images/'. For multiple files, use 'batch_upload_files'.";
```

---

## 12. Common Patterns & Their Guidelines

### File Paths:

```typescript
{
  path: {
    type: "string",
    description: "File path. Use '/' for directories. Examples: '/home/user/file.txt', 'relative/path.json'",
    pattern: "^[^\\0]+$"  // No null bytes
  }
}
```

### Time & Dates:

```typescript
{
  timestamp: {
    type: "number",
    description: "Unix timestamp in seconds. Example: 1704067200 = 2024-01-01 00:00:00 UTC",
    minimum: 0,
    examples: [1704067200]
  }
}
```

### Sizes:

```typescript
{
  maxSize: {
    type: "number",
    description: "Maximum size in bytes. Examples: 1048576 (1MB), 5242880 (5MB), 10485760 (10MB)",
    minimum: 1,
    examples: [1048576, 5242880, 10485760]
  }
}
```

---

## 13. Tool Declaration Checklist

Before adding a new tool, verify:

- [ ] Name follows `verb_noun` pattern
- [ ] Description includes: action, units, constraints, defaults, examples, recommendations
- [ ] All numeric parameters have min/max/default
- [ ] All string parameters use enums for fixed options
- [ ] Examples are provided for complex parameters
- [ ] Required fields are minimal (only truly required)
- [ ] Response includes success/error, message, and relevant IDs
- [ ] Errors include suggestions for resolution
- [ ] Higher-level alternative tools are mentioned
- [ ] Units are explicitly documented
- [ ] Common use cases are shown in examples

---

## 14. Complete Example: Well-Designed Tool

```typescript
{
  name: "resize_image",
  description:
    "Resize an image to specified dimensions. " +
    "Width/height in pixels (min: 1, max: 4096). " +
    "Defaults: preserve aspect ratio, high quality. " +
    "Example: width=800, height=600 creates 800×600 image. " +
    "For multiple images, use 'batch_resize_images'.",

  inputSchema: {
    type: "object",
    properties: {
      imagePath: {
        type: "string",
        description: "Path to source image. Example: '/images/photo.jpg'",
        examples: ["/images/photo.jpg", "assets/logo.png"]
      },
      width: {
        type: "number",
        description: "Target width in pixels (1-4096). Example: 800 for web images, 1920 for HD",
        minimum: 1,
        maximum: 4096,
        examples: [800, 1024, 1920]
      },
      height: {
        type: "number",
        description: "Target height in pixels (1-4096). Omit to preserve aspect ratio.",
        minimum: 1,
        maximum: 4096,
        examples: [600, 768, 1080]
      },
      quality: {
        type: "number",
        description: "JPEG quality (1-100). 85 is recommended for web. Higher = larger file size.",
        minimum: 1,
        maximum: 100,
        default: 85,
        examples: [75, 85, 95]
      },
      preserveAspectRatio: {
        type: "boolean",
        description: "Maintain original aspect ratio. If true, image may not match exact dimensions.",
        default: true
      }
    },
    required: ["imagePath", "width"]
  }
}
```

---

## Summary: The 5 Principles

1. **Be Explicit** - Never assume users know your conventions (units, formats, ranges)
2. **Show, Don't Tell** - Use concrete examples over abstract descriptions
3. **Fail Gracefully** - Provide helpful errors and suggestions
4. **Guide Users** - Recommend higher-level tools when appropriate
5. **Stay Consistent** - Use same patterns across all tools (naming, responses, parameters)

---

## Anti-Patterns to Avoid

❌ **Vague descriptions:** "Process data"  
✅ **Specific descriptions:** "Convert JSON to CSV format. Max size: 10MB. Example: [{name:'John', age:30}] → 'name,age\\nJohn,30'"

❌ **Missing units:** "Set timeout to 5"  
✅ **Clear units:** "Set timeout to 5 seconds (1-300). Example: 30 for API calls, 5 for quick operations"

❌ **No examples:** "Filter by criteria"  
✅ **With examples:** "Filter users by role. Example: role='admin' returns administrators, role='user' returns regular users"

❌ **Cryptic errors:** "Error 1001"  
✅ **Helpful errors:** "Port already in use. Port 3000 is occupied. Try 3001 or kill process using 'lsof -ti:3000'"

❌ **Kitchen sink parameters:** 20 required fields  
✅ **Progressive complexity:** 2-3 required, rest optional with good defaults
