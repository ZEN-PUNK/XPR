#!/bin/bash
# Proton Development Node - One-Command Setup  
# Deploys a standalone Proton v2.0.5 RPC node for development and testing
# Note: This node runs in standalone mode and does not sync with external networks
#
# Usage: ./quick-setup.sh <VM_IP> <SSH_KEY_PATH> [VM_USER]
#
# Example: ./quick-setup.sh 20.81.200.166 ~/.ssh/my-key.pem azureuser
#
# Prerequisites:
# - Fresh Ubuntu VM (18.04-22.04)
# - SSH access with private key
# - VM has internet access

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
if [ $# -lt 2 ]; then
    echo -e "${RED}Usage: $0 <VM_IP> <SSH_KEY_PATH> [VM_USER]${NC}"
    echo ""
    echo "Example:"
    echo "  $0 20.81.200.166 ~/.ssh/proton-key.pem azureuser"
    echo ""
    exit 1
fi

VM_IP="$1"
SSH_KEY="$2"
VM_USER="${3:-azureuser}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Proton Development Node - Automated Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Configuration:"
echo "  VM IP:    $VM_IP"
echo "  SSH Key:  $SSH_KEY"
echo "  Username: $VM_USER"
echo ""

# Validate SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}Error: SSH key not found at $SSH_KEY${NC}"
    exit 1
fi

# Set correct permissions on SSH key
echo -e "${YELLOW}[1/8] Setting SSH key permissions...${NC}"
chmod 600 "$SSH_KEY"

# Test SSH connection
echo -e "${YELLOW}[2/8] Testing SSH connection...${NC}"
if ! ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$VM_USER@$VM_IP" 'echo "Connection OK"' > /dev/null 2>&1; then
    echo -e "${RED}Error: Cannot connect to VM${NC}"
    echo "Please check:"
    echo "  - VM IP is correct: $VM_IP"
    echo "  - SSH key is correct: $SSH_KEY"
    echo "  - VM username is correct: $VM_USER"
    echo "  - VM allows SSH connections (port 22 open)"
    exit 1
fi
echo -e "${GREEN}✓ SSH connection successful${NC}"

# Update VM packages
echo -e "${YELLOW}[3/8] Updating VM packages...${NC}"
ssh -i "$SSH_KEY" "$VM_USER@$VM_IP" 'sudo apt update -qq && sudo apt upgrade -y -qq' || {
    echo -e "${RED}Error: Failed to update packages${NC}"
    exit 1
}
echo -e "${GREEN}✓ Packages updated${NC}"

# Check memory and add swap if needed
echo -e "${YELLOW}[4/8] Checking memory and adding swap if needed...${NC}"
MEM_MB=$(ssh -i "$SSH_KEY" "$VM_USER@$VM_IP" "free -m | awk '/^Mem:/ {print \$2}'")
if [ "$MEM_MB" -lt 2048 ]; then
    echo "  Memory: ${MEM_MB}MB (adding 4GB swap)"
    ssh -i "$SSH_KEY" "$VM_USER@$VM_IP" '
        if [ ! -f /swapfile ]; then
            sudo fallocate -l 4G /swapfile &&
            sudo chmod 600 /swapfile &&
            sudo mkswap /swapfile &&
            sudo swapon /swapfile &&
            echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab
        fi
    ' || {
        echo -e "${RED}Error: Failed to create swap${NC}"
        exit 1
    }
    echo -e "${GREEN}✓ 4GB swap added${NC}"
else
    echo -e "${GREEN}✓ Memory OK: ${MEM_MB}MB${NC}"
fi

# Install Docker
echo -e "${YELLOW}[5/8] Installing Docker...${NC}"
ssh -i "$SSH_KEY" "$VM_USER@$VM_IP" '
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com | sudo sh &&
        sudo usermod -aG docker $USER
    fi
' || {
    echo -e "${RED}Error: Failed to install Docker${NC}"
    exit 1
}
echo -e "${GREEN}✓ Docker installed${NC}"

# Create directory and Docker Compose file
echo -e "${YELLOW}[6/8] Creating node configuration...${NC}"
ssh -i "$SSH_KEY" "$VM_USER@$VM_IP" 'mkdir -p ~/proton-node && cat > ~/proton-node/docker-compose-v2.yml << "EOF"
version: "3.8"

services:
  proton-testnet:
    image: ubuntu:18.04
    container_name: proton-testnet
    ports:
      - "8888:8888"
      - "9876:9876"
    volumes:
      - ./data:/root/.local/share/eosio/nodeos/data
      - ./config:/root/.local/share/eosio/nodeos/config
    command: >
      /bin/bash -c "
      apt-get update &&
      apt-get install -y wget curl &&
      wget https://github.com/XPRNetwork/core/releases/download/v2.0.5/proton_2.0.5-1-ubuntu-18.04_amd64.deb -O /tmp/proton.deb &&
      apt-get install -y /tmp/proton.deb &&
      echo Starting Proton development node - standalone RPC server &&
      nodeos --data-dir=/root/.local/share/eosio/nodeos/data --config-dir=/root/.local/share/eosio/nodeos/config --http-server-address=0.0.0.0:8888 --p2p-listen-endpoint=0.0.0.0:9876 --plugin=eosio::chain_plugin --plugin=eosio::chain_api_plugin --plugin=eosio::http_plugin --plugin=eosio::net_plugin --plugin=eosio::net_api_plugin --access-control-allow-origin=* --http-validate-host=false --verbose-http-errors --max-clients=25 --contracts-console
      "
EOF
' || {
    echo -e "${RED}Error: Failed to create configuration${NC}"
    exit 1
}
echo -e "${GREEN}✓ Configuration created${NC}"

# Start the node
echo -e "${YELLOW}[7/8] Starting Proton development node...${NC}"
ssh -i "$SSH_KEY" "$VM_USER@$VM_IP" '
    cd ~/proton-node &&
    sudo rm -rf data/* 2>/dev/null || true &&
    docker compose -f docker-compose-v2.yml up -d
' || {
    echo -e "${RED}Error: Failed to start node${NC}"
    exit 1
}
echo -e "${GREEN}✓ Node container started${NC}"

# Wait and verify
echo -e "${YELLOW}[8/8] Waiting for node initialization (60 seconds)...${NC}"
sleep 60

echo ""
echo -e "${YELLOW}Verifying node status...${NC}"

# Check if HTTP plugin started
if ssh -i "$SSH_KEY" "$VM_USER@$VM_IP" 'docker logs proton-testnet 2>&1 | grep -q "start listening for http"'; then
    echo -e "${GREEN}✓ HTTP plugin started${NC}"
else
    echo -e "${RED}✗ HTTP plugin not started${NC}"
    echo "Check logs: ssh -i $SSH_KEY $VM_USER@$VM_IP 'docker logs proton-testnet'"
fi

# Test RPC endpoint
echo -e "${YELLOW}Testing RPC endpoint...${NC}"
RPC_RESPONSE=$(ssh -i "$SSH_KEY" "$VM_USER@$VM_IP" 'curl -s -w "\n%{http_code}" http://localhost:8888/v1/chain/get_info')
HTTP_CODE=$(echo "$RPC_RESPONSE" | tail -1)
JSON_OUTPUT=$(echo "$RPC_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ RPC endpoint responding${NC}"
    
    # Extract key info
    SERVER_VERSION=$(echo "$JSON_OUTPUT" | python3 -c "import sys, json; print(json.load(sys.stdin).get('server_version_string', 'N/A'))" 2>/dev/null || echo "N/A")
    CHAIN_ID=$(echo "$JSON_OUTPUT" | python3 -c "import sys, json; print(json.load(sys.stdin).get('chain_id', 'N/A'))" 2>/dev/null || echo "N/A")
    HEAD_BLOCK=$(echo "$JSON_OUTPUT" | python3 -c "import sys, json; print(json.load(sys.stdin).get('head_block_num', 'N/A'))" 2>/dev/null || echo "N/A")
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ SETUP SUCCESSFUL!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Node Type: Standalone Development Node (Proton v2.0.5)"
    echo "Note: This node runs independently and does not sync with external networks."
    echo "      Perfect for local development, testing, and learning."
    echo ""
    echo "Node Information:"
    echo "  Version:      $SERVER_VERSION"
    echo "  Chain ID:     $CHAIN_ID"
    echo "  Head Block:   $HEAD_BLOCK"
    echo ""
    echo "RPC Endpoint:"
    echo "  URL:          http://$VM_IP:8888"
    echo "  Test:         curl http://$VM_IP:8888/v1/chain/get_info"
    echo ""
    echo "Management Commands:"
    echo "  View logs:    ssh -i $SSH_KEY $VM_USER@$VM_IP 'docker logs proton-testnet'"
    echo "  Restart:      ssh -i $SSH_KEY $VM_USER@$VM_IP 'cd ~/proton-node && docker compose -f docker-compose-v2.yml restart'"
    echo "  Stop:         ssh -i $SSH_KEY $VM_USER@$VM_IP 'cd ~/proton-node && docker compose -f docker-compose-v2.yml down'"
    echo ""
else
    echo -e "${RED}✗ RPC endpoint not responding (HTTP code: $HTTP_CODE)${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check logs: ssh -i $SSH_KEY $VM_USER@$VM_IP 'docker logs proton-testnet | tail -50'"
    echo "  2. Check if port 8888 is listening: ssh -i $SSH_KEY $VM_USER@$VM_IP 'docker exec proton-testnet netstat -tlnp | grep 8888'"
    echo "  3. See full documentation: /workspaces/XPR/proton-node/agentic_dev/agent.md"
    exit 1
fi
