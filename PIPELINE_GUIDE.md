# Build and Release Pipeline Guide

This guide explains how to use the automated build and release pipeline for deploying the XPR MCP Server to Azure Functions.

## Overview

The project includes a GitHub Actions workflow that automates:
- **Building** the application with dependency installation and testing
- **Packaging** the deployment artifact
- **Deploying** to Azure Functions (production or staging environments)

## Pipeline Architecture

### Build Stage
1. Checks out the repository code
2. Sets up Node.js 20.x environment
3. Installs all dependencies (including dev dependencies for testing)
4. Runs tests (if present)
5. Runs build scripts (if present)
6. Removes dev dependencies to reduce package size
7. Creates a deployment ZIP package
8. Uploads artifact for deployment stages

### Deploy Stages
- **Production**: Automatically deploys on push to `main` branch
- **Staging**: Manually triggered via workflow dispatch

## Prerequisites

### Azure Resources

You need to create the following Azure resources:

1. **Azure Function App (Production)**
   ```bash
   az functionapp create \
     --resource-group xpr-mcp-rg \
     --consumption-plan-location eastus \
     --runtime node \
     --runtime-version 20 \
     --functions-version 4 \
     --name xpr-mcp-production \
     --storage-account xprmcpstorage \
     --os-type Linux
   ```

2. **Azure Function App (Staging)** - Optional
   ```bash
   az functionapp create \
     --resource-group xpr-mcp-rg \
     --consumption-plan-location eastus \
     --runtime node \
     --runtime-version 20 \
     --functions-version 4 \
     --name xpr-mcp-staging \
     --storage-account xprmcpstorage \
     --os-type Linux
   ```

3. **Service Principal for Authentication**
   ```bash
   az ad sp create-for-rbac \
     --name "xpr-mcp-github-actions" \
     --role contributor \
     --scopes /subscriptions/{subscription-id}/resourceGroups/xpr-mcp-rg \
     --sdk-auth
   ```

### GitHub Secrets Configuration

Configure the following secrets in your GitHub repository (Settings → Secrets and variables → Actions):

#### Required Secrets

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `AZURE_CLIENT_ID` | Azure Service Principal Client ID | From service principal creation output |
| `AZURE_TENANT_ID` | Azure Tenant ID | From service principal creation output |
| `AZURE_SUBSCRIPTION_ID` | Azure Subscription ID | Run `az account show --query id -o tsv` |
| `AZURE_FUNCTIONAPP_NAME` | Production Function App name | e.g., `xpr-mcp-production` |

#### Optional Secrets (for staging)

| Secret Name | Description |
|------------|-------------|
| `AZURE_FUNCTIONAPP_NAME_STAGING` | Staging Function App name |

### Setting up Federated Identity Credentials

For secure authentication without secrets, configure federated credentials:

1. Go to Azure Portal → Azure Active Directory → App registrations
2. Find your app registration (`xpr-mcp-github-actions`)
3. Navigate to "Certificates & secrets" → "Federated credentials"
4. Add credentials for:
   - **Main branch**: 
     - Entity type: `Branch`
     - GitHub branch name: `main`
   - **Pull requests**:
     - Entity type: `Pull request`
   - **Environments**:
     - Entity type: `Environment`
     - Environment name: `production` and `staging`

## Using the Pipeline

### Automatic Deployment (Production)

Push to the `main` branch triggers automatic deployment:

```bash
git checkout main
git pull origin main
# Make your changes
git add .
git commit -m "Your changes"
git push origin main
```

The pipeline will:
1. Build the application
2. Run tests
3. Create deployment package
4. Deploy to production

### Manual Deployment (Production or Staging)

1. Go to GitHub Actions tab in your repository
2. Select "Build and Release - Azure Functions MCP" workflow
3. Click "Run workflow"
4. Select the branch and environment (production/staging)
5. Click "Run workflow" button

### Pull Request Builds

When you create a pull request to `main`:
- The build job runs automatically
- Tests are executed
- Deployment is skipped (only validation)

This ensures all code is tested before merging.

## Monitoring Deployments

### GitHub Actions

1. Go to the "Actions" tab in GitHub
2. Click on the workflow run
3. View logs for each job (Build, Deploy)
4. Check deployment status and any errors

### Azure Portal

1. Navigate to your Function App in Azure Portal
2. Click "Deployment Center" to view deployment history
3. Click "Logs" to see real-time execution logs
4. Use "Application Insights" for detailed monitoring

### Azure CLI

```bash
# View deployment logs
az webapp log tail \
  --name xpr-mcp-production \
  --resource-group xpr-mcp-rg

# View recent deployments
az functionapp deployment list \
  --name xpr-mcp-production \
  --resource-group xpr-mcp-rg
```

## Pipeline Configuration

### Customizing the Pipeline

Edit `.github/workflows/azure-functions-deploy.yml` to customize:

**Node.js Version:**
```yaml
env:
  NODE_VERSION: '20.x'  # Change to '18.x' or '22.x' if needed
```

**Trigger Branches:**
```yaml
on:
  push:
    branches:
      - main
      - release/*  # Add more branches
```

**Artifact Retention:**
```yaml
retention-days: 7  # Change to keep artifacts longer
```

### Build Optimization

The pipeline optimizes the deployment package by:
- Using `npm ci` for faster, reproducible installs
- Running `npm prune --production` to remove dev dependencies
- Excluding unnecessary files via `.funcignore`
- Creating a compressed ZIP artifact

### Environment Variables

Set environment variables in Azure:

```bash
az functionapp config appsettings set \
  --name xpr-mcp-production \
  --resource-group xpr-mcp-rg \
  --settings \
    XPR_ENDPOINT=https://proton.eoscafeblock.com \
    NODE_ENV=production
```

## Troubleshooting

### Build Failures

**Issue**: Dependencies fail to install
```bash
# Solution: Update package-lock.json
npm install
git add package-lock.json
git commit -m "Update package-lock.json"
git push
```

**Issue**: Tests fail
```bash
# Solution: Tests run with continue-on-error, but should be fixed
# Run tests locally first
npm test
```

### Deployment Failures

**Issue**: Authentication failed
- Verify Azure secrets are correctly set in GitHub
- Check service principal has proper permissions
- Ensure federated credentials are configured

**Issue**: Function app not found
- Verify `AZURE_FUNCTIONAPP_NAME` secret matches actual Function App name
- Check resource group and subscription

**Issue**: Deployment timeout
- Check Function App is running in Azure Portal
- Review Application Insights for errors
- Increase timeout in workflow if needed

### Rollback

If a deployment fails or introduces issues:

1. **Via Azure Portal:**
   - Go to Function App → Deployment Center
   - Find previous successful deployment
   - Click "Redeploy"

2. **Via Git:**
   ```bash
   # Revert to previous commit
   git revert HEAD
   git push origin main
   # Pipeline will redeploy previous version
   ```

## Security Best Practices

1. **Secrets Management**
   - Never commit secrets to repository
   - Use GitHub Secrets for all credentials
   - Rotate secrets regularly

2. **Access Control**
   - Use federated identity credentials instead of service principal secrets
   - Limit service principal permissions to specific resource groups
   - Configure branch protection rules on `main`

3. **Monitoring**
   - Enable Application Insights for production
   - Set up alerts for failures
   - Review deployment logs regularly

4. **Code Quality**
   - Require pull request reviews before merging
   - Run tests in pipeline before deployment
   - Use staging environment for validation

## Advanced Features

### Multi-Region Deployment

Deploy to multiple regions for high availability:

1. Create Function Apps in different regions
2. Add deployment jobs for each region
3. Use Traffic Manager or Front Door for routing

### Canary Deployments

Deploy to a subset of users first:

1. Use deployment slots (Standard tier or higher)
2. Deploy to staging slot first
3. Test with small percentage of traffic
4. Swap slots when validated

### Notifications

Add notifications to the pipeline:

```yaml
- name: Notify deployment
  if: always()
  uses: actions/github-script@v7
  with:
    script: |
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: '✅ Deployment completed!'
      })
```

## Support

- **Documentation**: See [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md) for manual deployment
- **Issues**: Create an issue in GitHub for problems
- **Azure Support**: Contact Azure support for platform issues

## Cost Considerations

The Consumption Plan used in this pipeline:
- First 1 million executions/month are free
- Pay only for actual usage
- Automatically scales based on demand

Monitor costs in Azure Cost Management to stay within budget.

## Next Steps

1. Set up Azure resources (Function Apps, Service Principal)
2. Configure GitHub Secrets
3. Test pipeline with a small change
4. Set up monitoring and alerts
5. Configure staging environment for safer deployments
6. Enable branch protection on `main`

## Reference

- [Azure Functions Documentation](https://docs.microsoft.com/azure/azure-functions/)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Azure Login Action](https://github.com/Azure/login)
- [Azure Functions Action](https://github.com/Azure/functions-action)
