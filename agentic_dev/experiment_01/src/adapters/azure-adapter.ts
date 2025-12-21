/**
 * Azure Adapter for MCP Server
 * Provides integration with Azure services (Storage, Key Vault, etc.)
 */

import axios, { AxiosInstance } from 'axios';

interface AzureConfig {
  subscriptionId: string;
  resourceGroup: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  storageAccountName?: string;
  keyVaultName?: string;
}

interface AzureToken {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
}

interface AzureResource {
  id: string;
  name: string;
  type: string;
  location: string;
  properties?: Record<string, any>;
}

/**
 * Azure Service Adapter
 * Handles authentication and communication with Azure services
 */
export class AzureAdapter {
  private config: AzureConfig;
  private axiosInstance: AxiosInstance;
  private token: AzureToken | null = null;
  private tokenExpiresAt: number = 0;

  constructor(config: AzureConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Authenticate with Azure using client credentials
   */
  async authenticate(): Promise<string> {
    if (this.token && this.tokenExpiresAt > Date.now()) {
      return this.token.accessToken;
    }

    try {
      const tokenEndpoint = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`;

      const response = await this.axiosInstance.post(
        tokenEndpoint,
        new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          scope: 'https://management.azure.com/.default',
          grant_type: 'client_credentials',
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.token = {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type,
      };

      this.tokenExpiresAt = Date.now() + response.data.expires_in * 1000;

      return this.token.accessToken;
    } catch (error: any) {
      throw new Error(`Azure authentication failed: ${error.message}`);
    }
  }

  /**
   * Get authorization headers with access token
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.authenticate();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * List all resources in a resource group
   */
  async listResources(): Promise<AzureResource[]> {
    try {
      const headers = await this.getAuthHeaders();
      const url = `https://management.azure.com/subscriptions/${this.config.subscriptionId}/resourceGroups/${this.config.resourceGroup}/resources`;

      const response = await this.axiosInstance.get(url, {
        headers,
        params: {
          'api-version': '2021-04-01',
        },
      });

      return response.data.value || [];
    } catch (error: any) {
      throw new Error(`Failed to list resources: ${error.message}`);
    }
  }

  /**
   * Get a specific resource
   */
  async getResource(resourceName: string, resourceType: string): Promise<AzureResource> {
    try {
      const headers = await this.getAuthHeaders();
      const url = `https://management.azure.com/subscriptions/${this.config.subscriptionId}/resourceGroups/${this.config.resourceGroup}/providers/${resourceType}/${resourceName}`;

      const response = await this.axiosInstance.get(url, {
        headers,
        params: {
          'api-version': '2021-04-01',
        },
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get resource: ${error.message}`);
    }
  }

  /**
   * Create or update a resource
   */
  async createResource(
    resourceName: string,
    resourceType: string,
    properties: Record<string, any>,
    location: string = 'eastus'
  ): Promise<AzureResource> {
    try {
      const headers = await this.getAuthHeaders();
      const url = `https://management.azure.com/subscriptions/${this.config.subscriptionId}/resourceGroups/${this.config.resourceGroup}/providers/${resourceType}/${resourceName}`;

      const response = await this.axiosInstance.put(
        url,
        {
          location,
          properties,
        },
        {
          headers,
          params: {
            'api-version': '2021-04-01',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to create resource: ${error.message}`);
    }
  }

  /**
   * Delete a resource
   */
  async deleteResource(resourceName: string, resourceType: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const url = `https://management.azure.com/subscriptions/${this.config.subscriptionId}/resourceGroups/${this.config.resourceGroup}/providers/${resourceType}/${resourceName}`;

      await this.axiosInstance.delete(url, {
        headers,
        params: {
          'api-version': '2021-04-01',
        },
      });
    } catch (error: any) {
      throw new Error(`Failed to delete resource: ${error.message}`);
    }
  }

  /**
   * Get Azure Key Vault secret
   */
  async getKeyVaultSecret(secretName: string): Promise<string> {
    if (!this.config.keyVaultName) {
      throw new Error('Key Vault name not configured');
    }

    try {
      const token = await this.authenticate();
      const url = `https://${this.config.keyVaultName}.vault.azure.net/secrets/${secretName}`;

      const response = await this.axiosInstance.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          'api-version': '7.3',
        },
      });

      return response.data.value;
    } catch (error: any) {
      throw new Error(`Failed to get Key Vault secret: ${error.message}`);
    }
  }

  /**
   * Store secret in Azure Key Vault
   */
  async setKeyVaultSecret(secretName: string, secretValue: string): Promise<void> {
    if (!this.config.keyVaultName) {
      throw new Error('Key Vault name not configured');
    }

    try {
      const token = await this.authenticate();
      const url = `https://${this.config.keyVaultName}.vault.azure.net/secrets/${secretName}`;

      await this.axiosInstance.put(
        url,
        { value: secretValue },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            'api-version': '7.3',
          },
        }
      );
    } catch (error: any) {
      throw new Error(`Failed to set Key Vault secret: ${error.message}`);
    }
  }

  /**
   * Upload file to Azure Blob Storage
   */
  async uploadBlob(containerName: string, blobName: string, data: Buffer | string): Promise<string> {
    if (!this.config.storageAccountName) {
      throw new Error('Storage account name not configured');
    }

    try {
      const token = await this.authenticate();
      const url = `https://${this.config.storageAccountName}.blob.core.windows.net/${containerName}/${blobName}`;

      const response = await this.axiosInstance.put(url, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-ms-blob-type': 'BlockBlob',
        },
      });

      return response.config.url || url;
    } catch (error: any) {
      throw new Error(`Failed to upload blob: ${error.message}`);
    }
  }

  /**
   * Download file from Azure Blob Storage
   */
  async downloadBlob(containerName: string, blobName: string): Promise<Buffer> {
    if (!this.config.storageAccountName) {
      throw new Error('Storage account name not configured');
    }

    try {
      const token = await this.authenticate();
      const url = `https://${this.config.storageAccountName}.blob.core.windows.net/${containerName}/${blobName}`;

      const response = await this.axiosInstance.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'arraybuffer',
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to download blob: ${error.message}`);
    }
  }

  /**
   * Get configuration
   */
  getConfig(): AzureConfig {
    return { ...this.config };
  }

  /**
   * Check if connected
   */
  isAuthenticated(): boolean {
    return this.token !== null && this.tokenExpiresAt > Date.now();
  }
}

export default AzureAdapter;
