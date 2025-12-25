# Experiments Catalog

This document catalogs all experiments in the `agentic_dev/` directory and provides a template for creating new experiments.

## Overview

Each experiment in this repository is a **self-contained, reproducible unit** that explores a specific aspect of the XPR MCP ecosystem. Experiments follow agentic development practices to ensure they are deterministic and independently runnable.

## Active Experiments

### Experiment 01: Proton CLI MCP Server

**Status**: ✅ Complete  
**Location**: `agentic_dev/experiment_01/`  
**Goal**: Wrap Proton CLI commands as MCP-compliant tools for blockchain queries

**What It Does**:
- Exposes 5 blockchain query tools via MCP protocol
- Provides HTTP and stdio transports
- Enables agentic blockchain operations

**Key Features**:
- `get_account` - Account information retrieval
- `get_account_resources` - CPU/NET/RAM resource queries
- `get_chain_info` - Blockchain state queries
- `get_block` - Block data retrieval
- `get_block_transaction_count` - Transaction counting

**Tech Stack**:
- TypeScript
- Express.js
- MCP SDK
- Proton CLI wrapper

**Quick Start**:
```bash
cd agentic_dev/experiment_01
npm install
npm run build
npm start
```

**Documentation**:
- [README.md](./agentic_dev/experiment_01/README.md) - Quick start
- [INDEX.md](./agentic_dev/experiment_01/INDEX.md) - Navigation
- [ARCHITECTURE.md](./agentic_dev/experiment_01/ARCHITECTURE.md) - Design
- [AGENTIC_DEVELOPMENT_GUIDE.md](./agentic_dev/experiment_01/AGENTIC_DEVELOPMENT_GUIDE.md) - Agent patterns

**Key Learnings**:
- CLI wrapper patterns work well for blockchain tools
- MCP protocol enables flexible agent integration
- TypeScript provides good type safety for APIs
- JSON-RPC 2.0 is straightforward to implement

---

## Planned Experiments

### Experiment 02: Enhanced Query Tools (Planned)

**Status**: 📋 Planned  
**Location**: `agentic_dev/experiment_02/` (to be created)  
**Goal**: Add transaction filtering, caching, and advanced queries

**Proposed Features**:
- Transaction filtering tools
- Caching layer (Redis or in-memory)
- Advanced account queries
- Historical data queries

**Dependencies**:
- Learnings from Experiment 01
- Potentially Redis for caching
- Enhanced CLI wrappers

---

### Experiment 03: Write Operations (Future)

**Status**: 💡 Future  
**Location**: `agentic_dev/experiment_03/` (to be created)  
**Goal**: Add transaction signing and smart contract interactions

**Proposed Features**:
- Transaction builder
- Safe signing patterns
- Contract deployment tools
- Rate limiting and security

**Prerequisites**:
- Secure key management infrastructure
- Rate limiting system
- Security audit

**Note**: This is a major expansion requiring significant security considerations.

---

## Experiment Template

When creating a new experiment, follow this template structure:

### Required Directory Structure

```
agentic_dev/experiment_XX/
├── README.md                       # Quick start guide
├── INDEX.md                        # Navigation and structure
├── ARCHITECTURE.md                 # Design decisions
├── EXPERIMENT_SCOPE.md            # Clear boundaries
├── task.md                        # Detailed work log
├── package.json                   # Dependencies (pinned versions)
├── tsconfig.json                  # TypeScript config (if applicable)
├── .gitignore                     # Ignore node_modules, dist, etc.
│
├── src/                           # Source code
│   ├── index.ts                   # Entry point
│   ├── server.ts                  # Main server logic (if applicable)
│   ├── tools/                     # MCP tools (if applicable)
│   └── adapters/                  # External tool adapters
│
├── dist/                          # Compiled output (git-ignored)
└── tests/                         # Test cases (optional)
```

### Required Documentation Files

#### 1. README.md

Must include:
- **Quick Start** - How to run the experiment
- **Prerequisites** - Required tools and versions
- **Installation** - Step-by-step setup
- **Usage Examples** - How to use the tools
- **Available Tools/APIs** - What's exposed
- **Architecture Overview** - High-level structure
- **Testing** - How to verify it works

#### 2. INDEX.md

Must include:
- **Project Structure** - Visual tree of files
- **Quick Navigation** - Links to key documents
- **Verification Status** - Current state of tools
- **Key Metrics** - LOC, tools, test coverage
- **Next Steps** - Future iterations

#### 3. ARCHITECTURE.md

Must include:
- **Design Decisions** - Why this architecture
- **Module Breakdown** - Component descriptions
- **Data Flow** - How information moves
- **Technology Choices** - Stack justification
- **Trade-offs** - What was sacrificed and why

#### 4. EXPERIMENT_SCOPE.md

Must include:
- **In Scope** - What this experiment does
- **Out of Scope** - What it explicitly doesn't do
- **Feature Matrix** - Status of each feature
- **Constraints** - Limitations and boundaries
- **Success Criteria** - Definition of done

#### 5. task.md

Must include:
- **Iteration Breakdown** - Tasks by iteration
- **Implementation Notes** - Technical details
- **Testing Results** - What was verified
- **Issues Encountered** - Problems and solutions
- **Work Log** - Chronological progress

### Required package.json Fields

```json
{
  "name": "experiment-XX-name",
  "version": "1.0.0",
  "description": "Brief description of experiment",
  "main": "dist/index.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsc --watch",
    "test": "echo \"Add tests\" && exit 0"
  },
  "dependencies": {
    "// Pin exact versions for reproducibility": "",
    "@modelcontextprotocol/sdk": "^1.24.0",
    "express": "^4.18.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Validation Checklist

Before marking an experiment complete, verify:

#### Documentation
- [ ] README.md with quick start exists
- [ ] INDEX.md with navigation exists
- [ ] ARCHITECTURE.md explains design
- [ ] EXPERIMENT_SCOPE.md defines boundaries
- [ ] task.md logs all work performed
- [ ] All code has comments explaining non-obvious logic

#### Code Quality
- [ ] Builds without errors (`npm run build`)
- [ ] No TypeScript errors
- [ ] All dependencies listed in package.json
- [ ] Versions are pinned (not using `^` or `~` for critical deps)
- [ ] Code follows existing patterns

#### Functionality
- [ ] All tools/endpoints work as documented
- [ ] Error handling is comprehensive
- [ ] Examples in README actually work
- [ ] Can be run independently without parent repo

#### Reproducibility
- [ ] Fresh install works (`rm -rf node_modules && npm install`)
- [ ] Build from clean state works
- [ ] All prerequisites documented
- [ ] Environment requirements specified

#### Independence
- [ ] Doesn't import from parent directory (except global tools)
- [ ] Has own package.json with all dependencies
- [ ] Can be copied to another location and still work
- [ ] Documentation stands alone

## Creating a New Experiment

### Step-by-Step Process

#### 1. Choose an Experiment Number

```bash
# List existing experiments
ls agentic_dev/

# Choose next number (e.g., experiment_02)
export EXPERIMENT_NUM=02
```

#### 2. Create Directory Structure

```bash
# Create from template (when template exists)
cp -r .agentic/templates/experiment_template agentic_dev/experiment_${EXPERIMENT_NUM}

# Or create manually
mkdir -p agentic_dev/experiment_${EXPERIMENT_NUM}/{src,tests}
cd agentic_dev/experiment_${EXPERIMENT_NUM}
```

#### 3. Initialize Package

```bash
# Create package.json
npm init -y

# Install common dependencies
npm install --save @modelcontextprotocol/sdk express
npm install --save-dev typescript @types/node @types/express

# Create tsconfig.json (if using TypeScript)
npx tsc --init
```

#### 4. Create Documentation Skeleton

```bash
touch README.md INDEX.md ARCHITECTURE.md EXPERIMENT_SCOPE.md task.md
```

#### 5. Start Implementing

Follow the iteration pattern from AGENTIC_DEVELOPMENT.md:
1. Define clear scope in EXPERIMENT_SCOPE.md
2. Document architecture in ARCHITECTURE.md
3. Implement incrementally
4. Log work in task.md
5. Test as you go
6. Update README with examples

#### 6. Complete and Catalog

When done:
1. Verify all checklist items above
2. Create completion summary
3. Add entry to this file (EXPERIMENTS.md)
4. Document learnings for next iteration

## Experiment Naming Convention

- **experiment_01** - First iteration
- **experiment_02** - Second iteration (not dependent on 01, but may apply learnings)
- **experiment_XX** - Sequential numbering

Each experiment is independent but may reference learnings from previous ones in its documentation.

## Integration Points

### With Main Repository

Experiments are self-contained but may:
- Use global CLI tools (like `proton` CLI)
- Reference research documentation in `research/`
- Apply learnings to main `src/` codebase (if applicable)

### Between Experiments

Experiments do NOT import code from each other but may:
- Copy patterns and adapt them
- Reference architectural decisions
- Build on conceptual learnings
- Share documentation approaches

## Best Practices

### For Deterministic Experiments

1. **Pin Dependencies**: Use exact versions in package.json
2. **Document Environment**: Specify Node.js version, OS requirements
3. **Seed Data**: If using randomness, document seeds
4. **Timestamps**: Use fixed timestamps in examples
5. **External APIs**: Mock or document exact API versions used

### For Reproducibility

1. **Complete Setup Instructions**: Every step from scratch
2. **Validate Fresh Install**: Test on clean environment
3. **Document Assumptions**: OS, architecture, pre-installed tools
4. **Provide Examples**: With expected output
5. **Error Scenarios**: Document common failures and fixes

### For Independence

1. **Self-Contained Dependencies**: All in package.json
2. **No Parent Imports**: Don't import from `../../src`
3. **Local Copies**: Copy shared code instead of referencing
4. **Bundled Config**: All config files in experiment directory
5. **Standalone Docs**: Can be read without context

## Resources

### Templates
- `.agentic/templates/experiment_template/` - Boilerplate structure

### Related Documentation
- [AGENTIC_DEVELOPMENT.md](./AGENTIC_DEVELOPMENT.md) - Development practices
- [SETUP.md](./SETUP.md) - Environment setup
- [README.md](./README.md) - Main project overview

### Example Experiments
- `agentic_dev/experiment_01/` - Complete reference implementation

## Changelog

### 2025-12-25
- Created experiments catalog
- Documented experiment_01 (Proton CLI MCP Server)
- Established template structure
- Defined validation checklist

---

**Need Help?** See [AGENTIC_DEVELOPMENT.md](./AGENTIC_DEVELOPMENT.md) for detailed practices and patterns.
