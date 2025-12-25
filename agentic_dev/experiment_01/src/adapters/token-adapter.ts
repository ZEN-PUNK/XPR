/**
 * Token/Currency Adapter
 * 
 * Handles all token-related queries on Proton blockchain
 */

const PROTON_API = 'https://proton.eosusa.io';

/**
 * Get currency balance for an account
 */
export async function getCurrencyBalance(
  contract: string,
  account: string,
  symbol?: string
): Promise<any> {
  const body: any = {
    code: contract,
    account: account,
  };
  
  if (symbol) {
    body.symbol = symbol;
  }
  
  const response = await fetch(`${PROTON_API}/v1/chain/get_currency_balance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const balances = await response.json() as string[];
  
  // Parse balances into structured format
  const parsed = balances.map((b: string) => {
    const parts = b.split(' ');
    return {
      amount: parseFloat(parts[0]),
      symbol: parts[1],
      raw: b,
    };
  });
  
  return {
    account,
    contract,
    balances: parsed,
    count: parsed.length,
  };
}

/**
 * Get currency stats (supply info)
 */
export async function getCurrencyStats(
  contract: string,
  symbol: string
): Promise<any> {
  const response = await fetch(`${PROTON_API}/v1/chain/get_currency_stats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: contract,
      symbol: symbol,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const stats = await response.json() as Record<string, any>;
  
  // Extract stats for the symbol
  const tokenStats = stats[symbol];
  
  if (!tokenStats) {
    return {
      symbol,
      contract,
      exists: false,
      message: `Token ${symbol} not found on contract ${contract}`,
    };
  }
  
  // Parse supply values
  const parseSupply = (s: string) => {
    const parts = s.split(' ');
    return parseFloat(parts[0]);
  };
  
  return {
    symbol,
    contract,
    exists: true,
    supply: parseSupply(tokenStats.supply || '0'),
    max_supply: parseSupply(tokenStats.max_supply || '0'),
    issuer: tokenStats.issuer,
    raw: tokenStats,
  };
}

/**
 * Generic table rows query
 */
export async function getTableRows(
  contract: string,
  table: string,
  scope?: string,
  options?: {
    limit?: number;
    lower_bound?: string;
    upper_bound?: string;
    key_type?: string;
    index_position?: number;
    reverse?: boolean;
  }
): Promise<any> {
  const body: any = {
    code: contract,
    table: table,
    scope: scope || contract,
    json: true,
    limit: options?.limit || 100,
  };
  
  if (options?.lower_bound) body.lower_bound = options.lower_bound;
  if (options?.upper_bound) body.upper_bound = options.upper_bound;
  if (options?.key_type) body.key_type = options.key_type;
  if (options?.index_position) body.index_position = options.index_position;
  if (options?.reverse) body.reverse = options.reverse;
  
  const response = await fetch(`${PROTON_API}/v1/chain/get_table_rows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json() as { rows: any[]; more: boolean; next_key?: string };
  
  return {
    contract,
    table,
    scope: scope || contract,
    rows: data.rows,
    count: data.rows.length,
    more: data.more,
    next_key: data.next_key,
  };
}

/**
 * Get table by scope (list all scopes for a table)
 */
export async function getTableByScope(
  contract: string,
  table?: string,
  limit?: number
): Promise<any> {
  const body: any = {
    code: contract,
    limit: limit || 100,
  };
  
  if (table) body.table = table;
  
  const response = await fetch(`${PROTON_API}/v1/chain/get_table_by_scope`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json() as { rows: any[]; more: string };
  
  return {
    contract,
    table: table || '(all)',
    scopes: data.rows,
    count: data.rows.length,
    more: data.more,
  };
}
