# Experiment XX: Quick Reference & Navigation

## 📁 Project Structure

```
/agentic_dev/experiment_XX/
├── 📖 Documentation
│   ├── README.md                  ← Quick start guide (start here!)
│   ├── INDEX.md                   ← This file (navigation)
│   ├── ARCHITECTURE.md            ← Design decisions
│   ├── EXPERIMENT_SCOPE.md       ← What's in/out of scope
│   └── task.md                   ← Detailed work log
│
├── 📦 Source Code
│   ├── package.json              ← Dependencies & scripts
│   ├── tsconfig.json             ← TypeScript configuration
│   ├── src/
│   │   ├── index.ts              ← Entry point
│   │   ├── server.ts             ← Main server/logic
│   │   ├── tools/                ← MCP tools (if applicable)
│   │   │   └── index.ts
│   │   └── adapters/             ← External integrations
│   │       └── index.ts
│   └── dist/                     ← Compiled JavaScript (auto-generated)
│
└── 📋 Configuration
    ├── .gitignore                ← Git ignore rules
    └── .env.example              ← Environment variable template
```

---

## 🚀 Quick Start

### Start the Server/Tool

```bash
cd /path/to/XPR/agentic_dev/experiment_XX
npm install
npm run build
npm start
```

### Test an Endpoint

```bash
# Health check
curl http://localhost:3001/health

# Example API call
curl -X POST http://localhost:3001/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"param":"value"}'
```

---

## 📋 Document Guide

| Document | Purpose | Read When |
|----------|---------|-----------|
| **README.md** | Quick start, usage, examples | Getting started, daily use |
| **INDEX.md** | Navigation, structure overview | Finding your way around |
| **ARCHITECTURE.md** | Design decisions, tech stack | Understanding the system |
| **EXPERIMENT_SCOPE.md** | Boundaries, in/out of scope | Planning work, setting expectations |
| **task.md** | Detailed work log, implementation notes | Deep dive, debugging, learning |

---

## ✅ Verification Status

### Setup Status
- **Dependencies Installed:** [Check with `npm list`]
- **Build Status:** [Run `npm run build`]
- **Server Status:** [Run `npm start`]

### Available Tools
- **tool_1** [Status: ✅ Working / ⚠️ In Progress / ❌ Not Started]
- **tool_2** [Status: ✅ Working / ⚠️ In Progress / ❌ Not Started]
- **tool_3** [Status: ✅ Working / ⚠️ In Progress / ❌ Not Started]

### Test Results
- **Total Tests:** [Number]
- **Passing:** [Number/Total]
- **Coverage:** [Percentage or description]

---

## 🔧 Available Tools/Endpoints

### Tool: `tool_name`

**Description**: Brief description

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "param1": {"type": "string", "description": "..."}
  },
  "required": ["param1"]
}
```

**Example**:
```bash
curl -X POST http://localhost:3001/api/tool_name \
  -H "Content-Type: application/json" \
  -d '{"param1":"value"}'
```

**Response**:
```json
{
  "success": true,
  "data": {...}
}
```

---

## 📊 Key Metrics

| Metric | Value |
|--------|-------|
| Lines of Code (Source) | ~XXX |
| Tools Implemented | X |
| Test Pass Rate | XX% |
| Average Latency | ~XXXms |
| Build Time | <Xs |
| Dependencies | XXX |

---

## 🔄 Development Workflow

### Build & Run

```bash
# Compile TypeScript
npm run build

# Run compiled code
npm start

# Or run in dev mode (auto-compile & restart)
npm run dev
```

### Testing

```bash
# Run automated tests (if available)
npm test

# Manual testing with curl
curl http://localhost:3001/...

# Or use the interactive landing page
http://localhost:3001
```

### Making Changes

```bash
# 1. Edit code in src/
# 2. Rebuild
npm run build

# 3. Restart server
npm start

# 4. Test changes
curl http://localhost:3001/...

# 5. Document in task.md
```

---

## 🎯 Next Steps

### Current Iteration Goals
- [ ] Goal 1
- [ ] Goal 2
- [ ] Goal 3

### Future Iteration Ideas
- [ ] Enhancement 1
- [ ] Enhancement 2
- [ ] Enhancement 3

---

## 📞 Related Documentation

### In This Experiment
- [README.md](./README.md) - Quick start guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Design and architecture
- [EXPERIMENT_SCOPE.md](./EXPERIMENT_SCOPE.md) - Scope boundaries
- [task.md](./task.md) - Work log and implementation details

### Repository-Wide
- [Main README](../../README.md) - Project overview
- [Agentic Development Guide](../../AGENTIC_DEVELOPMENT.md) - Development practices
- [Experiments Catalog](../../EXPERIMENTS.md) - All experiments
- [Setup Guide](../../SETUP.md) - Environment setup

### External Resources
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [XPR Network](https://www.protonchain.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 💡 Quick Tips

- **Server won't start?** Check if port is in use: `lsof -i :3001`
- **Build errors?** Try clean rebuild: `rm -rf dist/ && npm run build`
- **Dependencies missing?** Run `npm install` in this directory
- **Need examples?** Check README.md for usage examples
- **Confused?** Start with README.md, then read ARCHITECTURE.md

---

## 🔍 Finding Things

### To Find...
- **How to run**: README.md → Quick Start
- **Available endpoints**: README.md → Usage or INDEX.md → Available Tools
- **Design decisions**: ARCHITECTURE.md
- **What's in scope**: EXPERIMENT_SCOPE.md
- **Implementation details**: task.md
- **Code structure**: Look at this file's Project Structure section

### Common Files
- **Entry point**: `src/index.ts`
- **Main logic**: `src/server.ts`
- **Tools**: `src/tools/`
- **External wrappers**: `src/adapters/`
- **Build output**: `dist/` (auto-generated)

---

## 📝 Status & Timeline

**Current Status:** [In Progress / Complete / Blocked]

**Started:** YYYY-MM-DD

**Last Updated:** YYYY-MM-DD

**Completion Target:** YYYY-MM-DD (if applicable)

---

**Last Updated:** YYYY-MM-DD  
**Version:** 1.0.0
