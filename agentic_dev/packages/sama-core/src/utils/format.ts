/**
 * String and formatting utilities
 */

/**
 * Parse asset string like "123.4567 XPR" into amount and symbol
 */
export function parseAsset(assetStr: string): { amount: number; symbol: string } {
  const parts = assetStr.trim().split(' ');
  if (parts.length !== 2) {
    throw new Error(`Invalid asset format: ${assetStr}`);
  }
  return {
    amount: parseFloat(parts[0]),
    symbol: parts[1]
  };
}

/**
 * Format asset with symbol
 */
export function formatAsset(amount: number, symbol: string, precision?: number): string {
  const decimals = precision ?? getDefaultPrecision(symbol);
  return `${amount.toFixed(decimals)} ${symbol}`;
}

/**
 * Get default precision for known symbols
 */
export function getDefaultPrecision(symbol: string): number {
  const precisions: Record<string, number> = {
    'XPR': 4,
    'XBTC': 8,
    'XETH': 8,
    'XUSDC': 6,
    'XUSDT': 6,
    'XMD': 6,
    'XMT': 4,
    'LOAN': 4,
    'XDOGE': 6,
    'XLTC': 8,
    'XXRP': 6,
    'XSOL': 9,
    'XHBAR': 8,
    'XADA': 6,
    'XXLM': 6,
  };
  return precisions[symbol] ?? 4;
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Truncate account name for display
 */
export function truncateAccount(account: string, chars = 4): string {
  if (account.length <= chars * 2 + 2) return account;
  return `${account.slice(0, chars)}..${account.slice(-chars)}`;
}

/**
 * Format timestamp to ISO string
 */
export function formatTimestamp(timestamp: number | string | Date): string {
  const date = new Date(timestamp);
  return date.toISOString();
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: number | string | Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return `${diffSec} seconds ago`;
  if (diffMin < 60) return `${diffMin} minutes ago`;
  if (diffHour < 24) return `${diffHour} hours ago`;
  if (diffDay < 30) return `${diffDay} days ago`;
  return date.toLocaleDateString();
}

/**
 * Slugify string for URLs
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
