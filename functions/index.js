import { app } from '@azure/functions';
import { XPRClient } from '../src/xpr-client.js';

const xprClient = new XPRClient();

/**
 * Azure Function: Get Chain Info
 */
app.http('getChainInfo', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const info = await xprClient.getInfo();
      return {
        status: 200,
        jsonBody: info,
      };
    } catch (error) {
      context.error('Error getting chain info:', error);
      return {
        status: 500,
        jsonBody: { error: error.message },
      };
    }
  },
});

/**
 * Azure Function: Get Account
 */
app.http('getAccount', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const accountName =
        request.query.get('account_name') ||
        (await request.json()).account_name;

      if (!accountName) {
        return {
          status: 400,
          jsonBody: { error: 'account_name is required' },
        };
      }

      const account = await xprClient.getAccount(accountName);
      return {
        status: 200,
        jsonBody: account,
      };
    } catch (error) {
      context.error('Error getting account:', error);
      return {
        status: 500,
        jsonBody: { error: error.message },
      };
    }
  },
});

/**
 * Azure Function: Get Balance
 */
app.http('getBalance', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      let account, code, symbol;

      if (request.method === 'GET') {
        account = request.query.get('account');
        code = request.query.get('code') || 'eosio.token';
        symbol = request.query.get('symbol') || 'XPR';
      } else {
        const body = await request.json();
        account = body.account;
        code = body.code || 'eosio.token';
        symbol = body.symbol || 'XPR';
      }

      if (!account) {
        return {
          status: 400,
          jsonBody: { error: 'account is required' },
        };
      }

      const balance = await xprClient.getCurrencyBalance(account, code, symbol);
      return {
        status: 200,
        jsonBody: { account, balance },
      };
    } catch (error) {
      context.error('Error getting balance:', error);
      return {
        status: 500,
        jsonBody: { error: error.message },
      };
    }
  },
});

/**
 * Azure Function: Get Block
 */
app.http('getBlock', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const blockNumOrId =
        request.query.get('block_num_or_id') ||
        (await request.json()).block_num_or_id;

      if (!blockNumOrId) {
        return {
          status: 400,
          jsonBody: { error: 'block_num_or_id is required' },
        };
      }

      const block = await xprClient.getBlock(blockNumOrId);
      return {
        status: 200,
        jsonBody: block,
      };
    } catch (error) {
      context.error('Error getting block:', error);
      return {
        status: 500,
        jsonBody: { error: error.message },
      };
    }
  },
});

/**
 * Azure Function: Get Transaction
 */
app.http('getTransaction', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const transactionId =
        request.query.get('transaction_id') ||
        (await request.json()).transaction_id;

      if (!transactionId) {
        return {
          status: 400,
          jsonBody: { error: 'transaction_id is required' },
        };
      }

      const transaction = await xprClient.getTransaction(transactionId);
      return {
        status: 200,
        jsonBody: transaction,
      };
    } catch (error) {
      context.error('Error getting transaction:', error);
      return {
        status: 500,
        jsonBody: { error: error.message },
      };
    }
  },
});

/**
 * Azure Function: Get Table Rows
 */
app.http('getTableRows', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const body = await request.json();
      const { code, scope, table, limit, lower_bound, upper_bound } = body;

      if (!code || !scope || !table) {
        return {
          status: 400,
          jsonBody: { error: 'code, scope, and table are required' },
        };
      }

      const rows = await xprClient.getTableRows(code, scope, table, {
        limit,
        lower_bound,
        upper_bound,
      });
      return {
        status: 200,
        jsonBody: rows,
      };
    } catch (error) {
      context.error('Error getting table rows:', error);
      return {
        status: 500,
        jsonBody: { error: error.message },
      };
    }
  },
});

/**
 * Azure Function: Get Actions
 */
app.http('getActions', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      let accountName, pos, offset;

      if (request.method === 'GET') {
        accountName = request.query.get('account_name');
        pos = parseInt(request.query.get('pos') || '-1');
        offset = parseInt(request.query.get('offset') || '-20');
      } else {
        const body = await request.json();
        accountName = body.account_name;
        pos = body.pos || -1;
        offset = body.offset || -20;
      }

      if (!accountName) {
        return {
          status: 400,
          jsonBody: { error: 'account_name is required' },
        };
      }

      const actions = await xprClient.getActions(accountName, pos, offset);
      return {
        status: 200,
        jsonBody: actions,
      };
    } catch (error) {
      context.error('Error getting actions:', error);
      return {
        status: 500,
        jsonBody: { error: error.message },
      };
    }
  },
});

/**
 * Azure Function: Get ABI
 */
app.http('getAbi', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const accountName =
        request.query.get('account_name') ||
        (await request.json()).account_name;

      if (!accountName) {
        return {
          status: 400,
          jsonBody: { error: 'account_name is required' },
        };
      }

      const abi = await xprClient.getAbi(accountName);
      return {
        status: 200,
        jsonBody: abi,
      };
    } catch (error) {
      context.error('Error getting ABI:', error);
      return {
        status: 500,
        jsonBody: { error: error.message },
      };
    }
  },
});

/**
 * Azure Function: Get Producers
 */
app.http('getProducers', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      let limit;

      if (request.method === 'GET') {
        limit = parseInt(request.query.get('limit') || '50');
      } else {
        const body = await request.json();
        limit = body.limit || 50;
      }

      const producers = await xprClient.getProducers(limit);
      return {
        status: 200,
        jsonBody: producers,
      };
    } catch (error) {
      context.error('Error getting producers:', error);
      return {
        status: 500,
        jsonBody: { error: error.message },
      };
    }
  },
});
