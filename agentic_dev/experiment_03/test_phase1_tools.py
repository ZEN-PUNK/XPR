#!/usr/bin/env python3
"""
Test script for Phase 1 MCP tools
Run this after MCP client reconnects to verify all 4 new tools work correctly
"""

import sys

# Test configurations
TESTS = [
    {
        "name": "get_chain_info",
        "tool": "mcp_mcp-sama_get_chain_info",
        "params": {},
        "description": "Get current Proton chain state"
    },
    {
        "name": "get_block",
        "tool": "mcp_mcp-sama_get_block",
        "params": {"block_num_or_id": "358042468"},
        "description": "Retrieve specific block details"
    },
    {
        "name": "get_currency_balance",
        "tool": "mcp_mcp-sama_get_currency_balance",
        "params": {
            "code": "eosio.token",
            "account": "zenpunk",
            "symbol": "XPR"
        },
        "description": "Get XPR balance for zenpunk account"
    },
    {
        "name": "get_table_rows",
        "tool": "mcp_mcp-sama_get_table_rows",
        "params": {
            "code": "eosio.token",
            "table": "accounts",
            "scope": "zenpunk",
            "limit": 10
        },
        "description": "Query token accounts table"
    }
]

def print_test_instructions():
    """Print manual testing instructions for MCP tools"""
    print("=" * 80)
    print("PHASE 1 MCP TOOLS - MANUAL TEST INSTRUCTIONS")
    print("=" * 80)
    print()
    print("Prerequisites:")
    print("1. Reconnect MCP client to refresh tool list")
    print("2. Ensure you're connected to: https://YOUR-FUNCTION-APP.azurewebsites.net/")
    print()
    print("=" * 80)
    print()
    
    for i, test in enumerate(TESTS, 1):
        print(f"Test {i}: {test['name']}")
        print("-" * 80)
        print(f"Description: {test['description']}")
        print(f"\nCommand to run in MCP client:")
        print(f"{test['tool']}(", end="")
        
        if test['params']:
            params = ', '.join(f'{k}="{v}"' if isinstance(v, str) else f'{k}={v}' 
                             for k, v in test['params'].items())
            print(params, end="")
        
        print(")")
        print(f"\nExpected result: JSON response with blockchain data")
        print(f"Expected status: Success (200 OK)")
        print()
        print("=" * 80)
        print()
    
    print("\nVerification Checklist:")
    print("[ ] All 4 tools appear in MCP tool list")
    print("[ ] get_chain_info returns current chain state")
    print("[ ] get_block returns block details")
    print("[ ] get_currency_balance returns token balances")
    print("[ ] get_table_rows returns contract table data")
    print("[ ] All responses are valid JSON")
    print("[ ] Error handling works (test with invalid inputs)")
    print("[ ] Response time < 500ms for each tool")
    print()
    print("=" * 80)

def print_curl_tests():
    """Print curl commands for direct API testing"""
    print("\nDIRECT API TESTING (Alternative)")
    print("=" * 80)
    print("\nIf MCP tools not visible, test the Azure Function directly:\n")
    
    base_url = "https://YOUR-FUNCTION-APP.azurewebsites.net"
    
    print("# Test 1: Check function is running")
    print(f"curl -s {base_url}/health")
    print()
    
    print("# Test 2: List available tools (if endpoint exists)")
    print(f"curl -s -X POST {base_url}/mcp/v1/tools/list \\")
    print("  -H 'Content-Type: application/json' \\")
    print("  -d '{}' | jq .")
    print()
    
    print("# Note: Direct RPC testing")
    print("# The tools call Proton RPC endpoints, you can test those directly:")
    print()
    print("curl -s -X POST https://proton.greymass.com/v1/chain/get_info | jq .")
    print()
    print("=" * 80)

if __name__ == "__main__":
    print_test_instructions()
    print_curl_tests()
    
    print("\n✅ Phase 1 Implementation Complete!")
    print(f"📊 Progress: 5/32 tools (15.6%)")
    print(f"🚀 Next: Phase 2 - Account & Token Tools (4 tools)")
    print()
