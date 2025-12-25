# XPR MCP Server - Usage Examples

Examples for using the XPR MCP Server in different scenarios.

## Table of Contents

- [MCP Server Examples](#mcp-server-examples)
- [Azure Functions Examples](#azure-functions-examples)
- [XPR Client Examples](#xpr-client-examples)
- [Integration Examples](#integration-examples)

---

## MCP Server Examples

### Example 1: Basic MCP Server Setup

**File:** `examples/mcp-basic.js`

```javascript
#!/usr/bin/env node
import { XPRMCPServer } from '../src/index.js';

// Start the MCP server
const server = new XPRMCPServer();
server.run().catch(console.error);

// Server communicates via stdio
// Connect using an MCP-compatible client
```

**Run:**
```bash
node examples/mcp-basic.js
```

### Example 2: MCP Client Integration

**File:** `examples/mcp-client-example.json`

MCP client configuration for connecting to the XPR server:

```json
{
  "mcpServers": {
    "xpr-network": {
      "command": "node",
      "args": ["/path/to/XPR/src/index.js"],
      "env": {
        "XPR_ENDPOINT": "https://proton.eoscafeblock.com"
      }
    }
  }
}
```

**VS Code Copilot Configuration:**
Place in `.vscode/settings.json` or user settings.

**Claude Desktop Configuration:**
Place in `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS).

### Example 3: Testing MCP Tools with JSON-RPC

**Manual testing with stdio:**

```bash
# Start server
npm start

# In another terminal, send JSON-RPC requests:
echo '{"jsonrpc":"2.0","method":"tools/list","id":1,"params":{}}' | npm start

echo '{"jsonrpc":"2.0","method":"tools/call","id":2,"params":{"name":"get_chain_info","arguments":{}}}' | npm start
```

---

## Azure Functions Examples

### Example 1: Local Development

**Start local server:**
```bash
npm install -g azure-functions-core-tools@4
func start
```

**Test endpoints:**
```bash
# Get chain info
curl http://localhost:7071/api/getChainInfo

# Get account
curl "http://localhost:7071/api/getAccount?account_name=proton"

# Get balance
curl "http://localhost:7071/api/getBalance?account=proton&symbol=XPR"
```

### Example 2: POST Requests

**Get table rows:**
```bash
curl -X POST http://localhost:7071/api/getTableRows \
  -H "Content-Type: application/json" \
  -d '{
    "code": "eosio.token",
    "scope": "proton",
    "table": "accounts",
    "limit": 5
  }'
```

**Get account with POST:**
```bash
curl -X POST http://localhost:7071/api/getAccount \
  -H "Content-Type: application/json" \
  -d '{"account_name": "proton"}'
```

### Example 3: JavaScript/Node.js Client

**File:** `examples/azure-client.js`

```javascript
import fetch from 'node-fetch';

const AZURE_BASE_URL = 'http://localhost:7071/api';

async function getChainInfo() {
  const response = await fetch(`${AZURE_BASE_URL}/getChainInfo`);
  const data = await response.json();
  return data;
}

async function getAccount(accountName) {
  const response = await fetch(
    `${AZURE_BASE_URL}/getAccount?account_name=${accountName}`
  );
  const data = await response.json();
  return data;
}

async function getTableRows(code, scope, table, limit = 10) {
  const response = await fetch(`${AZURE_BASE_URL}/getTableRows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, scope, table, limit })
  });
  const data = await response.json();
  return data;
}

// Usage
const chainInfo = await getChainInfo();
console.log('Chain ID:', chainInfo.chain_id);

const account = await getAccount('proton');
console.log('Balance:', account.core_liquid_balance);

const balances = await getTableRows('eosio.token', 'proton', 'accounts');
console.log('Token balances:', balances.rows);
```

### Example 4: Python Client

**File:** `examples/azure-client.py`

```python
import requests

AZURE_BASE_URL = 'http://localhost:7071/api'

def get_chain_info():
    response = requests.get(f'{AZURE_BASE_URL}/getChainInfo')
    return response.json()

def get_account(account_name):
    response = requests.get(
        f'{AZURE_BASE_URL}/getAccount',
        params={'account_name': account_name}
    )
    return response.json()

def get_table_rows(code, scope, table, limit=10):
    response = requests.post(
        f'{AZURE_BASE_URL}/getTableRows',
        json={
            'code': code,
            'scope': scope,
            'table': table,
            'limit': limit
        }
    )
    return response.json()

# Usage
if __name__ == '__main__':
    chain_info = get_chain_info()
    print(f"Chain ID: {chain_info['chain_id']}")
    
    account = get_account('proton')
    print(f"Balance: {account['core_liquid_balance']}")
    
    balances = get_table_rows('eosio.token', 'proton', 'accounts')
    print(f"Token balances: {balances['rows']}")
```

---

## XPR Client Examples

### Example 1: Direct Client Usage

**File:** `examples/xpr-client-basic.js`

```javascript
import { XPRClient } from '../src/xpr-client.js';

const client = new XPRClient();

// Get chain info
const info = await client.getInfo();
console.log('Chain ID:', info.chain_id);
console.log('Head Block:', info.head_block_num);

// Get account
const account = await client.getAccount('proton');
console.log('Account:', account.account_name);
console.log('Balance:', account.core_liquid_balance);
console.log('RAM:', account.ram_usage, '/', account.ram_quota);

// Get balance
const balance = await client.getCurrencyBalance('proton');
console.log('XPR Balance:', balance);

// Get block
const block = await client.getBlock('1000');
console.log('Block Producer:', block.producer);
console.log('Transactions:', block.transactions.length);
```

**Run:**
```bash
node examples/xpr-client-basic.js
```

### Example 2: Custom Endpoint

**File:** `examples/xpr-client-custom-endpoint.js`

```javascript
import { XPRClient } from '../src/xpr-client.js';

// Use custom XPR endpoint
const mainnetClient = new XPRClient('https://proton.greymass.com');
const testnetClient = new XPRClient('https://testnet.protonchain.com');

// Compare chain IDs
const mainnetInfo = await mainnetClient.getInfo();
const testnetInfo = await testnetClient.getInfo();

console.log('Mainnet Chain ID:', mainnetInfo.chain_id);
console.log('Testnet Chain ID:', testnetInfo.chain_id);
```

### Example 3: Error Handling

**File:** `examples/xpr-client-error-handling.js`

```javascript
import { XPRClient } from '../src/xpr-client.js';

const client = new XPRClient();

async function safeGetAccount(accountName) {
  try {
    const account = await client.getAccount(accountName);
    return { success: true, data: account };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Valid account
const result1 = await safeGetAccount('proton');
if (result1.success) {
  console.log('Account found:', result1.data.account_name);
} else {
  console.error('Error:', result1.error);
}

// Invalid account
const result2 = await safeGetAccount('nonexistentaccount12345');
if (result2.success) {
  console.log('Account found:', result2.data.account_name);
} else {
  console.error('Error:', result2.error); // Will show error
}
```

### Example 4: Batch Operations

**File:** `examples/xpr-client-batch.js`

```javascript
import { XPRClient } from '../src/xpr-client.js';

const client = new XPRClient();

// Get multiple accounts in parallel
const accountNames = ['proton', 'eosio', 'eosio.token'];

const accounts = await Promise.all(
  accountNames.map(name => client.getAccount(name))
);

accounts.forEach(account => {
  console.log(`${account.account_name}: ${account.core_liquid_balance}`);
});

// Get account info and balance in parallel
async function getAccountSummary(accountName) {
  const [account, balance] = await Promise.all([
    client.getAccount(accountName),
    client.getCurrencyBalance(accountName)
  ]);
  
  return {
    name: account.account_name,
    balance: balance[0] || '0 XPR',
    ram: account.ram_usage,
    created: account.created
  };
}

const summary = await getAccountSummary('proton');
console.log('Account Summary:', summary);
```

---

## Integration Examples

### Example 1: Account Monitor

**File:** `examples/account-monitor.js`

Monitor an account for changes.

```javascript
import { XPRClient } from '../src/xpr-client.js';

const client = new XPRClient();
const accountName = 'proton';
let lastActionSeq = null;

async function checkForNewActions() {
  try {
    const actions = await client.getActions(accountName, -1, -10);
    
    if (actions.actions.length === 0) {
      return;
    }
    
    const latestSeq = actions.actions[0].account_action_seq;
    
    if (lastActionSeq === null) {
      lastActionSeq = latestSeq;
      console.log(`Monitoring ${accountName} from action #${latestSeq}`);
      return;
    }
    
    if (latestSeq > lastActionSeq) {
      const newActions = actions.actions.filter(
        a => a.account_action_seq > lastActionSeq
      );
      
      console.log(`\n${newActions.length} new action(s):`);
      newActions.forEach(action => {
        console.log(`  - ${action.action_trace.act.name} at ${action.block_time}`);
      });
      
      lastActionSeq = latestSeq;
    }
  } catch (error) {
    console.error('Error checking actions:', error.message);
  }
}

// Check every 5 seconds
console.log(`Starting monitor for account: ${accountName}`);
setInterval(checkForNewActions, 5000);
checkForNewActions();
```

**Run:**
```bash
node examples/account-monitor.js
```

### Example 2: Token Balance Checker

**File:** `examples/token-balance-checker.js`

Check balances for multiple tokens.

```javascript
import { XPRClient } from '../src/xpr-client.js';

const client = new XPRClient();

async function getAllBalances(accountName) {
  const tokens = [
    { code: 'eosio.token', symbol: 'XPR' },
    { code: 'loan.proton', symbol: 'LOAN' },
    { code: 'xtokens', symbol: 'XUSDC' },
    { code: 'xtokens', symbol: 'XBTC' }
  ];
  
  const balances = await Promise.allSettled(
    tokens.map(token => 
      client.getCurrencyBalance(accountName, token.code, token.symbol)
    )
  );
  
  const result = {};
  tokens.forEach((token, index) => {
    if (balances[index].status === 'fulfilled') {
      const balance = balances[index].value[0] || `0.0000 ${token.symbol}`;
      result[token.symbol] = balance;
    } else {
      result[token.symbol] = 'Error';
    }
  });
  
  return result;
}

const accountName = 'proton';
const balances = await getAllBalances(accountName);

console.log(`Token balances for ${accountName}:`);
Object.entries(balances).forEach(([symbol, balance]) => {
  console.log(`  ${symbol}: ${balance}`);
});
```

### Example 3: Block Explorer

**File:** `examples/block-explorer.js`

Simple block explorer that shows recent blocks.

```javascript
import { XPRClient } from '../src/xpr-client.js';

const client = new XPRClient();

async function exploreRecentBlocks(count = 5) {
  const info = await client.getInfo();
  const headBlock = info.head_block_num;
  
  console.log(`Current head block: ${headBlock}\n`);
  
  for (let i = 0; i < count; i++) {
    const blockNum = headBlock - i;
    const block = await client.getBlock(blockNum.toString());
    
    console.log(`Block #${blockNum}:`);
    console.log(`  Producer: ${block.producer}`);
    console.log(`  Time: ${block.timestamp}`);
    console.log(`  Transactions: ${block.transactions.length}`);
    console.log('');
  }
}

exploreRecentBlocks(10);
```

### Example 4: Smart Contract Table Reader

**File:** `examples/table-reader.js`

Read data from smart contract tables with pagination.

```javascript
import { XPRClient } from '../src/xpr-client.js';

const client = new XPRClient();

async function getAllTableRows(code, scope, table, maxRows = 100) {
  const allRows = [];
  let lowerBound = null;
  let more = true;
  
  while (more && allRows.length < maxRows) {
    const result = await client.getTableRows(code, scope, table, {
      limit: 100,
      lower_bound: lowerBound
    });
    
    allRows.push(...result.rows);
    more = result.more;
    
    if (more && result.next_key) {
      lowerBound = result.next_key;
    } else {
      break;
    }
    
    // Avoid overwhelming the RPC endpoint
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return allRows;
}

// Example: Get all token balances for an account
const balances = await getAllTableRows('eosio.token', 'proton', 'accounts');
console.log('Token balances:', balances);

// Example: Get top producers
const producers = await getAllTableRows('eosio', 'eosio', 'producers', 50);
console.log(`Top ${producers.length} producers:`, 
  producers.map(p => p.owner).slice(0, 10)
);
```

---

## Testing Examples

### Example 1: Unit Test Template

**File:** `examples/test-template.js`

```javascript
import { XPRClient } from '../src/xpr-client.js';
import assert from 'assert';

async function testGetInfo() {
  const client = new XPRClient();
  const info = await client.getInfo();
  
  assert(info.chain_id, 'Chain ID should exist');
  assert(info.head_block_num > 0, 'Head block should be positive');
  assert(info.server_version, 'Server version should exist');
  
  console.log('✓ getInfo test passed');
}

async function testGetAccount() {
  const client = new XPRClient();
  const account = await client.getAccount('proton');
  
  assert(account.account_name === 'proton', 'Account name should match');
  assert(account.ram_quota > 0, 'RAM quota should be positive');
  
  console.log('✓ getAccount test passed');
}

async function testErrorHandling() {
  const client = new XPRClient();
  
  try {
    await client.getAccount('nonexistentaccount12345');
    assert(false, 'Should have thrown error');
  } catch (error) {
    assert(error.message.includes('XPR API error'), 'Should be XPR API error');
    console.log('✓ Error handling test passed');
  }
}

// Run tests
try {
  await testGetInfo();
  await testGetAccount();
  await testErrorHandling();
  console.log('\nAll tests passed!');
} catch (error) {
  console.error('Test failed:', error.message);
  process.exit(1);
}
```

---

## Best Practices

### 1. Always Handle Errors

```javascript
try {
  const result = await client.method(params);
  // Use result
} catch (error) {
  console.error('Error:', error.message);
  // Handle error gracefully
}
```

### 2. Use Parallel Requests for Independent Queries

```javascript
// Good: Parallel (fast)
const [info, account, balance] = await Promise.all([
  client.getInfo(),
  client.getAccount('proton'),
  client.getCurrencyBalance('proton')
]);

// Bad: Sequential (slow)
const info = await client.getInfo();
const account = await client.getAccount('proton');
const balance = await client.getCurrencyBalance('proton');
```

### 3. Validate Inputs

```javascript
function validateAccountName(name) {
  if (!name || typeof name !== 'string') {
    throw new Error('Account name must be a non-empty string');
  }
  if (name.length > 12) {
    throw new Error('Account name must be 12 characters or less');
  }
  if (!/^[a-z1-5.]+$/.test(name)) {
    throw new Error('Account name must contain only a-z, 1-5, and dot');
  }
}

const accountName = 'proton';
validateAccountName(accountName);
const account = await client.getAccount(accountName);
```

### 4. Use Environment Variables for Configuration

```javascript
const endpoint = process.env.XPR_ENDPOINT || 'https://proton.eoscafeblock.com';
const client = new XPRClient(endpoint);
```

---

## Running the Examples

**Prerequisites:**
```bash
npm install
```

**Run any example:**
```bash
node examples/example-name.js
```

**Note:** Examples that make network calls require internet connectivity and will use the real XPR Network mainnet.

---

## Creating Your Own Examples

1. Import the XPRClient or XPRMCPServer
2. Write your logic
3. Add error handling
4. Test with real network calls
5. Document your example

**Template:**
```javascript
import { XPRClient } from '../src/xpr-client.js';

const client = new XPRClient();

async function main() {
  try {
    // Your code here
    const result = await client.method(params);
    console.log(result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
```
