# XPR MCP Server - Deployment Information

## 🚀 Deployment Summary

**Environment:** sama-mcp  
**Region:** East US 2  
**Resource Group:** AZURE-RESOURCE-GROUP  
**Deployment Date:** December 25, 2024  
**Last Updated:** December 25, 2024 16:00 UTC  
**Status:** ✅ Active (Production)
**Current Version:** v1.1.0 (RPC Failover)

---

## 📍 Endpoints

### MCP Server Endpoint
```
https://YOUR-FUNCTION-APP.azurewebsites.net/mcp
```

### Proton RPC Endpoints (Automatic Failover)
```
1. https://proton.greymass.com      (primary)
2. https://api.protonchain.com      (backup #1)
3. https://proton.cryptolions.io    (backup #2)
4. https://proton.eosusa.io         (backup #3)
```

### Function App
```
https://YOUR-FUNCTION-APP.azurewebsites.net/
```

---

## 🏗️ Azure Resources

| Resource Type | Resource Name | Purpose |
|--------------|---------------|---------|
| Resource Group | `AZURE-RESOURCE-GROUP` | Container for all resources |
| Function App | `AZURE-FUNCTION-APP-NAME` | Hosts the MCP server |
| Storage Account | `sthk6er2km4y6bi` | Function app storage |
| App Service Plan | `plan-hk6er2km4y6bi` | Flex Consumption SKU |
| Application Insights | `appi-hk6er2km4y6bi` | Monitoring & telemetry |
| Log Analytics | `log-hk6er2km4y6bi` | Log aggregation |
| Virtual Network | `vnet-hk6er2km4y6bi` | Network isolation |
| Private Endpoint | `blob-private-endpoint` | Secure blob access |

---

## 🔧 Configuration

### Environment Variables
```bash
ANONYMOUS_SERVER_AUTH="true"
AUTH_ENABLED="false"
AZURE_ENV_NAME="sama-mcp"
AZURE_FUNCTION_NAME="AZURE-FUNCTION-APP-NAME"
AZURE_LOCATION="eastus2"
AZURE_SUBSCRIPTION_ID="AZURE-SUBSCRIPTION-ID"
SERVICE_MCP_DEFAULT_HOSTNAME="AZURE-FUNCTION-APP-NAME.azurewebsites.net"
```

### Authentication
- **Mode:** Anonymous (no login required)
- **AUTH_ENABLED:** false
- **ANONYMOUS_SERVER_AUTH:** true

---

## 🛠️ Available MCP Tools (15 Total)

### Phase 1: Core Chain Tools (4 tools) ✅

#### 1. get_chain_info
**Description:** Get current Proton blockchain state and network configuration  
**RPC Endpoint:** `POST /v1/chain/get_info`  
**Parameters:** None  
**Returns:** Chain ID, head block, last irreversible block, server version

#### 2. get_block
**Description:** Get detailed information about a specific block  
**RPC Endpoint:** `POST /v1/chain/get_block`  
**Parameters:**
- `block_num_or_id` (string): Block number or block ID hash

#### 3. get_currency_balance
**Description:** Get token balance for an account  
**RPC Endpoint:** `POST /v1/chain/get_currency_balance`  
**Parameters:**
- `code` (string): Token contract (e.g., "eosio.token")
- `account` (string): Account name
- `symbol` (string, optional): Token symbol filter

#### 4. get_table_rows
**Description:** Universal smart contract state query - read any table  
**RPC Endpoint:** `POST /v1/chain/get_table_rows`  
**Parameters:**
- `code` (string): Contract account name
- `table` (string): Table name
- `scope` (string): Data partition/namespace
- `limit` (number, optional): Max rows (default: 100)
- `lower_bound` (string, optional): Start reading from this key
- `upper_bound` (string, optional): Stop reading at this key

---

### Phase 2: Account & Token Tools (4 tools) ✅

#### 5. get_account
**Description:** Get comprehensive Proton account information  
**RPC Endpoint:** `POST /v1/chain/get_account`  
**Parameters:**
- `account_name` (string): Proton account name

**Tested Accounts:**
- ✅ `zenpunk` - Active voter with WebAuthn keys
- ✅ `merkabahnk` - WebAuthn enabled account
- ✅ `samatoken` - Smart contract account
- ❌ `cheronimo` - Non-existent (error handling validated)

#### 6. get_account_resources
**Description:** Get CPU, NET, and RAM resource usage and limits  
**Parameters:**
- `account_name` (string): Proton account name

#### 7. get_currency_stats
**Description:** Get token supply statistics (max supply, current supply, issuer)  
**RPC Endpoint:** `POST /v1/chain/get_currency_stats`  
**Parameters:**
- `code` (string): Token contract
- `symbol` (string): Token symbol

#### 8. get_table_by_scope
**Description:** List all scopes (data partitions) for a table  
**RPC Endpoint:** `POST /v1/chain/get_table_by_scope`  
**Parameters:**
- `code` (string): Contract account name
- `table` (string): Table name
- `limit` (number, optional): Max scopes (default: 100)

#### 9. get_abi
**Description:** Get smart contract ABI (Application Binary Interface)  
**RPC Endpoint:** `POST /v1/chain/get_abi`  
**Parameters:**
- `account_name` (string): Contract account name

---

### Phase 3: DeFi Tools (5 tools) ✅

#### 10. get_lending_markets
**Description:** Get all MetalX lending markets with rates and liquidity  
**Parameters:** None  
**Returns:** 16 lending markets (LXPR, LUSDC, LBTC, etc.)

#### 11. get_oracle_prices
**Description:** Get current oracle prices for all supported tokens  
**Parameters:**
- `symbols` (string, optional): Comma-separated list to filter

#### 12. get_lending_position
**Description:** Get detailed MetalX lending position for an account  
**Parameters:**
- `account_name` (string): Proton account name

#### 13. get_swap_pools
**Description:** Get all liquidity pools from Proton Swaps DEX  
**Parameters:** None  
**Returns:** 28 liquidity pools with reserves and fees

#### 14. get_pool_by_pair
**Description:** Get specific pool by token pair symbols  
**Parameters:**
- `token0_symbol` (string): First token symbol (e.g., "XPR")
- `token1_symbol` (string): Second token symbol (e.g., "XUSDC")

---

### Legacy Tool

#### 15. get_user_info
**Description:** Demonstrate Azure AD token exchange (requires authentication)  
**Implementation:** Microsoft Graph API via On-Behalf-Of flow  
**Parameters:** None

**Note:** Requires authenticated MCP session with Azure AD token

---

## 📊 Tool Statistics

- **Total Tools:** 15
- **Phase 1 (Core Chain):** 4 tools ✅
- **Phase 2 (Account/Token):** 4 tools ✅
- **Phase 3 (DeFi):** 5 tools ✅
- **Phase 4 (Advanced):** 18 tools ⏳ (pending)
- **Legacy:** 1 tool
- **Migration Progress:** 43.8% (14/32 blockchain tools)

---

## 🏗️ Architecture

### How It Works

```
MCP Client (VS Code/Copilot)
        ↓ HTTPS + SSE
Azure Function App (Python 3.12)
        ↓ FastMCP Framework
httpx Async HTTP Client
        ↓ HTTPS POST
Greymass RPC Endpoint
        ↓ JSON Response
Proton Blockchain
```

**Key Features:**
- ✅ **Direct RPC Integration** - No subprocess overhead
- ✅ **Single Runtime** - Python only (no Node.js needed)
- ✅ **Fast Response** - ~200-300ms average
- ✅ **Simple Deployment** - Small package size
- ✅ **Production Ready** - Uses Greymass public RPC

**Why Not Proton CLI?**
The original plan was to use subprocess execution to call the Proton CLI, but we pivoted to direct RPC API calls because:
- Simpler architecture (no dual runtime)
- Faster execution (no subprocess overhead)
- Smaller deployment package
- Proton CLI uses the same RPC endpoints anyway

**RPC Endpoint:**
```python
PROTON_RPC_ENDPOINT = "https://proton.greymass.com"
```

This is the same endpoint used by the Proton CLI internally (verified in `/workspaces/XPR/proton-cli/src/constants.ts`).

---

## 🚀 Deployment Commands

### Initial Deployment
```bash
cd /workspaces/XPR/agentic_dev/experiment_03/mcp-server

# Create new environment
azd env new sama-mcp

# Configure environment
azd env set AZURE_LOCATION eastus2
azd env set ANONYMOUS_SERVER_AUTH true

# Deploy (provision + deploy)
azd up --no-prompt
```

### Redeployment (Code Changes Only)
```bash
cd /workspaces/XPR/agentic_dev/experiment_03/mcp-server
azd deploy
```

### View Environment Values
```bash
cd /workspaces/XPR/agentic_dev/experiment_03/mcp-server
azd env get-values
```

---

## 📊 Monitoring

### Application Insights
```
InstrumentationKey: be911acd-658a-45af-b937-ece3f8b8ad13
ApplicationId: f0579508-8b5b-477f-8a76-06865c35065b
```

### Azure Portal Links
- **Resource Group:** [AZURE-RESOURCE-GROUP](https://portal.azure.com/#resource/subscriptions/AZURE-SUBSCRIPTION-ID/resourceGroups/AZURE-RESOURCE-GROUP)
- **Function App:** [AZURE-FUNCTION-APP-NAME](https://portal.azure.com/#resource/subscriptions/AZURE-SUBSCRIPTION-ID/resourceGroups/AZURE-RESOURCE-GROUP/providers/Microsoft.Web/sites/AZURE-FUNCTION-APP-NAME)
- **Application Insights:** Monitor logs, metrics, and performance

---

## 🧪 Testing the Deployment

### Test MCP Endpoint (Basic)
```bash
curl https://YOUR-FUNCTION-APP.azurewebsites.net/mcp
```

Expected: Error about content type (server is running)

### Test with MCP Client
Use the MCP Inspector or configure your MCP client:
```json
{
  "mcpServers": {
    "xpr-blockchain": {
      "url": "https://YOUR-FUNCTION-APP.azurewebsites.net/mcp"
    }
  }
}
```

---

## 📝 Next Steps

1. **Add More Tools:**
   - `get_chain_info`: Query Proton blockchain info
   - `get_block`: Get block data by block number

2. **Test with MCP Clients:**
   - Configure Claude Desktop or other MCP clients
   - Test `get_account` tool with various account names

3. **Monitoring:**
   - Check Application Insights for usage patterns
   - Monitor function execution times
   - Review logs for errors

4. **Optimization:**
   - Consider adding response caching
   - Optimize Proton CLI subprocess execution
   - Add error handling for edge cases

---

## 🔗 Related Documentation

- **[agent.md](./agent.md)** - Overall architecture and strategy
- **[AGENT_PROMPT.md](./AGENT_PROMPT.md)** - Implementation guide
- **[CHANGES.md](./CHANGES.md)** - Detailed change log
- **[mcp-server/README.md](./mcp-server/README.md)** - Server documentation

---

## ⚡ Quick Reference

**Resource Group:** `AZURE-RESOURCE-GROUP`  
**MCP Endpoint:** `https://YOUR-FUNCTION-APP.azurewebsites.net/mcp`  
**Region:** East US 2  
**Auth:** Anonymous (enabled)  
**Tools:** get_account, get_user_info  

**Deployment Time:** ~5 minutes  
**Status:** ✅ Active and working
