import os
import sys
import warnings
import logging
import json
import subprocess
from typing import Any
from pathlib import Path

import httpx
from azure.identity import OnBehalfOfCredential, ManagedIdentityCredential
from mcp.server.fastmcp import FastMCP
from fastmcp.server.dependencies import get_http_request
from starlette.requests import Request
from starlette.responses import HTMLResponse

# Reduce logging noise
logging.getLogger("mcp").setLevel(logging.WARNING)
logging.getLogger("uvicorn").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)

warnings.filterwarnings("ignore", category=DeprecationWarning, module="websockets.legacy")
warnings.filterwarnings("ignore", category=DeprecationWarning, module="uvicorn.protocols.websockets")

# Initialize FastMCP
mcp = FastMCP("xpr-blockchain", stateless_http=True)

# ------------------------------------------------------------
# Proton RPC Endpoints (Failover Enabled)
# ------------------------------------------------------------
PROTON_RPC_ENDPOINTS = [
    "https://proton.greymass.com",
    "https://api.protonchain.com",
    "https://proton.cryptolions.io",
    "https://proton.eosusa.io",
]

# ------------------------------------------------------------
# RPC Helper
# ------------------------------------------------------------
async def call_proton_rpc(endpoint: str, body: dict[str, Any]) -> dict[str, Any]:
    """Call Proton blockchain RPC API with automatic failover."""
    last_error = None

    async with httpx.AsyncClient(timeout=10.0) as client:
        for base_url in PROTON_RPC_ENDPOINTS:
            try:
                response = await client.post(
                    f"{base_url}{endpoint}",
                    json=body
                )
                response.raise_for_status()
                return response.json()

            except httpx.HTTPError as e:
                last_error = {
                    "endpoint": base_url,
                    "error": str(e),
                    "status_code": getattr(e.response, "status_code", None)
                }
            except Exception as e:
                last_error = {
                    "endpoint": base_url,
                    "error": str(e)
                }

    return {
        "error": "All Proton RPC endpoints failed",
        "last_error": last_error
    }

# ------------------------------------------------------------
# Local CLI (dev only)
# ------------------------------------------------------------
async def execute_proton_cli(command: list[str]) -> dict[str, Any]:
    """Local-only Proton CLI support (not used in Azure)."""
    cli_path = "/workspaces/XPR/proton-cli/bin/run"
    if not os.path.exists(cli_path):
        return {
            "error": "Proton CLI not available in this environment.",
            "suggestion": "Use RPC API instead."
        }

    try:
        result = subprocess.run(
            [cli_path] + command,
            capture_output=True,
            text=True,
            timeout=10
        )

        if result.returncode != 0:
            return {
                "error": "CLI command failed",
                "stderr": result.stderr,
                "returncode": result.returncode
            }

        return {
            "success": True,
            "output": result.stdout
        }

    except subprocess.TimeoutExpired:
        return {"error": "Command timed out"}
    except Exception as e:
        return {"error": str(e)}

# ------------------------------------------------------------
# MCP Tools
# ------------------------------------------------------------
@mcp.tool()
async def get_account(account_name: str) -> str:
    """Get Proton blockchain account info."""
    result = await call_proton_rpc(
        "/v1/chain/get_account",
        {"account_name": account_name}
    )

    if "error" in result:
        return f"Error: {result['error']}"

    return json.dumps(result, indent=2)

@mcp.tool()
async def get_user_info() -> str:
    """
    Demonstrate extracting the bearer token from the incoming Authorization header to exchange for Graph API token.

    Returns:
        String with user info or error message.
    """
    request = get_http_request()

    auth_header = request.headers.get("authorization", "")
    
    if not auth_header:
        return "Error: No access token found in request"
    
    # Extract bearer token (remove "Bearer " prefix if present)
    access_token = auth_header.replace("Bearer ", "").replace("bearer ", "").strip()
        
   # Get required environment variables
    token_exchange_audience = os.environ.get("TokenExchangeAudience", "api://AzureADTokenExchange")
    public_token_exchange_scope = f"{token_exchange_audience}/.default"
    federated_credential_client_id = os.environ.get("OVERRIDE_USE_MI_FIC_ASSERTION_CLIENTID")
    client_id = os.environ.get("WEBSITE_AUTH_CLIENT_ID")
    tenant_id = os.environ.get("WEBSITE_AUTH_AAD_ALLOWED_TENANTS")
    
    try:
        # Create managed identity credential for getting the client assertion
        managed_identity_credential = ManagedIdentityCredential(client_id=federated_credential_client_id)
        
        # Get the client assertion token first
        client_assertion_token = managed_identity_credential.get_token(public_token_exchange_scope)
        
        # Use OBO credential with managed identity assertion
        obo_credential = OnBehalfOfCredential(
            tenant_id=tenant_id,
            client_id=client_id,
            user_assertion=access_token,
            client_assertion_func=lambda: client_assertion_token.token
        )
        
        # Get token for Microsoft Graph
        graph_token = obo_credential.get_token("https://graph.microsoft.com/.default")
        logging.info("Successfully obtained Graph token")
        
        # Call Microsoft Graph API
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://graph.microsoft.com/v1.0/me",
                headers={"Authorization": f"Bearer {graph_token.token}"}
            )
            response.raise_for_status()
            user_data = response.json()
            
            logging.info(f"Successfully retrieved user info for: {user_data.get('userPrincipalName', 'N/A')}")
            
            return f"""User Information:
- Display Name: {user_data.get('displayName', 'N/A')}
- Email: {user_data.get('mail', 'N/A')}
- User Principal Name: {user_data.get('userPrincipalName', 'N/A')}
- ID: {user_data.get('id', 'N/A')}"""
            
    except Exception as e:
        logging.error(f"Error getting user info: {str(e)}", exc_info=True)
        website_hostname = os.environ.get('WEBSITE_HOSTNAME', '')
        return f"""Error getting user info: {str(e)}

    You're logged in but might need to grant consent to the application.
    Open a browser to the following link to consent:
    https://{website_hostname}/.auth/login/aad?post_login_redirect_uri=https://{website_hostname}/authcomplete"""

# Add a custom route to serve authcomplete.html
@mcp.custom_route("/authcomplete", methods=["GET"])
async def auth_complete(request: Request) -> HTMLResponse:
    """Serve the authcomplete.html file after OAuth redirect."""
    try:
        html_path = Path(__file__).parent / "authcomplete.html"
        logging.info(f"Complete authcomplete.html: {html_path}")
        
        content = html_path.read_text()
        return HTMLResponse(content=content, status_code=200)
    except Exception as e:
        logging.error(f"Error loading authcomplete.html: {str(e)}", exc_info=True)
        return HTMLResponse(
            content="<html><body><h1>Authentication Complete</h1><p>You can close this window.</p></body></html>", 
            status_code=200
        )

if __name__ == "__main__":
    try:
        # Initialize and run the server
        print("Starting MCP server...")
        mcp.run(transport="streamable-http") 
    except Exception as e:
        print(f"Error while running MCP server: {e}", file=sys.stderr)
