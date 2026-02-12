#!/bin/bash
# Fully automated Proton testnet account creation
# Installs all dependencies and creates account

set -e

ACCOUNT_NAME="${1}"
EMAIL="${2}"
DISPLAY_NAME="${3:-AI Agent}"

# Generate creative email if not provided
if [ -z "$EMAIL" ]; then
    # Use account name in email for uniqueness
    DOMAINS=("gmail.com" "outlook.com" "protonmail.com" "yahoo.com" "icloud.com")
    RANDOM_DOMAIN=${DOMAINS[$RANDOM % ${#DOMAINS[@]}]}
    EMAIL="${ACCOUNT_NAME}@${RANDOM_DOMAIN}"
    echo "ℹ️  Auto-generated email: $EMAIL"
fi

if [ -z "$ACCOUNT_NAME" ]; then
    echo "❌ Error: Account name required"
    echo ""
    echo "Usage: $0 <account_name> [email] [display_name]"
    echo ""
    echo "Example:"
    echo "  $0 myagent001 agent@moltbook.com \"My Agent\""
    echo ""
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🤖 Proton Testnet Account Creation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Account: $ACCOUNT_NAME"
echo "Email: $EMAIL"
echo "Display: $DISPLAY_NAME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Install expect if needed
echo "📦 Step 1/4: Checking dependencies..."
if ! command -v expect &> /dev/null; then
    echo "   Installing expect..."
    sudo apt-get update -qq && sudo apt-get install -y expect > /dev/null 2>&1
    echo "   ✅ expect installed"
else
    echo "   ✅ expect already installed"
fi

# Step 2: Install Proton CLI if needed
echo ""
echo "📦 Step 2/4: Checking Proton CLI..."
PROTON_CLI_DIR="/workspaces/XPR/proton-cli"

if [ ! -d "$PROTON_CLI_DIR" ]; then
    echo "   Installing Proton CLI..."
    mkdir -p /workspaces/XPR
    cd /workspaces/XPR
    git clone https://github.com/ProtonProtocol/proton-cli.git > /dev/null 2>&1
    cd proton-cli
    npm install > /dev/null 2>&1
    echo "   ✅ Proton CLI installed"
else
    echo "   ✅ Proton CLI already installed"
fi

# Step 3: Set network to testnet
echo ""
echo "🔧 Step 3/4: Configuring network..."
cd "$PROTON_CLI_DIR"
./bin/run chain:set proton-test > /dev/null 2>&1
echo "   ✅ Network set to proton-test"

# Check if expect is available
if ! command -v expect &> /dev/null; then
    echo "⚠️  'expect' not installed, using interactive mode"
    echo ""
    echo "Please enter the following when prompted:"
    echo "  1. Private key: $PRIVATE_KEY"
    echo "  2. Email: $EMAIL"
    echo "  3. Display name: $DISPLAY_NAME"
    echo "  4. Password encryption: no"
    echo "  5. Verification code: (check your email)"
    echo ""
    ./bin/run account:create $ACCOUNT_NAME
    exit $?
fi

# Step 4: Create account
echo ""
echo "🚀 Step 4/4: Creating account..."
echo "   ℹ️  Testnet verification code: 000000 (hardcoded)"
echo ""

# Use expect to automate prompts
expect <<EOF
set timeout 90
log_user 1

spawn $PROTON_CLI_DIR/bin/run account:create $ACCOUNT_NAME

# Leave private key empty - let it generate a new one
expect "*Enter private key*"
send "\r"

# Wait for key generation output
expect "*private*"

# Answer encryption question
expect "*encrypt*password*"
send "no\r"

# Provide email
expect "*Enter email*"
send "$EMAIL\r"

# Provide display name
expect "*Enter display name*"
send "$DISPLAY_NAME\r"

# Provide verification code
expect "*verification code*"
send "000000\r"

# Wait for result
expect {
    "*successfully created*" {
        send_user "\n✅ Account created successfully!\n"
    }
    "*Error*" {
        send_user "\n❌ Error during creation\n"
        exit 1
    }
    timeout {
        send_user "\n❌ Timeout\n"
        exit 1
    }
}

expect eof
EOF

RESULT=$?

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $RESULT -eq 0 ]; then
    echo "✅ SUCCESS! Account created on Proton Testnet"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🔍 Verify your account:"
    echo "   Explorer: https://testnet.protonscan.io/account/$ACCOUNT_NAME"
    echo "   CLI: cd $PROTON_CLI_DIR && ./bin/run account $ACCOUNT_NAME"
    echo ""
    echo "🔑 Your keys were displayed above - save them securely!"
    echo "   Keys are also stored in Proton CLI keychain"
    echo ""
    echo "📝 Next steps:"
    echo "   - Request test XPR from faucet (if needed)"
    echo "   - Start building on Proton testnet!"
    echo ""
else
    echo "❌ FAILED - Account creation unsuccessful"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Troubleshooting:"
    echo "   - Check account name format (4-12 chars, a-z and 1-5 only)"
    echo "   - Try a different account name"
    echo "   - Check network connectivity"
    echo ""
fi

exit $RESULT
