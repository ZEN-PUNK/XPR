/**
 * Producer Tools
 * 
 * MCP tools for block producer queries on Proton blockchain
 */

import { 
  getProducers, 
  getProducerSchedule, 
  getActivatedProtocolFeatures 
} from '../adapters/producer-adapter';

/**
 * Get block producers list
 */
export const getProducersTool = {
  name: 'get_producers',
  description: 'Get list of block producers with voting information, rankings, and status',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Max producers to return (default: 50)',
      },
      lower_bound: {
        type: 'string',
        description: 'Start from this producer name',
      },
    },
    required: [],
  },
  handler: async (params: any) => {
    try {
      const data = await getProducers({
        limit: params.limit,
        lower_bound: params.lower_bound,
      });
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: { code: 'PRODUCER_ERROR', message: String(error), details: {} } };
    }
  },
};

/**
 * Get producer schedule
 */
export const getProducerScheduleTool = {
  name: 'get_producer_schedule',
  description: 'Get the current active producer schedule (who produces blocks)',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
  handler: async () => {
    try {
      const data = await getProducerSchedule();
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: { code: 'SCHEDULE_ERROR', message: String(error), details: {} } };
    }
  },
};

/**
 * Get activated protocol features
 */
export const getProtocolFeaturesTool = {
  name: 'get_protocol_features',
  description: 'Get list of activated protocol features on the chain',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Max features to return (default: 100)',
      },
    },
    required: [],
  },
  handler: async (params: any) => {
    try {
      const data = await getActivatedProtocolFeatures({
        limit: params.limit,
      });
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: { code: 'FEATURE_ERROR', message: String(error), details: {} } };
    }
  },
};

export const producerTools = [
  getProducersTool,
  getProducerScheduleTool,
  getProtocolFeaturesTool,
];
