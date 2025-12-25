# CI/CD Setup Instructions

Quick setup guide for the Azure Functions build and release pipeline.

## Quick Start (5 Minutes)

### Step 1: Create Azure Resources

Run these commands in Azure CLI:

```bash
# Login to Azure
az login

# Set variables (customize these)
RESOURCE_GROUP="xpr-mcp-rg"
LOCATION="eastus"
STORAGE_ACCOUNT="xprmcpstorage"
FUNCTION_APP_NAME="xpr-mcp-prod"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create storage account
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS

# Create function app
az functionapp create \
  --resource-group $RESOURCE_GROUP \
  --consumption-plan-location $LOCATION \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --name $FUNCTION_APP_NAME \
  --storage-account $STORAGE_ACCOUNT \
  --os-type Linux
```

### Step 2: Create Service Principal

```bash
# Get subscription ID
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

# Create service principal with contributor role
az ad sp create-for-rbac \
  --name "xpr-mcp-github-actions" \
  --role contributor \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP \
  --json-auth

# Save the output - you'll need these values:
# - clientId
# - tenantId
# - subscriptionId
```

### Step 3: Configure GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add these:

   | Secret Name | Value |
   |------------|-------|
   | `AZURE_CLIENT_ID` | clientId from service principal |
   | `AZURE_TENANT_ID` | tenantId from service principal |
   | `AZURE_SUBSCRIPTION_ID` | subscriptionId from service principal |
   | `AZURE_FUNCTIONAPP_NAME` | Your function app name (e.g., `xpr-mcp-prod`) |

### Step 4: Set Up Federated Credentials

```bash
# Get your GitHub repository info
GITHUB_ORG="your-github-org"
GITHUB_REPO="XPR"
APP_ID=$(az ad sp list --display-name "xpr-mcp-github-actions" --query "[0].appId" -o tsv)

# Create federated credential for main branch
az ad app federated-credential create \
  --id $APP_ID \
  --parameters '{
    "name": "xpr-mcp-main-branch",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:'$GITHUB_ORG'/'$GITHUB_REPO':ref:refs/heads/main",
    "audiences": ["api://AzureADTokenExchange"]
  }'

# Create federated credential for production environment
az ad app federated-credential create \
  --id $APP_ID \
  --parameters '{
    "name": "xpr-mcp-prod-env",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:'$GITHUB_ORG'/'$GITHUB_REPO':environment:production",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

### Step 5: Configure GitHub Environments

1. Go to **Settings** → **Environments**
2. Click **New environment**
3. Name it `production`
4. Optionally add protection rules:
   - Required reviewers
   - Wait timer
   - Deployment branches (restrict to `main`)

### Step 6: Test the Pipeline

```bash
# Push a small change to trigger the pipeline
git checkout main
git pull
echo "# Pipeline Test" >> PIPELINE_TEST.md
git add PIPELINE_TEST.md
git commit -m "Test pipeline deployment"
git push origin main
```

Watch the deployment in the **Actions** tab!

## Verification

After deployment completes, test your function:

```bash
# Get function app URL
FUNCTION_URL="https://$FUNCTION_APP_NAME.azurewebsites.net"

# Test the API
curl "$FUNCTION_URL/api/getChainInfo"

# Should return blockchain information
```

## Optional: Staging Environment

For a staging environment, repeat Step 1 with different names:

```bash
FUNCTION_APP_NAME_STAGING="xpr-mcp-staging"

az functionapp create \
  --resource-group $RESOURCE_GROUP \
  --consumption-plan-location $LOCATION \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --name $FUNCTION_APP_NAME_STAGING \
  --storage-account $STORAGE_ACCOUNT \
  --os-type Linux
```

Add GitHub secret:
- `AZURE_FUNCTIONAPP_NAME_STAGING` = `xpr-mcp-staging`

Create federated credential for staging:

```bash
az ad app federated-credential create \
  --id $APP_ID \
  --parameters '{
    "name": "xpr-mcp-staging-env",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:'$GITHUB_ORG'/'$GITHUB_REPO':environment:staging",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

## Troubleshooting

**Problem**: Pipeline fails with authentication error

**Solution**: Check that federated credentials are created correctly:
```bash
az ad app federated-credential list --id $APP_ID
```

**Problem**: Function app not found

**Solution**: Verify the function app name in GitHub secrets matches Azure:
```bash
az functionapp list --resource-group $RESOURCE_GROUP --query "[].name"
```

**Problem**: Deployment succeeds but functions don't work

**Solution**: Check function logs:
```bash
az webapp log tail --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP
```

## What's Next?

- 📖 Read [PIPELINE_GUIDE.md](./PIPELINE_GUIDE.md) for detailed documentation
- 🔒 Set up branch protection rules
- 📊 Configure Application Insights for monitoring
- 🚀 Set up staging environment for safer deployments

## Support

- Issues: Create a GitHub issue
- Azure Docs: https://docs.microsoft.com/azure/azure-functions/
- GitHub Actions: https://docs.github.com/actions
