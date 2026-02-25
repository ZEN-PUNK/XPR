# 🤖 Agentic Setup Guide - Multi-Node Consensus Network

**Purpose:** Deploy production-grade multi-validator Proton blockchain network  
**Target:** AI agents, developers, automated systems  
**Time:** 15-20 minutes (with testing phases)  
**Prerequisites:** Experiment 01 completed and understood

---

## 📋 Overview

This guide deploys a **3-node consensus network** with:

- ✅ **Multiple Block Producers** (3 validators running on separate Azure VMs)
- ✅ **Round-Robin Block Production** (producers rotate: A→B→C→repeat)
- ✅ **BFT Consensus** (2/3+1 validators must agree for finality)
- ✅ **P2P Mesh Network** (all nodes connected to each other)
- ✅ **Fault Tolerance** (network survives if 1 node fails)

**⚠️ Critical:** Follow all 3 testing phases before production deployment

---

## 🚀 Quick Start (3 Phases)

### Phase 1: Simulation Testing (2 minutes)
```bash
cd /workspaces/XPR/proton-node/agentic_dev/experiment_02

# Run pre-deployment simulation tests
cd simulation/
./run_all_tests.sh

# Expected: 6/6 tests pass
# If any fail, fix configuration before proceeding
```

### Phase 2: Local Emulation (10 minutes)
```bash
# Run local Docker emulation
cd ../emulation/
./run_emulation_tests.sh

# Expected: 4/4 tests pass
# Tests: normal operation, node failure, network partition
```

### Phase 3: Production Deployment (10 minutes)
```bash
# Configure environment
cd ..
cp .env.template .env
nano .env  # Add your Azure credentials

# Deploy to Azure
./deploy-multi-node.sh

# Validate deployment
./tests/validate_production.sh
```

---

## 📐 Architecture Deployed

```
Azure Resource Group: proton-consensus-network
├── VM 1: proton-producer-1
│   ├── IP: <VM_IP_1> (e.g., 20.81.200.10)
│   ├── Producer: producer-a
│   ├── Keys: <PUBKEY_A> / <PRIVKEY_A>
│   ├── RPC: 8888
│   └── P2P: 9876 → connects to VM2, VM3
│
├── VM 2: proton-producer-2
│   ├── IP: <VM_IP_2> (e.g., 20.81.200.11)
│   ├── Producer: producer-b
│   ├── Keys: <PUBKEY_B> / <PRIVKEY_B>
│   ├── RPC: 8888
│   └── P2P: 9876 → connects to VM1, VM3
│
└── VM 3: proton-producer-3
    ├── IP: <VM_IP_3> (e.g., 20.81.200.12)
    ├── Producer: producer-c
    ├── Keys: <PUBKEY_C> / <PRIVKEY_C>
    ├── RPC: 8888
    └── P2P: 9876 → connects to VM1, VM2

Network: Full P2P mesh (each node sees 2 peers)
Consensus: 2/3+1 = 3 validators required for finality
Block Time: 0.5 seconds per block
Producer Rotation: 12 blocks per producer, then rotate
```

---

## 🔧 Phase 1: Simulation Testing

**Purpose:** Validate configuration **before deploying any VMs**

### Step 1.1: Navigate to Simulation Directory

```bash
cd /workspaces/XPR/proton-node/agentic_dev/experiment_02/simulation
```

### Step 1.2: Run Simulation Test Suite

```bash
./run_all_tests.sh
```

**Tests Executed:**
1. **Key Generation** - Ensures 3 unique keypairs generated
2. **Genesis Validation** - Validates genesis.json structure with 3 producers
3. **Producer Schedule** - Simulates round-robin block production
4. **Network Connectivity** - Validates P2P mesh topology
5. **Consensus Rules** - Validates 2/3+1 BFT logic
6. **Configuration Files** - Checks all deployment configs

**Expected Output:**
```
🧪 Proton Multi-Node Consensus - Simulation Test Suite
======================================================

Running: Key Generation
✅ PASS: Key Generation

Running: Genesis Validation
✅ PASS: Genesis Validation

Running: Producer Schedule
✅ PASS: Producer Schedule

Running: Network Connectivity
✅ PASS: Network Connectivity

Running: Consensus Rules
✅ PASS: Consensus Rules

Running: Configuration Files
✅ PASS: Configuration Files

======================================================
Results: 6 passed, 0 failed

✅ ALL TESTS PASSED - Ready for emulation phase
```

**If Any Test Fails:**
1. Review test output for specific error
2. Fix configuration issue
3. Re-run `./run_all_tests.sh`
4. **Do not proceed** until 6/6 tests pass

---

## 🎭 Phase 2: Local Emulation Testing

**Purpose:** Test full multi-node network **locally in Docker** before Azure

### Step 2.1: Navigate to Emulation Directory

```bash
cd /workspaces/XPR/proton-node/agentic_dev/experiment_02/emulation
```

### Step 2.2: Prepare Emulation Environment

```bash
# Generate keys and genesis for emulation
./prepare_emulation.sh
```

**Output:**
```
Generating producer keys...
  Producer A: EOS6...A1 / 5K...XYZ
  Producer B: EOS6...B2 / 5K...ABC
  Producer C: EOS6...C3 / 5K...DEF

Creating genesis.json with 3 producers...
✅ Emulation environment ready
```

### Step 2.3: Run Emulation Test Suite

```bash
./run_emulation_tests.sh
```

**Tests Executed:**
1. **Normal Operation** - All 3 nodes producing blocks, rotating producers
2. **Single Node Failure** - Network continues with 2/3 validators online
3. **Majority Failure** - Network stalls with <2/3, resumes when majority restored
4. **Network Partition** - Majority partition continues, minority stalls, recovery works

**Expected Output:**
```
🎭 Proton Multi-Node Consensus - Emulation Test Suite
======================================================

========================================
Running: Normal Operation
========================================
Starting 3-node local network...
✅ Node 1 online: Block #50, Producer: producer-a
✅ Node 2 online: Block #50, Producer: producer-a
✅ Node 3 online: Block #50, Producer: producer-a
✅ Block production: 60 blocks/minute (expected)
✅ P2P connectivity: Each node sees 2 peers
✅ PASS: Normal Operation

========================================
Running: Single Node Failure
========================================
Stopping node 3 (producer-c)...
✅ Network continues with 2/3 validators
✅ Blocks still producing: +20 blocks in 10s
Restarting node 3...
✅ Node caught up (block difference: 35)
✅ PASS: Single Node Failure

========================================
Running: Majority Failure
========================================
Stopping nodes 2 & 3...
✅ Network correctly stalled (1/3 < consensus threshold)
Restarting node 2 (2/3 online)...
✅ Network resumed production
✅ PASS: Majority Failure

========================================
Running: Network Partition
========================================
Creating partition: [Node1] vs [Node2, Node3]...
✅ Majority partition (2/3) continues producing
✅ Minority partition (1/3) stalled
Healing partition...
✅ Nodes re-synced (block diff: 42)
✅ PASS: Network Partition

======================================================
Results: 4 passed, 0 failed

✅ ALL EMULATION TESTS PASSED - Ready for production deployment
```

**If Any Test Fails:**
1. Check Docker logs: `docker logs proton-node-1`
2. Review emulation test output
3. Fix issue (network, config, timing)
4. Re-run `./run_emulation_tests.sh`
5. **Do not proceed** until 4/4 tests pass

### Step 2.4: Cleanup Emulation Environment

```bash
./stop_local_network.sh
./cleanup.sh
```

---

## 🚀 Phase 3: Production Deployment

**Purpose:** Deploy to Azure with confidence (tests passed)

### Step 3.1: Configure Environment

```bash
cd /workspaces/XPR/proton-node/agentic_dev/experiment_02

# Copy template
cp .env.template .env

# Edit configuration
nano .env
```

**Required Variables:**
```bash
# Azure Configuration
AZURE_SUBSCRIPTION_ID="your-subscription-id"
RESOURCE_GROUP="proton-consensus-network"
LOCATION="eastus"

# VM Configuration (3 VMs required)
VM_SIZE="Standard_D2s_v3"
VM_USER="azureuser"
VM_IMAGE="Ubuntu2204"

# Network Configuration
NSG_NAME="proton-consensus-nsg"
VNET_NAME="proton-consensus-vnet"

# Will be auto-populated during deployment:
# VM_IP_1, VM_IP_2, VM_IP_3  (public IPs)
# PUBKEY_A, PUBKEY_B, PUBKEY_C  (auto-generated)
# PRIVKEY_A, PRIVKEY_B, PRIVKEY_C  (auto-generated)
```

### Step 3.2: Verify Azure Login

```bash
# Login to Azure CLI
az login

# Set subscription
az account set --subscription "$AZURE_SUBSCRIPTION_ID"

# Verify
az account show
```

### Step 3.3: Run Deployment Script

```bash
./deploy-multi-node.sh
```

**Deployment Steps:**
```
🚀 Proton Multi-Node Consensus Network Deployment
==================================================

[1/10] Creating resource group...
✅ Resource group: proton-consensus-network

[2/10] Creating virtual network...
✅ VNet: proton-consensus-vnet (10.0.0.0/16)

[3/10] Creating network security group...
✅ NSG: proton-consensus-nsg (ports 22, 8888, 9876)

[4/10] Generating producer keys...
✅ Producer A: EOS6iTz...XEqm / 5KDsY8S...yWde
✅ Producer B: EOS7kLm...QRst / 5KFgH9T...zAbc
✅ Producer C: EOS8pQr...UVwx / 5KJkL0U...xDef

[5/10] Creating genesis.json...
✅ Genesis with 3 producers configured

[6/10] Deploying VM 1 (proton-producer-1)...
✅ VM 1: 20.81.200.10

[7/10] Deploying VM 2 (proton-producer-2)...
✅ VM 2: 20.81.200.11

[8/10] Deploying VM 3 (proton-producer-3)...
✅ VM 3: 20.81.200.12

[9/10] Configuring nodes...
✅ Docker installed on all VMs
✅ Genesis distributed to all nodes
✅ Node configs deployed with P2P mesh

[10/10] Starting network (simultaneous startup)...
✅ Node 1 started
✅ Node 2 started
✅ Node 3 started

Waiting 30 seconds for network initialization...

🎉 DEPLOYMENT SUCCESSFUL!

Network Information:
  Node 1 RPC: http://20.81.200.10:8888
  Node 2 RPC: http://20.81.200.11:8888
  Node 3 RPC: http://20.81.200.12:8888

Producer Keys (SAVE THESE SECURELY):
  Producer A: EOS6iTz...XEqm
  Producer B: EOS7kLm...QRst
  Producer C: EOS8pQr...UVwx

Chain ID: c0721ead...97923b3

Next: Run validation tests
  ./tests/validate_production.sh
```

### Step 3.4: Validate Production Deployment

```bash
./tests/validate_production.sh
```

**Validation Checks:**
```
🔍 Production Validation Suite
=================================

✓ All 3 VMs reachable via SSH
✓ All 3 RPC endpoints responding
✓ Block production active (blocks advancing)
✓ Producer rotation working (A→B→C→A)
✓ Consensus achieved (LIB progressing)
✓ P2P mesh connected (each node sees 2 peers)
✓ No chain forks (all nodes on same chain)
✓ Chain ID matches across all nodes

=================================
✅ ALL VALIDATIONS PASSED
Network is production-ready!
```

---

## 📊 Monitoring Your Network

### Check Block Production

```bash
# Node 1
curl http://20.81.200.10:8888/v1/chain/get_info | jq '{block: .head_block_num, producer: .head_block_producer, lib: .last_irreversible_block_num}'

# Node 2
curl http://20.81.200.11:8888/v1/chain/get_info | jq '{block: .head_block_num, producer: .head_block_producer, lib: .last_irreversible_block_num}'

# Node 3
curl http://20.81.200.12:8888/v1/chain/get_info | jq '{block: .head_block_num, producer: .head_block_producer, lib: .last_irreversible_block_num}'
```

**Expected Output (should match across all nodes):**
```json
{
  "block": 1523,
  "producer": "producer-b",
  "lib": 1512
}
```

### Check P2P Connectivity

```bash
# Check peers on Node 1
ssh azureuser@20.81.200.10 'docker exec proton-testnet curl -s http://localhost:8888/v1/net/connections | jq "length"'

# Expected: 2 (connected to nodes 2 & 3)
```

### Monitor Producer Rotation

```bash
# Watch producer rotation in real-time
watch -n 2 'curl -s http://20.81.200.10:8888/v1/chain/get_info | jq -r ".head_block_producer"'

# You should see: producer-a → producer-b → producer-c → (repeat)
```

---

## 🔍 Troubleshooting

### Issue: Nodes not producing blocks

**Check:**
```bash
ssh azureuser@<VM_IP> 'docker logs proton-testnet --tail 50'
```

**Look for:**
- "Produced block" messages (should appear regularly)
- P2P connection errors
- Clock skew issues

**Fix:**
- Ensure all VMs have synchronized time: `sudo ntpdate pool.ntp.org`
- Check firewall rules allow port 9876
- Verify genesis.json identical on all nodes

### Issue: Nodes have different block numbers

**Check Chain ID:**
```bash
# All nodes should have same chain_id
curl http://20.81.200.10:8888/v1/chain/get_info | jq -r .chain_id
curl http://20.81.200.11:8888/v1/chain/get_info | jq -r .chain_id
curl http://20.81.200.12:8888/v1/chain/get_info | jq -r .chain_id
```

**If different:**
- Genesis mismatch - redeploy with same genesis.json

### Issue: P2P peers not connecting

**Test connectivity:**
```bash
# From VM1, test connection to VM2
ssh azureuser@20.81.200.10 'nc -zv 20.81.200.11 9876'
```

**Fix:**
- Check NSG rules allow inbound 9876
- Verify P2P peer addresses in docker-compose
- Check for IP address typos

---

## 🎓 What You Learned

After completing this experiment:

1. ✅ **Multi-Node Deployment** - Orchestrating multiple VMs
2. ✅ **Consensus Algorithms** - BFT consensus in practice
3. ✅ **P2P Networking** - Full mesh topology configuration
4. ✅ **Testing Methodologies** - Simulation → Emulation → Production
5. ✅ **Fault Tolerance** - Network resilience to failures
6. ✅ **Block Production Scheduling** - Round-robin producer rotation

---

## 📚 Next Steps

### Expand the Network
```bash
# Add more producers (odd numbers recommended: 5, 7, 21)
./deploy-multi-node.sh --producers 5
```

### Test Failure Scenarios
```bash
# Simulate node failure in production
./tests/test_node_failure.sh proton-producer-1
```

### Upgrade to Mainnet Sync
**Future Experiment 03:** Connect to Proton mainnet v5.x

---

## 🔗 References

- **Architecture:** [ARCHITECTURE_PLAN.md](./ARCHITECTURE_PLAN.md)
- **Simulation:** [simulation/README.md](./simulation/README.md)
- **Emulation:** [emulation/README.md](./emulation/README.md)
- **Experiment 01:** [../experiment_01/AGENTIC_SETUP.md](../experiment_01/AGENTIC_SETUP.md)

---

**Status Checklist:**

- [ ] Phase 1: Simulation tests passed (6/6)
- [ ] Phase 2: Emulation tests passed (4/4)
- [ ] Phase 3: VMs deployed to Azure
- [ ] Phase 3: All nodes producing blocks
- [ ] Phase 3: Producer rotation verified
- [ ] Phase 3: Consensus finality achieved
- [ ] Phase 3: P2P mesh fully connected

**When all checked:** ✅ Your multi-node consensus network is live!
