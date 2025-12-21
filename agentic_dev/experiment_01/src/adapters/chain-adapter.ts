import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Get chain information from Proton blockchain
 * Uses `proton chain:info` to fetch chain metadata
 */
export async function getChainInfo() {
  try {
    const { stdout, stderr } = await execAsync(
      `proton chain:info -r 2>/dev/null`,
      { timeout: 10000 }
    );

    if (!stdout || stdout.trim().length === 0) {
      throw new Error(`No output from proton CLI for chain:info`);
    }

    // Extract JSON from output (may have debug output before it)
    const lines = stdout.split('\n');
    let jsonLine = '';
    let inJson = false;
    
    for (const line of lines) {
      if (line.trim().startsWith('{')) {
        inJson = true;
      }
      if (inJson) {
        jsonLine += line + '\n';
      }
    }

    if (!jsonLine.trim()) {
      throw new Error(`Could not find JSON in proton CLI output`);
    }

    // Parse JSON output from proton CLI
    const chainData = JSON.parse(jsonLine);

    // Extract relevant fields
    return {
      chain_id: chainData.chain_id,
      head_block_num: chainData.head_block_num,
      head_block_id: chainData.head_block_id,
      head_block_time: chainData.head_block_time,
      last_irreversible_block_num: chainData.last_irreversible_block_num,
      last_irreversible_block_id: chainData.last_irreversible_block_id,
      server_version_string: chainData.server_version_string,
      server_version: chainData.server_version,
      fork_db_head_block_num: chainData.fork_db_head_block_num,
      fork_db_head_block_id: chainData.fork_db_head_block_id,
    };
  } catch (error: any) {
    throw {
      code: 'CHAIN_INFO_ERROR',
      message: error.message,
      details: {},
    };
  }
}

/**
 * Get block information from Proton blockchain
 * Uses `proton chain:get <blockNum>` to fetch block details
 */
export async function getBlock(blockNumOrId: string | number) {
  try {
    const blockParam = typeof blockNumOrId === 'number' 
      ? blockNumOrId.toString() 
      : blockNumOrId;

    const { stdout, stderr } = await execAsync(
      `proton chain:get ${blockParam} -r 2>/dev/null`,
      { timeout: 10000 }
    );

    if (!stdout || stdout.trim().length === 0) {
      throw new Error(`No output from proton CLI for block "${blockParam}"`);
    }

    // Extract JSON from output (may have debug output before it)
    const lines = stdout.split('\n');
    let jsonLine = '';
    let inJson = false;
    
    for (const line of lines) {
      if (line.trim().startsWith('{')) {
        inJson = true;
      }
      if (inJson) {
        jsonLine += line + '\n';
      }
    }

    if (!jsonLine.trim()) {
      throw new Error(`Could not find JSON in proton CLI output`);
    }

    // Parse JSON output from proton CLI
    const blockData = JSON.parse(jsonLine);

    // Extract relevant fields
    return {
      timestamp: blockData.timestamp,
      producer: blockData.producer,
      confirmed: blockData.confirmed,
      previous: blockData.previous,
      transaction_mroot: blockData.transaction_mroot,
      action_mroot: blockData.action_mroot,
      schedule_version: blockData.schedule_version,
      new_producers: blockData.new_producers,
      producer_signature: blockData.producer_signature,
      transactions: blockData.transactions || [],
      block_num: blockData.block_num,
      ref_block_prefix: blockData.ref_block_prefix,
      id: blockData.id,
    };
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('does not exist')) {
      throw {
        code: 'BLOCK_NOT_FOUND',
        message: `Block "${blockNumOrId}" not found`,
        details: { block_num_or_id: blockNumOrId },
      };
    }
    throw {
      code: 'BLOCK_FETCH_ERROR',
      message: error.message,
      details: { block_num_or_id: blockNumOrId },
    };
  }
}

/**
 * Get transaction count for a block
 */
export async function getBlockTransactionCount(blockNumOrId: string | number) {
  const blockData = await getBlock(blockNumOrId);
  return blockData.transactions.length;
}
