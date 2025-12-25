# XPR MCP Server

An MCP (Model Context Protocol) server for the XPR Network (Proton blockchain) CLI with Azure Functions support.

> **📖 New to this repository?** See [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for a complete navigation guide.
> 
> **🧪 Want to create experiments?** See [AGENTIC_DEVELOPMENT.md](./AGENTIC_DEVELOPMENT.md) for development practices.

## Features

- **MCP Server**: Standalone server that exposes XPR Network functionality through the Model Context Protocol
- **Azure Functions**: REST API endpoints for deploying to Azure Functions
- **Comprehensive Tools**: Access to blockchain data including accounts, balances, transactions, blocks, and more
- **Agentic Development**: Self-contained experiments following reproducible patterns

## Available Tools/Endpoints

1. **get_chain_info** - Get blockchain information (chain ID, head block, etc.)
2. **get_account** - Get detailed account information
3. **get_balance** - Get token balance for an account
4. **get_block** - Get block information by number or ID
5. **get_transaction** - Get transaction details by ID
6. **get_table_rows** - Query smart contract table data
7. **get_actions** - Get account transaction history
8. **get_abi** - Get contract ABI (Application Binary Interface)
9. **get_producers** - Get list of block producers

## Installation

```bash
npm install
```

## Usage

### As MCP Server

Run the MCP server using stdio transport:

```bash
npm start
```

The server communicates via standard input/output and can be integrated with MCP-compatible clients.

### As Azure Functions

#### Local Development

1. Install Azure Functions Core Tools:
```bash
npm install -g azure-functions-core-tools@4
```

2. Start the Azure Functions runtime:
```bash
func start
```

The functions will be available at `http://localhost:7071/api/`

#### Azure Functions Endpoints

When deployed, the following HTTP endpoints will be available:

- `GET/POST /api/getChainInfo` - Get blockchain info
- `GET/POST /api/getAccount?account_name=<name>` - Get account info
- `GET/POST /api/getBalance?account=<name>&code=eosio.token&symbol=XPR` - Get balance
- `GET/POST /api/getBlock?block_num_or_id=<num>` - Get block
- `GET/POST /api/getTransaction?transaction_id=<id>` - Get transaction
- `POST /api/getTableRows` - Get table rows (requires JSON body)
- `GET/POST /api/getActions?account_name=<name>` - Get account actions
- `GET/POST /api/getAbi?account_name=<name>` - Get contract ABI
- `GET/POST /api/getProducers?limit=50` - Get producers

#### Deploy to Azure

1. Create an Azure Function App:
```bash
az functionapp create --resource-group <resource-group> \
  --consumption-plan-location <location> \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --name <app-name> \
  --storage-account <storage-account>
```

2. Deploy the function:
```bash
func azure functionapp publish <app-name>
```

Or use the Azure Portal or VS Code Azure Functions extension to deploy.

## Configuration

### Custom XPR Network Endpoint

By default, the server uses `https://proton.eoscafeblock.com` as the XPR endpoint. To use a different endpoint:

**For MCP Server:**
Modify the `XPRClient` instantiation in `src/index.js`:
```javascript
this.xprClient = new XPRClient('https://your-custom-endpoint.com');
```

**For Azure Functions:**
Modify the `XPRClient` instantiation in `functions/index.js`:
```javascript
const xprClient = new XPRClient('https://your-custom-endpoint.com');
```

Or use environment variables (create a `.env` file or configure in Azure):
```
XPR_ENDPOINT=https://your-custom-endpoint.com
```

## Examples

### MCP Server Usage

When integrated with an MCP client, you can use tools like:

```json
{
  "name": "get_account",
  "arguments": {
    "account_name": "proton"
  }
}
```

### Azure Functions Usage

Using cURL to test endpoints:

```bash
# Get chain info
curl http://localhost:7071/api/getChainInfo

# Get account
curl "http://localhost:7071/api/getAccount?account_name=proton"

# Get balance
curl "http://localhost:7071/api/getBalance?account=proton&symbol=XPR"

# Get block
curl "http://localhost:7071/api/getBlock?block_num_or_id=1000"

# Get table rows (POST)
curl -X POST http://localhost:7071/api/getTableRows \
  -H "Content-Type: application/json" \
  -d '{
    "code": "eosio.token",
    "scope": "proton",
    "table": "accounts",
    "limit": 10
  }'
```

## Development

### Project Structure

```
.
├── src/                      # Main MCP Server implementation
│   ├── index.js              # MCP Server entry point
│   └── xpr-client.js         # XPR Network API client
├── functions/                # Azure Functions handlers
│   └── index.js
├── agentic_dev/             # Self-contained experiments
│   └── experiment_01/        # Proton CLI MCP server
├── research/                 # Research artifacts and theory
├── .agentic/                # Agentic development resources
│   └── templates/            # Templates for new experiments
├── AGENTIC_DEVELOPMENT.md   # Development practices guide
├── EXPERIMENTS.md            # Experiments catalog
├── SETUP.md                 # Environment setup guide
├── host.json                # Azure Functions configuration
├── package.json             # Project dependencies
└── README.md               # This file
```

### Agentic Development

This repository follows **agentic development practices** to enable deterministic and reproducible experiments:

- **📖 [AGENTIC_DEVELOPMENT.md](./AGENTIC_DEVELOPMENT.md)** - Core principles and patterns
- **📋 [EXPERIMENTS.md](./EXPERIMENTS.md)** - Catalog of all experiments with templates
- **⚙️ [SETUP.md](./SETUP.md)** - Complete environment setup guide

Each experiment in `agentic_dev/` is **self-contained** with:
- Its own `package.json` with all dependencies
- Complete documentation (README, ARCHITECTURE, SCOPE)
- Independent build and run capabilities
- Comprehensive task logs and learnings

**Learn more**: Start with [AGENTIC_DEVELOPMENT.md](./AGENTIC_DEVELOPMENT.md) to understand the development workflow.

### Testing

Test the XPR client functionality:

```bash
node -e "import('./src/xpr-client.js').then(m => new m.XPRClient().getInfo().then(console.log))"
```

Test an experiment:

```bash
cd agentic_dev/experiment_01
npm install && npm run build && npm start
```

## Dependencies

- `@modelcontextprotocol/sdk` (>=1.24.0) - MCP SDK with security fixes
- `@azure/functions` - Azure Functions SDK
- `node-fetch` - HTTP client for API requests

## Security

This project uses `@modelcontextprotocol/sdk` version 1.24.0 or higher, which includes DNS rebinding protection. All dependencies are checked for known vulnerabilities.

## License

ISC

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **For bug fixes or features**: Submit a pull request to the main branch
2. **For new experiments**: Use the experiment template and follow agentic practices
   - Run: `./.agentic/scripts/create-experiment.sh`
   - See: [AGENTIC_DEVELOPMENT.md](./AGENTIC_DEVELOPMENT.md)
3. **For documentation**: Update relevant docs and keep them in sync

See [AGENTIC_DEVELOPMENT.md](./AGENTIC_DEVELOPMENT.md) for detailed development practices.

## Documentation

### Quick Navigation
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - One-page navigation guide ⭐
- **[AGENTIC_DEVELOPMENT.md](./AGENTIC_DEVELOPMENT.md)** - Development practices and patterns
- **[EXPERIMENTS.md](./EXPERIMENTS.md)** - Experiment catalog and templates
- **[SETUP.md](./SETUP.md)** - Complete environment setup guide

### Deployment & Configuration
- **[AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md)** - Deploy to Azure Functions
- **[MCP_CLIENT_CONFIG.md](./MCP_CLIENT_CONFIG.md)** - Configure MCP clients

### Experiments
- **[experiment_01](./agentic_dev/experiment_01/)** - Proton CLI MCP Server

### Research
- **[research/](./research/)** - Research artifacts and theory

## Resources

- [XPR Network](https://www.protonchain.com/)
- [Proton CLI](https://github.com/XPRNetwork/proton-cli)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Azure Functions](https://azure.microsoft.com/en-us/services/functions/)
