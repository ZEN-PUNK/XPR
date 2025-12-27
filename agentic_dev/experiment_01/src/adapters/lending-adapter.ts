/**
 * SAMA Protocol Lending Adapter
 * 
 * Fetches data from MetalX Lending Protocol on Proton blockchain
 * 
 * SINGLE SOURCE OF TRUTH: /home/misha/SAMA_portal/ai-agent/config.py
 * This file mirrors the AMAS bot configuration. Keep in sync!
 * 
 * Reference implementations:
 * - Exchange rates: backend/src/services/amas-scanner.service.ts
 * - Rescue calculations: backend/src/routes/rescue-market.routes.ts
 * 
 * Key tables:
 * - markets: market config (collateral_factor, borrow_index, etc)
 * - shares: user collateral positions (L-tokens)
 * - borrows: user debt positions
 */

const PROTON_API = 'https://proton.eosusa.io';
const LENDING_CONTRACT = 'lending.loan';
const ORACLE_CONTRACT = 'oracles';

/**
 * ORACLE FEED INDEX MAPPING
 * Source: SAMA_portal/ai-agent/config.py::ORACLE_FEED_INDEXES
 * Last synced: 2024-12-26
 * 
 * These are read from lending.loan::markets.oracle_feed_index on-chain
 * Format: feed_index => [symbol, precision]
 */
const ORACLE_FEED_MAP: Record<number, [string, number]> = {
  3: ['XPR', 4],      // XPR/USD
  4: ['XBTC', 8],     // BTC/USD
  5: ['XUSDC', 6],    // USDC/USD (stablecoin)
  6: ['XMT', 6],      // MTL/USD  
  7: ['XETH', 8],     // ETH/USD
  8: ['XDOGE', 6],    // DOGE/USD
  9: ['XUSDT', 6],    // USDT/USD (stablecoin)
  10: ['XUST', 6],    // UST/USD (deprecated)
  11: ['XLUNA', 6],   // LUNA/USD (deprecated)
  12: ['XMD', 6],     // XMD/USD (stablecoin)
  16: ['XLTC', 8],    // LTC/USD
  18: ['XXRP', 6],    // XRP/USD
  19: ['XSOL', 6],    // SOL/USD
  21: ['XHBAR', 6],   // HBAR/USD
  22: ['XADA', 6],    // ADA/USD
  23: ['XXLM', 6],    // XLM/USD
};

// Simple cache
let pricesCache: Record<string, number> | null = null;
let marketsCache: Map<string, any> | null = null;
let exchangeRatesCache: Record<string, number> | null = null;

// Token contracts
const SHARES_CONTRACT = 'shares.loan';
const XTOKENS_CONTRACT = 'xtokens';
const EOSIO_TOKEN = 'eosio.token';
const XMD_TOKEN = 'xmd.token';

/**
 * Fetch table rows from Proton blockchain
 */
async function getTable(contract: string, table: string, scope?: string, limit = 100): Promise<any[]> {
  const response = await fetch(`${PROTON_API}/v1/chain/get_table_rows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: contract,
      table: table,
      scope: scope || contract,
      limit: limit,
      json: true,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json() as { rows?: any[] };
  return data.rows || [];
}

/**
 * Load prices from oracle
 */
async function loadPrices(): Promise<Record<string, number>> {
  if (pricesCache) return pricesCache;
  
  const rows = await getTable(ORACLE_CONTRACT, 'data', ORACLE_CONTRACT, 50);
  const prices: Record<string, number> = {};
  
  for (const row of rows) {
    const feedIndex = row.feed_index;
    if (ORACLE_FEED_MAP[feedIndex]) {
      const [symbol] = ORACLE_FEED_MAP[feedIndex];
      prices[symbol] = row.aggregate?.d_double || 0;
    }
  }
  
  // Stablecoins always $1
  prices['XUSDC'] = 1.0;
  prices['XUSDT'] = 1.0;
  prices['XMD'] = 1.0;
  
  pricesCache = prices;
  return prices;
}

/**
 * Load markets configuration
 */
async function loadMarkets(): Promise<Map<string, any>> {
  if (marketsCache) return marketsCache;
  
  const rows = await getTable(LENDING_CONTRACT, 'markets');
  const markets = new Map<string, any>();
  
  for (const m of rows) {
    const lSymbol = (m.share_symbol?.sym || '').split(',')[1] || '';
    const underlying = (m.underlying_symbol?.sym || '').split(',')[1] || '';
    const underlyingContract = m.underlying_symbol?.contract || '';
    
    // Parse total_variable_borrows and total_reserves
    const totalBorrowsQty = parseFloat((m.total_variable_borrows?.quantity || '0').split(' ')[0]) || 0;
    const totalReservesQty = parseFloat((m.total_reserves?.quantity || '0').split(' ')[0]) || 0;
    
    markets.set(lSymbol, {
      l_symbol: lSymbol,
      underlying: underlying,
      underlying_contract: underlyingContract,
      collateral_factor: parseFloat(m.collateral_factor) || 0,
      borrow_index: parseFloat(m.borrow_index) || 1,
      oracle_feed_index: m.oracle_feed_index,
      total_borrows: totalBorrowsQty,
      total_reserves: totalReservesQty,
    });
  }
  
  marketsCache = markets;
  return markets;
}

/**
 * Load exchange rates for L-tokens to underlying conversion
 * 
 * FORMULA (from amas-scanner.service.ts line ~345):
 *   exchangeRate = (underlyingBalance + totalBorrows - reserves) / totalShares
 * 
 * This converts L-tokens (shares) to underlying token amounts.
 * Example: If exchangeRate = 1.05, then 100 LBTC = 105 XBTC
 */
async function loadExchangeRates(): Promise<Record<string, number>> {
  if (exchangeRatesCache) return exchangeRatesCache;
  
  const markets = await loadMarkets();
  const rates: Record<string, number> = {};
  
  // Get L-token total supplies from shares.loan stat tables
  const lTokenSupplies: Record<string, number> = {};
  for (const [lSymbol] of markets) {
    try {
      const statRows = await getTable(SHARES_CONTRACT, 'stat', lSymbol, 1);
      if (statRows.length > 0) {
        const supply = parseFloat((statRows[0].supply || '0').split(' ')[0]) || 0;
        lTokenSupplies[lSymbol] = supply;
      }
    } catch {
      lTokenSupplies[lSymbol] = 0;
    }
  }
  
  // Get underlying token balances (cash) held by lending.loan
  const cashBalances: Record<string, number> = {};
  
  // Query each token contract for lending.loan balance
  const tokenContracts = [XTOKENS_CONTRACT, EOSIO_TOKEN, XMD_TOKEN];
  for (const contract of tokenContracts) {
    try {
      const balanceRows = await getTable(contract, 'accounts', LENDING_CONTRACT, 50);
      for (const row of balanceRows) {
        const [amount, symbol] = (row.balance || '0 UNKNOWN').split(' ');
        cashBalances[symbol] = parseFloat(amount) || 0;
      }
    } catch {
      // Ignore errors
    }
  }
  
  // Calculate exchange rate for each market
  for (const [lSymbol, market] of markets) {
    const underlying = market.underlying;
    const totalCash = cashBalances[underlying] || 0;
    const totalBorrows = market.total_borrows || 0;
    const totalReserves = market.total_reserves || 0;
    const totalLTokens = lTokenSupplies[lSymbol] || 1;
    
    // Exchange Rate = (cash + borrows - reserves) / lTokens
    // If no L-tokens exist, rate is 1:1
    if (totalLTokens > 0) {
      rates[lSymbol] = (totalCash + totalBorrows - totalReserves) / totalLTokens;
    } else {
      rates[lSymbol] = 1.0;
    }
  }
  
  exchangeRatesCache = rates;
  return rates;
}

/**
 * Get all lending markets
 */
export async function getLendingMarkets(): Promise<any> {
  const prices = await loadPrices();
  const rows = await getTable(LENDING_CONTRACT, 'markets');
  
  const result = rows.map((m: any) => {
    const symParts = (m.underlying_symbol?.sym || '').split(',');
    const symbol = symParts[1] || '';
    
    const totalBorrows = m.total_variable_borrows?.quantity || '0';
    const borrowQty = parseFloat(totalBorrows.split(' ')[0]);
    
    const price = prices[symbol] || 0;
    
    return {
      symbol,
      l_symbol: (m.share_symbol?.sym || '').split(',')[1] || '',
      total_borrows: borrowQty,
      total_borrows_usd: borrowQty * price,
      collateral_factor: parseFloat(m.collateral_factor) || 0,
      price_usd: price,
    };
  });
  
  return {
    markets: result,
    count: result.length,
    total_borrows_usd: result.reduce((sum: number, m: any) => sum + m.total_borrows_usd, 0),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get oracle prices
 */
export async function getOraclePrices(symbols?: string[]): Promise<any> {
  const prices = await loadPrices();
  
  let priceList = Object.entries(prices).map(([symbol, price]) => ({
    symbol,
    price_usd: price,
  }));
  
  if (symbols && symbols.length > 0) {
    priceList = priceList.filter(p => symbols.includes(p.symbol));
  }
  
  return {
    prices: priceList,
    count: priceList.length,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get liquidatable positions (HF < 1.0)
 */
export async function getLiquidatablePositions(minProfitUsd: number = 0.5): Promise<any> {
  const prices = await loadPrices();
  const markets = await loadMarkets();
  const exchangeRates = await loadExchangeRates();
  
  // Fetch borrows and shares
  const [borrowsRows, sharesRows] = await Promise.all([
    getTable(LENDING_CONTRACT, 'borrows', LENDING_CONTRACT, 500),
    getTable(LENDING_CONTRACT, 'shares', LENDING_CONTRACT, 500),
  ]);
  
  // Build lookup maps
  const borrowsMap = new Map<string, any[]>();
  for (const row of borrowsRows) {
    borrowsMap.set(row.account, row.tokens || []);
  }
  
  const sharesMap = new Map<string, any[]>();
  for (const row of sharesRows) {
    sharesMap.set(row.account, row.tokens || []);
  }
  
  // Get all unique accounts
  const allAccounts = new Set([...borrowsMap.keys(), ...sharesMap.keys()]);
  
  const liquidatable: any[] = [];
  
  for (const account of allAccounts) {
    const borrowTokens = borrowsMap.get(account) || [];
    const shareTokens = sharesMap.get(account) || [];
    
    // Calculate collateral USD (from shares)
    // Collateral = shares * exchangeRate * price
    let collateralUsd = 0;
    let effectiveCollateralUsd = 0;
    const collaterals: any[] = [];
    
    for (const t of shareTokens) {
      const symParts = (t.key?.sym || '').split(',');
      const lSymbol = symParts[1] || '';
      const precision = parseInt(symParts[0]) || 0;
      const shares = t.value || 0;
      
      if (shares <= 0) continue;
      
      const market = markets.get(lSymbol);
      if (!market) continue;
      
      // Convert shares to underlying using exchange rate
      const sharesAmount = shares / Math.pow(10, precision);
      const exchangeRate = exchangeRates[lSymbol] || 1.0;
      const underlyingAmount = sharesAmount * exchangeRate;
      
      const price = prices[market.underlying] || 0;
      const valueUsd = underlyingAmount * price;
      const effectiveValue = valueUsd * market.collateral_factor;
      
      collateralUsd += valueUsd;
      effectiveCollateralUsd += effectiveValue;
      
      collaterals.push({
        l_symbol: lSymbol,
        underlying: market.underlying,
        amount: Math.round(underlyingAmount * 10000) / 10000,
        value_usd: Math.round(valueUsd * 100) / 100,
      });
    }
    
    // Calculate debt USD (from borrows)
    let debtUsd = 0;
    const debts: any[] = [];
    
    for (const t of borrowTokens) {
      const symParts = (t.key?.sym || '').split(',');
      const symbol = symParts[1] || '';
      const precision = parseInt(symParts[0]) || 0;
      const principal = t.value?.variable_principal || 0;
      
      if (principal <= 0) continue;
      
      // Find market by underlying symbol
      let market: any = null;
      for (const [_, m] of markets) {
        if (m.underlying === symbol) {
          market = m;
          break;
        }
      }
      
      if (!market) continue;
      
      const rawAmount = principal / Math.pow(10, precision);
      const amount = rawAmount * market.borrow_index;
      const price = prices[symbol] || 0;
      const valueUsd = amount * price;
      
      debtUsd += valueUsd;
      
      debts.push({
        symbol,
        amount: Math.round(amount * 10000) / 10000,
        value_usd: Math.round(valueUsd * 100) / 100,
      });
    }
    
    // Skip accounts with no debt
    if (debtUsd <= 0) continue;
    
    // Health factor = effective collateral / debt
    const hf = effectiveCollateralUsd / debtUsd;
    
    if (hf < 1.0) {
      // 10% close factor, 10% liquidation incentive
      const maxRepay = debtUsd * 0.10;
      const profit = maxRepay * 0.10;
      
      if (profit >= minProfitUsd) {
        liquidatable.push({
          account,
          health_factor: Math.round(hf * 10000) / 10000,
          collateral_usd: Math.round(collateralUsd * 100) / 100,
          effective_collateral_usd: Math.round(effectiveCollateralUsd * 100) / 100,
          debt_usd: Math.round(debtUsd * 100) / 100,
          max_repay_usd: Math.round(maxRepay * 100) / 100,
          potential_profit_usd: Math.round(profit * 100) / 100,
          debts,
          collaterals,
        });
      }
    }
  }
  
  // Sort by profit descending
  liquidatable.sort((a, b) => b.potential_profit_usd - a.potential_profit_usd);
  
  return {
    positions: liquidatable,
    count: liquidatable.length,
    total_profit_available: Math.round(liquidatable.reduce((sum, p) => sum + p.potential_profit_usd, 0) * 100) / 100,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get at-risk positions (1.0 <= HF < threshold)
 */
export async function getAtRiskPositions(hfThreshold: number = 1.1): Promise<any> {
  const prices = await loadPrices();
  const markets = await loadMarkets();
  const exchangeRates = await loadExchangeRates();
  
  const [borrowsRows, sharesRows] = await Promise.all([
    getTable(LENDING_CONTRACT, 'borrows', LENDING_CONTRACT, 500),
    getTable(LENDING_CONTRACT, 'shares', LENDING_CONTRACT, 500),
  ]);
  
  const borrowsMap = new Map<string, any[]>();
  for (const row of borrowsRows) {
    borrowsMap.set(row.account, row.tokens || []);
  }
  
  const sharesMap = new Map<string, any[]>();
  for (const row of sharesRows) {
    sharesMap.set(row.account, row.tokens || []);
  }
  
  const allAccounts = new Set([...borrowsMap.keys(), ...sharesMap.keys()]);
  const atRisk: any[] = [];
  
  for (const account of allAccounts) {
    const borrowTokens = borrowsMap.get(account) || [];
    const shareTokens = sharesMap.get(account) || [];
    
    let effectiveCollateralUsd = 0;
    
    for (const t of shareTokens) {
      const symParts = (t.key?.sym || '').split(',');
      const lSymbol = symParts[1] || '';
      const precision = parseInt(symParts[0]) || 0;
      const shares = t.value || 0;
      if (shares <= 0) continue;
      
      const market = markets.get(lSymbol);
      if (!market) continue;
      
      // Apply exchange rate
      const sharesAmount = shares / Math.pow(10, precision);
      const exchangeRate = exchangeRates[lSymbol] || 1.0;
      const underlyingAmount = sharesAmount * exchangeRate;
      
      const price = prices[market.underlying] || 0;
      effectiveCollateralUsd += underlyingAmount * price * market.collateral_factor;
    }
    
    let debtUsd = 0;
    for (const t of borrowTokens) {
      const symParts = (t.key?.sym || '').split(',');
      const symbol = symParts[1] || '';
      const precision = parseInt(symParts[0]) || 0;
      const principal = t.value?.variable_principal || 0;
      if (principal <= 0) continue;
      
      let market: any = null;
      for (const [_, m] of markets) {
        if (m.underlying === symbol) { market = m; break; }
      }
      if (!market) continue;
      
      const rawAmount = principal / Math.pow(10, precision);
      debtUsd += rawAmount * market.borrow_index * (prices[symbol] || 0);
    }
    
    if (debtUsd <= 0) continue;
    
    const hf = effectiveCollateralUsd / debtUsd;
    
    if (hf >= 1.0 && hf < hfThreshold) {
      atRisk.push({
        account,
        health_factor: Math.round(hf * 10000) / 10000,
        effective_collateral_usd: Math.round(effectiveCollateralUsd * 100) / 100,
        debt_usd: Math.round(debtUsd * 100) / 100,
        distance_to_liquidation_pct: Math.round((hf - 1.0) * 10000) / 100,
      });
    }
  }
  
  atRisk.sort((a, b) => a.health_factor - b.health_factor);
  
  return {
    positions: atRisk,
    count: atRisk.length,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get lending position for specific account
 */
export async function getLendingPosition(accountName: string): Promise<any> {
  const prices = await loadPrices();
  const markets = await loadMarkets();
  const exchangeRates = await loadExchangeRates();
  
  const [borrowsRows, sharesRows] = await Promise.all([
    getTable(LENDING_CONTRACT, 'borrows', LENDING_CONTRACT, 1000),
    getTable(LENDING_CONTRACT, 'shares', LENDING_CONTRACT, 1000),
  ]);
  
  const borrowRow = borrowsRows.find((r: any) => r.account === accountName);
  const shareRow = sharesRows.find((r: any) => r.account === accountName);
  
  if (!borrowRow && !shareRow) {
    return {
      account: accountName,
      has_position: false,
      message: 'No lending position found',
    };
  }
  
  const borrowTokens = borrowRow?.tokens || [];
  const shareTokens = shareRow?.tokens || [];
  
  // Calculate collaterals with exchange rate
  const collaterals: any[] = [];
  let totalCollateralUsd = 0;
  let effectiveCollateralUsd = 0;
  
  for (const t of shareTokens) {
    const symParts = (t.key?.sym || '').split(',');
    const lSymbol = symParts[1] || '';
    const precision = parseInt(symParts[0]) || 0;
    const shares = t.value || 0;
    if (shares <= 0) continue;
    
    const market = markets.get(lSymbol);
    if (!market) continue;
    
    // Convert shares to underlying amount using exchange rate
    const sharesAmount = shares / Math.pow(10, precision);
    const exchangeRate = exchangeRates[lSymbol] || 1.0;
    const underlyingAmount = sharesAmount * exchangeRate;
    
    const price = prices[market.underlying] || 0;
    const valueUsd = underlyingAmount * price;
    
    totalCollateralUsd += valueUsd;
    effectiveCollateralUsd += valueUsd * market.collateral_factor;
    
    collaterals.push({
      l_symbol: lSymbol,
      underlying: market.underlying,
      amount: Math.round(underlyingAmount * 10000) / 10000,
      price_usd: price,
      value_usd: Math.round(valueUsd * 100) / 100,
      collateral_factor: market.collateral_factor,
    });
  }
  
  // Calculate debts
  const debts: any[] = [];
  let totalDebtUsd = 0;
  
  for (const t of borrowTokens) {
    const symParts = (t.key?.sym || '').split(',');
    const symbol = symParts[1] || '';
    const precision = parseInt(symParts[0]) || 0;
    const principal = t.value?.variable_principal || 0;
    if (principal <= 0) continue;
    
    let market: any = null;
    for (const [_, m] of markets) {
      if (m.underlying === symbol) { market = m; break; }
    }
    if (!market) continue;
    
    const rawAmount = principal / Math.pow(10, precision);
    const amount = rawAmount * market.borrow_index;
    const price = prices[symbol] || 0;
    const valueUsd = amount * price;
    
    totalDebtUsd += valueUsd;
    
    debts.push({
      symbol,
      principal: Math.round(rawAmount * 10000) / 10000,
      amount: Math.round(amount * 10000) / 10000,
      borrow_index: market.borrow_index,
      price_usd: price,
      value_usd: Math.round(valueUsd * 100) / 100,
    });
  }
  
  const healthFactor = totalDebtUsd > 0 ? effectiveCollateralUsd / totalDebtUsd : 999;
  
  return {
    account: accountName,
    has_position: true,
    has_debt: totalDebtUsd > 0,
    collaterals,
    debts,
    total_collateral_usd: Math.round(totalCollateralUsd * 100) / 100,
    effective_collateral_usd: Math.round(effectiveCollateralUsd * 100) / 100,
    total_debt_usd: Math.round(totalDebtUsd * 100) / 100,
    health_factor: Math.round(healthFactor * 10000) / 10000,
    is_liquidatable: healthFactor < 1.0,
    is_at_risk: healthFactor < 1.1,
    timestamp: new Date().toISOString(),
  };
}
