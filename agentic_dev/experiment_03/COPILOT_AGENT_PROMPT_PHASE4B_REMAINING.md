# Copilot Agent Prompt - Phase 4B-Remaining (Final 6 Tools)

**Phase:** 4B-Remaining - NFT & Protocol Tools  
**Goal:** Complete 100% migration (32/32 blockchain tools)  
**Current Progress:** 81.3% (26/32)  
**Target Progress:** 100% (32/32)  
**Tools to Implement:** 6 (1 protocol + 5 NFT)

---

## 🎯 Execution Instructions

### Prerequisites

1. **Read Documentation:**
   - [CURRENT_STATUS.md](./CURRENT_STATUS.md) - Current state (81.3%)
   - [PROGRESS_METRICS.md](./PROGRESS_METRICS.md) - Verify SSoT
   - [TEST_RESULTS_PHASE4B_PARTIAL.md](./TEST_RESULTS_PHASE4B_PARTIAL.md) - Reference test patterns

2. **Verify Working Directory:**
   ```bash
   cd /workspaces/XPR/agentic_dev/experiment_04
   ```

3. **Check Current Deployment:**
   ```bash
   # Should show 27 tools deployed
   grep -c "@mcp.tool()" mcp-server/server.py
   ```

---

## 📋 Phase 4B-Remaining Tools (6 tools)

### Tool Group: Protocol & NFT Features

These are the final 6 tools to complete 100% migration from experiment_01.

---

## 🔧 Tool 1: get_protocol_features

**Category:** Protocol  
**Priority:** Medium  
**RPC Endpoint:** `/v1/chain/get_activated_protocol_features`

### Description Template (200-300 words)

```python
@mcp.tool()
async def get_protocol_features(limit: int = 100, lower_bound: int = 0) -> str:
    """
    Get activated protocol features and capabilities on Proton blockchain.
    
    Returns list of protocol features that have been activated via governance,
    including feature hashes, activation block numbers, and specifications. Protocol
    features enable new blockchain capabilities through on-chain governance.
    
    Returns protocol features:
    - Feature Hash: Unique identifier for protocol feature
    - Activation Block: When feature was activated
    - Specification: Feature details and version
    - Description: What the feature enables
    
    Protocol Features:
    - Activated via governance voting
    - Enable new blockchain capabilities
    - Cannot be deactivated once activated
    - Backward compatible with clients
    - Require supermajority approval
    
    Common Protocol Features:
    - PREACTIVATE_FEATURE: Enable feature pre-activation
    - ONLY_LINK_TO_EXISTING_PERMISSION: Permission security
    - FORWARD_SETCODE: Contract upgrades
    - WTMSIG_BLOCK_SIGNATURES: Block signature validation
    - GET_SENDER: Action sender context
    
    Use this to:
    - Verify blockchain capabilities
    - Check protocol version compatibility
    - Audit governance decisions
    - Understand available features
    - Build feature detection logic
    - Track protocol evolution
    
    Args:
        limit: Maximum features to return (default: 100)
        lower_bound: Starting index for pagination (default: 0)
        
    Returns:
        JSON with protocol features array or error
    """
    result = await call_proton_rpc(
        "/v1/chain/get_activated_protocol_features",
        {
            "limit": limit,
            "lower_bound": lower_bound,
            "json": True
        }
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)
```

---

## 🔧 Tool 2: get_account_nfts

**Category:** NFT  
**Priority:** Medium  
**RPC Endpoint:** `/v1/chain/get_table_rows` (atomicassets/assets)

### Description Template (200-300 words)

```python
@mcp.tool()
async def get_account_nfts(account: str, limit: int = 100, collection: str = None) -> str:
    """
    Get all AtomicAssets NFTs owned by a Proton account.
    
    Retrieves complete list of NFTs owned by an account, including asset IDs,
    collections, schemas, templates, and immutable/mutable data. AtomicAssets is
    the standard NFT implementation on Proton blockchain.
    
    Returns NFT list:
    - Asset ID: Unique NFT identifier
    - Collection: Which collection NFT belongs to
    - Schema: NFT schema name
    - Template ID: Template used (if any)
    - Immutable Data: Permanent NFT attributes
    - Mutable Data: Changeable NFT attributes
    - Backed Tokens: Tokens backing the NFT
    
    AtomicAssets Structure:
    - Collections: Groups of related NFTs
    - Schemas: Define NFT attributes
    - Templates: Reusable NFT configurations
    - Assets: Individual NFT instances
    - Mutable/Immutable: Data flexibility
    
    Common Collections:
    - Proton NFT collections
    - Game assets and items
    - Digital art and collectibles
    - In-game currency representations
    - Membership tokens
    
    Use this to:
    - Display user NFT portfolio
    - Verify NFT ownership
    - Build NFT marketplaces
    - Track collectible holdings
    - Audit NFT distributions
    - Filter by collection
    
    Args:
        account: Proton account name (e.g., "zenpunk")
        limit: Maximum NFTs to return (default: 100)
        collection: Optional filter by collection name
        
    Returns:
        JSON with NFT array or empty array if no NFTs
    """
    # Build scope and query params
    table_params = {
        "code": "atomicassets",
        "table": "assets",
        "scope": account,
        "limit": limit,
        "json": True
    }
    
    # Optional collection filter via index
    if collection:
        table_params["index_position"] = 2
        table_params["key_type"] = "name"
        table_params["lower_bound"] = collection
        table_params["upper_bound"] = collection
    
    result = await call_proton_rpc(
        "/v1/chain/get_table_rows",
        table_params
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)
```

---

## 🔧 Tool 3: get_nft_collections

**Category:** NFT  
**Priority:** Medium  
**RPC Endpoint:** `/v1/chain/get_table_rows` (atomicassets/collections)

### Description Template (200-300 words)

```python
@mcp.tool()
async def get_nft_collections(limit: int = 100, lower_bound: str = "") -> str:
    """
    Get all AtomicAssets NFT collections on Proton blockchain.
    
    Retrieves list of all NFT collections including collection names, authorized
    accounts, market fees, and metadata. Collections group related NFTs together
    under common branding and rules.
    
    Returns collection list:
    - Collection Name: Unique identifier
    - Author: Collection creator account
    - Authorized Accounts: Who can mint/modify
    - Market Fee: Marketplace fee percentage
    - Notify Accounts: Accounts to notify on actions
    - Data: Collection metadata (name, image, description)
    
    Collection Features:
    - Group related NFTs together
    - Set marketplace fees
    - Control minting permissions
    - Define collection branding
    - Enable collection-wide rules
    
    Collection Data Fields:
    - name: Display name
    - img: Collection image IPFS hash
    - description: Collection description
    - url: External website
    - socials: Social media links
    
    Use this to:
    - Browse available NFT collections
    - Discover new NFT projects
    - Verify collection authenticity
    - Check collection metadata
    - Build NFT explorers
    - Filter marketplace by collection
    
    Args:
        limit: Maximum collections to return (default: 100)
        lower_bound: Starting collection name for pagination
        
    Returns:
        JSON with collections array or empty array
    """
    result = await call_proton_rpc(
        "/v1/chain/get_table_rows",
        {
            "code": "atomicassets",
            "table": "collections",
            "scope": "atomicassets",
            "limit": limit,
            "lower_bound": lower_bound,
            "json": True
        }
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)
```

---

## 🔧 Tool 4: get_nft_schemas

**Category:** NFT  
**Priority:** Medium  
**RPC Endpoint:** `/v1/chain/get_table_rows` (atomicassets/schemas)

### Description Template (200-300 words)

```python
@mcp.tool()
async def get_nft_schemas(collection: str, limit: int = 100, lower_bound: str = "") -> str:
    """
    Get all schemas for an AtomicAssets NFT collection.
    
    Retrieves schemas that define the structure and attributes of NFTs within a
    collection. Schemas specify which attributes NFTs can have, their types, and
    which are immutable vs mutable.
    
    Returns schema list:
    - Schema Name: Unique identifier within collection
    - Format: Attribute definitions (name, type, mutable)
    - Created At: Schema creation timestamp
    - Collection: Parent collection name
    
    Schema Format:
    - Attribute Name: Field identifier (e.g., "name", "rarity")
    - Type: Data type (string, uint64, image, etc.)
    - Mutable: Can attribute change after minting
    
    Common Attribute Types:
    - string: Text data
    - uint64: Unsigned integer
    - image: IPFS image hash
    - bool: Boolean flag
    - double: Decimal number
    
    Use this to:
    - Understand NFT structure
    - Validate NFT attributes
    - Build NFT creation forms
    - Display NFT metadata correctly
    - Filter NFTs by attributes
    - Verify schema compliance
    
    Args:
        collection: Collection name (e.g., "proton.nft")
        limit: Maximum schemas to return (default: 100)
        lower_bound: Starting schema name for pagination
        
    Returns:
        JSON with schemas array or empty array
    """
    result = await call_proton_rpc(
        "/v1/chain/get_table_rows",
        {
            "code": "atomicassets",
            "table": "schemas",
            "scope": collection,
            "limit": limit,
            "lower_bound": lower_bound,
            "json": True
        }
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)
```

---

## 🔧 Tool 5: get_nft_templates

**Category:** NFT  
**Priority:** Medium  
**RPC Endpoint:** `/v1/chain/get_table_rows` (atomicassets/templates)

### Description Template (200-300 words)

```python
@mcp.tool()
async def get_nft_templates(collection: str, limit: int = 100, lower_bound: int = 0) -> str:
    """
    Get all templates for an AtomicAssets NFT collection.
    
    Retrieves reusable NFT templates that define default attributes for assets.
    Templates allow mass minting of similar NFTs with shared characteristics,
    reducing storage and simplifying NFT creation.
    
    Returns template list:
    - Template ID: Unique identifier
    - Schema: Which schema template uses
    - Transferable: Can NFTs minted from template be transferred
    - Burnable: Can NFTs be burned/destroyed
    - Max Supply: Maximum NFTs mintable from template (0 = unlimited)
    - Issued Supply: How many already minted
    - Immutable Data: Default immutable attributes
    
    Template Benefits:
    - Mass mint similar NFTs efficiently
    - Reduce on-chain storage
    - Ensure consistent attributes
    - Control supply caps
    - Define common properties
    
    Common Template Uses:
    - Game items (swords, armor, potions)
    - Collectible series (trading cards)
    - Membership tiers (bronze, silver, gold)
    - Event tickets (VIP, General)
    - Achievement badges
    
    Use this to:
    - Browse available NFT types
    - Check template supply limits
    - Verify template attributes
    - Build minting interfaces
    - Track template issuance
    - Analyze NFT rarity
    
    Args:
        collection: Collection name (e.g., "proton.nft")
        limit: Maximum templates to return (default: 100)
        lower_bound: Starting template ID for pagination
        
    Returns:
        JSON with templates array or empty array
    """
    result = await call_proton_rpc(
        "/v1/chain/get_table_rows",
        {
            "code": "atomicassets",
            "table": "templates",
            "scope": collection,
            "limit": limit,
            "lower_bound": lower_bound,
            "json": True
        }
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    return json.dumps(result, indent=2)
```

---

## 🔧 Tool 6: get_nft_asset

**Category:** NFT  
**Priority:** Medium  
**RPC Endpoint:** `/v1/chain/get_table_rows` (atomicassets/assets by ID)

### Description Template (200-300 words)

```python
@mcp.tool()
async def get_nft_asset(asset_id: str) -> str:
    """
    Get detailed information for a specific AtomicAssets NFT.
    
    Retrieves complete details for a single NFT including owner, collection, schema,
    template, immutable and mutable data, and backed tokens. Essential for displaying
    NFT details and verifying ownership.
    
    Returns asset details:
    - Asset ID: Unique NFT identifier
    - Owner: Current owner account
    - Collection: Which collection NFT belongs to
    - Schema: NFT schema name
    - Template ID: Template used (if any, -1 if none)
    - Immutable Data: Permanent attributes (name, rarity, etc.)
    - Mutable Data: Changeable attributes (level, experience, etc.)
    - Backed Tokens: Tokens locked in NFT
    - Transferred At: Last transfer timestamp
    - Minted At: Creation timestamp
    
    Data Structure:
    - Immutable: Set at mint, never changes
    - Mutable: Can be modified by authorized accounts
    - Backed: Tokens redeemable by burning NFT
    
    Use this to:
    - Display NFT details in marketplace
    - Verify NFT ownership and authenticity
    - Check NFT attributes and rarity
    - Show NFT history and provenance
    - Build NFT profile pages
    - Validate NFT transfers
    
    Args:
        asset_id: NFT asset ID (e.g., "1099511627776")
        
    Returns:
        JSON with complete NFT details or error if not found
    """
    # Query assets table by primary key (asset_id)
    result = await call_proton_rpc(
        "/v1/chain/get_table_rows",
        {
            "code": "atomicassets",
            "table": "assets",
            "scope": "atomicassets",
            "lower_bound": asset_id,
            "upper_bound": asset_id,
            "limit": 1,
            "json": True
        }
    )
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    # Check if asset found
    if not result.get("rows"):
        return json.dumps({"error": f"NFT asset {asset_id} not found"}, indent=2)
    
    return json.dumps(result["rows"][0], indent=2)
```

---

## 🚀 Implementation Steps

### Step 1: Read Current State
```bash
# Read files in this order:
1. CURRENT_STATUS.md - Current progress
2. PROGRESS_METRICS.md - Verify 81.3%
3. TEST_RESULTS_PHASE4B_PARTIAL.md - Test patterns
4. This file (COPILOT_AGENT_PROMPT_PHASE4B_REMAINING.md)
```

### Step 2: Implement 6 Tools

**File:** `/workspaces/XPR/agentic_dev/experiment_04/mcp-server/server.py`

**Insertion Point:** Before the "Legacy/Demo Tools" section (around line 1145)

**Code to Add:** ~350 lines total (~60 lines per tool)

1. Copy tool templates from above
2. Insert before legacy tools section
3. Verify syntax (no missing imports)
4. Check indentation consistency

### Step 3: Deploy to Azure

```bash
cd /workspaces/XPR/agentic_dev/experiment_04
azd deploy --no-prompt
```

**Expected Output:**
- Deployment time: 1-2 minutes
- Success message: "Your app was deployed successfully"
- Total tools: 33 (31 blockchain + 2 legacy)

### Step 4: Update Documentation

#### 4a. Update CHANGES.md

Add Change #018 at the top:

```markdown
### Change #018: Phase 4B-Remaining - Final 6 Tools (100% Complete)
**Timestamp:** 2025-12-26 02:00 UTC  
**Type:** Feature Addition  
**Deployment Time:** ~1m 20s  
**Progress:** 81.3% → 100%

**Tools Added:**
1. get_protocol_features - Activated protocol features
2. get_account_nfts - NFTs owned by account
3. get_nft_collections - All NFT collections
4. get_nft_schemas - Collection schemas
5. get_nft_templates - Collection templates
6. get_nft_asset - Detailed NFT info

**Milestone:** 🎉 100% Migration Complete (32/32 blockchain tools)

**Files Modified:**
- server.py - Added 6 new @mcp.tool() functions (~350 lines)

**Test Results:**
- Deployment: ✅ Success
- Status: Testing pending MCP client refresh

**Notes:**
- Completes experiment_01 → experiment_04 migration
- All 32 blockchain tools now in production
- AtomicAssets NFT integration complete
- Protocol features endpoint added
```

#### 4b. Update PROGRESS_METRICS.md

Change overall progress:
```markdown
| Metric | Value |
|--------|-------|
| **Total Tools** | 32 |
| **Completed** | 32 |
| **Percentage** | 100% |
| **Current Phase** | Complete ✅ |
```

Update category completion:
```markdown
| **NFT** | 5 | 5 | 100% | ✅ Complete |
| **Protocol** | 1 | 1 | 100% | ✅ Complete |
```

Add Phase 4B-Remaining:
```markdown
| **Phase 4B-Remaining** | 6 | ✅ Complete & Deployed | Dec 26, 2025 | 2 hours |
```

#### 4c. Create TEST_RESULTS_PHASE4B_REMAINING.md

Follow pattern from TEST_RESULTS_PHASE4B_PARTIAL.md with test cases for all 6 tools.

#### 4d. Create PHASE4B_COMPLETION_SUMMARY.md

Document final phase completion, 100% achievement, lessons learned.

#### 4e. Update CURRENT_STATUS.md

Mark Phase 4B-Remaining as complete, update progress bar to 100%.

---

## ✅ Success Criteria

### Deployment
- [ ] All 6 tools deployed successfully
- [ ] No syntax errors in server.py
- [ ] Azure Functions running
- [ ] Total tools: 33 (31 blockchain + 2 legacy)

### Functionality
- [ ] get_protocol_features returns activated features
- [ ] get_account_nfts queries atomicassets/assets
- [ ] get_nft_collections lists collections
- [ ] get_nft_schemas returns schemas for collection
- [ ] get_nft_templates lists templates
- [ ] get_nft_asset retrieves single asset by ID

### Documentation
- [ ] CHANGES.md updated with Change #018
- [ ] PROGRESS_METRICS.md shows 100%
- [ ] TEST_RESULTS_PHASE4B_REMAINING.md created
- [ ] PHASE4B_COMPLETION_SUMMARY.md created
- [ ] CURRENT_STATUS.md updated

---

## 🎯 Final Milestone

**Achievement:** 100% Migration Complete (32/32 blockchain tools)

**From:**
- experiment_01: Node.js local MCP server
- 32 tools in TypeScript

**To:**
- experiment_04: Python Azure Functions
- 32 tools in Python FastMCP
- Production-ready with monitoring
- 4-endpoint RPC failover
- ~200-300ms response time
- 100% deployment success rate

**Total Investment:**
- ~9.5 hours development time
- 6 deployment phases
- 0 failed deployments
- Comprehensive documentation

---

## 📊 Final Statistics

| Metric | Value |
|--------|-------|
| **Tools Migrated** | 32/32 (100%) |
| **Total Deployments** | 6 phases |
| **Deployment Success** | 100% |
| **Average Deploy Time** | 1m 15s |
| **Total Development** | 9.5 hours |
| **Lines of Code** | ~1,600 lines |
| **Documentation** | 15+ MD files |
| **RPC Endpoints** | 4 with failover |

---

**Ready to execute?** Follow Implementation Steps above to complete the final phase!

**After completion, celebrate! 🎉 You've achieved 100% migration from experiment_01 to production-ready Azure Functions.**
