# MCP Server Integration Guide

## Quick Reference

**Server Location:** `/workspaces/XPR/agentic_dev/experiment_01`  
**Running on:** `http://localhost:3001`  
**Type:** HTTP JSON-RPC 2.0  
**Tools:** 5 (account, chain, block operations)  

---

## Option 1: Direct HTTP Testing (Current)

### Start Server
```bash
cd /workspaces/XPR/agentic_dev/experiment_01
npm start
# Server runs on http://localhost:3001
```

### Test with curl
```bash
# List tools
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Get account
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":2,"method":"tools/call",
    "params":{
      "name":"get_account",
      "arguments":{"account_name":"zenpunk"}
    }
  }'
```

### Test with Python Client
```bash
cd /workspaces/XPR/agentic_dev/experiment_01
python3 test_client.py
```

**Output:** Tests all 5 tools and displays results

---

## Option 2: VS Code Copilot Integration

### Configuration
Edit VS Code settings to use this MCP server:

**File:** `~/.config/Code/User/settings.json` (Linux/Mac) or `%APPDATA%\Code\User\settings.json` (Windows)

```json
{
  "github.copilot.advanced": {
    "mcpServers": {
      "proton-cli": {
        "command": "node",
        "args": ["/workspaces/XPR/agentic_dev/experiment_01/dist/index.js"]
      }
    }
  }
}
```

### Usage in Copilot
Once configured, Copilot will have access to:
- `get_account` - Query blockchain accounts
- `get_chain_info` - Get current chain state
- `get_block` - Fetch block details
- `get_block_transaction_count` - Count transactions

Ask Copilot: *"Use the get_account tool to find information about the zenpunk account"*

---

## Option 3: Standalone MCP Client Integration

### Using Python Client Library
```python
from test_client import MCPClient

client = MCPClient("http://localhost:3001")

# List tools
tools = client.list_tools()

# Get account
account = client.get_account("zenpunk")

# Get chain info
chain = client.get_chain_info()

# Get block
block = client.get_block("357180388")
```

### Using Node.js Client
```javascript
const axios = require('axios');

async function callTool(toolName, args) {
  const response = await axios.post(
    'http://localhost:3001/mcp',
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    }
  );
  return response.data.result;
}

// Example
const account = await callTool('get_account', { account_name: 'zenpunk' });
console.log(account);
```

---

## Option 4: Docker Containerization (Future)

### Build Docker Image
```dockerfile
FROM node:20

WORKDIR /app
COPY . .
RUN npm install && npm run build

EXPOSE 3001

CMD ["node", "dist/index.js"]
```

### Run
```bash
docker build -t proton-mcp-server .
docker run -p 3001:3001 proton-mcp-server
```

---

## Testing Endpoints

### Health Check
```bash
curl http://localhost:3001/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "proton-mcp-server",
  "timestamp": "2025-12-20T23:33:00.000Z"
}
```

### List Tools
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "get_account",
        "description": "Retrieve Proton account information...",
        "inputSchema": {...}
      },
      ...
    ]
  }
}
```

### Call Tool
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":2,"method":"tools/call",
    "params":{
      "name":"get_account",
      "arguments":{"account_name":"zenpunk"}
    }
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "name": "zenpunk",
    "created": "2025-11-09T03:14:47.000",
    "resources": {...},
    "permissions": [...],
    "voter_info": {...}
  }
}
```

---

## Tool Reference

### 1. get_account
**Purpose:** Get full account information

**Input:**
```json
{
  "account_name": "zenpunk"
}
```

**Output:**
```json
{
  "name": "zenpunk",
  "created": "2025-11-09T03:14:47.000",
  "resources": {
    "cpu_limit": {"used": 728, "available": 3215644, "max": 3216372},
    "net_limit": {"used": 353, "available": 17389089, "max": 17389442},
    "ram_quota": 13399,
    "ram_usage": 7367
  },
  "permissions": [...],
  "voter_info": {...}
}
```

### 2. get_account_resources
**Purpose:** Quick resource query

**Input:**
```json
{
  "account_name": "zenpunk"
}
```

**Output:**
```json
{
  "cpu_limit": {...},
  "net_limit": {...},
  "ram_quota": 13399,
  "ram_usage": 7367
}
```

### 3. get_chain_info
**Purpose:** Get chain metadata

**Input:** (none)

**Output:**
```json
{
  "chain_id": "384da888...",
  "head_block_num": 357180388,
  "head_block_id": "...",
  "head_block_time": "2025-12-20T23:30:00.000Z",
  "server_version_string": "v3.1.2"
}
```

### 4. get_block
**Purpose:** Get block details with transactions

**Input:**
```json
{
  "block_num_or_id": "357180388"
}
```

**Output:**
```json
{
  "timestamp": "2025-12-20T23:30:00.000Z",
  "producer": "producername",
  "confirmed": 127,
  "block_num": 357180388,
  "transactions": [...]
}
```

### 5. get_block_transaction_count
**Purpose:** Count transactions in a block

**Input:**
```json
{
  "block_num_or_id": "357180388"
}
```

**Output:**
```json
{
  "transaction_count": 0
}
```

---

## Performance Characteristics

| Operation | Min | Avg | Max |
|-----------|-----|-----|-----|
| get_account | 150ms | 230ms | 300ms |
| get_account_resources | 140ms | 220ms | 280ms |
| get_chain_info | 120ms | 170ms | 200ms |
| get_block | 140ms | 180ms | 250ms |
| get_block_transaction_count | 160ms | 220ms | 280ms |
| tools/list | 5ms | 8ms | 15ms |
| /health | 2ms | 3ms | 8ms |

**Average E2E latency:** ~200ms (acceptable for agentic use)

---

## Troubleshooting

### Server won't start
```bash
# Check if port 3001 is already in use
lsof -i :3001

# Kill existing process
pkill -f "node dist/index.js"

# Rebuild and restart
npm run build && npm start
```

### Tools not responding
```bash
# Check server health
curl http://localhost:3001/health

# Check if proton CLI is available
proton account zenpunk -r
```

### JSON parsing errors
The server handles CLI debug output automatically. If you're seeing parse errors:
- Check that proton CLI is properly installed: `which proton`
- Run manually to see output: `proton chain:info -r`

### Connection timeout
- Ensure server is running: `ps aux | grep "node dist"`
- Verify network connectivity: `curl http://localhost:3001`
- Check firewall rules for port 3001

---

## Next Steps

### Iteration 2 Features (Coming Soon)
- [ ] Caching layer for frequent queries
- [ ] Transaction filtering tools
- [ ] Error message improvements
- [ ] Rate limiting per tool
- [ ] Structured logging

### Iteration 3+ Roadmap
- [ ] Streaming block tails
- [ ] Advanced filtering
- [ ] Performance optimization
- [ ] Production hardening
- [ ] Distributed caching

---

## Support & Documentation

See project documentation:
- **Architecture:** `agent.md`
- **Technical Details:** `task.md`
- **Test Results:** `TEST_RESULTS.md`
- **Quick Start:** `README.md`

