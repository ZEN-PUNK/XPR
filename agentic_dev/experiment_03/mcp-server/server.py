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

# ============================================================================
# SEQUENTIAL TOOL USAGE GUIDE FOR AI AGENTS
# ============================================================================
# Many tools require calling other tools FIRST to gather input parameters.
# This guide shows common tool chains and workflows.
#
# COMMON WORKFLOWS:
#
# 1. USER BALANCE CHECK:
#    get_account(account) → get_currency_balance(code, account, symbol)
#
# 2. SWAP PREVIEW:
#    get_swap_pools() → get_currency_balance() → get_swap_rate(from, to, amount)
#
# 3. LENDING POSITION ANALYSIS:
#    get_account(account) → get_lending_position(account) → get_oracle_prices()
#
# 4. LIQUIDATION BOT:
#    get_oracle_prices() → get_lending_markets() → get_liquidatable_positions()
#    → For each account: get_lending_position(account)
#
# 5. LP PORTFOLIO ANALYSIS:
#    get_account(account) → get_swap_pools() → get_liquidity_positions(account)
#    → get_oracle_prices() → calculate total value
#
# 6. ARBITRAGE OPPORTUNITY:
#    get_oracle_prices() → get_swap_pools() → For each pool:
#    get_pool_by_pair(token0, token1) → compare with oracle prices
#
# 7. TRANSACTION VERIFICATION:
#    get_transaction(txid) → get_block(block_num) → verify inclusion
#
# 8. ACCOUNT INVESTIGATION:
#    get_account(account) → get_actions(account) → get_currency_balance()
#    → get_lending_position() → get_liquidity_positions()
#
# INTERNAL DEPENDENCIES (automatic, no manual calls needed):
# - get_swap_rate() internally calls get_pool_by_pair()
# - get_liquidatable_positions() internally scans all lending scopes
# - get_at_risk_positions() internally scans all lending scopes
#
# ALWAYS VERIFY INPUTS:
# - Check account exists with get_account() before querying balances
# - Check pool exists with get_swap_pools() before calculating swaps
# - Get current prices with get_oracle_prices() before DeFi operations
# ============================================================================

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
    """Get comprehensive Proton account information including resources, permissions, and staking.
    
    Returns complete account details:
    - Resources: CPU, NET, RAM usage and limits
    - Permissions: Active/owner keys and multi-sig configuration
    - Staking: Delegated resources and voting status
    - Metadata: Creation date, privileged status
    
    Use this to:
    - Verify account exists and is active
    - Check resource availability before transactions
    - Audit account permissions and keys
    - Review voting and staking information
    
    Args:
        account_name: Proton account name (e.g., "zenpunk", "bloksio")
        
    Returns:
        JSON with account details or error message
    """
    result = await call_proton_rpc(
        "/v1/chain/get_account",
        {"account_name": account_name}
    )

    if "error" in result:
        return f"Error: {result['error']}"

    return json.dumps(result, indent=2)

@mcp.tool()
async def get_chain_info() -> str:
    """Get real-time Proton blockchain state and network configuration.
    
    Returns current blockchain status:
    - Block Info: Head block number, timestamp, producer
    - Finality: Last irreversible block (LIB)
    - Network: Chain ID (384da888...), server version
    - Limits: Block CPU/NET limits and total weights
    - History: Earliest available block number
    
    Use this to:
    - Verify you're on correct network (chain_id)
    - Get current block height for queries
    - Check blockchain sync status
    - Monitor block production health
    - Validate server version compatibility
    
    Returns:
        JSON with chain state including server_version, chain_id, head_block_num,
        head_block_time, head_block_producer, last_irreversible_block_num
    """
    result = await call_proton_rpc("/v1/chain/get_info", {})
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)

@mcp.tool()
async def get_block(block_num_or_id: str) -> str:
    """Retrieve detailed information about a specific Proton blockchain block.
    
    Returns complete block data:
    - Metadata: Block number, timestamp, producer name
    - Cryptographic: Block ID, transaction merkle root, action merkle root
    - Content: All transactions included in the block
    - Validation: Producer signature, previous block hash
    - References: Ref block prefix for transaction building
    
    Use this to:
    - Audit specific block contents and transactions
    - Verify transaction inclusion in blockchain
    - Investigate block production issues
    - Get merkle proofs for transactions
    - Build transaction references (ref_block_prefix)
    
    Args:
        block_num_or_id: Block number (e.g., "358043324") or block ID hash
        
    Returns:
        JSON with block details including timestamp, producer, transactions, signatures
    """
    result = await call_proton_rpc(
        "/v1/chain/get_block",
        {"block_num_or_id": block_num_or_id}
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)

@mcp.tool()
async def get_currency_balance(code: str, account: str, symbol: str = None) -> str:
    """Query token balances for any account on any token contract.
    
    Returns token balance array with symbols:
    - Format: ["1234.5678 XPR", "0.50000000 XBTC"]
    - Precision: Varies by token (XPR=4, XBTC=8)
    - Multiple: Returns all tokens if symbol omitted
    
    Common Contracts:
    - "eosio.token" - Native XPR token
    - "xtokens" - Wrapped tokens (XBTC, XETH, XUSDC, XUSDT)
    - "loan.token" - Metal protocol lending tokens (XMD)
    - "token.nefty" - Nefty marketplace token
    
    Sequential Usage - Call these tools FIRST:
    1. get_account(account) - Verify account exists before checking balance
    2. get_currency_stats(code, symbol) - Verify token exists and get precision
    3. get_currency_balance(code, account, symbol) - Get actual balance
    
    Workflow Example - Verify User Can Trade:
    Step 1: get_account("trader") → confirm account exists
    Step 2: get_currency_balance("eosio.token", "trader", "XPR") → check XPR balance
    Step 3: get_swap_rate("XPR", "XUSDC", balance_amount) → calculate swap output
    Step 4: If balance sufficient → proceed with transaction
    
    Workflow Example - Portfolio Summary:
    Step 1: get_account("user") → get account info
    Step 2: get_currency_balance("eosio.token", "user") → XPR balance
    Step 3: get_currency_balance("xtokens", "user") → all wrapped tokens
    Step 4: get_oracle_prices() → get USD values
    Step 5: Calculate total portfolio value
    
    Use this to:
    - Check XPR or wrapped token balances
    - Monitor DeFi positions (lending/borrowing)
    - Verify token transfers completed
    - Build wallet balance displays
    - Get all tokens (omit symbol parameter)
    
    Args:
        code: Token contract account (e.g., "eosio.token", "xtokens")
        account: Account name to query (e.g., "zenpunk", "bloksio")
        symbol: Optional token symbol filter (e.g., "XPR", "XBTC", "XMD")
        
    Returns:
        JSON array of token balances, e.g., ["1234.5678 XPR"] or []
    """
    body = {
        "code": code,
        "account": account
    }
    
    if symbol:
        body["symbol"] = symbol
    
    result = await call_proton_rpc("/v1/chain/get_currency_balance", body)
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)

@mcp.tool()
async def get_table_rows(
    code: str, 
    table: str, 
    scope: str, 
    limit: int = 100,
    lower_bound: str = None,
    upper_bound: str = None
) -> str:
    """Universal smart contract state query - read any table from any Proton contract.
    
    Most powerful and flexible tool for on-chain data access. Query any contract's
    state tables including producers, tokens, NFTs, DeFi positions, oracles, and more.
    
    Common Queries:
    - Block Producers: code="eosio", table="producers", scope="eosio"
    - Token Balances: code="eosio.token", table="accounts", scope="{account}"
    - NFT Collections: code="atomicassets", table="collections", scope="atomicassets"
    - Lending Positions: code="loan.token", table="positions", scope="{account}"
    - Swap Pools: code="proton.swaps", table="pools", scope="proton.swaps"
    - Oracle Prices: code="oracle.ptpx", table="prices", scope="oracle.ptpx"
    
    Pagination:
    - Returns {"rows": [...], "more": bool, "next_key": str}
    - If more=true, query again with lower_bound=next_key
    - Limit default=100, adjust based on row size
    
    Use this to:
    - Query any on-chain data structure
    - Build blockchain explorers and dashboards
    - Access DeFi protocol state
    - Read governance proposals and votes
    - Audit smart contract storage
    
    Args:
        code: Contract account name (e.g., "eosio", "atomicassets")
        table: Table name within contract (e.g., "producers", "accounts")
        scope: Data partition/namespace (often contract name or account name)
        limit: Max rows to return, default 100 (reduce for large rows)
        lower_bound: Start reading from this primary key (for pagination)
        upper_bound: Stop reading at this primary key (optional filter)
        
    Returns:
        JSON with {"rows": [...], "more": bool, "next_key": str} or error
    """
    body = {
        "code": code,
        "table": table,
        "scope": scope,
        "limit": limit,
        "json": True
    }
    
    if lower_bound:
        body["lower_bound"] = lower_bound
    if upper_bound:
        body["upper_bound"] = upper_bound
    
    result = await call_proton_rpc("/v1/chain/get_table_rows", body)
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)

@mcp.tool()
async def get_account_resources(account_name: str) -> str:
    """Get CPU, NET, and RAM resource usage and limits for a Proton account.
    
    Extracts resource information from account data to provide simplified view
    of resource consumption. Useful for monitoring resource availability before
    transactions or checking if account needs more resources.
    
    Returns resource metrics:
    - CPU: used, available, max (in microseconds)
    - NET: used, available, max (in bytes)
    - RAM: quota and current usage (in bytes)
    
    Use this to:
    - Check if account has enough resources for transactions
    - Monitor resource consumption trends
    - Identify accounts that need resource refills
    - Build resource usage dashboards
    
    Args:
        account_name: Proton account name (e.g., "zenpunk", "bloksio")
        
    Returns:
        JSON with resource limits: cpu_limit, net_limit, ram_quota, ram_usage
    """
    # Call existing get_account endpoint
    result = await call_proton_rpc(
        "/v1/chain/get_account",
        {"account_name": account_name}
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    # Extract only resource information
    resources = {
        "account_name": result.get("account_name"),
        "cpu_limit": result.get("cpu_limit"),
        "net_limit": result.get("net_limit"),
        "ram_quota": result.get("ram_quota"),
        "ram_usage": result.get("ram_usage")
    }
    
    return json.dumps(resources, indent=2)

@mcp.tool()
async def get_currency_stats(code: str, symbol: str) -> str:
    """Get token supply statistics including max supply, current supply, and issuer.
    
    Returns comprehensive token metadata and supply information for any token
    on Proton blockchain. Essential for understanding token economics.
    
    Returns token statistics:
    - Supply: Current circulating supply with precision
    - Max Supply: Total possible supply (if set)
    - Issuer: Account that can mint/burn tokens
    
    Common Tokens:
    - XPR: code="eosio.token", symbol="XPR"
    - XBTC: code="xtokens", symbol="XBTC"
    - XUSDC: code="xtokens", symbol="XUSDC"
    - XMD: code="loan.token", symbol="XMD"
    
    Use this to:
    - Check total token supply and circulation
    - Verify token issuer authority
    - Monitor token inflation/deflation
    - Validate token contract configuration
    - Build token analytics dashboards
    
    Args:
        code: Token contract account (e.g., "eosio.token", "xtokens")
        symbol: Token symbol (e.g., "XPR", "XBTC", "XUSDC")
        
    Returns:
        JSON with supply stats: {symbol: {supply, max_supply, issuer}}
    """
    result = await call_proton_rpc(
        "/v1/chain/get_currency_stats",
        {
            "code": code,
            "symbol": symbol
        }
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)

@mcp.tool()
async def get_table_by_scope(
    code: str,
    table: str,
    lower_bound: str = None,
    upper_bound: str = None,
    limit: int = 100
) -> str:
    """List all scopes (data partitions) for a table in a smart contract.
    
    Discovery tool to find all scope values for a given table. Scopes represent
    different data partitions - often account names, token symbols, or IDs.
    Essential for exploring contract data structure.
    
    Returns scope list:
    - Scopes: Array of scope names/values
    - Count: Number of rows in each scope
    - Pagination: Support for large scope lists
    
    Common Use Cases:
    - Find all accounts with token balances
    - List all NFT collection scopes
    - Discover all lending market scopes
    - Enumerate all swap pool pairs
    
    Examples:
    - Token holders: code="eosio.token", table="accounts"
    - NFT owners: code="atomicassets", table="assets"
    - Lending users: code="loan.token", table="positions"
    
    Use this to:
    - Discover all data partitions in a table
    - Find accounts with balances/positions
    - Build comprehensive data indexes
    - Audit contract data distribution
    - Identify active scopes for iteration
    
    Args:
        code: Contract account name (e.g., "eosio.token", "atomicassets")
        table: Table name (e.g., "accounts", "assets")
        lower_bound: Optional start scope for pagination
        upper_bound: Optional end scope filter
        limit: Max scopes to return (default: 100)
        
    Returns:
        JSON with scopes array: [{code, scope, table, payer, count}, ...]
    """
    body = {
        "code": code,
        "table": table,
        "limit": limit
    }
    
    if lower_bound:
        body["lower_bound"] = lower_bound
    if upper_bound:
        body["upper_bound"] = upper_bound
    
    result = await call_proton_rpc("/v1/chain/get_table_by_scope", body)
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)

@mcp.tool()
async def get_abi(account_name: str) -> str:
    """Get smart contract ABI (Application Binary Interface) definition.
    
    Returns complete contract interface including all actions, tables, and types.
    Essential for understanding contract capabilities and data structures.
    
    Returns ABI specification:
    - Actions: All callable contract functions with parameters
    - Tables: All data tables with row structure
    - Types: Custom type definitions
    - Structs: Data structure specifications
    
    Use this to:
    - Discover contract actions and parameters
    - Understand table schemas before queries
    - Generate type-safe contract interactions
    - Build contract documentation
    - Validate transaction data structures
    
    Common Contracts:
    - "eosio.token" - Token contract (transfer, issue, etc.)
    - "atomicassets" - NFT marketplace contract
    - "loan.token" - Metal lending protocol
    - "proton.swaps" - DEX swap contract
    - "oracle.ptpx" - Price oracle contract
    
    Args:
        account_name: Contract account name (e.g., "eosio.token", "atomicassets")
        
    Returns:
        JSON with complete ABI: {version, types, structs, actions, tables, ...}
    """
    result = await call_proton_rpc(
        "/v1/chain/get_abi",
        {"account_name": account_name}
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)

# =============================================================================
# PHASE 3: DeFi (Lending & Swap) Tools
# =============================================================================

@mcp.tool()
async def get_lending_markets() -> str:
    """Get all MetalX lending markets with supply rates, borrow rates, and liquidity.
    
    Returns comprehensive data for all lending markets on Metal (XMD) protocol including
    supply/borrow APYs, total deposits, total borrows, and utilization rates.
    
    Returns market data for each asset:
    - Supply APY: Annual percentage yield for depositors
    - Borrow APY: Annual percentage rate for borrowers
    - Total Supply: Total deposits in the market
    - Total Borrows: Total amount borrowed
    - Utilization: Percentage of supplied assets being borrowed
    - Available Liquidity: Unborrowed supply available
    
    Common Markets:
    - XPR (Proton native token)
    - XBTC (Wrapped Bitcoin)
    - XETH (Wrapped Ethereum)
    - XUSDC (Wrapped USDC)
    - XMD (Metal Dollar stablecoin)
    
    Use this to:
    - Monitor lending market health and liquidity
    - Compare APY rates across different assets
    - Find best yield opportunities
    - Assess borrowing costs
    - Build DeFi analytics dashboards
    - Alert on high utilization rates
    
    Returns:
        JSON array of markets: [{symbol, supply_apy, borrow_apy, total_supply, total_borrows, utilization, ...}, ...]
    """
    result = await call_proton_rpc(
        "/v1/chain/get_table_rows",
        {
            "code": "lending.loan",
            "table": "markets",
            "scope": "lending.loan",
            "limit": 100,
            "json": True
        }
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)

@mcp.tool()
async def get_oracle_prices(symbols: str = None) -> str:
    """Get current oracle prices for all supported tokens on Proton blockchain.
    
    Returns real-time price data from Proton's decentralized oracle (oracle.ptpx).
    Essential for DeFi operations, lending collateral calculations, and trading.
    
    Returns price data:
    - Price: Current USD price with high precision
    - Timestamp: When price was last updated
    - Symbol: Token identifier
    - Decimals: Price precision
    
    Supported Tokens:
    - XPR (Proton)
    - XBTC (Bitcoin)
    - XETH (Ethereum)
    - XUSDC (USD Coin)
    - XMD (Metal Dollar)
    - LOAN (Metal Protocol)
    - METAL (Metal)
    
    Use this to:
    - Get real-time token prices for DeFi calculations
    - Calculate lending collateral values
    - Determine liquidation risk
    - Build trading interfaces
    - Monitor price movements
    - Validate arbitrage opportunities
    
    Args:
        symbols: Optional comma-separated list of symbols to filter (e.g., "XPR,XBTC,XETH")
        
    Returns:
        JSON array of prices: [{symbol, price, updated_at, median, ...}, ...]
    """
    result = await call_proton_rpc(
        "/v1/chain/get_table_rows",
        {
            "code": "oracle.ptpx",
            "table": "prices",
            "scope": "oracle.ptpx",
            "limit": 100,
            "json": True
        }
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    # Optional: Filter by symbols if provided
    if symbols and "rows" in result:
        symbol_list = [s.strip().upper() for s in symbols.split(",")]
        result["rows"] = [
            row for row in result["rows"]
            if any(sym in str(row.get("symbol", "")).upper() for sym in symbol_list)
        ]
    
    return json.dumps(result, indent=2)

@mcp.tool()
async def get_lending_position(account_name: str) -> str:
    """Get detailed MetalX lending position for a specific Proton account.
    
    Returns complete lending/borrowing position including supplied assets, borrowed
    assets, health factor, and collateral status. Essential for monitoring DeFi positions.
    
    Returns position details:
    - Supplied Assets: All deposits with current value
    - Borrowed Assets: All loans with current debt
    - Health Factor: Liquidation risk indicator (>1.0 is safe)
    - Total Collateral: USD value of all supplied assets
    - Total Debt: USD value of all borrowed assets
    - Borrowing Power: Available credit for additional loans
    
    Health Factor Indicators:
    - > 1.5: Very safe position
    - 1.1 - 1.5: Moderate risk
    - 1.0 - 1.1: At risk (monitor closely)
    - < 1.0: Liquidatable (can be liquidated)
    
    Sequential Usage - Call these tools FIRST to get inputs:
    1. get_account(account_name) - Verify account exists
    2. get_oracle_prices() - Get current token prices (for value calculations)
    3. get_lending_markets() - Understand available markets
    
    Workflow Example:
    Step 1: get_account("username") → verify account exists
    Step 2: get_lending_position("username") → get position details
    Step 3: get_oracle_prices() → get current prices for risk assessment
    
    Use this to:
    - Monitor user lending positions
    - Check liquidation risk
    - Calculate available borrowing power
    - Build position management UIs
    - Alert on risky positions
    - Track portfolio health
    
    Args:
        account_name: Proton account name (e.g., "zenpunk", "lendinguser")
        
    Returns:
        JSON with position details: {supplies, borrows, health_factor, total_collateral_usd, total_debt_usd, ...}
    """
    result = await call_proton_rpc(
        "/v1/chain/get_table_rows",
        {
            "code": "lending.loan",
            "table": "positions",
            "scope": account_name,
            "limit": 1,
            "json": True
        }
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    # Check if position exists
    if result.get("rows") and len(result["rows"]) > 0:
        return json.dumps(result["rows"][0], indent=2)
    else:
        return json.dumps({
            "account": account_name,
            "position": None,
            "message": "No lending position found for this account"
        }, indent=2)

@mcp.tool()
async def get_swap_pools() -> str:
    """Get all liquidity pools from Proton Swaps DEX with reserves and fees.
    
    Returns comprehensive data for all trading pairs on Proton's decentralized exchange
    including token reserves, liquidity, swap fees, and trading volume.
    
    Returns pool data:
    - Token Pair: Two tokens in the pool (e.g., XPR/XUSDC)
    - Reserves: Amount of each token in pool
    - Liquidity: Total USD value locked in pool
    - Fee: Swap fee percentage (typically 0.3%)
    - Volume 24h: Trading volume last 24 hours
    
    Common Pools:
    - XPR/XUSDC - Main stablecoin pair
    - XPR/XBTC - Bitcoin trading
    - XPR/XETH - Ethereum trading
    - XUSDC/XMD - Stablecoin pair
    - METAL/XPR - Metal token trading
    
    Use this to:
    - Find available trading pairs
    - Check pool liquidity before swaps
    - Monitor DEX activity and volume
    - Calculate price impact for trades
    - Identify arbitrage opportunities
    - Build DEX analytics dashboards
    - Compare liquidity across pairs
    
    Returns:
        JSON array of pools: [{pool_id, token0, token1, reserve0, reserve1, liquidity_usd, fee, ...}, ...]
    """
    result = await call_proton_rpc(
        "/v1/chain/get_table_rows",
        {
            "code": "proton.swaps",
            "table": "pools",
            "scope": "proton.swaps",
            "limit": 100,
            "json": True
        }
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)

@mcp.tool()
async def get_pool_by_pair(token0_symbol: str, token1_symbol: str) -> str:
    """Get specific Proton Swaps liquidity pool by token pair symbols.
    
    Find and return detailed information for a specific trading pair on Proton DEX.
    Automatically handles token ordering (searches both token0/token1 combinations).
    
    Returns pool details:
    - Pool ID: Unique identifier
    - Token Pair: Contract and symbol for both tokens
    - Reserves: Current amount of each token
    - Exchange Rate: Current price ratio
    - Liquidity: Total value locked
    - Fee Structure: Swap fee details
    
    Common Pairs:
    - "XPR" + "XUSDC" → XPR/XUSDC pool
    - "XPR" + "XBTC" → XPR/XBTC pool
    - "XPR" + "XETH" → XPR/XETH pool
    - "XUSDC" + "XMD" → XUSDC/XMD pool
    
    Use this to:
    - Get specific pool data for swap calculations
    - Check current exchange rates
    - Validate pool exists before swap
    - Calculate expected output amounts
    - Monitor specific trading pair
    - Build pair-specific trading UIs
    
    Args:
        token0_symbol: First token symbol (e.g., "XPR", "XUSDC")
        token1_symbol: Second token symbol (e.g., "XBTC", "XMD")
        
    Returns:
        JSON with pool details or error if pool not found
    """
    # Get all pools first
    result = await call_proton_rpc(
        "/v1/chain/get_table_rows",
        {
            "code": "proton.swaps",
            "table": "pools",
            "scope": "proton.swaps",
            "limit": 100,
            "json": True
        }
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    # Search for matching pool (check both orderings)
    token0_upper = token0_symbol.upper()
    token1_upper = token1_symbol.upper()
    
    for pool in result.get("rows", []):
        pool_token0 = str(pool.get("token0", {}).get("symbol", "")).split(",")[-1].upper()
        pool_token1 = str(pool.get("token1", {}).get("symbol", "")).split(",")[-1].upper()
        
        # Check both orderings
        if (pool_token0 == token0_upper and pool_token1 == token1_upper) or \
           (pool_token0 == token1_upper and pool_token1 == token0_upper):
            return json.dumps(pool, indent=2)
    
    # Pool not found
    return json.dumps({
        "error": "Pool not found",
        "token0": token0_symbol,
        "token1": token1_symbol,
        "message": f"No pool found for pair {token0_symbol}/{token1_symbol}"
    }, indent=2)

# =============================================================================
# Phase 4A: Foundation Tools (7 tools)
# =============================================================================

@mcp.tool()
async def get_block_transaction_count(block_num_or_id: str) -> str:
    """
    Get the number of transactions in a specific Proton blockchain block.
    
    Retrieves block data and counts total transactions. Useful for monitoring
    block activity, validating block processing, and analyzing network usage.
    
    Returns transaction count with block metadata:
    - Transaction Count: Total number of transactions in the block
    - Block Number: Block height/number
    - Block ID: Unique block identifier hash
    - Producer: Block producer account name
    - Timestamp: When the block was produced
    
    Use this to:
    - Monitor block activity and transaction throughput
    - Validate transaction inclusion in blocks
    - Analyze network congestion patterns
    - Track block producer activity
    - Build blockchain analytics dashboards
    
    Args:
        block_num_or_id: Block number (e.g., "358043324") or block ID hash
        
    Returns:
        JSON with transaction count and block metadata
    """
    result = await call_proton_rpc(
        "/v1/chain/get_block",
        {"block_num_or_id": block_num_or_id}
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    # Count transactions
    tx_count = len(result.get("transactions", []))
    
    return json.dumps({
        "block_num": result.get("block_num"),
        "block_id": result.get("id"),
        "producer": result.get("producer"),
        "timestamp": result.get("timestamp"),
        "transaction_count": tx_count,
        "transactions": result.get("transactions", [])
    }, indent=2)

@mcp.tool()
async def get_transaction(id: str) -> str:
    """
    Get comprehensive transaction details by transaction ID from Proton blockchain history.
    
    Retrieves complete transaction data including actions, authorizations, CPU/NET usage,
    and execution status. Essential for transaction tracking, auditing, and debugging.
    
    **IMPORTANT:** Requires RPC node with History Plugin enabled (v1/history API).
    Use Greymass or other full history nodes.
    
    Returns transaction details:
    - Transaction ID: Unique transaction hash
    - Block Number: Block containing this transaction  
    - Block Time: When transaction was executed
    - Actions: All actions in the transaction with data
    - Authorizations: Accounts and permissions that signed
    - CPU/NET Usage: Resources consumed by transaction
    - Status: Success/failure status
    
    Use this to:
    - Track transaction execution and confirmation
    - Audit transaction actions and data
    - Debug transaction failures
    - Verify transaction inclusion in blockchain
    - Build transaction explorers and trackers
    
    Args:
        id: Transaction ID hash (e.g., "abc123...")
        
    Returns:
        JSON with complete transaction details or error if not found
    """
    result = await call_proton_rpc(
        "/v1/history/get_transaction",
        {"id": id}
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)

@mcp.tool()
async def get_actions(account_name: str, pos: int = -1, offset: int = 20) -> str:
    """
    Get action history for a Proton account with pagination support.
    
    Retrieves chronological list of all actions (transactions) involving the account,
    including transfers, contract calls, staking, voting, and more. Essential for
    account activity tracking and auditing.
    
    **IMPORTANT:** Requires RPC node with History Plugin enabled (v1/history API).
    Use Greymass or other full history nodes.
    
    Returns action history:
    - Actions: List of actions with timestamps and details
    - Block Numbers: Blocks containing each action
    - Action Data: Complete action parameters and results
    - Authorizations: Who signed each action
    - Pagination: Support for scrolling through history
    
    Position and Offset:
    - pos=-1, offset=20: Get last 20 actions (most recent)
    - pos=0, offset=50: Get first 50 actions (oldest)
    - pos=100, offset=10: Get 10 actions starting from position 100
    
    Use this to:
    - Track account transaction history
    - Audit account activity and interactions
    - Monitor incoming/outgoing transfers
    - Build account activity dashboards
    - Debug account state changes
    - Analyze account behavior patterns
    
    Args:
        account_name: Proton account name (e.g., "zenpunk", "bloksio")
        pos: Starting position (-1 for most recent, default: -1)
        offset: Number of actions to retrieve (default: 20)
        
    Returns:
        JSON with action history array or error if not found
    """
    result = await call_proton_rpc(
        "/v1/history/get_actions",
        {
            "account_name": account_name,
            "pos": pos,
            "offset": offset
        }
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)

@mcp.tool()
async def get_key_accounts(public_key: str) -> str:
    """
    Find all Proton accounts associated with a specific public key.
    
    Searches blockchain history to identify accounts that use the given public key
    in their permission structure (owner, active, or custom permissions). Useful
    for account discovery and key management.
    
    **IMPORTANT:** Requires RPC node with History Plugin enabled (v1/history API).
    Use Greymass or other full history nodes.
    
    Returns account list:
    - Account Names: All accounts using this public key
    - Permission Level: Which permission uses the key (if available)
    
    Common Use Cases:
    - Find accounts controlled by a specific key
    - Verify key ownership before transfers
    - Account recovery and key rotation
    - Multi-account management
    - Security audits of key usage
    
    Key Formats Supported:
    - Legacy: "EOS..." format
    - Modern: "PUB_K1_..." format
    - Both formats should work
    
    Use this to:
    - Discover all accounts you control with a key
    - Verify account ownership before actions
    - Build key management tools
    - Audit account security configurations
    - Track key usage across accounts
    
    Args:
        public_key: Public key in EOS or PUB_K1 format
        
    Returns:
        JSON with array of account names or empty array if none found
    """
    result = await call_proton_rpc(
        "/v1/history/get_key_accounts",
        {"public_key": public_key}
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)

@mcp.tool()
async def get_controlled_accounts(controlling_account: str) -> str:
    """
    Get all sub-accounts controlled by a parent Proton account.
    
    Finds accounts where the specified account has authority through permission
    structures (owner, active, or custom permissions). Useful for managing
    hierarchical account structures and corporate/organization account setups.
    
    **IMPORTANT:** Requires RPC node with History Plugin enabled (v1/history API).
    Use Greymass or other full history nodes.
    
    Returns controlled accounts:
    - Sub-Accounts: List of controlled account names
    - Permission Details: How control is established (if available)
    
    Common Scenarios:
    - Corporate accounts controlling employee accounts
    - DAOs controlling treasury accounts
    - Multi-sig accounts controlling operational accounts
    - Service accounts controlling resource accounts
    
    Use this to:
    - Audit account hierarchies and control structures
    - Manage organizational account setups
    - Verify permission delegation
    - Build account management dashboards
    - Track account relationships
    
    Args:
        controlling_account: Parent account name (e.g., "proton", "eosio")
        
    Returns:
        JSON with array of controlled account names or empty array
    """
    result = await call_proton_rpc(
        "/v1/history/get_controlled_accounts",
        {"controlling_account": controlling_account}
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)

@mcp.tool()
async def get_producers(limit: int = 50, lower_bound: str = "") -> str:
    """
    Get list of Proton block producers with voting info, rankings, and status.
    
    Retrieves comprehensive data on all block producers including vote counts,
    rankings, production statistics, and active/standby status. Essential for
    governance monitoring and validator analysis.
    
    Returns producer data:
    - Producer List: All registered block producers
    - Vote Counts: Total votes received by each producer  
    - Rankings: Position in producer schedule (top 21 are active)
    - Status: Active (producing blocks) or Standby (backup)
    - URLs: Producer information and websites
    - Production Stats: Blocks produced, missed, etc.
    
    Active vs Standby:
    - Top 21 producers: Active (currently producing blocks)
    - Remaining: Standby (backup producers, can become active)
    
    Use this to:
    - Monitor block producer performance
    - Analyze voting distributions
    - Track producer rankings over time
    - Verify network decentralization
    - Build governance dashboards
    - Identify producers for voting decisions
    
    Args:
        limit: Maximum producers to return (default: 50)
        lower_bound: Start from this producer name for pagination (default: "")
        
    Returns:
        JSON with producer list including votes, rankings, and status
    """
    result = await call_proton_rpc(
        "/v1/chain/get_producers",
        {
            "json": True,
            "limit": limit,
            "lower_bound": lower_bound
        }
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)

@mcp.tool()
async def get_producer_schedule() -> str:
    """
    Get the current active block producer schedule on Proton blockchain.
    
    Returns the rotation schedule of the top 21 block producers, showing the order
    in which they produce blocks. The schedule rotates every 126 blocks (21 producers
    × 6 blocks each = 126 blocks per round, ~63 seconds at 0.5s per block).
    
    Returns schedule data:
    - Version: Current schedule version number
    - Producers: Top 21 active producers in rotation order
    - Producer Keys: Block signing public keys
    - Schedule Info: Current and pending schedule versions
    
    Schedule Rotation:
    - Each producer: 6 consecutive blocks (3 seconds)
    - Full round: 126 blocks (63 seconds)
    - Producers: Top 21 by vote weight
    - Changes: Schedule updates when votes change significantly
    
    Use this to:
    - Track current active producer set
    - Verify block production order
    - Monitor schedule version changes
    - Analyze producer rotation patterns
    - Build block production monitoring tools
    - Validate producer election results
    
    Returns:
        JSON with active producer schedule and version info
    """
    result = await call_proton_rpc(
        "/v1/chain/get_producer_schedule",
        {}
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)

# =============================================================================
# Phase 4B-Partial: Advanced Tools (5 tools)
# =============================================================================

@mcp.tool()
async def get_liquidatable_positions(min_profit: float = 0.50) -> str:
    """
    Find all MetalX lending positions with Health Factor < 1.0 that can be liquidated.
    
    Scans all lending positions to identify accounts below liquidation threshold
    (HF < 1.0). Liquidators can repay borrows and claim collateral at discount,
    earning profit while protecting protocol solvency.
    
    **WARNING:** This tool iterates through all scopes and may take 10-30 seconds.
    
    Returns liquidatable positions:
    - Account: Account name with underwater position
    - Health Factor: Current HF (< 1.0 = liquidatable)
    - Total Debt: USD value of all borrows
    - Total Collateral: USD value of all supplied assets
    - Est. Profit: Potential profit from liquidation
    - Assets: Detailed borrow/supply breakdown
    
    Health Factor < 1.0:
    - Position is undercollateralized
    - Can be liquidated by anyone
    - Liquidator repays debt, receives collateral + bonus
    - Protects protocol from bad debt
    
    Liquidation Mechanics:
    - Liquidator repays borrower's debt
    - Receives collateral at discount (e.g., 5-10%)
    - Profit = Collateral value - Debt repaid
    - Multiple liquidators can compete
    
    Sequential Usage - Call these tools FIRST for context:
    1. get_lending_markets() - Understand market conditions and rates
    2. get_oracle_prices() - Get current token prices for value calculations
    3. get_liquidatable_positions() - Find underwater positions
    4. get_lending_position(account) - Get detailed position for specific account
    
    Workflow Example - Liquidation Bot:
    Step 1: get_oracle_prices() → fetch current token prices
    Step 2: get_lending_markets() → check market health and liquidity
    Step 3: get_liquidatable_positions(min_profit=10.0) → find profitable liquidations
    Step 4: For each liquidatable account:
            get_lending_position(account) → get full position details
            get_currency_balance() → verify liquidator has repayment tokens
    Step 5: Execute liquidation transaction (external to MCP)
    
    Internal Dependencies:
    - Automatically scans all lending position scopes
    - Fetches individual positions via internal RPC calls
    - No manual iteration required
    
    Use this to:
    - Find liquidation opportunities
    - Monitor protocol health
    - Build liquidation bots
    - Analyze risk exposure
    - Track underwater positions
    
    Args:
        min_profit: Minimum profit in USD to include position (default: 0.50)
        
    Returns:
        JSON with array of liquidatable positions or empty array
    """
    # Get all lending position scopes
    scopes_result = await call_proton_rpc(
        "/v1/chain/get_table_by_scope",
        {
            "code": "lending.loan",
            "table": "positions",
            "limit": 1000
        }
    )
    
    if "error" in scopes_result:
        return f"Error: {scopes_result['error']}"
    
    liquidatable = []
    
    # Iterate through each account's position
    for scope_row in scopes_result.get("rows", []):
        account = scope_row.get("scope")
        
        # Get position for this account
        position_result = await call_proton_rpc(
            "/v1/chain/get_table_rows",
            {
                "code": "lending.loan",
                "table": "positions",
                "scope": account,
                "limit": 1,
                "json": True
            }
        )
        
        if "rows" in position_result and len(position_result["rows"]) > 0:
            position = position_result["rows"][0]
            health_factor = position.get("health_factor", 999)
            
            # Check if liquidatable (HF < 1.0)
            if health_factor < 1.0:
                # Calculate estimated profit (simplified)
                total_debt = position.get("total_debt_usd", 0)
                total_collateral = position.get("total_collateral_usd", 0)
                est_profit = (total_collateral * 0.05) - (total_debt * 0.05)  # Simplified
                
                if est_profit >= min_profit:
                    liquidatable.append({
                        "account": account,
                        "health_factor": health_factor,
                        "total_debt_usd": total_debt,
                        "total_collateral_usd": total_collateral,
                        "estimated_profit_usd": est_profit,
                        "position": position
                    })
    
    return json.dumps({
        "liquidatable_count": len(liquidatable),
        "positions": liquidatable
    }, indent=2)

@mcp.tool()
async def get_at_risk_positions(threshold: float = 1.1) -> str:
    """
    Find MetalX lending positions with Health Factor between 1.0 and threshold (at risk).
    
    Identifies positions close to liquidation that should be monitored carefully.
    Users with at-risk positions should add collateral or repay debt to avoid
    liquidation.
    
    **WARNING:** This tool iterates through all scopes and may take 10-30 seconds.
    
    Returns at-risk positions:
    - Account: Account name with risky position
    - Health Factor: Current HF (1.0 - threshold)
    - Total Debt: USD value of all borrows
    - Total Collateral: USD value of all supplied assets
    - Risk Level: High (1.0-1.05), Medium (1.05-1.1), Low (>1.1)
    - Distance to Liquidation: How much collateral can drop
    
    Health Factor Ranges:
    - HF < 1.0: Liquidatable (see get_liquidatable_positions)
    - HF 1.0-1.05: High risk (urgent action needed)
    - HF 1.05-1.1: Medium risk (monitor closely)
    - HF > 1.1: Low risk (healthy position)
    
    Risk Management Actions:
    - Add more collateral (increase HF)
    - Repay some debt (increase HF)
    - Close risky positions
    - Monitor price movements
    
    Use this to:
    - Monitor user positions for risk
    - Send liquidation warnings
    - Build risk management dashboards
    - Track protocol health
    - Identify accounts needing intervention
    
    Args:
        threshold: Health factor threshold (default: 1.1, positions with HF 1.0-1.1)
        
    Returns:
        JSON with array of at-risk positions or empty array
    """
    # Get all lending position scopes
    scopes_result = await call_proton_rpc(
        "/v1/chain/get_table_by_scope",
        {
            "code": "lending.loan",
            "table": "positions",
            "limit": 1000
        }
    )
    
    if "error" in scopes_result:
        return f"Error: {scopes_result['error']}"
    
    at_risk = []
    
    # Iterate through each account's position
    for scope_row in scopes_result.get("rows", []):
        account = scope_row.get("scope")
        
        # Get position for this account
        position_result = await call_proton_rpc(
            "/v1/chain/get_table_rows",
            {
                "code": "lending.loan",
                "table": "positions",
                "scope": account,
                "limit": 1,
                "json": True
            }
        )
        
        if "rows" in position_result and len(position_result["rows"]) > 0:
            position = position_result["rows"][0]
            health_factor = position.get("health_factor", 999)
            
            # Check if at risk (1.0 <= HF <= threshold)
            if 1.0 <= health_factor <= threshold:
                total_debt = position.get("total_debt_usd", 0)
                total_collateral = position.get("total_collateral_usd", 0)
                
                # Categorize risk level
                if health_factor < 1.05:
                    risk_level = "HIGH"
                elif health_factor < 1.1:
                    risk_level = "MEDIUM"
                else:
                    risk_level = "LOW"
                
                at_risk.append({
                    "account": account,
                    "health_factor": health_factor,
                    "risk_level": risk_level,
                    "total_debt_usd": total_debt,
                    "total_collateral_usd": total_collateral,
                    "position": position
                })
    
    return json.dumps({
        "at_risk_count": len(at_risk),
        "threshold": threshold,
        "positions": at_risk
    }, indent=2)

@mcp.tool()
async def get_swap_rate(from_token: str, to_token: str, amount: float) -> str:
    """
    Calculate swap rate and output amount for a token swap on Proton DEX.
    
    Computes expected output amount when swapping tokens, including price impact,
    fees, and slippage. Uses constant product AMM formula (x * y = k) with 0.3% fee.
    
    Returns swap calculation:
    - Input Amount: Amount of from_token to swap
    - Output Amount: Expected to_token received
    - Exchange Rate: Effective price (from_token/to_token)
    - Price Impact: How much swap affects pool price
    - Fee: 0.3% swap fee amount
    - Minimum Received: After max slippage (0.5%)
    
    AMM Formula:
    - Constant Product: reserve_from * reserve_to = k
    - Output = (amount_in * 997 * reserve_to) / (reserve_from * 1000 + amount_in * 997)
    - Fee: 0.3% (997/1000 = 99.7% of input)
    
    Price Impact:
    - < 1%: Excellent (large pool, small trade)
    - 1-3%: Good (normal trade)
    - 3-5%: Fair (larger trade, monitor)
    - > 5%: Poor (significant slippage, split trade)
    
    Sequential Usage - Call these tools FIRST to get inputs:
    1. get_swap_pools() - List all available pools and token pairs
    2. get_pool_by_pair(from_token, to_token) - Verify pool exists (called internally)
    3. get_currency_balance("eosio.token", account, from_token) - Check user has tokens
    
    Workflow Example:
    Step 1: get_swap_pools() → see available pairs
    Step 2: get_currency_balance("eosio.token", "user", "XPR") → check balance
    Step 3: get_swap_rate("XPR", "XUSDC", 1000.0) → calculate swap output
    Step 4: Compare with get_oracle_prices() for arbitrage opportunities
    
    Internal Dependencies:
    - Automatically calls get_pool_by_pair() to fetch pool reserves
    - No need to call get_pool_by_pair() manually
    
    Use this to:
    - Calculate expected swap outputs
    - Compare DEX rates before trading
    - Estimate swap costs and slippage
    - Build swap preview interfaces
    - Validate trade profitability
    
    Args:
        from_token: Input token symbol (e.g., "XPR", "XUSDC")
        to_token: Output token symbol (e.g., "XBTC", "XETH")
        amount: Input amount in token units (e.g., 1000.0)
        
    Returns:
        JSON with swap calculation or error if pool not found
    """
    # Find the pool for this pair
    pool_result = await get_pool_by_pair(from_token, to_token)
    pool_data = json.loads(pool_result)
    
    if "error" in pool_data:
        return json.dumps({
            "error": "Pool not found",
            "from_token": from_token,
            "to_token": to_token
        }, indent=2)
    
    # Extract pool reserves
    pool_token0 = str(pool_data.get("token0", {}).get("symbol", "")).split(",")[-1].upper()
    pool_token1 = str(pool_data.get("token1", {}).get("symbol", "")).split(",")[-1].upper()
    reserve0 = float(pool_data.get("reserve0", 0))
    reserve1 = float(pool_data.get("reserve1", 0))
    
    # Determine direction
    if pool_token0 == from_token.upper() and pool_token1 == to_token.upper():
        reserve_from = reserve0
        reserve_to = reserve1
    elif pool_token1 == from_token.upper() and pool_token0 == to_token.upper():
        reserve_from = reserve1
        reserve_to = reserve0
    else:
        return json.dumps({"error": "Token pair mismatch"}, indent=2)
    
    # Calculate output using constant product AMM (x * y = k)
    # Formula: output = (amount_in * 997 * reserve_to) / (reserve_from * 1000 + amount_in * 997)
    amount_in_with_fee = amount * 997  # 0.3% fee
    numerator = amount_in_with_fee * reserve_to
    denominator = (reserve_from * 1000) + amount_in_with_fee
    output_amount = numerator / denominator if denominator > 0 else 0
    
    # Calculate price impact
    price_before = reserve_to / reserve_from if reserve_from > 0 else 0
    new_reserve_from = reserve_from + amount
    new_reserve_to = reserve_to - output_amount
    price_after = new_reserve_to / new_reserve_from if new_reserve_from > 0 else 0
    price_impact = abs((price_after - price_before) / price_before * 100) if price_before > 0 else 0
    
    # Calculate fee
    fee_amount = amount * 0.003
    
    # Minimum received (0.5% slippage)
    min_received = output_amount * 0.995
    
    return json.dumps({
        "from_token": from_token,
        "to_token": to_token,
        "input_amount": amount,
        "output_amount": output_amount,
        "exchange_rate": output_amount / amount if amount > 0 else 0,
        "price_impact_percent": price_impact,
        "fee": fee_amount,
        "minimum_received": min_received,
        "pool_reserves": {
            "from_reserve": reserve_from,
            "to_reserve": reserve_to
        }
    }, indent=2)

@mcp.tool()
async def get_liquidity_positions(account: str) -> str:
    """
    Get all liquidity provider (LP) positions for a Proton account on DEX.
    
    Retrieves list of pools where account has provided liquidity, showing LP token
    balance, pool share, and underlying token amounts. LP providers earn 0.3% fees
    from swaps proportional to their pool share.
    
    Returns LP positions:
    - Pool ID: Which pool LP tokens are for
    - LP Token Balance: Amount of LP tokens owned
    - Pool Share: Percentage of total pool owned
    - Token0 Amount: Claimable amount of first token
    - Token1 Amount: Claimable amount of second token
    - USD Value: Total position value
    
    Liquidity Provider Mechanics:
    - Provide both tokens to pool (e.g., 100 XPR + 10 XUSDC)
    - Receive LP tokens representing pool share
    - Earn 0.3% fee on every swap in pool
    - Can remove liquidity anytime (burn LP tokens)
    - Subject to impermanent loss if prices diverge
    
    Sequential Usage - Call these tools FIRST:
    1. get_account(account) - Verify account exists
    2. get_swap_pools() - See all available pools
    3. get_liquidity_positions(account) - Get user's LP positions
    4. get_oracle_prices() - Calculate USD value of positions
    
    Workflow Example - LP Portfolio Analysis:
    Step 1: get_account("username") → verify account
    Step 2: get_swap_pools() → understand all pools
    Step 3: get_liquidity_positions("username") → get LP positions
    Step 4: For each position:
            get_pool_by_pair(token0, token1) → get current pool state
            get_oracle_prices() → calculate USD value
            Compare initial vs current value → calculate impermanent loss
    
    Use this to:
    - Track LP positions across pools
    - Calculate LP earnings and APY
    - Monitor liquidity provision
    - Build LP management dashboards
    - Analyze pool participation
    
    Args:
        account: Proton account name (e.g., "zenpunk")
        
    Returns:
        JSON with array of LP positions or empty array if none
    """
    result = await call_proton_rpc(
        "/v1/chain/get_table_rows",
        {
            "code": "proton.swaps",
            "table": "liquidities",
            "scope": account,
            "limit": 100,
            "json": True
        }
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)

@mcp.tool()
async def get_code(account_name: str) -> str:
    """
    Get WASM code hash and ABI for a smart contract account on Proton blockchain.
    
    Retrieves contract code information including WASM bytecode hash, ABI, and
    deployment details. Use this to verify contract code and access full ABI.
    
    Returns contract code info:
    - Code Hash: SHA256 hash of WASM bytecode
    - ABI: Complete Application Binary Interface
    - Account: Contract account name
    - Code Sequence: Version number (increments on updates)
    
    Contract Code:
    - WASM: WebAssembly bytecode (compiled from C++)
    - ABI: JSON interface definition
    - Hash: Cryptographic verification
    - Immutable: Code can only change via setcode action
    
    Use this to:
    - Verify contract code authenticity
    - Get complete contract ABI
    - Check if contract code changed
    - Audit smart contract deployments
    - Build contract verification tools
    
    Args:
        account_name: Contract account name (e.g., "eosio.token", "atomicassets")
        
    Returns:
        JSON with code hash and ABI or error if not a contract
    """
    result = await call_proton_rpc(
        "/v1/chain/get_code",
        {
            "account_name": account_name,
            "code_as_wasm": False  # Don't return full WASM (too large)
        }
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)

# =============================================================================
# Legacy/Demo Tools
# =============================================================================

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
