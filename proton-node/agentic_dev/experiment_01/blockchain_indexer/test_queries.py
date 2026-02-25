#!/usr/bin/env python3
"""Test the query helpers."""

from src.db import Database
from src.query import QueryHelper

# Connect to database
db = Database("sqlite:///data/blockchain.db")
query = QueryHelper(db)

print("=" * 60)
print("BLOCKCHAIN INDEXER - TEST QUERIES")
print("=" * 60)

# Get block range
print("\n1. Blocks 1-10:")
print("-" * 60)
blocks = query.get_block_range(1, 10)
print(blocks.to_string(index=False))

# Get action distribution
print("\n2. Action Distribution:")
print("-" * 60)
actions = query.get_action_distribution()
print(actions.to_string(index=False))

# Get top producers (from our 10 blocks)
print("\n3. Block Producers:")
print("-" * 60)
producers = query.get_top_producers(limit=5)
print(producers.to_string(index=False))

# Get transfers (if any)
print("\n4. Recent Transfers:")
print("-" * 60)
transfers = query.get_transfers(limit=10)
if len(transfers) > 0:
    print(transfers[['timestamp', 'from', 'to', 'quantity']].to_string(index=False))
else:
    print("No transfers found in blocks 1-10")

print("\n" + "=" * 60)
print("✅ All queries completed successfully!")
print("=" * 60)
