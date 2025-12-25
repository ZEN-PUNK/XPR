/**
 * Transaction & History Adapter
 * 
 * Handles transaction queries and action history on Proton blockchain
 */

const PROTON_API = 'https://proton.eosusa.io';
const HISTORY_API = 'https://proton.eosusa.io'; // Some chains use separate history nodes

/**
 * Get transaction by ID
 */
export async function getTransaction(txId: string): Promise<any> {
  const response = await fetch(`${PROTON_API}/v1/history/get_transaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: txId }),
  });
  
  if (!response.ok) {
    // Try alternative endpoint
    const altResponse = await fetch(`${PROTON_API}/v1/chain/get_transaction_status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: txId }),
    });
    
    if (!altResponse.ok) {
      throw new Error(`Transaction not found: ${txId}`);
    }
    
    const altData = await altResponse.json() as any;
    return {
      id: txId,
      status: altData.state,
      block_num: altData.block_num,
      block_timestamp: altData.block_timestamp,
      source: 'transaction_status',
    };
  }
  
  const data = await response.json() as any;
  
  return {
    id: data.id,
    block_num: data.block_num,
    block_time: data.block_time,
    irreversible: data.irreversible || data.last_irreversible_block >= data.block_num,
    traces: (data.traces || []).map((t: any) => ({
      action_ordinal: t.action_ordinal,
      receiver: t.receiver,
      act: {
        account: t.act?.account,
        name: t.act?.name,
        authorization: t.act?.authorization,
        data: t.act?.data,
      },
    })),
    action_count: (data.traces || []).length,
  };
}

/**
 * Get actions for an account (history)
 */
export async function getActions(
  accountName: string,
  options?: {
    pos?: number;
    offset?: number;
    filter?: string;
  }
): Promise<any> {
  const body: any = {
    account_name: accountName,
    pos: options?.pos ?? -1,
    offset: options?.offset ?? -100,
  };
  
  if (options?.filter) {
    body.filter = options.filter;
  }
  
  const response = await fetch(`${HISTORY_API}/v1/history/get_actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json() as { actions: any[]; last_irreversible_block: number };
  
  return {
    account: accountName,
    actions: (data.actions || []).map((a: any) => ({
      global_sequence: a.global_action_seq,
      account_sequence: a.account_action_seq,
      block_num: a.block_num,
      block_time: a.block_time,
      action: {
        account: a.action_trace?.act?.account,
        name: a.action_trace?.act?.name,
        authorization: a.action_trace?.act?.authorization,
        data: a.action_trace?.act?.data,
      },
    })),
    count: (data.actions || []).length,
    last_irreversible_block: data.last_irreversible_block,
  };
}

/**
 * Get key accounts (accounts controlled by a public key)
 */
export async function getKeyAccounts(publicKey: string): Promise<any> {
  const response = await fetch(`${HISTORY_API}/v1/history/get_key_accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ public_key: publicKey }),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json() as { account_names: string[] };
  
  return {
    public_key: publicKey,
    accounts: data.account_names,
    count: data.account_names.length,
  };
}

/**
 * Get controlled accounts (accounts controlled by another account)
 */
export async function getControlledAccounts(controllingAccount: string): Promise<any> {
  const response = await fetch(`${HISTORY_API}/v1/history/get_controlled_accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ controlling_account: controllingAccount }),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json() as { controlled_accounts: string[] };
  
  return {
    controlling_account: controllingAccount,
    controlled_accounts: data.controlled_accounts,
    count: data.controlled_accounts.length,
  };
}
