/**
 * DEX/Swap Adapter
 * 
 * Handles DEX queries on Proton blockchain (proton.swaps)
 */

const PROTON_API = 'https://proton.eosusa.io';
const SWAP_CONTRACT = 'proton.swaps';

/**
 * Get all swap pools
 */
export async function getSwapPools(options?: {
  limit?: number;
}): Promise<any> {
  const response = await fetch(`${PROTON_API}/v1/chain/get_table_rows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: SWAP_CONTRACT,
      table: 'pools',
      scope: SWAP_CONTRACT,
      limit: options?.limit || 100,
      json: true,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json() as { rows: any[]; more: boolean };
  
  const pools = data.rows.map((p: any) => {
    // Parse pool tokens
    const lt = p.lt_symbol || {};
    const pool1 = p.pool1 || {};
    const pool2 = p.pool2 || {};
    
    const parseQuantity = (q: any) => {
      const qty = q?.quantity || '0';
      const parts = qty.split(' ');
      return {
        amount: parseFloat(parts[0]) || 0,
        symbol: parts[1] || '',
      };
    };
    
    const token1 = parseQuantity(pool1);
    const token2 = parseQuantity(pool2);
    
    // Calculate price
    const price = token1.amount > 0 ? token2.amount / token1.amount : 0;
    
    return {
      pool_id: p.lt_symbol?.sym?.split(',')[1] || '',
      token1: {
        symbol: token1.symbol,
        amount: token1.amount,
        contract: pool1.contract,
      },
      token2: {
        symbol: token2.symbol,
        amount: token2.amount,
        contract: pool2.contract,
      },
      price: price,
      fee: p.fee || 0,
      creator: p.creator,
    };
  });
  
  return {
    pools,
    count: pools.length,
    more: data.more,
  };
}

/**
 * Get pool by token pair
 */
export async function getPoolByPair(tokenA: string, tokenB: string): Promise<any> {
  const poolsResult = await getSwapPools({ limit: 200 });
  
  const pool = poolsResult.pools.find((p: any) =>
    (p.token1.symbol === tokenA && p.token2.symbol === tokenB) ||
    (p.token1.symbol === tokenB && p.token2.symbol === tokenA)
  );
  
  if (pool) {
    return {
      found: true,
      pool,
    };
  }
  
  return {
    found: false,
    error: `No pool found for ${tokenA}/${tokenB}`,
    available_pairs: poolsResult.pools.slice(0, 20).map((p: any) => 
      `${p.token1.symbol}/${p.token2.symbol}`
    ),
  };
}

/**
 * Get swap rate estimate
 */
export async function getSwapRate(
  fromSymbol: string,
  toSymbol: string,
  amount: number
): Promise<any> {
  // First get all pools
  const poolsResult = await getSwapPools({ limit: 200 });
  
  // Find direct pool
  const directPool = poolsResult.pools.find((p: any) => 
    (p.token1.symbol === fromSymbol && p.token2.symbol === toSymbol) ||
    (p.token1.symbol === toSymbol && p.token2.symbol === fromSymbol)
  );
  
  if (directPool) {
    const isForward = directPool.token1.symbol === fromSymbol;
    const inReserve = isForward ? directPool.token1.amount : directPool.token2.amount;
    const outReserve = isForward ? directPool.token2.amount : directPool.token1.amount;
    
    // Constant product formula with fee
    const fee = directPool.fee || 30; // 0.30% default
    const amountWithFee = amount * (10000 - fee);
    const numerator = amountWithFee * outReserve;
    const denominator = (inReserve * 10000) + amountWithFee;
    const amountOut = numerator / denominator;
    
    const rate = amountOut / amount;
    const priceImpact = Math.abs((rate - directPool.price) / directPool.price) * 100;
    
    return {
      from: fromSymbol,
      to: toSymbol,
      amount_in: amount,
      amount_out: amountOut,
      rate,
      fee_percent: fee / 100,
      price_impact_percent: priceImpact,
      pool_id: directPool.pool_id,
      path: [fromSymbol, toSymbol],
    };
  }
  
  // Try to find path through XPR or USDC
  const intermediates = ['XPR', 'XUSDC', 'XMD'];
  
  for (const mid of intermediates) {
    if (mid === fromSymbol || mid === toSymbol) continue;
    
    const pool1 = poolsResult.pools.find((p: any) =>
      (p.token1.symbol === fromSymbol && p.token2.symbol === mid) ||
      (p.token1.symbol === mid && p.token2.symbol === fromSymbol)
    );
    
    const pool2 = poolsResult.pools.find((p: any) =>
      (p.token1.symbol === mid && p.token2.symbol === toSymbol) ||
      (p.token1.symbol === toSymbol && p.token2.symbol === mid)
    );
    
    if (pool1 && pool2) {
      // Calculate two-hop swap
      const fee1 = pool1.fee || 30;
      const isForward1 = pool1.token1.symbol === fromSymbol;
      const inReserve1 = isForward1 ? pool1.token1.amount : pool1.token2.amount;
      const outReserve1 = isForward1 ? pool1.token2.amount : pool1.token1.amount;
      
      const amountWithFee1 = amount * (10000 - fee1);
      const midAmount = (amountWithFee1 * outReserve1) / ((inReserve1 * 10000) + amountWithFee1);
      
      const fee2 = pool2.fee || 30;
      const isForward2 = pool2.token1.symbol === mid;
      const inReserve2 = isForward2 ? pool2.token1.amount : pool2.token2.amount;
      const outReserve2 = isForward2 ? pool2.token2.amount : pool2.token1.amount;
      
      const amountWithFee2 = midAmount * (10000 - fee2);
      const amountOut = (amountWithFee2 * outReserve2) / ((inReserve2 * 10000) + amountWithFee2);
      
      const rate = amountOut / amount;
      
      return {
        from: fromSymbol,
        to: toSymbol,
        amount_in: amount,
        amount_out: amountOut,
        rate,
        fee_percent: (fee1 + fee2) / 100,
        path: [fromSymbol, mid, toSymbol],
        hops: 2,
      };
    }
  }
  
  return {
    from: fromSymbol,
    to: toSymbol,
    amount_in: amount,
    error: 'No swap path found',
    available_pools: poolsResult.pools.map((p: any) => `${p.token1.symbol}/${p.token2.symbol}`),
  };
}

/**
 * Get liquidity positions for an account
 */
export async function getLiquidityPositions(account: string): Promise<any> {
  // Get all LP tokens for account
  const response = await fetch(`${PROTON_API}/v1/chain/get_table_rows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: SWAP_CONTRACT,
      table: 'accounts',
      scope: account,
      limit: 100,
      json: true,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json() as { rows: any[] };
  
  const positions = data.rows.map((r: any) => {
    const parts = (r.balance || '').split(' ');
    return {
      lp_token: parts[1] || '',
      balance: parseFloat(parts[0]) || 0,
    };
  });
  
  return {
    account,
    positions,
    count: positions.length,
  };
}
