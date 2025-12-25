/**
 * History/Transaction Tools
 * 
 * MCP tools for transaction history on Proton blockchain
 */

import { 
  getTransaction, 
  getActions, 
  getKeyAccounts, 
  getControlledAccounts 
} from '../adapters/history-adapter';

/**
 * Get transaction by ID
 */
export const getTransactionTool = {
  name: 'get_transaction',
  description: 'Get transaction details by transaction ID. Returns block info, status, and action traces.',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Transaction ID (hash)',
      },
    },
    required: ['id'],
  },
  handler: async (params: any) => {
    try {
      const data = await getTransaction(params.id);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: { code: 'TX_ERROR', message: String(error), details: {} } };
    }
  },
};

/**
 * Get account action history
 */
export const getActionsTool = {
  name: 'get_actions',
  description: 'Get action history for an account. Returns recent transactions and actions.',
  inputSchema: {
    type: 'object',
    properties: {
      account_name: {
        type: 'string',
        description: 'Account name to get history for',
      },
      pos: {
        type: 'number',
        description: 'Position in history (-1 for latest)',
      },
      offset: {
        type: 'number',
        description: 'Number of actions to return (negative for previous)',
      },
      filter: {
        type: 'string',
        description: 'Optional: filter by contract:action (e.g., "eosio.token:transfer")',
      },
    },
    required: ['account_name'],
  },
  handler: async (params: any) => {
    try {
      const data = await getActions(params.account_name, {
        pos: params.pos,
        offset: params.offset,
        filter: params.filter,
      });
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: { code: 'HISTORY_ERROR', message: String(error), details: {} } };
    }
  },
};

/**
 * Get accounts by public key
 */
export const getKeyAccountsTool = {
  name: 'get_key_accounts',
  description: 'Find all accounts controlled by a specific public key',
  inputSchema: {
    type: 'object',
    properties: {
      public_key: {
        type: 'string',
        description: 'Public key (PUB_K1_... or EOS... format)',
      },
    },
    required: ['public_key'],
  },
  handler: async (params: any) => {
    try {
      const data = await getKeyAccounts(params.public_key);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: { code: 'KEY_ERROR', message: String(error), details: {} } };
    }
  },
};

/**
 * Get controlled accounts
 */
export const getControlledAccountsTool = {
  name: 'get_controlled_accounts',
  description: 'Find all accounts controlled by another account (via permissions)',
  inputSchema: {
    type: 'object',
    properties: {
      controlling_account: {
        type: 'string',
        description: 'Account that controls other accounts',
      },
    },
    required: ['controlling_account'],
  },
  handler: async (params: any) => {
    try {
      const data = await getControlledAccounts(params.controlling_account);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: { code: 'ACCOUNT_ERROR', message: String(error), details: {} } };
    }
  },
};

export const historyTools = [
  getTransactionTool,
  getActionsTool,
  getKeyAccountsTool,
  getControlledAccountsTool,
];
