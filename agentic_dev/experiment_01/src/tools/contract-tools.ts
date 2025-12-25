/**
 * Contract Tools
 * 
 * MCP tools for inspecting smart contracts on Proton blockchain
 */

import { getAbi, getRawAbi, getCode } from '../adapters/contract-adapter';

/**
 * Get contract ABI
 */
export const getAbiTool = {
  name: 'get_abi',
  description: 'Get the ABI (Application Binary Interface) of a smart contract. Returns available tables, actions, and data structures.',
  inputSchema: {
    type: 'object',
    properties: {
      account_name: {
        type: 'string',
        description: 'Contract account name (e.g., "eosio.token", "lending.loan", "proton.swaps")',
      },
    },
    required: ['account_name'],
  },
  handler: async (params: any) => {
    try {
      const data = await getAbi(params.account_name);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: { code: 'ABI_ERROR', message: String(error), details: {} } };
    }
  },
};

/**
 * Get raw ABI hash
 */
export const getRawAbiTool = {
  name: 'get_raw_abi',
  description: 'Get the raw ABI hash and code hash for a contract. Useful for verifying contract versions.',
  inputSchema: {
    type: 'object',
    properties: {
      account_name: {
        type: 'string',
        description: 'Contract account name',
      },
    },
    required: ['account_name'],
  },
  handler: async (params: any) => {
    try {
      const data = await getRawAbi(params.account_name);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: { code: 'ABI_ERROR', message: String(error), details: {} } };
    }
  },
};

/**
 * Get code hash
 */
export const getCodeTool = {
  name: 'get_code',
  description: 'Check if an account has smart contract code deployed and get its hash',
  inputSchema: {
    type: 'object',
    properties: {
      account_name: {
        type: 'string',
        description: 'Account name to check',
      },
    },
    required: ['account_name'],
  },
  handler: async (params: any) => {
    try {
      const data = await getCode(params.account_name);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: { code: 'CODE_ERROR', message: String(error), details: {} } };
    }
  },
};

export const contractTools = [
  getAbiTool,
  getRawAbiTool,
  getCodeTool,
];
