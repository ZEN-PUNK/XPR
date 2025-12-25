/**
 * Swap Tools
 * 
 * MCP tools for DEX/proton.swaps queries
 */

import { 
  getSwapPools, 
  getPoolByPair, 
  getSwapRate,
  getLiquidityPositions 
} from '../adapters/swap-adapter';

/**
 * Get all swap pools
 */
export const getSwapPoolsTool = {
  name: 'get_swap_pools',
  description: 'Get all liquidity pools from proton.swaps DEX with reserves, fees, and stats',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Max pools to return (default: 100)',
      },
    },
    required: [],
  },
  handler: async (params: any) => {
    try {
      const data = await getSwapPools({
        limit: params.limit,
      });
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: { code: 'SWAP_ERROR', message: String(error), details: {} } };
    }
  },
};

/**
 * Get pool by token pair
 */
export const getPoolByPairTool = {
  name: 'get_pool_by_pair',
  description: 'Get a specific liquidity pool by token pair (e.g., XPR/XUSDC)',
  inputSchema: {
    type: 'object',
    properties: {
      token_a: {
        type: 'string',
        description: 'First token symbol (e.g., "XPR")',
      },
      token_b: {
        type: 'string',
        description: 'Second token symbol (e.g., "XUSDC")',
      },
    },
    required: ['token_a', 'token_b'],
  },
  handler: async (params: any) => {
    try {
      const data = await getPoolByPair(params.token_a, params.token_b);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: { code: 'POOL_ERROR', message: String(error), details: {} } };
    }
  },
};

/**
 * Get swap rate between tokens
 */
export const getSwapRateTool = {
  name: 'get_swap_rate',
  description: 'Calculate swap rate and output amount for a given input (includes fee calculation)',
  inputSchema: {
    type: 'object',
    properties: {
      token_in: {
        type: 'string',
        description: 'Input token symbol (e.g., "XPR")',
      },
      token_out: {
        type: 'string',
        description: 'Output token symbol (e.g., "XUSDC")',
      },
      amount_in: {
        type: 'number',
        description: 'Amount of input token',
      },
    },
    required: ['token_in', 'token_out', 'amount_in'],
  },
  handler: async (params: any) => {
    try {
      const data = await getSwapRate(
        params.token_in,
        params.token_out,
        params.amount_in
      );
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: { code: 'RATE_ERROR', message: String(error), details: {} } };
    }
  },
};

/**
 * Get liquidity positions for an account
 */
export const getLiquidityPositionsTool = {
  name: 'get_liquidity_positions',
  description: 'Get liquidity provider positions for an account in proton.swaps pools',
  inputSchema: {
    type: 'object',
    properties: {
      account: {
        type: 'string',
        description: 'Proton account name',
      },
    },
    required: ['account'],
  },
  handler: async (params: any) => {
    try {
      const data = await getLiquidityPositions(params.account);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: { code: 'LP_ERROR', message: String(error), details: {} } };
    }
  },
};

export const swapTools = [
  getSwapPoolsTool,
  getPoolByPairTool,
  getSwapRateTool,
  getLiquidityPositionsTool,
];
