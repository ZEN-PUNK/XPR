# API Reference: XPR Blockchain MCP Server

> Quick reference for all available tools and how to use them

## Available Tools (5 Total)

### 1. get_account

**Get complete account information**

```json
{
  "name": "get_account",
  "description": "Retrieve Proton account information including resources, permissions, and voting status",
  "inputSchema": {
    "type": "object",
    "properties": {
      "account_name": {
        "type": "string",
        "description": "Proton account name (e.g., 'zenpunk')"
      }
    },
    "required": ["account_name"]
  }
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3001 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"tools/call",
    "params":{
      "name":"get_account",
      "arguments":{"account_name":"zenpunk"}
    }
  }'
```

**Example Response:**
```json
{
  "jsonrpc":"2.0",
  "id":1,
  "result":{
    "name":"zenpunk",
    "created":"2025-11-09T03:14:47.000",
    "resources":{
      "cpu_limit":{"used":729,"available":3215643,"max":3216372},
      "net_limit":{"used":359,"available":17389083,"max":17389442},
      "ram_quota":13399,
      "ram_usage":7367
    },
    "permissions":[...],
    "voter_info":null,
    "total_resources":{...}
  }
}
```

**Fields Returned:**
| Field | Type | Description |
|-------|------|-------------|
| name | string | Account name |
| created | ISO8601 | Account creation timestamp |
| resources | object | CPU/NET/RAM limits and usage |
| resources.cpu_limit | object | CPU: used, available, max |
| resources.net_limit | object | NET: used, available, max |
| resources.ram_quota | number | Total RAM quota (bytes) |
| resources.ram_usage | number | RAM currently used (bytes) |
| permissions | array | Account permissions (active, owner, etc) |
| voter_info | object\|null | Voting status if registered |

**Error Cases:**
```json
{
  "jsonrpc":"2.0",
  "id":1,
  "error":{
    "code":-32603,
    "message":"Tool execution failed",
    "data":{"error":"Account not found"}
  }
}
```

---

### 2. get_account_resources

**Get quick CPU/NET/RAM resource summary**

```json
{
  "name":"get_account_resources",
  "description":"Get CPU, NET, and RAM resource information for a Proton account",
  "inputSchema":{
    "type":"object",
    "properties":{
      "account_name":{"type":"string"}
    },
    "required":["account_name"]
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3001 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":2,"method":"tools/call",
    "params":{
      "name":"get_account_resources",
      "arguments":{"account_name":"zenpunk"}
    }
  }'
```

**Response:**
```json
{
  "cpu_available":3215643,
  "net_available":17389083,
  "ram_quota":13399,
  "ram_used":7367
}
```

**Use Case:** When you only need quick resource overview (lighter payload than get_account)

---

### 3. get_chain_info

**Get current Proton chain metadata**

```json
{
  "name":"get_chain_info",
  "description":"Get current Proton chain information including head block, version, and state",
  "inputSchema":{
    "type":"object",
    "properties":{},
    "required":[]
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3001 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":3,"method":"tools/call",
    "params":{
      "name":"get_chain_info",
      "arguments":{}
    }
  }'
```

**Response:**
```json
{
  "head_block_num":357180388,
  "head_block_id":"...",
  "head_block_time":"2025-12-21T00:31:43.500",
  "version":"v3.1.2",
  "chain_id":"384da888...",
  "last_irreversible_block_num":357180388
}
```

**Fields:**
| Field | Description |
|-------|-------------|
| head_block_num | Current block height |
| head_block_time | Latest block timestamp |
| version | Proton protocol version |
| chain_id | Network identifier |
| last_irreversible_block_num | Last finalized block |

---

### 4. get_block

**Get block details including transactions**

```json
{
  "name":"get_block",
  "description":"Retrieve Proton block details including timestamp, producer, and transactions",
  "inputSchema":{
    "type":"object",
    "properties":{
      "block_num_or_id":{
        "type":"string",
        "description":"Block number (integer) or block ID (hash)"
      }
    },
    "required":["block_num_or_id"]
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3001 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":4,"method":"tools/call",
    "params":{
      "name":"get_block",
      "arguments":{"block_num_or_id":"1"}
    }
  }'
```

**Response:**
```json
{
  "timestamp":"2019-05-30T15:30:01.500",
  "producer":"systemacnt",
  "confirmed":0,
  "previous":"0000000000000000000000000000000000000000000000000000000000000000",
  "transaction_mroot":"0000000000000000000000000000000000000000000000000000000000000000",
  "action_mroot":"0000000000000000000000000000000000000000000000000000000000000000",
  "schedule_version":0,
  "new_producers":null,
  "header_extensions":[],
  "producer_signature":"...",
  "transactions":[
    {
      "status":"executed",
      "cpu_usage_us":100,
      "net_usage_words":0,
      "trx":{...}
    }
  ],
  "id":"0000000142ab2e35...",
  "block_num":1
}
```

**Fields:**
| Field | Description |
|-------|-------------|
| block_num | Block height |
| timestamp | Block creation time |
| producer | Account that produced block |
| transactions | Array of transactions in block |
| id | Block ID (hash) |

---

### 5. get_block_transaction_count

**Count transactions in a block**

```json
{
  "name":"get_block_transaction_count",
  "description":"Get the number of transactions in a Proton block",
  "inputSchema":{
    "type":"object",
    "properties":{
      "block_num_or_id":{"type":"string"}
    },
    "required":["block_num_or_id"]
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3001 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":5,"method":"tools/call",
    "params":{
      "name":"get_block_transaction_count",
      "arguments":{"block_num_or_id":"357180388"}
    }
  }'
```

**Response:**
```json
{
  "transaction_count":12
}
```

---

## Non-Tool Endpoints

### GET /health

Server health check

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status":"ok",
  "service":"proton-mcp-server",
  "timestamp":"2025-12-21T00:31:00.000Z"
}
```

### GET /

Server info

```bash
curl http://localhost:3001
```

Response:
```json
{
  "name":"Proton Blockchain MCP Server",
  "version":"1.0.0",
  "description":"MCP server for Proton blockchain queries",
  "endpoints":{
    "health":"/health",
    "mcp":"/",
    "legacy":"/mcp"
  }
}
```

### POST /authorize

OAuth authorization flow (used by Copilot)

```bash
curl "http://localhost:3001/authorize?state=xyz&redirect_uri=https://..."
```

### POST /token

Generate OAuth tokens

```bash
curl -X POST http://localhost:3001/token \
  -H "Content-Type: application/json" \
  -d '{"grant_type":"authorization_code","code":"..."}'
```

Response:
```json
{
  "access_token":"xpr_...",
  "token_type":"Bearer",
  "expires_in":3600,
  "scope":"read write"
}
```

---

## Protocol Details

### JSON-RPC 2.0 Compliant

All tool calls use JSON-RPC 2.0 format:

**Request:**
```json
{
  "jsonrpc":"2.0",
  "id":"<unique-id>",
  "method":"tools/call",
  "params":{
    "name":"<tool-name>",
    "arguments":{...}
  }
}
```

**Success Response:**
```json
{
  "jsonrpc":"2.0",
  "id":"<same-id>",
  "result":{...}
}
```

**Error Response:**
```json
{
  "jsonrpc":"2.0",
  "id":"<same-id>",
  "error":{
    "code":-32603,
    "message":"Tool execution failed",
    "data":{...}
  }
}
```

### Error Codes

| Code | Meaning |
|------|---------|
| -32600 | Invalid Request |
| -32601 | Method not found |
| -32602 | Invalid params |
| -32603 | Internal server error |

---

## Usage in Copilot

In VS Code Copilot chat, use tools via the MCP interface:

```
@xpr-blockchain Get the account info for zenpunk
```

Or programmatically via stdio:

```python
import json
import subprocess

request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
        "name": "get_account",
        "arguments": {"account_name": "zenpunk"}
    }
}

proc = subprocess.Popen(
    ["node", "/path/to/dist/stdio-server.js"],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE
)
output, _ = proc.communicate(json.dumps(request).encode())
result = json.loads(output)
```

---

## Rate Limits

- **No rate limiting** on local instance
- **Timeout:** 15 seconds per tool call
- **Concurrent calls:** Unlimited (single-threaded Node.js queues them)

---

## Changelog

### v1.0.0 (Current)
- ✅ 5 tools implemented
- ✅ JSON-RPC 2.0 compliant
- ✅ OAuth token support
- ✅ Stdio + HTTP transports
- ✅ Tested with real blockchain data

