# Sequential Tool Usage Guide

**Updated:** December 26, 2025  
**Version:** Phase 4B-Partial (27 tools)

## Overview

Many MCP tools require calling other tools **FIRST** to gather necessary input parameters. This guide shows common tool chains and workflows for AI agents.

---

## 🔄 Common Sequential Workflows

### 1. User Balance Check
**Goal:** Verify account has sufficient tokens

```
Step 1: get_account("username")
        ↓ Verify account exists
Step 2: get_currency_balance("eosio.token", "username", "XPR")
        ↓ Get XPR balance
Result: "1234.5678 XPR"
```

**Use Case:** Before executing swaps or transfers

---

### 2. Swap Preview
**Goal:** Calculate expected swap output

```
Step 1: get_swap_pools()
        ↓ List all available trading pairs
Step 2: get_currency_balance("eosio.token", "user", "XPR")
        ↓ Verify user has tokens to swap
Step 3: get_swap_rate("XPR", "XUSDC", 1000.0)
        ↓ Calculate swap output (internal: calls get_pool_by_pair())
Result: Output amount, price impact, fees
```

**Use Case:** Trading interfaces, swap calculators

---

### 3. Lending Position Analysis
**Goal:** Monitor user's DeFi health

```
Step 1: get_account("username")
        ↓ Verify account exists
Step 2: get_lending_position("username")
        ↓ Get supplied/borrowed assets, health factor
Step 3: get_oracle_prices()
        ↓ Get current token prices for USD values
Result: Complete position with risk assessment
```

**Use Case:** Portfolio dashboards, risk monitoring

---

### 4. Liquidation Bot
**Goal:** Find and liquidate underwater positions

```
Step 1: get_oracle_prices()
        ↓ Get current token prices
Step 2: get_lending_markets()
        ↓ Understand market conditions
Step 3: get_liquidatable_positions(min_profit=10.0)
        ↓ Find underwater positions (internal: scans all scopes)
Step 4: For each liquidatable account:
        get_lending_position(account)
        ↓ Get detailed position
Step 5: get_currency_balance("xtokens", "liquidator", "XUSDC")
        ↓ Verify liquidator has repayment tokens
Result: Liquidation opportunities with profit estimates
```

**Use Case:** MEV bots, protocol protection

---

### 5. LP Portfolio Analysis
**Goal:** Calculate liquidity provider positions and value

```
Step 1: get_account("username")
        ↓ Verify account exists
Step 2: get_swap_pools()
        ↓ See all available pools
Step 3: get_liquidity_positions("username")
        ↓ Get user's LP token balances
Step 4: For each position:
        get_pool_by_pair(token0, token1)
        ↓ Get current pool reserves
Step 5: get_oracle_prices()
        ↓ Get USD values
Result: Total portfolio value, impermanent loss calculation
```

**Use Case:** LP dashboards, yield tracking

---

### 6. Arbitrage Opportunity Scanner
**Goal:** Find price discrepancies between DEX and oracle

```
Step 1: get_oracle_prices()
        ↓ Get centralized exchange prices
Step 2: get_swap_pools()
        ↓ Get all DEX pools
Step 3: For each pool:
        get_pool_by_pair(token0, token1)
        ↓ Calculate DEX price
Step 4: Compare oracle_price vs dex_price
        ↓ Find arbitrage opportunities
Result: Profitable arbitrage trades
```

**Use Case:** Trading bots, arbitrage scanners

---

### 7. Transaction Verification
**Goal:** Verify transaction was included in blockchain

```
Step 1: get_transaction("abc123...")
        ↓ Get transaction details and block number
Step 2: get_block(block_num)
        ↓ Verify block exists and contains transaction
Result: Transaction confirmation with block metadata
```

**Use Case:** Payment verification, transaction tracking

---

### 8. Complete Account Investigation
**Goal:** Full account audit

```
Step 1: get_account("username")
        ↓ Basic account info, RAM, CPU, NET
Step 2: get_actions("username", limit=50)
        ↓ Recent transaction history
Step 3: get_currency_balance("eosio.token", "username")
        ↓ XPR balance
Step 4: get_currency_balance("xtokens", "username")
        ↓ All wrapped token balances
Step 5: get_lending_position("username")
        ↓ DeFi positions
Step 6: get_liquidity_positions("username")
        ↓ LP positions
Step 7: get_oracle_prices()
        ↓ Calculate total USD value
Result: Complete account portfolio and activity
```

**Use Case:** Account audits, portfolio management

---

## 🔗 Internal Dependencies

Some tools **automatically** call other tools internally. No manual chaining needed:

| Tool | Internal Dependency | Why |
|------|-------------------|-----|
| `get_swap_rate()` | Calls `get_pool_by_pair()` | Needs pool reserves for AMM calculation |
| `get_liquidatable_positions()` | Scans all lending scopes | Iterates through all accounts |
| `get_at_risk_positions()` | Scans all lending scopes | Iterates through all accounts |

**Important:** Don't call these internal dependencies manually before the main tool.

---

## ✅ Input Validation Best Practices

Always validate inputs before expensive operations:

### 1. Verify Account Exists
```
❌ BAD:  get_lending_position("typo_account")
✅ GOOD: get_account("username") → then get_lending_position("username")
```

### 2. Verify Pool Exists
```
❌ BAD:  get_swap_rate("XPR", "INVALIDTOKEN", 1000)
✅ GOOD: get_swap_pools() → verify pair exists → get_swap_rate()
```

### 3. Get Current Prices for DeFi
```
❌ BAD:  get_liquidatable_positions() with outdated price assumptions
✅ GOOD: get_oracle_prices() → understand current market → get_liquidatable_positions()
```

---

## 🎯 Tool Categories by Usage Pattern

### Discovery Tools (Call First)
- `get_account()` - Verify accounts
- `get_swap_pools()` - List pools
- `get_lending_markets()` - List markets
- `get_oracle_prices()` - Get prices
- `get_producers()` - List validators

### Query Tools (Need Discovery First)
- `get_currency_balance()` - Needs account verification
- `get_lending_position()` - Needs account verification
- `get_liquidity_positions()` - Needs account verification
- `get_pool_by_pair()` - Needs token symbols from pools
- `get_swap_rate()` - Needs token symbols from pools

### Scan Tools (Expensive, Call Last)
- `get_liquidatable_positions()` - Scans all lending positions (10-30s)
- `get_at_risk_positions()` - Scans all lending positions (10-30s)
- `get_actions()` - Can return many results

---

## 📝 Real-World Examples

### Example 1: User Wants to Swap 1000 XPR to XUSDC

```python
# Step 1: Verify account and balance
account = get_account("trader")
balance = get_currency_balance("eosio.token", "trader", "XPR")
# Result: ["5000.0000 XPR"]

# Step 2: Check if pool exists and get swap preview
pools = get_swap_pools()
# Verify XPR/XUSDC pool exists

swap = get_swap_rate("XPR", "XUSDC", 1000.0)
# Result: {
#   "output_amount": 2.72,
#   "price_impact": 0.05,
#   "fee": 3.0
# }

# Step 3: Execute swap (external to MCP)
```

### Example 2: Find Liquidatable Positions

```python
# Step 1: Get market context
prices = get_oracle_prices()
markets = get_lending_markets()

# Step 2: Find underwater positions
liquidatable = get_liquidatable_positions(min_profit=5.0)
# Result: [{
#   "account": "underwater",
#   "health_factor": 0.92,
#   "profit_estimate": 15.50
# }]

# Step 3: Get detailed position
position = get_lending_position("underwater")
# Result: Full position with all assets

# Step 4: Execute liquidation (external to MCP)
```

### Example 3: Portfolio Dashboard

```python
# Step 1: Verify account
account = get_account("investor")

# Step 2: Get all balances
xpr = get_currency_balance("eosio.token", "investor")
wrapped = get_currency_balance("xtokens", "investor")

# Step 3: Get DeFi positions
lending = get_lending_position("investor")
lp = get_liquidity_positions("investor")

# Step 4: Get prices for USD conversion
prices = get_oracle_prices()

# Step 5: Calculate total portfolio value
# (Combine all data)
```

---

## 🚀 Quick Reference Table

| If You Want To... | Call These Tools In Order |
|------------------|---------------------------|
| Check balance | `get_account()` → `get_currency_balance()` |
| Preview swap | `get_swap_pools()` → `get_swap_rate()` |
| Check lending health | `get_lending_position()` → `get_oracle_prices()` |
| Find liquidations | `get_oracle_prices()` → `get_liquidatable_positions()` |
| Analyze LP positions | `get_swap_pools()` → `get_liquidity_positions()` |
| Verify transaction | `get_transaction()` → `get_block()` |
| Full account audit | `get_account()` → `get_actions()` → all balance/position tools |

---

## 📚 Additional Resources

- [API_REFERENCE.md](./API_REFERENCE.md) - Full tool documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [CURRENT_STATUS.md](./CURRENT_STATUS.md) - Project status
- Server: https://YOUR-FUNCTION-APP.azurewebsites.net/

---

**Last Updated:** December 26, 2025  
**Tool Count:** 27 tools deployed  
**Progress:** 81.3% (26/32 blockchain tools)
