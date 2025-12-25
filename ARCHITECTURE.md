# XPR MCP Server - Architecture Documentation

## Overview

The XPR MCP Server is a dual-deployment system that exposes XPR Network (Proton blockchain) functionality through two interfaces:
1. **Model Context Protocol (MCP) Server** - For AI agent integration
2. **Azure Functions REST API** - For web applications and HTTP clients

Both interfaces share the same core XPR Network client library, ensuring consistent behavior across deployment modes.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Applications                          │
│                                                                      │
│  ├─ AI Agents (via MCP)      ├─ VS Code Copilot                    │
│  ├─ Web Apps (via REST)      ├─ Mobile Apps                        │
│  └─ Automation Scripts       └─ Webhooks                           │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                ┌───────────────────┴───────────────────┐
                │                                       │
┌───────────────▼──────────────┐      ┌────────────────▼──────────────┐
│     MCP Server (stdio)       │      │   Azure Functions (HTTP)      │
│   src/index.js               │      │   functions/index.js          │
│                              │      │                               │
│   - MCP Protocol Handler     │      │   - REST API Endpoints        │
│   - Tool Registry            │      │   - Request/Response Parser   │
│   - JSON-RPC 2.0             │      │   - HTTP Error Handling       │
└───────────────┬──────────────┘      └────────────────┬──────────────┘
                │                                       │
                └───────────────────┬───────────────────┘
                                    │
                    ┌───────────────▼──────────────┐
                    │      XPR Network Client      │
                    │    src/xpr-client.js         │
                    │                              │
                    │  - RPC Communication         │
                    │  - JSON Request/Response     │
                    │  - Error Handling            │
                    └───────────────┬──────────────┘
                                    │
                    ┌───────────────▼──────────────┐
                    │   XPR Network RPC Nodes      │
                    │  proton.eoscafeblock.com     │
                    │                              │
                    │  - Blockchain State          │
                    │  - Transaction History       │
                    │  - Smart Contract Data       │
                    └──────────────────────────────┘
```

## Module Structure

### 1. XPR Network Client (`src/xpr-client.js`)

**Purpose:** Low-level RPC communication layer for XPR Network

**Responsibilities:**
- Make HTTP POST requests to XPR RPC endpoints
- Handle JSON serialization/deserialization
- Provide typed methods for each RPC endpoint
- Basic error handling and HTTP status validation

**Key Methods:**
```javascript
class XPRClient {
  constructor(endpoint = 'https://proton.eoscafeblock.com')
  
  // Core RPC wrapper
  async post(path, data)
  
  // Chain queries
  async getInfo()                    // Blockchain metadata
  async getBlock(blockNumOrId)       // Block details
  async getProducers(limit)          // Block producer list
  
  // Account queries
  async getAccount(accountName)      // Account info + resources
  async getCurrencyBalance(...)      // Token balances
  async getActions(accountName, ...) // Transaction history
  async getAbi(accountName)          // Contract ABI
  
  // Smart contract queries
  async getTableRows(code, scope, table, options)
  
  // Transaction operations
  async getTransaction(id)
  async pushTransaction(signatures, serializedTransaction)
}
```

**Dependencies:**
- `node-fetch` - HTTP client for making RPC calls

**Error Handling:**
- Throws Error on non-200 HTTP status
- Includes endpoint path and status in error message
- Client code responsible for try/catch

### 2. MCP Server (`src/index.js`)

**Purpose:** Model Context Protocol server implementation

**Responsibilities:**
- Implement MCP protocol (JSON-RPC 2.0 over stdio)
- Register and expose blockchain tools
- Handle tool invocation requests
- Format responses in MCP-compliant structure

**Key Components:**

#### XPRMCPServer Class
```javascript
class XPRMCPServer {
  constructor()
  setupHandlers()  // Register MCP protocol handlers
  async run()      // Start stdio transport
}
```

#### MCP Protocol Handlers

**1. ListToolsRequestSchema Handler**
- Returns array of available tools
- Each tool has: name, description, inputSchema (JSON Schema)
- Total: 9 tools exposed

**2. CallToolRequestSchema Handler**
- Receives tool name and arguments
- Routes to appropriate XPRClient method
- Formats response as MCP content array
- Handles errors with `isError: true` flag

**Available MCP Tools:**
1. `get_chain_info` - Blockchain metadata
2. `get_account` - Account information
3. `get_balance` - Token balance
4. `get_block` - Block details
5. `get_transaction` - Transaction info
6. `get_table_rows` - Smart contract table data
7. `get_actions` - Account transaction history
8. `get_abi` - Contract ABI
9. `get_producers` - Block producer list

**Dependencies:**
- `@modelcontextprotocol/sdk/server` - MCP protocol implementation
- `@modelcontextprotocol/sdk/types` - Request/response schemas
- `./xpr-client.js` - XPR Network communication

**Transport:**
- StdioServerTransport - Communication via stdin/stdout
- Suitable for: AI agents, CLI tools, process-based integration

### 3. Azure Functions (`functions/index.js`)

**Purpose:** HTTP REST API wrapper around XPRClient

**Responsibilities:**
- Handle HTTP GET/POST requests
- Parse query parameters and JSON bodies
- Validate required parameters
- Return JSON responses with appropriate status codes
- Log errors to Azure context

**Azure Function Endpoints:**

| Function Name | HTTP Methods | Parameters | Description |
|--------------|--------------|------------|-------------|
| `getChainInfo` | GET, POST | - | Get blockchain info |
| `getAccount` | GET, POST | `account_name` | Get account details |
| `getBalance` | GET, POST | `account`, `code`, `symbol` | Get token balance |
| `getBlock` | GET, POST | `block_num_or_id` | Get block info |
| `getTransaction` | GET, POST | `transaction_id` | Get transaction |
| `getTableRows` | POST | `code`, `scope`, `table`, `limit`, etc. | Query contract table |
| `getActions` | GET, POST | `account_name`, `pos`, `offset` | Get action history |
| `getAbi` | GET, POST | `account_name` | Get contract ABI |
| `getProducers` | GET, POST | `limit` | Get producer list |

**Response Format:**
```javascript
// Success
{
  status: 200,
  jsonBody: { /* result data */ }
}

// Error
{
  status: 400 | 500,
  jsonBody: { error: "error message" }
}
```

**Dependencies:**
- `@azure/functions` - Azure Functions runtime
- `../src/xpr-client.js` - XPR Network communication

**Deployment:**
- Azure Functions v4
- Node.js 20 runtime
- Consumption or Premium plan

## Data Flow

### MCP Tool Invocation Flow

```
1. AI Agent → MCP Client
   └─ JSON-RPC request: {"method": "tools/call", "params": {...}}

2. MCP Client → MCP Server (stdio)
   └─ stdin: JSON-RPC request

3. MCP Server → XPRClient
   └─ Method call: xprClient.getAccount("proton")

4. XPRClient → XPR Network RPC
   └─ HTTP POST: /v1/chain/get_account

5. XPR Network RPC → XPRClient
   └─ HTTP 200: JSON response with account data

6. XPRClient → MCP Server
   └─ Return: JavaScript object

7. MCP Server → MCP Client
   └─ stdout: MCP response with content array

8. MCP Client → AI Agent
   └─ Parsed result for agent processing
```

### Azure Function Request Flow

```
1. HTTP Client → Azure Functions
   └─ GET/POST: /api/getAccount?account_name=proton

2. Azure Function Handler → Parameter Parsing
   └─ Extract: account_name from query or body

3. Parameter Validation
   └─ Return 400 if required params missing

4. Azure Function → XPRClient
   └─ Method call: xprClient.getAccount("proton")

5. XPRClient → XPR Network RPC
   └─ HTTP POST: /v1/chain/get_account

6. XPR Network RPC → XPRClient
   └─ HTTP 200: JSON response

7. XPRClient → Azure Function
   └─ Return: JavaScript object

8. Azure Function → HTTP Client
   └─ HTTP 200: JSON response
```

## Design Decisions

### 1. Direct RPC vs CLI Wrapper

**Decision:** Use direct RPC calls to XPR Network

**Rationale:**
- Better performance (no subprocess overhead)
- Simpler dependency management (no CLI installation required)
- More reliable in containerized/serverless environments
- Easier to debug and test

**Tradeoff:**
- Must manually implement RPC methods (vs using CLI)
- Need to keep up with XPR Network API changes

### 2. Shared Client Library

**Decision:** Single XPRClient used by both MCP and Azure deployments

**Rationale:**
- DRY principle - single source of truth
- Consistent behavior across deployments
- Easier testing and maintenance
- Bug fixes benefit both interfaces

**Implementation:**
- MCP server imports XPRClient as ES module
- Azure Functions imports same XPRClient
- Both can override endpoint via constructor

### 3. ES Modules

**Decision:** Use ES modules (`type: "module"` in package.json)

**Rationale:**
- Modern JavaScript standard
- Better tree-shaking and bundle optimization
- Native async/await support
- Consistent with MCP SDK

**Requirement:**
- Node.js 16+ required
- Use `.js` extension in imports
- No build step needed

### 4. Error Handling Strategy

**Decision:** Throw errors at RPC layer, catch and format at interface layer

**MCP Server:**
```javascript
try {
  const result = await this.xprClient.method(args);
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
} catch (error) {
  return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
}
```

**Azure Functions:**
```javascript
try {
  const result = await xprClient.method(params);
  return { status: 200, jsonBody: result };
} catch (error) {
  return { status: 500, jsonBody: { error: error.message } };
}
```

**Rationale:**
- XPRClient stays simple and focused on RPC
- Interface layers handle presentation of errors
- Consistent error structure for each interface type

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `XPR_ENDPOINT` | `https://proton.eoscafeblock.com` | XPR RPC endpoint URL |
| `PORT` | `7071` | Azure Functions local port |

### Network Endpoints

**Mainnet:**
- `https://proton.eoscafeblock.com` (default)
- `https://proton.greymass.com`
- `https://proton.cryptolions.io`

**Testnet:**
- `https://testnet.protonchain.com`

## Performance Characteristics

### Latency

**MCP Server (stdio):**
- Tool invocation overhead: ~10-50ms
- RPC call latency: ~100-300ms (network dependent)
- Total round-trip: ~150-400ms

**Azure Functions (HTTP):**
- Cold start: ~1-3 seconds (first request)
- Warm invocation: ~50-150ms
- RPC call latency: ~100-300ms
- Total round-trip: ~200-500ms (warm)

### Throughput

**Theoretical:**
- Limited by XPR Network RPC endpoint capacity
- Typical: 10-50 requests/second per endpoint

**Actual:**
- Depends on RPC node, network conditions, query complexity
- Smart contract table queries slower than simple getInfo

### Resource Usage

**Memory:**
- Node.js base: ~30-50 MB
- Per request: ~1-5 MB (varies by response size)

**CPU:**
- Minimal (I/O bound, not CPU bound)
- JSON parsing is the main CPU task

## Security Considerations

### 1. Read-Only Operations

**Current State:** All exposed tools are read-only queries
- No transaction signing
- No private key handling
- No state modification

**Implications:**
- Safe for public exposure (with rate limiting)
- No risk of unauthorized transactions
- Cannot drain accounts or modify blockchain state

### 2. Future: Write Operations

**If Adding Transaction Support:**
- Implement proper authentication
- Secure private key storage (never in code)
- Use Azure Key Vault or similar
- Add transaction signing workflow
- Implement spending limits and approval flows

### 3. API Rate Limiting

**Current:** No built-in rate limiting

**Recommended for Production:**
- Azure API Management for Azure Functions
- Add rate limiting middleware for MCP server
- Monitor and alert on unusual patterns

### 4. Input Validation

**Current:** Minimal validation
- MCP: JSON Schema validation via MCP SDK
- Azure: Manual parameter checking

**Recommended:**
- Add input sanitization
- Validate account name format
- Limit query sizes (e.g., max table rows)
- Prevent injection attacks in table queries

## Testing Strategy

### Unit Tests
**Location:** `test-structure.js`

**Coverage:**
- XPRClient class instantiation
- Method availability verification
- MCP Server class instantiation
- Module exports validation

### Integration Tests
**Manual Testing:**

**MCP Server:**
```bash
npm start
# Use MCP client to invoke tools
```

**Azure Functions:**
```bash
func start
curl http://localhost:7071/api/getChainInfo
curl "http://localhost:7071/api/getAccount?account_name=proton"
```

### End-to-End Tests
**Scenarios:**
1. Get chain info → verify response structure
2. Get account → validate account data format
3. Get balance → check balance array format
4. Get block → verify block structure
5. Get transaction → validate transaction format
6. Error handling → test invalid inputs

## Deployment Architecture

### MCP Server Deployment

**Local Development:**
```bash
npm start
```

**Integration with AI Agents:**
- Configure MCP client with server path
- Use stdio transport
- See `MCP_CLIENT_CONFIG.md` for details

### Azure Functions Deployment

**Local Development:**
```bash
func start
```

**Azure Cloud:**
```bash
func azure functionapp publish <app-name>
```

**Infrastructure:**
- Azure Function App (Node.js 20)
- Consumption or Premium plan
- Optional: Application Insights for monitoring
- Optional: API Management for rate limiting

### Containerization (Optional)

**Docker for MCP Server:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
CMD ["node", "src/index.js"]
```

**Docker for Azure Functions:**
```dockerfile
FROM mcr.microsoft.com/azure-functions/node:4-node20
COPY . /home/site/wwwroot
RUN cd /home/site/wwwroot && npm ci --only=production
```

## Extension Points

### Adding New Tools

**Process:**
1. Add method to `XPRClient` if new RPC endpoint needed
2. Add tool definition to MCP server tools array
3. Add case to MCP server tool handler switch
4. (Optional) Add Azure Function handler
5. Update documentation

**Example Locations:**
- `src/xpr-client.js` - Lines 8-131
- `src/index.js` - Lines 34-192 (tool definitions), 194-339 (handlers)
- `functions/index.js` - Add new `app.http()` block

### Custom Endpoints

**Override Default Endpoint:**
```javascript
// src/index.js
this.xprClient = new XPRClient('https://custom-endpoint.com');

// functions/index.js
const xprClient = new XPRClient('https://custom-endpoint.com');
```

**Environment Variable:**
```javascript
const endpoint = process.env.XPR_ENDPOINT || 'https://proton.eoscafeblock.com';
this.xprClient = new XPRClient(endpoint);
```

### Middleware

**For Express-based MCP Server:**
- Add logging middleware
- Add authentication middleware
- Add rate limiting middleware

**For Azure Functions:**
- Use Azure Functions middleware
- Azure API Management policies
- Application Insights for monitoring

## Monitoring and Observability

### Logging

**MCP Server:**
- stderr for server status: `console.error('XPR MCP Server running')`
- Tool invocation errors logged to stderr

**Azure Functions:**
- `context.error()` for errors
- Azure Application Insights integration
- Function execution logs in Azure Portal

### Metrics

**Key Metrics to Track:**
- Tool invocation count by tool name
- Average response time per tool
- Error rate by error type
- RPC endpoint response time
- Azure Functions cold start frequency

### Health Checks

**MCP Server:**
- Verify server startup message
- Test tool invocation

**Azure Functions:**
- Azure built-in health endpoint
- Custom health check function (recommended)

## Future Enhancements

### Planned Features
1. **Caching Layer** - Redis or in-memory cache for frequent queries
2. **WebSocket Support** - Real-time blockchain events
3. **Transaction Signing** - Secure transaction creation and signing
4. **Multi-Network Support** - Mainnet, testnet, custom networks
5. **Batch Operations** - Multiple queries in single request
6. **GraphQL Interface** - Alternative to REST for complex queries

### Architecture Evolution
1. **Microservices** - Separate services for different tool categories
2. **Event-Driven** - Pub/sub for blockchain events
3. **CQRS** - Separate read/write models if adding transactions
4. **API Gateway** - Centralized routing and security

## References

- [XPR Network](https://www.protonchain.com/)
- [XPR RPC API Documentation](https://docs.protonchain.com/)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Azure Functions Documentation](https://docs.microsoft.com/azure/azure-functions/)
- [EOSIO RPC API](https://developers.eos.io/manuals/eos/latest/nodeos/plugins/chain_api_plugin/api-reference/index) (XPR is EOSIO-based)
