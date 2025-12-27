/**
 * Lending Protocol Types
 */

import { ExtendedSymbol, ExtendedAsset } from './common';

/**
 * Lending market configuration
 */
export interface LendingMarket {
  lSymbol: string;           // Share token symbol (e.g., "LBTC")
  underlying: string;        // Underlying token (e.g., "XBTC")
  underlyingContract: string;
  collateralFactor: number;  // 0-1 (e.g., 0.70 = 70%)
  borrowIndex: number;       // Current borrow index
  oracleFeedIndex: number;
  totalBorrows: number;
  totalReserves: number;
  totalCash?: number;        // Underlying balance in contract
  totalLTokens?: number;     // Total L-token supply
  exchangeRate?: number;     // L-token to underlying ratio
}

/**
 * User collateral position
 */
export interface Collateral {
  lSymbol: string;           // L-token symbol
  underlying: string;        // Underlying symbol
  shares: number;            // Raw L-token amount
  underlyingAmount: number;  // After exchange rate conversion
  priceUsd: number;
  valueUsd: number;
  effectiveValue: number;    // After collateral factor
  collateralFactor: number;
}

/**
 * User debt position
 */
export interface Debt {
  symbol: string;
  principal: number;         // Original borrow amount
  amount: number;            // Current amount with interest
  borrowIndex: number;
  priceUsd: number;
  valueUsd: number;
}

/**
 * Complete lending position for an account
 */
export interface LendingPosition {
  account: string;
  hasPosition: boolean;
  hasDebt: boolean;
  
  collaterals: Collateral[];
  debts: Debt[];
  
  totalCollateralUsd: number;
  effectiveCollateralUsd: number;  // After CF applied
  totalDebtUsd: number;
  
  healthFactor: number;
  isLiquidatable: boolean;    // HF < 1.0
  isAtRisk: boolean;          // HF < 1.1
  
  timestamp: string;
}

/**
 * Liquidation opportunity
 */
export interface LiquidationOpportunity {
  account: string;
  healthFactor: number;
  totalDebtUsd: number;
  totalCollateralUsd: number;
  effectiveCollateralUsd: number;
  
  /** Max amount that can be liquidated (10% of debt) */
  maxLiquidationUsd: number;
  
  /** Estimated profit from liquidation bonus (10%) */
  estimatedProfitUsd: number;
  
  /** Best collateral to seize */
  bestCollateral?: {
    symbol: string;
    valueUsd: number;
  };
  
  /** Best debt to repay */
  bestDebt?: {
    symbol: string;
    valueUsd: number;
  };
}

/**
 * Raw market row from blockchain
 */
export interface RawMarketRow {
  share_symbol: ExtendedSymbol;
  underlying_symbol: ExtendedSymbol;
  collateral_factor: string;
  reserve_factor: string;
  borrow_index: string;
  oracle_feed_index: number;
  total_variable_borrows: ExtendedAsset;
  total_stable_borrows: ExtendedAsset;
  total_reserves: ExtendedAsset;
  variable_accrual_time: string;
}

/**
 * Raw shares row from blockchain
 */
export interface RawSharesRow {
  account: string;
  tokens: Array<{
    key: ExtendedSymbol;
    value: number;
  }>;
}

/**
 * Raw borrows row from blockchain
 */
export interface RawBorrowsRow {
  account: string;
  tokens: Array<{
    key: ExtendedSymbol;
    value: {
      variable_principal: number;
      variable_interest_index: string;
      stable_principal: number;
      last_stable_update: string;
      stable_rate: string;
    };
  }>;
}

/**
 * Calculate health factor
 */
export function calculateHealthFactor(
  effectiveCollateralUsd: number,
  totalDebtUsd: number
): number {
  if (totalDebtUsd <= 0) return 999;
  return effectiveCollateralUsd / totalDebtUsd;
}

/**
 * Calculate max liquidation amount
 */
export function calculateMaxLiquidation(
  totalDebtUsd: number,
  closeFactor: number = 0.10
): number {
  return totalDebtUsd * closeFactor;
}

/**
 * Calculate liquidation profit
 */
export function calculateLiquidationProfit(
  repayAmount: number,
  liquidationIncentive: number = 0.10
): number {
  return repayAmount * liquidationIncentive;
}
