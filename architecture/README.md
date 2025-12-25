# Architecture Documentation

This folder tracks architecture decisions, improvements, and technical debt for the XPR MCP Server project.

## Contents

- [Current Architecture](./CURRENT_ARCHITECTURE.md) - Overview of the current system design
- [Improvements](./IMPROVEMENTS.md) - Identified architecture improvements and recommendations
- [Decision Records](./decisions/) - Architecture Decision Records (ADRs)
- [Migration Guides](./migrations/) - Guides for implementing architectural changes

## Purpose

The architecture folder serves as a central location for:

1. **Tracking Architecture Decisions**: Document why certain design choices were made
2. **Identifying Improvements**: Maintain a prioritized list of architecture enhancements
3. **Planning Migrations**: Track progress on architectural changes
4. **Knowledge Sharing**: Help new contributors understand the system design

## How to Use

### Adding a New Architecture Decision

1. Create a new ADR in `decisions/` using the template
2. Number it sequentially (e.g., `001-use-azure-functions.md`)
3. Document the context, decision, and consequences

### Proposing an Improvement

1. Add it to `IMPROVEMENTS.md` with:
   - Description of the improvement
   - Priority (High/Medium/Low)
   - Effort estimate
   - Expected impact

### Implementing Changes

1. Reference the improvement or ADR in your PR
2. Update the status in tracking documents
3. Create migration guides if needed

## Related Documentation

- `/research` - Research documentation for blockchain analytics pipeline
- `README.md` - Main project documentation
- `AZURE_DEPLOYMENT.md` - Azure deployment guide
