/**
 * NFT Adapter
 * 
 * Handles NFT queries on Proton blockchain (atomicassets)
 */

const PROTON_API = 'https://proton.eosusa.io';
const ATOMIC_CONTRACT = 'atomicassets';
const ATOMIC_MARKET = 'atomicmarket';

/**
 * Get NFT assets for an account
 */
export async function getNftAssets(
  owner: string,
  options?: {
    collection?: string;
    schema?: string;
    limit?: number;
  }
): Promise<any> {
  const response = await fetch(`${PROTON_API}/v1/chain/get_table_rows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: ATOMIC_CONTRACT,
      table: 'assets',
      scope: owner,
      limit: options?.limit || 100,
      json: true,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json() as { rows: any[]; more: boolean };
  
  let assets = data.rows.map((a: any) => ({
    asset_id: a.asset_id,
    collection_name: a.collection_name,
    schema_name: a.schema_name,
    template_id: a.template_id,
    ram_payer: a.ram_payer,
    backed_tokens: a.backed_tokens,
    immutable_serialized_data: a.immutable_serialized_data ? '(has data)' : null,
    mutable_serialized_data: a.mutable_serialized_data ? '(has data)' : null,
  }));
  
  // Filter if collection or schema specified
  if (options?.collection) {
    assets = assets.filter((a: any) => a.collection_name === options.collection);
  }
  if (options?.schema) {
    assets = assets.filter((a: any) => a.schema_name === options.schema);
  }
  
  // Group by collection
  const byCollection: Record<string, number> = {};
  for (const a of assets) {
    byCollection[a.collection_name] = (byCollection[a.collection_name] || 0) + 1;
  }
  
  return {
    owner,
    assets,
    count: assets.length,
    by_collection: byCollection,
    more: data.more,
  };
}

/**
 * Get NFT collections
 */
export async function getNftCollections(options?: {
  author?: string;
  limit?: number;
}): Promise<any> {
  const body: any = {
    code: ATOMIC_CONTRACT,
    table: 'collections',
    scope: ATOMIC_CONTRACT,
    limit: options?.limit || 100,
    json: true,
  };
  
  if (options?.author) {
    body.lower_bound = options.author;
    body.upper_bound = options.author;
  }
  
  const response = await fetch(`${PROTON_API}/v1/chain/get_table_rows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json() as { rows: any[]; more: boolean };
  
  const collections = data.rows.map((c: any) => ({
    collection_name: c.collection_name,
    author: c.author,
    allow_notify: c.allow_notify,
    authorized_accounts: c.authorized_accounts,
    notify_accounts: c.notify_accounts,
    market_fee: c.market_fee,
    serialized_data: c.serialized_data ? '(has data)' : null,
  }));
  
  return {
    collections,
    count: collections.length,
    more: data.more,
  };
}

/**
 * Get NFT templates for a collection
 */
export async function getNftTemplates(
  collection: string,
  options?: {
    schema?: string;
    limit?: number;
  }
): Promise<any> {
  const response = await fetch(`${PROTON_API}/v1/chain/get_table_rows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: ATOMIC_CONTRACT,
      table: 'templates',
      scope: collection,
      limit: options?.limit || 100,
      json: true,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json() as { rows: any[]; more: boolean };
  
  let templates = data.rows.map((t: any) => ({
    template_id: t.template_id,
    schema_name: t.schema_name,
    transferable: t.transferable,
    burnable: t.burnable,
    max_supply: t.max_supply,
    issued_supply: t.issued_supply,
  }));
  
  if (options?.schema) {
    templates = templates.filter((t: any) => t.schema_name === options.schema);
  }
  
  return {
    collection,
    templates,
    count: templates.length,
    more: data.more,
  };
}

/**
 * Get NFT sales/listings
 */
export async function getNftSales(options?: {
  seller?: string;
  collection?: string;
  limit?: number;
}): Promise<any> {
  const response = await fetch(`${PROTON_API}/v1/chain/get_table_rows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: ATOMIC_MARKET,
      table: 'sales',
      scope: ATOMIC_MARKET,
      limit: options?.limit || 100,
      json: true,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json() as { rows: any[]; more: boolean };
  
  let sales = data.rows.map((s: any) => {
    const price = s.listing_price || '';
    const parts = price.split(' ');
    return {
      sale_id: s.sale_id,
      seller: s.seller,
      asset_ids: s.asset_ids,
      offer_id: s.offer_id,
      listing_price: price,
      price_amount: parseFloat(parts[0]) || 0,
      price_symbol: parts[1] || '',
      settlement_symbol: s.settlement_symbol,
      collection_name: s.collection_name,
      collection_fee: s.collection_fee,
    };
  });
  
  // Filter
  if (options?.seller) {
    sales = sales.filter((s: any) => s.seller === options.seller);
  }
  if (options?.collection) {
    sales = sales.filter((s: any) => s.collection_name === options.collection);
  }
  
  return {
    sales,
    count: sales.length,
    more: data.more,
  };
}

/**
 * Get schemas for a collection
 */
export async function getNFTSchemas(collection: string): Promise<any> {
  const response = await fetch(`${PROTON_API}/v1/chain/get_table_rows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: ATOMIC_CONTRACT,
      table: 'schemas',
      scope: collection,
      limit: 100,
      json: true,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json() as { rows: any[]; more: boolean };
  
  const schemas = data.rows.map((s: any) => ({
    schema_name: s.schema_name,
    format: s.format,
  }));
  
  return {
    collection,
    schemas,
    count: schemas.length,
  };
}

/**
 * Get specific NFT asset by ID
 */
export async function getNFTAsset(assetId: string): Promise<any> {
  // We need to check each owner - this is expensive
  // Try to use the RAM payer approach or search by scope
  const response = await fetch(`${PROTON_API}/v1/chain/get_table_by_scope`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: ATOMIC_CONTRACT,
      table: 'assets',
      limit: 1000,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const scopeData = await response.json() as { rows: any[] };
  
  // Search each owner for the asset
  for (const row of scopeData.rows) {
    const owner = row.scope;
    const assetResponse = await fetch(`${PROTON_API}/v1/chain/get_table_rows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: ATOMIC_CONTRACT,
        table: 'assets',
        scope: owner,
        lower_bound: assetId,
        upper_bound: assetId,
        limit: 1,
        json: true,
      }),
    });
    
    if (assetResponse.ok) {
      const assetData = await assetResponse.json() as { rows: any[] };
      if (assetData.rows.length > 0) {
        const a = assetData.rows[0];
        return {
          found: true,
          owner,
          asset: {
            asset_id: a.asset_id,
            collection_name: a.collection_name,
            schema_name: a.schema_name,
            template_id: a.template_id,
            ram_payer: a.ram_payer,
            backed_tokens: a.backed_tokens,
          },
        };
      }
    }
  }
  
  return {
    found: false,
    error: `Asset ${assetId} not found`,
  };
}

// Aliases for tool compatibility
export const getAccountNFTs = getNftAssets;
export const getNFTTemplates = getNftTemplates;
export const getNFTCollections = getNftCollections;
