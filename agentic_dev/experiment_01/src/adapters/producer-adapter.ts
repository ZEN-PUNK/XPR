/**
 * Producer Adapter
 * 
 * Handles block producer queries on Proton blockchain
 */

const PROTON_API = 'https://proton.eosusa.io';

/**
 * Get list of block producers
 */
export async function getProducers(options?: {
  limit?: number;
  lower_bound?: string;
}): Promise<any> {
  const response = await fetch(`${PROTON_API}/v1/chain/get_producers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      json: true,
      limit: options?.limit || 50,
      lower_bound: options?.lower_bound || '',
    }),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json() as { 
    rows: any[]; 
    total_producer_vote_weight: string;
    more: string;
  };
  
  const producers = data.rows.map((p: any, index: number) => ({
    rank: index + 1,
    owner: p.owner,
    producer_key: p.producer_key,
    url: p.url,
    total_votes: parseFloat(p.total_votes) / 1e16, // Convert to millions
    is_active: p.is_active === 1,
    unpaid_blocks: p.unpaid_blocks,
    last_claim_time: p.last_claim_time,
    location: p.location,
  }));
  
  // Calculate total vote weight
  const totalVotes = parseFloat(data.total_producer_vote_weight) / 1e16;
  
  return {
    producers,
    count: producers.length,
    total_producer_vote_weight: totalVotes,
    active_producers: producers.filter((p: any) => p.is_active).length,
    more: data.more,
  };
}

/**
 * Get producer schedule
 */
export async function getProducerSchedule(): Promise<any> {
  const response = await fetch(`${PROTON_API}/v1/chain/get_producer_schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json() as { 
    active: { version: number; producers: any[] };
    pending: any;
    proposed: any;
  };
  
  return {
    active: {
      version: data.active?.version,
      producers: (data.active?.producers || []).map((p: any) => ({
        producer_name: p.producer_name,
        authority: p.authority,
      })),
      count: (data.active?.producers || []).length,
    },
    has_pending: !!data.pending,
    has_proposed: !!data.proposed,
  };
}

/**
 * Get activated protocol features
 */
export async function getActivatedProtocolFeatures(options?: {
  limit?: number;
  lower_bound?: number;
  upper_bound?: number;
}): Promise<any> {
  const response = await fetch(`${PROTON_API}/v1/chain/get_activated_protocol_features`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      limit: options?.limit || 100,
      lower_bound: options?.lower_bound,
      upper_bound: options?.upper_bound,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json() as { 
    activated_protocol_features: any[];
    more: number;
  };
  
  const features = data.activated_protocol_features.map((f: any) => ({
    feature_digest: f.feature_digest,
    activation_block_num: f.activation_block_num,
    activation_ordinal: f.activation_ordinal,
    description_digest: f.description_digest,
  }));
  
  return {
    features,
    count: features.length,
    more: data.more,
  };
}
