#!/usr/bin/env python3
"""
Test Phase 4B-Partial Tools via deployed Azure endpoint
"""

import httpx
import json
import asyncio

BASE_URL = "https://YOUR-FUNCTION-APP.azurewebsites.net"

async def call_tool(tool_name: str, arguments: dict):
    """Call a tool on the deployed MCP server"""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            # Try the direct tool call endpoint
            response = await client.get(
                f"{BASE_URL}/api/{tool_name}",
                params=arguments
            )
            
            if response.status_code == 200:
                return json.loads(response.text)
            else:
                return {"error": f"HTTP {response.status_code}", "text": response.text[:200]}
    except Exception as e:
        return {"error": str(e)}

async def test_tools():
    print("=" * 70)
    print("🧪 TESTING PHASE 4B-PARTIAL VIA DEPLOYED ENDPOINT")
    print("=" * 70)
    
    # Test 1: get_swap_rate
    print("\n1️⃣  get_swap_rate(XPR → XUSDC, 1000)")
    print("-" * 70)
    result = await call_tool("get_swap_rate", {
        "from_token": "XPR",
        "to_token": "XUSDC", 
        "amount": 1000.0
    })
    print(json.dumps(result, indent=2)[:500])
    
    # Test 2: get_liquidity_positions  
    print("\n2️⃣  get_liquidity_positions(proton.swaps)")
    print("-" * 70)
    result = await call_tool("get_liquidity_positions", {
        "account": "proton.swaps"
    })
    if "rows" in result:
        print(f"✅ Found {len(result['rows'])} LP positions")
    else:
        print(json.dumps(result, indent=2)[:500])
    
    # Test 3: get_code
    print("\n3️⃣  get_code(eosio.token)")
    print("-" * 70)
    result = await call_tool("get_code", {
        "account_name": "eosio.token"
    })
    if "abi" in result:
        print(f"✅ Retrieved ABI with {len(result['abi'].get('actions', []))} actions")
    else:
        print(json.dumps(result, indent=2)[:500])
    
    print("\n" + "=" * 70)

asyncio.run(test_tools())
