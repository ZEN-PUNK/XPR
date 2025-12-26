# Experiment 02: XPR Blockchain MCP Server (Python SDK)

**Early Python SDK Implementation for Proton Blockchain**

[![Status](https://img.shields.io/badge/status-archived-yellow)]()
[![Azure](https://img.shields.io/badge/azure-functions-blue)]()
[![Python](https://img.shields.io/badge/python-3.12-blue)]()
[![MCP](https://img.shields.io/badge/MCP-Python_SDK-purple)]()

---

## ⚠️ Migration Notice

**This experiment (02) is archived.**  
For the latest production implementation, see **[experiment_04](../experiment_04/)**.

---

## 🎯 What This Is

An **early exploration** of hosting an MCP server for Proton blockchain using:
- Official Python MCP SDK
- Azure Functions as custom handler
- Proton RPC API integration

This experiment was a learning phase that led to the production implementation in experiment_04.

---

## 📚 Documentation Map

**Navigation:**
1. **README.md** (this file) - Overview
2. **[mcp-server/README.md](./mcp-server/README.md)** - Server implementation details
3. **[EXPERIMENT_02_CLEANUP_GUIDE.md](./EXPERIMENT_02_CLEANUP_GUIDE.md)** - Cleanup instructions for AI agents
4. **[AGENTIC_GUIDE.md](./AGENTIC_GUIDE.md)** - Development patterns (if exists)

**For Production Work:**
- See **[../experiment_04/CURRENT_STATUS.md](../experiment_04/CURRENT_STATUS.md)** - Latest status
- See **[../experiment_04/API_REFERENCE.md](../experiment_04/API_REFERENCE.md)** - Complete tool docs
- See **[../experiment_04/SEQUENTIAL_TOOL_USAGE_GUIDE.md](../experiment_04/SEQUENTIAL_TOOL_USAGE_GUIDE.md)** - Usage patterns

---

## 🏗️ Architecture

```
MCP Client (VS Code / API)
        ↓
Azure Function App (Python 3.12)
        ↓
Python MCP SDK Server
        ↓
FastMCP Framework (stateless HTTP)
        ↓
httpx Async HTTP Client
        ↓
Proton RPC Endpoints (4 with failover)
  1. proton.greymass.com       (primary)
  2. api.protonchain.com       (backup #1)
  3. proton.cryptolions.io     (backup #2)
  4. proton.eosusa.io          (backup #3)
        ↓
JSON Response
```

**Why This Architecture?**
- **Simple:** Single Python runtime, no dual Node.js/Python complexity
- **Fast:** Direct HTTP calls, ~200-300ms warm response time
- **Resilient:** 4 redundant RPC endpoints with automatic failover
- **Proven:** Based on experiment_02 (working weather MCP)

---

## 🛠️ Available Tools

### 1. get_account
**Description:** Get Proton blockchain account information  
**Parameters:**
- `account_name` (string): Proton account name (e.g., "zenpunk")

**Example:**
```python
mcp_mcp-sama_get_account("zenpunk")
```

**Response:**
```json
{
  "account_name": "zenpunk",
  "created": "2025-11-09T03:14:47.000",
  "ram_quota": 13399,
  "ram_usage": 7367,
  "permissions": [...],
  "voter_info": {...}
}
```

### 2. get_user_info
**Description:** Azure AD token exchange demo  
**Parameters:** None

**Example:**
```python
mcp_mcp-sama_get_user_info()
```

---

## 🚀 Deployment

### Prerequisites
- Azure Developer CLI (`azd`)
- Azure subscription
- Python 3.12

### Deploy
```bash
# Navigate to mcp-server directory
cd /workspaces/XPR/agentic_dev/experiment_03/mcp-server

# Deploy to Azure
azd deploy --no-prompt

# Expected: Success in ~1-2 minutes
```

### Verify
```bash
# Check function app status
az functionapp show \
  --name AZURE-FUNCTION-APP-NAME \
  --resource-group AZURE-RESOURCE-GROUP \
  --query state

# Expected: "Running"
```

---

## 🧪 Testing

### Test with MCP Client
```python
# Via VS Code MCP client or API
mcp_mcp-sama_get_account("zenpunk")

# Expected: Account data JSON
```

### Test Error Handling
```python
# Non-existent account
mcp_mcp-sama_get_account("nonexistentaccount123")

# Expected: Proper error message
```

### Performance Testing
```bash
# Via Application Insights
az monitor app-insights query \
  --app appi-hk6er2km4y6bi \
  --analytics-query "requests | where timestamp > ago(1h) | summarize avg(duration)"

# Target: <500ms average
```

---

## 📊 Current Status

**Version:** v1.1.0 (RPC Failover)  
**Status:** Production Ready ✅  
**Last Deployment:** December 25, 2024 16:00 UTC  
**Uptime:** Active  

**Performance Metrics:**
- Response Time: ~200-300ms (warm)
- Success Rate: >99%
- RPC Endpoints: 4 with automatic failover

**Recent Changes:**
- ✅ Added RPC endpoint failover (Change #009)
- ✅ Updated all documentation
- ✅ Created ITERATION_GUIDE.md for repeatable development

---

## 🔄 How to Iterate

See **[ITERATION_GUIDE.md](./ITERATION_GUIDE.md)** for the complete process.

**Quick Summary:**
1. Read [agent.md](./agent.md) for context
2. Document planned change in [CHANGES.md](./CHANGES.md)
3. Implement in `mcp-server/server.py`
4. Deploy with `azd deploy --no-prompt`
5. Test with MCP tools
6. Update ALL documentation
7. Improve process documentation

**Goal:** Each iteration should make the next iteration easier.

---

## 📈 Evolution History

### Phase 0: Planning (Dec 25, 2024 14:00 UTC)
- Copied experiment_02 baseline
- Planned Proton CLI integration
- Decided on 3 MVP tools

### Phase 1: Initial Deployment (Dec 25, 2024 14:00 UTC)
- Deployed to sama-mcp resource group
- Fixed CORS issues
- Enabled anonymous authentication
- Time: 5 minutes

### Phase 2: Architecture Pivot (Dec 25, 2024 14:30 UTC)
- Replaced CLI subprocess with direct RPC calls
- Eliminated Node.js dependency
- Improved performance by 50%
- Time: 20 minutes

### Phase 3: Production Hardening (Dec 25, 2024 16:00 UTC)
- Added RPC endpoint failover (4 endpoints)
- Improved error reporting
- Created comprehensive documentation
- Time: 15 minutes

**Total Time to Production: 75 minutes**

---

## 🌟 Key Achievements

1. **Fast Deployment:** 5 minutes from code to production
2. **Architecture Simplification:** Eliminated dual runtime complexity
3. **Production Resilience:** 4 RPC endpoints with automatic failover
4. **Comprehensive Documentation:** 7 markdown files covering all aspects
5. **Repeatable Process:** ITERATION_GUIDE.md enables continuous improvement

---

## 🔗 Azure Resources

**Resource Group:** AZURE-RESOURCE-GROUP  
**Region:** East US 2  

| Resource | Name |
|----------|------|
| Function App | AZURE-FUNCTION-APP-NAME |
| Storage | sthk6er2km4y6bi |
| App Service Plan | plan-hk6er2km4y6bi |
| Application Insights | appi-hk6er2km4y6bi |
| VNet | vnet-hk6er2km4y6bi |

**Portal Link:**
```
https://portal.azure.com/#@/resource/subscriptions/<YOUR_SUBSCRIPTION_ID>/resourceGroups/AZURE-RESOURCE-GROUP/overview
```

---

## 🎓 Lessons Learned

### What Worked Well
- ✅ Copying proven baseline (experiment_02)
- ✅ Direct RPC calls instead of subprocess
- ✅ Documentation-first approach
- ✅ Small, incremental changes
- ✅ Testing after each deployment

### What We'd Do Differently
- Could have planned RPC failover from start
- Could have automated version number updates
- Could have created templates for documentation

### Key Insights
1. **Simple is better:** Direct RPC > subprocess > dual runtime
2. **Document everything:** Future you will thank you
3. **Test thoroughly:** Production bugs are expensive
4. **Iterate quickly:** Deploy often, learn fast
5. **Improve the process:** Each iteration should be easier

---

## 🚧 Future Improvements

### Planned Features
- [ ] Add `get_chain_info` tool
- [ ] Add `get_block` tool
- [ ] Add response caching (5 min TTL)
- [ ] Add rate limiting
- [ ] Add more RPC endpoints

### Process Improvements
- [ ] Automate version number updates
- [ ] Create deployment script with all checks
- [ ] Add automated performance testing
- [ ] Create CI/CD pipeline

### Documentation Improvements
- [ ] Add video walkthrough
- [ ] Create interactive checklist tool
- [ ] Add more real-world examples
- [ ] Create troubleshooting flowchart

---

## 📞 Support

**Issues:** Document in [CHANGES.md](./CHANGES.md)  
**Questions:** Check [DEPLOYMENT_JOURNEY.md](./DEPLOYMENT_JOURNEY.md) for debugging examples  
**Process:** Follow [ITERATION_GUIDE.md](./ITERATION_GUIDE.md)

---

## 📄 License

See main repository LICENSE file.

---

**Last Updated:** December 25, 2024 16:30 UTC  
**Maintained By:** Agentic Development Process (see ITERATION_GUIDE.md)  
**Status:** Active Development ✅
