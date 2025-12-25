# Agentic Development Scripts

Helper scripts for creating and validating experiments following agentic development practices.

## Available Scripts

### create-experiment.sh

Creates a new experiment from the template with proper initialization.

**Usage:**
```bash
# Auto-detect next experiment number
./.agentic/scripts/create-experiment.sh

# Specify experiment number
./.agentic/scripts/create-experiment.sh 03
```

**What it does:**
1. Prompts for experiment name and description
2. Creates new experiment directory from template
3. Updates all files with experiment number and metadata
4. Initializes git tracking
5. Provides next steps guidance

**Interactive prompts:**
- Experiment number (auto-suggested)
- Experiment name (kebab-case, e.g., 'enhanced-query-tools')
- Brief description

**Example:**
```bash
$ ./.agentic/scripts/create-experiment.sh

==========================================
XPR Experiment Creator
==========================================

No experiment number provided.
Next available: 02
Use this number? (y/n): y

Experiment Configuration
----------------------------------------
Experiment name (e.g., 'enhanced-query-tools'): caching-layer
Brief description: Add Redis caching for blockchain queries

Creating experiment...
📋 Copying template files...
📦 Updating package.json...
📝 Updating documentation...
🔧 Initializing git...

==========================================
✅ Experiment Created Successfully!
==========================================
```

---

### validate-experiment.sh

Validates that an experiment meets all agentic development requirements.

**Usage:**
```bash
# Validate current directory
./.agentic/scripts/validate-experiment.sh

# Validate specific experiment
./.agentic/scripts/validate-experiment.sh agentic_dev/experiment_01
```

**What it checks:**

**Required Files:**
- ✅ README.md
- ✅ INDEX.md
- ✅ ARCHITECTURE.md
- ✅ EXPERIMENT_SCOPE.md
- ✅ task.md
- ✅ package.json
- ✅ .gitignore

**Dependencies:**
- ✅ node_modules exists
- ✅ package.json structure (name, version, scripts)
- ✅ Build and start scripts defined

**Build Capability:**
- ✅ TypeScript configuration (if applicable)
- ✅ Build succeeds
- ✅ dist/ directory generated

**Documentation Quality:**
- ✅ README.md is comprehensive (>50 lines)
- ✅ Has Quick Start section
- ✅ Has Usage/Examples section
- ✅ ARCHITECTURE.md is detailed

**Independence:**
- ✅ No imports from parent directory
- ✅ .gitignore excludes node_modules
- ✅ .gitignore excludes build artifacts

**Exit codes:**
- `0` - All checks passed or only warnings
- `1` - Errors found

**Example output:**
```bash
$ ./.agentic/scripts/validate-experiment.sh agentic_dev/experiment_01

==========================================
Validating Experiment: agentic_dev/experiment_01
==========================================

📋 Checking Required Files...
----------------------------------------
  ✅ README.md exists
  ✅ INDEX.md exists
  ✅ ARCHITECTURE.md exists
  ✅ EXPERIMENT_SCOPE.md exists
  ✅ task.md exists
  ✅ package.json exists
  ✅ .gitignore exists

📦 Checking Dependencies...
----------------------------------------
  ✅ node_modules directory exists
  ✅ package.json has name: experiment-01-proton-cli-mcp
  ✅ package.json has version: 1.0.0
  ✅ build script defined
  ✅ start script defined

🏗️  Checking Build Capability...
----------------------------------------
  ✅ TypeScript configuration found
  🔨 Attempting build...
  ✅ Build successful
  ✅ dist/ directory exists with 15 files

📄 Checking Documentation Quality...
----------------------------------------
  ✅ README.md is comprehensive (187 lines)
  ✅ README has Quick Start section
  ✅ README has Usage/Examples section
  ✅ ARCHITECTURE.md is comprehensive (342 lines)

🔍 Checking Independence...
----------------------------------------
  ✅ No imports from parent directory found
  ✅ .gitignore excludes node_modules
  ✅ .gitignore excludes build artifacts

==========================================
Validation Summary
==========================================

🎉 EXCELLENT! All checks passed!

This experiment meets all agentic development requirements.
```

---

## Using Scripts in Development Workflow

### Creating a New Experiment

```bash
# 1. Create experiment from template
./.agentic/scripts/create-experiment.sh

# 2. Follow the prompts
# Enter experiment number, name, and description

# 3. Navigate to new experiment
cd agentic_dev/experiment_XX

# 4. Install dependencies
npm install

# 5. Start developing
# Edit src/index.ts and other files

# 6. Build and test
npm run build
npm start

# 7. Validate before completion
../../.agentic/scripts/validate-experiment.sh
```

### Validating Before Commit

Before committing your experiment, always validate:

```bash
cd agentic_dev/experiment_XX
../../.agentic/scripts/validate-experiment.sh

# Fix any errors or warnings
# Then commit
git add .
git commit -m "Complete experiment XX implementation"
```

### Before Marking Experiment Complete

```bash
# Run full validation
./.agentic/scripts/validate-experiment.sh agentic_dev/experiment_XX

# Check all tests pass
cd agentic_dev/experiment_XX
npm test

# Verify builds successfully
npm run build

# Update EXPERIMENTS.md catalog
# Add your experiment to the active experiments list
```

---

## Script Requirements

### For create-experiment.sh

**Required:**
- Bash shell
- Git installed
- Write access to repository

**Optional:**
- None

### For validate-experiment.sh

**Required:**
- Bash shell
- Access to experiment directory

**Optional:**
- `jq` - For enhanced package.json validation
- Node.js and npm - For build verification

If optional tools are missing, the script will continue with warnings.

---

## Troubleshooting

### Script Permission Denied

```bash
# Make scripts executable
chmod +x .agentic/scripts/*.sh
```

### Template Not Found

Ensure you're running from repository root or the template exists:
```bash
ls .agentic/templates/experiment_template/
```

### Validation Fails

Read the error messages carefully. Common issues:
- Missing required files → Create them from template
- Build fails → Check TypeScript errors
- Parent imports → Remove `import from '../../'` statements
- Missing documentation → Add comprehensive README/ARCHITECTURE

### sed Command Fails (macOS)

On macOS, sed creates .bak files. The scripts handle this, but if you see .bak files:
```bash
find . -name "*.bak" -delete
```

---

## Contributing

When adding new scripts:

1. Follow the existing patterns
2. Add comprehensive error handling
3. Provide clear output with colors (if applicable)
4. Update this README with usage instructions
5. Make scripts executable: `chmod +x script-name.sh`
6. Test on both Linux and macOS if possible

---

## Related Documentation

- [AGENTIC_DEVELOPMENT.md](../../AGENTIC_DEVELOPMENT.md) - Development practices
- [EXPERIMENTS.md](../../EXPERIMENTS.md) - Experiment catalog and templates
- [SETUP.md](../../SETUP.md) - Environment setup guide

---

**Last Updated:** 2025-12-25
