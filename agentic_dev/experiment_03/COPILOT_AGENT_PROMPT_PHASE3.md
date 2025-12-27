# Copilot Agent Prompt: Phase 3 - DeFi Tools Migration

**Task:** Migrate 5 DeFi (Lending & Swap) tools from TypeScript (experiment_01) to Python FastMCP (experiment_04)

---

## 🎯 Objective

Implement 5 DeFi protocol query tools in `/workspaces/XPR/agentic_dev/experiment_04/mcp-server/server.py`:
1. `get_lending_markets` 
2. `get_oracle_prices`
3. `get_lending_position`
4. `get_swap_pools`
5. `get_pool_by_pair`

---

## 📚 Context

### Current State
- **File:** `/workspaces/XPR/agentic_dev/experiment_04/mcp-server/server.py`
- **Existing Tools:** 9 (get_account, get_chain_info, get_block, get_currency_balance, get_table_rows, get_account_resources, get_currency_stats, get_table_by_scope, get_abi)
- **Framework:** FastMCP with stateless HTTP
- **RPC Helper:** `call_proton_rpc()` function exists with 4-endpoint failover
- **Working:** Deployed to Azure Functions, production-ready
- **Phase 1:** ✅ Complete (4 tools added, all tested)
- **Phase 2:** ✅ Complete (4 tools added, pending testing)

### Reference Implementation
- **Source:** `/workspaces/XPR/agentic_dev/experiment_01/src/tools/`
  - `lending-tools.ts` (get_lending_markets, get_oracle_prices, get_lending_position)
  - `swap-tools.ts` (get_swap_pools, get_pool_by_pair)

### Existing RPC Helper
```python
async def call_proton_rpc(endpoint: str, body: dict[str, Any]) -> dict[str, Any]:
    """Call Proton blockchain RPC API with automatic failover."""
    # Already implemented with 4 RPC endpoints
    # Returns JSON or error dict
```

---

## 🔧 Implementation Requirements

### Tool 1: get_lending_markets

**TypeScript Reference:**
```typescript
// From: /workspaces/XPR/agentic_dev/experiment_01/src/tools/lending-tools.ts
{
  name: 'get_lending_markets',
  description: 'Get all MetalX lending markets with supply rates, borrow rates, utilization, and total values'
}
```

**Python Implementation:**
```python
@mcp.tool()
async def get_lending_markets() -> str:
    """Get all MetalX lending markets with supply rates, borrow rates, and liquidity.
    
    Returns comprehensive data for all lending markets on Metal (XMD) protocol including
    supply/borrow APYs, total deposits, total borrows, and utilization rates.
    
    Returns market data for each asset:
    - Supply APY: Annual percentage yield for depositors
    - Borrow APY: Annual percentage rate for borrowers
    - Total Supply: Total deposits in the market
    - Total Borrows: Total amount borrowed
    - Utilization: Percentage of supplied assets being borrowed
    - Available Liquidity: Unborrowed supply available
    
    Common Markets:
    - XPR (Proton native token)
    - XBTC (Wrapped Bitcoin)
    - XETH (Wrapped Ethereum)
    - XUSDC (Wrapped USDC)
    - XMD (Metal Dollar stablecoin)
    
    Use this to:
    - Monitor lending market health and liquidity
    - Compare APY rates across different assets
    - Find best yield opportunities
    - Assess borrowing costs
    - Build DeFi analytics dashboards
    - Alert on high utilization rates
    
    Returns:
        JSON array of markets: [{symbol, supply_apy, borrow_apy, total_supply, total_borrows, utilization, ...}, ...]
    """
    result = await call_proton_rpc(
        "/v1/chain/get_table_rows",
        {
            "code": "lending.loan",
            "table": "markets",
            "scope": "lending.loan",
            "limit": 100,
            "json": True
        }
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)
```

**Testing:**
```python
# Expected usage
mcp_mcp-sama_get_lending_markets()

# Expected response
{
  "rows": [
    {
      "index": 0,
      "symbol": "4,XPR",
      "supply_apy": "5.25",
      "borrow_apy": "7.80",
      "total_supply": "1000000.0000 XPR",
      "total_borrows": "650000.0000 XPR",
      "utilization": "65.00"
    },
    {
      "index": 1,
      "symbol": "8,XBTC",
      "supply_apy": "2.15",
      "borrow_apy": "4.50",
      "total_supply": "50.00000000 XBTC",
      "total_borrows": "20.00000000 XBTC",
      "utilization": "40.00"
    }
  ],
  "more": false
}
```

---

### Tool 2: get_oracle_prices

**TypeScript Reference:**
```typescript
// From: /workspaces/XPR/agentic_dev/experiment_01/src/tools/lending-tools.ts
{
  name: 'get_oracle_prices',
  description: 'Get current oracle prices for all supported tokens on Proton'
}
```

**Python Implementation:**
```python
@mcp.tool()
async def get_oracle_prices(symbols: str = None) -> str:
    """Get current oracle prices for all supported tokens on Proton blockchain.
    
    Returns real-time price data from Proton's decentralized oracle (oracle.ptpx).
    Essential for DeFi operations, lending collateral calculations, and trading.
    
    Returns price data:
    - Price: Current USD price with high precision
    - Timestamp: When price was last updated
    - Symbol: Token identifier
    - Decimals: Price precision
    
    Supported Tokens:
    - XPR (Proton)
    - XBTC (Bitcoin)
    - XETH (Ethereum)
    - XUSDC (USD Coin)
    - XMD (Metal Dollar)
    - LOAN (Metal Protocol)
    - METAL (Metal)
    
    Use this to:
    - Get real-time token prices for DeFi calculations
    - Calculate lending collateral values
    - Determine liquidation risk
    - Build trading interfaces
    - Monitor price movements
    - Validate arbitrage opportunities
    
    Args:
        symbols: Optional comma-separated list of symbols to filter (e.g., "XPR,XBTC,XETH")
        
    Returns:
        JSON array of prices: [{symbol, price, updated_at, median, ...}, ...]
    """
    result = await call_proton_rpc(
        "/v1/chain/get_table_rows",
        {
            "code": "oracle.ptpx",
            "table": "prices",
            "scope": "oracle.ptpx",
            "limit": 100,
            "json": True
        }
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    # Optional: Filter by symbols if provided
    if symbols and "rows" in result:
        symbol_list = [s.strip().upper() for s in symbols.split(",")]
        result["rows"] = [
            row for row in result["rows"]
            if any(sym in str(row.get("symbol", "")).upper() for sym in symbol_list)
        ]
    
    return json.dumps(result, indent=2)
```

**Testing:**
```python
# Expected usage - all prices
mcp_mcp-sama_get_oracle_prices()

# Expected usage - filtered
mcp_mcp-sama_get_oracle_prices("XPR,XBTC")

# Expected response
{
  "rows": [
    {
      "index": 0,
      "symbol": "4,XPR",
      "price": "0.00234500",
      "updated_at": "2025-12-25T23:45:00",
      "median": "0.00234500"
    },
    {
      "index": 1,
      "symbol": "8,XBTC",
      "price": "95420.50000000",
      "updated_at": "2025-12-25T23:45:00",
      "median": "95420.50000000"
    }
  ],
  "more": false
}
```

---

### Tool 3: get_lending_position

**TypeScript Reference:**
```typescript
// From: /workspaces/XPR/agentic_dev/experiment_01/src/tools/lending-tools.ts
{
  name: 'get_lending_position',
  description: 'Get detailed lending position for a specific account'
}
```

**Python Implementation:**
```python
@mcp.tool()
async def get_lending_position(account_name: str) -> str:
    """Get detailed MetalX lending position for a specific Proton account.
    
    Returns complete lending/borrowing position including supplied assets, borrowed
    assets, health factor, and collateral status. Essential for monitoring DeFi positions.
    
    Returns position details:
    - Supplied Assets: All deposits with current value
    - Borrowed Assets: All loans with current debt
    - Health Factor: Liquidation risk indicator (>1.0 is safe)
    - Total Collateral: USD value of all supplied assets
    - Total Debt: USD value of all borrowed assets
    - Borrowing Power: Available credit for additional loans
    
    Health Factor Indicators:
    - > 1.5: Very safe position
    - 1.1 - 1.5: Moderate risk
    - 1.0 - 1.1: At risk (monitor closely)
    - < 1.0: Liquidatable (can be liquidated)
    
    Use this to:
    - Monitor user lending positions
    - Check liquidation risk
    - Calculate available borrowing power
    - Build position management UIs
    - Alert on risky positions
    - Track portfolio health
    
    Args:
        account_name: Proton account name (e.g., "zenpunk", "lendinguser")
        
    Returns:
        JSON with position details: {supplies, borrows, health_factor, total_collateral_usd, total_debt_usd, ...}
    """
    result = await call_proton_rpc(
        "/v1/chain/get_table_rows",
        {
            "code": "lending.loan",
            "table": "positions",
            "scope": account_name,
            "limit": 1,
            "json": True
        }
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    # Check if position exists
    if result.get("rows") and len(result["rows"]) > 0:
        return json.dumps(result["rows"][0], indent=2)
    else:
        return json.dumps({
            "account": account_name,
            "position": None,
            "message": "No lending position found for this account"
        }, indent=2)
```

**Testing:**
```python
# Expected usage
mcp_mcp-sama_get_lending_position("zenpunk")

# Expected response (with position)
{
  "account": "zenpunk",
  "supplies": [
    {"symbol": "4,XPR", "amount": "10000.0000", "value_usd": "23.45"}
  ],
  "borrows": [
    {"symbol": "4,XMD", "amount": "10.0000", "value_usd": "10.00"}
  ],
  "health_factor": "2.345",
  "total_collateral_usd": "23.45",
  "total_debt_usd": "10.00"
}

# Expected response (no position)
{
  "account": "newuser",
  "position": null,
  "message": "No lending position found for this account"
}
```

---

### Tool 4: get_swap_pools

**TypeScript Reference:**
```typescript
// From: /workspaces/XPR/agentic_dev/experiment_01/src/tools/swap-tools.ts
{
  name: 'get_swap_pools',
  description: 'Get all liquidity pools from proton.swaps DEX'
}
```

**Python Implementation:**
```python
@mcp.tool()
async def get_swap_pools() -> str:
    """Get all liquidity pools from Proton Swaps DEX with reserves and fees.
    
    Returns comprehensive data for all trading pairs on Proton's decentralized exchange
    including token reserves, liquidity, swap fees, and trading volume.
    
    Returns pool data:
    - Token Pair: Two tokens in the pool (e.g., XPR/XUSDC)
    - Reserves: Amount of each token in pool
    - Liquidity: Total USD value locked in pool
    - Fee: Swap fee percentage (typically 0.3%)
    - Volume 24h: Trading volume last 24 hours
    
    Common Pools:
    - XPR/XUSDC - Main stablecoin pair
    - XPR/XBTC - Bitcoin trading
    - XPR/XETH - Ethereum trading
    - XUSDC/XMD - Stablecoin pair
    - METAL/XPR - Metal token trading
    
    Use this to:
    - Find available trading pairs
    - Check pool liquidity before swaps
    - Monitor DEX activity and volume
    - Calculate price impact for trades
    - Identify arbitrage opportunities
    - Build DEX analytics dashboards
    - Compare liquidity across pairs
    
    Returns:
        JSON array of pools: [{pool_id, token0, token1, reserve0, reserve1, liquidity_usd, fee, ...}, ...]
    """
    result = await call_proton_rpc(
        "/v1/chain/get_table_rows",
        {
            "code": "proton.swaps",
            "table": "pools",
            "scope": "proton.swaps",
            "limit": 100,
            "json": True
        }
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)
```

**Testing:**
```python
# Expected usage
mcp_mcp-sama_get_swap_pools()

# Expected response
{
  "rows": [
    {
      "pool_id": 1,
      "token0": {"contract": "eosio.token", "symbol": "4,XPR"},
      "token1": {"contract": "xtokens", "symbol": "6,XUSDC"},
      "reserve0": "1000000.0000",
      "reserve1": "2345.000000",
      "liquidity": "4690.000000",
      "fee": 30
    },
    {
      "pool_id": 2,
      "token0": {"contract": "eosio.token", "symbol": "4,XPR"},
      "token1": {"contract": "xtokens", "symbol": "8,XBTC"},
      "reserve0": "500000.0000",
      "reserve1": "0.01234567",
      "liquidity": "2468.000000",
      "fee": 30
    }
  ],
  "more": false
}
```

---

### Tool 5: get_pool_by_pair

**TypeScript Reference:**
```typescript
// From: /workspaces/XPR/agentic_dev/experiment_01/src/tools/swap-tools.ts
{
  name: 'get_pool_by_pair',
  description: 'Get specific pool by token pair'
}
```

**Python Implementation:**
```python
@mcp.tool()
async def get_pool_by_pair(token0_symbol: str, token1_symbol: str) -> str:
    """Get specific Proton Swaps liquidity pool by token pair symbols.
    
    Find and return detailed information for a specific trading pair on Proton DEX.
    Automatically handles token ordering (searches both token0/token1 combinations).
    
    Returns pool details:
    - Pool ID: Unique identifier
    - Token Pair: Contract and symbol for both tokens
    - Reserves: Current amount of each token
    - Exchange Rate: Current price ratio
    - Liquidity: Total value locked
    - Fee Structure: Swap fee details
    
    Common Pairs:
    - "XPR" + "XUSDC" → XPR/XUSDC pool
    - "XPR" + "XBTC" → XPR/XBTC pool
    - "XPR" + "XETH" → XPR/XETH pool
    - "XUSDC" + "XMD" → XUSDC/XMD pool
    
    Use this to:
    - Get specific pool data for swap calculations
    - Check current exchange rates
    - Validate pool exists before swap
    - Calculate expected output amounts
    - Monitor specific trading pair
    - Build pair-specific trading UIs
    
    Args:
        token0_symbol: First token symbol (e.g., "XPR", "XUSDC")
        token1_symbol: Second token symbol (e.g., "XBTC", "XMD")
        
    Returns:
        JSON with pool details or error if pool not found
    """
    # Get all pools first
    result = await call_proton_rpc(
        "/v1/chain/get_table_rows",
        {
            "code": "proton.swaps",
            "table": "pools",
            "scope": "proton.swaps",
            "limit": 100,
            "json": True
        }
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    # Search for matching pool (check both orderings)
    token0_upper = token0_symbol.upper()
    token1_upper = token1_symbol.upper()
    
    for pool in result.get("rows", []):
        pool_token0 = str(pool.get("token0", {}).get("symbol", "")).split(",")[-1].upper()
        pool_token1 = str(pool.get("token1", {}).get("symbol", "")).split(",")[-1].upper()
        
        # Check both orderings
        if (pool_token0 == token0_upper and pool_token1 == token1_upper) or \
           (pool_token0 == token1_upper and pool_token1 == token0_upper):
            return json.dumps(pool, indent=2)
    
    # Pool not found
    return json.dumps({
        "error": "Pool not found",
        "token0": token0_symbol,
        "token1": token1_symbol,
        "message": f"No pool found for pair {token0_symbol}/{token1_symbol}"
    }, indent=2)
```

**Testing:**
```python
# Expected usage
mcp_mcp-sama_get_pool_by_pair("XPR", "XUSDC")

# Expected response (found)
{
  "pool_id": 1,
  "token0": {"contract": "eosio.token", "symbol": "4,XPR"},
  "token1": {"contract": "xtokens", "symbol": "6,XUSDC"},
  "reserve0": "1000000.0000",
  "reserve1": "2345.000000",
  "liquidity": "4690.000000",
  "fee": 30
}

# Expected response (not found)
{
  "error": "Pool not found",
  "token0": "ABC",
  "token1": "XYZ",
  "message": "No pool found for pair ABC/XYZ"
}
```

---

## 📝 Step-by-Step Instructions

### Step 1: Read Current server.py
```bash
# Verify Phase 2 tools are in place
grep -n "@mcp.tool" /workspaces/XPR/agentic_dev/experiment_04/mcp-server/server.py
```

### Step 2: Add 5 New Tools
Edit `/workspaces/XPR/agentic_dev/experiment_04/mcp-server/server.py`:

1. Locate the last `@mcp.tool()` function before `get_user_info`
2. Add the 5 new tool implementations
3. Maintain consistent code style with Phase 1 & 2 tools
4. Use the exact implementations provided above

**File Structure:**
```python
# ... Phase 1 & 2 tools ...

@mcp.tool()
async def get_abi(account_name: str) -> str:
    # ... Phase 2 tool ...

# NEW PHASE 3 TOOLS BELOW

@mcp.tool()
async def get_lending_markets() -> str:
    # ... NEW implementation ...

@mcp.tool()
async def get_oracle_prices(symbols: str = None) -> str:
    # ... NEW implementation ...

@mcp.tool()
async def get_lending_position(account_name: str) -> str:
    # ... NEW implementation ...

@mcp.tool()
async def get_swap_pools() -> str:
    # ... NEW implementation ...

@mcp.tool()
async def get_pool_by_pair(token0_symbol: str, token1_symbol: str) -> str:
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
# Test 1: get_lending_markets
mcp_mcp-sama_get_lending_markets()
# Verify: Returns array of lending markets with APY data

# Test 2: get_oracle_prices (all)
mcp_mcp-sama_get_oracle_prices()
# Verify: Returns all oracle prices

# Test 3: get_oracle_prices (filtered)
mcp_mcp-sama_get_oracle_prices("XPR,XBTC")
# Verify: Returns only XPR and XBTC prices

# Test 4: get_lending_position
mcp_mcp-sama_get_lending_position("zenpunk")
# Verify: Returns lending position or "no position" message

# Test 5: get_swap_pools
mcp_mcp-sama_get_swap_pools()
# Verify: Returns array of DEX pools with reserves

# Test 6: get_pool_by_pair
mcp_mcp-sama_get_pool_by_pair("XPR", "XUSDC")
# Verify: Returns specific pool or "not found" message
```

### Step 5: Update Documentation

**Update CHANGES.md:**
```markdown
#### Change #015: Add Phase 3 DeFi Tools
**Timestamp:** 2025-12-25 [CURRENT_TIME] UTC
**Type:** Feature Addition
**Files:** `/workspaces/XPR/agentic_dev/experiment_04/mcp-server/server.py`
**Status:** Complete ✅

**Implementation:**
Added 5 DeFi protocol query tools:

1. **get_lending_markets**
   - RPC: `/v1/chain/get_table_rows` (lending.loan/markets)
   - Returns: All MetalX lending markets with APY data
   - Tested: ✅

2. **get_oracle_prices**
   - RPC: `/v1/chain/get_table_rows` (oracle.ptpx/prices)
   - Params: Optional symbol filter
   - Returns: Real-time oracle prices
   - Tested: ✅

3. **get_lending_position**
   - RPC: `/v1/chain/get_table_rows` (lending.loan/positions)
   - Params: account_name
   - Returns: User lending position with health factor
   - Tested: ✅

4. **get_swap_pools**
   - RPC: `/v1/chain/get_table_rows` (proton.swaps/pools)
   - Returns: All DEX liquidity pools
   - Tested: ✅

5. **get_pool_by_pair**
   - Source: Filters get_swap_pools results
   - Params: token0_symbol, token1_symbol
   - Returns: Specific trading pair pool
   - Tested: ✅

**Deployment:**
```bash
azd deploy --no-prompt
# Result: ✅ Success ([TIME])
```

**Progress:**
- Phase 3: 5/5 tools complete ✅
- Total: 14/32 tools (43.8%)

---
```

**Update EXPERIMENT_01_TOOLS_INVENTORY.md:**
Mark these 5 tools as ✅ Implemented (Phase 3)

**Update MIGRATION_PLAN.md:**
```markdown
### Phase 3: Lending & Swap Tools (5 tools) 🟡 MEDIUM ✅
- [x] get_lending_markets
- [x] get_oracle_prices
- [x] get_lending_position
- [x] get_swap_pools
- [x] get_pool_by_pair

**Total Progress:** 14/32 tools (43.8%)
```

---

## ✅ Success Criteria

- [ ] All 5 tools implemented in server.py
- [ ] Code follows Phase 1 & 2 patterns (async, error handling, JSON response)
- [ ] Enhanced descriptions with DeFi use cases and examples
- [ ] Deployment successful
- [ ] All 5 tools tested with valid inputs
- [ ] Error handling validated (pool not found, no position, etc.)
- [ ] Response time < 500ms for each tool
- [ ] CHANGES.md updated
- [ ] EXPERIMENT_01_TOOLS_INVENTORY.md updated
- [ ] MIGRATION_PLAN.md updated

---

## 🚫 What NOT to Do

1. **Don't modify Phase 1 & 2 tools** (existing 9 tools)
2. **Don't change RPC helper** (call_proton_rpc)
3. **Don't change imports** unless adding new ones
4. **Don't remove comments** or section separators
5. **Don't skip testing** - must validate each tool
6. **Don't skip documentation** - must update all 3 docs
7. **Don't use short descriptions** - follow Phase 1 & 2 enhanced format
8. **Don't hardcode contract names** - they're already correct in the code

---

## 📊 Expected Output

### Files Modified
1. `/workspaces/XPR/agentic_dev/experiment_04/mcp-server/server.py` - 5 new tools (~250 lines)
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
✅ get_lending_markets: Working
✅ get_oracle_prices: Working  
✅ get_lending_position: Working
✅ get_swap_pools: Working
✅ get_pool_by_pair: Working
```

---

## 🎯 Ready to Execute?

**Confirm you understand:**
1. Add 5 DeFi tools to server.py (after Phase 2 tools, before get_user_info)
2. Use enhanced description format from Phase 1 & 2
3. Deploy to Azure
4. Test all 5 tools with real DeFi data
5. Update 3 documentation files
6. Report results

**Previous Phases Lessons Applied:**
- ✅ Enhanced descriptions with use cases (Phase 1)
- ✅ Real contract/account examples (Phase 1)
- ✅ Detailed parameter documentation (Phase 1 & 2)
- ✅ Common patterns and scenarios (Phase 2)
- ✅ Performance expectations (Phase 1 & 2)
- ✅ Error handling patterns (Phase 2)

**DeFi-Specific Considerations:**
- Lending markets: MetalX protocol specifics
- Oracle prices: Real-time price data
- Health factors: Liquidation risk indicators  
- Swap pools: DEX liquidity and reserves
- Token pairs: Bidirectional pool search

**When ready, execute this plan following the ITERATION_GUIDE.md process.**

---

**Last Updated:** December 25, 2025  
**Version:** 1.0.0  
**Phase:** 3 of 4  
**Estimated Time:** 2.5 hours  
**Previous Phases:** ✅ Phase 1 (4 tools), ✅ Phase 2 (4 tools)  
**After Phase 3:** 14/32 tools (43.8%)
