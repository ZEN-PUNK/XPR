# Copilot Agent Prompt: Phase 1 - Core Chain Tools Migration

**Task:** Migrate 4 high-priority MCP tools from TypeScript (experiment_01) to Python FastMCP (experiment_04)

---

## 🎯 Objective

Implement 4 core blockchain query tools in `/workspaces/XPR/agentic_dev/experiment_04/mcp-server/server.py`:
1. `get_chain_info`
2. `get_block`
3. `get_currency_balance`
4. `get_table_rows`

---

## 📚 Context

### Current State
- **File:** `/workspaces/XPR/agentic_dev/experiment_04/mcp-server/server.py`
- **Existing Tools:** 1 (get_account, get_user_info)
- **Framework:** FastMCP with stateless HTTP
- **RPC Helper:** `call_proton_rpc()` function exists with 4-endpoint failover
- **Working:** Deployed to Azure Functions, production-ready

### Reference Implementation
- **Source:** `/workspaces/XPR/agentic_dev/experiment_01/src/tools/`
  - `chain-tools.ts` (get_chain_info, get_block)
  - `token-tools.ts` (get_currency_balance, get_table_rows)

### Existing RPC Helper
```python
async def call_proton_rpc(endpoint: str, body: dict[str, Any]) -> dict[str, Any]:
    """Call Proton blockchain RPC API with automatic failover."""
    # Already implemented with 4 RPC endpoints
    # Returns JSON or error dict
```

---

## 🔧 Implementation Requirements

### Tool 1: get_chain_info

**TypeScript Reference:**
```typescript
// From: /workspaces/XPR/agentic_dev/experiment_01/src/tools/chain-tools.ts
{
  name: 'get_chain_info',
  description: 'Get current Proton chain information including head block, version, and state',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  }
}
```

**Python Implementation:**
```python
@mcp.tool()
async def get_chain_info() -> str:
    """Get current Proton chain information including head block, version, and state.
    
    Returns:
        JSON with chain info including server_version, chain_id, head_block_num,
        head_block_time, head_block_producer, last_irreversible_block_num
    """
    result = await call_proton_rpc("/v1/chain/get_info", {})
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)
```

**Testing:**
```python
# Expected usage
mcp_mcp-sama_get_chain_info()

# Expected response
{
  "server_version": "...",
  "chain_id": "...",
  "head_block_num": 358030000,
  "head_block_time": "2025-12-25T...",
  "head_block_producer": "...",
  "last_irreversible_block_num": 358029900
}
```

---

### Tool 2: get_block

**TypeScript Reference:**
```typescript
// From: /workspaces/XPR/agentic_dev/experiment_01/src/tools/chain-tools.ts
{
  name: 'get_block',
  description: 'Retrieve Proton block details including timestamp, producer, and transactions',
  inputSchema: {
    type: 'object',
    properties: {
      block_num_or_id: {
        type: ['string', 'number'],
        description: 'Block number (integer) or block ID (hash) to retrieve'
      }
    },
    required: ['block_num_or_id']
  }
}
```

**Python Implementation:**
```python
@mcp.tool()
async def get_block(block_num_or_id: str) -> str:
    """Retrieve Proton block details including timestamp, producer, and transactions.
    
    Args:
        block_num_or_id: Block number (integer) or block ID (hash) to retrieve
        
    Returns:
        JSON with block details including timestamp, producer, transactions
    """
    result = await call_proton_rpc(
        "/v1/chain/get_block",
        {"block_num_or_id": block_num_or_id}
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)
```

**Testing:**
```python
# Expected usage
mcp_mcp-sama_get_block("358030000")

# Expected response
{
  "timestamp": "2025-12-25T...",
  "producer": "...",
  "block_num": 358030000,
  "transactions": [...],
  "transaction_mroot": "...",
  "action_mroot": "..."
}
```

---

### Tool 3: get_currency_balance

**TypeScript Reference:**
```typescript
// From: /workspaces/XPR/agentic_dev/experiment_01/src/tools/token-tools.ts
{
  name: 'get_currency_balance',
  description: 'Get token balance for an account...',
  inputSchema: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'Token contract (e.g., "eosio.token", "xtokens", "loan.token")'
      },
      account: {
        type: 'string',
        description: 'Account name to check balance for'
      },
      symbol: {
        type: 'string',
        description: 'Optional: specific token symbol (e.g., "XPR", "XBTC", "XMD")'
      }
    },
    required: ['code', 'account']
  }
}
```

**Python Implementation:**
```python
@mcp.tool()
async def get_currency_balance(code: str, account: str, symbol: str = None) -> str:
    """Get token balance for an account.
    
    Args:
        code: Token contract (e.g., "eosio.token", "xtokens", "loan.token")
        account: Account name to check balance for
        symbol: Optional specific token symbol (e.g., "XPR", "XBTC", "XMD")
        
    Returns:
        JSON array of token balances (e.g., ["1234.5678 XPR"])
    """
    body = {
        "code": code,
        "account": account
    }
    
    if symbol:
        body["symbol"] = symbol
    
    result = await call_proton_rpc("/v1/chain/get_currency_balance", body)
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)
```

**Testing:**
```python
# Expected usage
mcp_mcp-sama_get_currency_balance("eosio.token", "zenpunk", "XPR")

# Expected response
["1234.5678 XPR"]
```

---

### Tool 4: get_table_rows

**TypeScript Reference:**
```typescript
// From: /workspaces/XPR/agentic_dev/experiment_01/src/tools/token-tools.ts
{
  name: 'get_table_rows',
  description: 'Query any smart contract table on Proton...',
  inputSchema: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'Contract account name'
      },
      table: {
        type: 'string',
        description: 'Table name'
      },
      scope: {
        type: 'string',
        description: 'Table scope (often same as contract, or account name)'
      },
      limit: {
        type: 'number',
        description: 'Max rows to return (default: 100)'
      },
      lower_bound: {
        type: 'string',
        description: 'Lower bound for primary key'
      },
      upper_bound: {
        type: 'string',
        description: 'Upper bound for primary key'
      }
    },
    required: ['code', 'table', 'scope']
  }
}
```

**Python Implementation:**
```python
@mcp.tool()
async def get_table_rows(
    code: str, 
    table: str, 
    scope: str, 
    limit: int = 100,
    lower_bound: str = None,
    upper_bound: str = None
) -> str:
    """Query any smart contract table on Proton.
    
    Args:
        code: Contract account name
        table: Table name
        scope: Table scope (often same as contract, or account name)
        limit: Max rows to return (default: 100)
        lower_bound: Optional lower bound for primary key
        upper_bound: Optional upper bound for primary key
        
    Returns:
        JSON with rows from the table
    """
    body = {
        "code": code,
        "table": table,
        "scope": scope,
        "limit": limit,
        "json": True
    }
    
    if lower_bound:
        body["lower_bound"] = lower_bound
    if upper_bound:
        body["upper_bound"] = upper_bound
    
    result = await call_proton_rpc("/v1/chain/get_table_rows", body)
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)
```

**Testing:**
```python
# Expected usage
mcp_mcp-sama_get_table_rows("eosio.token", "accounts", "zenpunk")

# Expected response
{
  "rows": [
    {"balance": "1234.5678 XPR"}
  ],
  "more": false,
  "next_key": ""
}
```

---

## 📝 Step-by-Step Instructions

### Step 1: Read Current server.py
```bash
# Understand current structure
cat /workspaces/XPR/agentic_dev/experiment_04/mcp-server/server.py
```

### Step 2: Add 4 New Tools
Edit `/workspaces/XPR/agentic_dev/experiment_04/mcp-server/server.py`:

1. Locate the section with existing `@mcp.tool()` decorators
2. Add the 4 new tool implementations after `get_account`
3. Maintain consistent code style with existing tools
4. Use the exact implementations provided above

**File Structure:**
```python
# ------------------------------------------------------------
# MCP Tools
# ------------------------------------------------------------
@mcp.tool()
async def get_account(account_name: str) -> str:
    # ... existing implementation ...

@mcp.tool()
async def get_chain_info() -> str:
    # ... NEW implementation ...

@mcp.tool()
async def get_block(block_num_or_id: str) -> str:
    # ... NEW implementation ...

@mcp.tool()
async def get_currency_balance(code: str, account: str, symbol: str = None) -> str:
    # ... NEW implementation ...

@mcp.tool()
async def get_table_rows(
    code: str, 
    table: str, 
    scope: str, 
    limit: int = 100,
    lower_bound: str = None,
    upper_bound: str = None
) -> str:
    # ... NEW implementation ...

@mcp.tool()
async def get_user_info() -> str:
    # ... existing implementation ...
```

### Step 3: Deploy to Azure
```bash
cd /workspaces/XPR/agentic_dev/experiment_04/mcp-server
azd deploy --no-prompt
```

### Step 4: Test Each Tool
```python
# Test 1: get_chain_info
mcp_mcp-sama_get_chain_info()
# Verify: Returns chain info with head_block_num

# Test 2: get_block (use head block from test 1)
mcp_mcp-sama_get_block("358030000")
# Verify: Returns block details with timestamp

# Test 3: get_currency_balance
mcp_mcp-sama_get_currency_balance("eosio.token", "zenpunk", "XPR")
# Verify: Returns balance array

# Test 4: get_table_rows
mcp_mcp-sama_get_table_rows("eosio.token", "accounts", "zenpunk", 10)
# Verify: Returns table rows
```

### Step 5: Update Documentation

**Update CHANGES.md:**
```markdown
#### Change #011: Add Phase 1 Core Chain Tools
**Timestamp:** 2024-12-25 [CURRENT_TIME] UTC
**Type:** Feature Addition
**Files:** `/workspaces/XPR/agentic_dev/experiment_04/mcp-server/server.py`
**Status:** Complete ✅

**Implementation:**
Added 4 core blockchain query tools:

1. **get_chain_info**
   - RPC: `/v1/chain/get_info`
   - Returns: Chain state, head block, version
   - Tested: ✅

2. **get_block**
   - RPC: `/v1/chain/get_block`
   - Params: block_num_or_id
   - Returns: Block details, transactions
   - Tested: ✅

3. **get_currency_balance**
   - RPC: `/v1/chain/get_currency_balance`
   - Params: code, account, symbol (optional)
   - Returns: Token balances
   - Tested: ✅

4. **get_table_rows**
   - RPC: `/v1/chain/get_table_rows`
   - Params: code, table, scope, limit, bounds
   - Returns: Contract table data
   - Tested: ✅

**Testing Results:**
```python
# get_chain_info
{
  "head_block_num": 358030000,
  "chain_id": "...",
  "server_version": "..."
}

# get_block
{
  "block_num": 358030000,
  "timestamp": "2025-12-25T...",
  "producer": "..."
}

# get_currency_balance
["1234.5678 XPR"]

# get_table_rows
{
  "rows": [...],
  "more": false
}
```

**Deployment:**
```bash
azd deploy --no-prompt
# Result: ✅ Success (1 minute 15 seconds)
```

**Performance:**
- Response time: ~200-300ms (warm)
- RPC failover: Working
- Error handling: Validated

**Progress:**
- Phase 1: 4/4 tools complete ✅
- Total: 5/32 tools (15.6%)

---
```

**Update EXPERIMENT_01_TOOLS_INVENTORY.md:**
```markdown
### ✅ 2.1 get_chain_info
**Status:** ✅ Implemented  
[... rest of description ...]

### ✅ 2.2 get_block
**Status:** ✅ Implemented  
[... rest of description ...]

### ✅ 4.1 get_currency_balance
**Status:** ✅ Implemented  
[... rest of description ...]

### ✅ 4.3 get_table_rows
**Status:** ✅ Implemented  
[... rest of description ...]
```

**Update MIGRATION_PLAN.md:**
```markdown
### Phase 1: Core Chain Tools
- [x] get_chain_info
- [x] get_block
- [x] get_currency_balance
- [x] get_table_rows

**Total Progress:** 5/32 tools (15.6%)
```

---

## ✅ Success Criteria

- [ ] All 4 tools implemented in server.py
- [ ] Code follows existing patterns (async, error handling, JSON response)
- [ ] Deployment successful
- [ ] All 4 tools tested with valid inputs
- [ ] All 4 tools tested with invalid inputs (error handling)
- [ ] Response time < 500ms for each tool
- [ ] RPC failover working (verify in logs)
- [ ] CHANGES.md updated
- [ ] EXPERIMENT_01_TOOLS_INVENTORY.md updated
- [ ] MIGRATION_PLAN.md updated

---

## 🚫 What NOT to Do

1. **Don't modify existing tools** (get_account, get_user_info)
2. **Don't change RPC helper** (call_proton_rpc)
3. **Don't change imports** unless adding new ones
4. **Don't remove comments** or section separators
5. **Don't skip testing** - must validate each tool
6. **Don't skip documentation** - must update all 3 docs

---

## 📊 Expected Output

### Files Modified
1. `/workspaces/XPR/agentic_dev/experiment_04/mcp-server/server.py` - 4 new tools
2. `/workspaces/XPR/agentic_dev/experiment_04/CHANGES.md` - New change entry
3. `/workspaces/XPR/agentic_dev/experiment_04/EXPERIMENT_01_TOOLS_INVENTORY.md` - Status updates
4. `/workspaces/XPR/agentic_dev/experiment_04/MIGRATION_PLAN.md` - Progress checkboxes

### Deployment Result
```
SUCCESS: Your application was deployed to Azure in X minutes Y seconds.
Endpoint: https://YOUR-FUNCTION-APP.azurewebsites.net/
```

### Test Results
```
✅ get_chain_info: Working
✅ get_block: Working
✅ get_currency_balance: Working
✅ get_table_rows: Working
```

---

## 🎯 Ready to Execute?

**Confirm you understand:**
1. Add 4 tools to server.py
2. Deploy to Azure
3. Test all 4 tools
4. Update 3 documentation files
5. Report results

**When ready, execute this plan following the ITERATION_GUIDE.md process.**

---

**Last Updated:** December 25, 2024  
**Version:** 1.0.0  
**Phase:** 1 of 4  
**Estimated Time:** 1.5 hours
