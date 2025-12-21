# Results Analysis Framework

## Overview

This document provides templates for analyzing and presenting experimental results following NeurIPS standards.

---

## 1. Throughput Analysis

### Summary Table

| Pipeline | Load (eps) | Achieved (eps) | Efficiency (%) | Std Dev | p-value vs Direct |
|----------|-----------|---------------|---------------|---------|----------|
| Direct | 100 | 99.8 | 99.8 | 0.5 | - |
| Event Hub | 100 | 99.7 | 99.7 | 0.4 | 0.72 (n.s.) |
| Direct | 600 | 587 | 97.8 | 12.3 | - |
| Event Hub | 600 | 598 | 99.7 | 3.1 | 0.08 |
| Direct | 1000 | 812 | 81.2 | 45.6 | - |
| Event Hub | 1000 | 997 | 99.7 | 5.2 | <0.001 *** |
| Direct | 1500 | 890 | 59.3 | 78.2 | - |
| Event Hub | 1500 | 1478 | 98.5 | 15.7 | <0.001 *** |

**Legend**: n.s. = not significant, *** = p < 0.001

### Capacity Curve Plot

```python
import matplotlib.pyplot as plt

# Template for throughput vs load plot
fig, ax = plt.subplots(figsize=(10, 6))

loads = [100, 200, 400, 600, 800, 1000, 1200, 1500]
direct_throughput = [100, 198, 395, 587, 765, 812, 845, 890]
eh_throughput = [100, 199, 399, 598, 796, 997, 1195, 1478]

ax.plot(loads, loads, 'k--', label='Ideal (100%)', alpha=0.5)
ax.plot(loads, direct_throughput, 'ro-', label='Direct Pipeline', linewidth=2)
ax.plot(loads, eh_throughput, 'bs-', label='Event Hub Pipeline', linewidth=2)

ax.set_xlabel('Input Load (events/sec)', fontsize=12)
ax.set_ylabel('Achieved Throughput (events/sec)', fontsize=12)
ax.set_title('Throughput Capacity: Buffered vs Direct Ingestion', fontsize=14)
ax.legend(fontsize=11)
ax.grid(alpha=0.3)

# Annotate saturation point
ax.annotate('Direct saturates', xy=(1000, 812), xytext=(1100, 600),
            arrowprops=dict(arrowstyle='->', color='red'),
            fontsize=10, color='red')

plt.tight_layout()
plt.savefig('figures/throughput_capacity.png', dpi=300)
```

### Statistical Test Results

**Two-sample t-test at 1000 eps**:
```
H0: μ_EH = μ_Direct
H1: μ_EH > μ_Direct

t-statistic: 8.42
p-value: 0.00023
Degrees of freedom: 8
Effect size (Cohen's d): 3.77 (very large)

Conclusion: Reject H0 at α=0.01. Event Hub pipeline achieves significantly higher throughput.
```

---

## 2. Latency Distribution Analysis

### Percentile Table

| Pipeline | Load | Mean | Median | p90 | p95 | p99 | Max |
|----------|------|------|--------|-----|-----|-----|-----|
| Direct | 100 | 0.65 | 0.62 | 0.75 | 0.81 | 0.95 | 1.2 |
| Event Hub | 100 | 0.78 | 0.75 | 0.90 | 0.95 | 1.10 | 1.5 |
| Direct | 600 | 1.85 | 1.20 | 3.50 | 5.20 | 12.5 | 18.3 |
| Event Hub | 600 | 1.10 | 0.95 | 1.50 | 1.80 | 2.50 | 3.8 |
| Direct | 1000 | 8.50 | 4.20 | 15.2 | 22.5 | 45.8 | 68.2 |
| Event Hub | 1000 | 1.75 | 1.30 | 2.80 | 3.50 | 6.20 | 9.5 |

**Units**: seconds

### CDF Plot

```python
import numpy as np
from scipy import stats

# Template for CDF comparison
fig, axes = plt.subplots(1, 3, figsize=(15, 4))
loads = [100, 600, 1000]

for i, load in enumerate(loads):
    ax = axes[i]
    
    # Load latency data
    direct_latencies = load_data(f'direct_{load}eps.parquet')
    eh_latencies = load_data(f'eh_{load}eps.parquet')
    
    # Compute CDFs
    x_direct = np.sort(direct_latencies)
    y_direct = np.arange(1, len(x_direct)+1) / len(x_direct)
    x_eh = np.sort(eh_latencies)
    y_eh = np.arange(1, len(x_eh)+1) / len(x_eh)
    
    ax.plot(x_direct, y_direct, 'r-', label='Direct', linewidth=2)
    ax.plot(x_eh, y_eh, 'b-', label='Event Hub', linewidth=2)
    
    ax.axhline(0.95, color='k', linestyle='--', alpha=0.3, label='p95')
    ax.axhline(0.99, color='k', linestyle=':', alpha=0.3, label='p99')
    
    ax.set_xlabel('Latency (s)', fontsize=11)
    ax.set_ylabel('CDF', fontsize=11)
    ax.set_title(f'{load} events/sec', fontsize=12)
    ax.legend(fontsize=9)
    ax.grid(alpha=0.2)
    ax.set_xlim(0, min(x_direct[-1], 15))  # Cap x-axis for readability

plt.tight_layout()
plt.savefig('figures/latency_cdf.png', dpi=300)
```

### Kolmogorov-Smirnov Test

```python
from scipy.stats import ks_2samp

# Template for KS test at each load level
results = []
for load in [100, 600, 1000]:
    direct = load_data(f'direct_{load}eps.parquet')['latency']
    eh = load_data(f'eh_{load}eps.parquet')['latency']
    
    statistic, pvalue = ks_2samp(direct, eh)
    
    results.append({
        'Load': load,
        'D-statistic': statistic,
        'p-value': pvalue,
        'Significant': 'Yes' if pvalue < 0.001 else 'No'
    })

print(pd.DataFrame(results).to_markdown(index=False))
```

**Example Output**:
| Load | D-statistic | p-value | Significant |
|------|-------------|---------|-------------|
| 100 | 0.08 | 0.12 | No |
| 600 | 0.35 | 3.2e-8 | Yes |
| 1000 | 0.62 | <1e-10 | Yes |

---

## 3. Tail Latency Focus

### Tail Ratio Analysis

**Definition**: $R_{tail} = \frac{p99}{p50}$

| Pipeline | 100 eps | 600 eps | 1000 eps |
|----------|---------|---------|----------|
| Direct | 1.53 | 10.4 | 10.9 |
| Event Hub | 1.47 | 2.63 | 4.77 |

**Interpretation**: Event Hub maintains lower tail ratio → more predictable performance

### Heatmap: Latency Percentiles

```python
import seaborn as sns

# Template for heatmap
data = {
    'Pipeline': ['Direct']*4 + ['Event Hub']*4,
    'Load': [100, 600, 1000, 1500]*2,
    'p50': [0.62, 1.20, 4.20, 5.80, 0.75, 0.95, 1.30, 1.50],
    'p95': [0.81, 5.20, 22.5, 35.2, 0.95, 1.80, 3.50, 5.20],
    'p99': [0.95, 12.5, 45.8, 68.4, 1.10, 2.50, 6.20, 9.50]
}

df = pd.DataFrame(data)
df_pivot = df.pivot_table(index='Load', columns='Pipeline', values='p99')

fig, ax = plt.subplots(figsize=(8, 6))
sns.heatmap(df_pivot, annot=True, fmt='.1f', cmap='YlOrRd', ax=ax)
ax.set_title('99th Percentile Latency (seconds)', fontsize=14)
plt.tight_layout()
plt.savefig('figures/latency_p99_heatmap.png', dpi=300)
```

---

## 4. Fault Tolerance Results

### Data Loss Comparison

**Scenario**: 30-second ADX outage at 500 eps

| Pipeline | Events Generated | Events Ingested | Events Lost | Loss Rate (%) |
|----------|------------------|-----------------|-------------|---------------|
| Direct | 25,000 | 23,750 | 1,250 | 5.0 |
| Event Hub | 25,000 | 25,000 | 0 | 0.0 |

**Binomial Test**:
```python
from scipy.stats import binom_test

p_direct = 1250 / 25000  # 5% loss
p_eh = 0 / 25000         # 0% loss

# Test if loss rates differ
pvalue = binom_test(0, 25000, p_direct, alternative='less')
print(f"p-value: {pvalue:.2e}")  # Expected: p << 0.001
```

### Recovery Time

| Pipeline | Queue Buildup (events) | Peak Latency (s) | Recovery Time (s) |
|----------|------------------------|------------------|-------------------|
| Direct | ~5,000 (in mem) | N/A (dropped) | 0 (never recovered lost events) |
| Event Hub | 15,000 | 38.5 | 25 |

**Interpretation**: Event Hub buffers all events, recovers gracefully; Direct loses data permanently

---

## 5. ANOVA Results

### Two-Way ANOVA: Latency ~ Pipeline × Load

```python
from scipy.stats import f_oneway
from statsmodels.formula.api import ols
from statsmodels.stats.anova import anova_lm

# Load data for all combinations
df_all = load_all_runs()  # Columns: Pipeline, Load, Latency

# Fit model
model = ols('Latency ~ C(Pipeline) + C(Load) + C(Pipeline):C(Load)', data=df_all).fit()
anova_table = anova_lm(model, typ=2)

print(anova_table)
```

**Example Output**:
```
                          sum_sq      df        F    PR(>F)
C(Pipeline)              5432.1     1.0   1245.3  <0.001 ***
C(Load)                  8901.5     7.0    291.7  <0.001 ***
C(Pipeline):C(Load)      2103.7     7.0     68.9  <0.001 ***
Residual                  423.6   972.0      NaN       NaN
```

**Interpretation**:
- **Pipeline**: Highly significant (p < 0.001) — buffered vs direct matters
- **Load**: Highly significant — latency increases with load (as expected)
- **Interaction**: Significant — the difference between pipelines grows with load (validates H2)

**Effect Size** (η²):
```python
ss_pipeline = 5432.1
ss_total = 5432.1 + 8901.5 + 2103.7 + 423.6
eta_squared = ss_pipeline / ss_total
print(f"η² for Pipeline: {eta_squared:.3f}")  # ~0.32 (large effect)
```

---

## 6. Bootstrap Confidence Intervals

### Median Latency Difference at 1000 eps

```python
from scipy.stats import bootstrap

direct_1000 = load_data('direct_1000eps.parquet')['latency']
eh_1000 = load_data('eh_1000eps.parquet')['latency']

def median_diff(x, y):
    return np.median(x) - np.median(y)

# Bootstrap resampling
rng = np.random.default_rng(seed=42)
boot_result = bootstrap(
    (direct_1000, eh_1000),
    median_diff,
    n_resamples=10000,
    confidence_level=0.95,
    random_state=rng
)

print(f"Median difference: {median_diff(direct_1000, eh_1000):.2f}s")
print(f"95% CI: [{boot_result.confidence_interval.low:.2f}, {boot_result.confidence_interval.high:.2f}]")
```

**Example Output**:
```
Median difference: 2.90s
95% CI: [2.75, 3.05]
```

**Interpretation**: Direct pipeline has 2.9s higher median latency; CI excludes 0 → significant improvement

---

## 7. Resource Utilization

### ADX CPU Over Time

```python
# Template for time-series plot
fig, ax = plt.subplots(figsize=(12, 4))

time = np.arange(0, 300)  # 5 minutes
direct_cpu = simulate_cpu_direct(time)  # Placeholder
eh_cpu = simulate_cpu_eh(time)

ax.plot(time, direct_cpu, 'r-', label='Direct Pipeline', linewidth=1.5)
ax.plot(time, eh_cpu, 'b-', label='Event Hub Pipeline', linewidth=1.5)

ax.axhline(90, color='orange', linestyle='--', label='High Utilization (90%)', alpha=0.7)
ax.set_xlabel('Time (s)', fontsize=12)
ax.set_ylabel('ADX CPU (%)', fontsize=12)
ax.set_title('ADX CPU Utilization at 1000 events/sec', fontsize=14)
ax.legend(fontsize=10)
ax.grid(alpha=0.3)

plt.tight_layout()
plt.savefig('figures/adx_cpu_timeseries.png', dpi=300)
```

### Summary Table

| Pipeline | Load (eps) | Avg CPU (%) | Max CPU (%) | Avg Memory (GB) | Event Hub TUs |
|----------|-----------|------------|------------|----------------|---------------|
| Direct | 600 | 42 | 58 | 12.3 | N/A |
| Event Hub | 600 | 48 | 62 | 12.8 | 2.1 |
| Direct | 1000 | 68 | 95 | 14.5 | N/A |
| Event Hub | 1000 | 52 | 65 | 13.2 | 3.2 |

**Observation**: Event Hub pipeline maintains steadier CPU, doesn't spike as high (better utilization)

---

## 8. Cost-Performance Trade-off

### Cost Model

```python
# Hourly costs (USD)
COST_ADX_NODE = 5.00  # 2 nodes = $10/hour
COST_EH_TU = 0.015
COST_VM = 0.20

def calculate_cost(pipeline, throughput_eps):
    base = 2 * COST_ADX_NODE + COST_VM  # $10.20/hour
    
    if pipeline == 'Event Hub':
        tus = np.ceil(throughput_eps / 1000)  # 1 TU ~ 1k eps
        base += tus * COST_EH_TU
    
    return base

# Cost per million events
direct_cost_per_M = calculate_cost('Direct', 800) / (800 * 3600 / 1e6)
eh_cost_per_M = calculate_cost('Event Hub', 1500) / (1500 * 3600 / 1e6)

print(f"Direct: ${direct_cost_per_M:.4f}/million events")
print(f"Event Hub: ${eh_cost_per_M:.4f}/million events")
```

**Example Output**:
```
Direct: $0.0035/million events (at 800 eps capacity)
Event Hub: $0.0019/million events (at 1500 eps capacity)
```

**Conclusion**: Event Hub is ~45% cheaper per event due to better throughput

---

## 9. Sensitivity Analysis

### Batch Size Impact

| Batch Size | Direct p95 (s) | EH p95 (s) | Throughput Direct | Throughput EH |
|------------|---------------|-----------|------------------|--------------|
| 10 | 1.2 | 0.9 | 750 | 1400 |
| 50 | 2.1 | 1.5 | 800 | 1450 |
| 100 | 3.5 | 1.8 | 820 | 1480 |
| 500 | 8.2 | 2.5 | 850 | 1500 |

**Observation**: Larger batches improve throughput but increase latency; Event Hub less sensitive

---

## 10. Visualization Best Practices

### Figure Checklist
- [ ] High resolution (300 DPI for publication)
- [ ] Clear axis labels with units
- [ ] Legend positioned to not obscure data
- [ ] Colorblind-friendly palette (avoid red-green only)
- [ ] Grid lines for readability (alpha=0.3)
- [ ] Annotations for key insights
- [ ] Consistent font sizes (axis: 11pt, title: 14pt)

### Color Palette
```python
COLOR_DIRECT = '#E74C3C'    # Red
COLOR_EH = '#3498DB'        # Blue
COLOR_KAFKA = '#2ECC71'     # Green
COLOR_BASELINE = '#95A5A6'  # Gray
```

---

## Next Steps

- [ ] Generate all plots with real data
- [ ] Perform statistical tests and record p-values
- [ ] Create supplementary materials (extended tables)
- [ ] Write results section prose to accompany figures
- [ ] Prepare appendix with full ANOVA tables
