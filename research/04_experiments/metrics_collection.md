# Metrics Definition and Collection

## Core Metrics

### 1. Throughput (λ)

**Definition**: Number of events successfully ingested per unit time

**Formula**:
$$\text{Throughput} = \frac{\text{Events ingested}}{\text{Time window (seconds)}}$$

**Units**: events/second (eps)

**Collection**:
```sql
-- ADX query to count ingested events per second
Events
| summarize Count=count() by bin(ingestion_time(), 1s)
| summarize AvgThroughput=avg(Count), MaxThroughput=max(Count)
```

**Reporting**:
- Mean throughput over test duration
- Peak 1-second throughput
- Sustained throughput (99th percentile of 1s windows)

---

### 2. End-to-End Latency (W)

**Definition**: Time from event generation to query-able in ADX

**Formula**:
$$\text{Latency}_i = t_{\text{ADX query-able}}^i - t_{\text{generated}}^i$$

**Units**: seconds

**Collection**:
```python
# Join generator logs with ADX ingestion logs
latencies = []
for event in events:
    gen_time = event['generation_timestamp']
    ing_time = adx_logs[event['id']]['ingestion_timestamp']
    latencies.append(ing_time - gen_time)
```

**Distribution Metrics**:
- **Mean**: $\bar{W} = \frac{1}{n} \sum_{i=1}^{n} W_i$
- **Median**: 50th percentile
- **Tail**: 95th, 99th, 99.9th percentiles
- **Maximum**: Worst-case latency

**Visualization**: CDF, histogram, time-series

---

### 3. Data Loss Rate (p_loss)

**Definition**: Percentage of generated events not ingested

**Formula**:
$$p_{\text{loss}} = \frac{\text{Events generated} - \text{Events ingested}}{\text{Events generated}} \times 100\%$$

**Collection**:
```python
generated_ids = set(simulator.get_all_event_ids())
ingested_ids = set(adx.query("Events | distinct event_id"))
lost_ids = generated_ids - ingested_ids
loss_rate = len(lost_ids) / len(generated_ids) * 100
```

**Reporting**:
- Count of lost events
- Percentage loss
- Pattern of loss (uniformly distributed or clustered?)

---

## Secondary Metrics

### 4. Queue Depth (L)

**Definition**: Number of events in intermediate buffer at time t

**Collection Points**:
- **Event Hub**: Azure Monitor metric `CapturedMessages` or `IncomingMessages - OutgoingMessages`
- **ADX internal queue**: Ingestion queue length (diagnostic metrics)

**Formula** (Little's Law validation):
$$L(t) = \lambda(t) \cdot W(t)$$

**Reporting**: Time-series, peak depth, average depth

---

### 5. Resource Utilization

#### ADX CPU (ρ_cpu)
**Source**: Azure Monitor `IngestionUtilization` metric

**Formula**:
$$\rho_{\text{cpu}} = \frac{\text{CPU used}}{\text{CPU capacity}} \times 100\%$$

**Target**: 70-90% (high but not overloaded)

#### Event Hub Throughput Units
**Source**: Azure Monitor `ThroughputUnits` (auto-inflate events)

**Reporting**: Average TUs used, max TUs

#### Memory
**Source**: VM-level metrics (Listener), ADX memory usage

**Red flag**: Memory growth >10% per hour (potential leak)

---

### 6. Recovery Time (T_recover)

**Definition**: Time from load spike end to system returning to steady state

**Measurement**:
1. Identify spike end time (t_spike_end)
2. Monitor queue depth and latency
3. T_recover = time when latency < 2× baseline

**Example**:
```
Spike: 1500 eps from t=60s to t=70s
Baseline latency: 0.5s
At t=80s: latency = 3s (queue draining)
At t=95s: latency = 0.9s → T_recover = 95 - 70 = 25 seconds
```

---

## Derived Metrics

### 7. Tail Latency Ratio

**Definition**: Ratio of 95th percentile to median latency

$$R_{95} = \frac{W_{p95}}{W_{p50}}$$

**Interpretation**:
- R_95 ≈ 1: Consistent latency (good)
- R_95 > 5: High variability, poor tail performance

---

### 8. Throughput Efficiency

**Definition**: Achieved throughput as percentage of input rate

$$\eta = \frac{\text{Ingested rate}}{\text{Generated rate}} \times 100\%$$

**Ideal**: η = 100% (no loss)
**Degraded**: η < 95%

---

### 9. Cost per Event

**Formula**:
$$\text{Cost per event} = \frac{\text{Azure spend (USD/hour)}}{\text{Events ingested per hour}}$$

**Components**:
- ADX cluster: ~$10/hour (2-node D16s_v3)
- Event Hub: ~$0.015/hour (2 TUs)
- Listener VM: ~$0.20/hour (D4s_v3)

**Example**: $10.22/hour ÷ 3.6M events/hour = $0.0000028/event

---

## Instrumentation Details

### Timestamp Precision

**Requirement**: Millisecond precision for latency measurement

**Implementation**:
```python
import time
t = time.time()  # Seconds since epoch, float (μs precision)
ts = datetime.utcnow().isoformat(timespec='milliseconds')
```

**Clock Sync**: NTP on all VMs (ensure <10ms skew)

---

### Event Tagging

**Structure**:
```json
{
  "event_id": "uuid-v4",
  "generation_time": 1699999999.123,  // Unix timestamp
  "batch_id": "batch-42",
  "sequence_num": 1024,
  "payload": {...}
}
```

**Purpose**:
- `event_id`: Join across logs
- `generation_time`: Latency calculation
- `batch_id`: Track batching effects
- `sequence_num`: Detect reordering or loss

---

### Logging Strategy

**Listener Logs** (append to file):
```
[SEND_START] event_id=abc123 batch_id=b1 timestamp=1699999999.100
[SEND_COMPLETE] batch_id=b1 events=100 timestamp=1699999999.250
```

**ADX Ingestion Logs** (table):
```sql
.create table IngestionLogs (
  EventId: string,
  IngestStartTime: datetime,
  IngestCompleteTime: datetime,
  IngestionQueueTime: timespan
)
```

**Join**:
```python
df_listener = pd.read_csv('listener_logs.csv')
df_adx = kusto_client.execute("IngestionLogs").to_dataframe()
df_latency = df_listener.merge(df_adx, on='EventId')
df_latency['end_to_end'] = df_latency['IngestCompleteTime'] - df_latency['generation_time']
```

---

## Data Quality Checks

### Completeness
**Check**: Every generated event appears in exactly one log (listener OR loss log)

```python
assert len(generated_ids) == len(sent_ids | lost_ids)
assert len(sent_ids & lost_ids) == 0  # No overlap
```

### Consistency
**Check**: Ingested count in ADX matches listener send count

```sql
-- ADX query
Events | count  // Should equal sum of listener batches
```

### Temporal Ordering
**Check**: Ingestion time ≥ generation time (no negative latencies)

```python
assert (df_latency['end_to_end'] >= 0).all()
```

---

## Aggregation Levels

### Per-Event (Micro)
- Individual latency values
- Event-level metadata
- **Use**: Distribution analysis, outlier detection

### Per-Second (Meso)
- Throughput per second
- Average latency per second
- **Use**: Time-series plots, variability analysis

### Per-Run (Macro)
- Summary statistics (mean, p95)
- Total events, total time
- **Use**: Cross-run comparisons, statistical tests

---

## Export Formats

### For Analysis
**Parquet**: Efficient columnar storage
```python
df_latency.to_parquet('results/latency_direct_1000eps.parquet')
```

### For Sharing
**CSV**: Human-readable
```python
df_summary.to_csv('results/summary_stats.csv', index=False)
```

### For Visualization
**JSON**: Web dashboards
```python
json.dump(metrics, open('results/metrics.json', 'w'))
```

---

## Real-Time Monitoring Dashboard

**Tool**: Grafana + Azure Monitor connector

**Panels**:
1. **Throughput**: Line chart (events/sec over time)
2. **Latency**: Multi-line (p50, p95, p99)
3. **Queue Depth**: Area chart (Event Hub queue)
4. **CPU**: Gauge (ADX cluster utilization)
5. **Errors**: Count (ingestion failures)

**Alerts**:
- Latency p95 > 10s
- Throughput drop >20%
- Data loss detected

**Purpose**: Catch issues during experiment, not for final analysis

---

## Backup and Archival

**Raw Logs**: Keep for 1 year (compliance, re-analysis)
- Compressed: gzip
- Location: Azure Blob cool tier

**Processed Data**: Keep indefinitely
- Aggregates: CSV in GitHub repo
- Plots: PNG/SVG in paper directory

**Code**: Version-controlled (Git), tagged releases

---

## Privacy and Security

**No PII**: Synthetic events only
**Access Control**: Logs stored in private blob container
**Sharing**: Only aggregated, anonymized results published

---

## Validation Checklist

Before finalizing results:
- [ ] Cross-check event counts (gen = ingested + lost)
- [ ] Verify timestamp sanity (no future times, no negatives)
- [ ] Confirm clock sync (NTP drift <10ms)
- [ ] Validate statistical assumptions (normality, independence)
- [ ] Test reproducibility (re-run subset, compare within 5%)

---

## Next Steps

- [ ] Implement metrics collection harness
- [ ] Test logging overhead (<1%)
- [ ] Create Grafana dashboard template
- [ ] Write data validation scripts
- [ ] Design visualization templates (§5 Results)
