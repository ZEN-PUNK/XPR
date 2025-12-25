# Deployment Pipeline Status

This file tracks the status and requirements for the Azure Functions deployment pipeline.

## Pipeline Overview

**Workflow File**: `.github/workflows/azure-functions-deploy.yml`

**Deployment Triggers**:
- ✅ Push to `main` branch → Auto-deploy to production
- ✅ Push to `release/*` branches → Build only (no deploy)
- ✅ Pull requests to `main` → Build and test only
- ✅ Manual dispatch → Choose production or staging

## Required GitHub Secrets

Before the pipeline can deploy, configure these secrets in GitHub Settings:

| Secret Name | Status | Required For | Description |
|------------|--------|--------------|-------------|
| `AZURE_CLIENT_ID` | ⏳ Pending | Production & Staging | Service Principal Client ID |
| `AZURE_TENANT_ID` | ⏳ Pending | Production & Staging | Azure Tenant ID |
| `AZURE_SUBSCRIPTION_ID` | ⏳ Pending | Production & Staging | Azure Subscription ID |
| `AZURE_FUNCTIONAPP_NAME` | ⏳ Pending | Production | Production Function App Name |
| `AZURE_FUNCTIONAPP_NAME_STAGING` | 🔵 Optional | Staging | Staging Function App Name |

### Setup Instructions

1. Follow the quick setup guide: [.github/CICD_SETUP.md](.github/CICD_SETUP.md)
2. Or see detailed instructions: [PIPELINE_GUIDE.md](PIPELINE_GUIDE.md)

## Azure Resources Required

### Production Environment
- ⏳ Resource Group
- ⏳ Storage Account
- ⏳ Function App (Node.js 20, Linux)
- ⏳ Service Principal with Contributor role
- ⏳ Federated Identity Credentials

### Staging Environment (Optional)
- 🔵 Function App (Node.js 20, Linux)
- 🔵 Federated Identity Credentials

## Pipeline Features

### Build Stage
- ✅ Node.js 20.x environment setup
- ✅ Dependency caching for faster builds
- ✅ Install dependencies with `npm ci`
- ✅ Run tests (continue on error)
- ✅ Build project (if build script exists)
- ✅ Remove dev dependencies for smaller deployment
- ✅ Create optimized ZIP package
- ✅ Upload build artifact (7-day retention)

### Deploy Stage (Production)
- ✅ Download build artifact
- ✅ Azure authentication via federated credentials
- ✅ Deploy to Azure Functions
- ✅ Environment URL tracking
- ✅ Only runs on push to `main` or manual trigger

### Deploy Stage (Staging)
- ✅ Same as production
- ✅ Only runs on manual trigger with staging selection

## File Optimization

**Files Excluded from Deployment** (via `.funcignore`):
- ❌ Git history and GitHub workflows
- ❌ Research and documentation
- ❌ Test files
- ❌ Environment files
- ❌ Cache and temporary files
- ❌ Editor configurations

**Files Included**:
- ✅ Application code (`src/`, `functions/`)
- ✅ Production dependencies (`node_modules/`)
- ✅ Configuration (`host.json`, `package.json`)
- ✅ Essential documentation (`README.md`, `AZURE_DEPLOYMENT.md`)

## Testing the Pipeline

### Local Validation
```bash
# Run tests
npm test

# Test production build
npm ci --production=false
npm test --if-present
npm prune --production

# Verify package creation
zip -r test.zip . -x ".git/*" -x ".github/*" -x "research/*"
ls -lh test.zip
```

### GitHub Actions Validation
```bash
# Validate workflow syntax
actionlint .github/workflows/azure-functions-deploy.yml
```

## Deployment History

| Date | Version | Environment | Status | Deployed By |
|------|---------|-------------|--------|-------------|
| Pending | 1.0.0 | Production | ⏳ Not yet deployed | - |

## Monitoring

After deployment, monitor via:
- GitHub Actions: Workflow run logs
- Azure Portal: Function App → Deployment Center
- Azure Portal: Function App → Log stream
- Application Insights: Detailed metrics and traces

## Rollback Procedure

If deployment fails:
1. Via Azure Portal: Deployment Center → Select previous version → Redeploy
2. Via Git: `git revert HEAD` → Push to trigger redeployment

## Next Steps

- [ ] Create Azure resources (see [.github/CICD_SETUP.md](.github/CICD_SETUP.md))
- [ ] Configure GitHub secrets
- [ ] Set up federated credentials
- [ ] Create GitHub environments (production, staging)
- [ ] Test deployment with a small change
- [ ] Configure Application Insights
- [ ] Set up alerts and monitoring
- [ ] Add branch protection rules

## Support

- 📖 Quick Setup: [.github/CICD_SETUP.md](.github/CICD_SETUP.md)
- 📚 Full Guide: [PIPELINE_GUIDE.md](PIPELINE_GUIDE.md)
- 🔧 Manual Deployment: [AZURE_DEPLOYMENT.md](AZURE_DEPLOYMENT.md)
- 🐛 Issues: GitHub Issues tab

---

Last Updated: 2025-12-25
Pipeline Version: 1.0.0
