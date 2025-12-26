/**
 * Common Types for SAMA Protocol
 */

/**
 * Extended symbol as used in EOSIO contracts
 */
export interface ExtendedSymbol {
  sym: string;       // e.g., "8,XBTC"
  contract: string;  // e.g., "xtokens"
}

/**
 * Extended asset as used in EOSIO contracts
 */
export interface ExtendedAsset {
  quantity: string;   // e.g., "1.00000000 XBTC"
  contract: string;   // e.g., "xtokens"
}

/**
 * Token with amount and metadata
 */
export interface Token {
  symbol: string;
  amount: number;
  precision: number;
  contract?: string;
}

/**
 * Price data from oracle
 */
export interface OraclePrice {
  symbol: string;
  feedIndex: number;
  price: number;      // USD price
  timestamp: Date;
}

/**
 * Account on Proton blockchain
 */
export interface ProtonAccount {
  name: string;
  ramQuota: number;
  ramUsage: number;
  cpuLimit: number;
  netLimit: number;
}

/**
 * Transaction result
 */
export interface TransactionResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  blockNum?: number;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * Table query parameters
 */
export interface TableQuery {
  code: string;
  table: string;
  scope: string;
  limit?: number;
  lowerBound?: string;
  upperBound?: string;
  indexPosition?: number;
  keyType?: string;
}

/**
 * Parse quantity string to number
 * "1.23456789 XBTC" -> 1.23456789
 */
export function parseQuantity(quantity: string): number {
  const parts = quantity.trim().split(' ');
  return parseFloat(parts[0]) || 0;
}

/**
 * Parse symbol from extended symbol
 * "8,XBTC" -> { symbol: "XBTC", precision: 8 }
 */
export function parseExtendedSymbol(sym: string): { symbol: string; precision: number } {
  const [precision, symbol] = sym.split(',');
  return {
    symbol: symbol || '',
    precision: parseInt(precision) || 0,
  };
}

/**
 * Format number with precision
 */
export function formatAsset(amount: number, symbol: string, precision: number): string {
  return `${amount.toFixed(precision)} ${symbol}`;
}
