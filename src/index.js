#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { XPRClient } from './xpr-client.js';

/**
 * MCP Server for XPR Network
 * Provides tools to interact with the XPR (Proton) blockchain
 */
class XPRMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'xpr-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.xprClient = new XPRClient();
    this.setupHandlers();
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_chain_info',
          description: 'Get XPR blockchain information including chain ID, head block, and more',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_account',
          description: 'Get detailed information about an XPR account',
          inputSchema: {
            type: 'object',
            properties: {
              account_name: {
                type: 'string',
                description: 'The account name to query',
              },
            },
            required: ['account_name'],
          },
        },
        {
          name: 'get_balance',
          description: 'Get token balance for an account',
          inputSchema: {
            type: 'object',
            properties: {
              account: {
                type: 'string',
                description: 'The account name',
              },
              code: {
                type: 'string',
                description: 'Token contract account (default: eosio.token)',
              },
              symbol: {
                type: 'string',
                description: 'Token symbol (default: XPR)',
              },
            },
            required: ['account'],
          },
        },
        {
          name: 'get_block',
          description: 'Get block information by block number or ID',
          inputSchema: {
            type: 'object',
            properties: {
              block_num_or_id: {
                type: 'string',
                description: 'Block number or block ID',
              },
            },
            required: ['block_num_or_id'],
          },
        },
        {
          name: 'get_transaction',
          description: 'Get transaction information by transaction ID',
          inputSchema: {
            type: 'object',
            properties: {
              transaction_id: {
                type: 'string',
                description: 'Transaction ID',
              },
            },
            required: ['transaction_id'],
          },
        },
        {
          name: 'get_table_rows',
          description: 'Get rows from a smart contract table',
          inputSchema: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'Contract account name',
              },
              scope: {
                type: 'string',
                description: 'Table scope',
              },
              table: {
                type: 'string',
                description: 'Table name',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of rows to return (default: 10)',
              },
              lower_bound: {
                type: 'string',
                description: 'Lower bound for the query',
              },
              upper_bound: {
                type: 'string',
                description: 'Upper bound for the query',
              },
            },
            required: ['code', 'scope', 'table'],
          },
        },
        {
          name: 'get_actions',
          description: 'Get account transaction history/actions',
          inputSchema: {
            type: 'object',
            properties: {
              account_name: {
                type: 'string',
                description: 'Account name',
              },
              pos: {
                type: 'number',
                description: 'Position to start from (default: -1 for most recent)',
              },
              offset: {
                type: 'number',
                description: 'Number of actions to retrieve (negative for backwards, default: -20)',
              },
            },
            required: ['account_name'],
          },
        },
        {
          name: 'get_abi',
          description: 'Get the ABI (Application Binary Interface) for a smart contract',
          inputSchema: {
            type: 'object',
            properties: {
              account_name: {
                type: 'string',
                description: 'Contract account name',
              },
            },
            required: ['account_name'],
          },
        },
        {
          name: 'get_producers',
          description: 'Get list of block producers',
          inputSchema: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Maximum number of producers to return (default: 50)',
              },
            },
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case 'get_chain_info': {
            const info = await this.xprClient.getInfo();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(info, null, 2),
                },
              ],
            };
          }

          case 'get_account': {
            const account = await this.xprClient.getAccount(args.account_name);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(account, null, 2),
                },
              ],
            };
          }

          case 'get_balance': {
            const balance = await this.xprClient.getCurrencyBalance(
              args.account,
              args.code,
              args.symbol
            );
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(balance, null, 2),
                },
              ],
            };
          }

          case 'get_block': {
            const block = await this.xprClient.getBlock(args.block_num_or_id);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(block, null, 2),
                },
              ],
            };
          }

          case 'get_transaction': {
            const tx = await this.xprClient.getTransaction(args.transaction_id);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(tx, null, 2),
                },
              ],
            };
          }

          case 'get_table_rows': {
            const rows = await this.xprClient.getTableRows(
              args.code,
              args.scope,
              args.table,
              {
                limit: args.limit,
                lower_bound: args.lower_bound,
                upper_bound: args.upper_bound,
              }
            );
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(rows, null, 2),
                },
              ],
            };
          }

          case 'get_actions': {
            const actions = await this.xprClient.getActions(
              args.account_name,
              args.pos,
              args.offset
            );
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(actions, null, 2),
                },
              ],
            };
          }

          case 'get_abi': {
            const abi = await this.xprClient.getAbi(args.account_name);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(abi, null, 2),
                },
              ],
            };
          }

          case 'get_producers': {
            const producers = await this.xprClient.getProducers(args.limit);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(producers, null, 2),
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('XPR MCP Server running on stdio');
  }
}

// Run the server if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new XPRMCPServer();
  server.run().catch(console.error);
}

export { XPRMCPServer };
