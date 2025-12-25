/**
 * Token/Currency Tools
 * 
 * MCP tools for token queries on Proton blockchain
 */

import { 
  getCurrencyBalance, 
  getCurrencyStats, 
  getTableRows,
  getTableByScope 
} from '../adapters/token-adapter';

/**
 * Get currency balance for an account
 */
export const getCurrencyBalanceTool = {
  name: 'get_currency_balance',
  description: 'Get token balance for an account. Common contracts: "eosio.token" for XPR, "xtokens" for wrapped tokens (XBTC, XETH, XUSDC, XMD, etc.), "loan.token" for LOAN',
  inputSchema: {
    type: 'object',
    properties: {
      contract: {
        type: 'string',
        description: 'Token contract (e.g., "eosio.token", "xtokens", "loan.token")',
      },
      account: {
        type: 'string',
        description: 'Account name to check balance for',
      },
      symbol: {
        type: 'string',
        description: 'Optional: specific token symbol (e.g., "XPR", "XBTC", "XMD")',
      },
    },
    required: ['contract', 'account'],
  },
  handler: async (params: any) => {
    try {
      const data = await getCurrencyBalance(params.contract, params.account, params.symbol);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: { code: 'TOKEN_ERROR', message: String(error), details: {} } };
    }
  },
};

/**
 * Get currency stats (supply info)
 */
export const getCurrencyStatsTool = {
  name: 'get_currency_stats',
  description: 'Get token supply statistics including total supply, max supply, and issuer',
  inputSchema: {
    type: 'object',
    properties: {
      contract: {
        type: 'string',
        description: 'Token contract (e.g., "eosio.token", "xtokens")',
      },
      symbol: {
        type: 'string',
        description: 'Token symbol (e.g., "XPR", "XBTC")',
      },
    },
    required: ['contract', 'symbol'],
  },
  handler: async (params: any) => {
    try {
      const data = await getCurrencyStats(params.contract, params.symbol);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: { code: 'TOKEN_ERROR', message: String(error), details: {} } };
    }
  },
};

/**
 * Generic table query
 */
export const getTableRowsTool = {
  name: 'get_table_rows',
  description: 'Query any smart contract table on Proton. Use get_abi first to discover available tables.',
  inputSchema: {
    type: 'object',
    properties: {
      contract: {
        type: 'string',
        description: 'Contract account name',
      },
      table: {
        type: 'string',
        description: 'Table name',
      },
      scope: {
        type: 'string',
        description: 'Table scope (often same as contract, or account name)',
      },
      limit: {
        type: 'number',
        description: 'Max rows to return (default: 100)',
      },
      lower_bound: {
        type: 'string',
        description: 'Lower bound for primary key',
      },
      upper_bound: {
        type: 'string',
        description: 'Upper bound for primary key',
      },
    },
    required: ['contract', 'table'],
  },
  handler: async (params: any) => {
    try {
      const data = await getTableRows(
        params.contract,
        params.table,
        params.scope,
        {
          limit: params.limit,
          lower_bound: params.lower_bound,
          upper_bound: params.upper_bound,
        }
      );
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: { code: 'TABLE_ERROR', message: String(error), details: {} } };
    }
  },
};

/**
 * Get table scopes
 */
export const getTableByScopeTool = {
  name: 'get_table_by_scope',
  description: 'List all scopes (instances) of a table in a contract. Useful for finding all accounts with data.',
  inputSchema: {
    type: 'object',
    properties: {
      contract: {
        type: 'string',
        description: 'Contract account name',
      },
      table: {
        type: 'string',
        description: 'Optional: specific table name',
      },
      limit: {
        type: 'number',
        description: 'Max scopes to return (default: 100)',
      },
    },
    required: ['contract'],
  },
  handler: async (params: any) => {
    try {
      const data = await getTableByScope(params.contract, params.table, params.limit);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: { code: 'TABLE_ERROR', message: String(error), details: {} } };
    }
  },
};

export const tokenTools = [
  getCurrencyBalanceTool,
  getCurrencyStatsTool,
  getTableRowsTool,
  getTableByScopeTool,
];
