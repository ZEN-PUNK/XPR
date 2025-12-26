/**
 * Oracle Feed Index Mapping
 * 
 * SINGLE SOURCE OF TRUTH
 * Synced from: /home/misha/SAMA_portal/ai-agent/config.py::ORACLE_FEED_INDEXES
 * Last synced: 2024-12-26
 * 
 * These indices are from lending.loan::markets.oracle_feed_index
 * and correspond to oracles::data.feed_index
 */

/**
 * Token symbol to oracle feed index mapping
 */
export const ORACLE_FEED_INDEXES: Record<string, number> = {
  // Primary tokens
  XPR: 3,      // Proton native
  XBTC: 4,     // Wrapped Bitcoin
  XUSDC: 5,    // USD Coin
  XMT: 6,      // Metal token
  XETH: 7,     // Wrapped Ethereum
  XDOGE: 8,    // Dogecoin
  XUSDT: 9,    // Tether USD
  
  // Legacy/Deprecated
  XUST: 10,    // TerraUSD (deprecated)
  XLUNA: 11,   // Luna (deprecated)
  
  // Stablecoins
  XMD: 12,     // Metal Dollar
  
  // Additional tokens
  XLTC: 16,    // Litecoin
  XXRP: 18,    // Ripple
  XSOL: 19,    // Solana
  XHBAR: 21,   // Hedera
  XADA: 22,    // Cardano
  XXLM: 23,    // Stellar
};

/**
 * Oracle feed index to [symbol, precision] mapping
 * Used for reverse lookup when reading oracle data
 */
export const ORACLE_FEED_MAP: Record<number, [string, number]> = {
  3: ['XPR', 4],
  4: ['XBTC', 8],
  5: ['XUSDC', 6],
  6: ['XMT', 6],
  7: ['XETH', 8],
  8: ['XDOGE', 6],
  9: ['XUSDT', 6],
  10: ['XUST', 6],
  11: ['XLUNA', 6],
  12: ['XMD', 6],
  16: ['XLTC', 8],
  18: ['XXRP', 6],
  19: ['XSOL', 6],
  21: ['XHBAR', 6],
  22: ['XADA', 6],
  23: ['XXLM', 6],
};

/**
 * Stablecoin symbols that are pegged to $1 USD
 */
export const STABLECOINS = ['XUSDC', 'XUSDT', 'XMD'] as const;

/**
 * Deprecated tokens (not actively traded/used)
 */
export const DEPRECATED_TOKENS = ['XUST', 'XLUNA'] as const;

/**
 * Get oracle feed index for a token symbol
 */
export function getOracleFeedIndex(symbol: string): number | undefined {
  return ORACLE_FEED_INDEXES[symbol.toUpperCase()];
}

/**
 * Get token symbol and precision from oracle feed index
 */
export function getTokenFromFeedIndex(feedIndex: number): [string, number] | undefined {
  return ORACLE_FEED_MAP[feedIndex];
}

/**
 * Check if a token is a stablecoin
 */
export function isStablecoin(symbol: string): boolean {
  return STABLECOINS.includes(symbol.toUpperCase() as any);
}
