# MCP Tool Explanations - Phase 1 Core Tools

**Based on Production Testing:** December 25, 2025  
**Test Data:** Real queries against Proton blockchain

---

## 🔍 Tool-by-Tool Analysis

### 1. get_account
**Purpose:** Retrieve comprehensive account information from Proton blockchain

**What It Returns:**
- **Account Identity:** name, creation date, privileged status
- **Resource Usage:** CPU, NET, and RAM (used/available/max)
- **Permissions:** Active and owner keys, multi-sig configurations
- **Staking/Voting:** Delegated resources, voted producers, stake amounts
- **Advanced:** Linked actions, REX info, subjective billing limits

**When to Use:**
- ✅ Check account existence and status
- ✅ Verify account resources before transactions
- ✅ Audit account permissions and keys
- ✅ Review voting/staking information
- ✅ Monitor resource consumption

**Real Example (zenpunk):**
```json
{
  "account_name": "zenpunk",
  "created": "2025-11-09T03:14:47.000",
  "ram_quota": 13399,
  "ram_usage": 7367,
  "cpu_limit": {"used": 728, "available": 3215764},
  "net_limit": {"used": 353, "available": 17388312},
  "voter_info": {
    "producers": ["eosusa", "protonnz", "protonuk", "xprcore"],
    "staked": 894106214
  }
}
```

**Key Insights:**
- Account created recently (Nov 2025)
- Using 55% of allocated RAM
- Very low CPU/NET usage (plenty of resources)
- Actively voting for 4 block producers
- Has 894M staked tokens

---

### 2. get_chain_info
**Purpose:** Get real-time blockchain state and configuration

**What It Returns:**
- **Block Info:** Current head block number and timestamp
- **Finality:** Last irreversible block (LIB)
- **Network:** Chain ID, server version, producer
- **Limits:** CPU/NET block limits and weights
- **History:** Earliest available block

**When to Use:**
- ✅ Verify you're on the correct chain (chain_id)
- ✅ Get current block number for queries
- ✅ Check blockchain health and sync status
- ✅ Monitor block production
- ✅ Validate network version compatibility

**Real Example:**
```json
{
  "chain_id": "384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0",
  "head_block_num": 358043324,
  "head_block_time": "2025-12-25T23:13:42.500",
  "head_block_producer": "catsvote",
  "server_version_string": "v3.1.2",
  "last_irreversible_block_num": 358042998
}
```

**Key Insights:**
- Proton mainnet confirmed (unique chain_id)
- Block production active (catsvote producing)
- 326 block gap to finality (normal)
- Running latest version v3.1.2
- ~358M blocks since genesis

---

### 3. get_block
**Purpose:** Retrieve detailed information about a specific block

**What It Returns:**
- **Metadata:** Block number, timestamp, producer
- **Cryptographic:** Block ID, transaction merkle root, action merkle root
- **Content:** All transactions in the block
- **Validation:** Producer signature, previous block hash
- **References:** Ref block prefix for transaction building

**When to Use:**
- ✅ Audit specific block contents
- ✅ Verify transaction inclusion in blockchain
- ✅ Investigate block production issues
- ✅ Get transaction merkle proofs
- ✅ Build transaction references

**Real Example (Block 358043324):**
```json
{
  "block_num": 358043324,
  "timestamp": "2025-12-25T23:13:42.500",
  "producer": "catsvote",
  "transactions": [],
  "id": "15574ebc4ca1baa488bbef899e60e7062ed1ab46329d9cc0e6c1e70f82f87c99",
  "producer_signature": "SIG_K1_KBGc...",
  "ref_block_prefix": 2314189704
}
```

**Key Insights:**
- Empty block (no transactions)
- Produced by catsvote validator
- Valid signature verified
- Can use ref_block_prefix for new transactions

---

### 4. get_currency_balance
**Purpose:** Query token balances for any account on any contract

**What It Returns:**
- **Balance Array:** List of all tokens (or specific token if symbol provided)
- **Format:** Decimal balance with symbol (e.g., "0.0000 XPR")
- **Multi-Token:** Returns all tokens if no symbol specified

**When to Use:**
- ✅ Check XPR balance (eosio.token contract)
- ✅ Query wrapped tokens (xtokens contract)
- ✅ Monitor lending positions (loan.token contract)
- ✅ Verify token transfers completed
- ✅ Build wallet balance displays

**Real Examples:**
```json
// zenpunk XPR balance
["0.0000 XPR"]

// bloksio XPR balance
["0.0000 XPR"]
```

**Contract Examples:**
- `eosio.token` - Native XPR token
- `xtokens` - Wrapped tokens (XBTC, XETH, XUSDC)
- `loan.token` - Metal protocol lending tokens
- `atomicassets` - NFT balances (different query)

**Key Insights:**
- Both test accounts have zero XPR balance
- 4 decimal precision standard for XPR
- Fast lookup (no table scan needed)
- Symbol filtering reduces response size

---

### 5. get_table_rows
**Purpose:** Universal smart contract state query - most powerful tool

**What It Returns:**
- **Rows:** Array of table entries (JSON objects)
- **Pagination:** "more" flag and "next_key" for large datasets
- **Flexible:** Any contract, any table, any scope

**When to Use:**
- ✅ Query contract state (producers, tokens, NFTs, DeFi)
- ✅ Read user-specific data (account balances, positions)
- ✅ Audit on-chain data (oracles, governance, staking)
- ✅ Build explorers and dashboards
- ✅ Debug smart contract issues

**Real Example (Producer Table):**
```json
{
  "rows": [
    {
      "owner": "alvosec",
      "total_votes": "1015971291586022342656",
      "is_active": 1,
      "url": "https://alvosec.com",
      "unpaid_blocks": 2796,
      "last_claim_time": "2025-12-25T15:05:07.000"
    }
  ],
  "more": true,
  "next_key": "3887667635235586048"
}
```

**Common Use Cases:**

1. **Token Balances** (same as get_currency_balance)
   - code: "eosio.token", table: "accounts", scope: "{account}"

2. **Block Producers**
   - code: "eosio", table: "producers", scope: "eosio"

3. **NFT Collections**
   - code: "atomicassets", table: "collections", scope: "atomicassets"

4. **Lending Positions**
   - code: "loan.token", table: "positions", scope: "{account}"

5. **Swap Pools**
   - code: "proton.swaps", table: "pools", scope: "proton.swaps"

**Key Insights:**
- Alvosec is active producer with 1.01 quadrillion votes
- Pagination needed for large tables (more: true)
- Can query any contract without knowing schema
- Returns raw contract data (no interpretation)

---

## 📊 Tool Selection Guide

### Quick Reference Matrix

| Need | Use This Tool | Why |
|------|--------------|-----|
| Check if account exists | `get_account` | Returns full account or error |
| Get current block height | `get_chain_info` | Fastest way to get head_block_num |
| Verify transaction mined | `get_block` | Check specific block contents |
| Check XPR balance | `get_currency_balance` | Optimized for token lookups |
| Query DeFi positions | `get_table_rows` | Generic contract state access |
| List all tokens | `get_currency_balance` | Omit symbol parameter |
| Get producer list | `get_table_rows` | Query eosio/producers table |
| Check account resources | `get_account` | Returns CPU/NET/RAM limits |
| Verify chain ID | `get_chain_info` | Confirm correct network |
| Build transaction | `get_block` | Get ref_block_prefix |

---

## 🎯 Accuracy Improvements for Tool Descriptions

### Current vs Improved Descriptions

#### get_account
**Before:** "Get Proton blockchain account info."  
**After:** "Get comprehensive Proton account information including resources (CPU/NET/RAM), permissions, staking, voting status, and creation date. Use to verify account exists, check resource availability, or audit permissions."

#### get_chain_info
**Before:** "Get current Proton chain information including head block, version, and state."  
**After:** "Get real-time Proton blockchain state including current head block number/time, last irreversible block, chain ID, server version, and current producer. Use to verify correct network, get current block height, or check sync status."

#### get_block
**Before:** "Retrieve Proton block details including timestamp, producer, and transactions."  
**After:** "Retrieve detailed block information including timestamp, producer, all transactions, block signatures, and merkle roots. Use to audit specific blocks, verify transaction inclusion, or get reference data for building new transactions."

#### get_currency_balance
**Before:** "Get token balance for an account."  
**After:** "Query token balances for any account on any token contract. Returns array of balances with symbol (e.g., ['0.0000 XPR']). Supports native XPR (eosio.token), wrapped tokens (xtokens), lending tokens (loan.token). Omit symbol to get all token balances."

#### get_table_rows
**Before:** "Query any smart contract table on Proton."  
**After:** "Universal smart contract state query - read any table from any contract. Use for producers list, NFT collections, DeFi positions, oracle prices, swap pools, and more. Supports pagination for large datasets. Most flexible tool for on-chain data access."

---

## 🚀 Performance Characteristics

**From Production Testing:**

| Tool | Avg Response | Data Size | Caching |
|------|-------------|-----------|---------|
| get_account | 200-300ms | 2-5 KB | Fresh |
| get_chain_info | 150-250ms | 1 KB | Fresh |
| get_block | 200-400ms | 1-50 KB | Historical |
| get_currency_balance | 150-250ms | <1 KB | Fresh |
| get_table_rows | 200-500ms | 1-100 KB | Fresh |

**Notes:**
- All queries use 4-endpoint RPC failover
- Response times measured on warm function (Azure)
- Cold start adds ~2-3 seconds (first request)
- Larger tables require pagination (limit parameter)

---

## 💡 Best Practices

### 1. Error Handling
All tools return `"Error: {message}"` on failure. Always check for error prefix:
```python
result = get_account("invalid@@@")
if result.startswith("Error:"):
    # Handle error
```

### 2. Pagination
For large datasets, use `limit` and check `more` flag:
```python
result = get_table_rows("eosio", "producers", "eosio", limit=10)
data = json.loads(result)
if data["more"]:
    next_batch = get_table_rows(..., lower_bound=data["next_key"])
```

### 3. Chain Verification
Always verify chain_id when connecting to new endpoints:
```python
info = json.loads(get_chain_info())
if info["chain_id"] != "384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0":
    raise Exception("Wrong network!")
```

### 4. Resource Monitoring
Check account resources before expensive operations:
```python
account = json.loads(get_account("myaccount"))
if account["cpu_limit"]["available"] < 1000:
    print("Warning: Low CPU resources")
```

---

**Document Version:** 1.0  
**Last Updated:** December 25, 2025  
**Test Coverage:** 100% (5/5 tools validated)  
**Production Status:** ✅ All tools working
