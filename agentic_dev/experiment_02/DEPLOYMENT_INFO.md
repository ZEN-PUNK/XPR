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
AZURE_SUBSCRIPTION_ID="<YOUR_SUBSCRIPTION_ID>"
SERVICE_MCP_DEFAULT_HOSTNAME="AZURE-FUNCTION-APP-NAME.azurewebsites.net"
```

### Authentication
- **Mode:** Anonymous (no login required)
- **AUTH_ENABLED:** false
- **ANONYMOUS_SERVER_AUTH:** true

---

## 🛠️ Available MCP Tools

### 1. get_account
**Description:** Get Proton blockchain account information  
**Implementation:** Direct RPC API call with automatic failover across 4 endpoints  
**RPC Endpoint:** `POST /v1/chain/get_account` (tries all 4 endpoints in sequence)  
**Failover Logic:** Automatically retries next endpoint if one fails  
**Parameters:**
- `account_name` (string): The Proton account name to query (e.g., "zenpunk")

**Resilience Features:**
- ✅ Automatic failover across 4 RPC endpoints
- ✅ Detailed error reporting showing which endpoint failed
- ✅ 10-second timeout per endpoint
- ✅ Returns first successful response

**Example MCP Call:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "get_account",
    "arguments": {
      "account_name": "zenpunk"
    }
  },
  "id": 1
}
```

**Example Response:**
```json
{
  "account_name": "zenpunk",
  "created": "2025-11-09T03:14:47.000",
  "ram_quota": 13399,
  "ram_usage": 7367,
  "permissions": [...],
  "voter_info": {
    "producers": ["eosusa", "protonnz", "protonuk", "xprcore"]
  }
}
```

**Tested Accounts:**
- ✅ `zenpunk` - Active voter with WebAuthn keys
- ✅ `merkabahnk` - WebAuthn enabled account
- ✅ `samatoken` - Smart contract account
- ❌ `cheronimo` - Non-existent (error handling validated)

### 2. get_user_info
**Description:** Demonstrate Azure AD token exchange (requires authentication)  
**Implementation:** Microsoft Graph API via On-Behalf-Of flow  
**Parameters:** None

**Note:** Requires authenticated MCP session with Azure AD token

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
- **Resource Group:** [AZURE-RESOURCE-GROUP](https://portal.azure.com/#resource/subscriptions/<YOUR_SUBSCRIPTION_ID>/resourceGroups/AZURE-RESOURCE-GROUP)
- **Function App:** [AZURE-FUNCTION-APP-NAME](https://portal.azure.com/#resource/subscriptions/<YOUR_SUBSCRIPTION_ID>/resourceGroups/AZURE-RESOURCE-GROUP/providers/Microsoft.Web/sites/AZURE-FUNCTION-APP-NAME)
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
