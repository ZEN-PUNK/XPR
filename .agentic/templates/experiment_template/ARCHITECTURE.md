# Architecture - Experiment XX

## Overview

[Brief description of the system architecture and its purpose]

## Design Decisions

### Decision 1: [Technology/Pattern Choice]

**Choice Made:** [What was chosen]

**Alternatives Considered:**
- **Alternative A**: [Why not chosen]
- **Alternative B**: [Why not chosen]

**Rationale:**
- [Reason 1]
- [Reason 2]
- [Reason 3]

**Trade-offs:**
- ✅ **Pros**: [Benefits of this choice]
- ❌ **Cons**: [Downsides of this choice]

---

### Decision 2: [Technology/Pattern Choice]

[Same structure as above]

---

## System Architecture

### High-Level Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP/stdio
       ▼
┌─────────────┐
│   Server    │
│  (Express)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│    Tools    │────▶│  Adapters   │
└─────────────┘     └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ External    │
                    │   System    │
                    └─────────────┘
```

### Component Diagram

```
src/
├── index.ts          (Entry Point)
│   └─▶ Initializes Server
│
├── server.ts         (Core Server)
│   ├─▶ HTTP Routes
│   ├─▶ JSON-RPC Handler
│   └─▶ Error Handling
│
├── tools/            (MCP Tools)
│   ├── tool1.ts      (Business Logic)
│   └── tool2.ts      (Business Logic)
│
└── adapters/         (External Integrations)
    ├── adapter1.ts   (Wraps External Tool)
    └── adapter2.ts   (Wraps External API)
```

---

## Module Breakdown

### Module: Server (`src/server.ts`)

**Responsibility:** HTTP server and request routing

**Key Functions:**
- `createServer()` - Initialize Express app
- `handleMCPRequest()` - Process JSON-RPC requests
- `handleError()` - Error formatting and logging

**Dependencies:**
- Express.js
- Body parser middleware

**Interfaces:**
```typescript
interface MCPRequest {
  jsonrpc: string;
  id: number;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: string;
  id: number;
  result?: any;
  error?: MCPError;
}
```

---

### Module: Tools (`src/tools/`)

**Responsibility:** Implement MCP tool specifications

**Key Functions:**
- `getToolDefinition()` - Tool schema
- `executeTool()` - Tool implementation

**Pattern:**
```typescript
export const toolName = {
  definition: {
    name: 'tool_name',
    description: 'What it does',
    inputSchema: { /* JSON Schema */ }
  },
  handler: async (params) => {
    // Implementation
    return result;
  }
};
```

---

### Module: Adapters (`src/adapters/`)

**Responsibility:** Wrap external tools and APIs

**Key Functions:**
- `callExternalTool()` - Execute external command
- `parseOutput()` - Parse response
- `handleErrors()` - Error translation

**Pattern:**
```typescript
export class ExternalAdapter {
  async call(args: string[]): Promise<Result> {
    const output = await exec(`tool ${args.join(' ')}`);
    return this.parse(output);
  }
  
  private parse(output: string): Result {
    // Parse and validate
  }
}
```

---

## Data Flow

### Request Flow

```
1. Client sends HTTP POST
   ↓
2. Express routes to MCP handler
   ↓
3. JSON-RPC request parsed
   ↓
4. Tool lookup and validation
   ↓
5. Tool handler called
   ↓
6. Adapter called (if needed)
   ↓
7. External system queried
   ↓
8. Response formatted
   ↓
9. JSON-RPC response sent
```

### Error Flow

```
1. Error occurs in any layer
   ↓
2. Error caught by handler
   ↓
3. Error translated to MCP error
   ↓
4. Error logged
   ↓
5. JSON-RPC error response sent
```

---

## Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x | Runtime environment |
| TypeScript | 5.x | Type-safe development |
| Express.js | 4.x | HTTP server |
| MCP SDK | 1.24.0+ | Protocol implementation |

### Development Tools

| Tool | Purpose |
|------|---------|
| tsc | TypeScript compiler |
| npm | Package management |
| nodemon | Auto-restart (dev) |

---

## Design Patterns

### Pattern 1: Adapter Pattern

**Used in:** External integrations

**Purpose:** Wrap external CLI tools with consistent interface

**Example:**
```typescript
class ProtonAdapter {
  async getAccount(name: string): Promise<Account> {
    // Wraps `proton account <name>` command
  }
}
```

### Pattern 2: Factory Pattern

**Used in:** Tool registration

**Purpose:** Create tool instances dynamically

**Example:**
```typescript
const toolRegistry = {
  'get_account': createAccountTool,
  'get_chain_info': createChainTool
};
```

### Pattern 3: Middleware Pattern

**Used in:** Request processing

**Purpose:** Chain request handlers

**Example:**
```typescript
app.use(bodyParser.json());
app.use(corsHandler);
app.use(authHandler);
```

---

## Security Considerations

### Input Validation
- All tool inputs validated against JSON Schema
- Type checking via TypeScript
- Sanitization of shell commands

### Error Handling
- No sensitive data in error messages
- Errors logged server-side only
- Generic error messages to clients

### Rate Limiting
- [Describe approach or note if not implemented]

---

## Performance Considerations

### Bottlenecks
1. **External CLI startup**: ~200ms per call
2. **Network I/O**: Variable latency
3. **JSON parsing**: Minimal impact

### Optimizations
1. **[Optimization 1]**: [Description]
2. **[Optimization 2]**: [Description]

### Future Improvements
- [ ] Add caching layer
- [ ] Implement connection pooling
- [ ] Optimize JSON parsing

---

## Testing Strategy

### Unit Tests
- Individual function testing
- Mock external dependencies
- Fast execution

### Integration Tests
- Component interaction testing
- Use real dependencies
- Slower but thorough

### End-to-End Tests
- Full system testing
- Real external systems
- Manual or automated

---

## Deployment Architecture

### Development
```
Local Machine
├── Node.js process
├── Port 3001
└── Direct CLI calls
```

### Production (if applicable)
```
[Describe production architecture]
```

---

## Extension Points

### Adding New Tools
1. Create tool definition in `src/tools/`
2. Implement handler function
3. Register in tool registry
4. Add tests

### Adding New Adapters
1. Create adapter in `src/adapters/`
2. Implement external call logic
3. Add error handling
4. Export adapter

---

## Known Limitations

1. **Limitation 1**: [Description and impact]
2. **Limitation 2**: [Description and impact]
3. **Limitation 3**: [Description and impact]

---

## Future Architecture Plans

### Iteration 2
- [Planned architectural change 1]
- [Planned architectural change 2]

### Iteration 3+
- [Future architectural vision]

---

**Last Updated:** YYYY-MM-DD  
**Version:** 1.0.0  
**Author:** [Your name or team]
