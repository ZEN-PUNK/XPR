/**
 * Market Configuration Constants
 * 
 * SINGLE SOURCE OF TRUTH
 * Synced from: /home/misha/SAMA_portal/ai-agent/config.py::COLLATERAL_FACTORS
 * Last synced: 2024-12-26
 * 
 * These values are from lending.loan::markets table
 */

/**
 * Collateral factors by token symbol
 * Determines max borrowing power: borrow_limit = collateral_value * CF
 */
export const COLLATERAL_FACTORS: Record<string, number> = {
  // Tier 1: Major assets (70%+)
  XBTC: 0.70,
  XETH: 0.70,
  XMD: 0.90,    // Stablecoin, highest CF
  XUSDC: 0.80,  // Stablecoin
  
  // Tier 2: Mid-cap (60%)
  XLTC: 0.60,
  XXRP: 0.60,
  XSOL: 0.60,
  XHBAR: 0.60,
  XADA: 0.60,
  XXLM: 0.60,
  XDOGE: 0.60,
  
  // Tier 3: Higher risk (40-50%)
  XMT: 0.50,
  XPR: 0.40,
  
  // Disabled
  XUSDT: 0.00,  // Disabled as collateral
  XUST: 0.00,   // Deprecated
  XLUNA: 0.00,  // Deprecated
};

/**
 * Token precision (decimals)
 */
export const TOKEN_PRECISION: Record<string, number> = {
  XPR: 4,
  XBTC: 8,
  XETH: 8,
  XLTC: 8,
  XMT: 6,
  XMD: 6,
  XUSDC: 6,
  XUSDT: 6,
  XDOGE: 6,
  XXRP: 6,
  XSOL: 6,
  XHBAR: 6,
  XADA: 6,
  XXLM: 6,
};

/**
 * L-token to underlying mapping
 */
export const LTOKEN_MAP: Record<string, string> = {
  LBTC: 'XBTC',
  LETH: 'XETH',
  LLTC: 'XLTC',
  LXMD: 'XMD',
  LUSDC: 'XUSDC',
  LXPR: 'XPR',
  LXRP: 'XXRP',
  LSOL: 'XSOL',
  LHBAR: 'XHBAR',
  LADA: 'XADA',
  LXLM: 'XXLM',
  LDOGE: 'XDOGE',
  LMT: 'XMT',
};

/**
 * Protocol parameters
 */
export const PROTOCOL_PARAMS = {
  /** Maximum percentage of debt that can be liquidated in one transaction */
  CLOSE_FACTOR: 0.10,  // 10%
  
  /** Bonus liquidators receive on seized collateral */
  LIQUIDATION_INCENTIVE: 0.10,  // 10%
  
  /** Health factor threshold for liquidation */
  LIQUIDATION_THRESHOLD: 1.0,
  
  /** Health factor threshold for "at risk" warning */
  AT_RISK_THRESHOLD: 1.1,
};

/**
 * Get collateral factor for a token
 */
export function getCollateralFactor(symbol: string): number {
  return COLLATERAL_FACTORS[symbol.toUpperCase()] ?? 0;
}

/**
 * Get underlying token from L-token symbol
 */
export function getUnderlyingToken(lToken: string): string | undefined {
  return LTOKEN_MAP[lToken.toUpperCase()];
}

/**
 * Get L-token from underlying symbol
 */
export function getLToken(underlying: string): string | undefined {
  for (const [lToken, underlyingSymbol] of Object.entries(LTOKEN_MAP)) {
    if (underlyingSymbol === underlying.toUpperCase()) {
      return lToken;
    }
  }
  return undefined;
}
