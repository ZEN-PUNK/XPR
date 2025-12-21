import { getChainInfo, getBlock, getBlockTransactionCount } from '../adapters';

/**
 * MCP Tool Definition: get_chain_info
 * Retrieves current Proton chain metadata
 */
export const getChainInfoTool = {
  name: 'get_chain_info',
  description: 'Get current Proton chain information including head block, version, and state',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
  handler: async () => {
    try {
      const chainData = await getChainInfo();
      return {
        success: true,
        data: chainData,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.code ? error : {
          code: 'UNKNOWN_ERROR',
          message: String(error),
          details: {},
        },
      };
    }
  },
};

/**
 * MCP Tool Definition: get_block
 * Retrieves detailed block information including transactions
 */
export const getBlockTool = {
  name: 'get_block',
  description: 'Retrieve Proton block details including timestamp, producer, and transactions',
  inputSchema: {
    type: 'object',
    properties: {
      block_num_or_id: {
        type: 'string',
        description: 'Block number (integer) or block ID (hash) to retrieve',
      },
    },
    required: ['block_num_or_id'],
  },
  handler: async (params: any) => {
    try {
      const blockData = await getBlock(params.block_num_or_id);
      return {
        success: true,
        data: blockData,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.code ? error : {
          code: 'UNKNOWN_ERROR',
          message: String(error),
          details: {},
        },
      };
    }
  },
};

/**
 * MCP Tool Definition: get_block_transaction_count
 * Quick count of transactions in a block
 */
export const getBlockTransactionCountTool = {
  name: 'get_block_transaction_count',
  description: 'Get the number of transactions in a Proton block',
  inputSchema: {
    type: 'object',
    properties: {
      block_num_or_id: {
        type: 'string',
        description: 'Block number or ID',
      },
    },
    required: ['block_num_or_id'],
  },
  handler: async (params: any) => {
    try {
      const count = await getBlockTransactionCount(params.block_num_or_id);
      return {
        success: true,
        data: { transaction_count: count },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.code ? error : {
          code: 'UNKNOWN_ERROR',
          message: String(error),
          details: {},
        },
      };
    }
  },
};

/**
 * Tool registry for chain-related tools
 */
export const chainTools = [
  getChainInfoTool,
  getBlockTool,
  getBlockTransactionCountTool,
];
