# Creating Your Custom MCP Server

Your MCP server is already running at:
**`https://redesigned-computing-machine-pjgq5gq4j494h6rv4-7071.app.github.dev/mcp`**

This guide shows you how to customize it with your own tools.

## Understanding the Current Setup

### 1. Server File: `server.py`

The main MCP server is defined in `server.py`. It currently has 3 weather tools:
- `get_alerts` - Get weather alerts for a US state
- `get_forecast` - Get weather forecast for coordinates
- `get_user_info` - Demonstrate Azure AD authentication

### 2. How It Works

```python
from mcp.server.fastmcp import FastMCP

# Create the MCP server instance
mcp = FastMCP("weather", stateless_http=True)

# Add tools using the @mcp.tool() decorator
@mcp.tool()
async def your_tool_name(param1: str, param2: int) -> str:
    """
    Tool description that appears to the AI.
    
    Args:
        param1: Description of parameter 1
        param2: Description of parameter 2
    """
    # Your tool logic here
    return "Result"

# Run the server
if __name__ == "__main__":
    mcp.run(transport="streamable-http")
```

## Adding Your Own Tools

### Example 1: Simple Tool

Edit `server.py` and add a new tool:

```python
@mcp.tool()
async def hello_world(name: str) -> str:
    """
    Say hello to someone.
    
    Args:
        name: The name of the person to greet
    """
    return f"Hello, {name}! Welcome to the custom MCP server."
```

### Example 2: Tool with API Call

```python
@mcp.tool()
async def get_blockchain_data(account: str) -> str:
    """
    Get blockchain account data from XPR Network.
    
    Args:
        account: The account name to query
    """
    url = f"https://api.xprnetwork.org/v1/chain/get_account"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                url,
                json={"account_name": account},
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            
            return f"""Account: {data.get('account_name')}
Balance: {data.get('core_liquid_balance', 'N/A')}
RAM: {data.get('ram_quota', 0)} bytes
CPU: {data.get('cpu_limit', {})}
"""
        except Exception as e:
            return f"Error fetching account data: {str(e)}"
```

### Example 3: Tool with Multiple Operations

```python
@mcp.tool()
async def search_transactions(
    account: str,
    limit: int = 10,
    action_name: str = None
) -> str:
    """
    Search for account transactions on XPR Network.
    
    Args:
        account: Account name to search
        limit: Maximum number of transactions to return (default: 10)
        action_name: Optional filter by action name
    """
    # Your search logic here
    results = []
    
    # Example implementation
    url = "https://api.xprnetwork.org/v2/history/get_actions"
    params = {
        "account": account,
        "limit": limit
    }
    
    if action_name:
        params["filter"] = action_name
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        data = response.json()
        
        for action in data.get("actions", []):
            results.append(f"- {action.get('act', {}).get('name')}: {action.get('act', {}).get('data')}")
    
    return "\n".join(results)
```

## Modifying the Server Name

Change the server name from "weather" to your own:

```python
# Line 25 in server.py
mcp = FastMCP("your-server-name", stateless_http=True)
```

## Testing Your Changes

### 1. Stop the Current Server

```bash
# Find the job number
jobs

# Kill it (replace [1] with your job number)
kill %1
```

### 2. Restart with Your Changes

```bash
cd /workspaces/XPR/agentic_dev/experiment_02/mcp-sdk-functions-hosting-python
/home/codespace/.local/bin/uv run func start --port 7071 2>&1 | tee /tmp/func.log &
```

### 3. Test with curl

```bash
# List available tools
timeout 3 curl -N -X POST http://localhost:7071/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' 2>&1 | head -30
```

### 4. Test with VS Code

1. Open `.vscode/mcp.json`
2. Click **Restart** button for `local-mcp-server` (if already running)
3. Click **Start** button if not running
4. Use Copilot to test your new tools

## Complete Example: XPR Network Tools

Here's a complete example you can copy into `server.py`:

```python
import os
import sys
import warnings
import logging
from typing import Any

import httpx
from mcp.server.fastmcp import FastMCP

# Reduce logging verbosity
logging.getLogger("mcp").setLevel(logging.WARNING)
logging.getLogger("uvicorn").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)

warnings.filterwarnings("ignore", category=DeprecationWarning, module="websockets.legacy")
warnings.filterwarnings("ignore", category=DeprecationWarning, module="uvicorn.protocols.websockets")

# Initialize FastMCP server
mcp = FastMCP("xpr-network", stateless_http=True)

# Constants
XPR_API_BASE = "https://api.xprnetwork.org"

@mcp.tool()
async def get_account_info(account: str) -> str:
    """
    Get XPR Network account information.
    
    Args:
        account: The account name to query
    """
    url = f"{XPR_API_BASE}/v1/chain/get_account"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                url,
                json={"account_name": account},
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            
            return f"""Account Information:
Name: {data.get('account_name')}
Balance: {data.get('core_liquid_balance', 'N/A')}
RAM: {data.get('ram_quota', 0):,} bytes
CPU Limit: {data.get('cpu_limit', {}).get('max', 'N/A')}
NET Limit: {data.get('net_limit', {}).get('max', 'N/A')}
Created: {data.get('created', 'N/A')}
"""
        except Exception as e:
            return f"Error fetching account: {str(e)}"

@mcp.tool()
async def get_token_balance(account: str, token_symbol: str = "XPR") -> str:
    """
    Get token balance for an account.
    
    Args:
        account: The account name
        token_symbol: Token symbol (default: XPR)
    """
    url = f"{XPR_API_BASE}/v1/chain/get_currency_balance"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                url,
                json={
                    "account": account,
                    "code": "eosio.token",
                    "symbol": token_symbol
                },
                timeout=30.0
            )
            response.raise_for_status()
            balances = response.json()
            
            if not balances:
                return f"No {token_symbol} balance found for {account}"
            
            return f"Balance for {account}: {balances[0]}"
        except Exception as e:
            return f"Error fetching balance: {str(e)}"

@mcp.tool()
async def get_table_rows(
    code: str,
    table: str,
    scope: str,
    limit: int = 10
) -> str:
    """
    Query blockchain table data.
    
    Args:
        code: Contract account name
        table: Table name
        scope: Scope of the table
        limit: Number of rows to return (default: 10)
    """
    url = f"{XPR_API_BASE}/v1/chain/get_table_rows"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                url,
                json={
                    "code": code,
                    "table": table,
                    "scope": scope,
                    "limit": limit,
                    "json": True
                },
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            
            rows = data.get('rows', [])
            if not rows:
                return f"No data found in {code}::{table}"
            
            # Format rows
            result = f"Table: {code}::{table} (scope: {scope})\n\n"
            for idx, row in enumerate(rows, 1):
                result += f"Row {idx}:\n"
                for key, value in row.items():
                    result += f"  {key}: {value}\n"
                result += "\n"
            
            return result
        except Exception as e:
            return f"Error fetching table data: {str(e)}"

if __name__ == "__main__":
    try:
        print("Starting XPR Network MCP server...")
        mcp.run(transport="streamable-http")
    except Exception as e:
        print(f"Error while running MCP server: {e}", file=sys.stderr)
```

## Next Steps

1. **Backup the original**: `cp server.py server.py.backup`
2. **Edit `server.py`** with your custom tools
3. **Restart the server** (see Testing section above)
4. **Test in VS Code** with Copilot
5. **Deploy to Azure** when ready: `azd up`

## File Structure

```
mcp-sdk-functions-hosting-python/
├── server.py              # Your MCP server code (edit this!)
├── host.json             # Azure Functions configuration
├── local.settings.json   # Local environment settings
├── pyproject.toml        # Python dependencies
├── .vscode/
│   └── mcp.json          # MCP client configuration
└── infra/                # Azure deployment config
```

## Adding Dependencies

If you need additional Python packages:

1. Add to `pyproject.toml`:
   ```toml
   dependencies = [
       "fastmcp>=0.2.0",
       "httpx>=0.28.0",
       "your-package-name>=1.0.0"
   ]
   ```

2. Reinstall:
   ```bash
   /home/codespace/.local/bin/uv sync
   ```

## Troubleshooting

### Server won't start
- Check syntax errors in `server.py`
- View logs: `tail -f /tmp/func.log`

### Tools not appearing
- Verify `@mcp.tool()` decorator is present
- Check function signature has type hints
- Restart the MCP server in VS Code

### Runtime errors
- Add try/catch blocks around external API calls
- Return descriptive error messages
- Check logs for stack traces

## Resources

- [FastMCP Documentation](https://github.com/modelcontextprotocol/fastmcp)
- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [Azure Functions Python Guide](https://learn.microsoft.com/azure/azure-functions/functions-reference-python)
