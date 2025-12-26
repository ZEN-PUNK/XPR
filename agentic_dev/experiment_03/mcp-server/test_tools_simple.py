import asyncio
import json
from server import mcp_mcp-sama_get_liquidatable_positions, get_at_risk_positions

async def main():
    print("=== Testing Liquidatable Positions ===")
    result1 = await get_liquidatable_positions(0.5)
    print(result1)
    
    print("\n=== Testing At-Risk Positions ===")
    result2 = await get_at_risk_positions(1.1)
    print(result2)

asyncio.run(main())
