#!/usr/bin/env python3
"""Test the get_account MCP tool"""

import httpx
import json

def test_get_account():
    """Test calling the get_account tool via MCP protocol"""
    
    response = httpx.post(
        'http://localhost:7071/mcp',
        headers={
            'Accept': 'application/json, text/event-stream',
            'Content-Type': 'application/json'
        },
        json={
            'jsonrpc': '2.0',
            'id': 1,
            'method': 'tools/call',
            'params': {
                'name': 'get_account',
                'arguments': {'account_name': 'zenpunk'}
            }
        },
        timeout=30
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Content-Type: {response.headers.get('content-type')}")
    print(f"\nRaw Response:")
    print(response.text[:2000])  # First 2000 chars
    
    # Check if successful
    if response.status_code == 200:
        print(f"\n✅ SUCCESS - Tool request sent")
        # Try to parse if JSON
        if 'application/json' in response.headers.get('content-type', ''):
            result = response.json()
            print(f"\nParsed Response:")
            print(json.dumps(result, indent=2))
        else:
            print("\nResponse is SSE stream, not JSON")
    else:
        print(f"\n❌ HTTP ERROR")

if __name__ == "__main__":
    test_get_account()
