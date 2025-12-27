# Iteration Guide - Agentic Development Orchestration

**Purpose:** Document the repeatable process for iterating on this MCP server, ensuring each cycle improves both the code AND the documentation.

**Meta-Goal:** Each iteration should make the next iteration easier, faster, and better documented.

---

## 🎯 The Iteration Loop

```
┌─────────────────────────────────────────────────────────┐
│                    ITERATION CYCLE                      │
│                                                         │
│  1. Read Documentation  ───────────────────────┐       │
│         ↓                                      │       │
│  2. Plan Change (CHANGES.md)                   │       │
│         ↓                                      │       │
│  3. Implement in Code                          │       │
│         ↓                                      │       │
│  4. Deploy to Azure                            │       │
│         ↓                                      │       │
│  5. Test with MCP Tools                        │       │
│         ↓                                      │       │
│  6. Document Results (Update ALL docs)  ───────┘       │
│         ↓                                              │
│  7. Improve Process Documentation (this file)          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📚 Documentation Hierarchy

### Read First (Understanding)
1. **[agent.md](./agent.md)** - Architectural vision, strategy, what we're building
2. **[CHANGES.md](./CHANGES.md)** - Every change ever made, reverse chronological

### Read During Work (Implementation)
3. **[AGENT_PROMPT.md](./AGENT_PROMPT.md)** - Step-by-step implementation guide
4. **[DEPLOYMENT_INFO.md](./DEPLOYMENT_INFO.md)** - Current deployment state, endpoints
5. **[DEPLOYMENT_JOURNEY.md](./DEPLOYMENT_JOURNEY.md)** - Timeline of debugging/deployment

### Read After (Improvement)
6. **ITERATION_GUIDE.md** (this file) - Meta-process for continuous improvement

---

## 🔄 Step-by-Step Iteration Process

### Phase 1: Planning (Before Any Code Changes)

**1.1 Read Current State**
```bash
# Read architectural vision
cat agent.md

# Check latest changes
head -n 100 CHANGES.md

# View current deployment info
cat DEPLOYMENT_INFO.md
```

**1.2 Document the Planned Change**
```markdown
# In CHANGES.md, add new entry:

#### Change #XXX: [Descriptive Title]
**Timestamp:** [Current UTC time]
**Type:** [Enhancement/Bug Fix/Feature/Architecture Change]
**Files:** [List all files to be modified]
**Status:** Planned ⏳

**Problem:**
[What issue are we solving?]

**Solution:**
[How will we solve it?]

**Expected Impact:**
[What will this change?]

**Rollback Plan:**
[How to undo if it fails?]
```

**1.3 Create Implementation Checklist**
```markdown
**Implementation Steps:**
- [ ] Modify server.py
- [ ] Update requirements.txt (if needed)
- [ ] Deploy to Azure
- [ ] Test with MCP tool
- [ ] Update CHANGES.md with results
- [ ] Update DEPLOYMENT_INFO.md
- [ ] Update agent.md (if architecture changed)
- [ ] Update DEPLOYMENT_JOURNEY.md (if debugging involved)
```

---

### Phase 2: Implementation (Code Changes)

**2.1 Make Code Changes**
```bash
# Navigate to code directory
cd /workspaces/XPR/agentic_dev/experiment_03/mcp-server

# Edit server.py
code server.py

# Example: Adding RPC failover
# - Replace single PROTON_RPC_ENDPOINT with PROTON_RPC_ENDPOINTS list
# - Update call_proton_rpc() to loop through endpoints
# - Add error handling for each endpoint
```

**2.2 Update Python Dependencies (if needed)**
```bash
# Add new packages to requirements.txt
echo "new-package==1.0.0" >> requirements.txt
```

**2.3 Local Validation (Optional but Recommended)**
```bash
# Syntax check
python -m py_compile server.py

# Type check (if using type hints)
mypy server.py
```

---

### Phase 3: Deployment (Push to Azure)

**3.1 Deploy Using Azure Developer CLI**
```bash
# From mcp-server directory
cd /workspaces/XPR/agentic_dev/experiment_03/mcp-server

# Deploy without prompts
azd deploy --no-prompt
```

**3.2 Monitor Deployment**
```bash
# Watch for:
# - Build completion
# - Package upload
# - Function app restart
# - Deployment success message

# Expected output:
# Deploying services (azd deploy)
#   (✓) Done: Deploying service mcp
#   - Endpoint: https://YOUR-FUNCTION-APP.azurewebsites.net/
# SUCCESS: Your application was deployed to Azure in X minutes Y seconds.
```

**3.3 Verify Deployment**
```bash
# Check function app is running
az functionapp show \
  --name AZURE-FUNCTION-APP-NAME \
  --resource-group AZURE-RESOURCE-GROUP \
  --query state

# Expected: "Running"
```

---

### Phase 4: Testing (Validation)

**4.1 Test with MCP Tool**
```bash
# Using VS Code MCP client or API
# Tool: mcp_mcp-sama_get_account
# Parameter: account_name = "zenpunk"

# Expected result: JSON account data
{
  "account_name": "zenpunk",
  "created": "2025-11-09T03:14:47.000",
  "ram_quota": 13399,
  "ram_usage": 7367,
  ...
}
```

**4.2 Test Error Handling**
```bash
# Test with non-existent account
# Tool: mcp_mcp-sama_get_account
# Parameter: account_name = "nonexistentaccount123"

# Expected result: Proper error message
{
  "error": "All Proton RPC endpoints failed",
  "last_error": {...}
}
```

**4.3 Monitor Performance**
```bash
# Check Application Insights for:
# - Response times (target: <500ms)
# - Error rates (target: <1%)
# - Success rates (target: >99%)

# View logs
az monitor app-insights query \
  --app appi-hk6er2km4y6bi \
  --analytics-query "requests | where timestamp > ago(1h)"
```

---

### Phase 5: Documentation Update (Critical!)

**5.1 Update CHANGES.md with Results**
```markdown
# Update the change entry:

#### Change #XXX: [Descriptive Title]
**Timestamp:** [Current UTC time]
**Type:** [Enhancement/Bug Fix/Feature/Architecture Change]
**Files:** [List all files modified]
**Status:** Complete ✅

**Problem:**
[Actual issue we solved]

**Solution:**
[What we implemented]

**Code Changes:**
```python
# Include key code snippets
```

**Deployment:**
```bash
azd deploy --no-prompt
# Result: ✅ Success (X minutes Y seconds)
```

**Testing:**
```bash
# Test commands and results
mcp_mcp-sama_get_account("zenpunk")
# Result: ✅ Success
```

**Impact:**
- ✅ [Benefit 1]
- ✅ [Benefit 2]
- ✅ [Benefit 3]

**Performance:**
- Response time: Xms
- Success rate: Y%
- Endpoints tested: Z

**Lessons Learned:**
[What we learned from this change]

---
```

**5.2 Update DEPLOYMENT_INFO.md**
```markdown
# Update sections:

## 🚀 Deployment Summary
**Last Updated:** [Current UTC time]
**Current Version:** [Increment version number]

## 🔧 Configuration
# Add any new environment variables

## 🛠️ Available MCP Tools
# Update tool descriptions with new features

## 📊 Performance Metrics
# Add latest performance data
```

**5.3 Update agent.md (if architecture changed)**
```markdown
# Update sections:

## 🧠 Strategic Architecture Decision
# Update architecture diagram if structure changed

## 📊 Evolution History
# Add new phase to evolution timeline

## ✅ Current Status
# Update status indicators
```

**5.4 Update DEPLOYMENT_JOURNEY.md (if debugging occurred)**
```markdown
# Add new section with timestamp:

### T+XX: [Event Description]
**Issue/Enhancement:** [What happened]

**Implementation:**
[What we did]

**Result:** ✅ Success (X minutes)

**Benefits:**
- ✅ [Benefit 1]
- ✅ [Benefit 2]

**Time to Implement:** X minutes
```

---

### Phase 6: Process Improvement (Meta-Documentation)

**6.1 Update ITERATION_GUIDE.md (this file)**

After each iteration, ask:
- Did we follow the process?
- What steps were missing?
- What could be automated?
- What took longer than expected?
- What documentation was unclear?

Then update this guide to make the next iteration better.

**6.2 Identify Automation Opportunities**
```bash
# Examples:
# - Create script to update version numbers
# - Automate performance metric collection
# - Generate deployment summary automatically
# - Create templates for CHANGES.md entries
```

**6.3 Document Lessons Learned**
```markdown
# Add to this guide:

## 📝 Lessons from Iteration #XXX

**Date:** [Current date]
**Change:** [What we did]

**What Went Well:**
- [Success 1]
- [Success 2]

**What Could Improve:**
- [Improvement 1]
- [Improvement 2]

**Process Changes Made:**
- [Change 1]
- [Change 2]
```

---

## 🎓 Real-World Example: RPC Failover Addition

### Iteration Context
**Date:** December 25, 2024 16:00 UTC
**Change:** Add RPC endpoint failover for production resilience
**Previous State:** Single RPC endpoint (greymass.com)
**Goal:** Multiple endpoints with automatic failover

### Phase 1: Planning ✅
```markdown
# Added to CHANGES.md:

#### Change #009: Added RPC Endpoint Failover
**Status:** Planned ⏳
**Type:** Resilience Improvement
**Files:** /workspaces/XPR/agentic_dev/experiment_03/mcp-server/server.py

**Problem:**
Single RPC endpoint creates single point of failure

**Solution:**
Implement automatic failover across 4 public Proton RPC endpoints

**Implementation Steps:**
- [ ] Change PROTON_RPC_ENDPOINT to PROTON_RPC_ENDPOINTS list
- [ ] Update call_proton_rpc() with loop and error handling
- [ ] Deploy to Azure
- [ ] Test with known account
- [ ] Update all documentation
```

### Phase 2: Implementation ✅
```python
# Before
PROTON_RPC_ENDPOINT = "https://proton.greymass.com"

# After
PROTON_RPC_ENDPOINTS = [
    "https://proton.greymass.com",
    "https://api.protonchain.com",
    "https://proton.cryptolions.io",
    "https://proton.eosusa.io",
]

async def call_proton_rpc(endpoint: str, body: dict[str, Any]) -> dict[str, Any]:
    """Call Proton blockchain RPC API with automatic failover."""
    last_error = None
    async with httpx.AsyncClient(timeout=10.0) as client:
        for base_url in PROTON_RPC_ENDPOINTS:
            try:
                response = await client.post(f"{base_url}{endpoint}", json=body)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                last_error = {"endpoint": base_url, "error": str(e), ...}
    return {"error": "All Proton RPC endpoints failed", "last_error": last_error}
```

### Phase 3: Deployment ✅
```bash
$ cd /workspaces/XPR/agentic_dev/experiment_03/mcp-server
$ azd deploy --no-prompt

Deploying services (azd deploy)
  (✓) Done: Deploying service mcp
  - Endpoint: https://YOUR-FUNCTION-APP.azurewebsites.net/
SUCCESS: Your application was deployed to Azure in 1 minute 12 seconds.
```

### Phase 4: Testing ✅
```bash
# Test 1: Known good account
mcp_mcp-sama_get_account("zenpunk")
# Result: ✅ Success - returned account data

# Test 2: Verify no breaking changes
# Same response format, same data, same performance
```

### Phase 5: Documentation Update ✅
- [x] Updated CHANGES.md with complete results
- [x] Updated DEPLOYMENT_INFO.md with new endpoints
- [x] Updated agent.md with failover architecture
- [x] Updated DEPLOYMENT_JOURNEY.md with timeline
- [x] Created ITERATION_GUIDE.md (this file)

### Phase 6: Process Improvement ✅
**What Went Well:**
- Clear planning step prevented mistakes
- Documentation-first approach made deployment smooth
- Testing validated no breaking changes

**What Could Improve:**
- Could automate version number updates
- Could create deployment checklist template
- Could add automated performance testing

**Process Changes Made:**
- Created this ITERATION_GUIDE.md for future iterations
- Established documentation update checklist
- Documented real-world example for reference

---

## 📋 Quick Reference Checklists

### Pre-Deployment Checklist
- [ ] Change documented in CHANGES.md
- [ ] Implementation plan reviewed
- [ ] Files identified for modification
- [ ] Rollback plan defined
- [ ] Tests planned

### Deployment Checklist
- [ ] Code changes completed
- [ ] Syntax validated
- [ ] `azd deploy --no-prompt` executed
- [ ] Deployment succeeded
- [ ] Function app running

### Testing Checklist
- [ ] MCP tool tested with valid input
- [ ] Error handling tested with invalid input
- [ ] Performance measured
- [ ] No breaking changes confirmed
- [ ] Logs reviewed in Application Insights

### Documentation Checklist
- [ ] CHANGES.md updated with results
- [ ] DEPLOYMENT_INFO.md updated
- [ ] agent.md updated (if architecture changed)
- [ ] DEPLOYMENT_JOURNEY.md updated (if debugging occurred)
- [ ] ITERATION_GUIDE.md improved (meta-documentation)

---

## 🚀 Quick Start for Next Iteration

```bash
# 1. Read current state
cat agent.md CHANGES.md DEPLOYMENT_INFO.md

# 2. Plan your change (edit CHANGES.md)
code CHANGES.md

# 3. Implement in server.py
code mcp-server/server.py

# 4. Deploy
cd mcp-server && azd deploy --no-prompt

# 5. Test
# Use VS Code MCP client or mcp_mcp-sama_get_account tool

# 6. Document (update all relevant .md files)
code CHANGES.md DEPLOYMENT_INFO.md agent.md DEPLOYMENT_JOURNEY.md

# 7. Improve this guide
code ITERATION_GUIDE.md
```

---

## 💡 Pro Tips

### For Agents
1. **Always read CHANGES.md first** - Understand what's been done
2. **Always update CHANGES.md before coding** - Plan before implementing
3. **Always test after deploying** - Validate before documenting
4. **Always update ALL relevant docs** - Keep everything in sync
5. **Always improve this guide** - Make next iteration easier

### For Humans
1. **Review changes before deployment** - Catch issues early
2. **Monitor Application Insights** - Watch for errors
3. **Keep documentation in sync** - Future you will thank you
4. **Use this guide as template** - Copy/paste checklists
5. **Improve the process** - Each iteration should be better

### For Both
1. **Small iterations win** - Deploy often, learn fast
2. **Document everything** - Memory fades, docs don't
3. **Test thoroughly** - Bugs in production are expensive
4. **Learn from mistakes** - Update docs with lessons
5. **Automate when possible** - Reduce manual work

---

## 📊 Success Metrics

Track these metrics for each iteration:

### Speed Metrics
- Planning time: [X minutes]
- Implementation time: [Y minutes]
- Deployment time: [Z minutes] (target: <2 min)
- Testing time: [W minutes]
- Documentation time: [V minutes]
- **Total iteration time:** [Sum] (target: <30 min for small changes)

### Quality Metrics
- Documentation completeness: [X/5 files updated]
- Test coverage: [Y test cases]
- Success rate: [Z%] (target: 100%)
- Breaking changes: [0] (target: 0)
- Rollbacks needed: [0] (target: 0)

### Process Metrics
- Steps skipped: [0] (target: 0)
- Process improvements identified: [X]
- Process improvements implemented: [Y]
- Documentation clarity: [Subjective rating]

---

## 🔮 Future Improvements

Ideas for improving this iteration process:

### Automation
- [ ] Create deployment script that updates version numbers
- [ ] Auto-generate performance reports from Application Insights
- [ ] Create CHANGES.md entry templates
- [ ] Automate documentation cross-reference validation

### Tooling
- [ ] Pre-commit hooks for documentation checks
- [ ] Automated testing suite
- [ ] Performance benchmarking automation
- [ ] Documentation linting

### Process
- [ ] Create video walkthrough of iteration process
- [ ] Build interactive checklist tool
- [ ] Establish peer review process
- [ ] Create rollback automation

---

## 📖 Related Documents

- **[agent.md](./agent.md)** - Overall architecture and vision
- **[CHANGES.md](./CHANGES.md)** - Complete change history
- **[AGENT_PROMPT.md](./AGENT_PROMPT.md)** - Implementation guide
- **[DEPLOYMENT_INFO.md](./DEPLOYMENT_INFO.md)** - Current deployment state
- **[DEPLOYMENT_JOURNEY.md](./DEPLOYMENT_JOURNEY.md)** - Debugging timeline

---

**Remember:** The goal isn't just to add features—it's to create a sustainable, repeatable process that gets better with each iteration. Every change should improve both the code AND the documentation.

**Last Updated:** December 25, 2024 16:30 UTC  
**Version:** 1.0.0  
**Next Review:** After next iteration
