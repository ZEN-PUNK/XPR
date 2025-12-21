# MCP Client Configuration Examples

## Claude Desktop Configuration

To use this MCP server with Claude Desktop, add the following to your `claude_desktop_config.json`:

### macOS
Location: `~/Library/Application Support/Claude/claude_desktop_config.json`

### Windows
Location: `%APPDATA%\Claude\claude_desktop_config.json`

### Linux
Location: `~/.config/Claude/claude_desktop_config.json`

### Configuration

```json
{
  "mcpServers": {
    "xpr-network": {
      "command": "node",
      "args": ["/absolute/path/to/XPR/src/index.js"]
    }
  }
}
```

Replace `/absolute/path/to/XPR` with the actual path to your XPR MCP server installation.

## VSCode MCP Extension Configuration

If using an MCP extension in VSCode:

```json
{
  "mcp.servers": [
    {
      "name": "XPR Network",
      "command": "node",
      "args": ["src/index.js"],
      "cwd": "/path/to/XPR"
    }
  ]
}
```

## Other MCP Clients

For other MCP-compatible clients, use:
- **Command**: `node`
- **Arguments**: `["src/index.js"]`
- **Working Directory**: The XPR MCP server directory
- **Transport**: stdio

## Example MCP Tool Calls

Once configured, you can use these tools through your MCP client:

### Get Chain Information
```
Use the get_chain_info tool to get XPR blockchain information
```

### Get Account Details
```
Use the get_account tool with account_name "proton" to get account information
```

### Check Balance
```
Use the get_balance tool to check the XPR balance for account "proton"
```

### Query Block Data
```
Use the get_block tool to get information about block 1000000
```

### View Transaction History
```
Use the get_actions tool to get the last 20 transactions for account "proton"
```

### Query Smart Contract Tables
```
Use the get_table_rows tool to query the "accounts" table in the "eosio.token" contract for scope "proton"
```

## Testing the Server

You can test if the server is working by running it directly:

```bash
cd /path/to/XPR
npm start
```

The server will start and wait for MCP protocol messages on stdin. It will output diagnostic messages to stderr.

To test with a simple MCP client or manually:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npm start
```

This should return a list of available tools.
