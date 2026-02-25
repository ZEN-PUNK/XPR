# 🏗️ Experiment 02: Multi-Node Consensus Network Architecture

**Status:** 📋 Planning Phase  
**Parent:** experiment_01 (Standalone Block Producer)  
**Objective:** Deploy a multi-node Proton blockchain network with consensus mechanism

---

## 🎯 Goals

Deploy a **production-grade multi-validator blockchain network** featuring:

1. **Multiple Block Producers** (3-21 validators)
2. **Round-Robin Block Production** scheduling
3. **Byzantine Fault Tolerant (BFT) Consensus**
4. **P2P Mesh Network** between all nodes
5. **Automated Deployment** via Azure CLI
6. **Pre-deployment Simulation** and error prevention

---

## 📐 Architecture Overview

### Network Topology

```
┌─────────────────────────────────────────────────────────────┐
│                    Multi-Node Consensus Network             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────┐      ┌───────────────┐      ┌──────────┐│
│  │   Producer 1  │◄────►│   Producer 2  │◄────►│Producer 3││
│  │   (VM-01)     │      │   (VM-02)     │      │ (VM-03)  ││
│  │               │      │               │      │          ││
│  │ - RPC: 8888   │      │ - RPC: 8888   │      │- RPC:8888││
│  │ - P2P: 9876   │      │ - P2P: 9876   │      │- P2P:9876││
│  │ - Keys: key-1 │      │ - Keys: key-2 │      │- Keys:k-3││
│  └───────┬───────┘      └───────┬───────┘      └─────┬────┘│
│          │                      │                     │     │
│          │       P2P Mesh Network (Full Connectivity) │     │
│          └──────────────────────┴─────────────────────┘     │
│                                                               │
│  Block Production Schedule (Round-Robin):                    │
│  ├─ Producer 1: blocks 1, 4, 7, 10, 13... (every 3rd)       │
│  ├─ Producer 2: blocks 2, 5, 8, 11, 14... (every 3rd)       │
│  └─ Producer 3: blocks 3, 6, 9, 12, 15... (every 3rd)       │
│                                                               │
│  Consensus: 2/3+1 producers must agree for finality          │
│  Block Time: 0.5 seconds per block                           │
│  Producer Rotation: Every block (round-robin)                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Differences from Experiment 01

| Feature | Experiment 01 | Experiment 02 |
|---------|---------------|---------------|
| **Nodes** | 1 standalone producer | 3+ networked producers |
| **Consensus** | None (single node) | BFT (2/3+1 majority) |
| **P2P** | No peers | Full mesh P2P network |
| **Production** | Continuous (1 producer) | Round-robin (N producers) |
| **Finality** | Immediate | After 2/3+1 confirmations |
| **Use Case** | Local dev/testing | Multi-validator simulation |
| **Complexity** | Low | Medium-High |

---

## 🏛️ Consensus Mechanism

### EOSIO DPoS-BFT Hybrid

**Algorithm:** Delegated Proof of Stake with Byzantine Fault Tolerance

**Key Properties:**
- **Producer Set:** Fixed list of N active producers (configurable: 3, 7, 21)
- **Block Production:** Round-robin schedule, each producer gets 12 consecutive blocks
- **Block Time:** 0.5 seconds (same as experiment_01)
- **Finality:** Block becomes irreversible after 2/3+1 producers confirm
- **Fault Tolerance:** Network continues if <1/3 producers are down

**Round-Robin Schedule:**
```
Producer Set: [producer-a, producer-b, producer-c]

Block #1  → producer-a  ┐
Block #2  → producer-a  │
Block #3  → producer-a  │ 12 blocks
...                     │ per producer
Block #12 → producer-a  ┘

Block #13 → producer-b  ┐
Block #14 → producer-b  │ 12 blocks
...                     │
Block #24 → producer-b  ┘

Block #25 → producer-c  ┐
...                     │ 12 blocks
Block #36 → producer-c  ┘

[Repeat from producer-a]
```

**Consensus Rules:**
1. Each producer must receive blocks from peers
2. Producer validates block signature and transactions
3. Producer adds block to chain if valid
4. Block becomes LIB (Last Irreversible Block) after 2/3+1 confirmations
5. Network continues if ≥2/3+1 producers online

---

## 🔐 Security Model

### Producer Key Management

Each producer gets unique cryptographic keypair:
```
Producer A:
  - Public Key:  EOS6...A1
  - Private Key: 5K...XYZ (stored in docker-compose)
  - Account:     producer-a

Producer B:
  - Public Key:  EOS6...B2
  - Private Key: 5K...ABC
  - Account:     producer-b

Producer C:
  - Public Key:  EOS6...C3
  - Private Key: 5K...DEF
  - Account:     producer-c
```

### Genesis Configuration

Single `genesis.json` shared across all nodes:
```json
{
  "initial_timestamp": "2026-02-25T00:00:00.000",
  "initial_key": "EOS6...SHARED",
  "initial_configuration": { ... },
  "initial_producers": [
    {"producer_name": "producer-a", "block_signing_key": "EOS6...A1"},
    {"producer_name": "producer-b", "block_signing_key": "EOS6...B2"},
    {"producer_name": "producer-c", "block_signing_key": "EOS6...C3"}
  ]
}
```

---

## 🌐 Network Configuration

### P2P Mesh Topology

Every node connects to every other node (full mesh):

```bash
# Node 1 configuration
--p2p-peer-address=<VM-02-IP>:9876
--p2p-peer-address=<VM-03-IP>:9876

# Node 2 configuration
--p2p-peer-address=<VM-01-IP>:9876
--p2p-peer-address=<VM-03-IP>:9876

# Node 3 configuration
--p2p-peer-address=<VM-01-IP>:9876
--p2p-peer-address=<VM-02-IP>:9876
```

**Benefits:**
- ✅ Maximum redundancy
- ✅ Fast block propagation
- ✅ No single point of failure
- ✅ Simple to configure

**Considerations:**
- For N nodes: N*(N-1)/2 connections
- 3 nodes = 3 connections
- 21 nodes = 210 connections (scales quadratically)

---

## 🚀 Deployment Strategy

### Phase 1: Infrastructure Setup (Azure)

```bash
# Create resource group
az group create --name proton-consensus-network --location eastus

# Create 3 VMs with Network Security Group
for i in 1 2 3; do
  az vm create \
    --resource-group proton-consensus-network \
    --name proton-producer-$i \
    --image Ubuntu2204 \
    --size Standard_D2s_v3 \
    --admin-username azureuser \
    --generate-ssh-keys \
    --nsg-rule SSH,RPC,P2P
done
```

### Phase 2: Key Generation

```bash
# Generate unique keypair for each producer
KEYS_1=$(generate_keys)  # Producer A
KEYS_2=$(generate_keys)  # Producer B
KEYS_3=$(generate_keys)  # Producer C
```

### Phase 3: Genesis Creation

```bash
# Single genesis.json with all producer keys
create_genesis_json \
  --producer producer-a:$PUBKEY_1 \
  --producer producer-b:$PUBKEY_2 \
  --producer producer-c:$PUBKEY_3
```

### Phase 4: Node Deployment

```bash
# Deploy each node with:
# - Its own producer keys
# - P2P addresses of other nodes
# - Shared genesis.json

for i in 1 2 3; do
  deploy_producer_node \
    --vm-ip $VM_IP[$i] \
    --producer-name producer-$(echo $i | tr '123' 'abc') \
    --private-key $PRIVKEY[$i] \
    --public-key $PUBKEY[$i] \
    --peers $OTHER_VMS
done
```

### Phase 5: Network Start

```bash
# Start all nodes simultaneously (within 5 seconds)
# to ensure genesis block synchronization

parallel-ssh "docker compose up -d" ::: $ALL_VMS
```

---

## 🧪 Testing & Validation Plan

### Pre-Deployment Tests (Simulation Phase)

#### Test 1: Key Generation
```bash
# Verify 3 unique keypairs generated
test_unique_keys() {
  assert_count_equals 3 $GENERATED_KEYS
  assert_all_unique $PUBLIC_KEYS
}
```

#### Test 2: Genesis Validation
```bash
# Verify genesis.json structure
test_genesis_structure() {
  assert_has_field "initial_producers"
  assert_producer_count_equals 3
  assert_keys_match $GENERATED_KEYS
}
```

#### Test 3: Network Connectivity
```bash
# Verify all VMs can reach each other
test_p2p_connectivity() {
  for src in $ALL_VMS; do
    for dst in $ALL_VMS; do
      if [ "$src" != "$dst" ]; then
        assert_tcp_reachable $src:9876 $dst
      fi
    done
  done
}
```

### Emulation Tests (Dry-Run Phase)

#### Emulation 1: Single Node Failure
```bash
# Simulate 1 producer offline (network should continue)
emulate_node_failure() {
  stop_node producer-c
  sleep 10
  assert_blocks_still_producing
  assert_finality_achieved  # 2/3 still online
}
```

#### Emulation 2: Consensus Conflict
```bash
# Simulate block production conflict
emulate_double_produce() {
  # Two producers try to produce same block number
  assert_conflict_resolution
  assert_canonical_chain_selected
}
```

#### Emulation 3: Network Partition
```bash
# Simulate network split (P2P disconnect)
emulate_network_partition() {
  partition_nodes [A] [B,C]
  sleep 30
  assert_majority_continues  # B,C should continue
  assert_minority_stalls     # A should stall
  
  heal_partition()
  sleep 10
  assert_chains_merged
}
```

### Post-Deployment Validation

#### Validation 1: Block Production
```bash
# All producers actively producing blocks
curl $VM1:8888/v1/chain/get_info | grep head_block_producer
curl $VM2:8888/v1/chain/get_info | grep head_block_producer
curl $VM3:8888/v1/chain/get_info | grep head_block_producer

# Expect rotation: producer-a → producer-b → producer-c → (repeat)
```

#### Validation 2: Consensus Finality
```bash
# Verify LIB progressing (blocks becoming irreversible)
watch_lib_progression() {
  for i in {1..30}; do
    LIB=$(curl -s $VM1:8888/v1/chain/get_info | jq -r .last_irreversible_block_num)
    echo "Block #$i: LIB=$LIB"
    assert_lib_increasing $LIB
    sleep 1
  done
}
```

#### Validation 3: P2P Connectivity
```bash
# Check connected peers on each node
for vm in $ALL_VMS; do
  PEERS=$(ssh $vm "docker exec proton-node curl -s http://localhost:8888/v1/net/connections" | jq 'length')
  assert_equals 2 $PEERS  # Each node should see 2 peers
done
```

---

## 📊 Error Prevention Strategy

### Common Errors & Mitigations

| Error Scenario | Prevention | Detection | Recovery |
|----------------|------------|-----------|----------|
| **Genesis Mismatch** | Use single genesis.json for all nodes | Check chain_id matches | Regenerate and redeploy |
| **Clock Skew** | Sync NTP on all VMs | Check block timestamps | Run `ntpdate` |
| **Port Conflict** | NSG rules pre-configured | Test port binding | Adjust firewall |
| **Key Duplication** | Unique key per producer | Hash collision check | Regenerate keys |
| **P2P Connection Fail** | Pre-test connectivity | Monitor peer count | Check firewall/IP |
| **Split Brain** | Majority consensus (2/3+1) | Monitor chain forks | Stop minority nodes |
| **Disk Full** | Monitor storage | Check available space | Prune old blocks |

### Simulation Framework

```bash
# Run full simulation before real deployment
./simulation/run_all_tests.sh

Tests:
  ✓ Key generation uniqueness
  ✓ Genesis validation
  ✓ Network connectivity matrix
  ✓ Producer schedule logic
  ✓ Consensus rules (2/3+1)
  ✓ Configuration validation

# Run emulation (docker-based mock network)
./emulation/start_local_network.sh

Emulation Environment:
  - 3 Docker containers on localhost
  - Same config as production
  - Simulate: failures, partitions, conflicts
  - Validate: recovery, finality, sync

# Dry-run on actual VMs (non-production)
./deploy.sh --dry-run --validate-only

Dry-Run Steps:
  1. Deploy VMs (test resource group)
  2. Install dependencies
  3. Generate keys
  4. Start network
  5. Run validation suite
  6. Destroy test environment
  7. Report results
```

---

## 🛠️ Implementation Checklist

### Phase 1: Planning ✅
- [x] Architecture design
- [x] Consensus mechanism selection
- [x] Network topology defined
- [x] Testing strategy documented

### Phase 2: Simulation Framework 📋
- [ ] Create key generation simulator
- [ ] Create genesis validator
- [ ] Create network connectivity tester
- [ ] Create producer schedule simulator
- [ ] Create consensus rule validator

### Phase 3: Emulation Framework 📋
- [ ] Docker-based local network
- [ ] 3-node emulation environment
- [ ] Failure scenario scripts
- [ ] Partition scenario scripts
- [ ] Conflict resolution tests

### Phase 4: Deployment Automation 📋
- [ ] Azure VM deployment script
- [ ] Multi-VM SSH orchestration
- [ ] Key generation automation
- [ ] Genesis distribution
- [ ] Parallel node startup
- [ ] Health check automation

### Phase 5: Validation Suite 📋
- [ ] Block production validator
- [ ] Consensus finality checker
- [ ] P2P connectivity monitor
- [ ] Producer rotation verifier
- [ ] Error detection system

### Phase 6: Documentation 📋
- [ ] AGENTIC_SETUP.md (deployment guide)
- [ ] README.md (overview)
- [ ] agent.md (technical reference)
- [ ] TROUBLESHOOTING.md
- [ ] .env.template (multi-node config)

---

## 📈 Success Criteria

Network considered **production-ready** when:

1. ✅ **All 3 producers online** and producing blocks
2. ✅ **Round-robin schedule working** (producer rotation visible)
3. ✅ **Consensus achieved** (LIB progressing, 2/3+1 confirmations)
4. ✅ **P2P mesh stable** (all nodes connected to all others)
5. ✅ **Fault tolerance proven** (network continues with 1 node down)
6. ✅ **No chain forks** (single canonical chain across all nodes)
7. ✅ **Simulation tests pass** (100% pass rate)
8. ✅ **Emulation tests pass** (failure recovery validated)
9. ✅ **Dry-run successful** (real VM deployment works end-to-end)

---

## 🔗 Dependencies

### From Experiment 01
- ✅ Docker-based deployment pattern
- ✅ Azure VM provisioning knowledge
- ✅ Proton v2.0.5 compatibility
- ✅ Key generation process
- ✅ Genesis.json structure
- ✅ RPC API validation

### New Requirements
- 🔄 Multi-VM coordination
- 🔄 P2P network configuration
- 🔄 Producer schedule management
- 🔄 Parallel deployment orchestration
- 🔄 Consensus monitoring tools

---

## 📚 References

- **EOSIO Developer Docs:** https://developers.eos.io/
- **Proton Blockchain:** https://github.com/XPRNetwork/core
- **EOSIO Consensus:** https://developers.eos.io/welcome/v2.1/protocol/consensus_protocol
- **DPoS-BFT:** https://medium.com/eosio/dpos-bft-pipelined-byzantine-fault-tolerance-8a0634a270ba
- **Experiment 01:** `/workspaces/XPR/proton-node/agentic_dev/experiment_01/`

---

**Next Steps:**
1. Build simulation framework → [SIMULATION_GUIDE.md](./simulation/README.md)
2. Build emulation environment → [EMULATION_GUIDE.md](./emulation/README.md)
3. Create deployment automation → [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
