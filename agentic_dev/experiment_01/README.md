# Proton CLI MCP Server (Experiment 01)

MCP (Model Context Protocol) server wrapping the Proton CLI for agentic blockchain operations.

## Quick Start

### Prerequisites
- Node.js 16+
- Proton CLI installed globally: `proton` command available
- (Install with: `cd /workspaces/XPR/proton-cli && npm link`)

### Setup & Run

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start server
npm start

# Or run in development mode with auto-reload
npm run dev
```

Server will start on `http://localhost:3001`

## Testing

### Health Check
```bash
curl http://localhost:3001/health
```

### List Available Tools
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

### Get Account Information
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "get_account",
      "arguments": {
        "account_name": "zenpunk"
      }
    }
  }'
```

### Get Current Chain Info
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "get_chain_info",
      "arguments": {}
    }
  }'
```

### Get Block Details
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "get_block",
      "arguments": {
        "block_num_or_id": "1"
      }
    }
  }'
```

## Available Tools

### Account Tools
- **get_account** - Get full account information (resources, permissions, voting)
- **get_account_resources** - Quick access to CPU/NET/RAM resource info

### Chain Tools
- **get_chain_info** - Get current chain metadata (head block, version, etc.)
- **get_block** - Get block details with all transactions
- **get_block_transaction_count** - Get transaction count in a block

## Architecture

See `agent.md` for high-level architecture and design decisions.
See `task.md` for detailed work log and technical notes.

## Project Structure

```
.
├── agent.md                      # Architecture & vision
├── task.md                       # Detailed work log
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── src/
│   ├── server.ts                # MCP server implementation
│   ├── index.ts                 # Entry point
│   ├── tools/
│   │   ├── account-tools.ts     # Account-related MCP tools
│   │   ├── chain-tools.ts       # Chain-related MCP tools
│   │   └── index.ts             # Tool registry
│   └── adapters/
│       ├── account-adapter.ts   # Wraps proton account CLI
│       ├── chain-adapter.ts     # Wraps proton chain:* CLI
│       └── index.ts             # Adapter exports
├── dist/                        # Compiled output (git-ignored)
└── README.md                    # This file
```

## MCP Protocol

This server implements the Model Context Protocol (MCP) using JSON-RPC 2.0 over HTTP POST.

### Request Format
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

### Response Format
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [...]
  }
}
```

## Error Handling

All errors follow JSON-RPC error format:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32603,
    "message": "Tool execution failed",
    "data": {
      "code": "ACCOUNT_NOT_FOUND",
      "message": "Account does not exist",
      "details": {...}
    }
  }
}
```

## Next Steps

- See `task.md` for iteration milestones
- See `agent.md` for architecture and future planning
- Run end-to-end tests after each iteration
- Integrate with VS Code Copilot (Phase 4)

