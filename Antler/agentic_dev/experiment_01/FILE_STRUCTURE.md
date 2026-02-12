# 📁 File Structure - Proton Testnet Account Creation

## Essential Files (Required for Setup)

### 1. **create_account_automated.sh** ⭐ MAIN SCRIPT
**Purpose:** Automated account creation script  
**Size:** ~5 KB  
**What it does:**
- Checks/installs dependencies (expect, Proton CLI)
- Configures testnet network
- Generates cryptographic keys automatically
- Creates blockchain account with automated prompts
- Provides success/failure feedback

**Used by:** Agents executing the Moltbook prompt  
**Can run standalone:** ✅ YES - This is the ONLY file needed

```bash
# This file contains everything needed:
./create_account_automated.sh <account_name>
```

---

## Documentation Files (For Reference Only)

### 2. **SHARE_ON_MOLTBOOK.md** 📋
**Purpose:** Ready-to-share prompt for Moltbook  
**Size:** ~5 KB  
**Contents:**
- Copy-paste prompt for agents
- Code reference links (GitHub)
- Technical breakdown of what script does
- Example usage patterns

**Used by:** Humans sharing on Moltbook  
**Required for execution:** ❌ NO - Documentation only

---

### 3. **MOLTBOOK_PROMPT.md** 📖
**Purpose:** Detailed agent instructions  
**Size:** ~8 KB  
**Contents:**
- Complete agent workflow
- Parameter explanations
- Error handling guide
- Examples for different use cases

**Used by:** Agents reading before execution  
**Required for execution:** ❌ NO - Helpful but not required

---

### 4. **AGENT_GUIDE.md** 📚
**Purpose:** Comprehensive technical guide  
**Size:** ~8 KB  
**Contents:**
- Complete process flow
- Deterministic instructions
- Parameter reference
- Troubleshooting section
- Success indicators

**Used by:** Agents needing detailed reference  
**Required for execution:** ❌ NO - Reference material

---

## Configuration Files (Auto-Generated)

### 5. **.env** 🔐
**Purpose:** Store account credentials  
**Size:** ~1 KB  
**Contents:**
```bash
PROTON_ACCOUNT_NAME=samaprotocol
PROTON_PUBLIC_KEY=PUB_K1_...
PROTON_PRIVATE_KEY=PVT_K1_...
PROTON_MNEMONIC=twelve word recovery phrase
ACCOUNT_CREATED=true
```

**Used by:** Previous manual workflows (legacy)  
**Required for script:** ❌ NO - Script generates new keys each time

---

### 6. **.keys_*.json** 🔑
**Purpose:** Backup key storage (legacy from manual setup)  
**Examples:** 
- `.keys_samaprotocol.json`
- `.keys_samatest.json`

**Contents:**
```json
{
  "public": "PUB_K1_...",
  "private": "PVT_K1_...",
  "mnemonic": "twelve words..."
}
```

**Used by:** Manual key generation scripts (deleted)  
**Required for script:** ❌ NO - Script auto-generates keys

---

### 7. **.gitignore** 🚫
**Purpose:** Prevent committing secrets to git  
**Size:** ~200 bytes  
**Contents:**
```
.env
.keys_*.json
*.log
```

**Used by:** Git version control  
**Required for script:** ❌ NO - Security best practice only

---

## Summary: What An Agent Actually Needs

### Minimum Required Files:
```
create_account_automated.sh  ← ONLY THIS FILE
```

### Recommended Files (for understanding):
```
SHARE_ON_MOLTBOOK.md        ← Quick start instructions
AGENT_GUIDE.md              ← Detailed reference
```

### Generated After Execution:
```
/workspaces/XPR/proton-cli/  ← Installed by script
~/.proton/wallets/           ← Keys stored here
```

---

## Download & Execute (Single Command)

Agents only need to download and run ONE file:

```bash
# Download script
curl -o create_account.sh https://raw.githubusercontent.com/ZEN-PUNK/XPR/main/Antler/agentic_dev/experiment_01/create_account_automated.sh

# Make executable
chmod +x create_account.sh

# Run (creates account + keys)
./create_account.sh <your_account_name>
```

**That's it!** No other files needed.

---

## File Dependencies Flow

```
Agent Downloads
    ↓
create_account_automated.sh (ONLY file needed)
    ↓
    ├─→ Checks for Proton CLI
    │   └─→ If missing: git clone + npm install
    │
    ├─→ Checks for expect
    │   └─→ If missing: apt-get install
    │
    ├─→ Executes: ./bin/run key:generate
    │   └─→ Creates: PUB_K1_..., PVT_K1_..., mnemonic
    │
    └─→ Executes: ./bin/run account:create
        └─→ Result: Live blockchain account
```

---

## Cleanup (Optional)

To remove all generated files:

```bash
# Remove Proton CLI
rm -rf /workspaces/XPR/proton-cli

# Remove keys from keychain
rm -rf ~/.proton

# Remove downloaded script
rm create_account.sh
```

---

## GitHub Repository Structure

```
/workspaces/XPR/Antler/agentic_dev/experiment_01/
│
├── create_account_automated.sh  ⭐ MAIN SCRIPT (REQUIRED)
│
├── SHARE_ON_MOLTBOOK.md        📋 Sharing prompt (documentation)
├── MOLTBOOK_PROMPT.md          📖 Agent instructions (documentation)
├── AGENT_GUIDE.md              📚 Technical reference (documentation)
│
├── .env                        🔐 Credentials (legacy, not needed)
├── .keys_*.json               🔑 Key backups (legacy, not needed)
└── .gitignore                  🚫 Git security (best practice)
```

---

## Key Insight

**99% of users only need:**
```bash
create_account_automated.sh
```

**Documentation files exist to:**
- Help humans understand the process
- Provide agents with context
- Enable troubleshooting
- Show examples

But the script is **fully self-contained** and can run without any documentation.
