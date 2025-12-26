import asyncio
import aiohttp
import json

# Proton RPC endpoints
RPC_ENDPOINTS = [
    "https://proton.eoscafeblock.com",
    "https://proton.greymass.com",
    "https://proton.cryptolions.io",
    "https://api.protonnz.com"
]

async def call_rpc(endpoint, path, data):
    """Call Proton RPC endpoint"""
    url = f"{endpoint}{path}"
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(url, json=data, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                return await resp.json()
        except Exception as e:
            return {"error": str(e)}

async def get_zenpunk_position():
    print("=== Fetching zenpunk lending position ===\n")
    
    # Try each endpoint
    for endpoint in RPC_ENDPOINTS:
        print(f"Trying {endpoint}...")
        result = await call_rpc(
            endpoint,
            "/v1/chain/get_table_rows",
            {
                "code": "lending.loan",
                "table": "positions",
                "scope": "zenpunk",
                "limit": 10,
                "json": True
            }
        )
        
        if "error" not in result:
            print("\n✅ Success! Position Data:")
            print(json.dumps(result, indent=2))
            
            # Parse position details
            if "rows" in result and len(result["rows"]) > 0:
                position = result["rows"][0]
                
                output = {
                    "user": "zenpunk",
                    "lending_positions": [],
                    "liquidatable_positions": []
                }
                
                # Extract position details
                supplies = position.get("supplies", [])
                borrows = position.get("borrows", [])
                health_factor = float(position.get("health_factor", "999"))
                
                for supply in supplies:
                    for borrow in borrows:
                        pos = {
                            "collateral": supply,
                            "debt": borrow,
                            "health_factor": str(health_factor),
                            "last_updated": position.get("last_updated", "")
                        }
                        output["lending_positions"].append(pos)
                        
                        # Check if liquidatable
                        if health_factor < 1.0:
                            output["liquidatable_positions"].append(pos)
                
                print("\n=== Formatted Output ===")
                print(json.dumps(output, indent=2))
            else:
                print("\n⚠️ No positions found for zenpunk")
            
            break
        else:
            print(f"  ❌ Failed: {result.get('error', 'Unknown error')}")

asyncio.run(get_zenpunk_position())
