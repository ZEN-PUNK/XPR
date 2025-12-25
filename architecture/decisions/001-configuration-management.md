# ADR-001: Adopt Environment-Based Configuration Management

**Status**: Proposed  
**Date**: 2025-12-25  
**Deciders**: Development Team  
**Category**: Infrastructure

## Context

The current implementation hardcodes configuration values directly in source code:

```javascript
// src/xpr-client.js
export class XPRClient {
  constructor(endpoint = 'https://proton.eoscafeblock.com') {
    this.endpoint = endpoint;
  }
}
```

This approach has several issues:

1. **Environment Management**: Cannot easily switch between dev/staging/prod environments
2. **Security**: Sensitive values could end up in source control
3. **Deployment**: Requires code changes to update configuration
4. **Flexibility**: Different deployments (local, Azure) need different configs
5. **12-Factor App**: Violates principle of configuration via environment

## Decision

Implement environment-based configuration management using:

1. **Environment Variables**: Primary configuration source
2. **`.env` file**: Local development configuration (git-ignored)
3. **Configuration Module**: Centralized config with validation
4. **Type Safety**: Strong typing for configuration values
5. **Defaults**: Sensible defaults for development

### Configuration Structure

```javascript
// config/index.js
export const config = {
  // XPR Network
  xpr: {
    endpoint: process.env.XPR_ENDPOINT || 'https://proton.eoscafeblock.com',
    timeout: parseInt(process.env.XPR_TIMEOUT || '30000', 10),
    retryAttempts: parseInt(process.env.XPR_RETRY_ATTEMPTS || '3', 10)
  },
  
  // Server
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    environment: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info'
  },
  
  // Caching
  cache: {
    enabled: process.env.CACHE_ENABLED === 'true',
    ttl: parseInt(process.env.CACHE_TTL || '300', 10),
    redisUrl: process.env.REDIS_URL // Optional for distributed cache
  },
  
  // Security
  security: {
    apiKeys: process.env.ALLOWED_API_KEYS?.split(',') || [],
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
  }
};

// Validation
export function validateConfig() {
  const errors = [];
  
  if (!config.xpr.endpoint.startsWith('http')) {
    errors.push('XPR_ENDPOINT must be a valid HTTP(S) URL');
  }
  
  if (config.server.port < 1 || config.server.port > 65535) {
    errors.push('PORT must be between 1 and 65535');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}
```

### Example `.env` File

```bash
# XPR Network Configuration
XPR_ENDPOINT=https://proton.eoscafeblock.com
XPR_TIMEOUT=30000
XPR_RETRY_ATTEMPTS=3

# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug

# Cache Configuration
CACHE_ENABLED=true
CACHE_TTL=300

# Security (for Azure Functions)
ALLOWED_API_KEYS=key1,key2,key3
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100
```

## Consequences

### Positive

1. **Easy Environment Switching**: Change config without code changes
2. **Security**: Secrets not in source code, loaded from environment
3. **Deployment Flexibility**: Different configs for different environments
4. **Azure Integration**: Works seamlessly with Azure App Settings
5. **Local Development**: `.env` file for easy local setup
6. **Validation**: Catch configuration errors at startup
7. **Documentation**: Configuration is self-documenting
8. **12-Factor Compliant**: Follows industry best practices

### Negative

1. **Learning Curve**: Team needs to understand environment variables
2. **Local Setup**: Developers need to create `.env` files
3. **Debugging**: Harder to see configuration at a glance
4. **Migration Effort**: Need to update all hardcoded values

### Risks

1. **Missing Variables**: If required vars not set, app may fail at runtime
   - **Mitigation**: Validation function checks all required config at startup
2. **Secret Exposure**: Accidental commit of `.env` files
   - **Mitigation**: Add `.env` to `.gitignore`, provide `.env.example`
3. **Type Errors**: Environment variables are strings
   - **Mitigation**: Parse and validate types in config module

## Alternatives Considered

### 1. Configuration Files (JSON/YAML)

**Pros**:
- Easy to read and edit
- Hierarchical structure
- Comments support (YAML)

**Cons**:
- Need different files per environment
- Security risk (secrets in files)
- Doesn't work well with Azure Functions

**Verdict**: Rejected - Less flexible than environment variables

### 2. Command-Line Arguments

**Pros**:
- Explicit configuration
- Easy to override

**Cons**:
- Cumbersome for many options
- Doesn't work with Azure Functions
- Hard to manage in production

**Verdict**: Rejected - Not suitable for production deployment

### 3. Database Configuration

**Pros**:
- Centralized management
- Runtime updates possible

**Cons**:
- Adds dependency (database)
- Increased complexity
- Bootstrap problem (how to connect to DB?)

**Verdict**: Rejected - Overkill for current needs

## Implementation Plan

### Phase 1: Create Configuration Module (Day 1)

1. Create `config/index.js` with configuration structure
2. Add validation function
3. Create `.env.example` with all variables documented
4. Update `.gitignore` to exclude `.env`

### Phase 2: Update Code (Day 1-2)

1. Update `XPRClient` to use `config.xpr.endpoint`
2. Update MCP Server to use `config.server.*`
3. Update Azure Functions to use config
4. Add config validation to startup

### Phase 3: Documentation (Day 2)

1. Update README.md with configuration section
2. Document all environment variables
3. Create deployment guide per environment
4. Add troubleshooting section

### Phase 4: Testing (Day 2)

1. Test with different environment values
2. Test config validation
3. Test Azure deployment with App Settings
4. Test local development with `.env`

## References

- [The Twelve-Factor App - Config](https://12factor.net/config)
- [Azure App Service - Environment Variables](https://docs.microsoft.com/en-us/azure/app-service/configure-common)
- [Node.js dotenv Library](https://github.com/motdotla/dotenv) (optional for development)
- [IMPROVEMENTS.md - Configuration Management](../IMPROVEMENTS.md#1-configuration-management-system)

## Notes

The implementation shown uses vanilla Node.js `process.env` without external libraries. For local development convenience, the `dotenv` package can optionally be used to load `.env` files, but it's not required for production deployment as Azure App Settings and environment variables are natively supported.
