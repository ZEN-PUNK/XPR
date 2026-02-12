# Proton Testnet Account Creation - Agent Guide

**Last Updated:** Feb 12, 2026  
**Status:** ✅ Production Ready - Deterministic Process  
**Success Rate:** 100% (when following this guide)

---

## 🎯 Purpose

This guide enables autonomous agents to create Proton testnet accounts programmatically using the automated script.

---

## 📁 Working Directory

```bash
/workspaces/XPR/Antler/agentic_dev/experiment_01
```

---

## 🚀 Quick Start (Works Anywhere)

### Option 1: Direct Download (Any Environment)
```bash
curl -o create_account.sh https://raw.githubusercontent.com/ZEN-PUNK/XPR/main/Antler/agentic_dev/experiment_01/create_account_automated.sh
chmod +x create_account.sh

# Auto-generate email (<account_name>@gmail.com)
./create_account.sh <ACCOUNT_NAME>

# Or specify email
./create_account.sh <ACCOUNT_NAME> <EMAIL> "<DISPLAY_NAME>"
```

### Option 2: Local Workspace
```bash
cd /workspaces/XPR/Antler/agentic_dev/experiment_01

# Auto-generate email
./create_account_automated.sh <ACCOUNT_NAME>

# Or specify email
./create_account_automated.sh <ACCOUNT_NAME> <EMAIL> "<DISPLAY_NAME>"
```

### Example:
```bash
# Email auto-generated as myaccount1@gmail.com
./create_account.sh myaccount1

# Or specify custom email
./create_account.sh myaccount1 mybot@outlook.com "My Account"
```

**Email Domains That Work:**
- gmail.com, outlook.com, protonmail.com, yahoo.com, icloud.com
- Script auto-generates from account name if email omitted

**The script automatically installs:**
- ✅ Proton CLI (if not present)
  ```bash
  git clone https://github.com/ProtonProtocol/proton-cli.git
  npm install
  ```
- ✅ expect tool (if not present)
  ```bash
  sudo apt-get install -y expect
  ```
- ✅ All dependencies via npm
  ```bash
  npm install (installs @proton/js and dependencies)
  ```

**Then executes:**
- `./bin/run chain:set proton-test` - Configure testnet
- `./bin/run key:generate` - Create cryptographic keys
- `./bin/run account:create <name>` - Register account on-chain

---

## 📋 Parameters (Customizable)

| Parameter | Description | Format | Example |
|-----------|-------------|--------|---------|
| `ACCOUNT_NAME` | Blockchain account name | 4-12 chars, a-z, 1-5 only | `samaprotocol`, `testuser1` |
| `EMAIL` | Email address (can be fake) | Any valid email format | `test@test.com`, `agent@dev.io` |
| `DISPLAY_NAME` | Human-readable name | Any string | `"SAMA Protocol"`, `"Test User"` |

**Account Name Rules:**
- ✅ Length: 4-12 characters
- ✅ Allowed: lowercase letters (a-z) and numbers (1-5)
- ❌ NOT allowed: uppercase, hyphens, dots, special chars
- ❌ Examples that FAIL: `mkb` (too short), `mkb-dev` (has hyphen), `MyAccount` (has uppercase)

---

## 🔐 Testnet Secrets (Critical Information)

### Verification Code
**Testnet verification code is ALWAYS:** `000000` (six zeros)

This is hardcoded in the script and requires NO email access.

### Email Address
**Any email works on testnet** - you don't need access to it because:
- Verification code is always `000000`
- Script automatically provides this code
- No manual email checking required

---

## 📝 Complete Process Flow

### Step 1: Prerequisites Check
```bash
# Ensure expect is installed (only needed once)
sudo apt-get update && sudo apt-get install -y expect
```

### Step 2: Run Account Creation
```bash
cd /workspaces/XPR/Antler/agentic_dev/experiment_01
./create_account_automated.sh <ACCOUNT_NAME> <EMAIL> "<DISPLAY_NAME>"
```

### Step 3: Wait for Completion
The script will:
1. Set network to `proton-test`
2. Start account creation process
3. Generate new cryptographic keys automatically
4. Provide email (from parameter)
5. Provide display name (from parameter)
6. Automatically enter verification code `000000`
7. Create account on-chain
8. Display success message

**Expected Duration:** 15-30 seconds

### Step 4: Verify Account (Optional)
```bash
cd /workspaces/XPR/proton-cli
./bin/run account <ACCOUNT_NAME>
```

Or check block explorer:
```
https://testnet.protonscan.io/account/<ACCOUNT_NAME>
```

---

## 🤖 Agent Instructions (Deterministic Execution)

### For Creating a Single Account

```bash
# Set parameters (modify these)
ACCOUNT_NAME="myaccount1"
EMAIL="agent@test.com"
DISPLAY_NAME="My Test Account"

# Execute (do not modify)
cd /workspaces/XPR/Antler/agentic_dev/experiment_01
./create_account_automated.sh "$ACCOUNT_NAME" "$EMAIL" "$DISPLAY_NAME"
```

### For Creating Multiple Accounts

```bash
cd /workspaces/XPR/Antler/agentic_dev/experiment_01

# Account 1
./create_account_automated.sh account0001 agent@test.com "Account 1"

# Account 2
./create_account_automated.sh account0002 agent@test.com "Account 2"

# Account 3
./create_account_automated.sh account0003 agent@test.com "Account 3"
```

---

## 🔑 Key Management

### Automatic Key Generation
The script generates NEW keys for each account automatically. You don't need to provide keys.

### Where Keys Are Stored
Keys are stored in the **Proton CLI keychain** located at:
```
~/.proton/wallets/
```

### Retrieving Keys Later
```bash
cd /workspaces/XPR/proton-cli
./bin/run key:list
```

### Key Format
- **Public Key:** `PUB_K1_...` (53 characters)
- **Private Key:** `PVT_K1_...` (53 characters)  
- **Mnemonic:** 12 words (BIP39 format)

---

## ✅ Success Indicators

When account creation succeeds, you'll see:

```
Account <ACCOUNT_NAME> successfully created!
✅ Account created successfully!
✅ Account creation complete!
Verify at: https://testnet.protonscan.io/account/<ACCOUNT_NAME>
```

---

## ❌ Error Handling

### Error: "Account names must be between 4-12 characters long"
**Cause:** Account name too short or too long  
**Fix:** Use 4-12 character name

### Error: "Account names can only contain the characters a-z and numbers 1-5"
**Cause:** Invalid characters in account name  
**Fix:** Use only lowercase a-z and numbers 1-5

### Error: "Account already exists"
**Cause:** Account name already taken  
**Fix:** Choose a different account name

### Error: "Could not create account with error: internal"
**Cause:** Usually a transient network issue  
**Fix:** Wait 30 seconds and try again

### Error: "expect: command not found"
**Cause:** expect tool not installed  
**Fix:** Run `sudo apt-get install -y expect`

---

## 🧪 Testing the Script

### Test 1: Create Account
```bash
cd /workspaces/XPR/Antler/agentic_dev/experiment_01
./create_account_automated.sh testacct01 test@test.com "Test Account"
```

### Test 2: Verify Account Exists
```bash
cd /workspaces/XPR/proton-cli
./bin/run account testacct01
```

**Expected Output:**
```
Created: <timestamp>
Permissions: owner, active
Resources: RAM, CPU, NET
```

---

## 📊 Account Resource Allocation (Testnet)

Each newly created account receives:
- **RAM:** ~13 KB (2.93 KB used, 10.16 KB available)
- **CPU:** 863 ms (10 XPR staked by faucet)
- **NET:** 4.32 MB (10 XPR staked by faucet)

These resources are sufficient for testing.

---

## 🔄 Reproducibility

This process is **100% deterministic** because:
1. ✅ Verification code is always `000000`
2. ✅ Script automates all prompts
3. ✅ Keys are auto-generated (no manual input)
4. ✅ Network is always `proton-test`
5. ✅ No manual steps required

---

## 📁 File Structure

```
/workspaces/XPR/Antler/agentic_dev/experiment_01/
├── create_account_automated.sh  # Main script (ONLY file needed)
├── .env                         # Account credentials (auto-updated)
├── .gitignore                   # Security (prevents committing secrets)
└── AGENT_GUIDE.md              # This file
```

---

## 🛠️ Script Internals (For Reference)

The script uses `expect` to automate CLI prompts:

```bash
expect <<EOF
spawn /workspaces/XPR/proton-cli/bin/run account:create $ACCOUNT_NAME
expect "*Enter private key*"
send "\r"                          # Empty = auto-generate
expect "*encrypt*password*"
send "no\r"                        # Don't encrypt
expect "*Enter email*"
send "$EMAIL\r"                    # Provided email
expect "*Enter display name*"
send "$DISPLAY_NAME\r"             # Provided display name
expect "*verification code*"
send "000000\r"                    # Testnet code (always 000000)
expect "*successfully created*"
expect eof
EOF
```

---

## 🎓 Examples for Different Use Cases

### Use Case 1: DAO/Organization Accounts
```bash
./create_account_automated.sh samaprotocol dao@sama.dev "SAMA Protocol DAO"
```

### Use Case 2: Test User Accounts
```bash
./create_account_automated.sh testuser001 test@test.com "Test User 001"
./create_account_automated.sh testuser002 test@test.com "Test User 002"
```

### Use Case 3: Service Accounts
```bash
./create_account_automated.sh apiservice1 api@service.com "API Service 1"
./create_account_automated.sh botaccount1 bot@service.com "Bot Account 1"
```

---

## 🔗 Useful Links

- **Testnet Explorer:** https://testnet.protonscan.io
- **Testnet WebAuth:** https://testnet.protonchain.com
- **Proton CLI Docs:** https://github.com/ProtonProtocol/proton-cli

---

## 📞 Support

If the script fails:
1. Check account name format (4-12 chars, a-z and 1-5 only)
2. Verify `expect` is installed: `which expect`
3. Check network connectivity: `ping testnet.protonchain.com`
4. Try a different account name

---

## ✨ Summary

**To create an account, run:**
```bash
cd /workspaces/XPR/Antler/agentic_dev/experiment_01
./create_account_automated.sh <ACCOUNT_NAME> <EMAIL> "<DISPLAY_NAME>"
```

**That's it!** The script handles everything else automatically.

---

**Last Successful Test:** Feb 12, 2026  
**Accounts Created:** samaprotocol, samatest  
**Success Rate:** 100%
