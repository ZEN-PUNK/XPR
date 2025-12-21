import fetch from 'node-fetch';

/**
 * XPR Network API Client
 * Provides methods to interact with the XPR (Proton) blockchain
 */
export class XPRClient {
  constructor(endpoint = 'https://proton.eoscafeblock.com') {
    this.endpoint = endpoint;
  }

  /**
   * Make a POST request to the XPR API
   */
  async post(path, data) {
    const response = await fetch(`${this.endpoint}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`XPR API error (${response.status} ${response.statusText}) at ${path}`);
    }

    return await response.json();
  }

  /**
   * Get blockchain information
   */
  async getInfo() {
    return await this.post('/v1/chain/get_info', {});
  }

  /**
   * Get account information
   */
  async getAccount(accountName) {
    return await this.post('/v1/chain/get_account', {
      account_name: accountName,
    });
  }

  /**
   * Get account balance
   */
  async getCurrencyBalance(account, code = 'eosio.token', symbol = 'XPR') {
    return await this.post('/v1/chain/get_currency_balance', {
      account,
      code,
      symbol,
    });
  }

  /**
   * Get block information
   */
  async getBlock(blockNumOrId) {
    return await this.post('/v1/chain/get_block', {
      block_num_or_id: blockNumOrId,
    });
  }

  /**
   * Get transaction information
   */
  async getTransaction(id) {
    return await this.post('/v1/history/get_transaction', {
      id,
    });
  }

  /**
   * Get table rows
   */
  async getTableRows(code, scope, table, options = {}) {
    return await this.post('/v1/chain/get_table_rows', {
      code,
      scope,
      table,
      json: true,
      limit: options.limit || 10,
      lower_bound: options.lower_bound,
      upper_bound: options.upper_bound,
      ...options,
    });
  }

  /**
   * Get account actions/history
   */
  async getActions(accountName, pos = -1, offset = -20) {
    return await this.post('/v1/history/get_actions', {
      account_name: accountName,
      pos,
      offset,
    });
  }

  /**
   * Push a transaction to the blockchain
   */
  async pushTransaction(signatures, serializedTransaction) {
    return await this.post('/v1/chain/push_transaction', {
      signatures,
      serialized_transaction: serializedTransaction,
    });
  }

  /**
   * Get ABI for a contract
   */
  async getAbi(accountName) {
    return await this.post('/v1/chain/get_abi', {
      account_name: accountName,
    });
  }

  /**
   * Get producers list
   */
  async getProducers(limit = 50) {
    return await this.post('/v1/chain/get_producers', {
      json: true,
      limit,
    });
  }
}
