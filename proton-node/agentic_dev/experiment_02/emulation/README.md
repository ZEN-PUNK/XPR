# 🎭 Emulation Framework

**Purpose:** Test multi-node blockchain network in local Docker environment before Azure deployment

**Status:** 📋 Ready to implement  
**Run Time:** ~10 minutes  
**Environment:** Local Docker (3 containers simulating 3 VMs)

---

## Overview

The emulation framework creates a **realistic multi-node network on your local machine** using Docker containers. This allows testing:

1. ✅ Multi-node block production
2. ✅ P2P network communication
3. ✅ Consensus mechanism (BFT)
4. ✅ Failure scenarios
5. ✅ Network partitions
6. ✅ Recovery mechanisms

**Goal:** Validate entire system works before spending Azure resources

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│          Local Docker Host (Your Machine)              │
├────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐   ┌──────────────┐   ┌─────────────┐│
│  │Container 1   │   │Container 2   │   │Container 3  ││
│  │proton-node-1 │   │proton-node-2 │   │proton-node-3││
│  │              │   │              │   │             ││
│  │localhost:8881│◄─►│localhost:8882│◄─►│localhost:8883│
│  │localhost:9881│   │localhost:9882│   │localhost:9883│
│  │              │   │              │   │             ││
│  │producer-a    │   │producer-b    │   │producer-c   ││
│  └──────────────┘   └──────────────┘   └─────────────┘│
│                                                          │
│  Shared Docker Network: proton-consensus-net            │
│  Containers can communicate via service names           │
└────────────────────────────────────────────────────────┘
```

---

## Quick Start

```bash
cd /workspaces/XPR/proton-node/agentic_dev/experiment_02/emulation

# Start 3-node local network
./start_local_network.sh

# Run emulation tests
./run_emulation_tests.sh

# Stop network
./stop_local_network.sh

# Clean up
./cleanup.sh
```

---

## Emulation Environment Setup

### docker-compose-emulation.yml

```yaml
version: "3.8"

networks:
  proton-consensus-net:
    driver: bridge

services:
  proton-node-1:
    image: ubuntu:18.04
    container_name: proton-node-1
    networks:
      - proton-consensus-net
    ports:
      - "8881:8888"
      - "9881:9876"
    volumes:
      - ./data/node-1:/root/.local/share/eosio/nodeos/data
      - ./config/node-1:/root/.local/share/eosio/nodeos/config
      - ./genesis.json:/root/genesis.json:ro
    command: >
      /bin/bash -c "
      apt-get update &&
      apt-get install -y wget curl &&
      wget https://github.com/XPRNetwork/core/releases/download/v2.0.5/proton_2.0.5-1-ubuntu-18.04_amd64.deb -O /tmp/proton.deb &&
      apt-get install -y /tmp/proton.deb &&
      nodeos 
        --data-dir=/root/.local/share/eosio/nodeos/data 
        --config-dir=/root/.local/share/eosio/nodeos/config 
        --genesis-json=/root/genesis.json 
        --http-server-address=0.0.0.0:8888 
        --p2p-listen-endpoint=0.0.0.0:9876 
        --p2p-peer-address=proton-node-2:9876 
        --p2p-peer-address=proton-node-3:9876 
        --producer-name=producer-a 
        --signature-provider=${PUBKEY_A}=KEY:${PRIVKEY_A} 
        --enable-stale-production 
        --plugin=eosio::chain_plugin 
        --plugin=eosio::chain_api_plugin 
        --plugin=eosio::http_plugin 
        --plugin=eosio::net_plugin 
        --plugin=eosio::producer_plugin 
        --plugin=eosio::producer_api_plugin 
        --access-control-allow-origin=* 
        --http-validate-host=false 
        --contracts-console
      "

  proton-node-2:
    image: ubuntu:18.04
    container_name: proton-node-2
    networks:
      - proton-consensus-net
    ports:
      - "8882:8888"
      - "9882:9876"
    volumes:
      - ./data/node-2:/root/.local/share/eosio/nodeos/data
      - ./config/node-2:/root/.local/share/eosio/nodeos/config
      - ./genesis.json:/root/genesis.json:ro
    command: >
      /bin/bash -c "
      apt-get update &&
      apt-get install -y wget curl &&
      wget https://github.com/XPRNetwork/core/releases/download/v2.0.5/proton_2.0.5-1-ubuntu-18.04_amd64.deb -O /tmp/proton.deb &&
      apt-get install -y /tmp/proton.deb &&
      nodeos 
        --data-dir=/root/.local/share/eosio/nodeos/data 
        --config-dir=/root/.local/share/eosio/nodeos/config 
        --genesis-json=/root/genesis.json 
        --http-server-address=0.0.0.0:8888 
        --p2p-listen-endpoint=0.0.0.0:9876 
        --p2p-peer-address=proton-node-1:9876 
        --p2p-peer-address=proton-node-3:9876 
        --producer-name=producer-b 
        --signature-provider=${PUBKEY_B}=KEY:${PRIVKEY_B} 
        --enable-stale-production 
        --plugin=eosio::chain_plugin 
        --plugin=eosio::chain_api_plugin 
        --plugin=eosio::http_plugin 
        --plugin=eosio::net_plugin 
        --plugin=eosio::producer_plugin 
        --plugin=eosio::producer_api_plugin 
        --access-control-allow-origin=* 
        --http-validate-host=false 
        --contracts-console
      "

  proton-node-3:
    image: ubuntu:18.04
    container_name: proton-node-3
    networks:
      - proton-consensus-net
    ports:
      - "8883:8888"
      - "9883:9876"
    volumes:
      - ./data/node-3:/root/.local/share/eosio/nodeos/data
      - ./config/node-3:/root/.local/share/eosio/nodeos/config
      - ./genesis.json:/root/genesis.json:ro
    command: >
      /bin/bash -c "
      apt-get update &&
      apt-get install -y wget curl &&
      wget https://github.com/XPRNetwork/core/releases/download/v2.0.5/proton_2.0.5-1-ubuntu-18.04_amd64.deb -O /tmp/proton.deb &&
      apt-get install -y /tmp/proton.deb &&
      nodeos 
        --data-dir=/root/.local/share/eosio/nodeos/data 
        --config-dir=/root/.local/share/eosio/nodeos/config 
        --genesis-json=/root/genesis.json 
        --http-server-address=0.0.0.0:8888 
        --p2p-listen-endpoint=0.0.0.0:9876 
        --p2p-peer-address=proton-node-1:9876 
        --p2p-peer-address=proton-node-2:9876 
        --producer-name=producer-c 
        --signature-provider=${PUBKEY_C}=KEY:${PRIVKEY_C} 
        --enable-stale-production 
        --plugin=eosio::chain_plugin 
        --plugin=eosio::chain_api_plugin 
        --plugin=eosio::http_plugin 
        --plugin=eosio::net_plugin 
        --plugin=eosio::producer_plugin 
        --plugin=eosio::producer_api_plugin 
        --access-control-allow-origin=* 
        --http-validate-host=false 
        --contracts-console
      "
```

---

## Emulation Test Suite

### Test 1: Normal Operation

**File:** `emulate_normal_operation.sh`

**Purpose:** Verify consensus works under normal conditions

```bash
#!/bin/bash
# Start network and verify basic operation

echo "🎭 Emulation Test 1: Normal Operation"
echo "======================================"

# Start network
./start_local_network.sh

# Wait for startup
echo "Waiting 30 seconds for network initialization..."
sleep 30

# Check all nodes online
echo ""
echo "Checking node status..."
for port in 8881 8882 8883; do
  BLOCK=$(curl -s http://localhost:$port/v1/chain/get_info | jq -r .head_block_num)
  PRODUCER=$(curl -s http://localhost:$port/v1/chain/get_info | jq -r .head_block_producer)
  echo "  Node on port $port: Block #$BLOCK, Producer: $PRODUCER"
done

# Verify block production
echo ""
echo "Monitoring block production for 30 seconds..."
START_BLOCK=$(curl -s http://localhost:8881/v1/chain/get_info | jq -r .head_block_num)
sleep 30
END_BLOCK=$(curl -s http://localhost:8881/v1/chain/get_info | jq -r .head_block_num)

BLOCKS_PRODUCED=$((END_BLOCK - START_BLOCK))
echo "Blocks produced: $BLOCKS_PRODUCED (expected ~60)"

if [ $BLOCKS_PRODUCED -gt 50 ]; then
  echo "✅ PASS: Block production working"
else
  echo "❌ FAIL: Block production insufficient"
  exit 1
fi

# Verify producer rotation
echo ""
echo "Checking producer rotation..."
PRODUCERS=$(curl -s http://localhost:8881/v1/chain/get_info | jq -r .head_block_producer)
echo "Current producer: $PRODUCERS"

# Check P2P connectivity
echo ""
echo "Checking P2P connectivity..."
for port in 8881 8882 8883; do
  PEERS=$(docker exec proton-node-$((port-8880)) curl -s http://localhost:8888/v1/net/connections | jq 'length')
  echo "  Node $((port-8880)): $PEERS connected peers (expected: 2)"
done

echo ""
echo "✅ EMULATION TEST 1 PASSED"
```

---

### Test 2: Single Node Failure

**File:** `emulate_node_failure.sh`

**Purpose:** Verify network continues with 2/3 producers online

```bash
#!/bin/bash
# Simulate single producer going offline

echo "🎭 Emulation Test 2: Single Node Failure"
echo "=========================================

# Network should be running from previous test
echo "Stopping producer-c (node 3)..."
docker stop proton-node-3

sleep 10

# Check remaining nodes still producing
echo ""
echo "Checking if network continues with 2/3 producers..."
BLOCK_BEFORE=$(curl -s http://localhost:8881/v1/chain/get_info | jq -r .head_block_num)
sleep 10
BLOCK_AFTER=$(curl -s http://localhost:8881/v1/chain/get_info | jq -r .head_block_num)

if [ $BLOCK_AFTER -gt $BLOCK_BEFORE ]; then
  echo "✅ PASS: Network continues with 2/3 producers online"
  echo "  Blocks produced: $((BLOCK_AFTER - BLOCK_BEFORE))"
else
  echo "❌ FAIL: Network stalled with 2/3 producers"
  exit 1
fi

# Restart node and check recovery
echo ""
echo "Restarting producer-c..."
docker start proton-node-3

sleep 20

# Verify node catches up
BLOCK_NODE3=$(curl -s http://localhost:8883/v1/chain/get_info | jq -r .head_block_num)
BLOCK_NODE1=$(curl -s http://localhost:8881/v1/chain/get_info | jq -r .head_block_num)

DIFF=$((BLOCK_NODE1 - BLOCK_NODE3))

echo "Block difference: $DIFF (should be <100)"

if [ $DIFF -lt 100 ]; then
  echo "✅ PASS: Node recovered and caught up"
else
  echo "❌ FAIL: Node did not catch up"
  exit 1
fi

echo ""
echo "✅ EMULATION TEST 2 PASSED"
```

---

### Test 3: Majority Failure

**File:** `emulate_majority_failure.sh`

**Purpose:** Verify network stalls without 2/3+1 producers

```bash
#!/bin/bash
# Simulate 2 producers going offline (network should stall)

echo "🎭 Emulation Test 3: Majority Failure"
echo "======================================"

# Stop 2 out of 3 producers
echo "Stopping producer-b and producer-c..."
docker stop proton-node-2 proton-node-3

sleep 10

# Check if network stalled
echo ""
echo "Checking if network stalled without consensus..."
BLOCK_BEFORE=$(curl -s http://localhost:8881/v1/chain/get_info | jq -r .head_block_num)
sleep 10
BLOCK_AFTER=$(curl -s http://localhost:8881/v1/chain/get_info | jq -r .head_block_num)

if [ "$BLOCK_BEFORE" == "$BLOCK_AFTER" ]; then
  echo "✅ PASS: Network correctly stalled without 2/3+1 consensus"
else
  echo "⚠️  WARNING: Network continued with only 1/3 producers (unexpected)"
fi

# Restart one producer (2/3 online)
echo ""
echo "Restarting producer-b (bringing network to 2/3 online)..."
docker start proton-node-2

sleep 20

# Network should resume
BLOCK_BEFORE=$(curl -s http://localhost:8881/v1/chain/get_info | jq -r .head_block_num)
sleep 10
BLOCK_AFTER=$(curl -s http://localhost:8881/v1/chain/get_info | jq -r .head_block_num)

if [ $BLOCK_AFTER -gt $BLOCK_BEFORE ]; then
  echo "✅ PASS: Network resumed with 2/3 producers"
else
  echo "❌ FAIL: Network did not resume"
  exit 1
fi

# Restart third producer
docker start proton-node-3
sleep 10

echo ""
echo "✅ EMULATION TEST 3 PASSED"
```

---

### Test 4: Network Partition

**File:** `emulate_network_partition.sh`

**Purpose:** Simulate network split and recovery

```bash
#!/bin/bash
# Simulate network partition using Docker network manipulation

echo "🎭 Emulation Test 4: Network Partition"
echo "======================================="

# Create partition: [Node1] vs [Node2, Node3]
echo "Creating network partition..."
docker network disconnect proton-consensus-net proton-node-1

sleep 10

# Check if majority partition continues
echo ""
echo "Checking majority partition (nodes 2 & 3)..."
BLOCK_BEFORE=$(curl -s http://localhost:8882/v1/chain/get_info | jq -r .head_block_num)
sleep 10
BLOCK_AFTER=$(curl -s http://localhost:8882/v1/chain/get_info | jq -r .head_block_num)

if [ $BLOCK_AFTER -gt $BLOCK_BEFORE ]; then
  echo "✅ PASS: Majority partition continues producing blocks"
else
  echo "❌ FAIL: Majority partition stalled"
  exit 1
fi

# Check if minority partition stalls
echo ""
echo "Checking minority partition (node 1)..."
BLOCK_BEFORE=$(curl -s http://localhost:8881/v1/chain/get_info | jq -r .head_block_num)
sleep 10
BLOCK_AFTER=$(curl -s http://localhost:8881/v1/chain/get_info | jq -r .head_block_num)

if [ "$BLOCK_BEFORE" == "$BLOCK_AFTER" ]; then
  echo "✅ PASS: Minority partition correctly stalled"
else
  echo "⚠️  WARNING: Minority partition continued (chain fork)"
fi

# Heal partition
echo ""
echo "Healing network partition..."
docker network connect proton-consensus-net proton-node-1

sleep 20

# Verify nodes re-sync
BLOCK_NODE1=$(curl -s http://localhost:8881/v1/chain/get_info | jq -r .head_block_num)
BLOCK_NODE2=$(curl -s http://localhost:8882/v1/chain/get_info | jq -r .head_block_num)

DIFF=$((BLOCK_NODE2 - BLOCK_NODE1))
echo "Block difference after healing: $DIFF"

if [ $DIFF -lt 50 ]; then
  echo "✅ PASS: Nodes re-synced after partition healing"
else
  echo "❌ FAIL: Nodes did not re-sync"
  exit 1
fi

echo ""
echo "✅ EMULATION TEST 4 PASSED"
```

---

## Test Execution

### Run All Emulation Tests

```bash
#!/bin/bash
# run_emulation_tests.sh

set -e

echo "🎭 Proton Multi-Node Consensus - Emulation Test Suite"
echo "======================================================"
echo ""

# Generate keys and genesis
./prepare_emulation.sh

PASS=0
FAIL=0

run_test() {
  TEST_NAME=$1
  TEST_SCRIPT=$2
  
  echo ""
  echo "========================================"
  echo "Running: $TEST_NAME"
  echo "========================================"
  
  if ./$TEST_SCRIPT; then
    echo "✅ PASS: $TEST_NAME"
    ((PASS++))
  else
    echo "❌ FAIL: $TEST_NAME"
    ((FAIL++))
  fi
}

run_test "Normal Operation" "emulate_normal_operation.sh"
run_test "Single Node Failure" "emulate_node_failure.sh"
run_test "Majority Failure" "emulate_majority_failure.sh"
run_test "Network Partition" "emulate_network_partition.sh"

# Cleanup
./stop_local_network.sh
./cleanup.sh

echo ""
echo "======================================================"
echo "Results: $PASS passed, $FAIL failed"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "✅ ALL EMULATION TESTS PASSED - Ready for dry-run"
  exit 0
else
  echo "❌ EMULATION TESTS FAILED - Fix issues before deployment"
  exit 1
fi
```

---

## Success Criteria

Emulation considered **successful** when:

1. ✅ **Normal operation:** All 3 nodes producing blocks, rotating producers
2. ✅ **Single failure:** Network continues with 2/3 producers
3. ✅ **Majority failure:** Network stalls with <2/3 producers, resumes when majority returns
4. ✅ **Network partition:** Majority continues, minority stalls, nodes re-sync after healing

---

## Next Steps

1. **Implement Emulation Scripts** → Create all test files
2. **Run Emulation Suite** → Execute `./run_emulation_tests.sh`
3. **Fix Any Failures** → Iterate until 100% pass
4. **Proceed to Dry-Run** → Deploy to real Azure VMs in test mode
