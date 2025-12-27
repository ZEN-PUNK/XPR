# AI Agent Cleanup Template - Experiment 02 Documentation

**Created:** December 26, 2025  
**Purpose:** Guide for AI agents to clean up irrelevant documentation in future experiments  
**Target:** Experiments using experiment_02 as base but with outdated/irrelevant content

---

## 🎯 Problem Statement

Experiment 02 was originally based on Microsoft Azure sample code for hosting MCP servers. Future experiments (03, 04, etc.) may have copied this documentation, resulting in:

- ❌ References to Microsoft-specific features (Entra ID, Graph API, OBO flow)
- ❌ Generic Azure Functions hosting instructions unrelated to XPR blockchain
- ❌ Copilot/VS Code specific examples that don't apply to XPR-MCP
- ❌ Video thumbnails and external Microsoft resources
- ❌ Multi-language SDK references (C#/.NET, Node) not used in XPR project

---

## 🔍 Detection Criteria

**If you see a README.md or documentation file with ANY of these, it needs cleanup:**

### Microsoft-Specific References (DELETE)
- `Microsoft Entra` or `Entra ID`
- `Microsoft Graph API`
- `On-Behalf-Of (OBO) Flow`
- `OnBehalfOfCredential`
- `ManagedIdentityCredential`
- `get_user_info` tool with Microsoft Graph integration
- `PRE_AUTHORIZED_CLIENT_IDS`
- `SERVICE_MANAGEMENT_REFERENCE`
- References to Microsoft tenant or employee requirements

### Generic Azure Samples Content (DELETE)
- Video thumbnails (`media/video-thumbnail.jpg`)
- References to `Azure-Samples` GitHub repos
- Generic weather server examples
- Multi-language SDK tables (C#, Node, etc.) unrelated to Python XPR project
- Built-in authentication/authorization sections about PRM/ASM
- VS Code Copilot agent mode instructions with `#local-mcp-server` hashtag

### Outdated Template Instructions (DELETE)
- `azd init --template self-hosted-mcp-scaffold-python`
- Instructions for "If you already have an existing server..."
- Instructions for "If you're starting from scratch..."
- Clone commands for `mcp-sdk-functions-hosting-python`

---

## ✅ What to Keep

**XPR-Specific Content (KEEP):**
- Proton blockchain references
- XPR RPC endpoint information
- Blockchain tool descriptions (accounts, balances, transactions, etc.)
- Project-specific architecture diagrams
- Links to other experiments in the XPR project
- Deployment instructions specific to XPR-MCP server

**Azure Functions Basics (KEEP if relevant):**
- Basic `azd up`/`azd deploy` commands
- Azure Functions Core Tools requirements
- `func start` for local testing
- Resource provider registration (`Microsoft.App`)

---

## 🔧 Cleanup Actions

### Action 1: Remove Microsoft Authentication Sections

**Search for these section headers and DELETE entire sections:**
```markdown
## Demonstrating On-Behalf-Of (OBO) Flow
### How the OBO Flow Works
## Built-in server authentication and authorization
### Support for other clients
```

**Also remove these specific instructions:**
```bash
azd env set PRE_AUTHORIZED_CLIENT_IDS aebc6443-996d-45c2-90f0-388ff96faa56
azd env set SERVICE_MANAGEMENT_REFERENCE <service-management-reference>
```

### Action 2: Remove Generic Sample Content

**DELETE sections like:**
- Video overview sections with YouTube links
- `## If you already have an existing server...`
- `## If you're starting from scratch...`
- Multi-language sample table (`C# (.NET)`, `Node`)
- Generic weather server testing examples

### Action 3: Replace with XPR-Specific Content

**After cleanup, ensure README contains:**

1. **Project Context**
   ```markdown
   # XPR-MCP Server - Experiment [XX]
   **Project:** Proton Blockchain MCP Integration
   ```

2. **XPR Architecture**
   ```markdown
   ## Architecture
   xpr-mcp server → Azure Functions → Proton RPC endpoints
   ```

3. **Available Tools**
   ```markdown
   ## Available Tools
   - Account queries
   - Token balances
   - Smart contract data
   - Transaction history
   - DeFi operations (lending, swaps, LP positions)
   ```

4. **Related Experiments**
   ```markdown
   ## Related Experiments
   - experiment_01: [Description]
   - experiment_02: [Description]
   - experiment_04: Production implementation (recommended)
   ```

### Action 4: Update Prerequisites

**Remove:**
- `[Azure Functions extension on Visual Studio Code]` (optional)
- Microsoft Entra app permission requirements
- Microsoft employee-specific notes

**Keep:**
- Azure subscription (optional)
- Azure Developer CLI
- Azure Functions Core Tools
- uv (Python package manager)

### Action 5: Simplify Testing Instructions

**Replace complex Copilot testing with:**
```markdown
### Local Testing
1. Navigate to mcp-server directory
2. Start server: `uv run func start`
3. Configure MCP client to connect to `http://localhost:7071`
4. Test blockchain tools via MCP protocol
```

---

## 📋 Cleanup Checklist

Use this checklist when cleaning up experiment_02-based documentation:

### Detection Phase
- [ ] Check for Microsoft Entra/Graph API references
- [ ] Check for OBO flow documentation
- [ ] Check for generic weather/sample server examples
- [ ] Check for multi-language SDK references
- [ ] Check for video thumbnails or external sample repos

### Removal Phase
- [ ] Remove all Microsoft authentication sections
- [ ] Remove generic Azure sample instructions
- [ ] Remove multi-language table
- [ ] Remove video overview section
- [ ] Remove `PRE_AUTHORIZED_CLIENT_IDS` configuration
- [ ] Remove `SERVICE_MANAGEMENT_REFERENCE` configuration
- [ ] Remove weather server test examples
- [ ] Remove VS Code Copilot hashtag examples

### Replacement Phase
- [ ] Add XPR-MCP project header
- [ ] Add Proton blockchain context
- [ ] Add XPR architecture diagram/description
- [ ] Add blockchain tool list
- [ ] Add links to other XPR experiments
- [ ] Simplify local testing instructions
- [ ] Add migration note (if archived)

### Validation Phase
- [ ] No Microsoft-specific services mentioned
- [ ] No generic sample server references
- [ ] Focus is clearly on Proton blockchain
- [ ] Prerequisites are XPR-relevant
- [ ] Testing instructions use XPR tools
- [ ] Links point to XPR project docs

---

## 🤖 AI Agent Prompt Template

**Copy this prompt when an AI agent needs to clean up experiment_02 documentation:**

```
Task: Clean up experiment_02 documentation by removing all Microsoft-specific and generic Azure sample content.

Context:
- This is XPR-MCP server for Proton blockchain
- Original template was Microsoft Azure sample for weather servers
- Need to remove: Entra ID, Graph API, OBO flow, generic samples, multi-language refs
- Need to keep: Azure Functions basics, XPR blockchain context, tool descriptions

Actions:
1. Read current README.md in experiment_02/mcp-server/
2. Identify and remove ALL sections listed in EXPERIMENT_02_CLEANUP_GUIDE.md
3. Replace with XPR-specific content following the template
4. Ensure focus is on Proton blockchain, not Microsoft services
5. Validate using cleanup checklist
6. Update any cross-references in other experiments

Reference: /workspaces/XPR/agentic_dev/experiment_02/EXPERIMENT_02_CLEANUP_GUIDE.md
```

---

## 📁 Files to Check in Other Experiments

If future experiments (03, 04, 05...) were based on experiment_02, check these files:

```
experiment_XX/
├── README.md                          ⚠️ PRIMARY CLEANUP TARGET
├── mcp-server/README.md              ⚠️ CHECK FOR DUPLICATES
├── AGENTIC_GUIDE.md                  ✓ Usually OK
├── API_REFERENCE.md                  ✓ Usually OK
├── ARCHITECTURE.md                   ⚠️ Check for OBO flow diagrams
└── TROUBLESHOOTING.md                ⚠️ Check for Entra ID issues
```

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-26 | Initial cleanup template created |
| 1.0 | 2025-12-26 | Experiment_02 README.md cleaned |

---

## 📚 See Also

- [experiment_02/README.md](./mcp-server/README.md) - Cleaned version (reference)
- [experiment_04/CURRENT_STATUS.md](../experiment_04/CURRENT_STATUS.md) - Latest implementation
- [experiment_04/SEQUENTIAL_TOOL_USAGE_GUIDE.md](../experiment_04/SEQUENTIAL_TOOL_USAGE_GUIDE.md) - Tool workflows

---

**Remember:** The goal is to make documentation **XPR-blockchain focused**, not generic Azure/Microsoft sample focused.
