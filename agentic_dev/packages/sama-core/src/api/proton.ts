/**
 * Proton Blockchain API Client
 */

import { PROTON_ENDPOINTS, CONTRACTS, TABLES } from '../constants/contracts';
import { TableQuery } from '../types/common';

/**
 * Proton API Client
 * Handles all blockchain queries
 */
export class ProtonAPI {
  private endpoint: string;
  
  constructor(endpoint?: string) {
    this.endpoint = endpoint || PROTON_ENDPOINTS.PRIMARY;
  }
  
  /**
   * Set API endpoint
   */
  setEndpoint(endpoint: string): void {
    this.endpoint = endpoint;
  }
  
  /**
   * Query table rows
   */
  async getTableRows<T = any>(query: TableQuery): Promise<T[]> {
    const response = await fetch(`${this.endpoint}/v1/chain/get_table_rows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: query.code,
        table: query.table,
        scope: query.scope,
        limit: query.limit || 100,
        lower_bound: query.lowerBound || '',
        upper_bound: query.upperBound || '',
        index_position: query.indexPosition || 1,
        key_type: query.keyType || '',
        json: true,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json() as { rows?: T[] };
    return data.rows || [];
  }
  
  /**
   * Get chain info
   */
  async getInfo(): Promise<any> {
    const response = await fetch(`${this.endpoint}/v1/chain/get_info`);
    return response.json();
  }
  
  /**
   * Get account info
   */
  async getAccount(name: string): Promise<any> {
    const response = await fetch(`${this.endpoint}/v1/chain/get_account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_name: name }),
    });
    return response.json();
  }
  
  /**
   * Get token balance
   */
  async getBalance(account: string, contract: string, symbol?: string): Promise<string[]> {
    const rows = await this.getTableRows<{ balance: string }>({
      code: contract,
      table: TABLES.TOKEN.ACCOUNTS,
      scope: account,
      limit: 100,
    });
    
    const balances = rows.map(r => r.balance);
    
    if (symbol) {
      return balances.filter(b => b.includes(symbol));
    }
    
    return balances;
  }
  
  /**
   * Get currency stats
   */
  async getCurrencyStats(contract: string, symbol: string): Promise<any> {
    const rows = await this.getTableRows({
      code: contract,
      table: TABLES.TOKEN.STAT,
      scope: symbol,
      limit: 1,
    });
    return rows[0] || null;
  }
  
  // ==================== LENDING HELPERS ====================
  
  /**
   * Get all lending markets
   */
  async getLendingMarkets(): Promise<any[]> {
    return this.getTableRows({
      code: CONTRACTS.LENDING,
      table: TABLES.LENDING.MARKETS,
      scope: CONTRACTS.LENDING,
      limit: 50,
    });
  }
  
  /**
   * Get user shares (collateral)
   */
  async getUserShares(account: string): Promise<any> {
    const rows = await this.getTableRows({
      code: CONTRACTS.LENDING,
      table: TABLES.LENDING.SHARES,
      scope: CONTRACTS.LENDING,
      lowerBound: account,
      upperBound: account,
      limit: 1,
    });
    return rows[0] || null;
  }
  
  /**
   * Get user borrows
   */
  async getUserBorrows(account: string): Promise<any> {
    const rows = await this.getTableRows({
      code: CONTRACTS.LENDING,
      table: TABLES.LENDING.BORROWS,
      scope: CONTRACTS.LENDING,
      lowerBound: account,
      upperBound: account,
      limit: 1,
    });
    return rows[0] || null;
  }
  
  /**
   * Get all shares (for scanning)
   */
  async getAllShares(limit = 500): Promise<any[]> {
    return this.getTableRows({
      code: CONTRACTS.LENDING,
      table: TABLES.LENDING.SHARES,
      scope: CONTRACTS.LENDING,
      limit,
    });
  }
  
  /**
   * Get all borrows (for scanning)
   */
  async getAllBorrows(limit = 500): Promise<any[]> {
    return this.getTableRows({
      code: CONTRACTS.LENDING,
      table: TABLES.LENDING.BORROWS,
      scope: CONTRACTS.LENDING,
      limit,
    });
  }
  
  // ==================== ORACLE HELPERS ====================
  
  /**
   * Get oracle price data
   */
  async getOraclePrices(): Promise<any[]> {
    return this.getTableRows({
      code: CONTRACTS.ORACLE,
      table: TABLES.ORACLE.DATA,
      scope: CONTRACTS.ORACLE,
      limit: 50,
    });
  }
  
  /**
   * Get oracle feeds config
   */
  async getOracleFeeds(): Promise<any[]> {
    return this.getTableRows({
      code: CONTRACTS.ORACLE,
      table: TABLES.ORACLE.FEEDS,
      scope: CONTRACTS.ORACLE,
      limit: 50,
    });
  }
  
  // ==================== DEX HELPERS ====================
  
  /**
   * Get all swap pools
   */
  async getSwapPools(): Promise<any[]> {
    return this.getTableRows({
      code: CONTRACTS.SWAPS,
      table: TABLES.SWAPS.POOLS,
      scope: CONTRACTS.SWAPS,
      limit: 200,
    });
  }
  
  /**
   * Get specific pool by ID
   */
  async getSwapPool(poolId: number): Promise<any> {
    const rows = await this.getTableRows({
      code: CONTRACTS.SWAPS,
      table: TABLES.SWAPS.POOLS,
      scope: CONTRACTS.SWAPS,
      lowerBound: poolId.toString(),
      upperBound: poolId.toString(),
      limit: 1,
    });
    return rows[0] || null;
  }
}

// Default instance
export const protonApi = new ProtonAPI();
