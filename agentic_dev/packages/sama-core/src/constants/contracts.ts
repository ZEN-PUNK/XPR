/**
 * Contract Addresses and Configuration
 * 
 * Proton Mainnet contract addresses
 */

/**
 * Proton API endpoints
 */
export const PROTON_ENDPOINTS = {
  PRIMARY: 'https://proton.eosusa.io',
  BACKUP: 'https://api.protonnz.com',
  TESTNET: 'https://proton-testnet.eosusa.io',
};

/**
 * Core contract addresses
 */
export const CONTRACTS = {
  // Lending protocol
  LENDING: 'lending.loan',
  SHARES: 'shares.loan',
  
  // Oracle
  ORACLE: 'oracles',
  
  // DEX
  SWAPS: 'proton.swaps',
  
  // Token contracts
  XTOKENS: 'xtokens',
  EOSIO_TOKEN: 'eosio.token',
  XMD_TOKEN: 'xmd.token',
  
  // NFT
  ATOMICASSETS: 'atomicassets',
  
  // System
  SYSTEM: 'eosio',
};

/**
 * SAMA Protocol specific contracts
 */
export const SAMA_CONTRACTS = {
  PROTECTION: 'sama.protct',  // Protection layer
  ORACLE: 'samaoracle',       // SAMA oracle
  TOKEN: 'sama.token',        // SAMA token
};

/**
 * Table names for key contracts
 */
export const TABLES = {
  LENDING: {
    MARKETS: 'markets',
    SHARES: 'shares',
    BORROWS: 'borrows',
    GLOBALS: 'globalscfg',
    REWARDS: 'rewards',
    REWARDS_CFG: 'rewardscfg',
  },
  ORACLE: {
    DATA: 'data',
    FEEDS: 'feeds',
  },
  SWAPS: {
    POOLS: 'pools',
    SETTINGS: 'settings',
  },
  TOKEN: {
    ACCOUNTS: 'accounts',
    STAT: 'stat',
  },
};

/**
 * Get API endpoint with fallback
 */
export function getProtonEndpoint(preferBackup = false): string {
  return preferBackup ? PROTON_ENDPOINTS.BACKUP : PROTON_ENDPOINTS.PRIMARY;
}
