/**
 * DEX/Swaps Types
 */

import { ExtendedSymbol, ExtendedAsset } from './common';

/**
 * Liquidity pool
 */
export interface SwapPool {
  id: number;
  tokenA: {
    symbol: string;
    contract: string;
    reserve: number;
  };
  tokenB: {
    symbol: string;
    contract: string;
    reserve: number;
  };
  fee: number;           // Fee in basis points (e.g., 30 = 0.30%)
  totalLpTokens: number;
  
  // Calculated fields
  priceAtoB?: number;
  priceBtoA?: number;
  tvlUsd?: number;
}

/**
 * Liquidity position
 */
export interface LiquidityPosition {
  account: string;
  poolId: number;
  lpTokens: number;
  sharePercent: number;
  
  tokenAAmount: number;
  tokenBAmount: number;
  
  valueUsd: number;
}

/**
 * Swap route
 */
export interface SwapRoute {
  steps: SwapStep[];
  inputToken: string;
  outputToken: string;
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
  totalFee: number;
}

/**
 * Single swap step
 */
export interface SwapStep {
  poolId: number;
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  amountOut: number;
  fee: number;
}

/**
 * Swap quote
 */
export interface SwapQuote {
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  amountOut: number;
  priceImpact: number;
  fee: number;
  route: SwapRoute;
  expiresAt: Date;
}

/**
 * DCA (Dollar Cost Average) schedule
 */
export interface DCASchedule {
  id: string;
  account: string;
  tokenIn: string;
  tokenOut: string;
  totalAmount: number;
  amountPerTranche: number;
  tranches: number;
  interval: 'hourly' | 'daily' | 'weekly';
  executedTranches: number;
  nextExecution: Date;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
}

/**
 * Raw pool row from blockchain
 */
export interface RawPoolRow {
  id: number;
  token1: ExtendedAsset;
  token2: ExtendedAsset;
  fee: number;
  total_lp_tokens: string;
}

/**
 * Calculate swap output using constant product formula
 * x * y = k
 */
export function calculateSwapOutput(
  amountIn: number,
  reserveIn: number,
  reserveOut: number,
  feeBps: number = 30
): { amountOut: number; priceImpact: number } {
  const feeMultiplier = (10000 - feeBps) / 10000;
  const amountInWithFee = amountIn * feeMultiplier;
  
  const amountOut = (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee);
  
  // Price impact = 1 - (actual_rate / spot_rate)
  const spotRate = reserveOut / reserveIn;
  const actualRate = amountOut / amountIn;
  const priceImpact = 1 - (actualRate / spotRate);
  
  return { amountOut, priceImpact };
}

/**
 * Calculate required input for desired output
 */
export function calculateSwapInput(
  amountOut: number,
  reserveIn: number,
  reserveOut: number,
  feeBps: number = 30
): number {
  const feeMultiplier = (10000 - feeBps) / 10000;
  const numerator = reserveIn * amountOut;
  const denominator = (reserveOut - amountOut) * feeMultiplier;
  return numerator / denominator;
}

/**
 * Calculate LP tokens for adding liquidity
 */
export function calculateLpTokens(
  amountA: number,
  amountB: number,
  reserveA: number,
  reserveB: number,
  totalLpTokens: number
): number {
  if (totalLpTokens === 0) {
    // Initial liquidity
    return Math.sqrt(amountA * amountB);
  }
  
  // Use minimum ratio to prevent front-running
  const lpFromA = (amountA * totalLpTokens) / reserveA;
  const lpFromB = (amountB * totalLpTokens) / reserveB;
  return Math.min(lpFromA, lpFromB);
}
