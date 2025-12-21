# 🗨️ Agent Conversation Examples

**Real-world examples of how agents interact with the Proton MCP tools**

---

## Example 1: Account Investigation

### Scenario
User wants to understand why their account can't send a transaction.

### Conversation

```
User:
"My account 'alice' won't let me send any XPR. Can you help me figure out why?"

Agent Analysis (internal):
- This requires checking resources
- Need to diagnose the issue
- Should provide actionable advice

Agent Tool Calls:
1. get_account(account_name="alice")
2. get_account_resources(account_name="alice")

Agent Response:
"I checked your account 'alice'. Here's what I found:

📊 Account Status:
- Balance: 5,234.5678 XPR
- RAM: 45.2 KB (128 KB available - OK)
- CPU: 0 ms available (PROBLEM ❌)
- NET: 2.5 KB available (OK)

🔴 **Root Cause:** Your CPU is exhausted!

📋 CPU Breakdown:
- Maximum daily: 60,000 ms
- You've used: 60,000 ms
- Available now: 0 ms

💡 **Solutions** (in order of ease):

1. **Wait 24 hours** ⏰
   Every 24 hours, your CPU resets.
   Your next reset is at 14:30 UTC tomorrow.

2. **Stake more XPR for CPU** 💪
   - Get XPR from a faucet
   - Stake it: `proton unstake alice 0.5 0 0`
   - Gives you ~30,000 ms extra CPU daily

3. **Use a delegation service**
   Some services will temporarily delegate CPU to you.

✅ Your NET and RAM are fine, only CPU is the issue.
Which solution would you like help with?"

User Follow-up:
"I'll wait 24 hours. Can you check on my account tomorrow?"

Agent:
"Sure! Come back after 14:35 UTC tomorrow, and I'll verify
your CPU has reset. In the meantime, here's your account
summary to reference:

Wallet: alice
Current Balance: 5,234.5678 XPR
Status: Temporarily unable to send (CPU maxed)
Next Reset: 2024-01-16 14:30 UTC"
```

---

## Example 2: Block Explorer Query

### Scenario
User wants to know if a specific account was active recently.

### Conversation

```
User:
"Has the account 'charlie' done anything in the last hour?"

Agent Analysis (internal):
- Get current chain state
- Calculate lookback window
- Scan recent blocks for activity
- Return findings with timestamps

Agent Tool Calls:
1. get_chain_info()
   → head_block_num = 1234567
   → head_block_time = 2024-01-15T10:30:00Z

2. For blocks 1234267 down to 1234567 (approx 300 blocks = 1 hour):
   - get_block(block_num_or_id=1234567)
   - get_block(block_num_or_id=1234566)
   - get_block(block_num_or_id=1234565)
   - ... (repeat for all 300 blocks)

Agent Response:
"✅ **Yes, charlie has been active!**

📋 Activity Found:

1️⃣ **Transaction 1: Transfer**
   - Block: #1234502
   - Time: 2024-01-15T10:15:42Z (15 min ago)
   - Action: Transfer 100 XPR to alice
   - Status: Success ✅

2️⃣ **Transaction 2: Vote**
   - Block: #1234445
   - Time: 2024-01-15T10:01:15Z (29 min ago)
   - Action: Voted for producers
   - Status: Success ✅

📊 Summary:
- Last activity: 15 minutes ago (ACTIVE)
- Total TXs in last hour: 2
- Status: Normal (no errors)
- Average response time: Good

Is there anything specific about these transactions
you'd like to know more about?"

User Follow-up:
"Can you show me the details of that transfer?"

Agent:
"Here's the transfer transaction:

📦 Transfer Details:
- From: charlie
- To: alice
- Amount: 100.0000 XPR
- Block: #1234502 (produced by 'producerx')
- Timestamp: 2024-01-15T10:15:42Z
- CPU Used: 450 ms
- NET Used: 128 bytes
- Status: Executed successfully ✅

This was a simple XPR transfer. No additional actions
were attached to this transaction."
```

---

## Example 3: Blockchain State Snapshot

### Scenario
User wants a snapshot of the current blockchain state for monitoring.

### Conversation

```
User:
"Give me a summary of the current blockchain state."

Agent Analysis (internal):
- Get chain info for current state
- Return formatted summary
- Include recent block info
- Provide timestamp context

Agent Tool Calls:
1. get_chain_info()

Agent Response:
"📡 **Proton Blockchain State** (Current as of now)

⏱️ Timestamp: 2024-01-15T10:30:00Z

🔗 Chain Metrics:
- Head Block: #1234567
- Block Interval: 0.5 seconds
- Blocks/hour: ~7,200
- Current Producer: producerx
- Chain Lib: #1234550 (confirmed irreversible blocks)
- Consensus: 95.2% (producers online)

⚙️ Version Info:
- Blockchain Version: 0.15.1
- Block Version: 1.2

🟢 Status: **HEALTHY**
- All metrics normal
- No consensus issues
- Blocks producing regularly (~0.5s apart)

📊 Practical Info:
- Next block in: ~0.25 seconds
- Recent block rate: 7,200/hour (normal)
- Current time offset: 0 seconds (in sync)

💡 What this means:
✅ Network is running smoothly
✅ Transactions are processing
✅ All producers are online
✅ No forks or issues detected

Would you like me to check specific accounts or blocks?"

User Follow-up:
"What was the last block produced by 'producer1'?"

Agent:
"Let me check the recent blocks for producer1...

Found it! 

🔍 Last Block by producer1:
- Block Number: #1234548
- Timestamp: 2024-01-15T10:23:00Z (7 min ago)
- Producer: producer1
- Transactions in block: 47
- Status: Valid ✅

producer1 is producing blocks normally, about every
15-20 blocks (typical rotation).

(Note: Exact scheduling depends on the producer set,
which rotates to ensure decentralization.)"
```

---

## Example 4: Account Creation Validation

### Scenario
User wants to verify if a new account exists before sending funds.

### Conversation

```
User:
"I want to send 100 XPR to an account called 'newuser'.
Before I do, can you check if that account actually exists?"

Agent Analysis (internal):
- Validate account name format
- Check if account exists on-chain
- Provide confirmation or error message
- Suggest next steps

Agent Tool Calls:
1. Validate: "newuser" is valid format (a-z, 1-12 chars) ✓
2. get_account(account_name="newuser")

Agent Response (If account exists):
"✅ **Account Verified!**

Account 'newuser' exists on the Proton blockchain:

📋 Account Details:
- Name: newuser
- Balance: 50.0000 XPR (already has some funds)
- Status: Active ✅
- Created: Approximately 2 weeks ago
- Stake: 25.0000 XPR
- Permissions: Standard (1 active key)

🟢 **Safe to send** - This account is confirmed valid.

Your transaction:
→ From: (your account)
→ To: newuser
→ Amount: 100.0000 XPR
→ Final balance for newuser: 150.0000 XPR

Would you like to proceed with the transfer?
(Note: I can't execute it, but I've confirmed
the recipient account is valid.)"

Agent Response (If account doesn't exist):
"❌ **Account NOT Found**

I searched for 'newuser' but it doesn't exist on the
Proton blockchain.

⚠️ **WARNING: Do not send funds to this account!**

📋 Possible reasons:
1. Misspelled account name
   → Check with the person again
2. Account not yet created
   → They may need to create it first
3. Account on different blockchain
   → This is Proton-specific (not EOS, etc.)

💡 Next steps:
1. Double-check the account name spelling
2. Ask the recipient to verify
3. Check their official documentation/website
4. Try alternative similar names:
   - 'newuser1' (with number)?
   - 'new_user' (with underscore)?
   - etc.

Common typos to check:
- Similar letters (1 vs l, 0 vs O)
- Spaces vs underscores vs dots
- Missing/extra characters

Let me know the correct name when you have it!"

User Follow-up (if not found):
"Can you check 'newuser123' instead?"

Agent:
"Checking 'newuser123'...

✅ **Found it!**

Account 'newuser123' exists and is active.
[Similar details as above...]

Safe to send!"
```

---

## Example 5: Network Diagnosis

### Scenario
User reports that transactions are failing mysteriously.

### Conversation

```
User:
"Transactions are failing. Something is wrong with
the network, right?"

Agent Analysis (internal):
- Check blockchain health
- Check user's account status
- Compare against normal metrics
- Identify actual root cause

Agent Tool Calls:
1. get_chain_info()
   → Check: Is chain producing blocks normally?
   → Check: Is consensus healthy?

2. get_account(account_name=user's_account)
   → Check: Has resources?

3. get_account_resources(account_name=user's_account)
   → Check: CPU/NET/RAM status?

Agent Response:
"🔍 **Diagnosis Complete**

Good news: **The network is fine.** ✅

📊 Network Status:
- Block production: Normal (0.5s intervals)
- Consensus: 95.2% (healthy)
- Latest block: #1234567
- Status: All systems nominal ✅

🤔 So what's wrong with your transactions?

Let me check your account...

📋 Your Account Analysis:
- Account: yourname
- Balance: 10.5 XPR ✓
- CPU: 5,432 ms available ✓
- NET: 45 KB available ✓
- RAM: 32.4 KB available ✓

🔴 **Found the issue!**

Your transactions are failing because:
❌ **Your balance (10.5 XPR) is too low**

💡 What's happening:
- Each transfer costs ~0.01 XPR in fees
- You're trying to send more than you have
- The network rejects it immediately
- This isn't a network failure

✅ **Solution:**
Get more XPR:
1. Request from faucet (gives 10 XPR)
2. Ask someone to send you XPR
3. Earn it from producer rewards

Then try your transaction again!

---

Different scenario example:

If the issue WAS network-related:

🔴 **Network Issue Detected**
- Head block stalled at #1234567
- No new blocks in 5 minutes (ABNORMAL)
- Consensus dropped to 45%
- Producers may be offline

Recommendation:
- Wait for network recovery (usually 30 min)
- Check blockchain status page
- Check producer announcements
- Try again in a few minutes

But in your case, it's just your balance! 😊"
```

---

## Example 6: Monitoring Setup

### Scenario
Advanced user wants continuous monitoring of an account.

### Conversation

```
User:
"I need to monitor my account 'vip_account' 24/7 and
get alerts if anything unusual happens. Can you set
that up?"

Agent Analysis (internal):
- This is a monitoring request
- Need to understand what "unusual" means
- Explain what I can and can't do
- Provide monitoring approach

Agent Response:
"I can help you monitor! Here's what I can do:

✅ **What I CAN monitor:**
- Balance changes (increase/decrease)
- Resource usage (CPU/NET/RAM)
- Account permissions changes
- Transaction activity (frequency)
- Stake changes

❌ **What I CAN'T do:**
- 24/7 continuous monitoring (not persistent)
- Automatic alerts (I need to be asked each time)
- Historical data (only current state)
- Predict future changes

💡 **Recommended approach:**

Option 1: Manual Checks (Simple)
- Ask me: 'Check my account status'
- I'll do: get_account, get_account_resources
- Frequency: As needed

Option 2: Scheduled Monitoring (Better)
- Set up a cron job or scheduler
- Call MCP tools every 5 minutes
- Track deltas (changes) yourself
- Alert when deltas exceed thresholds

Option 3: Full Solution (Best, but needs setup)
- Use block explorer with webhooks
- Set up off-chain indexing
- Get real-time notifications
- Requires infrastructure

📋 For now, let me give you a baseline:

Current Status of vip_account:
- Balance: 5,000.0000 XPR
- CPU: 45,000 ms available
- NET: 95,000 KB available
- RAM: 64 KB used

🔔 **Alert Triggers to Watch For:**
[I'll describe these next check]

Would you like me to:
1. Just do a baseline check like above?
2. Check every hour and report changes?
3. Help you set up external monitoring?"

User Follow-up:
"Just check every hour and tell me if anything changed."

Agent:
"Got it! I'll check your account every hour.

⏰ Monitoring Schedule:
- Account: vip_account
- Frequency: Every 60 minutes
- What I'll check: Balance, CPU, NET, RAM
- Alerts: Only if significant changes
- Duration: Until you tell me to stop

📊 Baseline (Hour 0, 10:30 UTC):
- Balance: 5,000.0000 XPR
- CPU: 45,000 ms
- NET: 95,000 KB  
- RAM: 64 KB used

[Later, at 11:30 UTC...]

🔔 **UPDATE: Change Detected!**

Hour 1 Status:
- Balance: 4,900.0000 XPR (⬇️ -100 XPR)
- CPU: 42,000 ms (⬇️ -3,000 ms)
- NET: 94,500 KB (⬇️ -500 KB)
- RAM: 64 KB (no change)

📋 What happened:
✓ Transfer sent: 100 XPR to someone
✓ Transaction executed normally
✓ Used some CPU/NET as expected

⚠️ Is this expected activity? (Looks normal to me)"
```

---

## Example 7: Comparative Analysis

### Scenario
User wants to compare multiple accounts.

### Conversation

```
User:
"Show me the top accounts by balance. Is my account
competitive?"

Agent Analysis (internal):
- User wants to understand their position
- Can't query "top accounts" directly
- But can compare against specific accounts
- Need to be honest about limitations

Agent Response:
"⚠️ **Limitation:** I can't query all accounts or rank
them automatically. But I can help you compare!

📋 Let me check your account and a few others:

Your Account (yourname):
- Balance: 2,500.0000 XPR
- Staked: 500.0000 XPR
- CPU: 25,000 ms available
- Status: Normal user

Comparison Accounts:
- alice: 10,000.0000 XPR (4x more)
- bob: 5,000.0000 XPR (2x more)
- charlie: 1,500.0000 XPR (you have more!)
- dave: 50,000.0000 XPR (20x more - whale!)

📊 Analysis:
- You're in the middle range
- Not a whale, but solid holding
- Good resource allocation
- Normal for active user

💡 Context:
- Most accounts: 100-5,000 XPR
- Rich accounts: 10,000-50,000 XPR  
- Major holders: 100,000+ XPR
- You're in 'comfortable' range

Your competitive position:
- Relative to typical users: ✅ Good
- Relative to whales: 🟡 Not in top tier
- Relative to new users: ✅ Excellent

Would you like me to check more specific accounts?"

User Follow-up:
"Check alice, bob, and charlie's resources."

Agent:
"Checking their resources...

📊 **Resource Comparison**

| Account | CPU (available) | NET (available) | RAM Used |
|---------|-----------------|-----------------|----------|
| alice   | 60,000 ms       | 100,000 KB      | 128 KB   |
| bob     | 30,000 ms       | 50,000 KB       | 256 KB   |
| charlie | 15,000 ms       | 25,000 KB       | 64 KB    |
| **YOU** | **25,000 ms**   | **45,000 KB**   | **96 KB**|

🔍 **What this means:**
- You have more CPU than charlie (outperforming)
- But less than alice and bob (they stake more)
- Your RAM is moderate (normal activity)
- Overall: Balanced allocation ✅

💡 **Improvement suggestions:**
If you want more resources:
- Stake more XPR (costs money)
- Keep current balance (cheapest)
- Delegate to someone (intermediary)

Your current setup is good for typical use!"
```

---

## Example 8: Error Handling Demo

### Scenario
Show how agent handles various errors gracefully.

### Conversation

```
User: "What's the balance of '!!!invalid!!!'?"

Agent Tool Call:
1. Validate: "!!!invalid!!!" - Format invalid

Agent Response:
"❌ **Invalid Account Name**

'!!!invalid!!!' is not a valid Proton account name.

📋 Valid account names must:
- Be 1-12 characters long
- Use only: a-z, 1-5, and . (dot)
- Examples: alice, bob, producer1, my.account

✅ Did you mean one of these?
- Invalid (contains I and !)
- Try: invalid1, invalid_account?

Please provide a valid account name and I'll check it!"

---

User: "Check account 'alice' at block 999999999999."

Agent Tool Call:
1. get_block(block_num_or_id="999999999999")
   → Error: Block too far in future

Agent Response:
"❌ **Invalid Block Number**

Block #999999999999 is in the future!

📊 Current blockchain state:
- Head block: #1234567
- Valid range: #1 to #1234567
- You requested: #999999999999 (way too high)

💡 What you might want:
- Current state: Use head block #1234567
- Past block: Use a lower number
- Future: Block doesn't exist yet

Would you like me to:
1. Check the current head block?
2. Check a specific past block?
3. Explain how block numbering works?"

---

User: "I can't connect to the blockchain!"

Agent Tool Call:
1. get_chain_info()
   → Connection successful

Agent Response:
"✅ **Blockchain is reachable!**

The network is working fine. I was able to connect
and get the latest block information.

📋 Possible reasons you can't connect:
1. Wrong endpoint URL (if you're using one)
2. Firewalls blocking connection
3. Your local client needs configuration
4. Temporary network issue at your end

🔧 Troubleshooting:
1. Check your blockchain client configuration
2. Try a different RPC node
3. Check your internet connection
4. Verify endpoint URL is correct

Common endpoints:
- Official: mainnet.protonchain.com
- Backup: rpc.protonchain.com

Do you need help troubleshooting your setup?"
```

---

## Key Patterns Across Examples

### 1. **Always Explain Context**
```
Bad: "Balance: 100.0000 XPR"
Good: "Balance: 100.0000 XPR (as of block #1234567, 2024-01-15T10:30:00Z)"
```

### 2. **Provide Actionable Next Steps**
```
Bad: "Your CPU is low."
Good: "Your CPU is low. You can wait 24 hours, stake more XPR, or use a delegation service."
```

### 3. **Be Honest About Limitations**
```
Bad: [Silently fail to find historical data]
Good: "I can only query current state. For historical data, use a block explorer or archive node."
```

### 4. **Use Clear Formatting**
```
✅ Successes
❌ Failures  
⚠️ Warnings
🔔 Alerts
📊 Data
💡 Tips
```

### 5. **Compare Against Expectations**
```
Bad: "CPU: 5,000 ms"
Good: "CPU: 5,000 ms (plenty available for transactions)"
```

### 6. **Chain Tools Logically**
```
Bad: [Ask for input every time]
Good: [Get state, check resources, diagnose all at once]
```

---

## For Agent Developers

When building agents using these tools:

1. ✅ **Chain multiple tool calls** to answer complex questions
2. ✅ **Validate all inputs** before calling tools
3. ✅ **Handle errors gracefully** with helpful messages
4. ✅ **Provide context** in all responses
5. ✅ **Explain limitations** upfront
6. ✅ **Give actionable suggestions** not just data
7. ✅ **Use formatting** for clarity
8. ✅ **Cache appropriately** (chain state is stable)

These patterns will make your agent more helpful and trustworthy!

