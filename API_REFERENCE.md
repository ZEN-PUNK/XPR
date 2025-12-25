# XPR MCP Server - API Reference

Complete reference for all available tools, endpoints, and methods in the XPR MCP Server.

## Table of Contents

- [MCP Tools](#mcp-tools)
- [Azure Functions Endpoints](#azure-functions-endpoints)
- [XPR Client Methods](#xpr-client-methods)
- [Data Types](#data-types)
- [Error Handling](#error-handling)

---

## MCP Tools

Model Context Protocol tools available when running the MCP server (`npm start`).

### 1. get_chain_info

Get blockchain metadata and current state.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {}
}
```

**Example Request:**
```json
{
  "name": "get_chain_info",
  "arguments": {}
}
```

**Example Response:**
```json
{
  "server_version": "...",
  "chain_id": "384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0",
  "head_block_num": 1234567,
  "head_block_id": "...",
  "head_block_time": "2024-01-01T00:00:00.000",
  "head_block_producer": "..."
}
```

### 2. get_account

Get detailed information about an XPR account including resources, permissions, and voting status.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "account_name": {
      "type": "string",
      "description": "The account name to query"
    }
  },
  "required": ["account_name"]
}
```

**Example Request:**
```json
{
  "name": "get_account",
  "arguments": {
    "account_name": "proton"
  }
}
```

**Example Response:**
```json
{
  "account_name": "proton",
  "head_block_num": 1234567,
  "head_block_time": "2024-01-01T00:00:00.000",
  "privileged": false,
  "created": "2020-09-28T00:00:00.000",
  "core_liquid_balance": "1000.0000 XPR",
  "ram_quota": 8192,
  "net_weight": 10000,
  "cpu_weight": 10000,
  "net_limit": { "used": 0, "available": 1000000, "max": 1000000 },
  "cpu_limit": { "used": 0, "available": 1000000, "max": 1000000 },
  "ram_usage": 3456,
  "permissions": [...],
  "total_resources": {...},
  "voter_info": {...}
}
```

### 3. get_balance

Get token balance for an account.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "account": {
      "type": "string",
      "description": "The account name"
    },
    "code": {
      "type": "string",
      "description": "Token contract account (default: eosio.token)"
    },
    "symbol": {
      "type": "string",
      "description": "Token symbol (default: XPR)"
    }
  },
  "required": ["account"]
}
```

**Example Request:**
```json
{
  "name": "get_balance",
  "arguments": {
    "account": "proton",
    "code": "eosio.token",
    "symbol": "XPR"
  }
}
```

**Example Response:**
```json
["1000.0000 XPR"]
```

### 4. get_block

Get block information by block number or ID.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "block_num_or_id": {
      "type": "string",
      "description": "Block number or block ID"
    }
  },
  "required": ["block_num_or_id"]
}
```

**Example Request:**
```json
{
  "name": "get_block",
  "arguments": {
    "block_num_or_id": "1000"
  }
}
```

**Example Response:**
```json
{
  "timestamp": "2020-09-28T00:00:00.000",
  "producer": "producer1",
  "confirmed": 0,
  "previous": "...",
  "transaction_mroot": "...",
  "action_mroot": "...",
  "schedule_version": 1,
  "new_producers": null,
  "producer_signature": "...",
  "transactions": [...]
}
```

### 5. get_transaction

Get transaction details by transaction ID.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "transaction_id": {
      "type": "string",
      "description": "Transaction ID"
    }
  },
  "required": ["transaction_id"]
}
```

**Example Request:**
```json
{
  "name": "get_transaction",
  "arguments": {
    "transaction_id": "abc123..."
  }
}
```

**Example Response:**
```json
{
  "id": "abc123...",
  "trx": {
    "receipt": {...},
    "trx": {...}
  },
  "block_time": "2024-01-01T00:00:00.000",
  "block_num": 1234567,
  "last_irreversible_block": 1234566
}
```

### 6. get_table_rows

Query smart contract table data.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "code": {
      "type": "string",
      "description": "Contract account name"
    },
    "scope": {
      "type": "string",
      "description": "Table scope"
    },
    "table": {
      "type": "string",
      "description": "Table name"
    },
    "limit": {
      "type": "number",
      "description": "Maximum number of rows to return (default: 10)"
    },
    "lower_bound": {
      "type": "string",
      "description": "Lower bound for the query"
    },
    "upper_bound": {
      "type": "string",
      "description": "Upper bound for the query"
    }
  },
  "required": ["code", "scope", "table"]
}
```

**Example Request:**
```json
{
  "name": "get_table_rows",
  "arguments": {
    "code": "eosio.token",
    "scope": "proton",
    "table": "accounts",
    "limit": 10
  }
}
```

**Example Response:**
```json
{
  "rows": [
    { "balance": "1000.0000 XPR" }
  ],
  "more": false,
  "next_key": ""
}
```

### 7. get_actions

Get account transaction history/actions.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "account_name": {
      "type": "string",
      "description": "Account name"
    },
    "pos": {
      "type": "number",
      "description": "Position to start from (default: -1 for most recent)"
    },
    "offset": {
      "type": "number",
      "description": "Number of actions to retrieve (negative for backwards, default: -20)"
    }
  },
  "required": ["account_name"]
}
```

**Example Request:**
```json
{
  "name": "get_actions",
  "arguments": {
    "account_name": "proton",
    "pos": -1,
    "offset": -20
  }
}
```

**Example Response:**
```json
{
  "actions": [
    {
      "global_action_seq": 123456,
      "account_action_seq": 10,
      "block_num": 1234567,
      "block_time": "2024-01-01T00:00:00.000",
      "action_trace": {...}
    }
  ],
  "last_irreversible_block": 1234566
}
```

### 8. get_abi

Get the ABI (Application Binary Interface) for a smart contract.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "account_name": {
      "type": "string",
      "description": "Contract account name"
    }
  },
  "required": ["account_name"]
}
```

**Example Request:**
```json
{
  "name": "get_abi",
  "arguments": {
    "account_name": "eosio.token"
  }
}
```

**Example Response:**
```json
{
  "account_name": "eosio.token",
  "abi": {
    "version": "eosio::abi/1.0",
    "types": [...],
    "structs": [...],
    "actions": [...],
    "tables": [...]
  }
}
```

### 9. get_producers

Get list of block producers.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "limit": {
      "type": "number",
      "description": "Maximum number of producers to return (default: 50)"
    }
  }
}
```

**Example Request:**
```json
{
  "name": "get_producers",
  "arguments": {
    "limit": 50
  }
}
```

**Example Response:**
```json
{
  "rows": [
    {
      "owner": "producer1",
      "total_votes": "123456789.0000",
      "producer_key": "...",
      "is_active": 1,
      "url": "https://producer1.com"
    }
  ],
  "total_producer_vote_weight": "...",
  "more": ""
}
```

---

## Azure Functions Endpoints

REST API endpoints when deployed as Azure Functions.

### Base URL

**Local Development:** `http://localhost:7071/api/`
**Azure Production:** `https://<app-name>.azurewebsites.net/api/`

### 1. GET/POST /api/getChainInfo

Get blockchain information.

**Query Parameters:** None

**Response:**
```json
{
  "server_version": "...",
  "chain_id": "384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0",
  "head_block_num": 1234567,
  "head_block_id": "...",
  "head_block_time": "2024-01-01T00:00:00.000"
}
```

**Example:**
```bash
curl http://localhost:7071/api/getChainInfo
```

### 2. GET/POST /api/getAccount

Get account information.

**Query Parameters (GET):**
- `account_name` (required): Account name to query

**JSON Body (POST):**
```json
{
  "account_name": "proton"
}
```

**Response:**
```json
{
  "account_name": "proton",
  "core_liquid_balance": "1000.0000 XPR",
  "ram_quota": 8192,
  "permissions": [...]
}
```

**Example:**
```bash
curl "http://localhost:7071/api/getAccount?account_name=proton"

curl -X POST http://localhost:7071/api/getAccount \
  -H "Content-Type: application/json" \
  -d '{"account_name": "proton"}'
```

### 3. GET/POST /api/getBalance

Get account token balance.

**Query Parameters (GET):**
- `account` (required): Account name
- `code` (optional): Token contract, default "eosio.token"
- `symbol` (optional): Token symbol, default "XPR"

**JSON Body (POST):**
```json
{
  "account": "proton",
  "code": "eosio.token",
  "symbol": "XPR"
}
```

**Response:**
```json
{
  "account": "proton",
  "balance": ["1000.0000 XPR"]
}
```

**Example:**
```bash
curl "http://localhost:7071/api/getBalance?account=proton&symbol=XPR"
```

### 4. GET/POST /api/getBlock

Get block information.

**Query Parameters (GET):**
- `block_num_or_id` (required): Block number or ID

**JSON Body (POST):**
```json
{
  "block_num_or_id": "1000"
}
```

**Response:**
```json
{
  "timestamp": "2020-09-28T00:00:00.000",
  "producer": "producer1",
  "transactions": [...]
}
```

**Example:**
```bash
curl "http://localhost:7071/api/getBlock?block_num_or_id=1000"
```

### 5. GET/POST /api/getTransaction

Get transaction details.

**Query Parameters (GET):**
- `transaction_id` (required): Transaction ID

**JSON Body (POST):**
```json
{
  "transaction_id": "abc123..."
}
```

**Response:**
```json
{
  "id": "abc123...",
  "block_num": 1234567,
  "block_time": "2024-01-01T00:00:00.000"
}
```

**Example:**
```bash
curl "http://localhost:7071/api/getTransaction?transaction_id=abc123..."
```

### 6. POST /api/getTableRows

Query smart contract table.

**JSON Body:**
```json
{
  "code": "eosio.token",
  "scope": "proton",
  "table": "accounts",
  "limit": 10,
  "lower_bound": "",
  "upper_bound": ""
}
```

**Response:**
```json
{
  "rows": [...],
  "more": false
}
```

**Example:**
```bash
curl -X POST http://localhost:7071/api/getTableRows \
  -H "Content-Type: application/json" \
  -d '{
    "code": "eosio.token",
    "scope": "proton",
    "table": "accounts",
    "limit": 10
  }'
```

### 7. GET/POST /api/getActions

Get account transaction history.

**Query Parameters (GET):**
- `account_name` (required): Account name
- `pos` (optional): Position, default -1
- `offset` (optional): Offset, default -20

**JSON Body (POST):**
```json
{
  "account_name": "proton",
  "pos": -1,
  "offset": -20
}
```

**Response:**
```json
{
  "actions": [...],
  "last_irreversible_block": 1234566
}
```

**Example:**
```bash
curl "http://localhost:7071/api/getActions?account_name=proton"
```

### 8. GET/POST /api/getAbi

Get contract ABI.

**Query Parameters (GET):**
- `account_name` (required): Contract account name

**JSON Body (POST):**
```json
{
  "account_name": "eosio.token"
}
```

**Response:**
```json
{
  "account_name": "eosio.token",
  "abi": {...}
}
```

**Example:**
```bash
curl "http://localhost:7071/api/getAbi?account_name=eosio.token"
```

### 9. GET/POST /api/getProducers

Get block producer list.

**Query Parameters (GET):**
- `limit` (optional): Max producers, default 50

**JSON Body (POST):**
```json
{
  "limit": 50
}
```

**Response:**
```json
{
  "rows": [...],
  "total_producer_vote_weight": "..."
}
```

**Example:**
```bash
curl "http://localhost:7071/api/getProducers?limit=50"
```

---

## XPR Client Methods

Low-level methods available in the `XPRClient` class.

### XPRClient Constructor

```javascript
const client = new XPRClient(endpoint);
```

**Parameters:**
- `endpoint` (optional): XPR RPC endpoint URL, default: `https://proton.eoscafeblock.com`

**Example:**
```javascript
import { XPRClient } from './src/xpr-client.js';

const client = new XPRClient();
const customClient = new XPRClient('https://proton.greymass.com');
```

### post(path, data)

Make a POST request to the XPR API.

**Parameters:**
- `path` (string): API endpoint path (e.g., '/v1/chain/get_info')
- `data` (object): Request body data

**Returns:** Promise resolving to response JSON

**Throws:** Error if HTTP status is not 200

**Example:**
```javascript
const result = await client.post('/v1/chain/get_info', {});
```

### getInfo()

Get blockchain information.

**Returns:** Promise resolving to chain info object

**Example:**
```javascript
const info = await client.getInfo();
console.log(info.chain_id);
```

### getAccount(accountName)

Get account information.

**Parameters:**
- `accountName` (string): Account name

**Returns:** Promise resolving to account object

**Example:**
```javascript
const account = await client.getAccount('proton');
console.log(account.core_liquid_balance);
```

### getCurrencyBalance(account, code, symbol)

Get account balance.

**Parameters:**
- `account` (string): Account name
- `code` (string, optional): Token contract, default 'eosio.token'
- `symbol` (string, optional): Token symbol, default 'XPR'

**Returns:** Promise resolving to array of balance strings

**Example:**
```javascript
const balance = await client.getCurrencyBalance('proton', 'eosio.token', 'XPR');
console.log(balance); // ["1000.0000 XPR"]
```

### getBlock(blockNumOrId)

Get block information.

**Parameters:**
- `blockNumOrId` (string|number): Block number or block ID

**Returns:** Promise resolving to block object

**Example:**
```javascript
const block = await client.getBlock('1000');
console.log(block.transactions);
```

### getTransaction(id)

Get transaction information.

**Parameters:**
- `id` (string): Transaction ID

**Returns:** Promise resolving to transaction object

**Example:**
```javascript
const tx = await client.getTransaction('abc123...');
console.log(tx.block_num);
```

### getTableRows(code, scope, table, options)

Get smart contract table rows.

**Parameters:**
- `code` (string): Contract account name
- `scope` (string): Table scope
- `table` (string): Table name
- `options` (object, optional): Query options
  - `limit` (number): Max rows, default 10
  - `lower_bound` (string): Lower bound
  - `upper_bound` (string): Upper bound

**Returns:** Promise resolving to table rows object

**Example:**
```javascript
const rows = await client.getTableRows(
  'eosio.token',
  'proton',
  'accounts',
  { limit: 10 }
);
console.log(rows.rows);
```

### getActions(accountName, pos, offset)

Get account action history.

**Parameters:**
- `accountName` (string): Account name
- `pos` (number, optional): Position, default -1
- `offset` (number, optional): Offset, default -20

**Returns:** Promise resolving to actions object

**Example:**
```javascript
const actions = await client.getActions('proton', -1, -20);
console.log(actions.actions);
```

### getAbi(accountName)

Get contract ABI.

**Parameters:**
- `accountName` (string): Contract account name

**Returns:** Promise resolving to ABI object

**Example:**
```javascript
const abi = await client.getAbi('eosio.token');
console.log(abi.abi.actions);
```

### getProducers(limit)

Get block producer list.

**Parameters:**
- `limit` (number, optional): Max producers, default 50

**Returns:** Promise resolving to producers object

**Example:**
```javascript
const producers = await client.getProducers(50);
console.log(producers.rows);
```

### pushTransaction(signatures, serializedTransaction)

Push a signed transaction to the blockchain.

**Parameters:**
- `signatures` (array): Array of signature strings
- `serializedTransaction` (string): Serialized transaction hex

**Returns:** Promise resolving to transaction result

**Note:** This method requires proper transaction signing. Not typically used directly.

**Example:**
```javascript
const result = await client.pushTransaction(
  ['SIG_K1_...'],
  'deadbeef...'
);
console.log(result.transaction_id);
```

---

## Data Types

### Account Object

```typescript
{
  account_name: string;
  head_block_num: number;
  head_block_time: string; // ISO 8601
  privileged: boolean;
  created: string; // ISO 8601
  core_liquid_balance?: string; // e.g., "1000.0000 XPR"
  ram_quota: number; // bytes
  net_weight: number;
  cpu_weight: number;
  net_limit: ResourceLimit;
  cpu_limit: ResourceLimit;
  ram_usage: number;
  permissions: Permission[];
  total_resources?: TotalResources;
  voter_info?: VoterInfo;
}
```

### Block Object

```typescript
{
  timestamp: string; // ISO 8601
  producer: string;
  confirmed: number;
  previous: string; // block ID
  transaction_mroot: string;
  action_mroot: string;
  schedule_version: number;
  new_producers: any;
  producer_signature: string;
  transactions: Transaction[];
  id: string; // block ID
  block_num: number;
  ref_block_prefix: number;
}
```

### Chain Info Object

```typescript
{
  server_version: string;
  chain_id: string;
  head_block_num: number;
  last_irreversible_block_num: number;
  last_irreversible_block_id: string;
  head_block_id: string;
  head_block_time: string; // ISO 8601
  head_block_producer: string;
  virtual_block_cpu_limit: number;
  virtual_block_net_limit: number;
  block_cpu_limit: number;
  block_net_limit: number;
}
```

---

## Error Handling

### MCP Server Errors

**Format:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: <error message>"
    }
  ],
  "isError": true
}
```

**Common Errors:**
- "Unknown tool: <name>" - Invalid tool name
- "XPR API error (404 Not Found)" - Account/block not found
- "XPR API error (500 Internal Server Error)" - RPC node error

### Azure Functions Errors

**Format:**
```json
{
  "error": "<error message>"
}
```

**HTTP Status Codes:**
- `400 Bad Request` - Missing required parameters
- `500 Internal Server Error` - RPC error or server error

**Common Errors:**
- `{ "error": "account_name is required" }` - Missing parameter
- `{ "error": "XPR API error (404 Not Found) at /v1/chain/get_account" }` - Not found
- `{ "error": "Network error" }` - Connection issues

### XPRClient Errors

All XPRClient methods throw Error on failure.

**Error Message Format:**
```
XPR API error (<status> <statusText>) at <path>
```

**Example:**
```javascript
try {
  const account = await client.getAccount('nonexistent');
} catch (error) {
  console.error(error.message);
  // "XPR API error (500 Internal Server Error) at /v1/chain/get_account"
}
```

### Best Practices

1. **Always wrap in try/catch:**
```javascript
try {
  const result = await xprClient.method(params);
  // Handle success
} catch (error) {
  // Handle error
  console.error('Error:', error.message);
}
```

2. **Validate inputs before calling:**
```javascript
if (!accountName || typeof accountName !== 'string') {
  throw new Error('Invalid account name');
}
```

3. **Provide meaningful error messages:**
```javascript
catch (error) {
  return {
    content: [{
      type: 'text',
      text: `Failed to get account ${accountName}: ${error.message}`
    }],
    isError: true
  };
}
```

---

## Rate Limits

**XPR Network RPC:**
- No official documented limits
- Recommended: Max 10-20 requests/second per endpoint
- Use multiple endpoints for higher throughput

**Azure Functions:**
- Consumption plan: ~10 concurrent executions (scalable)
- Premium plan: Higher limits
- Add API Management for custom rate limiting

---

## Examples

See the README.md for complete usage examples.

**Quick Test:**
```bash
# MCP Server
npm start

# Azure Functions
func start

# Test Azure endpoint
curl http://localhost:7071/api/getChainInfo
```

**Integration Example:**
```javascript
import { XPRClient } from './src/xpr-client.js';

const client = new XPRClient();

async function getAccountBalance(accountName) {
  try {
    const account = await client.getAccount(accountName);
    const balance = await client.getCurrencyBalance(accountName);
    
    return {
      account: account.account_name,
      balance: balance[0],
      ram: account.ram_usage,
      cpu: account.cpu_limit.available
    };
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

// Usage
const info = await getAccountBalance('proton');
console.log(info);
```
