# Copilot Agent Prompt: Phase 2 - Account & Token Tools Migration

**Task:** Migrate 4 account and token tools from TypeScript (experiment_01) to Python FastMCP (experiment_04)

---

## 🎯 Objective

Implement 4 account and token query tools in `/workspaces/XPR/agentic_dev/experiment_04/mcp-server/server.py`:
1. `get_account_resources` (derived from get_account)
2. `get_currency_stats`
3. `get_table_by_scope`
4. `get_abi`

---

## 📚 Context

### Current State
- **File:** `/workspaces/XPR/agentic_dev/experiment_04/mcp-server/server.py`
- **Existing Tools:** 5 (get_account, get_chain_info, get_block, get_currency_balance, get_table_rows)
- **Framework:** FastMCP with stateless HTTP
- **RPC Helper:** `call_proton_rpc()` function exists with 4-endpoint failover
- **Working:** Deployed to Azure Functions, production-ready
- **Phase 1:** ✅ Complete (4 tools added, all tested)

### Reference Implementation
- **Source:** `/workspaces/XPR/agentic_dev/experiment_01/src/tools/`
  - `account-tools.ts` (get_account_resources)
  - `token-tools.ts` (get_currency_stats, get_table_by_scope)
  - `contract-tools.ts` (get_abi)

### Existing RPC Helper
```python
async def call_proton_rpc(endpoint: str, body: dict[str, Any]) -> dict[str, Any]:
    """Call Proton blockchain RPC API with automatic failover."""
    # Already implemented with 4 RPC endpoints
    # Returns JSON or error dict
```

---

## 🔧 Implementation Requirements

### Tool 1: get_account_resources

**TypeScript Reference:**
```typescript
// From: /workspaces/XPR/agentic_dev/experiment_01/src/tools/account-tools.ts
{
  name: 'get_account_resources',
  description: 'Get CPU, NET, and RAM resource information for a Proton account'
}
```

**Implementation Strategy:**
This tool extracts resource data from `get_account` response. No new RPC call needed.

**Python Implementation:**
```python
@mcp.tool()
async def get_account_resources(account_name: str) -> str:
    """Get CPU, NET, and RAM resource usage and limits for a Proton account.
    
    Extracts resource information from account data to provide simplified view
    of resource consumption. Useful for monitoring resource availability before
    transactions or checking if account needs more resources.
    
    Returns resource metrics:
    - CPU: used, available, max (in microseconds)
    - NET: used, available, max (in bytes)
    - RAM: quota and current usage (in bytes)
    
    Use this to:
    - Check if account has enough resources for transactions
    - Monitor resource consumption trends
    - Identify accounts that need resource refills
    - Build resource usage dashboards
    
    Args:
        account_name: Proton account name (e.g., "zenpunk", "bloksio")
        
    Returns:
        JSON with resource limits: cpu_limit, net_limit, ram_quota, ram_usage
    """
    # Call existing get_account endpoint
    result = await call_proton_rpc(
        "/v1/chain/get_account",
        {"account_name": account_name}
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    # Extract only resource information
    resources = {
        "account_name": result.get("account_name"),
        "cpu_limit": result.get("cpu_limit"),
        "net_limit": result.get("net_limit"),
        "ram_quota": result.get("ram_quota"),
        "ram_usage": result.get("ram_usage")
    }
    
    return json.dumps(resources, indent=2)
```

**Testing:**
```python
# Expected usage
mcp_mcp-sama_get_account_resources("zenpunk")

# Expected response
{
  "account_name": "zenpunk",
  "cpu_limit": {
    "used": 728,
    "available": 3215764,
    "max": 3216492
  },
  "net_limit": {
    "used": 353,
    "available": 17388312,
    "max": 17388665
  },
  "ram_quota": 13399,
  "ram_usage": 7367
}
```

---

### Tool 2: get_currency_stats

**TypeScript Reference:**
```typescript
// From: /workspaces/XPR/agentic_dev/experiment_01/src/tools/token-tools.ts
{
  name: 'get_currency_stats',
  description: 'Get token supply statistics including max supply, current supply, and issuer'
}
```

**Python Implementation:**
```python
@mcp.tool()
async def get_currency_stats(code: str, symbol: str) -> str:
    """Get token supply statistics including max supply, current supply, and issuer.
    
    Returns comprehensive token metadata and supply information for any token
    on Proton blockchain. Essential for understanding token economics.
    
    Returns token statistics:
    - Supply: Current circulating supply with precision
    - Max Supply: Total possible supply (if set)
    - Issuer: Account that can mint/burn tokens
    
    Common Tokens:
    - XPR: code="eosio.token", symbol="XPR"
    - XBTC: code="xtokens", symbol="XBTC"
    - XUSDC: code="xtokens", symbol="XUSDC"
    - XMD: code="loan.token", symbol="XMD"
    
    Use this to:
    - Check total token supply and circulation
    - Verify token issuer authority
    - Monitor token inflation/deflation
    - Validate token contract configuration
    - Build token analytics dashboards
    
    Args:
        code: Token contract account (e.g., "eosio.token", "xtokens")
        symbol: Token symbol (e.g., "XPR", "XBTC", "XUSDC")
        
    Returns:
        JSON with supply stats: {symbol: {supply, max_supply, issuer}}
    """
    result = await call_proton_rpc(
        "/v1/chain/get_currency_stats",
        {
            "code": code,
            "symbol": symbol
        }
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)
```

**Testing:**
```python
# Expected usage
mcp_mcp-sama_get_currency_stats("eosio.token", "XPR")

# Expected response
{
  "XPR": {
    "supply": "1000000000.0000 XPR",
    "max_supply": "10000000000.0000 XPR",
    "issuer": "eosio"
  }
}
```

---

### Tool 3: get_table_by_scope

**TypeScript Reference:**
```typescript
// From: /workspaces/XPR/agentic_dev/experiment_01/src/tools/token-tools.ts
{
  name: 'get_table_by_scope',
  description: 'List all scopes for a table in a smart contract'
}
```

**Python Implementation:**
```python
@mcp.tool()
async def get_table_by_scope(
    code: str,
    table: str,
    lower_bound: str = None,
    upper_bound: str = None,
    limit: int = 100
) -> str:
    """List all scopes (data partitions) for a table in a smart contract.
    
    Discovery tool to find all scope values for a given table. Scopes represent
    different data partitions - often account names, token symbols, or IDs.
    Essential for exploring contract data structure.
    
    Returns scope list:
    - Scopes: Array of scope names/values
    - Count: Number of rows in each scope
    - Pagination: Support for large scope lists
    
    Common Use Cases:
    - Find all accounts with token balances
    - List all NFT collection scopes
    - Discover all lending market scopes
    - Enumerate all swap pool pairs
    
    Examples:
    - Token holders: code="eosio.token", table="accounts"
    - NFT owners: code="atomicassets", table="assets"
    - Lending users: code="loan.token", table="positions"
    
    Use this to:
    - Discover all data partitions in a table
    - Find accounts with balances/positions
    - Build comprehensive data indexes
    - Audit contract data distribution
    - Identify active scopes for iteration
    
    Args:
        code: Contract account name (e.g., "eosio.token", "atomicassets")
        table: Table name (e.g., "accounts", "assets")
        lower_bound: Optional start scope for pagination
        upper_bound: Optional end scope filter
        limit: Max scopes to return (default: 100)
        
    Returns:
        JSON with scopes array: [{code, scope, table, payer, count}, ...]
    """
    body = {
        "code": code,
        "table": table,
        "limit": limit
    }
    
    if lower_bound:
        body["lower_bound"] = lower_bound
    if upper_bound:
        body["upper_bound"] = upper_bound
    
    result = await call_proton_rpc("/v1/chain/get_table_by_scope", body)
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)
```

**Testing:**
```python
# Expected usage
mcp_mcp-sama_get_table_by_scope("eosio.token", "accounts", limit=5)

# Expected response
{
  "rows": [
    {
      "code": "eosio.token",
      "scope": "alice",
      "table": "accounts",
      "payer": "alice",
      "count": 1
    },
    {
      "code": "eosio.token",
      "scope": "bob",
      "table": "accounts",
      "payer": "bob",
      "count": 1
    }
  ],
  "more": "charlie"
}
```

---

### Tool 4: get_abi

**TypeScript Reference:**
```typescript
// From: /workspaces/XPR/agentic_dev/experiment_01/src/tools/contract-tools.ts
{
  name: 'get_abi',
  description: 'Get smart contract ABI (Application Binary Interface) definition'
}
```

**Python Implementation:**
```python
@mcp.tool()
async def get_abi(account_name: str) -> str:
    """Get smart contract ABI (Application Binary Interface) definition.
    
    Returns complete contract interface including all actions, tables, and types.
    Essential for understanding contract capabilities and data structures.
    
    Returns ABI specification:
    - Actions: All callable contract functions with parameters
    - Tables: All data tables with row structure
    - Types: Custom type definitions
    - Structs: Data structure specifications
    
    Use this to:
    - Discover contract actions and parameters
    - Understand table schemas before queries
    - Generate type-safe contract interactions
    - Build contract documentation
    - Validate transaction data structures
    
    Common Contracts:
    - "eosio.token" - Token contract (transfer, issue, etc.)
    - "atomicassets" - NFT marketplace contract
    - "loan.token" - Metal lending protocol
    - "proton.swaps" - DEX swap contract
    - "oracle.ptpx" - Price oracle contract
    
    Args:
        account_name: Contract account name (e.g., "eosio.token", "atomicassets")
        
    Returns:
        JSON with complete ABI: {version, types, structs, actions, tables, ...}
    """
    result = await call_proton_rpc(
        "/v1/chain/get_abi",
        {"account_name": account_name}
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)
```

**Testing:**
```python
# Expected usage
mcp_mcp-sama_get_abi("eosio.token")

# Expected response
{
  "account_name": "eosio.token",
  "abi": {
    "version": "eosio::abi/1.1",
    "types": [],
    "structs": [
      {
        "name": "transfer",
        "fields": [
          {"name": "from", "type": "name"},
          {"name": "to", "type": "name"},
          {"name": "quantity", "type": "asset"},
          {"name": "memo", "type": "string"}
        ]
      }
    ],
    "actions": [
      {"name": "transfer", "type": "transfer"},
      {"name": "issue", "type": "issue"}
    ],
    "tables": [
      {"name": "accounts", "type": "account"},
      {"name": "stat", "type": "currency_stats"}
    ]
  }
}
```

---

## 📝 Step-by-Step Instructions

### Step 1: Read Current server.py
```bash
# Verify Phase 1 tools are in place
grep -n "@mcp.tool" /workspaces/XPR/agentic_dev/experiment_04/mcp-server/server.py
```

### Step 2: Add 4 New Tools
Edit `/workspaces/XPR/agentic_dev/experiment_04/mcp-server/server.py`:

1. Locate the last `@mcp.tool()` function before `get_user_info`
2. Add the 4 new tool implementations
3. Maintain consistent code style with Phase 1 tools
4. Use the exact implementations provided above

**File Structure:**
```python
# ------------------------------------------------------------
# MCP Tools
# ------------------------------------------------------------
@mcp.tool()
async def get_account(account_name: str) -> str:
    # ... Phase 1 tool ...

@mcp.tool()
async def get_chain_info() -> str:
    # ... Phase 1 tool ...

@mcp.tool()
async def get_block(block_num_or_id: str) -> str:
    # ... Phase 1 tool ...

@mcp.tool()
async def get_currency_balance(code: str, account: str, symbol: str = None) -> str:
    # ... Phase 1 tool ...

@mcp.tool()
async def get_table_rows(...) -> str:
    # ... Phase 1 tool ...

# NEW PHASE 2 TOOLS BELOW

@mcp.tool()
async def get_account_resources(account_name: str) -> str:
    # ... NEW implementation ...

@mcp.tool()
async def get_currency_stats(code: str, symbol: str) -> str:
    # ... NEW implementation ...

@mcp.tool()
async def get_table_by_scope(...) -> str:
    # ... NEW implementation ...

@mcp.tool()
async def get_abi(account_name: str) -> str:
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
# Test 1: get_account_resources
mcp_mcp-sama_get_account_resources("zenpunk")
# Verify: Returns CPU/NET/RAM resources

# Test 2: get_currency_stats
mcp_mcp-sama_get_currency_stats("eosio.token", "XPR")
# Verify: Returns supply and issuer info

# Test 3: get_table_by_scope
mcp_mcp-sama_get_table_by_scope("eosio.token", "accounts", limit=5)
# Verify: Returns scope list with accounts

# Test 4: get_abi
mcp_mcp-sama_get_abi("eosio.token")
# Verify: Returns contract ABI with actions/tables
```

### Step 5: Update Documentation

**Update CHANGES.md:**
```markdown
#### Change #013: Add Phase 2 Account & Token Tools
**Timestamp:** 2025-12-25 [CURRENT_TIME] UTC
**Type:** Feature Addition
**Files:** `/workspaces/XPR/agentic_dev/experiment_04/mcp-server/server.py`
**Status:** Complete ✅

**Implementation:**
Added 4 account and token query tools:

1. **get_account_resources**
   - Source: Derived from get_account
   - Returns: CPU/NET/RAM resource metrics
   - Tested: ✅

2. **get_currency_stats**
   - RPC: `/v1/chain/get_currency_stats`
   - Params: code, symbol
   - Returns: Token supply and issuer
   - Tested: ✅

3. **get_table_by_scope**
   - RPC: `/v1/chain/get_table_by_scope`
   - Params: code, table, limit, bounds
   - Returns: All scopes for a table
   - Tested: ✅

4. **get_abi**
   - RPC: `/v1/chain/get_abi`
   - Params: account_name
   - Returns: Contract ABI specification
   - Tested: ✅

**Deployment:**
```bash
azd deploy --no-prompt
# Result: ✅ Success ([TIME])
```

**Progress:**
- Phase 2: 4/4 tools complete ✅
- Total: 9/32 tools (28.1%)

---
```

**Update EXPERIMENT_01_TOOLS_INVENTORY.md:**
Mark these 4 tools as ✅ Implemented (Phase 2)

**Update MIGRATION_PLAN.md:**
```markdown
### Phase 2: Account & Token Tools (4 tools) 🟡 MEDIUM ✅
- [x] get_account_resources
- [x] get_currency_stats
- [x] get_table_by_scope
- [x] get_abi

**Total Progress:** 9/32 tools (28.1%)
```

---

## ✅ Success Criteria

- [ ] All 4 tools implemented in server.py
- [ ] Code follows Phase 1 patterns (async, error handling, JSON response)
- [ ] Enhanced descriptions with use cases and examples
- [ ] Deployment successful
- [ ] All 4 tools tested with valid inputs
- [ ] Error handling validated
- [ ] Response time < 500ms for each tool
- [ ] CHANGES.md updated
- [ ] EXPERIMENT_01_TOOLS_INVENTORY.md updated
- [ ] MIGRATION_PLAN.md updated

---

## 🚫 What NOT to Do

1. **Don't modify Phase 1 tools** (get_account, get_chain_info, etc.)
2. **Don't change RPC helper** (call_proton_rpc)
3. **Don't change imports** unless adding new ones
4. **Don't remove comments** or section separators
5. **Don't skip testing** - must validate each tool
6. **Don't skip documentation** - must update all 3 docs
7. **Don't use short descriptions** - follow Phase 1 enhanced format

---

## 📊 Expected Output

### Files Modified
1. `/workspaces/XPR/agentic_dev/experiment_04/mcp-server/server.py` - 4 new tools (~160 lines)
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
✅ get_account_resources: Working
✅ get_currency_stats: Working
✅ get_table_by_scope: Working
✅ get_abi: Working
```

---

## 🎯 Ready to Execute?

**Confirm you understand:**
1. Add 4 tools to server.py (after Phase 1 tools, before get_user_info)
2. Use enhanced description format from Phase 1
3. Deploy to Azure
4. Test all 4 tools
5. Update 3 documentation files
6. Report results

**Phase 1 Lessons Applied:**
- ✅ Enhanced descriptions with use cases
- ✅ Real contract/account examples
- ✅ Detailed parameter documentation
- ✅ Common patterns and scenarios
- ✅ Performance expectations

**When ready, execute this plan following the ITERATION_GUIDE.md process.**

---

**Last Updated:** December 25, 2025  
**Version:** 1.0.0  
**Phase:** 2 of 4  
**Estimated Time:** 1.5 hours  
**Previous Phase:** ✅ Phase 1 Complete (5 tools, 15.6%)  
**After Phase 2:** 9/32 tools (28.1%)
