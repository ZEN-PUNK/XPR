# Environment Setup Guide

This guide provides step-by-step instructions for setting up a reproducible development environment for working on XPR MCP experiments.

## Prerequisites

### Required Software

| Tool | Minimum Version | Purpose |
|------|----------------|---------|
| Node.js | 20.x | JavaScript runtime |
| npm | 10.x | Package manager |
| Git | 2.x | Version control |
| TypeScript | 5.x | Type-safe development |

### Optional Tools

| Tool | Purpose |
|------|---------|
| Proton CLI | Required for experiment_01 blockchain queries |
| Azure Functions Core Tools | Required for Azure deployment |
| Docker | For containerized deployments |
| jq | JSON processing in shell scripts |

## Quick Start

### For New Contributors

```bash
# 1. Clone repository
git clone https://github.com/ZEN-PUNK/XPR.git
cd XPR

# 2. Verify Node.js version
node --version  # Should be 20.x or higher

# 3. Choose an experiment to work on
cd agentic_dev/experiment_01

# 4. Install dependencies
npm install

# 5. Build and run
npm run build
npm start
```

### For Existing Developers

```bash
# Update repository
git pull origin main

# Navigate to experiment
cd agentic_dev/experiment_XX

# Clean install
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

## Detailed Setup

### 1. System Setup

#### On macOS

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js 20
brew install node@20

# Link Node.js 20
brew link node@20

# Install Git
brew install git

# Install jq (optional but helpful)
brew install jq
```

#### On Ubuntu/Debian Linux

```bash
# Update package list
sudo apt update

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Git
sudo apt install -y git

# Install jq (optional)
sudo apt install -y jq

# Verify installations
node --version
npm --version
git --version
```

#### On Windows

```powershell
# Using Chocolatey package manager
# Install Chocolatey first: https://chocolatey.org/install

# Install Node.js 20
choco install nodejs-lts --version=20.0.0

# Install Git
choco install git

# Install jq (optional)
choco install jq

# Verify installations
node --version
npm --version
git --version
```

### 2. Repository Setup

```bash
# Clone repository
git clone https://github.com/ZEN-PUNK/XPR.git
cd XPR

# Verify repository structure
ls -la
# Should see: agentic_dev, research, src, functions, README.md, etc.

# Check Git status
git status
# Should be on main branch or a feature branch
```

### 3. Proton CLI Setup (for Experiment 01)

The Proton CLI is required for blockchain-related experiments.

#### Option A: Global Installation (Recommended for Development)

```bash
# Install Proton CLI globally
npm install -g @protonchain/cli

# Verify installation
proton --version
# Should show version 0.1.95 or higher

# Test basic functionality
proton chain:info
# Should return blockchain information
```

#### Option B: Local Development Build

```bash
# If you need to modify Proton CLI itself
cd /path/to/separate/location
git clone https://github.com/XPRNetwork/proton-cli.git
cd proton-cli
npm install
npm link  # Makes 'proton' command available globally

# Verify
proton --version
```

### 4. Experiment-Specific Setup

Each experiment has its own setup requirements. Always follow the experiment's README.md.

#### General Pattern for Any Experiment

```bash
# Navigate to experiment
cd agentic_dev/experiment_XX

# Install dependencies
npm install

# Build TypeScript (if applicable)
npm run build

# Verify setup
npm test  # or npm start for interactive testing

# Check that all required files exist
ls -la
# Should see: README.md, package.json, src/, dist/, etc.
```

#### Experiment 01 Example

```bash
# Navigate to experiment
cd agentic_dev/experiment_01

# Install dependencies
npm install
# Installs: express, @modelcontextprotocol/sdk, typescript, etc.

# Build TypeScript
npm run build
# Compiles src/*.ts → dist/*.js

# Start server
npm start
# Server runs on http://localhost:3001

# In another terminal, test it
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"..."}
```

## Environment Variables

### For Development

Create `.env` files in experiment directories as needed:

```bash
# agentic_dev/experiment_01/.env
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug
```

**Note**: Never commit `.env` files. They're in `.gitignore`.

### For Azure Functions (if deploying)

```bash
# Copy example settings
cp local.settings.json.example local.settings.json

# Edit local.settings.json with your values
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "XPR_ENDPOINT": "https://proton.eoscafeblock.com"
  }
}
```

## Verification Steps

After setup, verify everything works:

### 1. Check Node.js and npm

```bash
node --version
# Expected: v20.x.x or higher

npm --version
# Expected: 10.x.x or higher
```

### 2. Check Repository Structure

```bash
cd /path/to/XPR
ls -la
# Should see: agentic_dev/, research/, src/, README.md, etc.
```

### 3. Test an Experiment

```bash
cd agentic_dev/experiment_01
npm install
npm run build
npm start &
sleep 2  # Give server time to start
curl http://localhost:3001/health
# Expected: {"status":"ok", ...}
kill %1  # Stop the server
```

### 4. Check Global Tools (if needed)

```bash
# For Proton CLI
proton --version
# Expected: 0.1.95 or higher

# For Azure Functions
func --version
# Expected: 4.x or higher (if installed)
```

## Troubleshooting

### Node.js Version Issues

**Problem**: Wrong Node.js version installed

**Solution**: Use nvm (Node Version Manager)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.bashrc  # or ~/.zshrc

# Install and use Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version  # Should be v20.x.x
```

### Dependency Installation Fails

**Problem**: `npm install` fails with errors

**Solutions**:

```bash
# 1. Clear npm cache
npm cache clean --force

# 2. Delete lock file and node_modules
rm -rf node_modules package-lock.json

# 3. Reinstall
npm install

# 4. If still failing, check Node.js version
node --version  # Must be compatible with package requirements
```

### Build Failures

**Problem**: `npm run build` fails

**Solutions**:

```bash
# 1. Check TypeScript is installed
npm list typescript
# If not listed, install it:
npm install --save-dev typescript

# 2. Verify tsconfig.json exists
ls -la tsconfig.json

# 3. Check for TypeScript errors
npx tsc --noEmit

# 4. Clean and rebuild
rm -rf dist/
npm run build
```

### Port Already in Use

**Problem**: Server won't start because port is in use

**Solutions**:

```bash
# Find process using port 3001
lsof -i :3001
# Or on Linux:
netstat -tulpn | grep 3001

# Kill the process
kill -9 <PID>

# Or change port in code/config
export PORT=3002
npm start
```

### Proton CLI Not Found

**Problem**: `proton: command not found`

**Solutions**:

```bash
# 1. Install globally
npm install -g @protonchain/cli

# 2. Or use npx
npx @protonchain/cli chain:info

# 3. Or install locally and use npm scripts
npm install --save-dev @protonchain/cli
# Then use: npx proton chain:info
```

### Permission Errors

**Problem**: EACCES or permission denied errors

**Solutions**:

```bash
# Fix npm permissions (don't use sudo with npm!)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Then reinstall global packages
npm install -g @protonchain/cli
```

## IDE Setup

### VS Code (Recommended)

```bash
# Install VS Code extensions
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-typescript-next

# Recommended settings (in .vscode/settings.json)
{
  "editor.formatOnSave": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### Other IDEs

For WebStorm, Sublime Text, or other editors:
- Install TypeScript language support
- Configure linter/formatter
- Set up auto-import

## Development Workflow

### Standard Workflow

```bash
# 1. Start from clean state
cd agentic_dev/experiment_XX
git status  # Ensure clean working directory

# 2. Create feature branch (optional)
git checkout -b feature/your-feature

# 3. Install/update dependencies
npm install

# 4. Make changes
# ... edit code ...

# 5. Build
npm run build

# 6. Test
npm test  # or npm start for manual testing

# 7. Commit
git add .
git commit -m "Descriptive message"

# 8. Push (if using feature branch)
git push origin feature/your-feature
```

### Continuous Development

For rapid iteration:

```bash
# Terminal 1: Watch mode (auto-rebuild)
npm run dev  # Usually runs tsc --watch

# Terminal 2: Run server with auto-restart
npm start

# Or use nodemon for auto-restart:
npm install -g nodemon
nodemon dist/index.js
```

## Testing Your Setup

Complete verification script:

```bash
#!/bin/bash
# save as: verify-setup.sh

echo "=== Verifying XPR Development Environment ==="

# Check Node.js
echo -n "Node.js version: "
node --version || echo "❌ Node.js not found"

# Check npm
echo -n "npm version: "
npm --version || echo "❌ npm not found"

# Check Git
echo -n "Git version: "
git --version || echo "❌ Git not found"

# Check TypeScript
echo -n "TypeScript version: "
npx tsc --version || echo "⚠️  TypeScript not found (will be installed per-project)"

# Check Proton CLI
echo -n "Proton CLI version: "
proton --version || echo "⚠️  Proton CLI not found (optional for some experiments)"

# Check repository
if [ -f "README.md" ] && [ -d "agentic_dev" ]; then
  echo "✅ Repository structure looks good"
else
  echo "❌ Not in XPR repository root"
fi

echo "=== Verification Complete ==="
```

Run it:

```bash
chmod +x verify-setup.sh
./verify-setup.sh
```

## Next Steps

After setup is complete:

1. **Read Documentation**:
   - [AGENTIC_DEVELOPMENT.md](./AGENTIC_DEVELOPMENT.md) - Development practices
   - [EXPERIMENTS.md](./EXPERIMENTS.md) - Experiment catalog
   - [README.md](./README.md) - Project overview

2. **Choose an Experiment**:
   - Start with `experiment_01` for a complete reference
   - Or create a new experiment following the template

3. **Start Developing**:
   - Follow the experiment's README.md
   - Document your work in task.md
   - Test as you go

4. **Get Help**:
   - Check experiment-specific documentation
   - Review existing code for patterns
   - See troubleshooting sections above

## Environment Checklist

Before starting development, verify:

- [ ] Node.js 20.x or higher installed
- [ ] npm 10.x or higher installed
- [ ] Git installed and configured
- [ ] Repository cloned and accessible
- [ ] Can navigate to experiments: `cd agentic_dev/experiment_01`
- [ ] Can install dependencies: `npm install` works
- [ ] Can build code: `npm run build` works
- [ ] Optional tools installed as needed (Proton CLI, Azure Functions, etc.)

## Maintaining Your Environment

### Regular Maintenance

```bash
# Update Node.js (using nvm)
nvm install 20
nvm use 20

# Update global tools
npm update -g

# Update experiment dependencies
cd agentic_dev/experiment_XX
npm update

# Rebuild after updates
npm run build
```

### Staying in Sync

```bash
# Update repository
git pull origin main

# Reinstall dependencies (if package.json changed)
npm install

# Rebuild
npm run build
```

## Version History

- **v1.0** (2025-12-25) - Initial setup guide

---

**Questions?** See [AGENTIC_DEVELOPMENT.md](./AGENTIC_DEVELOPMENT.md) for development practices or [EXPERIMENTS.md](./EXPERIMENTS.md) for experiment-specific setup.
