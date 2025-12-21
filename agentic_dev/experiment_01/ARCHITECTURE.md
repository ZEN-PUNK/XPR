# Architecture: Experiment 01 MCP Server

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  External Clients                           │
│         (VS Code Copilot, Python MCP Client, curl)         │
└─────────────────┬───────────────────────────────────────────┘
                  │ JSON-RPC 2.0 over HTTP/STDIO
                  ↓
┌─────────────────────────────────────────────────────────────┐
│            MCP Server (server.ts)                           │
│  - Express.js server                                        │
│  - JSON-RPC request router                                  │
│  - OAuth token management                                   │
│  - Health check endpoints                                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        ↓                   ↓
   ┌─────────────┐  ┌──────────────┐
   │ tools/      │  │ adapters/    │
   │ (schemas)   │  │ (CLI wrap)   │
   └─────────────┘  └──────────────┘
        │                   │
        │ definitions       │ implementations
        ↓                   ↓
   • get_account      • account-adapter.ts
   • get_resources    • chain-adapter.ts
   • get_chain_info   • (execAsync wrapper)
   • get_block        │
   • get_tx_count     ↓
                 ┌─────────────────┐
                 │ Proton CLI      │
                 │ (@proton/cli)   │
                 └────────┬────────┘
                          │
                          ↓
                 ┌─────────────────┐
                 │ RPC Endpoint    │
                 │ Greymass API    │
                 │ (Proton network)│
                 └─────────────────┘
```

---

## Layer Details

### 1. Server Layer (server.ts - 320 lines)

**Responsibility:** Handle MCP protocol and HTTP transport

**Key Components:**
- `express.js` - HTTP server (PORT 3001)
- `handleMcpRequest()` - Route JSON-RPC methods
- `handleToolsList()` - Return available tools
- `handleToolCall()` - Execute tool handlers
- `generateToken()` - OAuth token generation
- Endpoints:
  - `GET /` - Server info
  - `GET /health` - Health check
  - `GET /authorize` - OAuth flow
  - `POST /token` - Token exchange
  - `POST /` - MCP JSON-RPC handler

**Protocol Handled:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_account",
    "arguments": { "account_name": "zenpunk" }
  }
}
```

**Response Format:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": { /* tool output */ }
}
```

---

### 2. Tools Layer (tools/) - Tool Definitions

**Responsibility:** Define MCP tools with JSON schemas

**Files:**
- `tools/index.ts` (40 lines) - Tool registry
  - `allTools[]` - Array of all tool definitions
  - `getTool(name)` - Lookup by name
  - `listTools()` - Return schemas for discovery
  - `callTool(name, params)` - Dispatch to handler

- `tools/account-tools.ts` (110 lines)
  - `getAccountTool` - Get full account info
  - `getAccountResourcesTool` - Get CPU/NET/RAM only
  - Both link to `account-adapter.ts`

- `tools/chain-tools.ts` (140 lines)
  - `getChainInfoTool` - Get chain metadata
  - `getBlockTool` - Get block details
  - `getBlockTransactionCountTool` - Transaction count
  - All link to `chain-adapter.ts`

**Tool Definition Pattern:**
```typescript
export const exampleTool = {
  name: "tool_name",
  description: "What it does",
  inputSchema: {
    type: "object",
    properties: {
      param1: { type: "string", description: "..." }
    },
    required: ["param1"]
  },
  handler: async (params) => {
    return await exampleAdapter(params.param1);
  }
};
```

---

### 3. Adapter Layer (adapters/) - CLI Wrappers

**Responsibility:** Wrap Proton CLI commands and extract JSON

**Files:**
- `adapters/index.ts` (2 lines) - Re-exports

- `adapters/account-adapter.ts` (80 lines)
  - `getAccount(name)` - Executes `proton account <name> -r`
  - `getAccountResources(name)` - Resource summary
  - `execAsync()` helper - Runs CLI command
  - `extractJson()` - Parses JSON from CLI output
  - Problem solved: CLI outputs debug messages before JSON
  - Solution: Find first `{` and collect until valid JSON

- `adapters/chain-adapter.ts` (100 lines)
  - `getChainInfo()` - `proton chain:info -r`
  - `getBlock(blockNum)` - `proton chain:get <blockNum> -r`
  - `getBlockTransactionCount()` - Count TXs
  - Same JSON extraction pattern

**Adapter Pattern:**
```typescript
export async function getExample(param: string) {
  try {
    const cmd = `proton example ${param} -r`;
    const result = await execAsync(cmd);
    const json = extractJson(result);
    return JSON.parse(json);
  } catch (error) {
    return { error: error.message };
  }
}
```

---

## Data Flow Example

**User Request:** "Get account info for zenpunk"

```
1. Client sends:
   POST /
   {"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_account","arguments":{"account_name":"zenpunk"}}}

2. server.ts receives → handleMcpRequest()

3. handleToolCall() called with:
   - name: "get_account"
   - arguments: { account_name: "zenpunk" }

4. tools/index.ts callTool()
   - Finds getAccountTool in registry
   - Calls handler(arguments)

5. tools/account-tools.ts getAccountTool.handler()
   - Calls getAccount("zenpunk")

6. adapters/account-adapter.ts getAccount()
   - Executes: proton account zenpunk -r
   - Captures: stdout with JSON mixed with debug output
   - Extracts: JSON portion
   - Parses: JSON.parse()
   - Returns: { name, created, resources, permissions, ... }

7. Response sent back:
   {"jsonrpc":"2.0","id":1,"result":{...account data...}}

8. Client receives full account object
```

---

## Key Design Decisions

### Decision 1: Adapter Pattern
**Why:** Reuse Proton CLI instead of reimplementing RPC
**Tradeoff:** ~200ms overhead per call vs. direct HTTP

### Decision 2: JSON Schema Tools
**Why:** Enable client-side validation and UI generation
**Benefit:** Copilot can discover tools automatically

### Decision 3: Stdio + HTTP Support
**Why:** Stdio for local dev (faster), HTTP for deployment
**Current:** Using Stdio for Copilot (no auth overhead)

### Decision 4: Token Storage In-Memory
**Why:** Simple auth for MCP protocol compliance
**Note:** Not persistent - tokens regenerated on server restart

---

## Module Dependencies

```
server.ts
├─ tools/index.ts
│  ├─ tools/account-tools.ts
│  │  └─ adapters/account-adapter.ts
│  │     └─ child_process.execAsync (Node.js)
│  └─ tools/chain-tools.ts
│     └─ adapters/chain-adapter.ts
│        └─ child_process.execAsync (Node.js)
└─ express (npm package)
```

**Total Lines of Code:**
- server.ts: 320 lines
- tools/: 250 lines (3 files)
- adapters/: 180 lines (3 files)
- **Total: ~750 lines TypeScript**

---

## Extension Points

### Adding New Tool

1. Create adapter in `src/adapters/new.ts`
2. Add tool def to `src/tools/new-tools.ts`
3. Register in `src/tools/index.ts`
4. Update docs

### Adding Authentication

1. Enhance `generateToken()` in server.ts
2. Add persistent store (Redis, DB)
3. Update token validation middleware

### Adding Caching

1. Add cache layer before adapters
2. Use tool name + params as cache key
3. Set TTL per tool

---

## Performance Characteristics

| Operation | Latency | Bottleneck |
|-----------|---------|------------|
| initialize | 1ms | JSON serialization |
| tools/list | 2ms | Array iteration |
| get_account | 200-300ms | CLI startup (⚠️) |
| get_chain_info | 150-200ms | RPC network |
| get_block | 100-150ms | RPC network |

**Optimization Opportunity:** Cache recent queries (see OPTIMIZATION_OPPORTUNITIES.md)

---

## Error Handling

```
Input Validation
  ↓
MCP Schema Check
  ↓
Tool Execution
  ├─ CLI error → "Tool execution failed"
  ├─ Network error → "RPC timeout"
  ├─ JSON parse error → "Invalid response format"
  └─ Success → Return data

All errors wrapped in JSON-RPC error object:
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32603,
    "message": "Internal server error",
    "data": { "error": "..." }
  }
}
```

---

## Backward Compatibility Across Iterations

**Stable Interfaces:**
- ✅ Tool names (don't rename)
- ✅ Input parameter names
- ✅ Return JSON structure (don't break fields)

**Safe to Change:**
- 📝 Internal adapter implementation
- 📝 Error messages
- 📝 Performance optimizations
- 📝 Additional optional fields in responses

**Breaking Changes Require:**
- Major version bump in package.json
- Update CHANGELOG.md
- Deprecation notice in docs

