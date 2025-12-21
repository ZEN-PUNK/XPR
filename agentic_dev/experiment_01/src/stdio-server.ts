#!/usr/bin/env node
/**
 * Stdio-based MCP Server for Proton Blockchain
 * 
 * This server communicates via stdin/stdout, which is the native
 * MCP transport and works better with Copilot in Codespaces.
 */

import { listTools, callTool } from './tools';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

function handleInitialize(id: string | number): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id,
    result: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
        resources: {},
      },
      serverInfo: {
        name: 'proton-mcp-server',
        version: '1.0.0',
      },
    },
  };
}

function handleToolsList(id: string | number): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id,
    result: {
      tools: listTools(),
    },
  };
}

async function handleToolCall(
  id: string | number,
  params: any
): Promise<JsonRpcResponse> {
  const { name, arguments: args } = params;

  if (!name) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32602,
        message: 'Invalid params: missing "name" field',
      },
    };
  }

  const result = await callTool(name, args || {});

  if (result.success) {
    return {
      jsonrpc: '2.0',
      id,
      result: result.data,
    };
  } else {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: result.error.message || 'Tool execution failed',
        data: result.error,
      },
    };
  }
}

async function handleMcpRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
  const { id, method, params } = request;

  switch (method) {
    case 'initialize':
      return handleInitialize(id);

    case 'tools/list':
      return handleToolsList(id);

    case 'tools/call':
      return await handleToolCall(id, params);

    default:
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`,
        },
      };
  }
}

/**
 * Start stdio server
 * Reads JSON-RPC from stdin, writes responses to stdout
 */
async function startStdioServer() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: null, // Don't use stdout for readline
    terminal: false,
  });

  rl.on('line', async (line: string) => {
    try {
      if (!line.trim()) return;
      
      const request = JSON.parse(line) as JsonRpcRequest;
      const response = await handleMcpRequest(request);
      process.stdout.write(JSON.stringify(response) + '\n');
    } catch (error: any) {
      const errorResponse = {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: 'Internal server error',
          data: error.message,
        },
      };
      process.stdout.write(JSON.stringify(errorResponse) + '\n');
    }
  });

  rl.on('close', () => {
    process.exit(0);
  });

  // Handle errors
  rl.on('error', (error: any) => {
    const errorResponse = {
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32603,
        message: 'Readline error',
        data: error.message,
      },
    };
    process.stdout.write(JSON.stringify(errorResponse) + '\n');
  });
}

// Start server
startStdioServer().catch((error) => {
  const errorResponse = {
    jsonrpc: '2.0',
    id: null,
    error: {
      code: -32603,
      message: 'Fatal error',
      data: error.message,
    },
  };
  process.stdout.write(JSON.stringify(errorResponse) + '\n');
  process.exit(1);
});
