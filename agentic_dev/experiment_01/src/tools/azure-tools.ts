/**
 * Azure Tools for MCP Server
 * Provides MCP-compliant tools for Azure operations
 */

import AzureAdapter from '../adapters/azure-adapter';

/**
 * Create Azure resource management tools
 */
export function createAzureTools(azureAdapter: AzureAdapter) {
  return [
    {
      name: 'list_azure_resources',
      description: 'List all resources in the Azure resource group',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
      handler: async () => {
        try {
          const resources = await azureAdapter.listResources();
          return {
            success: true,
            data: resources,
            count: resources.length,
          };
        } catch (error: any) {
          return {
            success: false,
            error: {
              code: 'AZURE_ERROR',
              message: error.message,
              details: {},
            },
          };
        }
      },
    },

    {
      name: 'get_azure_resource',
      description: 'Get details of a specific Azure resource',
      inputSchema: {
        type: 'object',
        properties: {
          resource_name: {
            type: 'string',
            description: 'Name of the resource',
          },
          resource_type: {
            type: 'string',
            description: 'Type of the resource (e.g., Microsoft.Storage/storageAccounts)',
          },
        },
        required: ['resource_name', 'resource_type'],
      },
      handler: async (input: Record<string, any>) => {
        try {
          const resource = await azureAdapter.getResource(input.resource_name, input.resource_type);
          return {
            success: true,
            data: resource,
          };
        } catch (error: any) {
          return {
            success: false,
            error: {
              code: 'AZURE_ERROR',
              message: error.message,
              details: { resource_name: input.resource_name },
            },
          };
        }
      },
    },

    {
      name: 'create_azure_resource',
      description: 'Create or update an Azure resource',
      inputSchema: {
        type: 'object',
        properties: {
          resource_name: {
            type: 'string',
            description: 'Name of the resource',
          },
          resource_type: {
            type: 'string',
            description: 'Type of the resource',
          },
          properties: {
            type: 'object',
            description: 'Properties of the resource',
          },
          location: {
            type: 'string',
            description: 'Azure region (default: eastus)',
          },
        },
        required: ['resource_name', 'resource_type', 'properties'],
      },
      handler: async (input: Record<string, any>) => {
        try {
          const resource = await azureAdapter.createResource(
            input.resource_name,
            input.resource_type,
            input.properties,
            input.location || 'eastus'
          );
          return {
            success: true,
            data: resource,
          };
        } catch (error: any) {
          return {
            success: false,
            error: {
              code: 'AZURE_ERROR',
              message: error.message,
              details: { resource_name: input.resource_name },
            },
          };
        }
      },
    },

    {
      name: 'delete_azure_resource',
      description: 'Delete an Azure resource',
      inputSchema: {
        type: 'object',
        properties: {
          resource_name: {
            type: 'string',
            description: 'Name of the resource',
          },
          resource_type: {
            type: 'string',
            description: 'Type of the resource',
          },
        },
        required: ['resource_name', 'resource_type'],
      },
      handler: async (input: Record<string, any>) => {
        try {
          await azureAdapter.deleteResource(input.resource_name, input.resource_type);
          return {
            success: true,
            message: `Resource ${input.resource_name} deleted successfully`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: {
              code: 'AZURE_ERROR',
              message: error.message,
              details: { resource_name: input.resource_name },
            },
          };
        }
      },
    },

    {
      name: 'get_azure_secret',
      description: 'Retrieve a secret from Azure Key Vault',
      inputSchema: {
        type: 'object',
        properties: {
          secret_name: {
            type: 'string',
            description: 'Name of the secret in Key Vault',
          },
        },
        required: ['secret_name'],
      },
      handler: async (input: Record<string, any>) => {
        try {
          await azureAdapter.getKeyVaultSecret(input.secret_name);
          return {
            success: true,
            secret_name: input.secret_name,
            message: 'Secret retrieved successfully',
          };
        } catch (error: any) {
          return {
            success: false,
            error: {
              code: 'AZURE_ERROR',
              message: error.message,
              details: { secret_name: input.secret_name },
            },
          };
        }
      },
    },

    {
      name: 'set_azure_secret',
      description: 'Store a secret in Azure Key Vault',
      inputSchema: {
        type: 'object',
        properties: {
          secret_name: {
            type: 'string',
            description: 'Name of the secret',
          },
          secret_value: {
            type: 'string',
            description: 'Value of the secret',
          },
        },
        required: ['secret_name', 'secret_value'],
      },
      handler: async (input: Record<string, any>) => {
        try {
          await azureAdapter.setKeyVaultSecret(input.secret_name, input.secret_value);
          return {
            success: true,
            message: `Secret ${input.secret_name} stored successfully`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: {
              code: 'AZURE_ERROR',
              message: error.message,
              details: { secret_name: input.secret_name },
            },
          };
        }
      },
    },

    {
      name: 'upload_azure_blob',
      description: 'Upload a file to Azure Blob Storage',
      inputSchema: {
        type: 'object',
        properties: {
          container_name: {
            type: 'string',
            description: 'Name of the blob container',
          },
          blob_name: {
            type: 'string',
            description: 'Name of the blob file',
          },
          data: {
            type: 'string',
            description: 'Data to upload (base64 encoded)',
          },
        },
        required: ['container_name', 'blob_name', 'data'],
      },
      handler: async (input: Record<string, any>) => {
        try {
          const buffer = Buffer.from(input.data, 'base64');
          const url = await azureAdapter.uploadBlob(input.container_name, input.blob_name, buffer);
          return {
            success: true,
            url,
            container: input.container_name,
            blob: input.blob_name,
          };
        } catch (error: any) {
          return {
            success: false,
            error: {
              code: 'AZURE_ERROR',
              message: error.message,
              details: { container: input.container_name, blob: input.blob_name },
            },
          };
        }
      },
    },

    {
      name: 'download_azure_blob',
      description: 'Download a file from Azure Blob Storage',
      inputSchema: {
        type: 'object',
        properties: {
          container_name: {
            type: 'string',
            description: 'Name of the blob container',
          },
          blob_name: {
            type: 'string',
            description: 'Name of the blob file',
          },
        },
        required: ['container_name', 'blob_name'],
      },
      handler: async (input: Record<string, any>) => {
        try {
          const data = await azureAdapter.downloadBlob(input.container_name, input.blob_name);
          return {
            success: true,
            data: data.toString('base64'),
            container: input.container_name,
            blob: input.blob_name,
            size: data.length,
          };
        } catch (error: any) {
          return {
            success: false,
            error: {
              code: 'AZURE_ERROR',
              message: error.message,
              details: { container: input.container_name, blob: input.blob_name },
            },
          };
        }
      },
    },
  ];
}

export default createAzureTools;
