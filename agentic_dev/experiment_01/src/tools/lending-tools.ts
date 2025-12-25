/**
 * SAMA Protocol Lending Tools for Proton MCP Server
 * 
 * Tools for interacting with MetalX Lending Protocol:
 * - Get lending markets data
 * - Find liquidatable positions
 * - Get oracle prices
 * - Analyze positions
 */

import { getLendingMarkets, getOraclePrices, getLiquidatablePositions, getAtRiskPositions, getLendingPosition } from '../adapters/lending-adapter';

/**
 * Get all lending markets with supply/borrow rates
 */
export const getLendingMarketsTool = {
  name: 'get_lending_markets',
  description: 'Get all MetalX lending markets with supply rates, borrow rates, utilization, and total values',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
  handler: async (_params: any) => {
    try {
      const data = await getLendingMarkets();
      return { success: true, data };
    } catch (error: any) {
      return {
        success: false,
        error: { code: 'LENDING_ERROR', message: String(error), details: {} },
      };
    }
  },
};

/**
 * Get current oracle prices for all tokens
 */
export const getOraclePricesTool = {
  name: 'get_oracle_prices',
  description: 'Get current oracle prices for all supported tokens on Proton',
  inputSchema: {
    type: 'object',
    properties: {
      symbols: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional: filter by specific symbols (e.g., ["XBTC", "XETH"])',
      },
    },
    required: [],
  },
  handler: async (params: any) => {
    try {
      const data = await getOraclePrices(params?.symbols);
      return { success: true, data };
    } catch (error: any) {
      return {
        success: false,
        error: { code: 'ORACLE_ERROR', message: String(error), details: {} },
      };
    }
  },
};

/**
 * Find positions that can be liquidated (HF < 1.0)
 */
export const getLiquidatablePositionsTool = {
  name: 'get_liquidatable_positions',
  description: 'Find all lending positions with Health Factor below 1.0 that can be liquidated for profit',
  inputSchema: {
    type: 'object',
    properties: {
      min_profit_usd: {
        type: 'number',
        description: 'Minimum profit threshold in USD (default: 0.50)',
      },
    },
    required: [],
  },
  handler: async (params: any) => {
    try {
      const minProfit = params?.min_profit_usd ?? 0.50;
      const data = await getLiquidatablePositions(minProfit);
      return { success: true, data };
    } catch (error: any) {
      return {
        success: false,
        error: { code: 'LIQUIDATION_ERROR', message: String(error), details: {} },
      };
    }
  },
};

/**
 * Find positions at risk (HF between 1.0 and 1.1)
 */
export const getAtRiskPositionsTool = {
  name: 'get_at_risk_positions',
  description: 'Find lending positions with Health Factor between 1.0 and 1.1 that may become liquidatable soon',
  inputSchema: {
    type: 'object',
    properties: {
      hf_threshold: {
        type: 'number',
        description: 'Health factor threshold (default: 1.1)',
      },
    },
    required: [],
  },
  handler: async (params: any) => {
    try {
      const threshold = params?.hf_threshold ?? 1.1;
      const data = await getAtRiskPositions(threshold);
      return { success: true, data };
    } catch (error: any) {
      return {
        success: false,
        error: { code: 'POSITION_ERROR', message: String(error), details: {} },
      };
    }
  },
};

/**
 * Get detailed lending position for a specific account
 */
export const getLendingPositionTool = {
  name: 'get_lending_position',
  description: 'Get detailed lending position for a specific Proton account including collateral, debt, and health factor',
  inputSchema: {
    type: 'object',
    properties: {
      account: {
        type: 'string',
        description: 'Proton account name (e.g., "sombrasama")',
      },
    },
    required: ['account'],
  },
  handler: async (params: any) => {
    try {
      const data = await getLendingPosition(params.account);
      return { success: true, data };
    } catch (error: any) {
      return {
        success: false,
        error: { code: 'POSITION_ERROR', message: String(error), details: {} },
      };
    }
  },
};

/**
 * Export all lending tools
 */
export const lendingTools = [
  getLendingMarketsTool,
  getOraclePricesTool,
  getLiquidatablePositionsTool,
  getAtRiskPositionsTool,
  getLendingPositionTool,
];
