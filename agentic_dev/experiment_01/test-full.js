async function test() {
  const PROTON_API = 'https://proton.eosusa.io';
  const LENDING_CONTRACT = 'lending.loan';
  const ORACLE_CONTRACT = 'oracles';
  
  const ORACLE_FEED_MAP = {
    4: ['XBTC', 8], 6: ['XPR', 4], 7: ['XMT', 6], 11: ['XETH', 8],
    13: ['XXRP', 6], 16: ['XLTC', 8], 17: ['XDOGE', 6], 18: ['XXLM', 6],
    19: ['XHBAR', 6], 20: ['XSOL', 6], 21: ['XMD', 6], 22: ['XADA', 6],
    23: ['XUSDT', 6], 24: ['XUSDC', 6],
  };
  
  async function getTable(contract, table, scope, limit = 100) {
    const response = await fetch(`${PROTON_API}/v1/chain/get_table_rows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: contract, table, scope: scope || contract, limit, json: true }),
    });
    const data = await response.json();
    return data.rows || [];
  }
  
  console.log("1. Fetching prices...");
  const oracleRows = await getTable(ORACLE_CONTRACT, 'data', ORACLE_CONTRACT, 50);
  const prices = {};
  for (const row of oracleRows) {
    if (ORACLE_FEED_MAP[row.feed_index]) {
      prices[ORACLE_FEED_MAP[row.feed_index][0]] = row.aggregate?.d_double || 0;
    }
  }
  prices.XUSDC = prices.XUSDT = prices.XMD = 1.0;
  console.log("   Prices loaded:", Object.keys(prices).length);
  
  console.log("2. Fetching markets...");
  const marketRows = await getTable(LENDING_CONTRACT, 'markets');
  const markets = new Map();
  for (const m of marketRows) {
    const lSymbol = (m.share_symbol?.sym || '').split(',')[1] || '';
    const underlying = (m.underlying_symbol?.sym || '').split(',')[1] || '';
    markets.set(lSymbol, {
      underlying,
      collateral_factor: parseFloat(m.collateral_factor) || 0,
      borrow_index: parseFloat(m.borrow_index) || 1,
    });
  }
  console.log("   Markets loaded:", markets.size);
  
  console.log("3. Fetching borrows & shares (100 each)...");
  const [borrowsRows, sharesRows] = await Promise.all([
    getTable(LENDING_CONTRACT, 'borrows', LENDING_CONTRACT, 100),
    getTable(LENDING_CONTRACT, 'shares', LENDING_CONTRACT, 100),
  ]);
  console.log("   Borrows:", borrowsRows.length, "Shares:", sharesRows.length);
  
  console.log("4. Processing positions...");
  const borrowsMap = new Map();
  for (const row of borrowsRows) borrowsMap.set(row.account, row.tokens || []);
  
  const sharesMap = new Map();
  for (const row of sharesRows) sharesMap.set(row.account, row.tokens || []);
  
  const allAccounts = new Set([...borrowsMap.keys(), ...sharesMap.keys()]);
  console.log("   Unique accounts:", allAccounts.size);
  
  const liquidatable = [];
  
  for (const account of allAccounts) {
    const borrowTokens = borrowsMap.get(account) || [];
    const shareTokens = sharesMap.get(account) || [];
    
    let collateralUsd = 0;
    let effectiveCollateralUsd = 0;
    
    for (const t of shareTokens) {
      const symParts = (t.key?.sym || '').split(',');
      const lSymbol = symParts[1] || '';
      const precision = parseInt(symParts[0]) || 0;
      const shares = t.value || 0;
      if (shares <= 0) continue;
      
      const market = markets.get(lSymbol);
      if (!market) continue;
      
      const amount = shares / Math.pow(10, precision);
      const price = prices[market.underlying] || 0;
      const valueUsd = amount * price;
      collateralUsd += valueUsd;
      effectiveCollateralUsd += valueUsd * market.collateral_factor;
    }
    
    let debtUsd = 0;
    for (const t of borrowTokens) {
      const symParts = (t.key?.sym || '').split(',');
      const symbol = symParts[1] || '';
      const precision = parseInt(symParts[0]) || 0;
      const principal = t.value?.variable_principal || 0;
      if (principal <= 0) continue;
      
      let market = null;
      for (const [_, m] of markets) {
        if (m.underlying === symbol) { market = m; break; }
      }
      if (!market) continue;
      
      const rawAmount = principal / Math.pow(10, precision);
      const amount = rawAmount * market.borrow_index;
      const price = prices[symbol] || 0;
      debtUsd += amount * price;
    }
    
    if (debtUsd <= 0) continue;
    
    const hf = effectiveCollateralUsd / debtUsd;
    if (hf < 1.0) {
      liquidatable.push({ account, hf: hf.toFixed(4), collateral: collateralUsd.toFixed(2), debt: debtUsd.toFixed(2) });
    }
  }
  
  console.log("5. Results:");
  console.log("   Liquidatable positions:", liquidatable.length);
  if (liquidatable.length > 0) {
    console.log("   First 3:", JSON.stringify(liquidatable.slice(0, 3), null, 2));
  }
}

test().then(() => console.log("\nDone!")).catch(e => console.error("Error:", e.message, e.stack));
