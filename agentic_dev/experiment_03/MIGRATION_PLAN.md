# Migration Plan: Experiment 01 → Experiment 04

**Goal:** Migrate 32 MCP tools from TypeScript/Node.js (experiment_01) to Python/FastMCP/Azure Functions (experiment_04)

**Strategy:** Iterative migration with testing after each phase

---

## 📋 Overview

### Source (Experiment 01)
- **Platform:** Node.js/TypeScript
- **Framework:** Express + MCP SDK
- **Tools:** 32 tools across 10 categories
- **Deployment:** Local only
- **Status:** Working, well-tested

### Target (Experiment 04)
- **Platform:** Python 3.12
- **Framework:** FastMCP on Azure Functions
- **Tools:** 1 tool (get_account) ✅
- **Deployment:** Production (Azure)
- **Status:** Working with RPC failover

### Migration Challenges
1. **Language Change:** TypeScript → Python
2. **Framework Change:** Express/MCP SDK → FastMCP
3. **Architecture Change:** Synchronous → Async
4. **Testing:** Must validate each tool after migration

---

## 🎯 Migration Phases

### Phase 1: Core Chain Tools (4 tools) 🔴 HIGH ✅
**Timeline:** Day 1  
**Goal:** Essential blockchain queries  
**Status:** COMPLETE

| Tool | RPC Endpoint | Complexity | Status |
|------|-------------|-----------|--------|
| get_chain_info | `/v1/chain/get_info` | Low | ✅ Complete |
| get_block | `/v1/chain/get_block` | Low | ✅ Complete |
| get_currency_balance | `/v1/chain/get_currency_balance` | Low | ✅ Complete |
| get_table_rows | `/v1/chain/get_table_rows` | Medium | ✅ Complete |

**Success Criteria:**
- [x] All 4 tools implemented
- [ ] All 4 tools tested with valid input (pending MCP client refresh)
- [x] Error handling validated
- [x] RPC failover tested
- [x] Documentation updated

**Testing Commands:**
```python
# Test get_chain_info
mcp_mcp-sama_get_chain_info()

# Test get_block
mcp_mcp-sama_get_block("358030000")

# Test get_currency_balance
mcp_mcp-sama_get_currency_balance("eosio.token", "zenpunk", "XPR")

# Test get_table_rows
mcp_mcp-sama_get_table_rows("eosio.token", "accounts", "zenpunk")
```

---

### Phase 2: Account & Token Tools (4 tools) 🟡 MEDIUM ✅
**Timeline:** Day 2  
**Goal:** Complete token operations  
**Status:** COMPLETE

| Tool | RPC Endpoint | Complexity | Status |
|------|-------------|-----------|--------|
| get_account_resources | Derived from get_account | Low | ✅ Complete |
| get_currency_stats | `/v1/chain/get_currency_stats` | Low | ✅ Complete |
| get_table_by_scope | `/v1/chain/get_table_by_scope` | Low | ✅ Complete |
| get_abi | `/v1/chain/get_abi` | Low | ✅ Complete |

**Success Criteria:**
- [x] All 4 tools implemented
- [ ] Integration with Phase 1 tools tested (pending MCP client refresh)
- [x] Documentation updated
- [x] CHANGES.md updated

**Testing Commands:**
```python
# Test get_account_resources
mcp_mcp-sama_get_account_resources("zenpunk")

# Test get_currency_stats
mcp_mcp-sama_get_currency_stats("eosio.token", "XPR")

# Test get_table_by_scope
mcp_mcp-sama_get_table_by_scope("eosio.token", "accounts", limit=5)

# Test get_abi
mcp_mcp-sama_get_abi("eosio.token")
```

---

### Phase 3: Lending & Swap Tools (5 tools) 🟡 MEDIUM ✅
**Timeline:** Day 3  
**Goal:** DeFi protocol support  
**Status:** COMPLETE

| Tool | Table/Endpoint | Complexity | Status |
|------|----------------|-----------|--------|
| get_lending_markets | lending.loan/markets | Medium | ✅ Complete |
| get_oracle_prices | oracle.ptpx/prices | Medium | ✅ Complete |
| get_lending_position | lending.loan/positions | Medium | ✅ Complete |
| get_swap_pools | proton.swaps/pools | Medium | ✅ Complete |
| get_pool_by_pair | Filtered query | Medium | ✅ Complete |

**Success Criteria:**
- [x] All 5 tools implemented
- [ ] Real lending data tested (pending MCP client refresh)
- [ ] Real swap data tested (pending MCP client refresh)
- [x] Performance validated (1m 20s deployment)
- [x] Documentation updated
- [x] CHANGES.md updated

**Testing Commands:**
```python
# Test get_lending_markets
mcp_mcp-sama_get_lending_markets()

# Test get_oracle_prices (all)
mcp_mcp-sama_get_oracle_prices()

# Test get_oracle_prices (filtered)
mcp_mcp-sama_get_oracle_prices("XPR,XBTC")

# Test get_lending_position
mcp_mcp-sama_get_lending_position("zenpunk")

# Test get_swap_pools
mcp_mcp-sama_get_swap_pools()

# Test get_pool_by_pair
mcp_mcp-sama_get_pool_by_pair("XPR", "XUSDC")
```

---

### Phase 4: Advanced Features (18 tools) 🟢 LOW
**Timeline:** Day 4-5  
**Goal:** Complete feature parity

**Subgroups:**
1. **Block Transaction Count** (1 tool)
2. **Swap Rate Calculation** (1 tool)
3. **History Tools** (4 tools) - Requires history API
4. **Producer Tools** (3 tools)
5. **NFT Tools** (5 tools)
6. **Advanced Lending** (2 tools - liquidatable/at-risk positions)
7. **Liquidity Positions** (1 tool)
8. **Contract Code** (1 tool)

---

## 🔧 Implementation Template

### Step-by-Step for Each Tool

**1. Analyze TypeScript Implementation**
```bash
# Read the original tool
cat /workspaces/XPR/agentic_dev/experiment_01/src/tools/<category>-tools.ts
```

**2. Create Python Implementation**
```python
# File: /workspaces/XPR/agentic_dev/experiment_04/mcp-server/server.py

@mcp.tool()
async def tool_name(param1: str, param2: int = 100) -> str:
    """
    Tool description from TypeScript version.
    
    Args:
        param1: Parameter description
        param2: Parameter description with default
    """
    result = await call_proton_rpc(
        "/v1/chain/endpoint",
        {
            "param1": param1,
            "param2": param2
        }
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)
```

**3. Deploy to Azure**
```bash
cd /workspaces/XPR/agentic_dev/experiment_04/mcp-server
azd deploy --no-prompt
```

**4. Test the Tool**
```python
# Via MCP client
mcp_mcp-sama_tool_name("test_input", 50)
```

**5. Document in CHANGES.md**
```markdown
#### Change #XXX: Add tool_name
**Status:** Complete ✅
**Type:** Feature Addition
**Files:** server.py

**Implementation:**
- Added tool_name MCP tool
- RPC endpoint: /v1/chain/endpoint
- Tested with: [test cases]

**Testing:**
```python
mcp_mcp-sama_tool_name("input")
# Result: [expected output]
```
```

**6. Update EXPERIMENT_01_TOOLS_INVENTORY.md**
- Change status from ❌ to ✅
- Add implementation notes

---

## 📊 Progress Tracking

### Phase 1: Core Chain Tools ✅
- [x] get_chain_info
- [x] get_block
- [x] get_currency_balance
- [x] get_table_rows

### Phase 2: Account & Token Tools ✅
- [x] get_account_resources
- [x] get_currency_stats
- [x] get_table_by_scope
- [x] get_abi

### Phase 3: Lending & Swap Tools ✅
- [x] get_lending_markets
- [x] get_oracle_prices
- [x] get_lending_position
- [x] get_swap_pools
- [x] get_pool_by_pair

### Phase 4: Advanced Features ⏳
- [ ] get_block_transaction_count
- [ ] get_swap_rate
- [ ] get_transaction
- [ ] get_actions
- [ ] get_key_accounts
- [ ] get_controlled_accounts
- [ ] get_producers
- [ ] get_producer_schedule
- [ ] get_protocol_features
- [ ] get_account_nfts
- [ ] get_nft_templates
- [ ] get_nft_collections
- [ ] get_nft_asset
- [ ] get_nft_schemas
- [ ] get_liquidatable_positions
- [ ] get_at_risk_positions
- [ ] get_liquidity_positions
- [ ] get_code

**Total Progress:** 14/32 tools (43.8%)

> 💡 See [PROGRESS_METRICS.md](./PROGRESS_METRICS.md) for detailed progress dashboard

---

## 🧪 Testing Strategy

### 1. Unit Testing (Per Tool)
```python
# Test valid input
result = mcp_mcp-sama_tool_name("valid_input")
assert "expected_field" in result

# Test invalid input
result = mcp_mcp-sama_tool_name("invalid_input")
assert "error" in result.lower()

# Test default parameters
result = mcp_mcp-sama_tool_name("input")
assert result is not None
```

### 2. Integration Testing (Per Phase)
```python
# Test tool combinations
chain_info = mcp_mcp-sama_get_chain_info()
head_block = extract_head_block(chain_info)
block_data = mcp_mcp-sama_get_block(head_block)
assert block_data is not None
```

### 3. Performance Testing
```python
# Measure response time
import time
start = time.time()
result = mcp_mcp-sama_tool_name("input")
duration = time.time() - start
assert duration < 2.0  # Under 2 seconds
```

### 4. Failover Testing
```python
# Simulate RPC endpoint failure
# Tool should automatically try next endpoint
# Verify in Application Insights logs
```

---

## 📝 Documentation Updates

### Files to Update After Each Phase

1. **CHANGES.md**
   - Add new change entry for each tool
   - Include code examples
   - Include test results

2. **EXPERIMENT_01_TOOLS_INVENTORY.md**
   - Update status from ❌ to ✅
   - Add implementation notes
   - Update progress percentage

3. **DEPLOYMENT_INFO.md**
   - Add new tools to "Available MCP Tools" section
   - Include parameters and examples

4. **README.md**
   - Update tool count (1/32 → X/32)
   - Update status if phase complete

5. **agent.md**
   - Update if architecture changes
   - Add new patterns discovered

---

## ⚠️ Risk Mitigation

### Potential Issues

**1. RPC Endpoint Differences**
- **Risk:** Some endpoints may not exist on Proton
- **Mitigation:** Test each endpoint before implementation
- **Fallback:** Skip or implement alternative

**2. History API Availability**
- **Risk:** History endpoints require separate plugin
- **Mitigation:** Check RPC endpoint availability first
- **Fallback:** Document as "requires history API"

**3. Complex Table Queries**
- **Risk:** Some queries need multi-step logic
- **Mitigation:** Break into helper functions
- **Fallback:** Simplify query requirements

**4. Performance Degradation**
- **Risk:** Too many tools may slow cold starts
- **Mitigation:** Monitor Application Insights
- **Fallback:** Consider function app scaling

**5. Azure Function Timeout**
- **Risk:** Some queries may take >10 seconds
- **Mitigation:** Set appropriate timeouts
- **Fallback:** Implement async patterns

---

## 🚀 Deployment Strategy

### Per-Phase Deployment

**After Each Phase:**
1. Complete all tools in phase
2. Test locally (if possible)
3. Deploy to Azure
4. Test in production
5. Monitor for 15 minutes
6. Document results
7. Proceed to next phase

**Rollback Plan:**
```bash
# If issues occur
git revert HEAD
cd mcp-server
azd deploy --no-prompt
```

---

## 📅 Timeline Estimate

| Phase | Tools | Est. Time | Cumulative |
|-------|-------|----------|-----------|
| Phase 1 | 4 | 1.5 hours | 1.5 hours |
| Phase 2 | 4 | 1.5 hours | 3 hours |
| Phase 3 | 5 | 2.5 hours | 5.5 hours |
| Phase 4 | 18 | 6 hours | 11.5 hours |
| Testing | - | 2 hours | 13.5 hours |
| Documentation | - | 1.5 hours | 15 hours |

**Total Estimated Time:** 15 hours (2 working days)

---

## ✅ Success Criteria

### Phase 1 Success
- [ ] 4 core tools working
- [ ] Response time < 500ms
- [ ] Error handling tested
- [ ] Documentation complete

### Phase 2 Success
- [ ] 8 total tools working
- [ ] Token operations functional
- [ ] Account operations functional

### Phase 3 Success
- [ ] 13 total tools working
- [ ] DeFi queries functional
- [ ] Swap queries functional

### Phase 4 Success
- [ ] 32 total tools working
- [ ] 100% feature parity
- [ ] All tests passing

### Overall Success
- [ ] All 32 tools migrated
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Performance acceptable
- [ ] Failover working

---

**Next Step:** Create implementation prompt for Copilot agent to execute Phase 1.

**Last Updated:** December 25, 2024  
**Version:** 1.0.0
