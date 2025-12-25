import { accountTools } from './account-tools';
import { chainTools } from './chain-tools';
import { lendingTools } from './lending-tools';

/**
 * Global tool registry
 * Combines all MCP tools from different categories:
 * - Account tools: get_account, get_account_resources
 * - Chain tools: get_chain_info, get_block, get_block_transaction_count
 * - Lending tools (SAMA): get_lending_markets, get_oracle_prices, 
 *                         get_liquidatable_positions, get_at_risk_positions,
 *                         get_lending_position
 */
const allTools = [...accountTools, ...chainTools, ...lendingTools];

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

export { accountTools, chainTools };
