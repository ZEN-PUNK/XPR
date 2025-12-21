import { startServer } from './server';

// Start MCP server on port 3001
startServer(3001).catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
