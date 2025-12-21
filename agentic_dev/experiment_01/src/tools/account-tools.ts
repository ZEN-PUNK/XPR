import { getAccount, getAccountResources } from '../adapters';

/**
 * MCP Tool Definition: get_account
 * Retrieves Proton account information
 */
export const getAccountTool = {
  name: 'get_account',
  description: 'Retrieve Proton account information including resources, permissions, and voting status',
  inputSchema: {
    type: 'object',
    properties: {
      account_name: {
        type: 'string',
        description: 'Proton account name (e.g., "zenpunk", "bloksio", "eosio")',
      },
    },
    required: ['account_name'],
  },
  handler: async (params: any) => {
    try {
      const accountData = await getAccount(params.account_name);
      return {
        success: true,
        data: accountData,
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
 * MCP Tool Definition: get_account_resources
 * Quick access to account resource quotas and usage
 */
export const getAccountResourcesTool = {
  name: 'get_account_resources',
  description: 'Get CPU, NET, and RAM resource information for a Proton account',
  inputSchema: {
    type: 'object',
    properties: {
      account_name: {
        type: 'string',
        description: 'Proton account name',
      },
    },
    required: ['account_name'],
  },
  handler: async (params: any) => {
    try {
      const resources = await getAccountResources(params.account_name);
      return {
        success: true,
        data: resources,
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
 * Tool registry for account-related tools
 */
export const accountTools = [getAccountTool, getAccountResourcesTool];
