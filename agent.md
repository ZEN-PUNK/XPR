# XPR MCP Server - Agentic Development

This file provides a high-level overview for AI agents working with the XPR MCP Server codebase.

## What This Is

An MCP (Model Context Protocol) server for the XPR Network (Proton blockchain) with dual deployment:
1. **MCP Server** - AI agent integration via stdio
2. **Azure Functions** - REST API for web/mobile apps

## Quick Start for Agents

**First 5 minutes:**
1. Read [AGENTIC_GUIDE.md](./AGENTIC_GUIDE.md) - Navigation and patterns
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
3. Check [API_REFERENCE.md](./API_REFERENCE.md) - Tool specifications
4. See [AGENT_PATTERNS.md](./AGENT_PATTERNS.md) - Best practices

**Core files (830 lines total):**
- `src/index.js` - MCP server implementation
- `src/xpr-client.js` - XPR Network RPC client  
- `functions/index.js` - Azure Functions handlers

**To run:**
```bash
npm start              # MCP server
func start            # Azure Functions
npm test              # Structure validation
```

## Key Principles

1. **Direct RPC** - No CLI dependencies, faster responses
2. **Shared Client** - XPRClient powers both MCP and Azure
3. **Read-Only** - Safe, no transaction signing (for now)
4. **ES Modules** - Modern JavaScript, no build step
5. **Minimal Dependencies** - MCP SDK, Azure Functions, node-fetch

## Documentation Structure

| Document | Purpose |
|----------|---------|
| AGENTIC_GUIDE.md | Agent navigation and workflows |
| ARCHITECTURE.md | System design and decisions |
| API_REFERENCE.md | Complete API documentation |
| AGENT_PATTERNS.md | Development best practices |
| README.md | User-facing documentation |
| AZURE_DEPLOYMENT.md | Azure deployment guide |
| MCP_CLIENT_CONFIG.md | MCP client configuration |

## Common Tasks

**Add new tool:**
1. Add method to `src/xpr-client.js`
2. Add tool to `src/index.js` (definition + handler)
3. (Optional) Add to `functions/index.js`
4. Update docs
5. Test and commit

**Fix bug:**
1. Locate: Error in tool → `src/index.js`, in RPC → `src/xpr-client.js`
2. Fix in single module
3. Test with `npm test` and manual verification
4. Update docs if needed

**Deploy:**
- MCP: Integrate with AI agent/Copilot client
- Azure: `func azure functionapp publish <app-name>`

## References

- [XPR Network](https://www.protonchain.com/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Azure Functions](https://azure.microsoft.com/services/functions/)

**Next step:** Read AGENTIC_GUIDE.md for detailed workflows and patterns.
