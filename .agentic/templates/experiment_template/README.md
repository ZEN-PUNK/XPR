# Experiment XX: [Experiment Name]

**Brief description of what this experiment does.**

## Quick Start

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- [List any other required tools, e.g., Proton CLI]

### Installation

```bash
# Navigate to this experiment
cd agentic_dev/experiment_XX

# Install dependencies
npm install

# Build the project
npm run build

# Start the server/tool
npm start
```

## What This Experiment Does

[Detailed description of the experiment's purpose and goals]

### Key Features

- **Feature 1**: Description
- **Feature 2**: Description
- **Feature 3**: Description

### What's In Scope

✅ Feature A
✅ Feature B
✅ Feature C

### What's Out of Scope

❌ Feature X (reason why)
❌ Feature Y (reason why)

## Usage

### Basic Example

```bash
# Example command
curl http://localhost:3001/api/endpoint

# Expected output:
{
  "result": "success",
  "data": {...}
}
```

### Available Tools/Endpoints

#### Tool 1: `tool_name`

**Description**: What this tool does

**Input**:
```json
{
  "param1": "value1",
  "param2": "value2"
}
```

**Output**:
```json
{
  "result": {...}
}
```

**Example**:
```bash
# cURL example
curl -X POST http://localhost:3001/api/tool_name \
  -H "Content-Type: application/json" \
  -d '{"param1":"value1"}'
```

## Architecture

For detailed architecture documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md).

### High-Level Overview

```
[Diagram or description of architecture]

Input → [Component A] → [Component B] → Output
```

### Technology Stack

- **Language**: TypeScript/JavaScript
- **Framework**: Express.js / MCP SDK / etc.
- **Key Dependencies**: List major dependencies

## Testing

### Run Tests

```bash
npm test
```

### Manual Testing

```bash
# Start the server
npm start

# In another terminal, run test commands
curl http://localhost:3001/health
```

### Expected Test Results

- Test 1: ✅ Should return X
- Test 2: ✅ Should handle Y
- Test 3: ✅ Should error on Z

## Project Structure

```
experiment_XX/
├── README.md                  # This file
├── INDEX.md                   # Navigation guide
├── ARCHITECTURE.md            # Design decisions
├── EXPERIMENT_SCOPE.md       # Scope boundaries
├── task.md                   # Work log
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── .gitignore                # Git ignore rules
│
├── src/                      # Source code
│   ├── index.ts              # Entry point
│   ├── server.ts             # Main logic
│   ├── tools/                # MCP tools (if applicable)
│   └── adapters/             # External integrations
│
└── dist/                     # Compiled output (git-ignored)
```

## Configuration

### Environment Variables

Create a `.env` file (not committed to git):

```bash
# .env
PORT=3001
LOG_LEVEL=debug
# Add other configuration as needed
```

### Custom Configuration

[Describe any configuration files or options]

## Development

### Development Mode

Run with auto-reload:

```bash
npm run dev
```

### Building

```bash
npm run build
```

### Debugging

[Add debugging instructions, e.g., using VS Code debugger]

## Troubleshooting

### Issue: Server Won't Start

**Symptoms**: Error when running `npm start`

**Solutions**:
1. Check port is not in use: `lsof -i :3001`
2. Verify dependencies: `npm install`
3. Rebuild: `npm run build`

### Issue: Build Errors

**Symptoms**: TypeScript compilation fails

**Solutions**:
1. Check TypeScript version: `npx tsc --version`
2. Clean build: `rm -rf dist/ && npm run build`
3. Verify tsconfig.json is correct

## Documentation

- [README.md](./README.md) - This file (Quick start and usage)
- [INDEX.md](./INDEX.md) - Navigation and structure
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Design and architecture
- [EXPERIMENT_SCOPE.md](./EXPERIMENT_SCOPE.md) - Scope definition
- [task.md](./task.md) - Detailed work log

## Related Resources

- [Main Repository README](../../README.md)
- [Agentic Development Guide](../../AGENTIC_DEVELOPMENT.md)
- [Experiments Catalog](../../EXPERIMENTS.md)
- [Setup Guide](../../SETUP.md)

## Next Steps

1. Complete implementation of core features
2. Add comprehensive tests
3. Document all edge cases
4. Prepare for next iteration

## License

ISC

## Version History

- **v1.0.0** (YYYY-MM-DD) - Initial implementation
