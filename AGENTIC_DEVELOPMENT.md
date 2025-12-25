# Agentic Development Guide

## Overview

This repository follows **agentic development practices** to enable AI agents and developers to work efficiently and deterministically. Each experiment is self-contained, reproducible, and follows consistent patterns.

## Core Principles

### 1. **Deterministic Iterations**
Every experiment should produce the same results when run with the same inputs and environment. This means:
- Pinned dependency versions
- Documented environment requirements
- Reproducible build processes
- Clear initialization steps

### 2. **Independent Experiments**
Each experiment in `agentic_dev/` is completely self-contained:
- Has its own `package.json` with all dependencies
- Includes all necessary code to run independently
- Has its own documentation and setup instructions
- Does not rely on parent directory dependencies (except global tools)

### 3. **Comprehensive Documentation**
Every experiment includes:
- **README.md** - Quick start and usage guide
- **INDEX.md** - Navigation and project structure
- **ARCHITECTURE.md** - Design decisions and technical architecture
- **EXPERIMENT_SCOPE.md** - Clear boundaries of what's in/out of scope
- **task.md** - Detailed work log and implementation notes

### 4. **Clear Iteration Boundaries**
- Each experiment represents a complete, functional unit
- Experiments build on learnings from previous ones but don't depend on their code
- Every experiment can be understood and run in isolation

## Repository Structure

```
XPR/
├── README.md                      # Main project overview
├── AGENTIC_DEVELOPMENT.md        # This guide
├── EXPERIMENTS.md                # Experiment catalog and templates
├── SETUP.md                      # Environment setup guide
│
├── .agentic/                     # Agentic development resources
│   ├── templates/                # Templates for new experiments
│   │   └── experiment_template/  # Boilerplate for new experiments
│   └── scripts/                  # Helper scripts for validation
│
├── agentic_dev/                  # All experiments live here
│   ├── experiment_01/            # First iteration - MCP server
│   │   ├── README.md             # Quick start
│   │   ├── INDEX.md              # Navigation guide
│   │   ├── package.json          # Self-contained dependencies
│   │   ├── src/                  # Source code
│   │   └── ...                   # Full experiment structure
│   │
│   └── experiment_XX/            # Future experiments
│       └── ...                   # Each is self-contained
│
├── research/                     # Research artifacts and theory
│   ├── 00_context/               # Problem statements and assumptions
│   ├── 01_literature/            # Related work and analysis
│   └── ...                       # Research dimensions
│
├── src/                          # Main project source (if applicable)
└── functions/                    # Shared utilities (if needed)
```

## Creating a New Experiment

### Step 1: Use the Template

```bash
# Copy the experiment template
cp -r .agentic/templates/experiment_template agentic_dev/experiment_XX

# Navigate to your new experiment
cd agentic_dev/experiment_XX
```

### Step 2: Initialize the Experiment

```bash
# Install dependencies
npm install

# Verify setup
npm run validate
```

### Step 3: Document Your Experiment

Update these files in your experiment directory:

1. **README.md** - Describe what the experiment does and how to run it
2. **EXPERIMENT_SCOPE.md** - Define clear boundaries
3. **task.md** - Log your work as you progress
4. **ARCHITECTURE.md** - Document key design decisions

### Step 4: Implement & Iterate

Follow the iteration pattern:
1. Implement a small, testable unit
2. Verify it works
3. Document what you learned
4. Commit progress
5. Repeat

### Step 5: Complete & Summarize

When done:
1. Run all validation scripts
2. Create completion summary
3. Document learnings for next iteration
4. Update experiment catalog in `EXPERIMENTS.md`

## Experiment Requirements Checklist

Every experiment must have:

### Essential Files
- [ ] `README.md` - Quick start guide
- [ ] `package.json` - With all dependencies pinned
- [ ] `INDEX.md` - Navigation and structure overview
- [ ] `EXPERIMENT_SCOPE.md` - Clear in/out of scope
- [ ] `.gitignore` - Exclude node_modules, dist, etc.

### Documentation
- [ ] Architecture documentation
- [ ] API reference (if applicable)
- [ ] Usage examples
- [ ] Troubleshooting section

### Reproducibility
- [ ] All dependencies listed in `package.json`
- [ ] Environment requirements documented
- [ ] Setup steps are clear and complete
- [ ] Build process is documented

### Testing
- [ ] Test cases or validation scripts
- [ ] Examples of expected output
- [ ] Error cases documented

## Best Practices for Agents

### For AI Agents Working on This Repository

1. **Always Read First**: Before making changes, read:
   - This guide (AGENTIC_DEVELOPMENT.md)
   - The experiment's README.md
   - The experiment's ARCHITECTURE.md
   - The experiment's EXPERIMENT_SCOPE.md

2. **Stay In Scope**: Respect the boundaries defined in EXPERIMENT_SCOPE.md

3. **Document As You Go**: Update task.md with detailed notes about:
   - What you implemented
   - Why you made certain decisions
   - What issues you encountered
   - What you learned

4. **Test Incrementally**: After each change:
   - Build the code
   - Run relevant tests
   - Verify expected behavior
   - Document results

5. **Maintain Independence**: Each experiment should:
   - Have its own dependencies
   - Not require files from parent directories
   - Be runnable without other experiments
   - Have complete documentation

## Experiment Workflow

### Standard Development Cycle

```bash
# 1. Navigate to experiment
cd agentic_dev/experiment_XX

# 2. Install dependencies (first time)
npm install

# 3. Make changes to code
# ... edit files ...

# 4. Build
npm run build

# 5. Test
npm test
# or
npm start  # for interactive testing

# 6. Document
# Update task.md with what you did

# 7. Commit
git add .
git commit -m "descriptive message"

# 8. Repeat
```

### Validation Before Completion

Before marking an experiment complete:

```bash
# Run all checks
npm run validate  # If available

# Verify build
npm run build

# Test functionality
npm test  # or manual testing

# Check documentation
ls -la  # Ensure all required files exist
```

## Common Patterns

### Pattern 1: CLI Tool Wrapper

Many experiments wrap CLI tools. Standard approach:

```typescript
// adapters/tool-adapter.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function callTool(args: string[]): Promise<any> {
  const { stdout } = await execAsync(`tool ${args.join(' ')}`);
  return JSON.parse(stdout);
}
```

### Pattern 2: MCP Server

For MCP protocol servers:

```typescript
// server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'experiment-name',
  version: '1.0.0',
});

// Define tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: [...] };
});
```

### Pattern 3: HTTP API

For HTTP servers:

```typescript
// server.ts
import express from 'express';

const app = express();
app.use(express.json());

app.post('/api/endpoint', async (req, res) => {
  // Handle request
  res.json({ result: ... });
});

app.listen(3000);
```

## Troubleshooting

### Experiment Won't Build

1. Check Node.js version: `node --version` (should be 16+ or as specified)
2. Delete and reinstall: `rm -rf node_modules package-lock.json && npm install`
3. Check TypeScript config: Ensure `tsconfig.json` is properly configured

### Dependencies Not Found

1. Ensure you're in the experiment directory
2. Run `npm install` in that directory
3. Check `package.json` lists all dependencies

### Code Works in One Experiment But Not Another

This is expected! Experiments are independent. You may need to:
1. Copy necessary code into the new experiment
2. Install the same dependencies in the new experiment
3. Adapt the code to the new experiment's context

## Resources

### Related Documentation
- [EXPERIMENTS.md](./EXPERIMENTS.md) - Catalog of all experiments
- [SETUP.md](./SETUP.md) - Environment setup guide
- [README.md](./README.md) - Main project overview
- [research/README.md](./research/README.md) - Research artifacts

### External Resources
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [XPR Network](https://www.protonchain.com/)
- [Agentic Development Patterns](https://martinfowler.com/articles/patterns-of-distributed-systems/)

## Contributing

When adding new experiments:

1. Follow the template structure
2. Maintain independence (self-contained dependencies)
3. Document thoroughly
4. Test completely
5. Update EXPERIMENTS.md catalog

## Version History

- **v1.0** (2025-12-25) - Initial agentic development guide
