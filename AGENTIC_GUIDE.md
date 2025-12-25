# Agentic Development Guide for XPR MCP Server

> **Purpose:** Enable AI agents and developers to efficiently navigate, understand, and extend the XPR MCP Server codebase using agentic patterns and copilot-assisted development.

## Quick Navigation for Agents

### 🎯 First 5 Minutes
1. **Understand scope**: This is an MCP server for XPR Network (Proton blockchain) with dual deployment modes:
   - Standalone MCP server (stdio transport)
   - Azure Functions REST API
2. **See the code**: 
   - MCP Server: `src/index.js` (~356 lines)
   - XPR Client: `src/xpr-client.js` (~132 lines)
   - Azure Functions: `functions/index.js` (~339 lines)
3. **Run it**: `npm start` → MCP server on stdio
4. **Test it**: `npm test` → runs structure validation

### 🔍 Understanding the Codebase

**Context Window Optimization:**
- Core logic is ~830 lines across 3 main files
- Clean module separation: MCP server, API client, Azure handlers
- No external CLI dependencies - direct RPC calls to XPR Network
- Dependencies: `@modelcontextprotocol/sdk`, `@azure/functions`, `node-fetch`

**Key Files (by frequency of change):**
1. `src/index.js` - MCP server with tool definitions (add new tools here)
2. `src/xpr-client.js` - XPR Network API client (add new RPC methods here)
3. `functions/index.js` - Azure Functions handlers (add new endpoints here)
4. `package.json` - Dependencies and scripts

### 📋 Document Structure for Agents

| Document | File | Use When | Agent Context |
|----------|------|----------|---------------|
| **This guide** | AGENTIC_GUIDE.md | Bootstrapping understanding | Entry point for new agents |
| **Architecture** | ARCHITECTURE.md | Understanding structure | System design and modules |
| **API Reference** | API_REFERENCE.md | Implementing tools | Tool schemas & examples |
| **Patterns** | AGENT_PATTERNS.md | Best practices | Common development patterns |
| **README** | README.md | Usage & deployment | User-facing documentation |

---

## Agentic Workflow Patterns

### Pattern 1: Adding a New MCP Tool

**Goal:** Expose a new XPR Network RPC endpoint as an MCP tool

**Steps (in order):**
1. Add RPC method to XPRClient (`src/xpr-client.js`):
   ```javascript
   async newMethod(param) {
     return await this.post('/v1/chain/new_endpoint', { param });
   }
   ```

2. Add tool definition to MCP server (`src/index.js`):
   - Add to tools array in `ListToolsRequestSchema` handler
   - Add case in `CallToolRequestSchema` handler

3. (Optional) Add Azure Function handler (`functions/index.js`):
   ```javascript
   app.http('newEndpoint', {
     methods: ['GET', 'POST'],
     authLevel: 'anonymous',
     handler: async (request, context) => {
       // Implementation
     }
   });
   ```

4. Test the tool:
   - For MCP: Test via MCP client
   - For Azure: `curl http://localhost:7071/api/newEndpoint`

5. Update documentation:
   - Add to API_REFERENCE.md
   - Update README.md available tools list

**Example:**
```javascript
// Step 1: Add to XPRClient (src/xpr-client.js)
async getProducerSchedule() {
  return await this.post('/v1/chain/get_producer_schedule', {});
}

// Step 2: Add to MCP Server (src/index.js)
// In tools array:
{
  name: 'get_producer_schedule',
  description: 'Get the current block producer schedule',
  inputSchema: {
    type: 'object',
    properties: {},
  },
}

// In handler switch:
case 'get_producer_schedule': {
  const schedule = await this.xprClient.getProducerSchedule();
  return {
    content: [{ type: 'text', text: JSON.stringify(schedule, null, 2) }],
  };
}
```

### Pattern 2: Fixing a Bug

**Goal:** Locate, fix, and test a bug efficiently

**Search Strategy:**
1. Error in MCP tool → check `src/index.js` tool handler
2. Error in RPC call → check `src/xpr-client.js` method
3. Error in Azure Function → check `functions/index.js` handler
4. Fix → update the specific module
5. Test → run `npm test` and manual verification

### Pattern 3: Adding Azure Function Endpoint

**Goal:** Add a new REST endpoint for Azure Functions deployment

**Pattern:**
```javascript
app.http('endpointName', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      // Parse parameters
      let param;
      if (request.method === 'GET') {
        param = request.query.get('param_name');
      } else {
        const body = await request.json();
        param = body.param_name;
      }

      // Validate
      if (!param) {
        return {
          status: 400,
          jsonBody: { error: 'param_name is required' },
        };
      }

      // Call XPR client
      const result = await xprClient.methodName(param);
      
      return {
        status: 200,
        jsonBody: result,
      };
    } catch (error) {
      context.error('Error:', error);
      return {
        status: 500,
        jsonBody: { error: error.message },
      };
    }
  },
});
```

---

## Code Navigation Tips for Agents

### Finding Where Something Is Handled

**Question: "How does get_account work?"**
```
1. MCP request → src/index.js handleToolCall()
2. Switch case 'get_account' → xprClient.getAccount()
3. getAccount() → src/xpr-client.js post('/v1/chain/get_account')
4. Returns account data from XPR Network RPC
```

**Command to verify:**
```bash
grep -r "get_account" src/ functions/ --include="*.js" | head -20
```

### Finding All MCP Tools

```bash
grep -A 5 "name: '" src/index.js | grep "name:"
# Returns: all tool definitions in MCP server
```

### Finding All Azure Functions

```bash
grep "app.http(" functions/index.js
# Returns: all Azure Function endpoint names
```

---

## Common Agent Tasks

### Task: Add support for new blockchain query

**Files to edit:** 
1. `src/xpr-client.js` - Add RPC method
2. `src/index.js` - Add MCP tool definition
3. `functions/index.js` - (Optional) Add Azure Function

**Pattern:**
```javascript
// 1. In xpr-client.js
async newQuery(params) {
  return await this.post('/v1/chain/endpoint', params);
}

// 2. In index.js (MCP server)
{
  name: 'new_query',
  description: 'Description of what it does',
  inputSchema: {
    type: 'object',
    properties: {
      param_name: { type: 'string', description: 'Parameter description' }
    },
    required: ['param_name']
  }
}

// 3. In functions/index.js (Azure)
app.http('newQuery', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => { /* ... */ }
});
```

### Task: Update XPR Network endpoint

**Files to check:**
1. `src/xpr-client.js` - Constructor default endpoint
2. `README.md` - Update configuration section

**Default endpoint:** `https://proton.eoscafeblock.com`

To use environment variable:
```javascript
// In xpr-client.js constructor
constructor(endpoint = process.env.XPR_ENDPOINT || 'https://proton.eoscafeblock.com')
```

### Task: Improve error handling

**Pattern for all methods:**
```javascript
try {
  const result = await this.xprClient.method(params);
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result, null, 2)
    }]
  };
} catch (error) {
  return {
    content: [{
      type: 'text',
      text: `Error: ${error.message}`
    }],
    isError: true
  };
}
```

---

## Testing Strategy

### Structure Test
```bash
npm test
# Runs test-structure.js
# Validates: XPRClient class, methods, MCP server setup
```

### Manual MCP Server Test
```bash
# Start server
npm start

# In another terminal, test with MCP client
# (Requires MCP-compatible client)
```

### Azure Functions Test
```bash
# Install Azure Functions Core Tools
npm install -g azure-functions-core-tools@4

# Start local server
func start

# Test endpoints
curl http://localhost:7071/api/getChainInfo
curl "http://localhost:7071/api/getAccount?account_name=proton"
```

---

## Quick Checklist for Agent Tasks

When implementing a feature:
- [ ] Updated XPRClient in `src/xpr-client.js` (if needed)
- [ ] Added MCP tool definition in `src/index.js`
- [ ] Added tool handler in `src/index.js` switch statement
- [ ] (Optional) Added Azure Function in `functions/index.js`
- [ ] Updated API_REFERENCE.md with new tool
- [ ] Updated README.md available tools list
- [ ] Tested manually (MCP or Azure Functions)
- [ ] Ran `npm test` to verify structure

---

## Architecture Principles

### 1. Separation of Concerns
- **XPRClient** (`src/xpr-client.js`): Pure RPC communication layer
- **MCP Server** (`src/index.js`): MCP protocol implementation
- **Azure Functions** (`functions/index.js`): HTTP REST API layer

### 2. No CLI Dependencies
- Unlike `agentic_dev/experiment_01`, this server uses direct RPC calls
- No subprocess overhead
- Faster response times (~50-200ms vs 300-700ms)

### 3. Dual Deployment
- Same core logic (`XPRClient`) powers both MCP and Azure deployments
- Choose deployment based on use case:
  - MCP: Agent integration, VS Code Copilot
  - Azure: REST API, webhooks, web applications

### 4. Minimal Dependencies
- Only essential packages: MCP SDK, Azure Functions, node-fetch
- ES modules for modern JavaScript
- No build step required (pure JavaScript)

---

## Links to Other Key Documents

- **For API details:** [API_REFERENCE.md](./API_REFERENCE.md)
- **For architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md)
- **For patterns:** [AGENT_PATTERNS.md](./AGENT_PATTERNS.md)
- **For deployment:** [README.md](./README.md) and [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md)
- **For MCP client config:** [MCP_CLIENT_CONFIG.md](./MCP_CLIENT_CONFIG.md)

---

## Next Steps for Agents

1. **New to the codebase?** Read this guide top to bottom (10 min)
2. **Adding a tool?** Follow "Pattern 1: Adding a New MCP Tool"
3. **Fixing a bug?** Use "Pattern 2: Fixing a Bug" search strategy
4. **Deploying?** Read README.md and AZURE_DEPLOYMENT.md
5. **Extending?** Check AGENT_PATTERNS.md for best practices

**Key:** Treat documentation as code. It compounds value across iterations and makes agent-assisted development more efficient.
