# Agent Development Patterns and Best Practices

Best practices and common patterns for agent-assisted development with the XPR MCP Server.

## Table of Contents

- [Code Organization Patterns](#code-organization-patterns)
- [Tool Development Patterns](#tool-development-patterns)
- [Error Handling Patterns](#error-handling-patterns)
- [Testing Patterns](#testing-patterns)
- [Documentation Patterns](#documentation-patterns)
- [Performance Patterns](#performance-patterns)
- [Security Patterns](#security-patterns)

---

## Code Organization Patterns

### Pattern: Single Responsibility Modules

**Principle:** Each module has one clear purpose

**Structure:**
```
src/
├── index.js          # MCP server (protocol handling only)
├── xpr-client.js     # RPC client (API calls only)
functions/
└── index.js          # Azure handlers (HTTP handling only)
```

**Benefits:**
- Easy to understand and modify
- Clear boundaries for changes
- Minimal context switching

**Anti-pattern:**
```javascript
// DON'T: Mix concerns
class XPRServer {
  handleMCP() { /* MCP logic */ }
  makeRPCCall() { /* RPC logic */ }
  handleHTTP() { /* HTTP logic */ }
}
```

**Good pattern:**
```javascript
// DO: Separate concerns
// xpr-client.js - Only RPC
export class XPRClient {
  async getAccount(name) { /* RPC only */ }
}

// index.js - Only MCP protocol
class XPRMCPServer {
  setupHandlers() { /* MCP only */ }
}
```

### Pattern: Consistent Tool Structure

**Template for adding new MCP tools:**

```javascript
// 1. Tool definition in ListToolsRequestSchema handler
{
  name: 'tool_name',
  description: 'Clear description of what it does',
  inputSchema: {
    type: 'object',
    properties: {
      param_name: {
        type: 'string',
        description: 'Parameter description'
      }
    },
    required: ['param_name']
  }
}

// 2. Tool handler in CallToolRequestSchema handler
case 'tool_name': {
  const result = await this.xprClient.method(args.param_name);
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result, null, 2)
    }]
  };
}
```

### Pattern: Consistent Azure Function Structure

**Template for adding new endpoints:**

```javascript
app.http('endpointName', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      // 1. Parse parameters
      let param;
      if (request.method === 'GET') {
        param = request.query.get('param_name');
      } else {
        const body = await request.json();
        param = body.param_name;
      }

      // 2. Validate
      if (!param) {
        return {
          status: 400,
          jsonBody: { error: 'param_name is required' }
        };
      }

      // 3. Call client
      const result = await xprClient.method(param);

      // 4. Return success
      return {
        status: 200,
        jsonBody: result
      };
    } catch (error) {
      // 5. Handle errors
      context.error('Error in endpointName:', error);
      return {
        status: 500,
        jsonBody: { error: error.message }
      };
    }
  }
});
```

---

## Tool Development Patterns

### Pattern: Start with XPRClient Method

**Process:**
1. Add RPC method to XPRClient first
2. Test it independently
3. Then add MCP tool
4. Finally add Azure Function (if needed)

**Example:**

```javascript
// Step 1: Add to xpr-client.js
async getResourceUsage(accountName) {
  const account = await this.getAccount(accountName);
  return {
    ram: {
      used: account.ram_usage,
      quota: account.ram_quota,
      available: account.ram_quota - account.ram_usage
    },
    cpu: account.cpu_limit,
    net: account.net_limit
  };
}

// Step 2: Test independently
// const client = new XPRClient();
// const usage = await client.getResourceUsage('proton');

// Step 3: Add MCP tool (in index.js)
{
  name: 'get_resource_usage',
  description: 'Get account resource usage (RAM, CPU, NET)',
  inputSchema: {
    type: 'object',
    properties: {
      account_name: { type: 'string' }
    },
    required: ['account_name']
  }
}

case 'get_resource_usage': {
  const usage = await this.xprClient.getResourceUsage(args.account_name);
  return {
    content: [{ type: 'text', text: JSON.stringify(usage, null, 2) }]
  };
}

// Step 4: Add Azure Function (in functions/index.js)
app.http('getResourceUsage', {
  methods: ['GET', 'POST'],
  // ... handler implementation
});
```

### Pattern: Composite Tools

**When to use:** Create higher-level tools that combine multiple RPC calls

**Example:**

```javascript
// In xpr-client.js
async getAccountOverview(accountName) {
  const [account, balance, actions] = await Promise.all([
    this.getAccount(accountName),
    this.getCurrencyBalance(accountName),
    this.getActions(accountName, -1, -5)
  ]);

  return {
    account_name: accountName,
    balance: balance[0] || '0 XPR',
    ram_used: account.ram_usage,
    ram_quota: account.ram_quota,
    recent_actions: actions.actions.slice(0, 5).map(a => ({
      action: a.action_trace.act.name,
      timestamp: a.block_time
    }))
  };
}
```

**Benefits:**
- Reduces round trips for agents
- Provides curated data views
- Simplifies common use cases

**When NOT to use:**
- If data is too large
- If some calls frequently fail
- If different caching needs

### Pattern: Pagination Support

**Template for paginated queries:**

```javascript
async getActionsPaginated(accountName, options = {}) {
  const {
    pos = -1,
    limit = 20,
    offset = null
  } = options;

  const actualOffset = offset || -limit;
  const actions = await this.getActions(accountName, pos, actualOffset);

  return {
    actions: actions.actions,
    has_more: actions.actions.length === Math.abs(actualOffset),
    next_pos: actions.actions.length > 0 
      ? actions.actions[actions.actions.length - 1].account_action_seq 
      : null
  };
}
```

---

## Error Handling Patterns

### Pattern: Three-Layer Error Handling

**Layer 1: XPRClient (Throw)**
```javascript
async getAccount(accountName) {
  const response = await fetch(/*...*/);
  
  if (!response.ok) {
    throw new Error(`XPR API error (${response.status}) at ${path}`);
  }
  
  return await response.json();
}
```

**Layer 2: MCP Server (Catch and Format)**
```javascript
case 'get_account': {
  try {
    const account = await this.xprClient.getAccount(args.account_name);
    return {
      content: [{ type: 'text', text: JSON.stringify(account, null, 2) }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true
    };
  }
}
```

**Layer 3: Client Application (Handle)**
```javascript
// AI agent or application handles MCP error response
if (response.isError) {
  // Retry, fallback, or report to user
}
```

### Pattern: Specific Error Types

**Use specific error messages for common cases:**

```javascript
async getAccount(accountName) {
  // Validate input
  if (!accountName || typeof accountName !== 'string') {
    throw new Error('Invalid account name: must be a non-empty string');
  }

  if (accountName.length > 12) {
    throw new Error('Invalid account name: maximum 12 characters');
  }

  try {
    const response = await fetch(/*...*/);
    
    if (response.status === 404) {
      throw new Error(`Account not found: ${accountName}`);
    }
    
    if (response.status === 500) {
      throw new Error(`RPC node error: unable to fetch account ${accountName}`);
    }
    
    if (!response.ok) {
      throw new Error(`XPR API error (${response.status}) at /v1/chain/get_account`);
    }
    
    return await response.json();
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Cannot connect to XPR Network RPC endpoint');
    }
    throw error;
  }
}
```

### Pattern: Graceful Degradation

**When one call fails, provide partial data:**

```javascript
async getAccountOverview(accountName) {
  const results = {};
  
  // Get account (required)
  try {
    results.account = await this.getAccount(accountName);
  } catch (error) {
    throw error; // Required data, must fail
  }
  
  // Get balance (optional)
  try {
    results.balance = await this.getCurrencyBalance(accountName);
  } catch (error) {
    results.balance = null;
    results.balance_error = error.message;
  }
  
  // Get actions (optional)
  try {
    const actions = await this.getActions(accountName, -1, -5);
    results.recent_actions = actions.actions.slice(0, 5);
  } catch (error) {
    results.recent_actions = [];
    results.actions_error = error.message;
  }
  
  return results;
}
```

---

## Testing Patterns

### Pattern: Structure Testing

**Always test:**
1. Module exports correctly
2. Classes instantiate
3. Methods exist

**Example:**
```javascript
// test-structure.js
const client = new XPRClient();

const expectedMethods = [
  'post', 'getInfo', 'getAccount', 'getCurrencyBalance',
  'getBlock', 'getTransaction', 'getTableRows'
];

expectedMethods.forEach(method => {
  if (typeof client[method] !== 'function') {
    throw new Error(`Missing method: ${method}`);
  }
});

console.log('✓ All methods present');
```

### Pattern: Manual Integration Testing

**For MCP Server:**
```bash
# Terminal 1: Start server
npm start

# Terminal 2: Test with MCP client or manual JSON-RPC
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | npm start
```

**For Azure Functions:**
```bash
# Terminal 1: Start functions
func start

# Terminal 2: Test with curl
curl http://localhost:7071/api/getChainInfo
curl "http://localhost:7071/api/getAccount?account_name=proton"
```

### Pattern: Error Case Testing

**Test common failure scenarios:**

```bash
# Test missing parameters
curl "http://localhost:7071/api/getAccount"
# Expected: 400 Bad Request

# Test invalid account
curl "http://localhost:7071/api/getAccount?account_name=nonexistent12345"
# Expected: 500 with error message

# Test malformed JSON
curl -X POST http://localhost:7071/api/getTableRows \
  -H "Content-Type: application/json" \
  -d 'invalid json'
# Expected: 400 Bad Request
```

### Pattern: Test Checklist

**Before committing:**
- [ ] Structure test passes: `npm test`
- [ ] Manual test of new functionality
- [ ] Error cases tested
- [ ] Documentation updated
- [ ] No breaking changes to existing tools

---

## Documentation Patterns

### Pattern: Self-Documenting Code

**Use clear naming:**
```javascript
// Good: Obvious what it does
async getAccountBalance(accountName, tokenSymbol = 'XPR')

// Bad: Unclear purpose
async getData(name, sym)
```

**Use JSDoc for public methods:**
```javascript
/**
 * Get account balance for a specific token
 * @param {string} accountName - XPR account name (max 12 chars)
 * @param {string} tokenCode - Token contract account (default: eosio.token)
 * @param {string} tokenSymbol - Token symbol (default: XPR)
 * @returns {Promise<string[]>} Array of balance strings
 * @throws {Error} If account not found or RPC error
 */
async getCurrencyBalance(accountName, tokenCode = 'eosio.token', tokenSymbol = 'XPR')
```

### Pattern: Tool Description Best Practices

**MCP Tool Descriptions:**
- Start with action verb
- Include what data is returned
- Mention any requirements or limitations

```javascript
// Good descriptions
'Get detailed account information including resources, permissions, and voting status'
'Query smart contract table rows with optional filtering and pagination'
'Get block information by block number or ID'

// Bad descriptions
'Gets an account'  // Too vague
'Returns data'      // No context
'Account tool'      // Not descriptive
```

### Pattern: Update Multiple Locations

**When adding a tool, update:**
1. `src/xpr-client.js` - Add method with JSDoc
2. `src/index.js` - Add tool definition and handler
3. `functions/index.js` - Add Azure Function (if applicable)
4. `API_REFERENCE.md` - Document the tool/endpoint
5. `README.md` - Add to available tools list
6. This file (`AGENT_PATTERNS.md`) - Add any new patterns

---

## Performance Patterns

### Pattern: Parallel Requests

**Use Promise.all for independent queries:**

```javascript
// Good: Parallel (fast)
async getMultipleAccounts(accountNames) {
  const accounts = await Promise.all(
    accountNames.map(name => this.getAccount(name))
  );
  return accounts;
}

// Bad: Sequential (slow)
async getMultipleAccounts(accountNames) {
  const accounts = [];
  for (const name of accountNames) {
    accounts.push(await this.getAccount(name));
  }
  return accounts;
}
```

**Typical savings:**
- Sequential: 300ms × 3 accounts = 900ms
- Parallel: max(300ms, 300ms, 300ms) = 300ms

### Pattern: Response Size Optimization

**Return only needed data:**

```javascript
// Good: Minimal data
async getAccountSummary(accountName) {
  const account = await this.getAccount(accountName);
  return {
    name: account.account_name,
    balance: account.core_liquid_balance,
    ram_available: account.ram_quota - account.ram_usage
  };
}

// Bad: All data even if not needed
async getAccountSummary(accountName) {
  return await this.getAccount(accountName); // Returns 50+ fields
}
```

### Pattern: Caching (Future Enhancement)

**Template for adding cache:**

```javascript
class XPRClient {
  constructor(endpoint) {
    this.endpoint = endpoint;
    this.cache = new Map();
    this.cacheTTL = 30000; // 30 seconds
  }

  async getInfo() {
    const cacheKey = 'chain_info';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    
    const data = await this.post('/v1/chain/get_info', {});
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  }
}
```

**Cache candidates:**
- Chain info (changes slowly)
- Producer list (changes slowly)
- Account info (moderate change rate)

**Don't cache:**
- Transaction data (unique)
- Real-time balances
- Block data (if tracking head block)

---

## Security Patterns

### Pattern: Read-Only by Default

**Current state: All tools are read-only queries**

**Benefits:**
- Safe to expose publicly
- No risk of unauthorized transactions
- No private key handling needed

**When adding write operations:**
```javascript
// DON'T add until proper authentication exists
async transferTokens(from, to, amount, privateKey) {
  // This is NOT safe without proper auth!
}

// DO add only with security measures
async createTransaction(params, authToken) {
  // 1. Validate auth token
  // 2. Check permissions
  // 3. Rate limit
  // 4. Log action
  // 5. Use hardware wallet or key vault
}
```

### Pattern: Input Validation

**Always validate external input:**

```javascript
app.http('getAccount', {
  handler: async (request, context) => {
    const accountName = request.query.get('account_name');
    
    // Validation
    if (!accountName) {
      return { status: 400, jsonBody: { error: 'account_name required' } };
    }
    
    if (typeof accountName !== 'string') {
      return { status: 400, jsonBody: { error: 'account_name must be string' } };
    }
    
    if (accountName.length > 12) {
      return { status: 400, jsonBody: { error: 'account_name max 12 chars' } };
    }
    
    if (!/^[a-z1-5.]{1,12}$/.test(accountName)) {
      return { status: 400, jsonBody: { error: 'invalid account_name format' } };
    }
    
    // Proceed with validated input
    const account = await xprClient.getAccount(accountName);
    return { status: 200, jsonBody: account };
  }
});
```

### Pattern: Error Message Sanitization

**Don't expose internal details:**

```javascript
// Bad: Exposes internal paths
catch (error) {
  return { error: error.stack };
}

// Good: Generic error message
catch (error) {
  context.error('Internal error:', error); // Log full error
  return { error: 'Failed to fetch account' }; // Return generic message
}

// Better: Helpful but safe
catch (error) {
  context.error('Internal error:', error);
  if (error.message.includes('404')) {
    return { error: 'Account not found' };
  }
  return { error: 'Service temporarily unavailable' };
}
```

### Pattern: Rate Limiting (Future Enhancement)

**Template for adding rate limiting:**

```javascript
const rateLimit = new Map();

function checkRateLimit(clientId, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const clientRequests = rateLimit.get(clientId) || [];
  
  // Remove old requests outside window
  const recentRequests = clientRequests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return { allowed: false, retryAfter: windowMs - (now - recentRequests[0]) };
  }
  
  recentRequests.push(now);
  rateLimit.set(clientId, recentRequests);
  
  return { allowed: true };
}

// Usage in handler
const clientId = request.headers.get('x-forwarded-for') || 'unknown';
const rateLimitCheck = checkRateLimit(clientId);

if (!rateLimitCheck.allowed) {
  return {
    status: 429,
    jsonBody: { error: 'Rate limit exceeded', retryAfter: rateLimitCheck.retryAfter }
  };
}
```

---

## Quick Reference Checklist

### Adding a New Tool
- [ ] Add method to XPRClient with JSDoc
- [ ] Add MCP tool definition
- [ ] Add MCP tool handler
- [ ] Add Azure Function (if needed)
- [ ] Test manually
- [ ] Update API_REFERENCE.md
- [ ] Update README.md
- [ ] Run `npm test`

### Code Review Checklist
- [ ] Clear, descriptive naming
- [ ] Error handling at all layers
- [ ] Input validation
- [ ] No security vulnerabilities
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] Follows existing patterns

### Performance Checklist
- [ ] Use parallel requests when possible
- [ ] Return only needed data
- [ ] Consider caching for slow queries
- [ ] Avoid N+1 query problems
- [ ] Test with realistic data sizes

---

## Summary

**Key Principles:**
1. **Separation of Concerns** - One module, one purpose
2. **Consistency** - Follow established patterns
3. **Error Handling** - Three layers: throw, catch, handle
4. **Documentation** - Update all related docs
5. **Security** - Validate inputs, sanitize outputs
6. **Performance** - Parallelize when possible

**When in doubt:**
- Look at existing tools for examples
- Follow the patterns in this document
- Ask: "Is this change minimal and focused?"
- Test thoroughly before committing
