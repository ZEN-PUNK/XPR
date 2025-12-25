# Architecture Improvements

This document tracks identified improvements to the XPR MCP Server architecture, prioritized by impact and effort.

## Summary

| Priority | Count | Description |
|----------|-------|-------------|
| 🔴 High  | 5     | Critical for production readiness |
| 🟡 Medium| 8     | Important but not blocking |
| 🟢 Low   | 7     | Nice to have, future enhancements |

## High Priority Improvements

### 1. Configuration Management System

**Status**: ❌ Not Started  
**Priority**: 🔴 High  
**Effort**: Medium (1-2 days)  
**Category**: Infrastructure

**Problem**:
- Hardcoded XPR endpoint in source code
- No environment-based configuration
- Cannot easily switch between dev/staging/prod environments
- No support for different endpoints or settings per deployment

**Proposed Solution**:
- Implement environment variable configuration
- Create `.env` file support
- Add configuration validation at startup
- Support for multiple environments

**Implementation**:
```javascript
// config.js
export const config = {
  xprEndpoint: process.env.XPR_ENDPOINT || 'https://proton.eoscafeblock.com',
  port: process.env.PORT || 3000,
  logLevel: process.env.LOG_LEVEL || 'info',
  environment: process.env.NODE_ENV || 'development',
  cache: {
    enabled: process.env.CACHE_ENABLED === 'true',
    ttl: parseInt(process.env.CACHE_TTL || '300', 10)
  }
};
```

**Expected Impact**:
- ✅ Easy environment switching
- ✅ Better security (no hardcoded values)
- ✅ Simplified deployment
- ✅ Runtime configuration updates

**References**: [ADR-001](./decisions/001-configuration-management.md)

---

### 2. Error Handling & Retry Logic

**Status**: ❌ Not Started  
**Priority**: 🔴 High  
**Effort**: Medium (2-3 days)  
**Category**: Reliability

**Problem**:
- No retry mechanism for transient failures
- Basic error messages without context
- Network failures cause immediate errors
- No exponential backoff or circuit breaker

**Proposed Solution**:
- Implement retry logic with exponential backoff
- Add circuit breaker pattern for Proton API
- Enhanced error messages with context
- Error categorization (retryable vs non-retryable)

**Implementation**:
```javascript
// utils/retry.js
export async function withRetry(fn, options = {}) {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry = () => {}
  } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts || !isRetryable(error)) {
        throw error;
      }
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      onRetry(attempt, delay, error);
      await sleep(delay);
    }
  }
}
```

**Expected Impact**:
- ✅ Improved reliability (transient failures auto-recover)
- ✅ Better user experience
- ✅ Reduced error rates
- ✅ More resilient system

---

### 3. Security Hardening for Azure Functions

**Status**: ❌ Not Started  
**Priority**: 🔴 High  
**Effort**: Medium (2-3 days)  
**Category**: Security

**Problem**:
- Azure Functions use anonymous auth level (publicly accessible)
- No API key requirement
- No rate limiting
- No input validation/sanitization
- Potential for abuse and DoS attacks

**Proposed Solution**:
- Change auth level to function or system
- Implement API key authentication
- Add rate limiting middleware
- Input validation layer
- CORS configuration

**Implementation**:
```javascript
// middleware/auth.js
export function validateApiKey(request) {
  const apiKey = request.headers.get('x-api-key');
  const validKeys = process.env.ALLOWED_API_KEYS?.split(',') || [];
  
  if (!validKeys.includes(apiKey)) {
    throw new Error('Invalid API key');
  }
}

// middleware/rateLimiter.js
const rateLimiter = new Map();

export function checkRateLimit(clientId, maxRequests = 100, windowMs = 60000) {
  const now = Date.now();
  const clientData = rateLimiter.get(clientId) || { count: 0, resetTime: now + windowMs };
  
  if (now > clientData.resetTime) {
    clientData.count = 0;
    clientData.resetTime = now + windowMs;
  }
  
  if (clientData.count >= maxRequests) {
    throw new Error('Rate limit exceeded');
  }
  
  clientData.count++;
  rateLimiter.set(clientId, clientData);
}
```

**Expected Impact**:
- ✅ Protected endpoints
- ✅ Prevented abuse
- ✅ Better security posture
- ✅ Cost control (prevent spam)

---

### 4. Structured Logging & Monitoring

**Status**: ❌ Not Started  
**Priority**: 🔴 High  
**Effort**: Medium (2-3 days)  
**Category**: Observability

**Problem**:
- Basic console.error/context.error logging
- No structured log format
- No correlation IDs for request tracing
- No metrics collection
- Difficult to debug production issues

**Proposed Solution**:
- Implement structured logging (JSON format)
- Add correlation IDs to all requests
- Integrate with Azure Application Insights
- Add performance metrics
- Request/response logging

**Implementation**:
```javascript
// utils/logger.js
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label })
  },
  timestamp: pino.stdTimeFunctions.isoTime
});

// middleware/logging.js
export function withLogging(handler) {
  return async (request, context) => {
    const correlationId = crypto.randomUUID();
    const startTime = Date.now();
    
    logger.info({
      correlationId,
      method: request.method,
      url: request.url,
      event: 'request_start'
    });
    
    try {
      const result = await handler(request, context);
      const duration = Date.now() - startTime;
      
      logger.info({
        correlationId,
        duration,
        status: result.status,
        event: 'request_complete'
      });
      
      return result;
    } catch (error) {
      logger.error({
        correlationId,
        error: error.message,
        stack: error.stack,
        event: 'request_error'
      });
      throw error;
    }
  };
}
```

**Expected Impact**:
- ✅ Better debugging capabilities
- ✅ Performance monitoring
- ✅ Easier troubleshooting
- ✅ Compliance and audit trails

---

### 5. Input Validation Layer

**Status**: ❌ Not Started  
**Priority**: 🔴 High  
**Effort**: Small (1 day)  
**Category**: Security/Reliability

**Problem**:
- Basic parameter extraction without validation
- No schema validation for inputs
- Type coercion errors possible
- Potential for injection attacks

**Proposed Solution**:
- Schema validation library (Zod, Joi, or Yup)
- Validate all inputs against schemas
- Proper error messages for invalid inputs
- Sanitization of string inputs

**Implementation**:
```javascript
// validators/schemas.js
import { z } from 'zod';

export const accountSchema = z.object({
  account_name: z.string().min(1).max(13).regex(/^[a-z1-5.]+$/)
});

export const balanceSchema = z.object({
  account: z.string().min(1).max(13),
  code: z.string().optional().default('eosio.token'),
  symbol: z.string().optional().default('XPR')
});

// middleware/validator.js
export function validate(schema) {
  return (data) => {
    const result = schema.safeParse(data);
    if (!result.success) {
      throw new ValidationError(result.error.issues);
    }
    return result.data;
  };
}
```

**Expected Impact**:
- ✅ Prevented invalid requests
- ✅ Better error messages
- ✅ Improved security
- ✅ Type safety

---

## Medium Priority Improvements

### 6. Caching Layer

**Status**: ❌ Not Started  
**Priority**: 🟡 Medium  
**Effort**: Medium (2-3 days)  
**Category**: Performance

**Problem**:
- Every request hits Proton API
- Frequently accessed data re-fetched
- Higher latency and load on external API
- Unnecessary costs

**Proposed Solution**:
- In-memory cache (node-cache or lru-cache)
- Redis for distributed caching (Azure Functions)
- Configurable TTL per endpoint
- Cache invalidation strategies

**Implementation**:
```javascript
// utils/cache.js
import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: 300, // 5 minutes default
  checkperiod: 60
});

export async function cached(key, ttl, fetchFn) {
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }
  
  const value = await fetchFn();
  cache.set(key, value, ttl);
  return value;
}
```

**Expected Impact**:
- ✅ Reduced latency (10-50ms vs 100-500ms)
- ✅ Lower load on Proton API
- ✅ Better user experience
- ✅ Cost savings

---

### 7. Code Deduplication in Azure Functions

**Status**: ❌ Not Started  
**Priority**: 🟡 Medium  
**Effort**: Small (1 day)  
**Category**: Maintainability

**Problem**:
- Repetitive error handling in each function
- Duplicate parameter extraction logic
- Hard to maintain consistency
- More code to test

**Proposed Solution**:
- Create middleware/wrapper functions
- Shared error handling
- Generic parameter extraction
- Higher-order function pattern

**Implementation**:
```javascript
// functions/middleware.js
export function createHandler(toolName, paramExtractor) {
  return async (request, context) => {
    try {
      const params = await paramExtractor(request);
      const result = await xprClient[toolName](params);
      
      return {
        status: 200,
        jsonBody: result
      };
    } catch (error) {
      context.error(`Error in ${toolName}:`, error);
      return {
        status: 500,
        jsonBody: { error: error.message }
      };
    }
  };
}

// Usage
app.http('getAccount', {
  methods: ['GET', 'POST'],
  handler: createHandler('getAccount', extractAccountParams)
});
```

**Expected Impact**:
- ✅ Less code duplication
- ✅ Easier maintenance
- ✅ Consistent behavior
- ✅ Faster development

---

### 8. TypeScript Migration

**Status**: ❌ Not Started  
**Priority**: 🟡 Medium  
**Effort**: Large (5-7 days)  
**Category**: Code Quality

**Problem**:
- JavaScript lacks type safety
- Runtime errors for type mismatches
- No IDE autocomplete for API responses
- Harder to refactor

**Proposed Solution**:
- Gradual migration to TypeScript
- Start with interfaces for API responses
- Add types to XPRClient
- Strict type checking

**Implementation**:
```typescript
// types/xpr.ts
export interface ChainInfo {
  chain_id: string;
  head_block_num: number;
  head_block_time: string;
  head_block_producer: string;
  // ... other fields
}

export interface Account {
  account_name: string;
  head_block_num: number;
  core_liquid_balance: string;
  ram_quota: number;
  net_weight: number;
  cpu_weight: number;
  // ... other fields
}

// xpr-client.ts
export class XPRClient {
  async getInfo(): Promise<ChainInfo> {
    return await this.post('/v1/chain/get_info', {});
  }
  
  async getAccount(accountName: string): Promise<Account> {
    return await this.post('/v1/chain/get_account', {
      account_name: accountName
    });
  }
}
```

**Expected Impact**:
- ✅ Fewer runtime errors
- ✅ Better IDE support
- ✅ Improved code quality
- ✅ Easier refactoring

---

### 9. Connection Pooling

**Status**: ❌ Not Started  
**Priority**: 🟡 Medium  
**Effort**: Small (1 day)  
**Category**: Performance

**Problem**:
- New HTTP connection for each request
- Connection overhead (TCP handshake, TLS)
- Slower requests
- Resource waste

**Proposed Solution**:
- HTTP agent with connection pooling
- Reuse connections across requests
- Configurable pool size

**Implementation**:
```javascript
// xpr-client.js
import fetch from 'node-fetch';
import http from 'http';
import https from 'https';

const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 50
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50
});

export class XPRClient {
  async post(path, data) {
    const response = await fetch(`${this.endpoint}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      agent: this.endpoint.startsWith('https') ? httpsAgent : httpAgent
    });
    // ...
  }
}
```

**Expected Impact**:
- ✅ Faster requests (reduce 20-50ms per request)
- ✅ Better resource utilization
- ✅ Higher throughput

---

### 10. Health Check Endpoints

**Status**: ❌ Not Started  
**Priority**: 🟡 Medium  
**Effort**: Small (0.5 days)  
**Category**: Observability

**Problem**:
- No way to check if MCP server is healthy
- No dependency health checks
- Cannot detect if Proton API is down
- Poor monitoring integration

**Proposed Solution**:
- Add `/health` endpoint
- Check dependencies (Proton API connectivity)
- Return detailed health status
- Integrate with monitoring systems

**Implementation**:
```javascript
// health.js
export async function checkHealth() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {}
  };
  
  // Check Proton API
  try {
    const start = Date.now();
    await xprClient.getInfo();
    checks.checks.protonApi = {
      status: 'up',
      responseTime: Date.now() - start
    };
  } catch (error) {
    checks.status = 'unhealthy';
    checks.checks.protonApi = {
      status: 'down',
      error: error.message
    };
  }
  
  return checks;
}
```

**Expected Impact**:
- ✅ Better monitoring
- ✅ Faster incident detection
- ✅ Automated health checks

---

### 11. Request/Response Documentation

**Status**: ❌ Not Started  
**Priority**: 🟡 Medium  
**Effort**: Medium (2 days)  
**Category**: Documentation

**Problem**:
- No API documentation
- Unclear request/response formats
- Hard for users to integrate
- No OpenAPI/Swagger spec

**Proposed Solution**:
- Generate OpenAPI specification
- Add JSDoc comments
- Create API reference documentation
- Example requests/responses

**Implementation**:
```javascript
/**
 * Get account information
 * @param {string} accountName - The account name to query
 * @returns {Promise<Account>} Account details
 * @example
 * const account = await client.getAccount('proton');
 * // Returns: { account_name: 'proton', core_liquid_balance: '1000.0000 XPR', ... }
 */
async getAccount(accountName) {
  return await this.post('/v1/chain/get_account', {
    account_name: accountName
  });
}
```

**Expected Impact**:
- ✅ Easier integration
- ✅ Better developer experience
- ✅ Reduced support requests

---

### 12. Response Caching Headers

**Status**: ❌ Not Started  
**Priority**: 🟡 Medium  
**Effort**: Small (0.5 days)  
**Category**: Performance

**Problem**:
- No HTTP caching headers
- Clients cannot cache responses
- Unnecessary repeated requests
- Higher server load

**Proposed Solution**:
- Add appropriate cache-control headers
- ETag support
- Conditional requests (If-None-Match)

**Implementation**:
```javascript
app.http('getAccount', {
  handler: async (request, context) => {
    const account = await xprClient.getAccount(accountName);
    return {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60',
        'ETag': generateETag(account)
      },
      jsonBody: account
    };
  }
});
```

**Expected Impact**:
- ✅ Reduced server load
- ✅ Better client performance
- ✅ Lower bandwidth usage

---

### 13. Graceful Shutdown

**Status**: ❌ Not Started  
**Priority**: 🟡 Medium  
**Effort**: Small (0.5 days)  
**Category**: Reliability

**Problem**:
- Abrupt process termination
- In-flight requests may fail
- No cleanup on shutdown

**Proposed Solution**:
- Handle SIGTERM/SIGINT signals
- Wait for in-flight requests to complete
- Close connections gracefully
- Timeout for forced shutdown

**Implementation**:
```javascript
// server.js
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Stop accepting new requests
  server.close(() => {
    logger.info('HTTP server closed');
  });
  
  // Wait for in-flight requests (max 30s)
  await Promise.race([
    waitForInFlightRequests(),
    sleep(30000)
  ]);
  
  process.exit(0);
});
```

**Expected Impact**:
- ✅ No failed requests during deployment
- ✅ Better reliability
- ✅ Cleaner shutdowns

---

## Low Priority Improvements

### 14. Request Batching

**Status**: ❌ Not Started  
**Priority**: 🟢 Low  
**Effort**: Medium (3 days)  
**Category**: Performance

**Problem**:
- Multiple sequential requests are slow
- No way to batch operations
- Higher latency for bulk operations

**Proposed Solution**:
- Add batch endpoint
- Support multiple operations in one request
- Parallel execution

**Expected Impact**:
- ✅ Faster bulk operations
- ✅ Reduced latency

---

### 15. WebSocket Support

**Status**: ❌ Not Started  
**Priority**: 🟢 Low  
**Effort**: Large (5-7 days)  
**Category**: Feature

**Problem**:
- No real-time updates
- Polling required for changes
- Higher latency for live data

**Proposed Solution**:
- Add WebSocket endpoint
- Subscribe to blockchain events
- Push updates to clients

**Expected Impact**:
- ✅ Real-time updates
- ✅ Better user experience
- ✅ Reduced polling overhead

---

### 16. GraphQL API

**Status**: ❌ Not Started  
**Priority**: 🟢 Low  
**Effort**: Large (7-10 days)  
**Category**: Feature

**Problem**:
- REST API requires multiple requests for related data
- Over-fetching or under-fetching
- No flexible query language

**Proposed Solution**:
- Add GraphQL endpoint
- Define schema for blockchain data
- Enable flexible queries

**Expected Impact**:
- ✅ Flexible queries
- ✅ Better developer experience
- ✅ Reduced requests

---

### 17. Multi-Endpoint Support

**Status**: ❌ Not Started  
**Priority**: 🟢 Low  
**Effort**: Medium (2-3 days)  
**Category**: Reliability

**Problem**:
- Single Proton API endpoint
- No failover if endpoint is down
- No load balancing

**Proposed Solution**:
- Support multiple endpoints
- Automatic failover
- Health-based routing

**Expected Impact**:
- ✅ Better availability
- ✅ Load distribution
- ✅ Resilience

---

### 18. Prometheus Metrics

**Status**: ❌ Not Started  
**Priority**: 🟢 Low  
**Effort**: Small (1 day)  
**Category**: Observability

**Problem**:
- No metrics endpoint
- Cannot integrate with Prometheus/Grafana
- Limited visibility

**Proposed Solution**:
- Add `/metrics` endpoint
- Expose key metrics (requests, latency, errors)
- Prometheus format

**Expected Impact**:
- ✅ Better monitoring
- ✅ Grafana dashboards
- ✅ Alerting capabilities

---

### 19. API Versioning

**Status**: ❌ Not Started  
**Priority**: 🟢 Low  
**Effort**: Medium (2-3 days)  
**Category**: Maintainability

**Problem**:
- No API versioning strategy
- Breaking changes affect all clients
- Cannot deprecate endpoints gracefully

**Proposed Solution**:
- URL-based versioning (/v1/, /v2/)
- Version headers
- Deprecation warnings

**Expected Impact**:
- ✅ Backward compatibility
- ✅ Smoother migrations
- ✅ Better client experience

---

### 20. Performance Testing Suite

**Status**: ❌ Not Started  
**Priority**: 🟢 Low  
**Effort**: Medium (3-4 days)  
**Category**: Testing

**Problem**:
- No performance benchmarks
- Unknown throughput limits
- Cannot detect performance regressions

**Proposed Solution**:
- Load testing with k6 or Artillery
- Benchmark suite
- CI/CD integration

**Expected Impact**:
- ✅ Known performance characteristics
- ✅ Regression detection
- ✅ Capacity planning

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- ✅ Configuration Management (#1)
- ✅ Error Handling & Retry Logic (#2)
- ✅ Input Validation (#5)

### Phase 2: Security & Reliability (Weeks 3-4)
- ✅ Security Hardening (#3)
- ✅ Structured Logging (#4)
- ✅ Health Checks (#10)

### Phase 3: Performance (Weeks 5-6)
- ✅ Caching Layer (#6)
- ✅ Connection Pooling (#9)
- ✅ Response Caching Headers (#12)

### Phase 4: Code Quality (Weeks 7-8)
- ✅ Code Deduplication (#7)
- ✅ TypeScript Migration (#8)
- ✅ Documentation (#11)

### Phase 5: Advanced Features (Future)
- ⏸️ Request Batching (#14)
- ⏸️ WebSocket Support (#15)
- ⏸️ GraphQL API (#16)
- ⏸️ Multi-Endpoint Support (#17)

## Metrics for Success

Track these metrics to measure improvement impact:

| Metric | Current | Target | Notes |
|--------|---------|--------|-------|
| API Latency (p95) | ~500ms | <200ms | With caching |
| Error Rate | Unknown | <0.1% | With retry logic |
| Uptime | Unknown | 99.9% | With monitoring |
| Security Score | Low | High | With auth & validation |
| Code Coverage | 0% | >80% | With tests |
| Documentation Coverage | 20% | 90% | API docs |

## Contributing

To propose a new improvement:

1. Add it to this document with all fields filled
2. Discuss in team meeting or PR
3. Create ADR if significant architectural change
4. Update status as work progresses

## References

- [Current Architecture](./CURRENT_ARCHITECTURE.md)
- [Decision Records](./decisions/)
- [Migration Guides](./migrations/)
