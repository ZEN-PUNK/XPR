/**
 * NFT Tools
 * 
 * MCP tools for AtomicAssets NFT queries on Proton blockchain
 */

import { 
  getAccountNFTs, 
  getNFTTemplates, 
  getNFTCollections,
  getNFTAsset,
  getNFTSchemas 
} from '../adapters/nft-adapter';

/**
 * Get NFTs owned by an account
 */
export const getAccountNFTsTool = {
  name: 'get_account_nfts',
  description: 'Get all NFTs (AtomicAssets) owned by a Proton account',
  inputSchema: {
    type: 'object',
    properties: {
      account: {
        type: 'string',
        description: 'Proton account name',
      },
      collection: {
        type: 'string',
        description: 'Optional: filter by collection name',
      },
      limit: {
        type: 'number',
        description: 'Max NFTs to return (default: 100)',
      },
    },
    required: ['account'],
  },
  handler: async (params: any) => {
    try {
      const data = await getAccountNFTs(params.account, {
        collection: params.collection,
        limit: params.limit,
      });
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: { code: 'NFT_ERROR', message: String(error), details: {} } };
    }
  },
};

/**
 * Get NFT templates in a collection
 */
export const getNFTTemplatesTool = {
  name: 'get_nft_templates',
  description: 'Get NFT templates for a collection (blueprints for minting NFTs)',
  inputSchema: {
    type: 'object',
    properties: {
      collection: {
        type: 'string',
        description: 'Collection name',
      },
      schema: {
        type: 'string',
        description: 'Optional: filter by schema name',
      },
      limit: {
        type: 'number',
        description: 'Max templates to return (default: 100)',
      },
    },
    required: ['collection'],
  },
  handler: async (params: any) => {
    try {
      const data = await getNFTTemplates(params.collection, {
        schema: params.schema,
        limit: params.limit,
      });
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: { code: 'TEMPLATE_ERROR', message: String(error), details: {} } };
    }
  },
};

/**
 * Get NFT collections
 */
export const getNFTCollectionsTool = {
  name: 'get_nft_collections',
  description: 'Get NFT collections from AtomicAssets (optionally filter by author)',
  inputSchema: {
    type: 'object',
    properties: {
      author: {
        type: 'string',
        description: 'Optional: filter by collection author/creator',
      },
      limit: {
        type: 'number',
        description: 'Max collections to return (default: 100)',
      },
    },
    required: [],
  },
  handler: async (params: any) => {
    try {
      const data = await getNFTCollections({
        author: params.author,
        limit: params.limit,
      });
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: { code: 'COLLECTION_ERROR', message: String(error), details: {} } };
    }
  },
};

/**
 * Get specific NFT asset by ID
 */
export const getNFTAssetTool = {
  name: 'get_nft_asset',
  description: 'Get detailed information about a specific NFT asset by ID',
  inputSchema: {
    type: 'object',
    properties: {
      asset_id: {
        type: 'string',
        description: 'NFT asset ID',
      },
    },
    required: ['asset_id'],
  },
  handler: async (params: any) => {
    try {
      const data = await getNFTAsset(params.asset_id);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: { code: 'ASSET_ERROR', message: String(error), details: {} } };
    }
  },
};

/**
 * Get schemas for a collection
 */
export const getNFTSchemasTool = {
  name: 'get_nft_schemas',
  description: 'Get schemas (attribute definitions) for an NFT collection',
  inputSchema: {
    type: 'object',
    properties: {
      collection: {
        type: 'string',
        description: 'Collection name',
      },
    },
    required: ['collection'],
  },
  handler: async (params: any) => {
    try {
      const data = await getNFTSchemas(params.collection);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: { code: 'SCHEMA_ERROR', message: String(error), details: {} } };
    }
  },
};

export const nftTools = [
  getAccountNFTsTool,
  getNFTTemplatesTool,
  getNFTCollectionsTool,
  getNFTAssetTool,
  getNFTSchemasTool,
];
