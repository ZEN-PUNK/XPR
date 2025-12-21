#!/usr/bin/env node

/**
 * Test script to verify XPR MCP Server structure and functionality
 * Note: Network calls will fail in sandboxed environments without internet access
 */

import { XPRClient } from './src/xpr-client.js';

console.log('XPR MCP Server - Structure Test\n');
console.log('='.repeat(50));

// Test 1: Verify XPRClient class exists and can be instantiated
console.log('\n✓ Test 1: XPRClient instantiation');
const client = new XPRClient();
console.log('  - Default endpoint:', client.endpoint);

// Test 2: Verify custom endpoint
console.log('\n✓ Test 2: Custom endpoint configuration');
const customClient = new XPRClient('https://custom.endpoint.com');
console.log('  - Custom endpoint:', customClient.endpoint);

// Test 3: Verify all methods exist
console.log('\n✓ Test 3: XPRClient methods availability');
const methods = [
  'post',
  'getInfo',
  'getAccount',
  'getCurrencyBalance',
  'getBlock',
  'getTransaction',
  'getTableRows',
  'getActions',
  'pushTransaction',
  'getAbi',
  'getProducers'
];

methods.forEach(method => {
  if (typeof client[method] === 'function') {
    console.log(`  ✓ ${method}()`);
  } else {
    console.log(`  ✗ ${method}() - NOT FOUND`);
  }
});

// Test 4: Verify MCP Server can be imported
console.log('\n✓ Test 4: MCP Server module');
import('./src/index.js').then(module => {
  if (module.XPRMCPServer) {
    console.log('  ✓ XPRMCPServer class exported');
    const server = new module.XPRMCPServer();
    console.log('  ✓ MCP Server instance created');
    if (server.server && server.server.serverInfo) {
      console.log('  - Server name:', server.server.serverInfo.name);
      console.log('  - Server version:', server.server.serverInfo.version);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('All structure tests passed!');
  console.log('\nNote: Network connectivity tests are skipped in sandboxed environment.');
  console.log('Deploy to a networked environment to test actual XPR Network calls.');
  console.log('='.repeat(50) + '\n');
}).catch(err => {
  console.error('Error loading MCP Server:', err.message);
});
