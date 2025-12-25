/**
 * Contract Adapter
 * 
 * Handles contract inspection and ABI queries on Proton blockchain
 */

const PROTON_API = 'https://proton.eosusa.io';

/**
 * Get ABI for a contract
 */
export async function getAbi(accountName: string): Promise<any> {
  const response = await fetch(`${PROTON_API}/v1/chain/get_abi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account_name: accountName }),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json() as { account_name: string; abi?: any };
  
  if (!data.abi) {
    return {
      account: accountName,
      has_abi: false,
      message: `No ABI found for account ${accountName}`,
    };
  }
  
  const abi = data.abi;
  
  return {
    account: accountName,
    has_abi: true,
    version: abi.version,
    tables: (abi.tables || []).map((t: any) => ({
      name: t.name,
      type: t.type,
      index_type: t.index_type,
      key_names: t.key_names,
    })),
    actions: (abi.actions || []).map((a: any) => ({
      name: a.name,
      type: a.type,
    })),
    structs: (abi.structs || []).map((s: any) => s.name),
    struct_count: (abi.structs || []).length,
    table_count: (abi.tables || []).length,
    action_count: (abi.actions || []).length,
  };
}

/**
 * Get raw ABI (binary format)
 */
export async function getRawAbi(accountName: string): Promise<any> {
  const response = await fetch(`${PROTON_API}/v1/chain/get_raw_abi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account_name: accountName }),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json() as { account_name: string; abi_hash: string; code_hash: string };
  
  return {
    account: accountName,
    abi_hash: data.abi_hash,
    code_hash: data.code_hash,
  };
}

/**
 * Get code hash for a contract
 */
export async function getCode(accountName: string): Promise<any> {
  const response = await fetch(`${PROTON_API}/v1/chain/get_code_hash`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account_name: accountName }),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json() as { account_name: string; code_hash: string };
  
  const hasCode = data.code_hash !== '0000000000000000000000000000000000000000000000000000000000000000';
  
  return {
    account: accountName,
    has_code: hasCode,
    code_hash: data.code_hash,
  };
}

/**
 * Get required keys to sign a transaction
 */
export async function getRequiredKeys(
  transaction: any,
  availableKeys: string[]
): Promise<any> {
  const response = await fetch(`${PROTON_API}/v1/chain/get_required_keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transaction,
      available_keys: availableKeys,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json() as { required_keys: string[] };
  
  return {
    required_keys: data.required_keys,
    count: data.required_keys.length,
  };
}
