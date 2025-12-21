import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Get account information from Proton blockchain
 * Uses `proton account <name> -r` to fetch structured data
 */
export async function getAccount(accountName: string) {
  try {
    const { stdout, stderr } = await execAsync(
      `proton account ${accountName} -r 2>/dev/null`,
      { timeout: 10000 }
    );

    if (!stdout || stdout.trim().length === 0) {
      throw new Error(`No output from proton CLI for account "${accountName}"`);
    }

    // Extract JSON from output (may have debug output before it)
    // Look for lines starting with { which indicate JSON start
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
    const accountData = JSON.parse(jsonLine);

    // Extract relevant fields
    return {
      name: accountName,
      created: accountData.created,
      resources: {
        cpu_available: accountData.cpu_available,
        cpu_limit: accountData.cpu_limit,
        net_available: accountData.net_available,
        net_limit: accountData.net_limit,
        ram_quota: accountData.ram_quota,
        ram_usage: accountData.ram_usage,
      },
      permissions: accountData.permissions,
      voter_info: accountData.voter_info,
      total_resources: accountData.total_resources,
    };
  } catch (error: any) {
    if (error.message.includes('does not exist')) {
      throw {
        code: 'ACCOUNT_NOT_FOUND',
        message: `Account "${accountName}" does not exist on Proton network`,
        details: { account_name: accountName },
      };
    }
    throw {
      code: 'CLI_ERROR',
      message: error.message,
      details: { account_name: accountName },
    };
  }
}

/**
 * Get account resources summary
 * Lightweight query for just resource info
 */
export async function getAccountResources(accountName: string) {
  const accountData = await getAccount(accountName);
  return accountData.resources;
}
