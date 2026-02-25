#!/bin/bash
# Quick start script for blockchain indexer

set -e

echo "🚀 Proton Blockchain Indexer - Quick Start"
echo "=========================================="
echo

# Check Python version
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.8+"
    exit 1
fi

echo "✓ Python found: $(python3 --version)"

# Create virtual environment
if [ ! -d "venv" ]; then
    echo
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
fi

# Activate virtual environment
echo
echo "Activating virtual environment..."
source venv/bin/activate
echo "✓ Virtual environment activated"

# Install dependencies
echo
echo "Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo "✓ Dependencies installed"

# Create config file if it doesn't exist
if [ ! -f "config.yml" ]; then
    echo
    echo "Creating config file..."
    cp config.example.yml config.yml
    echo "✓ Config file created: config.yml"
    echo "  Edit this file to customize settings"
fi

# Initialize database
echo
echo "Initializing database..."
python -m src.main init
echo "✓ Database initialized"

# Show next steps
echo
echo "=========================================="
echo "✅ Setup complete!"
echo
echo "Next steps:"
echo "  1. Edit config.yml if needed"
echo "  2. Run: python -m src.main sync --start-block 1 --end-block 100"
echo "  3. View stats: python -m src.main stats"
echo
echo "To test RPC connection:"
echo "  python src/fetcher.py"
echo
echo "To deactivate virtual environment:"
echo "  deactivate"
echo
