# GitHub Codespaces Setup Guide

## Current Status ✅

1. ✅ Azure Function is running on port 7071
2. ✅ MCP server is active and responding
3. ✅ Configuration updated for Codespaces URL
4. ✅ SSE transport configured

## Testing Steps

### Step 1: Verify Port is Public

1. Click on the **PORTS** tab at the bottom of VS Code
2. Find port **7071** in the list
3. Right-click and select **Port Visibility** → **Public**
4. Verify the URL matches: `https://redesigned-computing-machine-pjgq5gq4j494h6rv4-7071.app.github.dev`

### Step 2: Start the MCP Server in VS Code

1. Open the file: `.vscode/mcp.json`
2. You should see a **Start** button above `local-mcp-server`
3. Click the **Start** button
4. Wait for the server to initialize and show available tools

### Step 3: Test with GitHub Copilot

1. Open GitHub Copilot Chat:
   - Press `Ctrl+Alt+I` (Linux/Windows) or `Ctrl+Command+I` (Mac)
   - Or click the Copilot icon at the top

2. Switch to **Agent** mode in the chat window

3. Click the **tools icon** (🔧) and ensure **local-mcp-server** is checked

4. Once connected, you should see the number of available tools (should be 3 weather tools)

5. Test with a query:
   ```
   Return the weather in NYC using #local-mcp-server
   ```

### Expected Results

The MCP server provides the following tools:
- `get_forecast` - Get weather forecast for a location
- `get_alerts` - Get weather alerts for a state
- `get_current_weather` - Get current weather conditions

Copilot should be able to call these tools to answer weather-related questions.

## Server Details

- **Endpoint**: `https://redesigned-computing-machine-pjgq5gq4j494h6rv4-7071.app.github.dev/mcp`
- **Transport**: Server-Sent Events (SSE)
- **Local Port**: 7071
- **Status**: Running in background

## Troubleshooting

### If the server isn't responding:

1. Check if it's still running:
   ```bash
   jobs
   ```

2. Check the logs:
   ```bash
   tail -50 /tmp/func.log
   ```

3. Restart if needed:
   ```bash
   cd /workspaces/XPR/agentic_dev/experiment_02/mcp-sdk-functions-hosting-python
   /home/codespace/.local/bin/uv run func start --port 7071 2>&1 | tee /tmp/func.log &
   ```

### If port visibility fails:

- Make sure you're setting port 7071 to **Public** (not Private or Org-only)
- The Codespaces URL should be accessible without authentication

### If MCP connection fails:

- Verify the URL in `.vscode/mcp.json` matches your Codespaces URL
- Ensure `"type": "sse"` is set (not "http")
- Check that the function is running and healthy

## Next Steps

After testing locally, you can:
1. Deploy to Azure using `azd up`
2. Update the `remote-mcp-server` configuration with your Azure Function URL
3. Use the same testing process with the remote server
