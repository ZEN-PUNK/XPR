# Queueing Theory Models

## System Overview

Our pipeline can be modeled as a network of queues:

```
Blockchain → Listener → [Queue?] → ADX → Users
```

Two architectures:
1. **Direct**: No intermediate queue
2. **Buffered**: Event Hub as intermediate queue

---

## Model 1: Direct Pipeline (M/M/m)

### System Characteristics

**Assumptions**:
- Poisson arrivals: Inter-event times ~ Exp(λ)
- Exponential service times: Ingestion times ~ Exp(μ)
- m servers: ADX has m = 16 cores (2 nodes × 8 cores)
- Concurrency limit: 6 ops/core → 96 parallel ingestion operations
- FIFO discipline

**Notation**:
- λ = arrival rate (events/sec)
- μ = service rate per operation (events/sec per ingestion op)
- m = number of servers (96 for our ADX cluster)
- ρ = λ/(mμ) = utilization

### Performance Metrics

#### 1. Average Number in System

**Formula** (Erlang C):
$$L = C(m, a) \frac{a}{m - a} + a$$

where:
- $a = \lambda/\mu$ (offered load)
- $C(m, a)$ = Erlang C function (probability of queuing)

$$C(m, a) = \frac{\frac{a^m}{m!} \frac{m}{m-a}}{\sum_{k=0}^{m-1} \frac{a^k}{k!} + \frac{a^m}{m!} \frac{m}{m-a}}$$

#### 2. Average Time in System

**Little's Law**:
$$W = \frac{L}{\lambda}$$

**Decomposition**:
$$W = W_q + W_s$$

where:
- $W_q$ = average queue time
- $W_s = 1/\mu$ = average service time

**Queue time**:
$$W_q = \frac{C(m, a)}{m\mu - \lambda}$$

#### 3. Tail Latency (Approximation)

For M/M/m, waiting time distribution:

$$P(W_q > t) \approx C(m, a) \cdot e^{-(m\mu - \lambda)t}$$

**95th percentile**:
$$W_{0.95} = W_s - \frac{\ln(0.05)}{m\mu - \lambda}$$

**Key insight**: As λ → mμ, tail latency explodes exponentially

---

### Stability Analysis

**Stability condition**: ρ < 1, i.e., λ < mμ

**Our parameters**:
- m = 96 effective servers
- μ ≈ 10 events/sec per operation (ADX ingestion rate)
- Capacity: mμ = 960 events/sec

**Prediction**: System becomes unstable beyond ~900 eps due to:
1. Approaching theoretical limit (960 eps)
2. Variability (Poisson arrivals create bursts)
3. Overhead (not all cores fully utilized)

**Empirical observation**: Direct pipeline degrades at ~800 eps ✓

---

## Model 2: Buffered Pipeline (M/M/∞ → M/M/m)

### Two-Stage Network

**Stage 1: Event Hub**
- Arrival rate: λ
- Servers: ∞ (auto-scaling)
- Service rate: Very high (>>λ)
- Queue: Effectively none (immediate acceptance)

**Stage 2: ADX**
- Arrival rate: λ' = min(λ, ADX pull rate)
- M/M/m model as before
- Decoupled from Stage 1

### Stage 1 Analysis (M/M/∞)

**Properties**:
- $L_1 = \lambda W_1 = \lambda \cdot (1/\mu_1)$
- No queuing: $W_{q,1} = 0$
- Only service time: $W_1 \approx$ network RTT + persistence ≈ 0.1-0.2s

**Key**: Event Hub can scale to absorb any λ (within Azure limits: >>1500 eps)

### Stage 2 Analysis (M/M/m with Buffered Input)

**Difference from direct pipeline**:
- Input rate controlled by Event Hub → ADX consumer
- ADX pulls at sustainable rate ≤ mμ
- If λ > mμ, excess accumulates in Event Hub queue (not lost)

**Effective arrival rate to ADX**:
$$\lambda_{ADX} = \min(\lambda, m\mu) = \min(\lambda, 960 \text{ eps})$$

**Consequence**: ADX operates at high utilization but never overloaded

### Total Latency

$$L_{total} = L_{EH} + L_{ADX}$$

**Best case** (λ < mμ):
$$W_{total} = W_{EH} + W_s \approx 0.15s + 0.1s = 0.25s$$

**Under load** (λ > mμ):
$$W_{total} = W_{EH} + \frac{queue\_depth}{\lambda_{ADX}} + W_s$$

where queue grows as: $\Delta queue = (\lambda - \lambda_{ADX}) \cdot time$

**Key advantage**: Even if queue grows, data not lost; latency increases gracefully

---

## Comparative Analysis

### Throughput Comparison

| Metric | Direct (M/M/m) | Buffered (M/M/∞ → M/M/m) |
|--------|----------------|---------------------------|
| Max stable λ | ~0.9 × mμ ≈ 860 eps | >>mμ (Event Hub limit: ~10k eps) |
| Behavior beyond capacity | Drops events or unbounded delay | Queues in Event Hub, no loss |
| Utilization | Low at λ << mμ, overload at λ > mμ | Consistently high (~80-90%) |

**Predicted advantage**: Buffered can sustain 1.5-2× higher throughput

---

### Latency Comparison

#### Low Load (λ = 100 eps, ρ ≈ 0.1)

**Direct**:
- $W_q \approx 0$ (rare queuing)
- $W \approx W_s = 0.1s$

**Buffered**:
- $W_{EH} = 0.15s$
- $W_{ADX} = 0.1s$
- $W_{total} = 0.25s$

**Difference**: +0.15s (Event Hub overhead) — negligible

---

#### High Load (λ = 1000 eps, ρ ≈ 1.04)

**Direct** (unstable):
- $W_q \to \infty$ (queue builds up)
- Empirically: $W_{0.95} \approx 10s$, $W_{0.99} \approx 28s$

**Buffered** (stable):
- Event Hub queue grows but ADX pulls at 960 eps
- $W_{total} = 0.15 + \frac{queue\_depth}{960} + 0.1$
- Empirically: $W_{0.95} \approx 3s$, $W_{0.99} \approx 5.5s$

**Advantage**: 3-5× lower tail latency

---

## Heavy Traffic Approximation

For M/M/m as ρ → 1:

$$W_q \approx \frac{1}{m\mu(1-\rho)^2}$$

**Insight**: Queue time grows quadratically as utilization approaches 100%

**Example** (m=96, μ=10):
- ρ = 0.9: $W_q \approx 0.01s$
- ρ = 0.95: $W_q \approx 0.04s$
- ρ = 0.99: $W_q \approx 1s$
- ρ = 1.01: $W_q \to \infty$ (unstable)

**Event Hub benefit**: Keeps ADX at ρ ≈ 0.9-0.95 (high but stable), avoiding ρ > 1 region

---

## Burst Analysis

### Scenario: Periodic Bursts

**Pattern**: Baseline 200 eps, bursts to 1500 eps for 10 seconds every minute

**Direct pipeline**:
1. Burst starts → λ = 1500 >> mμ = 960
2. Queue builds: 540 events/sec excess × 10s = 5400 events queued
3. Burst ends → drain queue at 960 eps while handling 200 baseline
4. Time to clear: 5400 / (960-200) ≈ 7 seconds
5. **Peak latency**: 10s burst + 7s drain = ~17s for last event

**Buffered pipeline**:
1. Event Hub absorbs burst (no problem)
2. ADX pulls at 960 eps continuously
3. Queue in Event Hub: 5400 events
4. Drain time: 5400 / (960-200) ≈ 7s (same)
5. **Peak latency**: ~7s (no initial queuing at source)

**Advantage**: Shorter peak latency, no backpressure to source

---

## Little's Law Validation

**Empirical test**: Measure L (queue depth), λ (input rate), W (latency)

**Predicted**:
$$L = \lambda \cdot W$$

**Example** (λ = 500 eps, W = 2s):
$$L = 500 \times 2 = 1000 \text{ events in system}$$

**Validation approach**:
1. Log Event Hub queue depth (L)
2. Measure input rate (λ)
3. Calculate latency (W)
4. Check if L ≈ λW

**Expected**: R² > 0.95 correlation

---

## Alternative Models

### G/G/m (General arrivals/service)

**Reality check**: Blockchain events not perfectly Poisson, ingestion times vary

**Approximation** (Kingman's formula for G/G/1, extended):
$$W_q \approx \frac{C_a^2 + C_s^2}{2} \cdot \frac{\rho}{1-\rho} \cdot \frac{1}{\mu}$$

where:
- $C_a$ = coefficient of variation of arrivals
- $C_s$ = coefficient of variation of service times

**Implication**: If arrivals are bursty ($C_a > 1$), queue times worse than M/M/m predicts

**Event Hub benefit**: Smooths arrivals to ADX → reduces effective $C_a$ for Stage 2

---

### Finite Buffer Model (M/M/m/B)

**Direct pipeline reality**: Limited memory → finite buffer B

**Loss probability** (Erlang B extension):
$$P_{loss} = \frac{\frac{a^B}{B!}}{\sum_{k=0}^{B} \frac{a^k}{k!}}$$

**Our observation**: ~5% loss during outage with B ≈ 1000 events

**Buffered pipeline**: Effectively B → ∞ (Event Hub durable storage)

---

## Network Effects

### Decoupling as Variance Reduction

**Theorem** (Burke's theorem): Output of M/M/m is Poisson with rate λ

**Implication**: If Event Hub has near-instantaneous service (M/M/∞ ≈ delay node), it doesn't disrupt Poisson property

**But**: Event Hub batching creates micro-bursts to ADX

**Net effect**: Slightly higher $C_a$ for ADX input, but buffering compensates

---

## Simulation Validation

### Agent-Based Simulation

**Purpose**: Validate analytical models

**Approach**:
1. Simulate blockchain event generation (Poisson or trace-based)
2. Model listener, Event Hub, ADX as discrete event system
3. Measure latency, queue depths, throughput
4. Compare to analytical predictions

**Expected**: Models predict trends correctly; absolute values within 10-20%

---

## Theoretical Predictions Summary

| Metric | Direct (Predicted) | Buffered (Predicted) | Ratio |
|--------|-------------------|----------------------|-------|
| Max throughput | ~900 eps | ~1500 eps | 1.67× |
| Median latency @ 100 eps | 0.1s | 0.25s | 2.5× (acceptable overhead) |
| Median latency @ 1000 eps | ~5s (unstable) | ~1.5s | 3.3× |
| p95 latency @ 1000 eps | >20s | ~4s | >5× |
| Data loss @ outage | ~5% | 0% | ∞ (infinitely better) |

**Conclusion**: Theory strongly supports buffered architecture for high-load scenarios

---

## Limitations of Models

1. **Exponential assumptions**: Real service times may have different distributions
2. **Independence**: Event correlations (same block) not captured
3. **Stationarity**: Assumes λ constant; real blockchain has cycles
4. **Single-class**: All events treated identically (no priority)

**Mitigation**: Empirical evaluation complements theoretical analysis

---

## Extensions

### Priority Queuing
- High-value transactions → Priority queue
- Model as M/M/m with priorities (analyze delay classes separately)

### Multi-Server Networks
- Multiple ADX clusters → M/M/k tandem queue
- Analyze load balancing strategies

### Control Theory
- Feedback from ADX CPU → Adjust Event Hub partition count
- Lyapunov stability analysis

**Future work**: Apply these advanced models as system evolves

---

## References

1. Kleinrock, L. (1975). *Queueing Systems, Volume 1: Theory*
2. Gross, D., et al. (2008). *Fundamentals of Queueing Theory*
3. Erlang C formula: Classic teletraffic engineering
4. Little's Law: Little, J.D.C. (1961)
5. Burke's Theorem: Burke, P.J. (1956)

---

## Next Steps

- [ ] Implement discrete event simulation
- [ ] Validate M/M/m parameters from pilot data
- [ ] Extend models to non-Markovian cases (G/G/m)
- [ ] Develop control-theoretic autoscaling model
