# Formal Hypotheses: Performance Evaluation

## Research Questions

**RQ1**: Does buffered ingestion (Event Hub + ADX) achieve higher throughput than direct ingestion?

**RQ2**: Does buffered ingestion maintain lower latency under high load?

**RQ3**: Does buffered ingestion provide better fault tolerance during consumer outages?

**RQ4**: Are observed differences statistically significant?

---

## Hypotheses

### H1: Throughput Capacity

**Null Hypothesis (H₀)**: The maximum sustained throughput of the Event Hub pipeline equals that of the direct pipeline.

$$H_0: \mu_{throughput}^{EH} = \mu_{throughput}^{Direct}$$

**Alternative Hypothesis (H₁)**: The Event Hub pipeline sustains higher throughput than the direct pipeline.

$$H_1: \mu_{throughput}^{EH} > \mu_{throughput}^{Direct}$$

**Predicted Effect Size**: ≥50% improvement (1500 vs 1000 events/sec)

**Test**: Two-sample t-test, significance level α = 0.01

**Rationale**: Event Hub can ingest quickly to memory and ACK to producer, while direct pipeline is limited by ADX's concurrency and ingestion rate.

---

### H2: Latency Under Load

#### H2a: Low Load (≤200 eps)
**Null**: No significant latency difference at low load

$$H_0: D_{KS}(L^{EH}, L^{Direct}) < 0.1$$

**Alternative**: Latencies are comparable (both low)

**Expected**: p > 0.05 (no significant difference)

#### H2b: High Load (≥1000 eps)
**Null**: Latency distributions are identical

$$H_0: F_{EH}(t) = F_{Direct}(t) \quad \forall t$$

**Alternative**: Event Hub pipeline has stochastically lower latency

$$H_1: F_{EH}(t) \geq F_{Direct}(t) \quad \forall t \text{ (with strict inequality for some } t)$$

**Predicted Effect**:
- Median latency: 2-3× lower for EH
- 95th percentile: 3-4× lower for EH
- 99th percentile: 5-10× lower for EH

**Test**: Kolmogorov-Smirnov test, α = 0.001

**Rationale**: Direct pipeline creates backpressure when ADX saturates; Event Hub buffers excess load.

---

### H3: Fault Tolerance

**Scenario**: 30-second ADX outage during 500 eps ingestion

**Null**: Both pipelines have equal data loss rates

$$H_0: p_{loss}^{EH} = p_{loss}^{Direct}$$

**Alternative**: Event Hub pipeline has zero or near-zero data loss

$$H_1: p_{loss}^{EH} < p_{loss}^{Direct}$$

**Predicted**: 
- Event Hub: 0% loss (all events buffered)
- Direct: ~5% loss (buffer overflow)

**Test**: Exact binomial test on lost events count

**Rationale**: Event Hub provides durable queueing; direct pipeline has limited buffering.

---

### H4: Statistical Significance

**Meta-Hypothesis**: Observed differences are not due to random variation

**Tests Applied**:
1. **Two-way ANOVA**: Factors = {Pipeline type, Load level}, Response = Latency
   - Main effects: Pipeline (p < 0.001 expected)
   - Interaction: Pipeline × Load (expect significant interaction)

2. **Bootstrapping**: 95% confidence intervals for median and p95 latency differences
   - If CIs exclude zero → significant improvement

3. **Multiple comparison correction**: Bonferroni or Tukey HSD for post-hoc tests

**Target**: All major findings significant at α ≤ 0.01

---

## Queueing Theory Predictions

### Direct Pipeline Model: M/M/m System

**Setup**:
- Arrival rate: λ (events/sec)
- Service rate per server: μ (ADX ingestion rate per core)
- Number of servers: m = 16 cores (2 nodes × 8 cores)
- ADX limit: 6 concurrent ops per core → effective m = 96 ops

**Formulas**:

**Utilization**: 
$$\rho = \frac{\lambda}{m \mu}$$

**Expected queue time** (M/M/m formula):
$$W_q = \frac{C(m, \rho)}{m\mu - \lambda}$$

where $C(m, \rho)$ is Erlang C function.

**Prediction**: When λ approaches mμ, $W_q \to \infty$ (instability)

**Our case**: μ ≈ 100 eps/sec per ADX cluster → max λ ≈ 900 eps before instability

---

### Event Hub Pipeline Model: M/M/∞ → M/M/m

**Setup**:
- Stage 1 (Event Hub): Infinite servers (auto-scale) → near-zero queue time
- Stage 2 (ADX): M/M/m as above

**Formulas**:

**Event Hub latency**: 
$$L_{EH} \approx \text{network RTT} + \text{persistence time} \approx 0.1-0.2s$$

**Total latency**:
$$L_{total} = L_{EH} + L_{ADX}$$

**Key insight**: Event Hub decouples arrival rate from ADX service rate

- Event Hub accepts λ up to its capacity (>>1500 eps with auto-scale)
- ADX pulls at rate min(λ, mμ)
- If λ > mμ temporarily, Event Hub queue grows but no loss

**Prediction**: System remains stable even when λ > mμ (unlike direct pipeline)

---

### Little's Law Validation

**Formula**: 
$$L = \lambda W$$

where:
- L = average number of events in system
- λ = arrival rate
- W = average time in system

**Test**: Measure L (via Event Hub metrics), λ (input rate), W (latency)
- Check if L ≈ λW holds empirically
- Validates queueing model assumptions

**Expected**: Strong correlation (R² > 0.95) between predicted and observed

---

## Statistical Power Analysis

**Goal**: Ensure experiments have sufficient power to detect meaningful differences

**Parameters**:
- Effect size: Cohen's d ≥ 0.8 (large effect)
- Significance level: α = 0.01
- Desired power: 1 - β = 0.95

**Sample size calculation**:

For t-test comparing means:
$$n = \frac{2(z_{1-\alpha/2} + z_{1-\beta})^2 \sigma^2}{\delta^2}$$

where δ = expected difference, σ = standard deviation

**Our approach**: 
- Run each scenario 3-5 times
- Each run collects thousands of latency samples
- Effective n >> required minimum

**Validation**: Post-hoc power analysis confirms achieved power > 0.95

---

## Confounding Variables & Controls

### Potential Confounds

1. **Network variability**: Different test runs may experience different network conditions
   - **Control**: Run tests in same Azure region, private network, off-peak hours
   
2. **ADX cluster warm-up**: First queries/ingestions may be slower
   - **Control**: Warm-up period before measurements, exclude first 100 events

3. **Batch size effects**: Different batching could confound pipeline comparison
   - **Control**: Use same batch size (100 events) for both pipelines

4. **Time-of-day effects**: Azure performance may vary
   - **Control**: Randomize test order, run multiple times across different times

5. **Instrumentation overhead**: Logging may affect performance
   - **Control**: Minimal logging during tests, validate overhead <1%

### Validation Checks

- **Repeatability**: Coefficient of variation <5% across runs
- **Consistency**: No outlier runs (>3σ from mean)
- **Monotonicity**: Higher load → higher latency (sanity check)

---

## Hypothesis Testing Workflow

1. **Pre-registration**: Document hypotheses before experiments (this file)
2. **Pilot study**: Small-scale test to refine parameters
3. **Main experiments**: Full workload matrix
4. **Statistical analysis**: 
   - Descriptive stats (mean, median, percentiles)
   - Inferential tests (t-test, KS-test, ANOVA)
   - Effect sizes (Cohen's d, KS D-statistic)
   - Confidence intervals (bootstrap)
5. **Interpretation**: 
   - Accept/reject hypotheses
   - Calculate p-values
   - Report effect sizes
   - Discuss practical significance

---

## Expected Outcomes

| Hypothesis | Expected Result | Significance | Effect Size |
|------------|----------------|--------------|-------------|
| H1 (Throughput) | EH > Direct | p < 0.01 | +50% (750 → 1125 eps) |
| H2a (Low load latency) | EH ≈ Direct | p > 0.05 | d < 0.2 (negligible) |
| H2b (High load latency) | EH << Direct | p < 0.001 | d > 1.5 (very large) |
| H3 (Fault tolerance) | EH: 0% loss, Direct: ~5% | p < 0.001 | 100% relative improvement |
| H4 (ANOVA) | Significant main effects & interaction | p < 0.001 | η² > 0.3 |

---

## Falsifiability

**How could we be wrong?**

- If Event Hub adds too much latency overhead → H2 fails
- If ADX scales better than expected under direct load → H1 fails
- If direct pipeline's retries prevent data loss → H3 fails

**Safety net**: We'll report results honestly regardless of hypothesis outcomes

**Scientific integrity**: Null results are also valuable findings

---

## Next Steps

- [ ] Implement experiment harness
- [ ] Define precise metrics collection points
- [ ] Write statistical analysis scripts
- [ ] Plan visualization strategy
- [ ] Design experiment matrix (load levels × pipeline types)
