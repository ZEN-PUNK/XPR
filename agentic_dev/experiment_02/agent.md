# Agent.md - XPR Proton CLI MCP Server on Azure Functions

**Experiment 03: Minimal Viable Proton CLI Integration**

> ⚠️ **CRITICAL:** This file is the architectural vision. For detailed change tracking and implementation progress, see **[CHANGES.md](./CHANGES.md)** - ALL modifications must be documented there before making them.

---

## 🎯 Mission Statement

Create a **working proof-of-concept** Azure Functions MCP server that executes basic Proton CLI commands, using the proven infrastructure from experiment_02 (weather MCP).

**Minimal Viable Product:** Deploy 1-3 basic account tools to Azure Functions that successfully execute Proton CLI commands and return blockchain data via MCP protocol.

**End Goal (Future):** Scale to full tool coverage once the pattern is proven.

## 📋 Key Documents

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **agent.md** (this file) | Architectural vision, strategy, phases | Start here - understand the plan |
| **[CHANGES.md](./CHANGES.md)** | Every change made, auth tracking, rollback procedures | Before/after every change || **[AGENT_PROMPT.md](./AGENT_PROMPT.md)** | Complete implementation guide with paths & commands | When starting implementation || **README.md** | Quick start guide | When running the project |
| **TROUBLESHOOTING.md** | Common issues | When things break |

---

## 🧠 Strategic Architecture Decision

### The Core Innovation

**Direct RPC Integration with Failover: Python FastMCP → Proton Blockchain RPC**

```
Python FastMCP Server (Azure Functions) - FROM experiment_02 ✅
        ↓
  httpx async HTTP client
        ↓
Proton RPC Failover (4 endpoints)
  1. proton.greymass.com       (primary)
  2. api.protonchain.com       (backup #1)
  3. proton.cryptolions.io     (backup #2)
  4. proton.eosusa.io          (backup #3)
        ↓
JSON Response
```

**Why This Approach?**
1. **Leverage proven infrastructure** - experiment_02's Azure Functions setup works perfectly
2. **Direct API calls** - No subprocess overhead, faster responses (~200-300ms)
3. **Single runtime** - Python only, simpler deployment
4. **Production-ready** - Multiple public RPC endpoints with automatic failover
5. **Low risk** - Small changes to working baseline
6. **Fast feedback** - Deploy and test quickly (~1 minute deployments)
7. **High availability** - 4 redundant endpoints for resilience

**Key Principle: COPY experiment_02, MODIFY minimally**

**Evolution from Original Plan:**
- ✅ **Originally planned:** Python → subprocess → Node.js CLI → RPC
- ✅ **Phase 1 architecture:** Python → httpx → RPC (much simpler!)
- ✅ **Phase 2 architecture:** Python → httpx → Multi-endpoint RPC with failover
- 🎯 **Benefit:** Eliminated dual runtime complexity + production resilience

**Architecture Benefits:**
- ✅ **Simpler:** Single Python runtime
- ✅ **Faster:** Direct HTTP calls (~200-300ms warm, ~5-10s cold start)
- ✅ **Smaller:** No Node.js/CLI bundling needed (50% package size reduction)
- ✅ **Maintainable:** Standard Python async patterns
- ✅ **Same Data:** Identical JSON responses from same RPC endpoints
- ✅ **Resilient:** Automatic failover across 4 independent RPC endpoints
- ✅ **Production-ready:** Deployed to Azure Functions in sama-mcp resource group

---

## 📊 Three-Way Comparison

### Experiment 01: Node.js Local MCP Server
**What it is:**
- Express.js server running locally (port 3001)
- TypeScript tools wrapping Proton CLI via child_process
- 32 tools across 10 categories
- Tested and documented

**Strengths:**
- ✅ Comprehensive tool coverage
- ✅ Well-tested TypeScript implementations
- ✅ Complete documentation
- ✅ Fast local development

**Limitations:**
- ❌ No cloud deployment
- ❌ No authentication/authorization
- ❌ Single-instance only
- ❌ No monitoring/observability
- ❌ Manual scaling

**Note:** This experiment showed us which RPC endpoints to use!

---

### Experiment 02: Azure Weather MCP Server
**What it is:**
- Python FastMCP server on Azure Functions
- Weather tools (NWS API integration)
- Fully deployed and working in production
- Infrastructure as code (Bicep)

**Strengths:**
- ✅ Azure Functions deployment working
- ✅ FastMCP framework proven
- ✅ CORS and auth configured
- ✅ Application Insights monitoring
- ✅ Auto-scaling serverless
- ✅ GitHub Copilot tested

**Limitations:**
- ❌ Only 3 weather tools
- ❌ No blockchain integration

**Why we copied this:** Proven deployment pipeline and infrastructure!
- ❌ Different tech stack (Python vs TS)

---Minimal Viable Hybrid** (THIS PROJECT)
**What we're building (MVP):**
- Python FastMCP server (COPY from exp_02 ✅ WORKING)
- Proton CLI execution via subprocess (NEW - needs validation)
- Deployed to Azure Functions ('sama' resource group)
- **ONLY 1-3 basic account tools** (get_account, get_chain_info, get_block)
- Prove the pattern works before scaling

**Combining Best of Both (Incrementally):**
- ✅ Azure infrastructure (from exp_02) - ALREADY WORKING
- ✅ Proton CLI wrapper (from exp_01 concept)
- ✅ Start small, validate, then expand
- ✅ Document every change (see CHANGES.md)
- ⚠️ Auth disabled initially (note: caused issues before
- ✅ Comprehensive blockchain coverage
- ✅ Fast delivery (wrapper pattern)

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Agents / Users                            │
│         (GitHub Copilot, Claude Desktop, Custom Clients)        │
└──────────────────────┬──────────────────────────────────────────┘
                       │ MCP Protocol (JSON-RPC 2.0)
                       │ over HTTP/SSE
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│              Azure Function App                                 │
│           func-xpr-cli-*.azurewebsites.net                     │
│  Resource Group: sama                                           │
## 🏗️ Actual Implementation - Simplified Architecture

### Production Architecture (As Deployed)

```
┌─────────────────────────────────────────────────────────────────┐
│         VS Code / GitHub Copilot (MCP Client)                   │
│  - Connects via HTTP/SSE                                        │
│  - URL: https://func-mcp-hk6er2km4y6bi.azurewebsites.net/mcp   │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS + CORS
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│      Azure Function App (func-mcp-hk6er2km4y6bi)               │
│  Resource Group: rg-sama-mcp                                    │
│  Location: East US 2                                            │
│  Runtime: Python 3.12 (FlexConsumption)                        │
│  - HTTP trigger                                                 │
│  - Custom handler (FastMCP)                                     │
│  - CORS enabled (allow all origins)                            │
│  - Application Insights monitoring                              │
│  - Anonymous auth enabled                                       │
└──────────────────────┬──────────────────────────────────────────┘
                       │ Python async call
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│         FastMCP Server (server.py)                              │
│  - get_account tool                                             │
│  - get_user_info tool (Azure AD demo)                          │
│  - httpx async HTTP client                                      │
│  - Error handling & validation                                  │
│  - JSON response formatting                                     │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS POST request
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│         Proton Blockchain RPC (Greymass)                       │
│  - Endpoint: https://proton.greymass.com                       │
│  - Standard EOSIO RPC API                                       │
│  - Public, highly available                                     │
│  - Endpoints: /v1/chain/get_account, /v1/chain/get_info, etc. │
└─────────────────────────────────────────────────────────────────┘
```

### Deployment Package Structure

```
Azure Function Deployment Package
├── Python Runtime (3.12)
│   ├── server.py (FastMCP entrypoint)
│   ├── requirements.txt
│   │   ├── fastmcp
│   │   ├── httpx
│   │   ├── azure-identity
│   │   └── starlette
│   └── Python packages (.venv)
│
├── Azure Functions Config
│   ├── host.json (custom handler config)
│   ├── local.settings.json (env vars)
│   └── authcomplete.html (OAuth callback)
│
└── Infrastructure (Bicep)
    └── infra/
        ├── main.bicep (resource definitions)
        ├── main.parameters.json (sama-mcp config)
        ├── resources.bicep
        └── app/
            ├── mcp.bicep (function app)
            └── entra.bicep (optional auth)
```

**Key Simplifications:**
- ❌ No Node.js runtime needed
- ❌ No Proton CLI package
- ❌ No subprocess execution
- ✅ Direct HTTP API calls only
- ✅ Single Python runtime
- ✅ Faster, simpler, more reliable

---

## 🎯 Minimal Tool Set (MVP)

### Phase 1: Currently Deployed ✅

| Tool Name | RPC Endpoint | Status | Tested Accounts |
|-----------|--------------|--------|-----------------|
| **get_account** | `/v1/chain/get_account` | ✅ Working | zenpunk, merkabahnk, samatoken |
| **get_user_info** | Microsoft Graph API | ✅ Working | Azure AD demo |

**Success Criteria for MVP:**
- ✅ Tools work deployed on Azure
- ✅ MCP protocol working (tested via curl + MCP client)
- ✅ CORS configured correctly
- ✅ Auth configuration works (anonymous mode)
- ✅ Performance < 500ms per call (achieved: ~200-300ms)
- ✅ Error handling works (tested with non-existent account)

### Phase 2: Next Tools to Add

| Tool Name | RPC Endpoint | Why This Tool | Complexity |
|-----------|--------------|---------------|------------|
| **get_chain_info** | `/v1/chain/get_info` | No parameters, server info | Low ✅ |
| **get_block** | `/v1/chain/get_block` | Single parameter (block_num) | Low ✅ |
| **get_table_rows** | `/v1/chain/get_table_rows` | Query contract tables | Medium ⚠️ |

**Future Expansion (After MVP Validated):**
| Category | RPC Endpoint | Count |
|----------|--------------|-------|
| **CHAIN** (3) | `/v1/chain/get_info`, `/v1/chain/get_block`, `/v1/chain/get_block_header_state` | 3 |
| **TABLE** (2) | `/v1/chain/get_table_rows`, `/v1/chain/get_table_by_scope` | 2 |
| **CONTRACT** (2) | `/v1/chain/get_abi`, `/v1/chain/get_code` | 2 |
| **ACCOUNT** (3) | `/v1/chain/get_account`, `/v1/chain/get_currency_balance`, `/v1/history/get_actions` | 3 |
| **TRANSACTION** (4) | `proton transaction:get <txid>` | get_transaction | P2 | Medium |
| | `proton action:history <account>` | get_actions | P2 | Medium |
| | `proton rpc:accounts <key>` | get_key_accounts | P2 | Low |
| | `proton account:controlled <account>` | get_controlled_accounts | P2 | Low |
| **KEY** (3) | `proton key:generate` | generate_key_pair | P2 | Low |
| | `proton key:public <private>` | get_public_key | P2 | Low |
| | `proton encode <name>` | encode_name | P3 | Low |
| **NETWORK** (3) | `proton network` | get_network | P2 | Low |
| | `proton endpoint` | get_endpoint | P3 | Low |
| | `proton ram:price` | get_ram_price | P2 | Low |
| **PRODUCERS** (3) | `proton chain:producers` | get_producers | P2 | Low |
| | `proton chain:schedule` | get_producer_schedule | P2 | Low |
| | `proton chain:features` | get_protocol_features | P2 | Low |
| **LENDING** (5) | Custom table queries | get_lending_markets | P1 | High |
| | | get_oracle_prices | P1 | High |
| | | get_liquidatable_positions | P1 | High |
| | | get_at_risk_positions | P1 | High |
| | | get_lending_position | P1 | High |
| **NFT** (5) | AtomicAssets tables | get_account_nfts | P2 | High |
| | | get_nft_templates | P2 | Medium |
| | | get_nft_collections | P2 | Medium |
| | Minimal Viable Approach

#### Phase 0: Setup & Planning (TODAY)
**Goal:** Prepare minimal environment

**Deliverables:**
- [x] agent.md (this file) - Focused MVP vision
- [x] CHANGES.md - Track every incremental change (⚠️ **REQUIRED** - document ALL changes here)
- [ ] Copy experiment_02 codebase as starting point

**Success Criteria:**
- ✅ experiment_02 code copied
- ✅ Change tracking system in place ([CHANGES.md](./CHANGES.md))
- ✅ Clear scope (only 3 tools)

**⚠️ CRITICAL WORKFLOW:**
1. Read agent.md (this file) to understand the plan
2. Before making ANY change, document it in [CHANGES.md](./CHANGES.md)
3. Make the change
4. Update [CHANGES.md](./CHANGES.md) with test results
5. Repeat
**Technical Preparation:**
- [ ] Copy experiment_02 infrastructure as baseline
- [ ] Document Node.js installation in Azure Functions
- [ ] Create package.json for Proton CLI dependency
- [ ] Design CLI executor abstraction layer
- [ ] Plan error handling for subprocess failures

**Success Criteria:**
- ✅ All planning documents complete
- ✅ Dual runtime strategy validated
- ✅ Deployment approach documented
- ✅ Risk mitigation plans in place

---
Single Tool Proof of Concept
**Status:** PENDING  
**Duration:** 1 day  
**Goal:** Get ONE tool working end-to-end

**Tool to Implement:**
1. ✅ get_account ONLY
5. get_block_transaction_count

**Technical Tasks:**
- [ ] Create CLI adapter module (cli_executor.py)
- [ ] Implement subprocess wrapper with timeout/retry
- [ ] Create JSON response parser
- [ ] Copy server.py from experiment_02
- [ ] Remove weather tools
- [ ] Add minimal CLI executor (just subprocess.run, no fancy stuff)
- [ ] Implement ONE tool: get_account
- [ ] Test locally with installed Proton CLI
- [ ] Document in CHANGES.md

**CLI Executor Pattern (MINIMAL VERSION)
from typing import Dict, Any

class ProtonCLIExecutor:
    def __init__(self, cli_path: str = "proton"):
        self.cli_path = cli_path
        self.timeout = 30
    
    async def execute(self, command: str, *args) -> Dict[str, Any]:
        """Execute proton CLI command and return JSON."""
        cmd = [self.cli_path, command, *args, "--json"]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=self.timeout
        )
        
        if result.returncode != 0:
            raise CLIError(result.stderr)
        
        return json.loads(result.stdout)
```

**Success Criteria:**
- ✅ All 5 tools return valid data
- ✅ < 1 second latency (including subprocess overhead)
- ✅ Error handling works for all failure modes
- ✅ Tests pass locally
- ✅ Deployment package builds successfully

---

#### Phase 2: Table & Contract Tools (P1)
**Stget_account returns valid data locally
- ✅ Works with real Proton CLI
- ✅ All changes documented in CHANGES.md

---

#### Phase 2: Add Second Tool
**Status:** PENDING  
**Duration:** 4 hours  
**Goal:** Prove the pattern is replicable

**Tool to Implement:**
2. ✅ get_chain_info (no parameters, simplest)

**Success Criteria:**
- ✅ get_chain_info works locally
- ✅ Pattern validated
- ✅ Changes documented

---

#### Phase 3: Add Third Tool
**Status:** PENDING  
**Duration:** 4 hours  
**Goal:** Complete MVP tool set

**Tool to Implement:**
3. ✅ get_block (single parameter)

**Success Criteria:**
- ✅ All 3 tools work locally
- ✅ Ready for deployment

---

#### Phase 4: Local Deployment Test
**Status:** PENDING  
**Duration:** 1 day  
**Goal:** Get it running on Azure Functions locally
- [ ] Set up monitoring alerts
- [ ] Test all 32 tools in production
- [ ] Performance tuning
- [ ] Documentation update

**Infrastructure as Code (Bicep):**
```bicep
resource functionApp 'Microsoft.Web/sites@2023-01-01' = {
  name: 'func-xpr-cli-${uniqueString(resourceGroup().id)}'
  location: 'eastus2'
  kind: 'functionapp,linux'
  properties: {
    siteConfig: {
      linuxFxVersion: 'PYTHON|3.11'
      appSettings: [
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'custom'
        }
        {
          name: 'NODE_VERSION'
          value: '18'
        }
        {
          name: 'PROTON_CLI_VERSION'
          value: '0.1.95'
        }
      ]
    }
  }
}
```

---

## 🔧 Technical Specifications

### Runtime Environment

**Python Requirements:**
```txt
fastmcp>=1.22.0
httpx>=0.27.2
pydantic>=2.0
azure-identity>=1.19.0
azure-functions>=1.20.0
```

**Node.js Requirements:**
```json
{
  "dependencies": {
    "@proton/cli": "0.1.95"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**Startup Script (startup.sh):**
```bash
#!/bin/bash
# Install Node.js if not present
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# InstTest with func start locally
- [ ] Verify Proton CLI works in container
- [ ] Test all 3 tools via HTTP
- [ ] Fix any issues
- [ ] Document problems in CHANGES.md

---

#### Phase 5: Azure Deployment
**Status:** PENDING  
**Duration:** 1 day  
**Goal:** Deploy to 'sama' resource group

**Deployment Tasks:**
- [ ] Create Function App in 'sama' resource group
- [ ] Configure Node.js installation
- [ ] Deploy Proton CLI
- [ ] **IMPORTANT:** Handle auth configuration carefully (caused issues before)
- [ ] Enable CORS (like experiment_02)
- [ ] Test all 3 tools in cloud
- [ ] Document any auth issues in CHANGES.md

### CLI Adapter Architecture

**File: src/adapters/cli_adapter.py**

```python
"""
Proton CLI adapter for Azure Functions MCP Server.

Handles subprocess execution, error handling, and response parsing.
"""

import subprocess
import json
import asyncio
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

@dataclass
class CLIResult:
    """Result from CLI execution."""
    success: bool
    data: Optional[Dict[str, Any]]
    error: Optional[str]
    stdout: str
    stderr: str
    exit_code: int
    execution_time: float

class ProtonCLIAdapter:
    """Adapter for executing Proton CLI commands."""
    
    def __init__(
        self,
        cli_path: str = "proton",
        timeout: int = 30,
        retries: int = 3
    ):
        self.cli_path = cli_path
        self.timeout = timeout
        self.retries = retries
    
    async def execute(
        self,
        command: str,
        *args,
        json_output: bool = True
    ) -> CLIResult:
        """
        Execute Proton CLI command.
        
        Args:
            command: CLI command (e.g., "account", "block")
            *args: Command arguments
            json_output: Add --json flag
        
        Returns:
            CLIResult with parsed data or error
        """
        # Build command
        cmd_args = [self.cli_path, command, *args]
        if json_output:
            cmd_args.append("--json")
        
        # Execute with retry
        for attempt in range(self.retries):
            try:
                result = await self._run_subprocess(cmd_args)
                return result
            except subprocess.TimeoutExpired:
                if attempt == self.retries - 1:
                    return CLIResult(
                        success=False,
                        data=None,
                        error="CLI timeout",
                        stdout="",
                        stderr="",
                        exit_code=-1,
                        execution_time=self.timeout
                    )
                await asyncio.sleep(1)
    
    async def _run_subprocess(self, cmd: List[str]) -> CLIResult:
        """Run subprocess and parse result."""
        import time
        start = time.time()
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await asyncio.wait_for(
            process.communicate(),
            timeout=self.timeout
        )
        
        execution_time = time.time() - start
        
        stdout_str = stdout.decode()
        stderr_str = stderr.decode()
        
        if process.returncode == 0:
            try:
                data = json.loads(stdout_str)
                return CLIResult(
                    success=True,
                    data=data,
                    error=None,
                    stdout=stdout_str,
                    stderr=stderr_str,
                    exit_code=0,
                    execution_time=execution_time
                )
            except json.JSONDecodeError:
                # Not JSON, return raw stdout
                return CLIResult(
                    success=True,
                    data={"raw": stdout_str},
                    error=None,
                    stdout=stdout_str,
                    stderr=stderr_str,
                    exit_code=0,
                    execution_time=execution_time
                )
        else:
            return CLIResult(
                success=False,
                data=None,
                error=stderr_str or "CLI command failed",
                stdout=stdout_str,
                stderr=stderr_str,
                exit_code=process.returncode,
                execution_time=execution_time
            )
```

---

### Tool Implementation Pattern

**Example: get_account tool**

```python
from fastmcp import FastMCP
from src.adapters.cli_adapter import ProtonCLIAdapter

mcp = FastMCP("XPR Proton CLI MCP Server")
cli = ProtonCLIAdapter()

@mcp.tool()
async def get_account(account_name: str) -> str:
    """
    Get Proton account information.
    
    Args:
        account_name: Proton account name (e.g., 'zenpunk')
    
    Returns:
        Formatted account data with resources, permissions, voting
    """
    # Validate input
    if not validate_account_name(account_name):
        raise ValueError(f"Invalid account name: {account_name}")
    
    # Execute CLI
    result = await cli.execute("account", account_name)
    
    if not result.success:
        raise RuntimeError(f"CLI error: {result.error}")
    
    # Format response
    account = result.data
    formatted = f"""
Account: {account['account_name']}
Created: {account['created']}

Resources:
  CPU: {account['cpu_limit']['used']}/{account['cpu_limit']['max']} μs
  NET: {account['net_limit']['used']}/{account['net_limit']['max']} bytes
  RAM: {account['ram_usage']}/{account['ram_quota']} bytes

Permissions:
"""
    for perm in account['permissions']:
        formatted += f"  - {perm['perm_name']}: {perm['required_auth']}\n"
    
    return formatted
```

---

## 📁 Repository Structure

```
/workspaces/XPR/agentic_dev/experiment_03/
├── agent.md                          # This file - Master plan
├── MIGRATION_PLAN.md                 # Step-by-step migration guide
├── TOOL_MAPPING.md                   # CLI commands → MCP tools
├── ENVIRONMENT_SETUP.md              # Dual runtime configuration
├── DEPLOYMENT_GUIDE.md               # Azure deployment procedures
├── TESTING_STRATEGY.md               # Test plans and scenarios
│
├── mcp-server/                       # Main server code
│   ├── server.py                     # FastMCP entrypoint
│   ├── host.json                     # Azure Functions config
│   ├── local.settings.json           # Local dev settings
│   ├── requirements.txt              # Python dependencies
│   ├── package.json                  # Node.js dependencies (Proton CLI)
│   ├── startup.sh                    # Deployment startup script
│   │
│   ├── src/
│   │   ├── __init__.py
│   │   │
│   │   ├── adapters/
│   │   │   ├── __init__.py
│   │   │   └── cli_adapter.py       # Subprocess CLI wrapper
│   │   │
│   │   ├── tools/
│   │   │   ├── __init__.py
│   │   │   ├── account_tools.py     # 2 tools
│   │   │   ├── chain_tools.py       # 3 tools
│   │   │   ├── table_tools.py       # 2 tools
│   │   │   ├── contract_tools.py    # 2 tools
│   │   │   ├── transaction_tools.py # 4 tools
│   │   │   ├── key_tools.py         # 3 tools
│   │   │   ├── network_tools.py     # 3 tools
│   │   │   ├── producer_tools.py    # 3 tools
│   │   │   ├── lending_tools.py     # 5 tools
│   │   │   └── nft_tools.py         # 5 tools
│   │   │
│   │   ├── utils/
│   │   │   ├── __init__.py
│   │   │   ├── validation.py        # Input validation
│   │   │   ├── formatting.py        # Output formatting
│   │   │   ├── retry.py             # Retry logic
│   │   │   └── parsers.py           # JSON parsers
│   │   │
│   │   └── config/
│   │       ├── __init__.py
│   │       ├── cli_config.py        # CLI paths & settings
│   │       └── azure_config.py      # Azure configuration
│   │
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_cli_adapter.py      # CLI adapter tests
│   │   ├── test_account_tools.py    # Tool tests
│   │   ├── test_integration.py      # E2E tests
│   │   ├── fixtures/                # Test data
│   │   │   ├── cli_responses/       # Mock CLI outputs
│   │   │   └── test_accounts.json
│   │   └── conftest.py              # Pytest configuration
│   │
│   ├── infra/
│   │   ├── main.bicep               # Infrastructure as code
│   │   ├── resources.bicep          # Resource definitions
│   │   └── parameters.json          # Deployment parameters
│   │
│   └── docs/
│       ├── QUICK_START.md
│       ├── ARCHITECTURE.md
│       ├── API_REFERENCE.md
│       ├── TROUBLESHOOTIN (Minimal)

```
/workspaces/XPR/agentic_dev/experiment_03/
├── agent.md                          # This file - MVP vision
├── CHANGES.md                        # Track every change (CRITICAL)
│
├── mcp-server/                       # COPIED from experiment_02
│   ├── server.py                     # Modified: Replace weather with XPR tools
│   ├── host.json                     # Same as experiment_02
│   ├── local.settings.json           # Same as experiment_02
│   ├── requirements.txt              # Same as experiment_02
│   ├── package.json                  # NEW: Add @proton/cli
│   │
│   └── infra/                        # Same as experiment_02
│       ├── main.bicep
│       └── resources.bicep
│
└── docs/
    ├── README.md                     # Quick start
    └── TROUBLESHOOTING.md            # Issues encountered
```

**Key Principle:** Keep it simple. Copy experiment_02, modify minimally. Risk 4: Large Response Payloads
**Probability:** Medium  
**Impact:** Medium  
**Risk:** Some queries (tables, NFTs) return megabytes

**Mitigation:**
- Implement pagination for large results
- Add response size limits
- Stream large responses
- Warn users about large queries
- Cache expensive queries

---

## 📊 Monitoring & Observability

### Application Insights Metrics

**Custom Metrics to Track:**
- CLI execution time (by command)
- Subprocess success rate
- Error rate by tool
- Response payload size
- Retry attempts
- Cold start duration
- Node.js installation time

**Alerts to Configure:**
- CLI error rate > 5%
- P95 latency > 3 seconds
- Function errors > 10/hour
- Cold start > 10 seconds

---

## 🔐 Security Considerations

### CLI Execution Security
- **Input Validation:** Sanitize all CLI arguments
- **Command Injection:** Use parameterized subprocess calls
- **Resource Limits:** Timeout all CLI executions
- **Output Sanitization:** Filter sensitive data from logs

### Authentication
- OAuth 2.0 for MCP clients
- Azure Managed Identity for service-to-service
- Rate limiting per client
- Audit logging

---

## ✅ Definition of Done

### Phase Complete When:
- [ ] All phase tools implemented
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] Documentation updated
- [ ] Local testing successful
- [ ] Code reviewed
- [ ] No critical bugs
- [ ] Performance targets met
 (MVP)

### Performance Targets (Relaxed for MVP)
- **Cold Start:** < 10 seconds (acceptable for PoC)
- **Warm Latency:** < 2 seconds per tool
- **CLI Execution:** < 1 second

### Reliability Targets (Relaxed for MVP)
- **Works:** Gets valid data
- **Error Handling:** Returns error message (not crash)

### Quality Targets (Minimal for MVP)
- **Documentation:** Every change in CHANGES.md
- **Testing:** Manual testing acceptable
- **Code Quality:** Working > Perfectsential  
✅ Test early and often  

### From Experiment 02:
✅ Azure Functions deployment is smooth  
✅ FastMCP framework is solid  
✅ Bicep IaC is maintainable  
✅ CORS/auth configuration matters  

### New for Experiment 03:
🆕 Dual runtime environment (Python + Node.js)  
🆕 Subprocess management in serverless  
🆕 CLI wrapper pattern at scale  
🆕 Hybrid architecture approach  

---

## 📞 Next Steps

### Today (Phase 0):
1. ✅ Create agent.md (this file)
2. ⏳ Create MIGRATION_PLAN.md
3. ⏳ Create TOOL_MAPPING.md
4. ⏳ Create ENVIRONMENT_SETUP.md
5. ⏳ Create DEPLOYMENT_GUIDE.md
6. ⏳ Create TESTING_STRATEGY.md

### Tomorrow (Phase 1 Start):
1. Copy experiment_02 base infrastructure
2. Add Node.js + Proton CLI to deployment
3. Create CLI adapter module
4. Implement first tool (get_account)
5. Test locally
6. Iterate

### Week 1 Goal:
- Phase 1 complete (5 tools)
- Local testing successful
- Deployment package validated

---

**Status:** Phase 0 - Planning & Architecture Design 🏗️  
**Next Milestone:** Complete all planning documents by EOD  
**Blocker:** None  
**Risk Level:** Low (proven components, clear path)

*Last Updated: December 25, 2025*
 (MVP)

### MVP Complete When:
- [ ] 3 tools work locally (get_account, get_chain_info, get_block)
- [ ] 3 tools work deployed on Azure ('sama' resource group)
- [ ] GitHub Copilot can call them
- [ ] Auth configuration stable (no breaking issues)
- [ ] All changes documented in CHANGES.md
- [ ] Can be replicated by another developer

### Future Work (After MVP):
- Expand to more tools
- Add proper tests
- Optimize performance
- Production hardening (Incremental)

### Right Now:
1. ✅ Create agent.md (this file) - DONE
2. ⏳ Create CHANGES.md - Track every modification
3. ⏳ Copy experiment_02 to experiment_03/mcp-server
4. ⏳ Test that copied version still works

### Phase 1 (Next):
1. Remove weather tools from server.py → [CHANGES.md](./CHANGES.md) #004
2. Add minimal CLI executor code → [CHANGES.md](./CHANGES.md) #005
3. Implement get_account tool → [CHANGES.md](./CHANGES.md) #006
4. Test with: `proton account zenpunk` → [CHANGES.md](./CHANGES.md) #007
5. ⚠️ **Every single step documented in [CHANGES.md](./CHANGES.md)**

### Phase 2-5 (Later):
- Add get_chain_info
- Add get_block
- Test locally with func start
- Deploy to Azure
- Test with GitHub Copilot

---

**Status:** Phase 0 - Minimal Planning Complete 🏗️  
**Next Action:** Create CHANGES.md and copy experiment_02  
**Blocker:** None  
**Risk Level:** Low (small incremental changes)  
**Critical Note:** Auth was problematic - document auth changes carefully