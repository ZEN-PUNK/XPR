import express, { Request, Response } from 'express';
import { listTools, callTool } from './tools';

/**
 * MCP Protocol Handler
 * Supports JSON-RPC 2.0 requests over HTTP POST and SSE
 */

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

// Simple in-memory token store
const validTokens = new Set<string>();

function generateToken(): string {
  const token = `xpr_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  validTokens.add(token);
  return token;
}

function isValidToken(token: string): boolean {
  return validTokens.has(token) || token === 'no-auth-required';
}

/**
 * Handle MCP tools/list request
 */
function handleToolsList(id: string | number): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id,
    result: {
      tools: listTools(),
    },
  };
}

/**
 * Handle MCP tools/call request
 * Returns content in MCP-compliant format with content array
 */
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
    // MCP protocol requires content as array of content items
    return {
      jsonrpc: '2.0',
      id,
      result: {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result.data, null, 2),
          },
        ],
      },
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

/**
 * Handle MCP initialize request
 */
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

/**
 * Main MCP request handler
 */
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
 * Create Express server with MCP endpoints
 */
export function createServer() {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Logging middleware
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
  });

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'proton-mcp-server',
      timestamp: new Date().toISOString(),
    });
  });

  // OAuth authorize endpoint (for Copilot authentication)
  app.get('/authorize', (req: Request, res: Response) => {
    const { code_challenge, state, redirect_uri, response_type, client_id } = req.query;
    
    console.log('[AUTH] Authorize request:', { client_id, response_type });
    
    // Generate authorization code
    const authCode = Buffer.from(`${Date.now()}_${Math.random().toString(36)}`).toString('base64');
    
    try {
      // Redirect back with authorization code
      const redirectUrl = new URL(redirect_uri as string);
      redirectUrl.searchParams.set('code', authCode);
      redirectUrl.searchParams.set('state', state as string);
      
      console.log('[AUTH] Redirecting to:', redirectUrl.toString());
      res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error('[AUTH] Error:', error);
      res.status(400).json({ error: 'Invalid redirect_uri' });
    }
  });

  // OAuth token endpoint (for Copilot token exchange)
  app.post('/token', (req: Request, res: Response) => {
    const { code, grant_type } = req.body;
    
    console.log('[TOKEN] Token request:', { grant_type });
    
    // Generate and return access token
    const accessToken = generateToken();
    
    res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'read write',
    });
  });

  // Token validation endpoint (for internal use)
  app.get('/token/validate', (req: Request, res: Response) => {
    const authHeader = req.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token || !isValidToken(token)) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    
    res.json({ valid: true, token });
  });

  // Root endpoint - handle GET (info) and POST (MCP protocol)
  app.get('/', (req: Request, res: Response) => {
    res.json({
      name: 'Proton Blockchain MCP Server',
      version: '1.0.0',
      description: 'MCP server for Proton blockchain queries',
      endpoints: {
        health: '/health',
        mcp: '/',
        legacy: '/mcp',
      },
    });
  });

  // MCP protocol endpoint (JSON-RPC 2.0) - POST
  app.post('/', async (req: Request, res: Response) => {
    try {
      const request = req.body as JsonRpcRequest;

      // Handle empty/missing requests (Copilot health check)
      if (!request || !request.jsonrpc) {
        res.json({
          jsonrpc: '2.0',
          id: null,
          result: {
            status: 'ok',
          },
        });
        return;
      }

      // Validate JSON-RPC format
      if (request.jsonrpc !== '2.0' || !request.id || !request.method) {
        res.json({
          jsonrpc: '2.0',
          id: request.id || null,
          error: {
            code: -32600,
            message: 'Invalid Request',
          },
        });
        return;
      }

      const response = await handleMcpRequest(request);
      res.json(response);
    } catch (error: any) {
      console.error('MCP handler error:', error);
      res.json({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: 'Internal server error',
          data: {
            error: String(error),
          },
        },
      });
    }
  });

  // MCP protocol endpoint (JSON-RPC 2.0) - legacy /mcp path
  app.post('/mcp', async (req: Request, res: Response) => {
    try {
      const request = req.body as JsonRpcRequest;

      // Handle empty/missing requests (Copilot health check)
      if (!request || !request.jsonrpc) {
        res.json({
          jsonrpc: '2.0',
          id: null,
          result: {
            status: 'ok',
          },
        });
        return;
      }

      // Validate JSON-RPC format
      if (request.jsonrpc !== '2.0' || !request.id || !request.method) {
        res.json({
          jsonrpc: '2.0',
          id: request.id || null,
          error: {
            code: -32600,
            message: 'Invalid Request',
          },
        });
        return;
      }

      const response = await handleMcpRequest(request);
      res.json(response);
    } catch (error: any) {
      console.error('MCP handler error:', error);
      res.json({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: 'Internal server error',
          data: {
            error: String(error),
          },
        },
      });
    }
  });

  return app;
}

/**
 * Start the server
 */
export async function startServer(port: number = 3001) {
  const app = createServer();

  app.listen(port, () => {
    console.log(`\n✅ Proton MCP Server listening on http://localhost:${port}`);
    console.log(`📍 Health: http://localhost:${port}/health`);
    console.log(`📍 MCP Endpoint: http://localhost:${port}/mcp`);
    console.log(`📍 Landing Page: http://localhost:${port}`);
    console.log(`\n📚 See agent.md and task.md for documentation\n`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down...');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down...');
    process.exit(0);
  });
}

export default createServer;
