import { accountTools } from './account-tools';
import { chainTools } from './chain-tools';
import { lendingTools } from './lending-tools';
import { tokenTools } from './token-tools';
import { contractTools } from './contract-tools';
import { historyTools } from './history-tools';
import { producerTools } from './producer-tools';
import { swapTools } from './swap-tools';
import { nftTools } from './nft-tools';

/**
 * Global tool registry - MEGA UPGRADE v2.0
 * Combines all MCP tools from different categories:
 * 
 * ACCOUNT (2 tools):
 * - get_account: Account info, permissions, voting
 * - get_account_resources: CPU, NET, RAM usage
 * 
 * CHAIN (3 tools):
 * - get_chain_info: Chain state, head block
 * - get_block: Block details
 * - get_block_transaction_count: Transaction count in block
 * 
 * LENDING - SAMA Protocol (5 tools):
 * - get_lending_markets: All lending markets
 * - get_oracle_prices: Token prices from oracles
 * - get_liquidatable_positions: Find liquidation opportunities
 * - get_at_risk_positions: Positions near liquidation
 * - get_lending_position: Specific account position
 * 
 * TOKEN (4 tools):
 * - get_currency_balance: Token balance for account
 * - get_currency_stats: Token supply info
 * - get_table_rows: Generic table query
 * - get_table_by_scope: Table scope enumeration
 * 
 * CONTRACT (2 tools):
 * - get_abi: Contract ABI
 * - get_code: Contract code hash
 * 
 * HISTORY (4 tools):
 * - get_transaction: Transaction by ID
 * - get_actions: Account action history
 * - get_key_accounts: Accounts for public key
 * - get_controlled_accounts: Sub-accounts
 * 
 * PRODUCER (3 tools):
 * - get_producers: Block producer list
 * - get_producer_schedule: Active schedule
 * - get_protocol_features: Activated features
 * 
 * SWAP - DEX (4 tools):
 * - get_swap_pools: All liquidity pools
 * - get_pool_by_pair: Pool for token pair
 * - get_swap_rate: Calculate swap output
 * - get_liquidity_positions: LP positions
 * 
 * NFT - AtomicAssets (5 tools):
 * - get_account_nfts: NFTs owned by account
 * - get_nft_templates: Collection templates
 * - get_nft_collections: All collections
 * - get_nft_asset: Specific NFT details
 * - get_nft_schemas: Collection schemas
 * 
 * TOTAL: 32 tools
 */
const allTools = [
  ...accountTools, 
  ...chainTools, 
  ...lendingTools,
  ...tokenTools,
  ...contractTools,
  ...historyTools,
  ...producerTools,
  ...swapTools,
  ...nftTools,
];

/**
 * Get tool by name
 */
export function getTool(name: string) {
  return allTools.find((tool) => tool.name === name);
}

/**
 * Get all tools for schema listing
 */
export function listTools() {
  return allTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));
}

/**
 * Call a tool by name with parameters
 */
export async function callTool(
  toolName: string,
  params: any
): Promise<{ success: boolean; data?: any; error?: any }> {
  const tool = getTool(toolName);
  
  if (!tool) {
    return {
      success: false,
      error: {
        code: 'TOOL_NOT_FOUND',
        message: `Tool "${toolName}" not found`,
        details: { tool_name: toolName },
      },
    };
  }

  try {
    return await tool.handler(params);
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'TOOL_EXECUTION_ERROR',
        message: String(error),
        details: { tool_name: toolName },
      },
    };
  }
}

export { 
  accountTools, 
  chainTools, 
  lendingTools,
  tokenTools,
  contractTools,
  historyTools,
  producerTools,
  swapTools,
  nftTools,
};
