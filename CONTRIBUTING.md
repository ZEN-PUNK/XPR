# Contributing to XPR MCP Server

Thank you for your interest in contributing to the XPR MCP Server! This guide will help both human developers and AI agents contribute effectively.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Adding New Features](#adding-new-features)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [For AI Agents](#for-ai-agents)

---

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn
- Git
- (Optional) Azure Functions Core Tools for Azure Functions development

### Setup

1. **Clone the repository:**
```bash
git clone https://github.com/ZEN-PUNK/XPR.git
cd XPR
```

2. **Install dependencies:**
```bash
npm install
```

3. **Run tests:**
```bash
npm test
```

4. **Start the MCP server:**
```bash
npm start
```

5. **Start Azure Functions (optional):**
```bash
func start
```

---

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

**Branch naming conventions:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or improvements

### 2. Make Changes

Follow the patterns and principles outlined in [AGENT_PATTERNS.md](./AGENT_PATTERNS.md).

### 3. Test Your Changes

```bash
# Run structure tests
npm test

# Manual testing for MCP server
npm start

# Manual testing for Azure Functions
func start
```

### 4. Update Documentation

When making changes, update:
- Code comments (JSDoc)
- [API_REFERENCE.md](./API_REFERENCE.md) - For new tools/endpoints
- [README.md](./README.md) - For user-facing changes
- [AGENTIC_GUIDE.md](./AGENTIC_GUIDE.md) - For workflow changes
- [ARCHITECTURE.md](./ARCHITECTURE.md) - For architectural changes

### 5. Commit Your Changes

```bash
git add .
git commit -m "Brief description of changes"
```

**Commit message format:**
```
<type>: <description>

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, no code change)
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Maintenance tasks

**Examples:**
```
feat: Add get_producer_schedule MCP tool

Adds support for querying the current block producer schedule
via both MCP and Azure Functions interfaces.

Closes #123
```

### 6. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub.

---

## Adding New Features

### Adding a New MCP Tool

**Step-by-step process:**

1. **Add RPC method to XPRClient** (`src/xpr-client.js`):

```javascript
/**
 * Get producer schedule
 * @returns {Promise<Object>} Producer schedule data
 */
async getProducerSchedule() {
  return await this.post('/v1/chain/get_producer_schedule', {});
}
```

2. **Add tool definition** to `src/index.js` tools array:

```javascript
{
  name: 'get_producer_schedule',
  description: 'Get the current block producer schedule',
  inputSchema: {
    type: 'object',
    properties: {},
  },
}
```

3. **Add tool handler** to `src/index.js` switch statement:

```javascript
case 'get_producer_schedule': {
  const schedule = await this.xprClient.getProducerSchedule();
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(schedule, null, 2)
    }]
  };
}
```

4. **(Optional) Add Azure Function** in `functions/index.js`:

```javascript
app.http('getProducerSchedule', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const schedule = await xprClient.getProducerSchedule();
      return {
        status: 200,
        jsonBody: schedule
      };
    } catch (error) {
      context.error('Error getting producer schedule:', error);
      return {
        status: 500,
        jsonBody: { error: error.message }
      };
    }
  }
});
```

5. **Update documentation:**
   - Add to [API_REFERENCE.md](./API_REFERENCE.md)
   - Update README.md available tools list
   - Add example to [examples/README.md](./examples/README.md)

6. **Test:**
   - Run `npm test`
   - Test MCP tool manually
   - Test Azure Function endpoint (if added)

### Adding a New Example

1. Create file in `examples/` directory
2. Follow the template in [examples/README.md](./examples/README.md)
3. Add error handling
4. Test the example
5. Document it in examples/README.md

---

## Code Standards

### JavaScript Style

**Use ES modules:**
```javascript
import { XPRClient } from './xpr-client.js';
export class MyClass { }
```

**Use async/await (not callbacks or .then()):**
```javascript
// Good
async function getData() {
  const result = await client.getInfo();
  return result;
}

// Avoid
function getData() {
  return client.getInfo().then(result => result);
}
```

**Use descriptive variable names:**
```javascript
// Good
const accountName = 'proton';
const chainInfo = await client.getInfo();

// Avoid
const a = 'proton';
const d = await client.getInfo();
```

### Error Handling

**Always use try/catch for async operations:**
```javascript
try {
  const result = await client.method(params);
  return result;
} catch (error) {
  console.error('Error:', error.message);
  throw error; // Or handle appropriately
}
```

**Provide specific error messages:**
```javascript
if (!accountName) {
  throw new Error('Account name is required');
}
if (accountName.length > 12) {
  throw new Error('Account name must be 12 characters or less');
}
```

### Documentation

**Use JSDoc for all public methods:**
```javascript
/**
 * Get account information
 * @param {string} accountName - XPR account name (max 12 characters)
 * @returns {Promise<Object>} Account data including resources and permissions
 * @throws {Error} If account not found or RPC error
 */
async getAccount(accountName) {
  return await this.post('/v1/chain/get_account', {
    account_name: accountName
  });
}
```

**Add comments for complex logic:**
```javascript
// Calculate available RAM (quota minus usage)
const availableRAM = account.ram_quota - account.ram_usage;
```

### File Organization

**Keep modules focused:**
- `src/xpr-client.js` - Only RPC communication
- `src/index.js` - Only MCP protocol handling
- `functions/index.js` - Only Azure Functions HTTP handling

**Don't mix concerns:**
```javascript
// Good: Separate files
// xpr-client.js - RPC only
// index.js - MCP only

// Bad: Everything in one file
// server.js - RPC + MCP + HTTP
```

---

## Testing

### Structure Tests

Required tests in `test-structure.js`:
- Module imports successfully
- Classes instantiate
- All expected methods exist

**Run:**
```bash
npm test
```

### Manual Testing

**MCP Server:**
```bash
# Start server
npm start

# Test with MCP client or manual JSON-RPC
```

**Azure Functions:**
```bash
# Start functions
func start

# Test with curl
curl http://localhost:7071/api/getChainInfo
curl "http://localhost:7071/api/getAccount?account_name=proton"
```

### Testing Checklist

Before submitting a PR:
- [ ] `npm test` passes
- [ ] New features tested manually
- [ ] Error cases tested
- [ ] No breaking changes to existing tools
- [ ] Documentation updated

---

## Documentation

### What to Document

**Code:**
- All public methods (JSDoc)
- Complex algorithms
- Non-obvious decisions

**Files:**
- Update API_REFERENCE.md for new tools
- Update README.md for user-facing changes
- Update AGENTIC_GUIDE.md for workflow changes
- Add examples to examples/README.md

### Documentation Style

**Be clear and concise:**
```javascript
// Good
/**
 * Get token balance for an account
 * @param {string} account - Account name
 * @param {string} code - Token contract (default: eosio.token)
 * @param {string} symbol - Token symbol (default: XPR)
 * @returns {Promise<string[]>} Array of balance strings
 */

// Avoid
/**
 * Gets stuff
 */
```

**Use examples:**
```markdown
**Example:**
\`\`\`javascript
const balance = await client.getCurrencyBalance('proton');
console.log(balance); // ["1000.0000 XPR"]
\`\`\`
```

---

## For AI Agents

### Agent-Specific Guidelines

**Before starting work:**
1. Read [AGENTIC_GUIDE.md](./AGENTIC_GUIDE.md)
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md)
3. Check [AGENT_PATTERNS.md](./AGENT_PATTERNS.md)

**When making changes:**
1. Follow established patterns (see AGENT_PATTERNS.md)
2. Make minimal, focused changes
3. Update all related documentation
4. Test thoroughly
5. Commit with clear messages

**Useful context documents:**
- AGENTIC_GUIDE.md - Navigation and workflows
- ARCHITECTURE.md - System design
- API_REFERENCE.md - Tool specifications
- AGENT_PATTERNS.md - Code patterns
- examples/README.md - Usage examples

### Agent Workflow

**1. Understand the task:**
- What is being asked?
- What files need to change?
- What documentation needs updating?

**2. Make changes:**
- Follow patterns from existing code
- Keep changes minimal and focused
- Add appropriate error handling

**3. Test:**
```bash
npm test
npm start  # Manual testing
```

**4. Document:**
- Update inline comments
- Update API_REFERENCE.md
- Update relevant guides
- Add examples if appropriate

**5. Commit:**
```bash
git add .
git commit -m "type: description"
```

### Agent Best Practices

**DO:**
- ✅ Follow existing code patterns
- ✅ Add JSDoc to new methods
- ✅ Update all related documentation
- ✅ Test changes manually
- ✅ Make focused, minimal changes
- ✅ Handle errors appropriately

**DON'T:**
- ❌ Mix multiple concerns in one file
- ❌ Skip error handling
- ❌ Forget to update documentation
- ❌ Make breaking changes without discussion
- ❌ Add unnecessary dependencies
- ❌ Change unrelated code

---

## Code Review Process

### For Contributors

**What reviewers look for:**
1. Code follows style guidelines
2. Changes are well-tested
3. Documentation is updated
4. No breaking changes (or justified)
5. Minimal, focused scope
6. Appropriate error handling

### For Reviewers

**Review checklist:**
- [ ] Code is clear and maintainable
- [ ] Follows existing patterns
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No security issues
- [ ] Error handling present
- [ ] Breaking changes documented

---

## Getting Help

### Resources

- [AGENTIC_GUIDE.md](./AGENTIC_GUIDE.md) - Development workflows
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [API_REFERENCE.md](./API_REFERENCE.md) - API documentation
- [AGENT_PATTERNS.md](./AGENT_PATTERNS.md) - Code patterns
- [examples/README.md](./examples/README.md) - Usage examples

### Questions?

- Open an issue on GitHub
- Check existing documentation
- Review examples in `examples/` directory

---

## License

By contributing, you agree that your contributions will be licensed under the same ISC License that covers this project.

---

## Thank You!

Thank you for contributing to XPR MCP Server! Your contributions help make blockchain data more accessible to AI agents and developers.

**Key Principles:**
1. Keep changes minimal and focused
2. Follow established patterns
3. Document everything
4. Test thoroughly
5. Be respectful and helpful
