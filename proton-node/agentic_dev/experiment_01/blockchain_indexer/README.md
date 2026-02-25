# Proton Blockchain Indexer

Stream blockchain data from a local Proton node into a queryable SQL database for analysis and visualization.

## Features

- ✅ Real-time block streaming from Proton RPC
- ✅ Structured SQL database (SQLite/PostgreSQL)
- ✅ Normalized tables: blocks, transactions, actions, accounts
- ✅ Auto-resume from last synced block
- ✅ Error handling and retry logic
- ✅ CLI interface for easy management
- ✅ Sample analytics queries included

## Architecture

```
Proton Node (RPC) → Fetcher → Parser → DB Writer → SQLite/PostgreSQL
                        ↓
                    Checkpoint
                (last synced block)
```

## Database Schema

### Tables

1. **blocks**
   - `block_num` (PRIMARY KEY)
   - `timestamp`
   - `producer`
   - `transaction_count`
   - `previous_block`
   - `transaction_mroot`
   
2. **transactions**
   - `tx_id` (PRIMARY KEY)
   - `block_num` (FOREIGN KEY)
   - `status`
   - `cpu_usage_us`
   - `net_usage_words`
   - `actions_count`
   
3. **actions**
   - `id` (PRIMARY KEY, auto-increment)
   - `tx_id` (FOREIGN KEY)
   - `block_num`
   - `account` (contract name)
   - `name` (action name)
   - `authorization` (JSON)
   - `data` (JSON)
   - `timestamp`
   
4. **accounts** (cached)
   - `account_name` (PRIMARY KEY)
   - `balance`
   - `ram_quota`
   - `net_weight`
   - `cpu_weight`
   - `last_updated`

5. **sync_state**
   - `id` (always 1)
   - `last_block`
   - `last_sync_time`

## Installation

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Configure connection
cp config.example.yml config.yml
# Edit config.yml with your node details

# 3. Initialize database
python src/init_db.py

# 4. Start syncing
python src/main.py --start
```

## Usage

### Start Indexing
```bash
python src/main.py --start
```

### Resume from Last Block
```bash
python src/main.py --resume
```

### Sync Specific Range
```bash
python src/main.py --start-block 1 --end-block 1000
```

### Query Database
```bash
# Interactive SQL shell
python src/query.py

# Run analytics queries
python src/analytics.py --top-accounts
python src/analytics.py --transfer-volume
python src/analytics.py --block-stats
```

## Configuration

`config.yml`:
```yaml
node:
  rpc_url: "http://localhost:8888"
  timeout: 10
  
database:
  type: "sqlite"  # or "postgresql"
  path: "data/blockchain.db"  # for SQLite
  # host: "localhost"  # for PostgreSQL
  # port: 5432
  # database: "proton"
  # user: "proton"
  # password: "password"
  
sync:
  batch_size: 100  # blocks per batch
  checkpoint_interval: 10  # save state every N blocks
  max_retries: 3
  retry_delay: 5  # seconds
  
logging:
  level: "INFO"
  file: "data/indexer.log"
```

## Sample Queries

### Get block by number
```python
from src.db import get_block

block = get_block(12345)
print(f"Block {block.block_num} by {block.producer}")
```

### Get all transfers for an account
```python
from src.analytics import get_account_transfers

transfers = get_account_transfers("alice")
for t in transfers:
    print(f"{t.timestamp}: {t.from_account} → {t.to_account}: {t.quantity}")
```

### Count transactions per block
```python
from src.analytics import get_transaction_stats

stats = get_transaction_stats(start_block=1, end_block=1000)
print(f"Avg transactions/block: {stats['avg_tx_per_block']}")
print(f"Total actions: {stats['total_actions']}")
```

## Project Structure

```
blockchain_indexer/
├── src/
│   ├── __init__.py
│   ├── main.py              # CLI entry point
│   ├── fetcher.py           # RPC client
│   ├── parser.py            # JSON → structured data
│   ├── db.py                # Database models & writer
│   ├── init_db.py           # Schema creation
│   ├── query.py             # Query helpers
│   ├── analytics.py         # Sample analytics
│   └── config.py            # Config loader
├── tests/
│   ├── test_fetcher.py
│   ├── test_parser.py
│   └── test_db.py
├── data/
│   ├── blockchain.db        # SQLite database (generated)
│   └── indexer.log          # Logs
├── config.example.yml       # Sample configuration
├── requirements.txt
└── README.md
```

## Example Output

```
[2025-12-26 22:00:00] INFO: Starting blockchain indexer...
[2025-12-26 22:00:00] INFO: Connected to RPC: http://localhost:8888
[2025-12-26 22:00:00] INFO: Current head block: 12345
[2025-12-26 22:00:00] INFO: Last synced block: 12000
[2025-12-26 22:00:00] INFO: Syncing blocks 12001-12345 (345 blocks)...
[2025-12-26 22:00:05] INFO: ✓ Block 12100 (100 blocks synced, 12.5 blocks/sec)
[2025-12-26 22:00:10] INFO: ✓ Block 12200 (200 blocks synced, 13.2 blocks/sec)
[2025-12-26 22:00:15] INFO: ✓ Block 12300 (300 blocks synced, 13.8 blocks/sec)
[2025-12-26 22:00:18] INFO: ✓ Block 12345 (345 blocks synced, 14.1 blocks/sec)
[2025-12-26 22:00:18] INFO: ✓ Sync complete! Database up to date.
[2025-12-26 22:00:18] INFO: 
Database Statistics:
  Blocks:        12,345
  Transactions:  45,678
  Actions:       123,456
  Accounts:      5,432
```

## Analytics Examples

### Block Production Rate
```python
python src/analytics.py --block-rate --start "2025-12-26 00:00:00" --end "2025-12-26 23:59:59"
```

Output:
```
Block Production Rate Analysis
==============================
Time Period: 2025-12-26 00:00:00 to 2025-12-26 23:59:59
Total Blocks: 172,800 (24 hours × 2 blocks/sec)
Avg Block Time: 0.5 seconds
Missed Blocks: 12 (0.007%)
```

### Top Active Accounts
```python
python src/analytics.py --top-accounts --limit 10
```

Output:
```
Top 10 Most Active Accounts
===========================
1. eosio.token    : 45,678 actions
2. eosio         : 12,345 actions
3. alice         : 1,234 actions
...
```

### Transfer Volume
```python
python src/analytics.py --transfer-volume --token XPR
```

Output:
```
XPR Transfer Volume
===================
Total Transfers: 12,345
Total Volume: 1,234,567.8900 XPR
Unique Senders: 1,234
Unique Receivers: 987
Avg Transfer: 100.05 XPR
```

## Visualization Dashboard (Optional)

Run the Streamlit dashboard:
```bash
streamlit run src/dashboard.py
```

Features:
- 📊 Real-time block production chart
- 📈 Transaction volume over time
- 🏆 Top accounts by activity
- 💸 Token transfer heatmap
- 🔍 Search blocks/transactions/accounts

## Performance

- **Sync Speed**: ~10-20 blocks/second (depends on network)
- **Database Size**: ~1GB per 1M blocks (SQLite)
- **Memory Usage**: ~100MB (normal operation)
- **Disk I/O**: Sequential writes, optimized batching

## Troubleshooting

### "Connection refused" error
```bash
# Check if node is running
curl http://localhost:8888/v1/chain/get_info

# If on VM, use SSH tunnel
ssh -i key.pem -L 8888:localhost:8888 user@vm-ip
```

### "Database locked" error
```bash
# Only one indexer instance should run
pkill -f "python src/main.py"

# Or use PostgreSQL instead of SQLite for concurrent access
```

### Slow sync speed
```bash
# Increase batch size in config.yml
sync:
  batch_size: 500  # default: 100

# Use PostgreSQL for better write performance
database:
  type: "postgresql"
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new features
4. Submit pull request

## License

MIT License - Open source and free to use

## Next Steps

1. ✅ **Data Exploration**: See `BLOCKCHAIN_DATA_GUIDE.md`
2. ✅ **Index Blockchain**: Run this tool
3. ⏭️ **Analytics**: Use SQL queries or pandas
4. ⏭️ **Visualization**: Build dashboards with Streamlit/Dash
5. ⏭️ **Advanced**: Add Hyperion for full history indexing

---

**Questions?** Check the [BLOCKCHAIN_DATA_GUIDE.md](../BLOCKCHAIN_DATA_GUIDE.md) for understanding blockchain data structures.
