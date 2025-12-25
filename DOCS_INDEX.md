# XPR MCP Server - Documentation Index

Complete guide to all documentation for the XPR MCP Server. Start here to navigate the documentation efficiently.

## 🚀 Quick Start

**New to the project?** Start here:
1. [README.md](./README.md) - Overview, installation, and basic usage
2. [AGENTIC_GUIDE.md](./AGENTIC_GUIDE.md) - Agent-focused navigation and workflows

**Want to use the server?**
- [README.md](./README.md) - Basic usage and deployment
- [MCP_CLIENT_CONFIG.md](./MCP_CLIENT_CONFIG.md) - MCP client configuration
- [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md) - Azure Functions deployment
- [examples/README.md](./examples/README.md) - Usage examples

**Want to contribute?**
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [AGENT_PATTERNS.md](./AGENT_PATTERNS.md) - Development patterns
- [AGENTIC_GUIDE.md](./AGENTIC_GUIDE.md) - Agent workflows

---

## 📚 Documentation Structure

### User Documentation

For users who want to use the XPR MCP Server:

| Document | Description | When to Read |
|----------|-------------|--------------|
| **[README.md](./README.md)** | Project overview, installation, basic usage | First time setup |
| **[MCP_CLIENT_CONFIG.md](./MCP_CLIENT_CONFIG.md)** | Configure MCP clients (VS Code, Claude) | MCP integration |
| **[AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md)** | Deploy to Azure Functions | Azure deployment |
| **[examples/README.md](./examples/README.md)** | Complete usage examples | Learning by example |

### Developer Documentation

For developers and AI agents working on the codebase:

| Document | Description | When to Read |
|----------|-------------|--------------|
| **[AGENTIC_GUIDE.md](./AGENTIC_GUIDE.md)** | Navigation, workflows, quick reference | Starting development |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | System design, data flow, decisions | Understanding structure |
| **[API_REFERENCE.md](./API_REFERENCE.md)** | Complete API documentation | Implementing features |
| **[AGENT_PATTERNS.md](./AGENT_PATTERNS.md)** | Code patterns and best practices | Writing code |
| **[CONTRIBUTING.md](./CONTRIBUTING.md)** | Contribution guidelines and workflow | Before contributing |

### Reference Documentation

Quick reference and additional information:

| Document | Description | When to Read |
|----------|-------------|--------------|
| **[agent.md](./agent.md)** | High-level agent overview | Quick context |
| **[SUMMARY.md](./SUMMARY.md)** | Project summary | Project overview |
| **package.json** | Dependencies and scripts | Understanding dependencies |

---

## 🎯 Documentation by Use Case

### Use Case 1: I'm an AI Agent Starting Work

**Read in order:**
1. [agent.md](./agent.md) - 2 min overview
2. [AGENTIC_GUIDE.md](./AGENTIC_GUIDE.md) - 10 min navigation guide
3. [ARCHITECTURE.md](./ARCHITECTURE.md) - 15 min system design
4. [AGENT_PATTERNS.md](./AGENT_PATTERNS.md) - Reference as needed

**Quick reference:**
- [API_REFERENCE.md](./API_REFERENCE.md) - Tool specifications
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Workflow guidelines

### Use Case 2: I Want to Add a New Tool

**Read in order:**
1. [AGENT_PATTERNS.md](./AGENT_PATTERNS.md) - "Tool Development Patterns" section
2. [CONTRIBUTING.md](./CONTRIBUTING.md) - "Adding New Features" section
3. [API_REFERENCE.md](./API_REFERENCE.md) - See existing tool examples

**Files to edit:**
- `src/xpr-client.js` - Add RPC method
- `src/index.js` - Add MCP tool
- `functions/index.js` - (Optional) Add Azure Function
- [API_REFERENCE.md](./API_REFERENCE.md) - Document new tool

### Use Case 3: I Want to Deploy the Server

**For MCP deployment:**
1. [README.md](./README.md) - "As MCP Server" section
2. [MCP_CLIENT_CONFIG.md](./MCP_CLIENT_CONFIG.md) - Client configuration

**For Azure deployment:**
1. [README.md](./README.md) - "As Azure Functions" section
2. [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md) - Detailed deployment guide

### Use Case 4: I Want to Use the API

**For MCP tools:**
1. [API_REFERENCE.md](./API_REFERENCE.md) - "MCP Tools" section
2. [examples/README.md](./examples/README.md) - "MCP Server Examples" section

**For Azure Functions:**
1. [API_REFERENCE.md](./API_REFERENCE.md) - "Azure Functions Endpoints" section
2. [examples/README.md](./examples/README.md) - "Azure Functions Examples" section

**For direct XPR client:**
1. [API_REFERENCE.md](./API_REFERENCE.md) - "XPR Client Methods" section
2. [examples/README.md](./examples/README.md) - "XPR Client Examples" section

### Use Case 5: I Found a Bug

**Steps:**
1. Check [AGENT_PATTERNS.md](./AGENT_PATTERNS.md) - "Fixing a Bug" pattern
2. Review [CONTRIBUTING.md](./CONTRIBUTING.md) - Workflow guidelines
3. Fix the bug following established patterns
4. Update documentation if needed
5. Test with `npm test`

### Use Case 6: I Want to Understand the Architecture

**Read in order:**
1. [ARCHITECTURE.md](./ARCHITECTURE.md) - Complete system design
2. [agent.md](./agent.md) - High-level principles
3. [API_REFERENCE.md](./API_REFERENCE.md) - "Data Flow" section

**Visual understanding:**
- See diagrams in [ARCHITECTURE.md](./ARCHITECTURE.md)
- Review module structure in `src/` directory

---

## 📖 Reading Path by Role

### For End Users

1. [README.md](./README.md) - Setup and usage
2. [examples/README.md](./examples/README.md) - Examples
3. [API_REFERENCE.md](./API_REFERENCE.md) - API details
4. [MCP_CLIENT_CONFIG.md](./MCP_CLIENT_CONFIG.md) or [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md) - Deployment

**Estimated time:** 30 minutes

### For Contributors

1. [AGENTIC_GUIDE.md](./AGENTIC_GUIDE.md) - Navigation (10 min)
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - System design (15 min)
3. [AGENT_PATTERNS.md](./AGENT_PATTERNS.md) - Patterns (20 min)
4. [CONTRIBUTING.md](./CONTRIBUTING.md) - Workflow (10 min)
5. [API_REFERENCE.md](./API_REFERENCE.md) - Reference as needed

**Estimated time:** 60 minutes

### For AI Agents

1. [agent.md](./agent.md) - Quick overview (2 min)
2. [AGENTIC_GUIDE.md](./AGENTIC_GUIDE.md) - Complete guide (10 min)
3. [ARCHITECTURE.md](./ARCHITECTURE.md) - System context (10 min)
4. Keep [AGENT_PATTERNS.md](./AGENT_PATTERNS.md) and [API_REFERENCE.md](./API_REFERENCE.md) as reference

**Estimated time:** 25 minutes initial, then reference as needed

---

## 🔍 Quick Reference

### File Locations

**Core code:**
- `src/index.js` - MCP server implementation
- `src/xpr-client.js` - XPR Network RPC client
- `functions/index.js` - Azure Functions handlers

**Documentation:**
- Root level - All documentation files
- `examples/` - Usage examples

**Configuration:**
- `package.json` - Dependencies and scripts
- `host.json` - Azure Functions configuration
- `.gitignore` - Excluded files

### Key Commands

```bash
# Install
npm install

# Test
npm test

# Run MCP server
npm start

# Run Azure Functions
func start

# Deploy to Azure
func azure functionapp publish <app-name>
```

### Key Endpoints

**MCP server:**
- stdio transport on `npm start`

**Azure Functions (local):**
- `http://localhost:7071/api/getChainInfo`
- `http://localhost:7071/api/getAccount?account_name=proton`
- See [API_REFERENCE.md](./API_REFERENCE.md) for complete list

---

## 📝 Document Descriptions

### AGENTIC_GUIDE.md
**Purpose:** Primary navigation guide for AI agents and developers
**Length:** ~10,000 words
**Key sections:**
- Quick navigation (5-minute start)
- Workflow patterns
- Code navigation tips
- Common tasks

### ARCHITECTURE.md
**Purpose:** Complete system design documentation
**Length:** ~17,500 words
**Key sections:**
- High-level architecture
- Module structure
- Data flow
- Design decisions
- Performance characteristics
- Security considerations

### API_REFERENCE.md
**Purpose:** Complete API documentation
**Length:** ~20,000 words
**Key sections:**
- MCP tools (9 tools)
- Azure Functions endpoints (9 endpoints)
- XPR Client methods (11 methods)
- Data types and error handling

### AGENT_PATTERNS.md
**Purpose:** Development patterns and best practices
**Length:** ~18,000 words
**Key sections:**
- Code organization patterns
- Tool development patterns
- Error handling patterns
- Testing patterns
- Security patterns

### CONTRIBUTING.md
**Purpose:** Contribution guidelines
**Length:** ~11,000 words
**Key sections:**
- Getting started
- Development workflow
- Adding new features
- Code standards
- Testing
- Documentation

### examples/README.md
**Purpose:** Complete usage examples
**Length:** ~16,000 words
**Key sections:**
- MCP server examples
- Azure Functions examples
- XPR Client examples
- Integration examples

---

## 🆘 Getting Help

### Where to Look

**Question: "How do I...?"**
- Add a tool? → [AGENT_PATTERNS.md](./AGENT_PATTERNS.md) or [CONTRIBUTING.md](./CONTRIBUTING.md)
- Deploy? → [README.md](./README.md), [MCP_CLIENT_CONFIG.md](./MCP_CLIENT_CONFIG.md), or [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md)
- Use the API? → [API_REFERENCE.md](./API_REFERENCE.md) or [examples/README.md](./examples/README.md)
- Understand the code? → [ARCHITECTURE.md](./ARCHITECTURE.md) or [AGENTIC_GUIDE.md](./AGENTIC_GUIDE.md)

**Question: "Where is...?"**
- Tool definitions? → `src/index.js` lines 34-192
- RPC methods? → `src/xpr-client.js`
- Azure handlers? → `functions/index.js`
- Examples? → `examples/` directory

### Common Issues

**Tests failing?**
1. Run `npm install`
2. Check [CONTRIBUTING.md](./CONTRIBUTING.md) testing section

**Can't find a file?**
1. Check this index
2. Use `grep` or file search

**Don't understand a pattern?**
1. Check [AGENT_PATTERNS.md](./AGENT_PATTERNS.md)
2. Look at existing code examples
3. Review [examples/README.md](./examples/README.md)

---

## 🎯 Documentation Goals

This documentation structure aims to:
1. **Enable quick onboarding** - Get started in 5 minutes
2. **Support agentic development** - AI agents can navigate and contribute
3. **Provide complete reference** - All APIs fully documented
4. **Show by example** - Real, working code examples
5. **Maintain consistency** - Follow established patterns

---

## 📌 Last Updated

This index was created as part of making the XPR MCP Server "agentic" and is maintained alongside the codebase.

**Next steps:**
- Start with [README.md](./README.md) or [AGENTIC_GUIDE.md](./AGENTIC_GUIDE.md)
- Jump to your specific use case above
- Keep this index bookmarked for quick reference

**Happy coding! 🚀**
