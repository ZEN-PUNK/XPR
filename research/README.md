# Research Artifacts (Agent-Generated)

This directory contains additive research artifacts generated
by an autonomous Copilot research agent.

## Principles
- No existing manuscript files are modified
- All content is incremental and merge-safe
- Each subfolder corresponds to a research dimension
- Artifacts are intended to strengthen rigor, novelty,
  and generality of the core paper

## How to Use
- Review artifacts independently
- Selectively integrate into the main manuscript
- Treat as a research acceleration layer, not a replacement

## Directory Structure

```
/research
├── 00_context/          # Problem statement, assumptions, scope
├── 01_literature/       # Related work, gaps analysis, novelty
├── 02_theory/           # Queueing models, formal hypotheses
├── 03_architecture/     # Agentic pipeline ontology, control loops
├── 04_experiments/      # Experiment design, metrics, statistical tests
├── 05_results/          # Result interpretation, tail latency analysis
├── 06_extensions/       # Future work: multi-chain, autoscaling, ML
└── README.md           # This file
```

## Agentic Research Philosophy

This research infrastructure treats the pipeline as an **agentic system**:

### Core Agents

| Agent            | Role                                  |
| ---------------- | ------------------------------------- |
| Ingestion Agent  | Observes blockchain, emits events     |
| Buffering Agent  | Absorbs bursts, enforces flow control |
| Analytics Agent  | Performs ingestion & querying         |
| Control Agent    | Observes lag, queue depth, CPU        |
| Scaling Agent    | Adjusts ADX / Event Hub capacity      |
| Validation Agent | Detects data loss, duplication        |

This framing enables:
- Deeper theoretical modeling
- Control-theoretic analysis
- Autonomous scaling mechanisms
- Multi-agent coordination patterns

## Usage with Copilot Tasks

To invoke the research deepening agent:

```bash
# Use the Copilot task to analyze and extend research
copilot task run research-agent --input research_source=<path-to-manuscript>
```

The agent will generate new artifacts in each subdirectory without modifying
existing files.

## Recursive Research Loops

For deeper analysis, re-run the task using generated artifacts as input:

```bash
# Second pass using gaps analysis as input
copilot task run research-agent --input research_source=research/01_literature/gaps_analysis.md

# Third pass using theoretical model
copilot task run research-agent --input research_source=research/02_theory/formal_hypotheses.md
```

This creates **agentic research loops** for progressive refinement.

## Contributing

When adding new research artifacts:
1. Follow the academic, systems-research tone
2. Include formal models and citations where applicable
3. State assumptions and limitations explicitly
4. Ensure all outputs are additive (never destructive)
5. Use markdown format for consistency

## License

Research artifacts inherit the license of the parent project (ISC).
