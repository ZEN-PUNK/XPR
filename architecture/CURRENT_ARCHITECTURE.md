# Current Architecture Overview

## System Overview

The XPR MCP Server is a dual-mode application that provides access to the XPR Network (Proton blockchain) through two interfaces:

1. **MCP Server**: Standalone server using Model Context Protocol over stdio
2. **Azure Functions**: Serverless HTTP API endpoints

```
┌─────────────────────────────────────────────────────────────┐
│                    External Clients                         │
│     (MCP Clients, Azure Function HTTP requests)             │
└─────────────────┬───────────────────┬───────────────────────┘
                  │                   │
                  ↓                   ↓
        ┌──────────────────┐  ┌──────────────────┐
        │  MCP Server      │  │  Azure Functions │
        │  (src/index.js)  │  │  (functions/)    │
        └────────┬─────────┘  └────────┬─────────┘
                 │                     │
                 └──────────┬──────────┘
                            ↓
                   ┌─────────────────┐
                   │   XPR Client    │
                   │ (xpr-client.js) │
                   └────────┬────────┘
                            │
                            ↓
                   ┌─────────────────┐
                   │   XPR Network   │
                   │  (Proton API)   │
                   └─────────────────┘
```

## Core Components

### 1. XPRClient (`src/xpr-client.js`)

**Responsibility**: Interact with the XPR Network blockchain API

**Key Features**:
- HTTP client wrapper around Proton blockchain RPC endpoints
- Methods for common blockchain operations:
  - `getInfo()` - Chain information
  - `getAccount()` - Account details
  - `getCurrencyBalance()` - Token balances
  - `getBlock()` - Block data
  - `getTransaction()` - Transaction details
  - `getTableRows()` - Smart contract table queries
  - `getActions()` - Account action history
  - `getAbi()` - Contract ABI
  - `getProducers()` - Block producer list

**Current Limitations**:
- Hardcoded endpoint (`https://proton.eoscafeblock.com`)
- No retry logic for failed requests
- No request/response validation
- No caching mechanism
- Basic error handling

### 2. MCP Server (`src/index.js`)

**Responsibility**: Expose blockchain functionality via Model Context Protocol

**Implementation Details**:
- Uses `@modelcontextprotocol/sdk` for protocol handling
- StdioServerTransport for stdio-based communication
- Request handlers for:
  - `ListToolsRequestSchema` - Enumerate available tools
  - `CallToolRequestSchema` - Execute tool requests

**Tool Registration**:
- 9 tools mapped to XPRClient methods
- JSON schema-based input validation
- Structured JSON output

**Current Limitations**:
- No authentication/authorization
- No rate limiting
- Limited error context in responses
- No logging infrastructure

### 3. Azure Functions (`functions/index.js`)

**Responsibility**: Provide HTTP API endpoints for XPR blockchain access

**Implementation Details**:
- Built on `@azure/functions` v4
- 9 HTTP-triggered functions
- Support both GET and POST methods
- Query string and JSON body parameter parsing

**Endpoints**:
1. `getChainInfo` - Blockchain information
2. `getAccount` - Account lookup
3. `getBalance` - Token balance queries
4. `getBlock` - Block retrieval
5. `getTransaction` - Transaction lookup
6. `getTableRows` - Smart contract table queries
7. `getActions` - Action history
8. `getAbi` - Contract ABI retrieval
9. `getProducers` - Producer list

**Current Limitations**:
- Repetitive error handling code across functions
- No input validation layer
- Anonymous auth level (no security)
- No structured logging
- No request/response middleware
- Shared XPRClient instance (potential concurrency issues)

## Data Flow

### MCP Server Request Flow

```
1. Client sends JSON-RPC request via stdio
2. Server receives and parses request
3. Validates request against schema
4. Calls appropriate XPRClient method
5. XPRClient makes HTTP request to Proton API
6. Response formatted as MCP tool result
7. JSON-RPC response sent to client
```

### Azure Functions Request Flow

```
1. HTTP request received by Function App
2. Function handler extracts parameters (query/body)
3. Basic parameter validation
4. Calls XPRClient method
5. XPRClient makes HTTP request to Proton API
6. Response formatted as JSON
7. HTTP response sent to client
```

## Technology Stack

### Runtime & Language
- **Node.js**: JavaScript runtime (ES modules)
- **JavaScript**: ES6+ with module syntax

### Dependencies
- `@modelcontextprotocol/sdk` (^1.24.0) - MCP protocol implementation
- `@azure/functions` (^4.10.0) - Azure Functions runtime
- `node-fetch` (^2.7.0) - HTTP client

### Deployment Targets
- **MCP Server**: Standalone process (npm start)
- **Azure Functions**: Azure Functions runtime (local or cloud)

## Configuration

### Current Configuration
- XPR endpoint: Hardcoded in XPRClient constructor
- Default values:
  - Token contract: `eosio.token`
  - Token symbol: `XPR`
  - Table row limit: 10
  - Action query defaults: `pos=-1, offset=-20`
  - Producer limit: 50

### Configuration Gaps
- No environment-based configuration
- No config file support
- No runtime configuration updates
- No multi-environment support (dev/staging/prod)

## Security Considerations

### Current Security Posture
- MCP Server: stdio transport (local only)
- Azure Functions: Anonymous auth (public access)
- No API keys or authentication
- No rate limiting
- No input sanitization beyond basic parsing

### Security Gaps
- Azure Functions publicly accessible
- No secret management
- No CORS configuration
- No request throttling
- No audit logging

## Performance Characteristics

### XPRClient
- Synchronous HTTP requests (awaited)
- No connection pooling
- No request batching
- No caching

### Expected Performance
- Latency: ~50-500ms per request (depends on Proton API)
- Throughput: Limited by single XPRClient instance
- Concurrency: Node.js event loop (thousands of concurrent requests)

### Performance Bottlenecks
- External API latency
- No caching for repeated queries
- No request optimization

## Operational Concerns

### Monitoring
- No metrics collection
- No performance tracking
- No error rate monitoring
- No health checks (except Azure Functions default)

### Logging
- Basic console.error for MCP Server
- Azure Functions context.error for functions
- No structured logging
- No log aggregation
- No correlation IDs

### Reliability
- No retry logic for transient failures
- No circuit breaker pattern
- No graceful degradation
- Depends entirely on Proton API availability

## Scalability

### Current Scalability
- MCP Server: Single instance
- Azure Functions: Auto-scales by Azure runtime
- XPRClient: Shared instance (potential bottleneck)

### Scale Limitations
- No distributed caching
- No connection pooling
- No request queuing
- Hardcoded single endpoint (no load balancing)

## Testing

### Current Testing
- Basic test runner (`test-structure.js`)
- No unit tests
- No integration tests
- No end-to-end tests
- No mocking framework

### Testing Gaps
- No test coverage measurement
- No automated testing in CI/CD
- No contract testing for API responses
- No performance testing

## Documentation

### Existing Documentation
- `README.md` - Usage and deployment
- `AZURE_DEPLOYMENT.md` - Azure-specific deployment
- `/research` - Research documentation for analytics pipeline
- Code comments - Minimal JSDoc

### Documentation Gaps
- No API documentation
- No architecture diagrams (until now)
- No troubleshooting guides
- No development setup guide
- No contribution guidelines

## Summary

The current architecture is **functional and simple** but has several areas for improvement:

**Strengths**:
- ✅ Clean separation of concerns (client, server, functions)
- ✅ Dual deployment model (flexibility)
- ✅ Simple, easy to understand
- ✅ Uses latest SDK versions with security fixes

**Weaknesses**:
- ❌ Limited error handling and resilience
- ❌ No configuration management
- ❌ Missing monitoring and observability
- ❌ Security concerns (especially Azure Functions)
- ❌ Code duplication in Azure Functions
- ❌ No testing infrastructure
- ❌ Performance optimization opportunities

See [IMPROVEMENTS.md](./IMPROVEMENTS.md) for detailed recommendations.
