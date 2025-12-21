# Experiment Design: Benchmarking Methodology

## Overview

This document defines the comprehensive experimental protocol for evaluating blockchain analytics pipeline architectures.

---

## 1. Experimental Factors

### Independent Variables

**Primary Factor: Pipeline Architecture**
- **Level 1**: Direct ingestion (Listener → ADX)
- **Level 2**: Buffered ingestion (Listener → Event Hub → ADX)
- **Level 3**: Kafka variant (Listener → Kafka → ADX) [optional]

**Secondary Factor: Load Level**
- 100 events/sec (low load, baseline)
- 200 eps (moderate)
- 400 eps (medium)
- 600 eps (approaching capacity)
- 800 eps (near direct limit)
- 1000 eps (above direct limit)
- 1200 eps (stress test)
- 1500 eps (maximum test)

**Tertiary Factors** (controlled):
- Batch size: 100 events (constant across tests)
- ADX cluster size: 2 nodes, 8 cores each (16 total)
- Event Hub: Standard tier, 2-4 TUs (auto-inflate enabled)
- Network: Same Azure region, private endpoints

### Dependent Variables (Metrics)

**Primary Metrics**:
1. **Throughput**: Events successfully ingested per second
2. **End-to-end latency**: Time from event generation to ADX query-able
3. **Data loss rate**: Percentage of events not ingested

**Secondary Metrics**:
4. **Tail latency**: 95th and 99th percentile latency
5. **Queue depth**: Number of events buffered (Event Hub or internal)
6. **Resource utilization**: ADX CPU, memory; Event Hub TUs
7. **Recovery time**: Time to clear backlog after load spike

---

## 2. Workload Patterns

### W1: Steady Load
**Purpose**: Baseline performance characterization

**Pattern**: Constant rate for 5 minutes
- Rates: 100, 200, 400, 600, 800, 1000, 1200, 1500 eps
- Run for each pipeline architecture
- Repeat 5 times for statistical confidence

**Metrics collected**: All primary + secondary metrics

---

### W2: Ramp-Up
**Purpose**: Identify capacity limits and degradation points

**Pattern**:
```
Time (min)  | 0-2 | 2-4 | 4-6 | 6-8 | 8-10| 10-12| 12-14|
Rate (eps)  | 100 | 200 | 400 | 600 | 800 | 1000 | 1200 |
```

**Metrics focus**: Latency degradation, throughput saturation point

**Expected observation**: Direct pipeline degrades earlier than buffered

---

### W3: Bursty Load
**Purpose**: Test handling of realistic blockchain traffic patterns

**Pattern**: Alternating bursts and lulls
```
Phase A (30s): 50 eps baseline
Phase B (10s): 1500 eps burst
Repeat 10 times (total 6 minutes)
```

**Metrics focus**: 
- Peak latency during burst
- Recovery time after burst
- Queue depth fluctuations

**Expected**: Buffered pipeline smooths bursts better

---

### W4: Sustained High Load
**Purpose**: Stress test and stability evaluation

**Pattern**: 1000 eps for 30 minutes
- Long enough to detect memory leaks, gradual degradation
- Monitor resource trends over time

**Metrics**:
- Latency drift (does p50/p95 increase over time?)
- Memory usage growth
- Error rates

---

### W5: Consumer Outage
**Purpose**: Fault tolerance validation

**Pattern**:
1. Start at 500 eps steady load
2. At t=1 min: Pause ADX ingestion for 30 seconds
3. Resume and observe recovery
4. Run for total 5 minutes

**Metrics**:
- Data loss during outage
- Queue depth growth
- Recovery time to steady state
- Maximum latency

**Expected**: Buffered = 0% loss, Direct = ~5% loss

---

### W6: Variable Payload Sizes
**Purpose**: Assess impact of event size on throughput

**Pattern**: 500 eps with varying event payloads
- Small (1 KB): Minimal action data
- Medium (10 KB): Typical transaction with metadata
- Large (100 KB): Contract deploy or large memo

**Metrics**: Throughput limits, latency sensitivity to size

---

## 3. Experimental Setup

### Infrastructure Configuration

#### Blockchain Event Simulator
```python
class BlockchainEventGenerator:
    def __init__(self, pattern: WorkloadPattern):
        self.pattern = pattern
        self.event_counter = 0
        
    def generate_event(self) -> dict:
        return {
            "event_id": f"{time.time()}_{self.event_counter}",
            "block_num": random.randint(1000000, 2000000),
            "timestamp": datetime.utcnow().isoformat(),
            "action": random.choice(["transfer", "stake", "vote"]),
            "actor": generate_random_account(),
            "data": generate_payload(self.pattern.payload_size),
            "generation_time": time.time()  # For latency measurement
        }
```

#### Pipeline Deployments

**Direct Pipeline**:
```
[Simulator] → [Listener VM (D4s_v3)] → [ADX (2 nodes, D16s_v3)]
              ↓ (ingestion SDK)
              Logs: Timestamps, batch IDs
```

**Buffered Pipeline**:
```
[Simulator] → [Listener VM] → [Event Hub (Standard, 2-4 TUs)]
                              ↓ (data connection)
                              [ADX (2 nodes, D16s_v3)]
              ↓ Logs            ↓ Logs
              Timestamps        Ingestion times
```

#### Metrics Collection Points

1. **Source (Simulator)**: Event generation timestamp
2. **Listener**: Batch send start/complete timestamps
3. **Event Hub** (buffered only): Enqueue timestamp, queue depth
4. **ADX**: Ingestion timestamp, query-able timestamp
5. **Monitors**: Azure Monitor metrics (CPU, memory, ingestion queue)

**Instrumentation**:
- Each event tagged with UUID and generation timestamp
- Listener logs: [event_id, send_start, send_complete]
- ADX logs: [event_id, ingest_start, ingest_complete]
- Join logs post-hoc to compute end-to-end latency

---

### Deployment Automation

**Terraform Script**:
```hcl
resource "azurerm_resource_group" "pipeline" {
  name     = "rg-blockchain-pipeline-benchmark"
  location = "East US"
}

resource "azurerm_kusto_cluster" "adx" {
  name                = "adx-benchmark"
  location            = azurerm_resource_group.pipeline.location
  resource_group_name = azurerm_resource_group.pipeline.name
  sku {
    name     = "Standard_D16s_v3"
    capacity = 2
  }
  identity {
    type = "SystemAssigned"
  }
}

resource "azurerm_eventhub_namespace" "events" {
  name                = "eh-blockchain-events"
  location            = azurerm_resource_group.pipeline.location
  resource_group_name = azurerm_resource_group.pipeline.name
  sku                 = "Standard"
  capacity            = 2
  auto_inflate_enabled = true
  maximum_throughput_units = 4
}

# ... additional resources ...
```

**Deployment Steps**:
1. `terraform init && terraform apply`
2. Deploy listener code to VM
3. Configure ADX data connection
4. Verify connectivity with small test load

---

## 4. Data Collection Protocol

### Pre-Test Checklist
- [ ] Warm up pipeline: Run 100 eps for 2 minutes, discard data
- [ ] Clear ADX table or use new table for each test
- [ ] Reset Event Hub (ensure queue empty)
- [ ] Verify NTP sync across all VMs
- [ ] Disable auto-scaling during controlled tests (re-enable for specific tests)
- [ ] Check network latency baseline (<1ms within region)

### During Test
- [ ] Monitor real-time dashboards (Azure Monitor)
- [ ] Log any anomalies (connection drops, etc.)
- [ ] Ensure no other workloads running on cluster
- [ ] Record start/end timestamps

### Post-Test
- [ ] Export logs from all components
- [ ] Export Azure Monitor metrics
- [ ] Verify event count (generated = ingested + lost)
- [ ] Backup raw data before analysis

---

## 5. Statistical Analysis Plan

### Descriptive Statistics

For each (Pipeline, Load) combination:
- **Throughput**: Mean, std dev, min, max
- **Latency**: Mean, median, p50, p90, p95, p99, max
- **Loss rate**: Count, percentage

**Visualization**: Box plots, CDFs, scatter plots

---

### Inferential Tests

#### Test 1: Throughput Comparison (H1)
**Test**: Two-sample t-test (or Wilcoxon if non-normal)
- Null: μ_EH = μ_Direct
- Alternative: μ_EH > μ_Direct
- α = 0.01

**Effect size**: Cohen's d

**Sample**: Mean throughput from 5 runs per configuration

---

#### Test 2: Latency Distribution (H2)
**Test**: Kolmogorov-Smirnov test
- Null: F_EH(t) = F_Direct(t)
- Alternative: F_EH(t) ≠ F_Direct(t)
- α = 0.001

**Test at each load level** (100, 600, 1000 eps)

**Visualization**: CDF overlays, Q-Q plots

---

#### Test 3: Fault Tolerance (H3)
**Test**: Exact binomial test on lost event counts
- Null: p_loss_EH = p_loss_Direct
- Alternative: p_loss_EH < p_loss_Direct
- α = 0.01

**Sample**: Events lost during W5 (outage scenario)

---

#### Test 4: Two-Way ANOVA (H4)
**Factors**: Pipeline type × Load level
**Response**: Latency (median and p95 analyzed separately)

**Hypotheses**:
- Main effect Pipeline: p < 0.001 (expected)
- Main effect Load: p < 0.001 (expected)
- Interaction Pipeline×Load: p < 0.01 (expected — difference grows with load)

**Post-hoc**: Tukey HSD for pairwise comparisons

**Assumptions check**: Normality (Shapiro-Wilk), homogeneity of variance (Levene's)

---

### Confidence Intervals

**Bootstrap method** (10,000 resamples):
- Difference in median latency: EH vs Direct at 1000 eps
- Difference in p95 latency: EH vs Direct at 1000 eps

**Report**: 95% CI; if CI excludes 0 → significant

---

### Multiple Comparison Correction

Given multiple tests, apply Bonferroni correction:
- Number of comparisons: ~8 load levels × 2 metrics = 16
- Adjusted α = 0.01 / 16 ≈ 0.0006

**Conservative approach**: Ensures family-wise error rate ≤ 0.01

---

## 6. Quality Controls

### Repeatability
**Metric**: Coefficient of variation (CV) across 5 runs
- **Target**: CV < 5% for median latency
- **Action if exceeded**: Investigate environmental factors, increase runs to 10

### Outlier Detection
**Method**: Grubbs' test for outlier runs
- **Action**: If detected, investigate cause, exclude if justified (e.g., network outage)

### Instrumentation Overhead
**Test**: Run with logging ON vs OFF
- **Measure**: Latency difference
- **Acceptable**: <1% overhead
- **Mitigation**: Use async logging, batch log writes

---

## 7. Pilot Study

**Purpose**: Validate experiment design before full battery

**Plan**:
1. Run W1 (steady load) at 100, 500, 1000 eps
2. Check data collection pipeline (logs complete?)
3. Preliminary analysis to estimate variance
4. Refine parameters (batch size, sample duration)

**Decision points**:
- If variance high (CV > 10%), increase run duration or repetitions
- If instrumentation overhead >1%, optimize logging
- If capacity lower than expected, adjust load levels

---

## 8. Experiment Timeline

| Week | Activities |
|------|-----------|
| 1 | Infrastructure setup (Terraform), pilot study |
| 2 | W1 (steady load) full battery, preliminary analysis |
| 3 | W2 (ramp-up), W3 (bursty), W4 (sustained) |
| 4 | W5 (outage), W6 (variable payloads) |
| 5 | Data analysis, statistical tests, visualization |
| 6 | Kafka variant testing (optional), sensitivity analysis |
| 7 | Result interpretation, manuscript writing |

**Total**: ~7 weeks for comprehensive evaluation

---

## 9. Data Management

### Raw Data
- **Storage**: Azure Blob Storage (archive tier after analysis)
- **Format**: Parquet files (efficient for large time-series)
- **Retention**: 1 year minimum

### Processed Data
- **Aggregates**: CSV files with summary stats
- **Visualizations**: PNG/SVG for publication

### Code
- **Analysis scripts**: Python (pandas, scipy, matplotlib)
- **Versioning**: Git repository with tagged releases

### Reproducibility
- **Artifact**: Docker container with analysis environment
- **Documentation**: README with step-by-step instructions
- **Validation**: Independent researcher should replicate within 10% error

---

## 10. Ethical Considerations

- **No real user data**: All events synthetically generated
- **Cloud costs**: Estimated $500-1000 for full battery; budget approved
- **Environmental impact**: Use least-needed resources; shut down after tests
- **Data sharing**: Anonymized aggregates shared publicly; raw logs contain no PII

---

## 11. Success Criteria

**Minimum for publication**:
- [ ] All workloads (W1-W5) completed for 2 architectures
- [ ] Statistical significance achieved for H1, H2 (p < 0.01)
- [ ] Visualizations clear and publication-ready
- [ ] Reproducibility package prepared

**Ideal**:
- [ ] Additional Kafka variant comparison
- [ ] Simulation validation of queueing models
- [ ] Cost-performance trade-off analysis
- [ ] Sensitivity analysis on batch size, cluster size

---

## Next Steps

- [ ] Finalize Terraform scripts
- [ ] Implement blockchain event simulator
- [ ] Write metrics collection harness
- [ ] Prepare statistical analysis notebooks
- [ ] Create visualization templates
