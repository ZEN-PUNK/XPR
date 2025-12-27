# XPR-MCP Server - Experiment 02

**Status:** Early Python SDK Implementation  
**Project:** Proton Blockchain MCP Server  
**Repository:** XPR Network Integration

This experiment explores hosting an MCP server for Proton blockchain using the official Python MCP SDK on Azure Functions as a custom handler.

## Overview

This directory contains an early implementation of the XPR-MCP server using:
- **Python MCP SDK** for server implementation
- **Azure Functions** for serverless hosting
- **Proton RPC endpoints** for blockchain data access

## Architecture

```
xpr-mcp server (Python SDK)
    ↓
Azure Functions (Custom Handler)
    ↓
Proton Blockchain (RPC endpoints)
```

## Prerequisites

* [Azure subscription](https://azure.microsoft.com/free/) (optional, for cloud deployment)
* [Azure Developer CLI](https://learn.microsoft.com/azure/developer/azure-developer-cli/install-azd) v1.17.2 or above
* [Azure Functions Core Tools](https://learn.microsoft.com/azure/azure-functions/functions-run-local) v4.5.0 or above
* [Visual Studio Code](https://code.visualstudio.com/)
* [uv](https://docs.astral.sh/uv/getting-started/installation/) - Python package manager

## Project Structure

```
experiment_02/
├── mcp-server/
│   ├── server.py          # Main MCP server implementation
│   ├── host.json          # Azure Functions configuration
│   ├── requirements.txt   # Python dependencies
│   └── infra/            # Azure infrastructure definitions
├── README.md             # This file
└── AGENTIC_GUIDE.md      # AI agent development guide
```

## Getting Started

### Local Testing

1. Navigate to the mcp-server directory:
   ```bash
   cd /workspaces/XPR/agentic_dev/experiment_02/mcp-server
   ```

2. Start the server locally:
   ```bash
   uv run func start
   ```

3. Configure your MCP client (e.g., VS Code) to connect to `http://localhost:7071`

### Deployment (Optional)

If you want to deploy to Azure Functions:

1. Register resource provider:
   ```bash
   az provider register --namespace 'Microsoft.App'
   ```

2. Deploy:
   ```bash
   azd up
   ```

## Server Requirements

Your server must be:
- **Stateless** - No persistent state between requests
- **HTTP-based** - Uses streamable HTTP transport
- **RPC-connected** - Connects to Proton blockchain RPC endpoints

## Available Tools

The server provides blockchain query tools for:
- Account information
- Token balances
- Smart contract data
- Transaction history
- Block data

## Related Experiments

- **experiment_01:** Azure Functions direct integration
- **experiment_03:** Advanced MCP server features
- **experiment_04:** Production-ready implementation (recommended)

## Migration Note

⚠️ This experiment  was an early exploration. For production use, see experiments that are in the future which contains the latest stable implementation with 27+ tools and comprehensive documentation.

## Troubleshooting

1. **Server won't start locally**
   - Ensure Azure Functions Core Tools >= 4.5.0: `func --version`
   - Check Python dependencies are installed: `uv sync`

2. **Deployment fails**
   - Verify `Microsoft.App` provider is registered: `az provider show -n Microsoft.App`
   - Ensure `azd` is up to date: `azd version`

3. **RPC connection errors**
   - Check Proton RPC endpoints are accessible
   - Verify network connectivity


## Resources

- [Proton Blockchain Documentation](https://docs.protonchain.com/)
- [MCP Specification](https://modelcontextprotocol.io/)
- [Azure Functions Documentation](https://learn.microsoft.com/azure/azure-functions/)

---

**Project:** XPR Network MCP Integration  
**Experiment:** 02 - Python SDK Implementation  
**Status:** Archived (see next experiment_03 for latest)



