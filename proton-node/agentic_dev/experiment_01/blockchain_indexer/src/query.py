"""
Database query helpers for common analytics queries.
"""

from sqlalchemy import func, desc
from datetime import datetime, timedelta
import pandas as pd

from .db import Database, Block, Transaction, Action, Account


class QueryHelper:
    """Helper class for common database queries."""
    
    def __init__(self, db: Database):
        self.db = db
    
    def get_block_range(self, start_block: int, end_block: int) -> pd.DataFrame:
        """Get blocks in a range."""
        session = self.db.get_session()
        try:
            blocks = session.query(Block).filter(
                Block.block_num >= start_block,
                Block.block_num <= end_block
            ).all()
            
            return pd.DataFrame([{
                'block_num': b.block_num,
                'timestamp': b.timestamp,
                'producer': b.producer,
                'transaction_count': b.transaction_count
            } for b in blocks])
        finally:
            session.close()
    
    def get_transfers(self, limit: int = 100) -> pd.DataFrame:
        """Get recent token transfers."""
        session = self.db.get_session()
        try:
            actions = session.query(Action).filter(
                Action.account == 'eosio.token',
                Action.name == 'transfer'
            ).order_by(desc(Action.timestamp)).limit(limit).all()
            
            transfers = []
            for action in actions:
                import json
                data = json.loads(action.data)
                transfers.append({
                    'timestamp': action.timestamp,
                    'block_num': action.block_num,
                    'from': data.get('from'),
                    'to': data.get('to'),
                    'quantity': data.get('quantity'),
                    'memo': data.get('memo', '')
                })
            
            return pd.DataFrame(transfers)
        finally:
            session.close()
    
    def get_top_producers(self, limit: int = 21) -> pd.DataFrame:
        """Get top block producers by block count."""
        session = self.db.get_session()
        try:
            results = session.query(
                Block.producer,
                func.count(Block.block_num).label('block_count')
            ).group_by(Block.producer).order_by(
                desc('block_count')
            ).limit(limit).all()
            
            return pd.DataFrame([{
                'producer': r.producer,
                'blocks': r.block_count
            } for r in results])
        finally:
            session.close()
    
    def get_hourly_stats(self, hours: int = 24) -> pd.DataFrame:
        """Get hourly transaction statistics."""
        session = self.db.get_session()
        try:
            cutoff = datetime.utcnow() - timedelta(hours=hours)
            
            blocks = session.query(Block).filter(
                Block.timestamp >= cutoff
            ).all()
            
            # Group by hour
            hourly_data = {}
            for block in blocks:
                hour_key = block.timestamp.replace(minute=0, second=0, microsecond=0)
                if hour_key not in hourly_data:
                    hourly_data[hour_key] = {
                        'timestamp': hour_key,
                        'blocks': 0,
                        'transactions': 0
                    }
                hourly_data[hour_key]['blocks'] += 1
                hourly_data[hour_key]['transactions'] += block.transaction_count
            
            return pd.DataFrame(list(hourly_data.values())).sort_values('timestamp')
        finally:
            session.close()
    
    def get_action_distribution(self) -> pd.DataFrame:
        """Get distribution of action types."""
        session = self.db.get_session()
        try:
            results = session.query(
                Action.account,
                Action.name,
                func.count(Action.id).label('count')
            ).group_by(
                Action.account,
                Action.name
            ).order_by(desc('count')).all()
            
            return pd.DataFrame([{
                'contract': r.account,
                'action': r.name,
                'count': r.count
            } for r in results])
        finally:
            session.close()
    
    def get_account_activity(self, account_name: str, limit: int = 100) -> pd.DataFrame:
        """Get recent activity for an account."""
        session = self.db.get_session()
        try:
            # Find actions involving this account (in authorization or data)
            actions = session.query(Action).filter(
                Action.data.like(f'%{account_name}%')
            ).order_by(desc(Action.timestamp)).limit(limit).all()
            
            activity = []
            for action in actions:
                import json
                data = json.loads(action.data)
                activity.append({
                    'timestamp': action.timestamp,
                    'block_num': action.block_num,
                    'contract': action.account,
                    'action': action.name,
                    'data': data
                })
            
            return pd.DataFrame(activity)
        finally:
            session.close()
    
    def search_transactions(self, tx_id: str) -> dict:
        """Search for transaction by ID."""
        session = self.db.get_session()
        try:
            tx = session.query(Transaction).filter(
                Transaction.tx_id.like(f'{tx_id}%')
            ).first()
            
            if not tx:
                return None
            
            return {
                'tx_id': tx.tx_id,
                'block_num': tx.block_num,
                'status': tx.status,
                'cpu_usage_us': tx.cpu_usage_us,
                'net_usage_words': tx.net_usage_words,
                'actions_count': tx.actions_count,
                'actions': [{
                    'account': a.account,
                    'name': a.name,
                    'data': a.data
                } for a in tx.actions]
            }
        finally:
            session.close()


if __name__ == "__main__":
    # Test queries
    import logging
    logging.basicConfig(level=logging.INFO)
    
    db = Database("sqlite:///data/blockchain.db")
    query = QueryHelper(db)
    
    # Test get stats
    print("\n=== Top Producers ===")
    df = query.get_top_producers()
    print(df.to_string(index=False))
    
    print("\n=== Action Distribution ===")
    df = query.get_action_distribution()
    print(df.head(10).to_string(index=False))
