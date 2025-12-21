# 🤖 Agentic Development Guide

**For AI agents building on top of the Proton MCP server**

---

## 📚 What You're Working With

You have **5 blockchain query tools** available via the Model Context Protocol (MCP):

1. **`get_account`** — Query account info (balance, resources, etc.)
2. **`get_account_resources`** — Get CPU, NET, RAM details
3. **`get_chain_info`** — Get current blockchain state
4. **`get_block`** — Query block contents
5. **`get_block_transaction_count`** — Count transactions in a block

All tools are **read-only**, **stateless**, and **synchronous**.

---

## 🎯 Common Task Patterns

### Pattern 1: Investigate an Account

**Goal:** Get full account details

```
Agent Request: "What's the balance and resource usage for account 'alice'?"

Step 1: Call get_account with account_name="alice"
  → Returns: balance, resources_count, permissions, etc.

Step 2: (Optional) Call get_account_resources with account_name="alice"
  → Returns: CPU/NET/RAM usage breakdown

Result: Provide complete account summary
```

**When to use:**
- User wants account summary
- Debugging account issues
- Analyzing account state

**Tips:**
- Always validate account names (lowercase, 1-12 chars)
- Account may not exist → handle "not found" gracefully
- Resources refresh every ~6 seconds on-chain

---

### Pattern 2: Monitor Blockchain Activity

**Goal:** Track recent blocks and transactions

```
Agent Request: "What happened in the last 5 blocks?"

Step 1: Call get_chain_info
  → Returns: head_block_num (e.g., 1234567)

Step 2: For each block from (head - 4) to head:
  Call get_block with block_num_or_id
  → Returns: transactions, producer, timestamp

Step 3: (Optional) For specific block:
  Call get_block_transaction_count with block_num_or_id
  → Returns: transaction count

Result: Timeline of recent activity
```

**When to use:**
- Monitor recent transactions
- Track blockchain health
- Audit producer activity

**Tips:**
- Store head_block_num to avoid refetching
- Transactions are ordered by position in block
- Block times are in ISO 8601 format

---

### Pattern 3: Verify Account State at Specific Block

**Goal:** Check account state at a past block height

```
Agent Request: "What was alice's balance at block 1234000?"

Step 1: Call get_block with block_num_or_id="1234000"
  → Returns: block timestamp, transactions, etc.

Step 2: Call get_account with account_name="alice"
  → Note: Returns CURRENT state (not historical)

Result: Explain limitation clearly to user
  "Current balance: X (block 1234567)"
  "Cannot query historical state without archive node"
```

**When to use:**
- User asks about past state
- Need to explain protocol limitations

**Important:** This tool **only queries current state**. To check past states, you'd need:
- Archive node with historical queries
- Event stream from past blocks
- Third-party indexing service

---

### Pattern 4: Resolve Account Names to Real Addresses

**Goal:** Verify account exists and is valid

```
Agent Request: "Is 'bobby123' a valid account?"

Step 1: Call get_account with account_name="bobby123"
  → Success: Account exists, return details
  → Error: Account not found, inform user

Result: Confirmed or "Account not found"
```

**When to use:**
- Validating user input
- Checking account existence
- Confirming spelling

**Tips:**
- Names are case-insensitive on Proton
- Valid chars: a-z, 1-5, dot (.)
- Names are 1-12 characters
- Always handle "not found" errors gracefully

---

### Pattern 5: Debug & Troubleshoot

**Goal:** Help user understand why something isn't working

```
Agent Request: "Why can't I send a transaction?"

Step 1: Call get_account with their_account_name
  → Check: Has NET/CPU available?
  → Check: Has RAM?

Step 2: Call get_account_resources
  → Details: CPU/NET usage, staked amounts

Result: Provide diagnostic info
  "✓ Has RAM (1.2 KB available)"
  "⚠ Low CPU (only 0.5 ms/day available)"
  "✓ Sufficient NET (5 KB available)"
  "→ Recommendation: Unstake CPU or increase stake"
```

**When to use:**
- User needs troubleshooting help
- Explaining resource constraints
- Diagnosing account issues

**Tips:**
- CPU/NET measured in milliseconds/kilobytes per day
- RAM measured in bytes
- All resources stack on each other
- Zero available = transaction will fail

---

## 🔄 Multi-Step Investigation Example

**Real-world scenario:** "Has account 'charlie' been active in the last hour?"

```javascript
// Step 1: Get current blockchain state
const chainInfo = await callTool("get_chain_info");
const headBlock = chainInfo.head_block_num;  // e.g., 1234567
const headTime = new Date(chainInfo.head_block_time);

// Step 2: Look at recent blocks (last ~300 blocks = ~1 hour)
const blocksToCheck = 300;
for (let i = 0; i < blocksToCheck; i++) {
  const blockNum = headBlock - i;
  const block = await callTool("get_block", { block_num_or_id: blockNum });
  
  // Check if charlie is involved in any transaction
  for (const tx of block.transactions) {
    if (tx.trx.transaction.actions.some(action => 
        action.account === "charlie" || 
        action.data.from === "charlie" ||
        action.data.to === "charlie")) {
      return {
        found: true,
        blockNum: blockNum,
        blockTime: block.timestamp,
        hoursAgo: (headTime - new Date(block.timestamp)) / 3600000
      };
    }
  }
}

// Step 3: Report findings
return { found: false, checked: blocksToCheck, message: "No activity found" };
```

**Key lessons:**
- Combine tools to answer complex questions
- Chain calls based on previous results
- Always provide context (timestamps, durations)
- Give users actionable findings

---

## ⚙️ Error Handling Patterns

### Pattern: Graceful Degradation

```javascript
async function safeGetAccount(accountName) {
  try {
    const account = await callTool("get_account", { 
      account_name: accountName 
    });
    return { success: true, data: account };
  } catch (error) {
    if (error.includes("not found")) {
      return { 
        success: false, 
        reason: "Account does not exist",
        suggestion: "Check spelling and try again"
      };
    }
    if (error.includes("timeout")) {
      return { 
        success: false, 
        reason: "Blockchain is slow to respond",
        suggestion: "Try again in a moment"
      };
    }
    // Unknown error
    return { 
      success: false, 
      reason: "Unexpected error: " + error,
      suggestion: "Check your account name and try again"
    };
  }
}
```

### Common Error Messages & Responses

| Error | Likely Cause | Response |
|-------|--------------|----------|
| "Account not found" | Wrong account name | Suggest checking spelling |
| "Timeout" | Network/blockchain slow | Ask user to retry |
| "Connection refused" | CLI not running | Check Proton CLI installation |
| "Invalid account name" | Bad characters | Show valid format (a-z, 1-5, 1-12 chars) |
| "Block not found" | Block number too high | Use get_chain_info to find valid range |

---

## 📊 Data Interpretation Guide

### Understanding Account Resources

**Resource Usage Example:**
```json
{
  "cpu_limit": { "used": 450, "available": 59550, "max": 60000 },
  "net_limit": { "used": 200, "available": 99800, "max": 100000 },
  "ram_usage": 2048  // bytes
}
```

**Interpretation:**
- **CPU used:** 450ms of available 60000ms (0.75% used)
- **NET used:** 200KB of available 100000KB (0.2% used)
- **RAM used:** 2048 bytes (storage for account data)

**Common scenarios:**
- CPU/NET used close to max? → Account is under load
- RAM close to max? → Storage is full
- All zeros? → Account just created
- Very high used? → Account was active recently

### Understanding Block Structure

**Block Example:**
```json
{
  "block_num": 1234567,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "producer": "producerx",
  "transactions": [
    {
      "status": "executed",
      "cpu_usage_us": 450,
      "net_usage_words": 25,
      "trx": {
        "transaction": {
          "actions": [...]
        }
      }
    }
  ]
}
```

**Key fields:**
- **block_num:** Sequential identifier
- **timestamp:** When block was produced (UTC)
- **producer:** Account that created this block (validator)
- **transactions:** Array of all TXs in this block
- **cpu_usage_us:** CPU consumed by this TX (microseconds)
- **net_usage_words:** Network bandwidth used (words = 8 bytes)

---

## 🎓 Best Practices for Agents

### 1. Always Validate Input

```javascript
// ❌ Bad
async function getAccount(name) {
  return await callTool("get_account", { account_name: name });
}

// ✅ Good
async function getAccount(name) {
  // Validate before calling
  if (!name || name.length > 12 || !/^[a-z1-5.]*$/.test(name)) {
    throw new Error("Invalid account name: " + name);
  }
  return await callTool("get_account", { account_name: name });
}
```

### 2. Provide Context in Results

```javascript
// ❌ Bad
return account.balance;

// ✅ Good
return {
  balance: account.balance,
  symbol: "XPR",
  unit: "satoshis",
  formattedDisplay: formatBalance(account.balance),
  timestamp: chainInfo.head_block_time,
  note: "Balance is current as of block " + chainInfo.head_block_num
};
```

### 3. Explain Limitations Upfront

```javascript
// ❌ Bad
// User: "What was the balance 24 hours ago?"
return await getAccount("alice");  // Returns current balance

// ✅ Good
// User: "What was the balance 24 hours ago?"
return {
  message: "This tool only provides current state.",
  currentBalance: account.balance,
  currentBlock: chainInfo.head_block_num,
  limitation: "Historical queries require archive node",
  alternatives: [
    "Check block explorers (have historical data)",
    "Review transaction history from past blocks",
    "Contact chain administrators for archive access"
  ]
};
```

### 4. Cache When Appropriate

```javascript
// ✅ Good: Cache chain state (stable for ~6 seconds)
let cachedChainInfo = null;
let chainInfoAge = 0;

async function getChainInfo() {
  const now = Date.now();
  if (cachedChainInfo && (now - chainInfoAge) < 5000) {
    return cachedChainInfo;  // Return cached
  }
  
  cachedChainInfo = await callTool("get_chain_info");
  chainInfoAge = now;
  return cachedChainInfo;
}
```

### 5. Chain Calls Logically

```javascript
// ✅ Good: Logical flow
async function analyzeAccount(name) {
  // Get basic info first
  const account = await callTool("get_account", { account_name: name });
  
  // Then get detailed resources
  const resources = await callTool("get_account_resources", { 
    account_name: name 
  });
  
  // Combine for analysis
  return {
    ...account,
    resources: resources,
    health: analyzeHealth(account, resources)
  };
}
```

### 6. Document Your Assumptions

```javascript
/**
 * Gets account age in days
 * 
 * ASSUMPTIONS:
 * - Account created on-chain when first appeared in block
 * - Cannot query exact creation timestamp (not available via RPC)
 * - Estimates based on first known transaction
 * 
 * LIMITATIONS:
 * - This is an approximation
 * - Requires scanning blocks (slow)
 * - Not recommended for many accounts
 */
async function getAccountAge(name) {
  // Implementation...
}
```

---

## 🔧 Testing Your Agents

### Manual Testing Checklist

- [ ] Test with valid account names
- [ ] Test with invalid account names
- [ ] Test with non-existent accounts
- [ ] Test with special characters in input
- [ ] Test during high blockchain load
- [ ] Test with very old block numbers
- [ ] Test with very high block numbers
- [ ] Verify error messages are user-friendly
- [ ] Verify data formatting is consistent
- [ ] Verify timestamps are correct

### Sample Test Accounts

**For testing:**
- Account: `alice` — Usually active, good for testing
- Account: `bob` — Typical account data
- Account: `system` — System account (special)
- Account: `nonexistent1234` — Always fails (no such account)

---

## 📡 Integration Patterns

### Pattern: Serve as Blockchain Advisor

```
User: "Should I send my tokens to alice or bob?"

Agent: 
1. Calls get_account("alice") → Gets balance, resources
2. Calls get_account("bob") → Gets balance, resources
3. Provides analysis:
   - Alice: Active, good resource levels
   - Bob: Inactive, low resources
   - Recommendation: Alice more reliable

This uses the tools to provide informed advice.
```

### Pattern: Monitor & Alert

```
User: (implicit monitoring setup)

Agent runs periodically:
1. Calls get_chain_info() → Get latest block
2. Compares to last known head_block_num
3. If head > previous, new blocks created
4. Calls get_block() for new blocks
5. Scans for specific transactions
6. Alerts user if conditions met

This chains calls to watch for activity.
```

### Pattern: Audit Trail

```
User: "Show me my transaction history"

Agent:
1. Calls get_chain_info() → Get current head block
2. Iterates backward through last N blocks
3. Calls get_block() for each
4. Filters transactions involving user's account
5. Returns chronological audit trail

This uses tools to reconstruct history.
```

---

## 🚨 Important Limitations to Know

### 1. **No Historical State Queries**
You can only query the **current** blockchain state. Past states are not queryable via these tools.

### 2. **No Filtering on Chain**
All filtering happens client-side. You fetch data and filter locally.

### 3. **No Subscriptions**
Tools are request-response only. No push notifications or streaming.

### 4. **Eventual Consistency**
Data from RPC node may lag actual state by seconds.

### 5. **No Pagination**
Block transactions come as complete list. No cursor-based pagination.

### 6. **Rate Limits (Soft)**
No hard rate limits, but hitting CLI repeatedly may timeout.

---

## 📖 Quick Reference

### Tool Parameters

**get_account**
- Input: `{ account_name: string }`
- Output: Account object with balance, resources, permissions

**get_account_resources**
- Input: `{ account_name: string }`
- Output: CPU/NET/RAM resource details

**get_chain_info**
- Input: (none)
- Output: Current blockchain head block, version, timestamp

**get_block**
- Input: `{ block_num_or_id: string|number }`
- Output: Block with transactions, producer, timestamp

**get_block_transaction_count**
- Input: `{ block_num_or_id: string|number }`
- Output: Number of transactions in block

### Common Values

| Field | Type | Example | Notes |
|-------|------|---------|-------|
| account_name | string | "alice" | 1-12 chars, a-z/1-5/. |
| balance | string | "1234.5678 XPR" | Always includes symbol |
| timestamp | ISO 8601 | "2024-01-15T10:30:00Z" | UTC, no milliseconds |
| block_num | number | 1234567 | Sequential, always increasing |
| block_id | string | "0012d687..." | SHA256 hash of block |

---

## 🎯 Next Steps

**To extend these tools:**
1. Read `../ARCHITECTURE.md` for code structure
2. Check `../src/tools/` for implementation examples
3. Follow patterns in existing tools
4. Add tests in `../tests/`
5. Update this guide with new patterns

**To integrate with your agent:**
1. Configure MCP client for stdio transport
2. Call tools as described above
3. Implement error handling
4. Test with real Proton accounts
5. Document your agent's limitations

---

**Questions?** Check `../API.md` for detailed specifications.
