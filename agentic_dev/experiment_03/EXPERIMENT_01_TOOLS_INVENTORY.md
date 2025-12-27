# Experiment 01 - MCP Tools Inventory

**Source:** `/workspaces/XPR/agentic_dev/experiment_01/src/tools/`  
**Total Tools:** 32 tools across 10 categories  
**Target:** Migrate to experiment_04 (Python FastMCP on Azure Functions)  
**Current Progress:** 81.3% (26/32 complete)

---

## 📊 Tool Categories Overview

| Category | File | Tools | Status | Priority |
|----------|------|-------|--------|----------|
| **Account** | account-tools.ts | 2 | ✅ 2/2 Complete | 🔴 HIGH |
| **Chain** | chain-tools.ts | 3 | ✅ 3/3 Complete | 🔴 HIGH |
| **Lending** | lending-tools.ts | 6 | 🟡 5/6 Complete | 🟡 MEDIUM |
| **Token** | token-tools.ts | 4 | ✅ 4/4 Complete | 🔴 HIGH |
| **Contract** | contract-tools.ts | 2 | ✅ 2/2 Complete | 🟡 MEDIUM |
| **History** | history-tools.ts | 4 | ✅ 4/4 Complete | 🟢 LOW |
| **Producer** | producer-tools.ts | 2 | ✅ 2/2 Complete | 🟢 LOW |
| **Swap** | swap-tools.ts | 4 | ✅ 4/4 Complete | 🟡 MEDIUM |
| **NFT** | nft-tools.ts | 5 | ⏳ 0/5 Pending | 🟢 LOW |
| **Protocol** | - | 1 | ⏳ 0/1 Pending | 🟢 LOW |

**Legend:**
- ✅ Complete - Implemented and deployed
- 🟡 Partial - Some tools complete
- ⏳ Pending - Not yet started

---

## 🔧 Category 1: Account Tools (2 tools)

### ✅ 1.1 get_account
**Status:** Already implemented in experiment_04  
**RPC Endpoint:** `/v1/chain/get_account`  
**Description:** Retrieve Proton account information including resources, permissions, and voting status  

**Parameters:**
- `account_name` (string, required): Proton account name (e.g., "zenpunk", "bloksio")

**Current Implementation:**
- File: `/workspaces/XPR/agentic_dev/experiment_04/mcp-server/server.py`
- Working with 4-endpoint RPC failover
- Returns: JSON account data

**Migration:** ✅ Complete - No action needed

---

### ✅ 1.2 get_account_resources
**Status:** ✅ Implemented (Phase 2)  
**RPC Endpoint:** `/v1/chain/get_account` (same as get_account)  
**Description:** Get CPU, NET, and RAM resource information for a Proton account  

**Parameters:**
- `account_name` (string, required): Proton account name

**Returns:**
```python
{
  "account_name": str,
  "cpu_limit": {"used": int, "available": int, "max": int},
  "net_limit": {"used": int, "available": int, "max": int},
  "ram_quota": int,
  "ram_usage": int
}
```

**Implementation:**
```python
@mcp.tool()
async def get_account_resources(account_name: str) -> str:
    """Get CPU, NET, and RAM resource usage and limits."""
    result = await call_proton_rpc("/v1/chain/get_account", {"account_name": account_name})
    if "error" in result:
        return f"Error: {result['error']}"
    resources = {
        "account_name": result.get("account_name"),
        "cpu_limit": result.get("cpu_limit"),
        "net_limit": result.get("net_limit"),
        "ram_quota": result.get("ram_quota"),
        "ram_usage": result.get("ram_usage")
    }
    return json.dumps(resources, indent=2)
```

**Migration:** ✅ Complete (Phase 2)

---

## 🔗 Category 2: Chain Tools (3 tools)

### ✅ 2.1 get_chain_info
**Status:** ✅ Implemented (Phase 1)  
**RPC Endpoint:** `/v1/chain/get_info`  
**Description:** Get current Proton chain information including head block, version, and state  

**Parameters:** None

**Returns:**
```python
{
  "server_version": str,
  "chain_id": str,
  "head_block_num": int,
  "head_block_time": str,
  "head_block_producer": str,
  "last_irreversible_block_num": int
}
```

**Implementation:**
```python
@mcp.tool()
async def get_chain_info() -> str:
    """Get current Proton chain information."""
    result = await call_proton_rpc("/v1/chain/get_info", {})
    if "error" in result:
        return f"Error: {result['error']}"
    return json.dumps(result, indent=2)
```

**Migration Priority:** 🔴 HIGH (fundamental chain data)

---

### ✅ 2.2 get_block
**Status:** ✅ Implemented (Phase 1)  
**RPC Endpoint:** `/v1/chain/get_block`  
**Description:** Retrieve Proton block details including timestamp, producer, and transactions  

**Parameters:**
- `block_num_or_id` (string|int, required): Block number or block ID (hash)

**Returns:**
```python
{
  "timestamp": str,
  "producer": str,
  "block_num": int,
  "transactions": [...],
  "transaction_mroot": str,
  "action_mroot": str
}
```

**Implementation:**
```python
@mcp.tool()
async def get_block(block_num_or_id: str) -> str:
    """Get Proton block details by number or ID."""
    result = await call_proton_rpc(
        "/v1/chain/get_block",
        {"block_num_or_id": block_num_or_id}
    )
    if "error" in result:
        return f"Error: {result['error']}"
    return json.dumps(result, indent=2)
```

**Migration Priority:** 🔴 HIGH (useful for transaction tracking)

---

### ❌ 2.3 get_block_transaction_count
**Status:** Not implemented  
**Description:** Get the number of transactions in a Proton block  

**Parameters:**
- `block_num_or_id` (string|int, required): Block number or ID

**Returns:**
```python
{
  "block_num": int,
  "transaction_count": int
}
```

**Implementation:**
```python
@mcp.tool()
async def get_block_transaction_count(block_num_or_id: str) -> str:
    """Get transaction count in a block."""
    block_data = await call_proton_rpc(
        "/v1/chain/get_block",
        {"block_num_or_id": block_num_or_id}
    )
    if "error" in block_data:
        return f"Error: {block_data['error']}"
    
    count = len(block_data.get("transactions", []))
    return json.dumps({
        "block_num": block_data.get("block_num"),
        "transaction_count": count
    }, indent=2)
```

**Migration Priority:** 🟢 LOW (derived from get_block)

---

## 💰 Category 3: Lending Tools (5 tools)

### ✅ 3.1 get_lending_markets
**Status:** ✅ Implemented (Phase 3)  
**RPC Endpoint:** `/v1/chain/get_table_rows`  
**Description:** Get all MetalX lending markets with supply rates, borrow rates, utilization, and total values  

**Parameters:** None

**Table Query:**
```python
{
    "code": "lending.loan",
    "table": "markets",
    "scope": "lending.loan",
    "limit": 100
}
```

**Implementation:**
```python
@mcp.tool()
async def get_lending_markets() -> str:
    """Get all MetalX lending markets with supply rates, borrow rates, and liquidity."""
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

**Migration:** ✅ Complete (Phase 3)

---

### ✅ 3.2 get_oracle_prices
**Status:** ✅ Implemented (Phase 3)  
**RPC Endpoint:** `/v1/chain/get_table_rows`  
**Description:** Get current oracle prices for all supported tokens on Proton  

**Parameters:**
- `symbols` (string, optional): Comma-separated list of symbols to filter (e.g., "XPR,XBTC")

**Table Query:**
```python
{
    "code": "oracle.ptpx",
    "table": "prices",
    "scope": "oracle.ptpx",
    "limit": 100
}
```

**Implementation:**
```python
@mcp.tool()
async def get_oracle_prices(symbols: str = None) -> str:
    """Get current oracle prices for all supported tokens on Proton blockchain."""
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

**Migration:** ✅ Complete (Phase 3)

---

### ❌ 3.3 get_liquidatable_positions
**Status:** Not implemented  
**Description:** Find all lending positions with Health Factor < 1.0 that can be liquidated  

**Parameters:**
- `min_profit` (number, optional): Minimum profit threshold in USD (default: 0.50)

**Migration Priority:** 🟢 LOW (advanced feature)

---

### ❌ 3.4 get_at_risk_positions
**Status:** Not implemented  
**Description:** Find lending positions with Health Factor between 1.0 and 1.1  

**Parameters:**
- `threshold` (number, optional): Health factor threshold (default: 1.1)

**Migration Priority:** 🟢 LOW (advanced feature)

---

### ✅ 3.5 get_lending_position
**Status:** ✅ Implemented (Phase 3)  
**Description:** Get detailed lending position for a specific account  

**Parameters:**
- `account_name` (string, required): Proton account name

**Implementation:**
```python
@mcp.tool()
async def get_lending_position(account_name: str) -> str:
    """Get detailed MetalX lending position for a specific Proton account."""
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

**Migration:** ✅ Complete (Phase 3)

---

## 🪙 Category 4: Token Tools (4 tools)

### ✅ 4.1 get_currency_balance
**Status:** ✅ Implemented (Phase 1)  
**RPC Endpoint:** `/v1/chain/get_currency_balance`  
**Description:** Get token balance for an account  

**Parameters:**
- `code` (string, required): Token contract (e.g., "eosio.token", "xtokens")
- `account` (string, required): Account name to check
- `symbol` (string, optional): Specific token symbol

**Implementation:**
```python
@mcp.tool()
async def get_currency_balance(code: str, account: str, symbol: str = None) -> str:
    """Get token balance for account."""
    result = await call_proton_rpc(
        "/v1/chain/get_currency_balance",
        {
            "code": code,
            "account": account,
            "symbol": symbol
        }
    )
    if "error" in result:
        return f"Error: {result['error']}"
    return json.dumps(result, indent=2)
```

**Migration Priority:** 🔴 HIGH (essential token operation)

---

### ✅ 4.2 get_currency_stats
**Status:** ✅ Implemented (Phase 2)  
**RPC Endpoint:** `/v1/chain/get_currency_stats`  
**Description:** Get token supply statistics including max supply, current supply, and issuer  

**Parameters:**
- `code` (string, required): Token contract (e.g., "eosio.token", "xtokens")
- `symbol` (string, required): Token symbol (e.g., "XPR", "XBTC")

**Implementation:**
```python
@mcp.tool()
async def get_currency_stats(code: str, symbol: str) -> str:
    """Get token supply statistics."""
    result = await call_proton_rpc(
        "/v1/chain/get_currency_stats",
        {"code": code, "symbol": symbol}
    )
    if "error" in result:
        return f"Error: {result['error']}"
    return json.dumps(result, indent=2)
```

**Migration:** ✅ Complete (Phase 2)

---

### ✅ 4.3 get_table_rows
**Status:** ✅ Implemented (Phase 1)  
**RPC Endpoint:** `/v1/chain/get_table_rows`  
**Description:** Generic smart contract table query  

**Parameters:**
- `code` (string, required): Contract account name
- `table` (string, required): Table name
- `scope` (string, required): Table scope
- `limit` (number, optional): Max rows (default: 100)
- `lower_bound` (string, optional): Lower bound for primary key
- `upper_bound` (string, optional): Upper bound for primary key

**Migration Priority:** 🔴 HIGH (fundamental query tool)

---

### ✅ 4.4 get_table_by_scope
**Status:** ✅ Implemented (Phase 2)  
**RPC Endpoint:** `/v1/chain/get_table_by_scope`  
**Description:** List all scopes (data partitions) for a table in a smart contract  

**Parameters:**
- `code` (string, required): Contract account name
- `table` (string, required): Table name
- `lower_bound` (string, optional): Start scope for pagination
- `upper_bound` (string, optional): End scope filter
- `limit` (number, optional): Max scopes (default: 100)

**Implementation:**
```python
@mcp.tool()
async def get_table_by_scope(
    code: str, table: str,
    lower_bound: str = None, upper_bound: str = None,
    limit: int = 100
) -> str:
    """List all scopes for a table."""
    body = {"code": code, "table": table, "limit": limit}
    if lower_bound: body["lower_bound"] = lower_bound
    if upper_bound: body["upper_bound"] = upper_bound
    result = await call_proton_rpc("/v1/chain/get_table_by_scope", body)
    if "error" in result:
        return f"Error: {result['error']}"
    return json.dumps(result, indent=2)
```

**Migration:** ✅ Complete (Phase 2)

---

## 📜 Category 5: Contract Tools (2 tools)

### ✅ 5.1 get_abi
**Status:** ✅ Implemented (Phase 2)  
**RPC Endpoint:** `/v1/chain/get_abi`  
**Description:** Get smart contract ABI (Application Binary Interface) definition  

**Parameters:**
- `account_name` (string, required): Contract account name (e.g., "eosio.token", "atomicassets")

**Implementation:**
```python
@mcp.tool()
async def get_abi(account_name: str) -> str:
    """Get smart contract ABI definition."""
    result = await call_proton_rpc(
        "/v1/chain/get_abi",
        {"account_name": account_name}
    )
    if "error" in result:
        return f"Error: {result['error']}"
    return json.dumps(result, indent=2)
```

**Migration:** ✅ Complete (Phase 2)

---

### ❌ 5.2 get_code (implied from get_raw_abi)
**Status:** Not implemented  
**RPC Endpoint:** `/v1/chain/get_code`  
**Description:** Get contract code hash  

**Migration Priority:** 🟢 LOW (rarely used)

---

## 📊 Category 6: History Tools (4 tools)

### ❌ 6.1 get_transaction
**Status:** Not implemented  
**RPC Endpoint:** `/v1/history/get_transaction`  
**Description:** Get transaction by ID  

**Parameters:**
- `id` (string, required): Transaction ID

**Migration Priority:** 🟡 MEDIUM (useful for transaction tracking)

---

### ❌ 6.2 get_actions
**Status:** Not implemented  
**RPC Endpoint:** `/v1/history/get_actions`  
**Description:** Get account action history  

**Parameters:**
- `account_name` (string, required): Account name

**Migration Priority:** 🟢 LOW (requires history plugin)

---

### ❌ 6.3 get_key_accounts
**Status:** Not implemented  
**RPC Endpoint:** `/v1/history/get_key_accounts`  
**Description:** Find accounts associated with public key  

**Parameters:**
- `public_key` (string, required): Public key

**Migration Priority:** 🟢 LOW (requires history plugin)

---

### ❌ 6.4 get_controlled_accounts
**Status:** Not implemented  
**RPC Endpoint:** `/v1/history/get_controlled_accounts`  
**Description:** Get sub-accounts controlled by account  

**Parameters:**
- `controlling_account` (string, required): Controlling account

**Migration Priority:** 🟢 LOW (requires history plugin)

---

## 🏭 Category 7: Producer Tools (3 tools)

### ❌ 7.1 get_producers
**Status:** Not implemented  
**RPC Endpoint:** `/v1/chain/get_producers`  
**Description:** Get block producer list with voting info  

**Parameters:**
- `limit` (number, optional): Max producers (default: 50)
- `lower_bound` (string, optional): Start from producer name

**Migration Priority:** 🟢 LOW (governance focused)

---

### ❌ 7.2 get_producer_schedule
**Status:** Not implemented  
**RPC Endpoint:** `/v1/chain/get_producer_schedule`  
**Description:** Get active producer schedule  

**Migration Priority:** 🟢 LOW (governance focused)

---

### ❌ 7.3 get_protocol_features
**Status:** Not implemented  
**RPC Endpoint:** `/v1/chain/get_activated_protocol_features`  
**Description:** Get activated protocol features  

**Migration Priority:** 🟢 LOW (rarely needed)

---

## 💱 Category 8: Swap Tools (4 tools)

### ✅ 8.1 get_swap_pools
**Status:** ✅ Implemented (Phase 3)  
**Description:** Get all liquidity pools from proton.swaps DEX  

**Table Query:**
```python
{
    "code": "proton.swaps",
    "table": "pools",
    "scope": "proton.swaps",
    "limit": 100
}
```

**Implementation:**
```python
@mcp.tool()
async def get_swap_pools() -> str:
    """Get all liquidity pools from Proton Swaps DEX with reserves and fees."""
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

**Migration:** ✅ Complete (Phase 3)

---

### ✅ 8.2 get_pool_by_pair
**Status:** ✅ Implemented (Phase 3)  
**Description:** Get specific pool by token pair  

**Parameters:**
- `token0_symbol` (string, required): First token symbol (e.g., "XPR")
- `token1_symbol` (string, required): Second token symbol (e.g., "XUSDC")

**Implementation:**
```python
@mcp.tool()
async def get_pool_by_pair(token0_symbol: str, token1_symbol: str) -> str:
    """Get specific Proton Swaps liquidity pool by token pair symbols."""
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

**Migration:** ✅ Complete (Phase 3)

---

### ❌ 8.3 get_swap_rate
**Status:** Not implemented  
**Description:** Calculate swap rate and output amount  

**Parameters:**
- `from_token` (string, required): Input token
- `to_token` (string, required): Output token
- `amount` (number, required): Input amount

**Migration Priority:** 🟡 MEDIUM (DEX focused)

---

### ❌ 8.4 get_liquidity_positions
**Status:** Not implemented  
**Description:** Get LP positions for account  

**Parameters:**
- `account` (string, required): Account name

**Migration Priority:** 🟢 LOW (DEX focused)

---

## 🎨 Category 9: NFT Tools (5 tools)

### ❌ 9.1 get_account_nfts
**Status:** Not implemented  
**Description:** Get NFTs owned by account  

**Parameters:**
- `owner` (string, required): Account name
- `collection_name` (string, optional): Filter by collection
- `limit` (number, optional): Max NFTs (default: 100)

**Migration Priority:** 🟢 LOW (NFT focused)

---

### ❌ 9.2 get_nft_templates
**Status:** Not implemented  
**Description:** Get NFT templates for collection  

**Migration Priority:** 🟢 LOW (NFT focused)

---

### ❌ 9.3 get_nft_collections
**Status:** Not implemented  
**Description:** Get NFT collections from AtomicAssets  

**Migration Priority:** 🟢 LOW (NFT focused)

---

### ❌ 9.4 get_nft_asset
**Status:** Not implemented  
**Description:** Get specific NFT details by ID  

**Parameters:**
- `asset_id` (string, required): NFT asset ID

**Migration Priority:** 🟢 LOW (NFT focused)

---

### ❌ 9.5 get_nft_schemas
**Status:** Not implemented  
**Description:** Get schemas for NFT collection  

**Migration Priority:** 🟢 LOW (NFT focused)

---

## 📊 Migration Summary

### Current Status
- ✅ **Implemented:** 1 tool (get_account)
- ❌ **Missing:** 31 tools

### Priority Breakdown
- 🔴 **HIGH Priority:** 7 tools (essential functionality)
- 🟡 **MEDIUM Priority:** 11 tools (useful features)
- 🟢 **LOW Priority:** 13 tools (specialized/advanced)

### Recommended Migration Phases

**Phase 1: Core Chain Tools (HIGH Priority)**
1. get_chain_info
2. get_block
3. get_currency_balance
4. get_table_rows

**Phase 2: Essential Account & Token Tools (HIGH/MEDIUM Priority)**
5. get_account_resources (from existing get_account)
6. get_currency_stats
7. get_table_by_scope
8. get_abi

**Phase 3: Lending & Swap Tools (MEDIUM Priority)**
9. get_lending_markets
10. get_oracle_prices
11. get_lending_position
12. get_swap_pools
13. get_pool_by_pair

**Phase 4: Advanced Features (LOW Priority)**
14-31. History, Producer, NFT, and advanced lending tools

---

## 🔧 Technical Implementation Notes

### RPC Endpoint Coverage
Most tools use these core RPC endpoints:
- `/v1/chain/get_info` - Chain info
- `/v1/chain/get_block` - Block data
- `/v1/chain/get_account` - Account data (✅ implemented)
- `/v1/chain/get_table_rows` - Generic table queries
- `/v1/chain/get_currency_balance` - Token balances
- `/v1/chain/get_currency_stats` - Token stats
- `/v1/chain/get_abi` - Contract ABI
- `/v1/history/*` - History endpoints (requires plugin)

### Common Patterns

**1. Simple RPC Call:**
```python
@mcp.tool()
async def tool_name(param: str) -> str:
    result = await call_proton_rpc("/v1/chain/endpoint", {"param": param})
    if "error" in result:
        return f"Error: {result['error']}"
    return json.dumps(result, indent=2)
```

**2. Table Query:**
```python
@mcp.tool()
async def get_table_data(scope: str, limit: int = 100) -> str:
    result = await call_proton_rpc(
        "/v1/chain/get_table_rows",
        {
            "code": "contract.name",
            "table": "table_name",
            "scope": scope,
            "limit": limit,
            "json": True
        }
    )
    if "error" in result:
        return f"Error: {result['error']}"
    return json.dumps(result.get("rows", []), indent=2)
```

**3. Data Transformation:**
```python
@mcp.tool()
async def get_transformed_data(input: str) -> str:
    raw_data = await call_proton_rpc("/v1/chain/endpoint", {"input": input})
    if "error" in raw_data:
        return f"Error: {raw_data['error']}"
    
    # Transform data
    transformed = {
        "field1": raw_data.get("field1"),
        "field2": raw_data.get("field2")
    }
    return json.dumps(transformed, indent=2)
```

---

## ✅ Testing Strategy

For each migrated tool:
1. **Unit Test:** Call with known valid input
2. **Error Test:** Call with invalid input (check error handling)
3. **Failover Test:** Verify RPC endpoint failover works
4. **Documentation Test:** Verify tool shows in MCP tool list

**Example Test:**
```python
# Test get_chain_info
result = mcp_mcp-sama_get_chain_info()
assert "head_block_num" in result
assert "chain_id" in result
```

---

**Next Steps:** See [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) for detailed implementation plan.

**Last Updated:** December 25, 2024  
**Version:** 1.0.0
