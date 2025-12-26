# Documentation Dependencies Map

**Purpose:** Define which documentation files must be updated when specific changes occur  
**Usage:** Checklist to ensure ubiquitous documentation synchronization  
**Last Updated:** December 25, 2025 23:55 UTC

---

## 🎯 Core Principle

**Single Source of Truth (SSoT):** Each piece of information lives in exactly ONE place. Other files reference or pull from that source.

**Cascade Pattern:** When a source file changes, dependent files must be updated to maintain consistency.

---

## 📊 Trigger → Update Cascade

### Trigger 1: Tool Added to server.py

**Primary File Changed:** `mcp-server/server.py`

**Required Updates (in order):**

1. **PROGRESS_METRICS.md** (SSoT for metrics)
   - Path: `/workspaces/XPR/agentic_dev/experiment_04/PROGRESS_METRICS.md`
   - Update: Increment tool count (X/32)
   - Update: Recalculate percentage
   - Update: Add tool to "Tools Implemented" section
   - Update: Update history table

2. **CHANGES.md** (Change log)
   - Path: `/workspaces/XPR/agentic_dev/experiment_04/CHANGES.md`
   - Add: New change entry with tool details
   - Include: Code snippet, deployment info, testing results

3. **EXPERIMENT_01_TOOLS_INVENTORY.md** (Tool catalog)
   - Path: `/workspaces/XPR/agentic_dev/experiment_04/EXPERIMENT_01_TOOLS_INVENTORY.md`
   - Update: Change ❌ to ✅ for the tool
   - Update: Add implementation code snippet
   - Update: Add migration status

4. **README.md** (User-facing)
   - Path: `/workspaces/XPR/agentic_dev/experiment_04/README.md`
   - Update: "Available Tools" section
   - Reference: Link to PROGRESS_METRICS.md for count
   - Add: Tool to appropriate phase section

5. **INDEX.md** (Navigation)
   - Path: `/workspaces/XPR/agentic_dev/experiment_04/INDEX.md`
   - Update: Version history
   - Update: Last updated timestamp
   - Reference: Link to PROGRESS_METRICS.md

**Optional (if new tool introduces new concepts):**
- TOOL_EXPLANATIONS_PHASE[X].md - Add detailed documentation
- agent.md - Update architecture if significant change

---

### Trigger 2: Phase Completed

**Primary Event:** All tools in a phase are implemented and tested

**Required Updates (in order):**

1. **PROGRESS_METRICS.md** (SSoT for metrics)
   - Update: Phase status (⏳ → ✅)
   - Update: Overall progress metrics
   - Update: Phase completion date
   - Update: Actual vs estimated time

2. **CHANGES.md** (Change log)
   - Add: Phase completion summary entry
   - Include: All tools added, deployment info, lessons learned

3. **MIGRATION_PLAN.md** (Migration strategy)
   - Update: Phase checkboxes ([x] all tools)
   - Update: Success criteria checkboxes
   - Update: Total progress footer

4. **EXPERIMENT_01_TOOLS_INVENTORY.md** (Tool catalog)
   - Update: Category completion percentages
   - Verify: All phase tools marked ✅

5. **COPILOT_AGENT_PROMPTS_INDEX.md** (Phase tracker)
   - Update: Phase status (📝 Ready → ✅ Complete)
   - Update: Achievements section
   - Update: Overall migration status
   - Update: Time estimates

6. **README.md** (User-facing)
   - Update: Progress badge/percentage
   - Update: Tool list for completed phase
   - Reference: Link to PROGRESS_METRICS.md

7. **INDEX.md** (Navigation)
   - Update: Version history
   - Update: Progress metrics reference

8. **Create Next Phase Prompt** (if phases remain)
   - Create: COPILOT_AGENT_PROMPT_PHASE[X+1].md
   - Update: COPILOT_AGENT_PROMPTS_INDEX.md with new prompt
   - Reference: Include lessons learned from current phase

---

### Trigger 3: New Documentation File Created

**Primary Event:** New .md file added to project

**Required Updates:**

1. **INDEX.md** (Navigation hub)
   - Add: New file to Quick Navigation table
   - Add: File description section
   - Update: Documentation Stats
   - Update: Version history

2. **README.md** (Documentation map)
   - Add: Reference in "Documentation Map" section
   - Update: Reading order if applicable

3. **.gitignore** (if needed)
   - Add: File to ignore list if temporary/generated

4. **PROGRESS_METRICS.md** (if documentation milestone)
   - Update: Related documents section
   - Add: Link to new file

---

### Trigger 4: Deployment to Azure

**Primary Event:** `azd deploy --no-prompt` completes successfully

**Required Updates:**

1. **DEPLOYMENT_INFO.md** (Current state)
   - Update: Last deployment date/time
   - Update: Deployment duration
   - Update: Current version number
   - Verify: Endpoint URL unchanged

2. **CHANGES.md** (Change log)
   - Update: Current change entry with deployment results
   - Add: Deployment time and status

3. **PROGRESS_METRICS.md** (Metrics)
   - Update: Tool deployment status
   - Update: Quality metrics (success rate)

---

### Trigger 5: Testing Completed

**Primary Event:** All tools in a phase tested successfully

**Required Updates:**

1. **CHANGES.md** (Change log)
   - Update: Testing section in current change entry
   - Add: Test results, response times, issues found

2. **PROGRESS_METRICS.md** (Metrics)
   - Update: Test coverage percentage
   - Update: Quality metrics

3. **TOOL_EXPLANATIONS_PHASE[X].md** (if exists)
   - Add: Real test results
   - Add: Actual response examples
   - Add: Performance data

4. **MIGRATION_PLAN.md** (Strategy)
   - Check: Success criteria for testing
   - Update: If all criteria met

---

### Trigger 6: Documentation Architecture Change

**Primary Event:** New documentation pattern or structure introduced

**Required Updates:**

1. **ITERATION_GUIDE.md** (Process guide)
   - Update: Relevant phase with new pattern
   - Add: Example of new approach
   - Update: Checklists if process changes

2. **INDEX.md** (Navigation)
   - Update: Document descriptions if changed
   - Update: Cross-reference section
   - Update: Best practices section

3. **DOCUMENTATION_DEPENDENCIES.md** (this file)
   - Update: Trigger definitions
   - Update: Cascade rules
   - Add: New patterns

4. **All affected documentation files**
   - Implement: New pattern consistently
   - Verify: Pattern applied correctly

---

## 🔄 Update Frequency Guidelines

| File | Update Frequency | Trigger Events |
|------|-----------------|----------------|
| **PROGRESS_METRICS.md** | Every tool/phase | Tool added, phase complete |
| **CHANGES.md** | Every change | Any code modification |
| **INDEX.md** | Rarely | New doc, major restructure |
| **README.md** | Per phase | Phase complete, major feature |
| **agent.md** | Rarely | Architecture change |
| **ITERATION_GUIDE.md** | Per phase | Process improvement |
| **MIGRATION_PLAN.md** | Per phase | Phase complete |
| **EXPERIMENT_01_TOOLS_INVENTORY.md** | Per tool | Tool implemented |
| **COPILOT_AGENT_PROMPTS_INDEX.md** | Per phase | Phase complete, prompt created |
| **DEPLOYMENT_INFO.md** | Per deployment | azd deploy |

---

## 🎯 Single Source of Truth (SSoT) Registry

### Progress Metrics
**SSoT:** `PROGRESS_METRICS.md`  
**Consumers:**
- README.md → References for tool count
- INDEX.md → References for progress
- COPILOT_AGENT_PROMPTS_INDEX.md → References for phase status
- MIGRATION_PLAN.md → Cross-references

**Rule:** Never duplicate progress numbers. Always link to PROGRESS_METRICS.md

---

### Tool Implementations
**SSoT:** `mcp-server/server.py`  
**Consumers:**
- PROGRESS_METRICS.md → Counts tools
- EXPERIMENT_01_TOOLS_INVENTORY.md → Documents tools
- README.md → Lists tools
- TOOL_EXPLANATIONS_PHASE[X].md → Explains tools

**Rule:** Code is truth. Documentation follows code.

---

### Change History
**SSoT:** `CHANGES.md`  
**Consumers:**
- DEPLOYMENT_JOURNEY.md → References specific changes
- INDEX.md → Links to change log
- ITERATION_GUIDE.md → Uses as examples

**Rule:** All changes documented chronologically in CHANGES.md

---

### Phase Execution
**SSoT:** `COPILOT_AGENT_PROMPT_PHASE[X].md`  
**Consumers:**
- COPILOT_AGENT_PROMPTS_INDEX.md → Lists all prompts
- ITERATION_GUIDE.md → References pattern
- MIGRATION_PLAN.md → Defines phases

**Rule:** One prompt file per phase. Index tracks all.

---

## 📋 Validation Checklist

### After Each Tool Implementation

- [ ] **PROGRESS_METRICS.md**
  - [ ] Tool count incremented
  - [ ] Percentage recalculated correctly
  - [ ] Tool added to "Tools Implemented"
  - [ ] Update history appended

- [ ] **CHANGES.md**
  - [ ] New change entry created
  - [ ] Problem and solution documented
  - [ ] Code snippets included
  - [ ] Deployment and testing results added

- [ ] **EXPERIMENT_01_TOOLS_INVENTORY.md**
  - [ ] Tool status changed to ✅
  - [ ] Implementation code added
  - [ ] Category percentage updated

- [ ] **README.md**
  - [ ] Tool added to appropriate section
  - [ ] Progress reference updated/verified
  - [ ] Examples work (if added)

- [ ] **INDEX.md**
  - [ ] Version bumped
  - [ ] Last updated timestamp current
  - [ ] Progress reference accurate

---

### After Phase Completion

- [ ] **All tool validation items** (above)

- [ ] **MIGRATION_PLAN.md**
  - [ ] All phase checkboxes marked [x]
  - [ ] Success criteria evaluated
  - [ ] Total progress updated

- [ ] **COPILOT_AGENT_PROMPTS_INDEX.md**
  - [ ] Phase status updated to ✅ Complete
  - [ ] Completion date added
  - [ ] Achievements documented
  - [ ] Next phase status updated to 📝 Ready

- [ ] **Next Phase Prompt**
  - [ ] COPILOT_AGENT_PROMPT_PHASE[X+1].md created
  - [ ] Based on lessons from current phase
  - [ ] Referenced in index

- [ ] **TOOL_EXPLANATIONS_PHASE[X].md**
  - [ ] Created for current phase
  - [ ] All tools documented
  - [ ] Examples and test results included

---

## 🚀 Automation Opportunities

### Scriptable Updates

**Progress Metrics:**
```bash
# Script: scripts/update_progress.py
# Parses server.py, counts @mcp.tool() decorators
# Updates PROGRESS_METRICS.md automatically
```

**Link Validation:**
```bash
# Script: scripts/validate_docs.py
# Checks all [text](link.md) references
# Reports broken links
```

**Consistency Check:**
```bash
# Script: scripts/check_consistency.py
# Verifies progress numbers match across all files
# Alerts on discrepancies
```

**Template Expansion:**
```bash
# Script: scripts/generate_phase_docs.py
# Creates TOOL_EXPLANATIONS_PHASE[X].md from template
# Populates with tool info from server.py
```

---

## 💡 Best Practices

### 1. Update in Dependency Order
Always update files in the order listed in cascade rules. This ensures downstream files have correct upstream data.

### 2. Verify SSoT First
Before updating dependent files, verify the single source of truth is correct. All other files derive from it.

### 3. Use Atomic Commits
Group related documentation updates in a single commit. Example: "Phase 2 complete - update all docs"

### 4. Cross-Reference, Don't Duplicate
When showing progress in multiple files, link to PROGRESS_METRICS.md instead of copying numbers.

### 5. Validate Before Commit
Run validation scripts before committing to catch inconsistencies early.

---

## 🔗 Related Documents

- [PROGRESS_METRICS.md](./PROGRESS_METRICS.md) - Single source of truth for progress
- [ITERATION_GUIDE.md](./ITERATION_GUIDE.md) - Phase 7 uses this cascade
- [INDEX.md](./INDEX.md) - Document navigation hub
- [DOCUMENTATION_ARCHITECTURE_ANALYSIS.md](./DOCUMENTATION_ARCHITECTURE_ANALYSIS.md) - Analysis and recommendations

---

## 📊 Dependency Graph Visualization

```
server.py (Code SSoT)
    ├──> PROGRESS_METRICS.md (Metrics SSoT)
    │       ├──> README.md (Reference)
    │       ├──> INDEX.md (Reference)
    │       ├──> COPILOT_AGENT_PROMPTS_INDEX.md (Reference)
    │       └──> MIGRATION_PLAN.md (Cross-reference)
    │
    ├──> CHANGES.md (History SSoT)
    │       ├──> DEPLOYMENT_JOURNEY.md (Reference)
    │       └──> ITERATION_GUIDE.md (Examples)
    │
    └──> EXPERIMENT_01_TOOLS_INVENTORY.md (Catalog)

Phase Completion
    ├──> COPILOT_AGENT_PROMPT_PHASE[X+1].md (Create next)
    ├──> COPILOT_AGENT_PROMPTS_INDEX.md (Update index)
    └──> TOOL_EXPLANATIONS_PHASE[X].md (Document current)
```

---

**Maintained By:** Documentation Team  
**Update Trigger:** When cascade rules change  
**Validation:** Verify cascade works on next phase
