# Azure Functions Deployment Guide

This guide provides detailed instructions for deploying the XPR MCP Server to Azure Functions.

## Prerequisites

1. **Azure Account**: You need an active Azure subscription
2. **Azure CLI**: Install from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
3. **Azure Functions Core Tools**: Install version 4.x
   ```bash
   npm install -g azure-functions-core-tools@4
   ```
4. **Node.js**: Version 20.x or higher

## Option 1: Deploy Using Azure CLI

### Step 1: Login to Azure
```bash
az login
```

### Step 2: Create a Resource Group
```bash
az group create --name xpr-mcp-rg --location eastus
```

### Step 3: Create a Storage Account
```bash
az storage account create \
  --name xprmcpstorage \
  --resource-group xpr-mcp-rg \
  --location eastus \
  --sku Standard_LRS
```

### Step 4: Create a Function App
```bash
az functionapp create \
  --resource-group xpr-mcp-rg \
  --consumption-plan-location eastus \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --name xpr-mcp-functions \
  --storage-account xprmcpstorage \
  --os-type Linux
```

### Step 5: Deploy the Functions
```bash
cd /path/to/XPR
func azure functionapp publish xpr-mcp-functions
```

### Step 6: Configure Environment Variables (Optional)
```bash
az functionapp config appsettings set \
  --name xpr-mcp-functions \
  --resource-group xpr-mcp-rg \
  --settings XPR_ENDPOINT=https://proton.eoscafeblock.com
```

## Option 2: Deploy Using Azure Portal

### Step 1: Create Function App
1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource"
3. Search for "Function App" and select it
4. Click "Create"
5. Fill in the details:
   - **Subscription**: Select your subscription
   - **Resource Group**: Create new or use existing
   - **Function App name**: Choose a unique name (e.g., `xpr-mcp-functions`)
   - **Runtime stack**: Node.js
   - **Version**: 20 LTS
   - **Region**: Choose your preferred region
   - **Operating System**: Linux
   - **Plan type**: Consumption (Serverless)
6. Click "Review + create" then "Create"

### Step 2: Deploy Code
Using VS Code with Azure Functions extension:
1. Install the [Azure Functions extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurefunctions)
2. Open the XPR project in VS Code
3. Click the Azure icon in the sidebar
4. Sign in to Azure
5. Click "Deploy to Function App"
6. Select your Function App
7. Confirm deployment

Or using Azure Functions Core Tools:
```bash
func azure functionapp publish <your-function-app-name>
```

## Option 3: Deploy Using GitHub Actions

### Step 1: Get Publish Profile
1. Go to your Function App in Azure Portal
2. Click "Get publish profile" in the Overview section
3. Download the file

### Step 2: Add Secret to GitHub
1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Name: `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`
5. Value: Paste the contents of the publish profile file

### Step 3: Update Workflow File
Edit `.github/workflows/azure-functions-deploy.yml`:
- Update `AZURE_FUNCTIONAPP_NAME` with your Function App name

### Step 4: Push to Main Branch
```bash
git push origin main
```

The GitHub Action will automatically deploy your functions.

## Testing the Deployed Functions

After deployment, your functions will be available at:
```
https://<your-function-app-name>.azurewebsites.net/api/<function-name>
```

### Test Examples

```bash
# Get chain info
curl https://xpr-mcp-functions.azurewebsites.net/api/getChainInfo

# Get account
curl "https://xpr-mcp-functions.azurewebsites.net/api/getAccount?account_name=proton"

# Get balance
curl "https://xpr-mcp-functions.azurewebsites.net/api/getBalance?account=proton"

# Get block
curl "https://xpr-mcp-functions.azurewebsites.net/api/getBlock?block_num_or_id=1000"
```

## Monitoring and Logs

### View Logs in Azure Portal
1. Go to your Function App
2. Click "Log stream" to see real-time logs
3. Click "Application Insights" for detailed analytics

### View Logs Using CLI
```bash
az webapp log tail --name xpr-mcp-functions --resource-group xpr-mcp-rg
```

## Configuration

### Environment Variables
Set environment variables in Azure Portal:
1. Go to your Function App
2. Click "Configuration" under Settings
3. Add application settings:
   - `XPR_ENDPOINT`: Custom XPR network endpoint (optional)

Or using CLI:
```bash
az functionapp config appsettings set \
  --name xpr-mcp-functions \
  --resource-group xpr-mcp-rg \
  --settings KEY=VALUE
```

## Scaling

The Consumption plan automatically scales based on demand. For more control:

### Premium Plan
Upgrade to Premium plan for:
- Longer execution times
- VNet connectivity
- More CPU/Memory
- Predictable pricing

```bash
az functionapp plan create \
  --resource-group xpr-mcp-rg \
  --name xpr-premium-plan \
  --location eastus \
  --sku EP1 \
  --is-linux

az functionapp update \
  --resource-group xpr-mcp-rg \
  --name xpr-mcp-functions \
  --plan xpr-premium-plan
```

## Security

### Enable Authentication
1. Go to Function App in Azure Portal
2. Click "Authentication" under Settings
3. Click "Add identity provider"
4. Select provider (Microsoft, Google, etc.)
5. Configure settings

### API Keys
By default, functions use `authLevel: 'anonymous'`. To require API keys:

1. Edit `functions/index.js`
2. Change `authLevel: 'anonymous'` to `authLevel: 'function'`
3. Redeploy
4. Get function keys from Azure Portal

### CORS Configuration
```bash
az functionapp cors add \
  --name xpr-mcp-functions \
  --resource-group xpr-mcp-rg \
  --allowed-origins https://example.com
```

## Troubleshooting

### Function Not Starting
- Check Application Insights for errors
- Verify Node.js version matches (20.x)
- Check storage account connectivity

### Module Not Found Errors
- Ensure `node_modules` is included in deployment
- Check `package.json` dependencies
- Redeploy with `--build-native-deps` flag

### Timeout Errors
- Consumption plan has 5-minute timeout
- Upgrade to Premium plan for longer timeouts
- Optimize code for faster execution

## Cost Optimization

### Consumption Plan Pricing
- First 1 million executions free per month
- $0.20 per million executions after
- GB-seconds charged based on memory and execution time

### Tips to Reduce Costs
1. Use response caching where appropriate
2. Optimize function execution time
3. Use batch operations
4. Set appropriate timeout values
5. Monitor and alert on unusual activity

## Updating the Deployment

To update your functions after making code changes:

```bash
# Pull latest changes
git pull

# Install dependencies
npm install

# Deploy
func azure functionapp publish xpr-mcp-functions
```

Or push to GitHub if using GitHub Actions.

## Cleanup

To delete all resources:

```bash
az group delete --name xpr-mcp-rg --yes --no-wait
```

## Additional Resources

- [Azure Functions Documentation](https://docs.microsoft.com/azure/azure-functions/)
- [Azure Functions Pricing](https://azure.microsoft.com/pricing/details/functions/)
- [Best Practices](https://docs.microsoft.com/azure/azure-functions/functions-best-practices)
- [Security Guidelines](https://docs.microsoft.com/azure/azure-functions/security-concepts)
