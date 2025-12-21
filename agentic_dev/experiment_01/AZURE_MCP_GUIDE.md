# Azure MCP Integration Guide

## Overview

The Azure MCP integration enables agents to interact with Azure services including:
- **Azure Resource Manager** - Manage cloud resources (compute, storage, networking)
- **Azure Key Vault** - Secure credential and secret management
- **Azure Blob Storage** - File upload/download operations

## Setup Instructions

### 1. Azure Service Principal Setup

Create an Azure Service Principal with appropriate permissions:

```bash
# Login to Azure
az login

# Create a service principal
az ad sp create-for-rbac --name "xpr-mcp-server" --role Contributor

# This will output:
# {
#   "appId": "00000000-0000-0000-0000-000000000000",
#   "displayName": "xpr-mcp-server",
#   "password": "your-client-secret",
#   "tenant": "your-tenant-id"
# }
```

### 2. Environment Variables

Create a `.env.azure` file with your credentials:

```bash
# Azure Authentication
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-app-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_SUBSCRIPTION_ID=your-subscription-id

# Azure Resources
AZURE_RESOURCE_GROUP=your-resource-group
AZURE_KEY_VAULT_NAME=your-keyvault-name
AZURE_STORAGE_ACCOUNT_NAME=your-storage-account
AZURE_STORAGE_ACCOUNT_KEY=your-storage-key
```

Load the environment variables before starting the server:

```bash
source .env.azure
npm start
```

### 3. Azure Resources Required

#### Resource Group
```bash
az group create \
  --name your-resource-group \
  --location eastus
```

#### Key Vault
```bash
az keyvault create \
  --name your-keyvault-name \
  --resource-group your-resource-group \
  --location eastus
```

#### Storage Account
```bash
az storage account create \
  --name yourstorageaccount \
  --resource-group your-resource-group \
  --location eastus \
  --sku Standard_LRS
```

### 4. Grant Service Principal Permissions

```bash
# Grant Key Vault access
az keyvault set-policy \
  --name your-keyvault-name \
  --object-id <service-principal-object-id> \
  --secret-permissions get list set delete

# Grant Storage access
az role assignment create \
  --assignee <service-principal-app-id> \
  --role "Storage Blob Data Contributor" \
  --scope /subscriptions/<subscription-id>/resourceGroups/<resource-group>
```

## Available Tools

### Resource Management

#### `list_azure_resources`
List all resources in the resource group.

**Input:** None required

**Output:**
```json
{
  "success": true,
  "data": [
    {
      "id": "/subscriptions/.../resourceGroups/my-group/providers/Microsoft.Storage/storageAccounts/myaccount",
      "name": "myaccount",
      "type": "Microsoft.Storage/storageAccounts",
      "location": "eastus"
    }
  ],
  "count": 1
}
```

#### `get_azure_resource`
Get details of a specific resource.

**Input:**
```json
{
  "resource_name": "myaccount",
  "resource_type": "Microsoft.Storage/storageAccounts"
}
```

#### `create_azure_resource`
Create or update an Azure resource.

**Input:**
```json
{
  "resource_name": "mystorageaccount",
  "resource_type": "Microsoft.Storage/storageAccounts",
  "properties": {
    "kind": "StorageV2",
    "sku": {
      "name": "Standard_LRS"
    }
  },
  "location": "eastus"
}
```

#### `delete_azure_resource`
Delete an Azure resource.

**Input:**
```json
{
  "resource_name": "myaccount",
  "resource_type": "Microsoft.Storage/storageAccounts"
}
```

### Key Vault

#### `get_azure_secret`
Retrieve a secret from Key Vault.

**Input:**
```json
{
  "secret_name": "database-password"
}
```

**Output:**
```json
{
  "success": true,
  "secret_name": "database-password",
  "message": "Secret retrieved successfully"
}
```

#### `set_azure_secret`
Store a secret in Key Vault.

**Input:**
```json
{
  "secret_name": "database-password",
  "secret_value": "secure-password-123"
}
```

### Blob Storage

#### `upload_azure_blob`
Upload a file to Blob Storage.

**Input:**
```json
{
  "container_name": "documents",
  "blob_name": "report.pdf",
  "data": "base64-encoded-file-content"
}
```

**Output:**
```json
{
  "success": true,
  "url": "https://mystorageaccount.blob.core.windows.net/documents/report.pdf",
  "container": "documents",
  "blob": "report.pdf"
}
```

#### `download_azure_blob`
Download a file from Blob Storage.

**Input:**
```json
{
  "container_name": "documents",
  "blob_name": "report.pdf"
}
```

**Output:**
```json
{
  "success": true,
  "data": "base64-encoded-file-content",
  "container": "documents",
  "blob": "report.pdf",
  "size": 12345
}
```

## Example Agent Workflows

### Workflow 1: Store Blockchain Credentials in Key Vault

```javascript
// Agent:
"I need to securely store blockchain private keys"

// Steps:
1. Call set_azure_secret with name="blockchain-private-key"
2. Store in Key Vault for later retrieval
3. Blockchain operations retrieve key via get_azure_secret
```

### Workflow 2: Archive Blockchain Data to Storage

```javascript
// Agent:
"Export blockchain transaction history and archive to cloud"

// Steps:
1. Query blockchain using Proton tools (get_chain_info)
2. Serialize transaction data to JSON
3. Encode as base64
4. Call upload_azure_blob to store in Blob Storage
5. Return shareable URL
```

### Workflow 3: Manage Infrastructure as Code

```javascript
// Agent:
"Provision API gateway and database for blockchain service"

// Steps:
1. Call create_azure_resource for API Management service
2. Call create_azure_resource for Cosmos DB
3. Store connection strings via set_azure_secret
4. Return deployment summary
```

## Error Handling

All tools return standardized error responses:

```json
{
  "success": false,
  "error": "Detailed error message"
}
```

Common errors:
- **Authentication Failed** - Check credentials and permissions
- **Resource Not Found** - Verify resource name and type
- **Insufficient Permissions** - Grant service principal appropriate role
- **Network Error** - Check Azure connectivity

## Security Best Practices

1. **Never commit `.env` files** - Use `.env.azure` pattern with `.gitignore`
2. **Rotate credentials regularly** - Azure recommends quarterly rotation
3. **Use managed identities when possible** - Reduces credential management
4. **Monitor secret access** - Enable Azure Key Vault audit logging
5. **Restrict storage access** - Use network rules and firewalls
6. **Enable data encryption** - Use TDE for databases, encryption at rest for storage

## Integration with Proton Blockchain

The Azure integration complements Proton blockchain tools:

```
┌─────────────────────────────────────────────────────────────┐
│                      MCP Server                              │
├─────────────────────┬───────────────────────────────────────┤
│ Proton Tools        │ Azure Tools                            │
├─────────────────────┼───────────────────────────────────────┤
│ • get_account       │ • list_azure_resources                 │
│ • get_chain_info    │ • get_azure_resource                   │
│ • get_block         │ • create_azure_resource                │
│ • Query blockchain  │ • set_azure_secret (store keys)        │
│                     │ • upload_azure_blob (archive data)     │
└─────────────────────┴───────────────────────────────────────┘
```

Combined capabilities:
- Query blockchain data
- Store sensitive keys in Key Vault
- Archive results to Blob Storage
- Manage infrastructure via Resource Manager

## Testing Azure Integration

```bash
# Test configuration loading
npm test -- --testPathPattern=azure-config

# Test adapter functionality
npm test -- --testPathPattern=azure-adapter

# Test MCP tools
npm test -- --testPathPattern=azure-tools
```

## Troubleshooting

### "Missing AZURE_TENANT_ID"
Ensure environment variables are loaded:
```bash
source .env.azure
echo $AZURE_TENANT_ID
```

### "Authentication Failed: Invalid credentials"
Verify service principal credentials:
```bash
az login --service-principal \
  -u $AZURE_CLIENT_ID \
  -p $AZURE_CLIENT_SECRET \
  --tenant $AZURE_TENANT_ID
```

### "Resource not found"
List available resources:
```bash
az resource list --resource-group $AZURE_RESOURCE_GROUP
```

### "Permission denied for Key Vault"
Check service principal has policy:
```bash
az keyvault show --name $AZURE_KEY_VAULT_NAME
az keyvault list-policies --name $AZURE_KEY_VAULT_NAME
```

## References

- [Azure SDK for JavaScript](https://github.com/Azure/azure-sdk-for-js)
- [Azure REST API Documentation](https://docs.microsoft.com/en-us/rest/api/azure/)
- [Azure Key Vault Best Practices](https://docs.microsoft.com/en-us/azure/key-vault/general/best-practices)
- [Azure Storage Security](https://docs.microsoft.com/en-us/azure/storage/common/storage-security-guide)
