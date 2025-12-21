/**
 * Azure Configuration Manager
 * Handles loading and validating Azure credentials and settings
 */

export interface AzureConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  subscriptionId: string;
  resourceGroup: string;
  keyVaultName: string;
  storageAccountName: string;
  storageAccountKey: string;
}

/**
 * Load Azure configuration from environment variables
 */
export function loadAzureConfig(): AzureConfig {
  const config: AzureConfig = {
    tenantId: process.env.AZURE_TENANT_ID || '',
    clientId: process.env.AZURE_CLIENT_ID || '',
    clientSecret: process.env.AZURE_CLIENT_SECRET || '',
    subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || '',
    resourceGroup: process.env.AZURE_RESOURCE_GROUP || '',
    keyVaultName: process.env.AZURE_KEY_VAULT_NAME || '',
    storageAccountName: process.env.AZURE_STORAGE_ACCOUNT_NAME || '',
    storageAccountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY || '',
  };

  return config;
}

/**
 * Validate Azure configuration has required fields
 */
export function validateAzureConfig(config: AzureConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.tenantId) errors.push('Missing AZURE_TENANT_ID');
  if (!config.clientId) errors.push('Missing AZURE_CLIENT_ID');
  if (!config.clientSecret) errors.push('Missing AZURE_CLIENT_SECRET');
  if (!config.subscriptionId) errors.push('Missing AZURE_SUBSCRIPTION_ID');
  if (!config.resourceGroup) errors.push('Missing AZURE_RESOURCE_GROUP');
  if (!config.keyVaultName) errors.push('Missing AZURE_KEY_VAULT_NAME');
  if (!config.storageAccountName) errors.push('Missing AZURE_STORAGE_ACCOUNT_NAME');
  if (!config.storageAccountKey) errors.push('Missing AZURE_STORAGE_ACCOUNT_KEY');

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if Azure configuration is available
 */
export function isAzureConfigured(): boolean {
  return !!(
    process.env.AZURE_TENANT_ID &&
    process.env.AZURE_CLIENT_ID &&
    process.env.AZURE_CLIENT_SECRET &&
    process.env.AZURE_SUBSCRIPTION_ID
  );
}

/**
 * Get a masked version of config for logging (no secrets)
 */
export function getMaskedConfig(config: AzureConfig): Record<string, any> {
  return {
    tenantId: config.tenantId ? '***' : 'NOT SET',
    clientId: config.clientId ? '***' : 'NOT SET',
    clientSecret: config.clientSecret ? '***' : 'NOT SET',
    subscriptionId: config.subscriptionId ? '***' : 'NOT SET',
    resourceGroup: config.resourceGroup || 'NOT SET',
    keyVaultName: config.keyVaultName || 'NOT SET',
    storageAccountName: config.storageAccountName || 'NOT SET',
    storageAccountKey: config.storageAccountKey ? '***' : 'NOT SET',
  };
}

export default {
  loadAzureConfig,
  validateAzureConfig,
  isAzureConfigured,
  getMaskedConfig,
};
