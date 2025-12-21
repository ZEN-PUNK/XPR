# Azure MCP Integration

This directory contains the Azure integration for the XPR MCP Server, enabling cloud-native operations alongside Proton blockchain queries.

## Files

### Core Components

- **`src/adapters/azure-adapter.ts`** - Main Azure service adapter
  - OAuth 2.0 authentication with token caching
  - Azure Resource Manager client
  - Key Vault integration
  - Blob Storage operations

- **`src/tools/azure-tools.ts`** - MCP tool definitions
  - 8 Azure tools for resource management, secrets, and storage
  - Wraps Azure adapter functionality
  - MCP-compliant interface

- **`src/config/azure-config.ts`** - Configuration management
  - Load credentials from environment variables
  - Validate configuration
  - Helper functions for setup

### Documentation

- **`AZURE_MCP_GUIDE.md`** - Comprehensive setup and usage guide
  - Step-by-step Azure service principal creation
  - Environment variable configuration
  - Tool descriptions with examples
  - Security best practices
  - Troubleshooting guide

- **`.env.azure.template`** - Environment variable template
  - Copy to `.env.azure` and fill in your credentials
  - Comments explain each variable
  - Setup instructions included

## Quick Start

### 1. Create Azure Service Principal

```bash
az login
az ad sp create-for-rbac --name "xpr-mcp-server"
```

Save the output - you'll need it for environment variables.

### 2. Configure Environment

```bash
cp .env.azure.template .env.azure
# Edit .env.azure with your credentials
source .env.azure
```

### 3. Start Server

```bash
npm start
```

The Azure tools will automatically load if credentials are configured.

## Available Tools

### Resource Management (4 tools)
- `list_azure_resources` - List all resources
- `get_azure_resource` - Get specific resource
- `create_azure_resource` - Create or update resource
- `delete_azure_resource` - Delete resource

### Key Vault (2 tools)
- `get_azure_secret` - Retrieve secret
- `set_azure_secret` - Store secret

### Blob Storage (2 tools)
- `upload_azure_blob` - Upload file
- `download_azure_blob` - Download file

## Architecture

```
MCP Server
  ├── Proton Tools (5)
  │   └── Blockchain operations
  │
  └── Azure Tools (8)
      ├── Resource Management (4)
      ├── Key Vault (2)
      └── Blob Storage (2)
```

## Integration Patterns

### Pattern 1: Secure Credential Storage
Query blockchain → Extract private keys → Store in Key Vault → Use for transactions

### Pattern 2: Data Archival
Export blockchain data → Encode to base64 → Upload to Blob Storage → Share via URL

### Pattern 3: Infrastructure Management
Provision API gateway → Create database → Store connection strings → Deploy blockchain service

## Security

- ✅ Credentials in environment variables (never committed)
- ✅ Token caching with expiration (30min default)
- ✅ Secrets not echoed in responses
- ✅ HTTPS for all Azure API calls
- ✅ Bearer token authentication

## Configuration

Required environment variables:
- `AZURE_TENANT_ID` - Azure AD tenant
- `AZURE_CLIENT_ID` - Service principal app ID
- `AZURE_CLIENT_SECRET` - Service principal password
- `AZURE_SUBSCRIPTION_ID` - Azure subscription
- `AZURE_RESOURCE_GROUP` - Resource group name
- `AZURE_KEY_VAULT_NAME` - Key Vault name
- `AZURE_STORAGE_ACCOUNT_NAME` - Storage account
- `AZURE_STORAGE_ACCOUNT_KEY` - Storage key

Optional:
- `AZURE_DEBUG` - Enable debug logging
- `AZURE_TOKEN_CACHE_TTL` - Token cache duration (seconds)
- `AZURE_API_TIMEOUT` - API timeout (milliseconds)

## Examples

### List Azure Resources

```bash
curl -X POST http://localhost:3000/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "list_azure_resources",
      "arguments": {}
    }
  }'
```

### Store a Secret

```bash
curl -X POST http://localhost:3000/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "set_azure_secret",
      "arguments": {
        "secret_name": "my-api-key",
        "secret_value": "secret-value-here"
      }
    }
  }'
```

### Upload to Blob Storage

```bash
curl -X POST http://localhost:3000/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "upload_azure_blob",
      "arguments": {
        "container_name": "data",
        "blob_name": "report.txt",
        "data": "SGVsbG8gV29ybGQ="
      }
    }
  }'
```

## Troubleshooting

### Azure tools not loading
1. Check environment variables: `env | grep AZURE_`
2. Verify configuration: `npm run test -- --testPathPattern=azure-config`
3. Check logs for initialization errors

### Authentication errors
1. Verify service principal is active: `az ad sp list --filter "displayname eq 'xpr-mcp-server'"`
2. Check credentials are correct
3. Verify subscription ID is valid

### Permission denied
1. Grant service principal role: `az role assignment create --assignee <app-id> --role Contributor`
2. Grant Key Vault access: `az keyvault set-policy --name <vault> --object-id <object-id> --secret-permissions get list set delete`

## Testing

```bash
# Run all tests
npm test

# Run Azure-specific tests
npm test -- --testPathPattern=azure

# Run with coverage
npm test -- --coverage
```

## References

- [Azure REST API](https://docs.microsoft.com/en-us/rest/api/azure/)
- [Azure Key Vault API](https://docs.microsoft.com/en-us/rest/api/keyvault/)
- [Azure Blob Storage API](https://docs.microsoft.com/en-us/rest/api/storageservices/blob-service-rest-api)
- [Azure SDK for JavaScript](https://github.com/Azure/azure-sdk-for-js)

## Support

For issues with Azure integration:
1. Check `AZURE_MCP_GUIDE.md` troubleshooting section
2. Enable debug logging: `AZURE_DEBUG=true`
3. Review Azure service status at [status.azure.com](https://status.azure.com)
