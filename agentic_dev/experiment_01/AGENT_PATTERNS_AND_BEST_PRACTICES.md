# 🏗️ Agent Patterns & Best Practices

**Proven patterns for building reliable blockchain query agents**

---

## Table of Contents

1. [Core Patterns](#core-patterns)
2. [Error Handling](#error-handling)
3. [Performance Optimization](#performance-optimization)
4. [User Experience](#user-experience)
5. [Testing Patterns](#testing-patterns)
6. [Advanced Techniques](#advanced-techniques)

---

## Core Patterns

### Pattern 1: The Diagnostic Query

**Use when:** User asks about account problems or needs troubleshooting

**Steps:**
1. Get account info
2. Get account resources
3. Get current chain state
4. Compare against baselines
5. Diagnose the root cause

**Example:**

```javascript
async function diagnoseAccount(accountName) {
  // Step 1-3: Fetch all data in parallel
  const [account, resources, chainInfo] = await Promise.all([
    callTool("get_account", { account_name: accountName }),
    callTool("get_account_resources", { account_name: accountName }),
    callTool("get_chain_info", {})
  ]);

  // Step 4: Check against baselines
  const diagnostics = {
    balance: {
      value: account.core_liquid_balance,
      status: parseFloat(account.core_liquid_balance) > 0 ? "✅" : "❌",
      message: parseFloat(account.core_liquid_balance) > 0 
        ? "Has funds" 
        : "CRITICAL: No funds, cannot send transactions"
    },
    cpu: {
      available: resources.cpu_limit.available,
      status: resources.cpu_limit.available > 0 ? "✅" : "❌",
      message: resources.cpu_limit.available > 0
        ? `${resources.cpu_limit.available} ms available`
        : "CRITICAL: CPU exhausted, transactions will fail"
    },
    net: {
      available: resources.net_limit.available,
      status: resources.net_limit.available > 0 ? "✅" : "❌",
      message: resources.net_limit.available > 0
        ? `${resources.net_limit.available} KB available`
        : "WARNING: NET very low"
    },
    ram: {
      used: resources.ram_usage,
      status: resources.ram_usage < 1000000 ? "✅" : "🟡",
      message: `${(resources.ram_usage / 1024).toFixed(1)} KB used`
    }
  };

  // Step 5: Prioritize issues
  const issues = Object.entries(diagnostics)
    .filter(([_, diag]) => diag.status !== "✅")
    .sort(([_, a], [_, b]) => {
      const priority = { "❌": 0, "🟡": 1, "✅": 2 };
      return priority[a.status] - priority[b.status];
    });

  return {
    accountName,
    chainBlock: chainInfo.head_block_num,
    diagnostics,
    issues,
    summary: formatDiagnostics(diagnostics, issues)
  };
}

function formatDiagnostics(diagnostics, issues) {
  let output = `📋 Account Diagnostics\n\n`;
  
  // Show all checks
  for (const [key, diag] of Object.entries(diagnostics)) {
    output += `${diag.status} ${key.toUpperCase()}: ${diag.message}\n`;
  }

  // Show priority issues
  if (issues.length > 0) {
    output += `\n⚠️ **ISSUES FOUND:**\n`;
    for (const [key, diag] of issues) {
      output += `  ${diag.status} ${key}: ${diag.message}\n`;
    }
  } else {
    output += `\n✅ All systems nominal!`;
  }

  return output;
}
```

**When to use:** Any troubleshooting, "why can't I...", resource questions

---

### Pattern 2: The Timeline Query

**Use when:** User asks about recent activity or history

**Steps:**
1. Get current blockchain head
2. Calculate block range
3. Query blocks in range
4. Filter for relevant transactions
5. Return chronological view

**Example:**

```javascript
async function getActivityTimeline(accountName, hoursToCheck = 1) {
  // Step 1: Get current state
  const chainInfo = await callTool("get_chain_info", {});
  const headBlock = chainInfo.head_block_num;
  const headTime = new Date(chainInfo.head_block_time);

  // Step 2: Calculate range (assuming ~0.5s per block)
  const blocksPerHour = 7200; // 3600 seconds / 0.5 seconds per block
  const blockRange = blocksPerHour * hoursToCheck;
  const startBlock = Math.max(1, headBlock - blockRange);

  // Step 3: Query blocks
  const transactions = [];
  for (let blockNum = startBlock; blockNum <= headBlock; blockNum++) {
    try {
      const block = await callTool("get_block", { 
        block_num_or_id: blockNum 
      });

      // Step 4: Filter for relevant transactions
      for (const tx of block.transactions) {
        if (isAccountInvolved(accountName, tx)) {
          transactions.push({
            blockNum,
            timestamp: new Date(block.timestamp),
            tx,
            producer: block.producer
          });
        }
      }
    } catch (error) {
      // Skip blocks that don't exist
      continue;
    }
  }

  // Step 5: Format timeline
  return {
    accountName,
    timeRange: { from: startBlock, to: headBlock },
    transactionCount: transactions.length,
    timeline: transactions.sort((a, b) => a.timestamp - b.timestamp)
  };
}

function isAccountInvolved(accountName, tx) {
  // Check if account is in any action
  const transaction = tx.trx?.transaction || tx.trx;
  if (!transaction.actions) return false;

  return transaction.actions.some(action => {
    return action.account === accountName ||
           action.authorization?.some(auth => auth.actor === accountName) ||
           (action.data?.from === accountName) ||
           (action.data?.to === accountName);
  });
}
```

**When to use:** "What's been happening?", activity checks, audit trails

---

### Pattern 3: The State Snapshot

**Use when:** User wants a complete account status at a point in time

**Steps:**
1. Get all account data at once
2. Format into snapshot object
3. Include metadata (block, time)
4. Return as reference point

**Example:**

```javascript
async function takeAccountSnapshot(accountName) {
  // Get all data in parallel
  const [account, resources, chainInfo] = await Promise.all([
    callTool("get_account", { account_name: accountName }),
    callTool("get_account_resources", { account_name: accountName }),
    callTool("get_chain_info", {})
  ]);

  const snapshot = {
    // Metadata
    timestamp: new Date(),
    blockNumber: chainInfo.head_block_num,
    blockTime: chainInfo.head_block_time,
    
    // Account data
    account: {
      name: accountName,
      balance: account.core_liquid_balance,
      ram_usage: resources.ram_usage,
      staked: {
        cpu: account.voter_info?.staked || 0,
        net: account.voter_info?.staked || 0
      }
    },
    
    // Resources
    resources: {
      cpu: {
        used: resources.cpu_limit.used,
        available: resources.cpu_limit.available,
        max: resources.cpu_limit.max,
        percentUsed: (resources.cpu_limit.used / resources.cpu_limit.max * 100).toFixed(1)
      },
      net: {
        used: resources.net_limit.used,
        available: resources.net_limit.available,
        max: resources.net_limit.max,
        percentUsed: (resources.net_limit.used / resources.net_limit.max * 100).toFixed(1)
      },
      ram: {
        used: resources.ram_usage,
        percentUsed: "N/A" // Would need max to calculate
      }
    },

    // Helpers
    isFunctional: {
      canSendTransaction: resources.cpu_limit.available > 0,
      hasFunds: parseFloat(account.core_liquid_balance) > 0,
      hasResources: resources.cpu_limit.available > 0 && 
                    resources.net_limit.available > 0
    }
  };

  return snapshot;
}

// Use for comparison
async function compareSnapshots(snapshot1, snapshot2) {
  const changes = {
    timeElapsed: snapshot2.timestamp - snapshot1.timestamp,
    blockDelta: snapshot2.blockNumber - snapshot1.blockNumber,
    balanceChange: parseFloat(snapshot2.account.balance) - parseFloat(snapshot1.account.balance),
    cpuChange: snapshot2.resources.cpu.used - snapshot1.resources.cpu.used,
    netChange: snapshot2.resources.net.used - snapshot1.resources.net.used,
    ramChange: snapshot2.resources.ram.used - snapshot1.resources.ram.used
  };

  return changes;
}
```

**When to use:** Monitoring, comparisons, before/after analysis, record keeping

---

## Error Handling

### Pattern: Defensive Input Validation

```javascript
// ✅ Always validate before calling tools
async function safeGetAccount(input) {
  // Step 1: Type check
  if (typeof input !== 'string') {
    throw new Error('Account name must be a string');
  }

  // Step 2: Length check
  if (input.length < 1 || input.length > 12) {
    throw new Error('Account name must be 1-12 characters');
  }

  // Step 3: Character validation
  if (!/^[a-z1-5.]*$/.test(input)) {
    throw new Error(
      'Account name contains invalid characters. ' +
      'Valid: a-z, 1-5, . (dot)'
    );
  }

  // Step 4: Call tool with validated input
  try {
    return await callTool("get_account", { account_name: input });
  } catch (error) {
    if (error.includes('not found')) {
      throw new Error(`Account '${input}' does not exist on-chain`);
    }
    throw error; // Re-throw unknown errors
  }
}
```

### Pattern: Graceful Degradation

```javascript
async function getAccountInfo(accountName) {
  const info = {};

  // Try to get account info
  try {
    info.account = await callTool("get_account", { account_name: accountName });
  } catch (error) {
    if (error.includes('not found')) {
      return { 
        error: 'Account not found',
        suggestion: 'Check account name spelling'
      };
    }
    // For other errors, continue anyway
    info.accountError = error.toString();
  }

  // Try to get resources (might fail if account doesn't exist)
  try {
    info.resources = await callTool("get_account_resources", { 
      account_name: accountName 
    });
  } catch (error) {
    // Log but continue
    info.resourcesError = error.toString();
  }

  // Return partial data if some calls succeeded
  return {
    ...info,
    partial: !!(info.accountError || info.resourcesError)
  };
}
```

### Pattern: Retry with Backoff

```javascript
async function callWithRetry(
  toolName, 
  params, 
  maxRetries = 3, 
  baseDelayMs = 100
) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await callTool(toolName, params);
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error; // Final attempt failed
      }

      // Exponential backoff: 100ms, 200ms, 400ms
      const delayMs = baseDelayMs * Math.pow(2, attempt);
      console.log(`Retry ${attempt + 1}/${maxRetries - 1} after ${delayMs}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}
```

---

## Performance Optimization

### Pattern: Parallel Queries

```javascript
// ✅ Good: Fetch independent data in parallel
async function getFullAccountInfo(accountName) {
  // These are independent - fetch in parallel
  const [account, resources, chainInfo] = await Promise.all([
    callTool("get_account", { account_name: accountName }),
    callTool("get_account_resources", { account_name: accountName }),
    callTool("get_chain_info", {})
  ]);

  return { account, resources, chainInfo };
}

// ❌ Bad: Sequential queries (slower)
async function getFullAccountInfoSlow(accountName) {
  const account = await callTool("get_account", { account_name: accountName });
  const resources = await callTool("get_account_resources", { account_name: accountName });
  const chainInfo = await callTool("get_chain_info", {});
  return { account, resources, chainInfo };
}
```

### Pattern: Smart Caching

```javascript
class SmartCache {
  constructor() {
    this.cache = {};
    this.chainInfoCache = null;
    this.chainInfoAge = 0;
  }

  // Cache chain info (stable for ~6 seconds)
  async getChainInfo() {
    const now = Date.now();
    if (this.chainInfoCache && (now - this.chainInfoAge) < 6000) {
      return this.chainInfoCache; // Return cached
    }

    this.chainInfoCache = await callTool("get_chain_info", {});
    this.chainInfoAge = now;
    return this.chainInfoCache;
  }

  // Account info changes more frequently - don't cache by default
  async getAccount(accountName, useCache = false) {
    if (useCache && this.cache[accountName]) {
      return this.cache[accountName];
    }

    const account = await callTool("get_account", { account_name: accountName });
    if (useCache) {
      this.cache[accountName] = account;
    }
    return account;
  }

  // Clear cache on demand
  clear() {
    this.cache = {};
    this.chainInfoCache = null;
  }
}
```

### Pattern: Batch Processing

```javascript
async function checkMultipleAccounts(accountNames) {
  // Limit concurrent requests
  const batchSize = 5;
  const results = [];

  for (let i = 0; i < accountNames.length; i += batchSize) {
    const batch = accountNames.slice(i, i + batchSize);
    
    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(name => 
        callTool("get_account", { account_name: name })
          .catch(error => ({ name, error }))
      )
    );

    results.push(...batchResults);

    // Small delay between batches to avoid overwhelming
    if (i + batchSize < accountNames.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}
```

---

## User Experience

### Pattern: Progressive Information Disclosure

```javascript
// ✅ Show summary first, details on demand
async function explainAccountStatus(accountName) {
  // Step 1: Quick summary
  const account = await callTool("get_account", { account_name: accountName });
  const resources = await callTool("get_account_resources", { account_name: accountName });

  const summary = {
    name: accountName,
    balance: account.core_liquid_balance,
    canTransact: resources.cpu_limit.available > 0,
    status: "Active ✅"
  };

  // Return summary first
  let response = `📊 Account: ${summary.name}\n`;
  response += `💰 Balance: ${summary.balance}\n`;
  response += `${summary.canTransact ? '✅' : '❌'} Can send transactions\n`;
  response += `\nWant more details? Ask about:\n`;
  response += `- "Show my resources"\n`;
  response += `- "What's my CPU/NET?"\n`;
  response += `- "Analyze my account"\n`;

  return response;
}
```

### Pattern: Context-Aware Explanations

```javascript
function explainCPU(cpuAvailable, cpuMax) {
  const percentUsed = ((cpuMax - cpuAvailable) / cpuMax * 100).toFixed(1);
  
  if (cpuAvailable > cpuMax * 0.8) {
    return `✅ Plenty of CPU (${cpuAvailable}ms, ${percentUsed}% used)`;
  } else if (cpuAvailable > cpuMax * 0.3) {
    return `⚠️ Moderate CPU (${cpuAvailable}ms, ${percentUsed}% used) - Watch usage`;
  } else if (cpuAvailable > 0) {
    return `🔴 Low CPU (${cpuAvailable}ms, ${percentUsed}% used) - Transactions may fail`;
  } else {
    return `🔴 NO CPU (${cpuAvailable}ms) - Transactions will fail`;
  }
}
```

### Pattern: Helpful Suggestions

```javascript
async function suggestNextSteps(accountName) {
  const account = await callTool("get_account", { account_name: accountName });
  const resources = await callTool("get_account_resources", { account_name: accountName });

  const suggestions = [];

  // Check each resource and suggest actions
  if (resources.cpu_limit.available < 1000) {
    suggestions.push("⚠️ CPU is low. Consider staking more XPR for CPU.");
  }

  if (resources.net_limit.available < 1000) {
    suggestions.push("⚠️ NET is low. Consider staking more XPR for NET.");
  }

  if (resources.ram_usage > 500000) { // 500KB
    suggestions.push("⚠️ RAM usage is high. Consider freeing up space.");
  }

  if (parseFloat(account.core_liquid_balance) < 1) {
    suggestions.push("💡 Your balance is low. Get more XPR from a faucet or trade.");
  }

  if (suggestions.length === 0) {
    suggestions.push("✅ Your account looks good! No immediate actions needed.");
  }

  return suggestions;
}
```

---

## Testing Patterns

### Pattern: Mock Tool Calls for Testing

```javascript
// For unit testing without real blockchain
class MockMCPClient {
  constructor(mockData = {}) {
    this.mockData = mockData;
  }

  async callTool(toolName, params) {
    switch (toolName) {
      case "get_account":
        return this.mockData.account || { 
          name: params.account_name,
          core_liquid_balance: "100.0000 XPR"
        };
      
      case "get_account_resources":
        return this.mockData.resources || {
          cpu_limit: { used: 100, available: 59900, max: 60000 },
          net_limit: { used: 200, available: 99800, max: 100000 },
          ram_usage: 2048
        };
      
      case "get_chain_info":
        return this.mockData.chainInfo || {
          head_block_num: 1234567,
          head_block_time: "2024-01-15T10:30:00Z"
        };
      
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}

// Usage in tests
async function testDiagnostics() {
  const mockClient = new MockMCPClient({
    account: { core_liquid_balance: "10.0000 XPR" }, // Low balance
    resources: {
      cpu_limit: { used: 60000, available: 0, max: 60000 } // No CPU
    }
  });

  const diagnostics = await diagnoseAccount("testaccount");
  assert(diagnostics.issues.length > 0);
  assert(diagnostics.issues.some(i => i[0] === 'balance'));
  assert(diagnostics.issues.some(i => i[0] === 'cpu'));
}
```

### Pattern: Integration Tests with Real Data

```javascript
// Test with real blockchain
async function testWithRealChain() {
  const snapshot1 = await takeAccountSnapshot("alice");
  
  // Wait a minute
  await new Promise(r => setTimeout(r, 60000));
  
  const snapshot2 = await takeAccountSnapshot("alice");
  const changes = compareSnapshots(snapshot1, snapshot2);

  console.log("Block delta:", changes.blockDelta);
  assert(changes.blockDelta > 0); // Chain should produce blocks
}
```

---

## Advanced Techniques

### Technique 1: Anomaly Detection

```javascript
async function detectAnomalies(accountName) {
  // Get baseline from first snapshot
  const baseline = await takeAccountSnapshot(accountName);

  // Monitor over time
  const anomalies = [];
  
  // Check for suspicious balance change
  if (Math.abs(baseline.account.balance) > 1000) {
    anomalies.push({
      type: "large_balance_change",
      amount: Math.abs(baseline.account.balance),
      severity: "medium"
    });
  }

  // Check for rapid resource depletion
  if (baseline.resources.cpu.percentUsed > 90) {
    anomalies.push({
      type: "cpu_nearly_exhausted",
      percent: baseline.resources.cpu.percentUsed,
      severity: "high"
    });
  }

  return anomalies;
}
```

### Technique 2: Data Correlation

```javascript
async function correlateAccountActivity(accountName) {
  const timeline = await getActivityTimeline(accountName, 24); // Last 24 hours
  
  // Analyze patterns
  const activityByHour = {};
  for (const tx of timeline.timeline) {
    const hour = tx.timestamp.getUTCHours();
    activityByHour[hour] = (activityByHour[hour] || 0) + 1;
  }

  // Find peak hours
  const peakHours = Object.entries(activityByHour)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => `${hour}:00 UTC`);

  return {
    totalTransactions: timeline.transactionCount,
    peakActivityHours: peakHours,
    averagePerHour: (timeline.transactionCount / 24).toFixed(1)
  };
}
```

### Technique 3: Predictive Alerts

```javascript
async function predictResourceDepletion(accountName) {
  // Get current state
  const snapshot = await takeAccountSnapshot(accountName);
  const cpuAvailable = snapshot.resources.cpu.available;
  const cpuUsedRecently = snapshot.resources.cpu.used;

  // Estimate usage rate (would need historical data)
  // For demo, use rough estimate
  const estimatedHourlyUsage = cpuUsedRecently / 24; // Divided by hours in day

  const hoursUntilDepletion = cpuAvailable / Math.max(estimatedHourlyUsage, 1);

  return {
    currentCPU: cpuAvailable,
    estimatedDepletion: hoursUntilDepletion.toFixed(1) + " hours",
    alert: hoursUntilDepletion < 24 
      ? "⚠️ CPU may deplete within 24 hours"
      : "✅ CPU should last many days"
  };
}
```

---

## Checklist: Building a Production Agent

- [ ] All inputs validated before tool calls
- [ ] All tool calls wrapped in try/catch
- [ ] Errors formatted for user understanding
- [ ] Tool calls parallelized where possible
- [ ] Smart caching implemented for stable data
- [ ] Rate limiting considered
- [ ] Timeout handling in place
- [ ] Unit tests with mocks
- [ ] Integration tests with real data
- [ ] User-friendly explanations provided
- [ ] Limitations clearly documented
- [ ] Performance measured and optimized
- [ ] Monitoring/logging in place
- [ ] Documentation updated

---

## Quick Reference: Pattern Selection

| Scenario | Pattern to Use |
|----------|----------------|
| Account is broken | Diagnostic Query |
| "What happened?" | Timeline Query |
| Record snapshot | State Snapshot |
| Multiple accounts | Batch Processing |
| Repeated queries | Smart Caching |
| Unclear user intent | Progressive Disclosure |
| Building trust | Helpful Suggestions |
| CI/CD pipeline | Mock Testing |
| Real validation | Integration Testing |
| Advanced analysis | Anomaly Detection |

---

**Remember:** Always start simple, add complexity only when needed. Test thoroughly. Document assumptions. Ask users for clarification.

