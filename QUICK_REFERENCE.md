# XPR Repository Quick Reference

**One-page navigation guide to all documentation**

## 🚀 Getting Started

**Brand new to this repository?**

1. Read [README.md](./README.md) - Project overview
2. Follow [SETUP.md](./SETUP.md) - Environment setup
3. Read [AGENTIC_DEVELOPMENT.md](./AGENTIC_DEVELOPMENT.md) - Development practices

**Want to create a new experiment?**

1. Run: `./.agentic/scripts/create-experiment.sh`
2. Follow interactive prompts
3. See [EXPERIMENTS.md](./EXPERIMENTS.md) for templates and examples

**Working on an existing experiment?**

1. Navigate to `agentic_dev/experiment_XX/`
2. Read the experiment's `README.md`
3. Check `INDEX.md` for navigation
4. See `ARCHITECTURE.md` for design

## 📚 Documentation Map

```
Repository Root
│
├── 📖 Main Documentation
│   ├── README.md                    ← Start here! Project overview
│   ├── QUICK_REFERENCE.md          ← This file (navigation)
│   ├── AGENTIC_DEVELOPMENT.md      ← Development practices ⭐
│   ├── EXPERIMENTS.md              ← Experiment catalog & templates
│   ├── SETUP.md                    ← Environment setup guide
│   ├── SUMMARY.md                  ← Implementation summary
│   ├── AZURE_DEPLOYMENT.md         ← Azure deployment guide
│   └── MCP_CLIENT_CONFIG.md       ← MCP client setup
│
├── 🧪 Experiments (Self-Contained)
│   └── agentic_dev/
│       └── experiment_01/
│           ├── README.md            ← Quick start
│           ├── INDEX.md             ← Navigation
│           ├── ARCHITECTURE.md      ← Design
│           ├── EXPERIMENT_SCOPE.md  ← Boundaries
│           └── task.md             ← Work log
│
├── 🔬 Research (Theory & Analysis)
│   └── research/
│       ├── README.md               ← Research overview
│       ├── RESEARCH_INDEX.md       ← Research navigation
│       ├── 00_context/             ← Problem statements
│       ├── 01_literature/          ← Related work
│       ├── 02_theory/              ← Models & hypotheses
│       └── ...                     ← More research artifacts
│
└── 🛠️ Tools & Templates
    └── .agentic/
        ├── templates/              ← Experiment templates
        └── scripts/
            ├── README.md           ← Scripts documentation
            ├── create-experiment.sh ← Create new experiment
            └── validate-experiment.sh ← Validate experiment
```

## 🎯 Common Tasks

### I want to...

| Task | Documentation | Command |
|------|---------------|---------|
| **Understand the project** | [README.md](./README.md) | - |
| **Set up my environment** | [SETUP.md](./SETUP.md) | Follow guide |
| **Create a new experiment** | [EXPERIMENTS.md](./EXPERIMENTS.md) | `./.agentic/scripts/create-experiment.sh` |
| **Validate an experiment** | [.agentic/scripts/README.md](./.agentic/scripts/README.md) | `./.agentic/scripts/validate-experiment.sh` |
| **Learn development practices** | [AGENTIC_DEVELOPMENT.md](./AGENTIC_DEVELOPMENT.md) | - |
| **Deploy to Azure** | [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md) | Follow guide |
| **Configure MCP client** | [MCP_CLIENT_CONFIG.md](./MCP_CLIENT_CONFIG.md) | Follow guide |
| **Understand research** | [research/README.md](./research/README.md) | - |
| **Run experiment 01** | [agentic_dev/experiment_01/README.md](./agentic_dev/experiment_01/README.md) | `cd agentic_dev/experiment_01 && npm start` |

## 📖 Documentation by Role

### For Developers

**Essential Reading:**
1. [SETUP.md](./SETUP.md) - Get your environment ready
2. [AGENTIC_DEVELOPMENT.md](./AGENTIC_DEVELOPMENT.md) - Understand the patterns
3. [EXPERIMENTS.md](./EXPERIMENTS.md) - See what's been built

**When Building:**
- Use `.agentic/scripts/create-experiment.sh` to start
- Follow patterns in `experiment_01/`
- Validate with `.agentic/scripts/validate-experiment.sh`

### For AI Agents

**Essential Reading:**
1. [AGENTIC_DEVELOPMENT.md](./AGENTIC_DEVELOPMENT.md) - Core principles
2. Experiment's `ARCHITECTURE.md` - System design
3. Experiment's `EXPERIMENT_SCOPE.md` - Boundaries

**When Working:**
- Always read experiment's documentation first
- Stay within scope boundaries
- Document work in `task.md`
- Validate before marking complete

### For Researchers

**Essential Reading:**
1. [research/README.md](./research/README.md) - Research overview
2. [research/RESEARCH_INDEX.md](./research/RESEARCH_INDEX.md) - Artifact navigation
3. Individual research artifacts in subdirectories

### For DevOps/Deployment

**Essential Reading:**
1. [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md) - Azure deployment
2. [MCP_CLIENT_CONFIG.md](./MCP_CLIENT_CONFIG.md) - MCP configuration
3. [SETUP.md](./SETUP.md) - Prerequisites

## 🔍 Finding Specific Information

### Architecture & Design

| Question | Look Here |
|----------|-----------|
| Overall project architecture | [README.md](./README.md) → Development section |
| Experiment architecture | `agentic_dev/experiment_XX/ARCHITECTURE.md` |
| Research methodology | [research/README.md](./research/README.md) |
| Design decisions | Experiment's `ARCHITECTURE.md` → Design Decisions |

### Setup & Configuration

| Question | Look Here |
|----------|-----------|
| How to install dependencies | [SETUP.md](./SETUP.md) |
| Node.js version requirements | [SETUP.md](./SETUP.md) → Prerequisites |
| Environment variables | Experiment's `README.md` → Configuration |
| Azure Functions setup | [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md) |

### Development Workflow

| Question | Look Here |
|----------|-----------|
| How to create experiments | [EXPERIMENTS.md](./EXPERIMENTS.md) → Creating a New Experiment |
| Development best practices | [AGENTIC_DEVELOPMENT.md](./AGENTIC_DEVELOPMENT.md) → Best Practices |
| Testing guidelines | Experiment's `README.md` → Testing |
| Validation process | [.agentic/scripts/README.md](./.agentic/scripts/README.md) |

### Code Examples

| Question | Look Here |
|----------|-----------|
| MCP server implementation | `agentic_dev/experiment_01/src/` |
| CLI tool wrappers | `agentic_dev/experiment_01/src/adapters/` |
| Tool definitions | `agentic_dev/experiment_01/src/tools/` |
| Azure Functions | `functions/index.js` |

## 🗺️ Navigation Tips

### Within an Experiment

1. Start with `README.md` for quick start
2. Check `INDEX.md` for structure overview
3. Read `ARCHITECTURE.md` for design understanding
4. Review `EXPERIMENT_SCOPE.md` for boundaries
5. Track work in `task.md`

### Between Experiments

- Experiments are **independent** - each has its own docs
- Cross-reference in documentation only
- Don't import code between experiments
- Copy and adapt patterns as needed

### Repository-Wide

- Use this `QUICK_REFERENCE.md` for navigation
- Main docs are in repository root
- Experiment docs are in experiment directories
- Research docs are in `research/`
- Templates are in `.agentic/templates/`

## 🆘 Troubleshooting

### Can't find something?

1. Check this file first
2. Use repository search: `grep -r "topic" .`
3. Check experiment's `INDEX.md`
4. See [AGENTIC_DEVELOPMENT.md](./AGENTIC_DEVELOPMENT.md) → Troubleshooting

### Documentation seems outdated?

1. Check experiment's version in `package.json`
2. See experiment's `task.md` for latest updates
3. Look for dated headers in documents

### Need help?

1. Check experiment's `README.md` → Troubleshooting
2. See [SETUP.md](./SETUP.md) → Troubleshooting
3. Review related experiments for patterns
4. Check external resources linked in docs

## 📊 Documentation Standards

All experiments follow these standards:

**Required Files:**
- ✅ README.md - Quick start and usage
- ✅ INDEX.md - Navigation and structure
- ✅ ARCHITECTURE.md - Design and decisions
- ✅ EXPERIMENT_SCOPE.md - Boundaries
- ✅ task.md - Work log

**Quality Metrics:**
- README.md should be >50 lines
- Has Quick Start section
- Has Usage/Examples section
- ARCHITECTURE.md explains design
- All code has comments

**Validate with:**
```bash
./.agentic/scripts/validate-experiment.sh agentic_dev/experiment_XX
```

## 🔗 External Resources

### XPR Network
- [Official Website](https://www.protonchain.com/)
- [Proton CLI](https://github.com/XPRNetwork/proton-cli)
- [Block Explorer](https://explorer.protonchain.com/)

### Model Context Protocol
- [MCP Specification](https://modelcontextprotocol.io/)
- [MCP SDK](https://github.com/modelcontextprotocol/sdk)

### Azure
- [Azure Functions](https://azure.microsoft.com/en-us/services/functions/)
- [Azure Portal](https://portal.azure.com/)

## 📅 Document Status

| Document | Last Updated | Status |
|----------|--------------|--------|
| QUICK_REFERENCE.md | 2025-12-25 | ✅ Current |
| AGENTIC_DEVELOPMENT.md | 2025-12-25 | ✅ Current |
| EXPERIMENTS.md | 2025-12-25 | ✅ Current |
| SETUP.md | 2025-12-25 | ✅ Current |

---

**Need to update this guide?** 

This is a living document. Update it when:
- New experiments are added
- Documentation structure changes
- New tools are created
- Common questions arise

---

**Version:** 1.0.0  
**Last Updated:** 2025-12-25
