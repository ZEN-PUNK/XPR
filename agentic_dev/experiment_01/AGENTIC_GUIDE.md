# Agentic Development Guide for Experiment 01

> **Purpose:** Enable AI agents and developers to efficiently navigate, understand, and extend this codebase using agentic patterns and copilot-assisted development.

## Quick Navigation for Agents

### 🎯 First 5 Minutes
1. **Understand scope**: Read `EXPERIMENT_SCOPE.md` (what this does, what it doesn't)
2. **See the code**: `/src/server.ts` is entry point (320 lines)
3. **Run it**: `npm start` → server on localhost:3001
4. **Test it**: `curl -X POST http://localhost:3001 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'`

### 🔍 Understanding the Codebase

**Context Window Optimization:**
- Core logic is ~600 lines TypeScript (src/)
- Use `find_symbol_usage` to trace dependencies
- Each file has clear single responsibility
- Dependencies graph in `ARCHITECTURE.md`

**Key Files (by frequency of change):**
1. `src/tools/` - Adding new tools (edit here first)
2. `src/adapters/` - Wrapping new CLI commands
3. `src/server.ts` - MCP protocol handling (rarely changes)
4. `package.json` - Dependencies

### 📋 Document Structure for Agents

| Document | File | Use When | Agent Context |
|----------|------|----------|---------------|
| **This guide** | AGENTIC_GUIDE.md | Bootstrapping understanding | Entry point for new agents |
| **Scope** | EXPERIMENT_SCOPE.md | Defining boundaries | What's in/out of scope |
| **Architecture** | ARCHITECTURE.md | Understanding structure | Module relationships |
| **API Reference** | API_REFERENCE.md | Implementing tools | Tool schemas & examples |
| **Development Tasks** | DEVELOPMENT_TASKS.md | Planning work | Structured task breakdown |
| **Testing Guide** | TESTING_GUIDE.md | Validating changes | Test patterns & coverage |

---

## Agentic Workflow Patterns

### Pattern 1: Adding a New Tool

**Goal:** Expose a new Proton CLI command as an MCP tool

**Steps (in order):**
1. Create adapter: `src/adapters/new-adapter.ts`
   - Copy structure from `account-adapter.ts`
   - Wrap the CLI command
   - Return JSON
2. Create tool definition: Add to `src/tools/new-tools.ts`
   - Define JSON schema for inputs
   - Link to adapter function
3. Register tool: Update `src/tools/index.ts`
   - Add to `allTools` array
4. Test: Write test in `tests/new-tools.test.ts`
5. Update docs: Add to `API_REFERENCE.md`

**Example:**
```typescript
// Step 1: Adapter (50 lines max)
export async function getBalance(accountName: string) {
  const result = await execAsync(`proton account:balance ${accountName} -r`);
  return JSON.parse(result);
}

// Step 2: Tool (30 lines max)
export const getBalanceTool = {
  name: "get_balance",
  description: "Get account token balances",
  inputSchema: {
    type: "object",
    properties: {
      account_name: { type: "string" }
    }
  },
  handler: (params) => getBalance(params.account_name)
};

// Step 3: Register
allTools.push(getBalanceTool);
```

### Pattern 2: Fixing a Bug

**Goal:** Locate, fix, and test a bug efficiently

**Search Strategy:**
1. Error appears in tool X → check `src/tools/X.ts`
2. Tool calls adapter Y → check `src/adapters/Y.ts`
3. Adapter uses CLI → check CLI output format in tests
4. Fix → update both adapter AND tool if needed
5. Test → run specific test: `npm test -- account-tools`

### Pattern 3: Performance Optimization

**Goal:** Speed up slow tool calls

**Analysis Points:**
1. Profile: `curl -w "\nTime: %{time_total}s\n"` to measure
2. Bottleneck is usually:
   - CLI startup time (200-300ms) → cached results
   - JSON parsing (rare) → stream parsing
   - Network RPC (common) → add timeout limits
3. Solution: See `OPTIMIZATION_OPPORTUNITIES.md`

---

## Code Navigation Tips for Agents

### Finding Where Something Is Handled

**Question: "How does get_account work?"**
```
1. MCP request → src/server.ts handleToolCall()
2. handleToolCall() → tools/index.ts callTool()
3. callTool() → tools/account-tools.ts getAccountTool.handler
4. handler → adapters/account-adapter.ts getAccount()
5. getAccount() → execAsync("proton account...") → JSON parse
```

**Command to verify:**
```bash
grep -r "get_account" src/ --include="*.ts" | head -20
```

### Finding All Tools

```bash
grep -r "name: \"" src/tools/ | grep -v "//"
# Returns: all 5 tool definitions
```

### Finding All Adapters

```bash
ls -la src/adapters/*.ts
# Returns: all adapter files
```

---

## Common Agent Tasks

### Task: Add support for new blockchain query

**File to edit:** `src/adapters/chain-adapter.ts`

**Pattern:**
```typescript
export async function newQuery(params: any) {
  const cmd = `proton chain:... ${params.xyz} -r`;
  const result = await execAsync(cmd);
  return JSON.parse(extractJson(result));
}
```

**Then:** Update `src/tools/chain-tools.ts` with tool definition

### Task: Fix timeout issue

**Files to check:**
1. `src/adapters/*.ts` - Add timeout: `execAsync(..., { timeout: 15000 })`
2. `src/server.ts` - Add middleware for request timeout handling
3. Document: Update `TESTING_GUIDE.md` with timeout scenarios

### Task: Improve error handling

**Pattern in all adapters:**
```typescript
try {
  const result = await execAsync(cmd);
  return JSON.parse(extractJson(result));
} catch (error) {
  if (error.code === 'ENOENT') return { error: 'Account not found' };
  if (error.code === 'TIMEOUT') return { error: 'Request timeout' };
  throw error;
}
```

---

## Agent Context Preservation Across Iterations

### Files That Should Be Carried Forward
- ✅ `src/` - Core implementation (minimal changes expected)
- ✅ `package.json` - Dependencies (mostly stable)
- ✅ `tsconfig.json` - Build config (rarely changes)
- ✅ All `.md` docs - Cumulative knowledge base

### Files That Change Per Iteration
- 📝 `DEVELOPMENT_TASKS.md` - Plan for THIS iteration
- 📝 `tests/` - Add tests for new features
- 📝 Specific adapters/tools being modified

### Knowledge Transfer Strategy
1. Keep this guide updated with NEW patterns discovered
2. Update `ARCHITECTURE.md` if structure changes
3. Add examples to `API_REFERENCE.md` for new tools
4. Document decisions in `TECHNICAL_DECISIONS.md`

---

## Efficiency Metrics for Agents

**Goal: Measure agent productivity**

| Metric | Target | How to Measure |
|--------|--------|-----------------|
| Time to add tool | < 5 min | Time from task start to passing test |
| Context window usage | < 30% | Tokens used / total available |
| Codebase comprehension | 100% | All files navigable in < 2min |
| Test coverage | > 90% | `npm test -- --coverage` |

---

## Quick Checklist for Agent Tasks

When implementing a feature:
- [ ] Updated relevant adapter(s)
- [ ] Added/updated tool definition
- [ ] Registered tool in index
- [ ] Wrote test case
- [ ] Updated API_REFERENCE.md
- [ ] Verified with curl test
- [ ] All tests pass: `npm test`
- [ ] Updated DEVELOPMENT_TASKS.md with completion

---

## Links to Other Key Documents

- **For understanding:** [ARCHITECTURE.md](./ARCHITECTURE.md)
- **For API details:** [API_REFERENCE.md](./API_REFERENCE.md)
- **For scope:** [EXPERIMENT_SCOPE.md](./EXPERIMENT_SCOPE.md)
- **For tasks:** [DEVELOPMENT_TASKS.md](./DEVELOPMENT_TASKS.md)
- **For testing:** [TESTING_GUIDE.md](./TESTING_GUIDE.md)

---

## Next Iteration Handoff

When starting Experiment 02:
1. Copy this entire folder to `../experiment_02`
2. Update `DEVELOPMENT_TASKS.md` for new goals
3. Reference `AGENTIC_GUIDE.md` section "Common Agent Tasks"
4. Keep all `.md` files - they're your knowledge base
5. Update version in `package.json`

**Key:** Treat documentation as code. It compounds value across iterations.
