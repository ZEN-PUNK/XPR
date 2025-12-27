/**
 * Math Utilities for SAMA Protocol
 */

/**
 * Round to specified decimal places
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Format USD value
 */
export function formatUsd(value: number, decimals = 2): string {
  return `$${value.toLocaleString('en-US', { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals 
  })}`;
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Convert raw integer to decimal based on precision
 */
export function fromRaw(raw: number | string, precision: number): number {
  const value = typeof raw === 'string' ? parseInt(raw) : raw;
  return value / Math.pow(10, precision);
}

/**
 * Convert decimal to raw integer based on precision
 */
export function toRaw(value: number, precision: number): number {
  return Math.round(value * Math.pow(10, precision));
}

/**
 * Calculate exchange rate from pool reserves
 * exchangeRate = (cash + borrows - reserves) / totalShares
 */
export function calculateExchangeRate(
  totalCash: number,
  totalBorrows: number,
  totalReserves: number,
  totalShares: number
): number {
  if (totalShares <= 0) return 1;
  const numerator = totalCash + totalBorrows - totalReserves;
  if (numerator <= 0) return 1;
  return numerator / totalShares;
}

/**
 * Calculate health factor
 */
export function calculateHealthFactor(
  effectiveCollateral: number,
  totalDebt: number
): number {
  if (totalDebt <= 0) return 999;
  return effectiveCollateral / totalDebt;
}

/**
 * Calculate effective collateral (after applying collateral factor)
 */
export function calculateEffectiveCollateral(
  collateralValue: number,
  collateralFactor: number
): number {
  return collateralValue * collateralFactor;
}

/**
 * Calculate current borrow amount with accrued interest
 */
export function calculateBorrowAmount(
  principal: number,
  userBorrowIndex: number,
  marketBorrowIndex: number
): number {
  if (userBorrowIndex <= 0) return principal;
  return principal * (marketBorrowIndex / userBorrowIndex);
}

/**
 * Safe division (returns default if denominator is 0)
 */
export function safeDivide(
  numerator: number,
  denominator: number,
  defaultValue = 0
): number {
  if (denominator === 0) return defaultValue;
  return numerator / denominator;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate percentage change
 */
export function percentChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  return (newValue - oldValue) / oldValue;
}
