"""
Database models and operations using SQLAlchemy.
"""

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, ForeignKey, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import logging
import json

logger = logging.getLogger(__name__)

Base = declarative_base()


class Block(Base):
    """Block table model."""
    __tablename__ = 'blocks'
    
    block_num = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    producer = Column(String(13), nullable=False, index=True)
    transaction_count = Column(Integer, default=0)
    previous_block = Column(String(64))
    transaction_mroot = Column(String(64))
    action_mroot = Column(String(64))
    
    # Relationships
    transactions = relationship("Transaction", back_populates="block", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Block {self.block_num} by {self.producer}>"


class Transaction(Base):
    """Transaction table model."""
    __tablename__ = 'transactions'
    
    tx_id = Column(String(64), primary_key=True)
    block_num = Column(Integer, ForeignKey('blocks.block_num'), nullable=False, index=True)
    status = Column(String(20), nullable=False)
    cpu_usage_us = Column(Integer, default=0)
    net_usage_words = Column(Integer, default=0)
    actions_count = Column(Integer, default=0)
    
    # Relationships
    block = relationship("Block", back_populates="transactions")
    actions = relationship("Action", back_populates="transaction", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Transaction {self.tx_id[:8]}... in block {self.block_num}>"


class Action(Base):
    """Action table model."""
    __tablename__ = 'actions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    tx_id = Column(String(64), ForeignKey('transactions.tx_id'), nullable=False, index=True)
    block_num = Column(Integer, nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    account = Column(String(13), nullable=False, index=True)  # Contract name
    name = Column(String(13), nullable=False, index=True)  # Action name
    authorization = Column(Text)  # JSON
    data = Column(Text)  # JSON
    
    # Relationships
    transaction = relationship("Transaction", back_populates="actions")
    
    # Indexes for common queries
    __table_args__ = (
        Index('ix_actions_account_name', 'account', 'name'),
        Index('ix_actions_block_timestamp', 'block_num', 'timestamp'),
    )
    
    def __repr__(self):
        return f"<Action {self.account}::{self.name} in block {self.block_num}>"


class Account(Base):
    """Account table model (cached account info)."""
    __tablename__ = 'accounts'
    
    account_name = Column(String(13), primary_key=True)
    balance = Column(String(50))  # e.g., "1000.0000 XPR"
    ram_quota = Column(Integer)
    ram_usage = Column(Integer)
    net_weight = Column(Integer)
    cpu_weight = Column(Integer)
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<Account {self.account_name}>"


class SyncState(Base):
    """Sync state table to track last synced block."""
    __tablename__ = 'sync_state'
    
    id = Column(Integer, primary_key=True, default=1)
    last_block = Column(Integer, default=0)
    last_sync_time = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<SyncState last_block={self.last_block}>"


class Database:
    """Database manager."""
    
    def __init__(self, db_url: str):
        self.db_url = db_url
        self.engine = create_engine(db_url, echo=False)
        self.Session = sessionmaker(bind=self.engine)
        
        logger.info(f"Connected to database: {db_url}")
    
    def create_tables(self):
        """Create all tables."""
        Base.metadata.create_all(self.engine)
        logger.info("Database tables created")
    
    def drop_tables(self):
        """Drop all tables."""
        Base.metadata.drop_all(self.engine)
        logger.info("Database tables dropped")
    
    def get_session(self):
        """Get a new session."""
        return self.Session()
    
    def get_last_synced_block(self) -> int:
        """Get last synced block number."""
        session = self.get_session()
        try:
            sync_state = session.query(SyncState).first()
            if sync_state:
                return sync_state.last_block
            else:
                # Create initial sync state
                sync_state = SyncState(id=1, last_block=0)
                session.add(sync_state)
                session.commit()
                return 0
        finally:
            session.close()
    
    def update_sync_state(self, last_block: int):
        """Update last synced block."""
        session = self.get_session()
        try:
            sync_state = session.query(SyncState).first()
            if sync_state:
                sync_state.last_block = last_block
                sync_state.last_sync_time = datetime.utcnow()
            else:
                sync_state = SyncState(id=1, last_block=last_block)
                session.add(sync_state)
            session.commit()
        finally:
            session.close()
    
    def insert_block(self, block_data: dict):
        """Insert a block and its transactions/actions."""
        session = self.get_session()
        try:
            # Create block
            block = Block(
                block_num=block_data['block_num'],
                timestamp=datetime.fromisoformat(block_data['timestamp'].replace('Z', '+00:00')),
                producer=block_data['producer'],
                transaction_count=len(block_data.get('transactions', [])),
                previous_block=block_data.get('previous'),
                transaction_mroot=block_data.get('transaction_mroot'),
                action_mroot=block_data.get('action_mroot')
            )
            
            # Process transactions
            for tx_data in block_data.get('transactions', []):
                if tx_data.get('status') != 'executed':
                    continue  # Skip non-executed transactions
                
                trx = tx_data.get('trx')
                if isinstance(trx, str):  # Transaction ID only (deferred)
                    continue
                
                tx_id = trx['id']
                
                # Create transaction
                transaction = Transaction(
                    tx_id=tx_id,
                    block_num=block_data['block_num'],
                    status=tx_data['status'],
                    cpu_usage_us=tx_data.get('cpu_usage_us', 0),
                    net_usage_words=tx_data.get('net_usage_words', 0),
                    actions_count=len(trx.get('transaction', {}).get('actions', []))
                )
                
                # Process actions
                for action_data in trx.get('transaction', {}).get('actions', []):
                    action = Action(
                        tx_id=tx_id,
                        block_num=block_data['block_num'],
                        timestamp=block.timestamp,
                        account=action_data['account'],
                        name=action_data['name'],
                        authorization=json.dumps(action_data.get('authorization', [])),
                        data=json.dumps(action_data.get('data', {}))
                    )
                    transaction.actions.append(action)
                
                block.transactions.append(transaction)
            
            session.add(block)
            session.commit()
            
        except Exception as e:
            session.rollback()
            logger.error(f"Error inserting block {block_data.get('block_num')}: {e}")
            raise
        finally:
            session.close()
    
    def get_block(self, block_num: int) -> Block:
        """Get block by number."""
        session = self.get_session()
        try:
            return session.query(Block).filter_by(block_num=block_num).first()
        finally:
            session.close()
    
    def get_stats(self) -> dict:
        """Get database statistics."""
        session = self.get_session()
        try:
            stats = {
                'blocks': session.query(Block).count(),
                'transactions': session.query(Transaction).count(),
                'actions': session.query(Action).count(),
                'accounts': session.query(Account).count(),
            }
            return stats
        finally:
            session.close()


if __name__ == "__main__":
    # Test database
    logging.basicConfig(level=logging.INFO)
    
    db = Database("sqlite:///test.db")
    db.create_tables()
    
    # Test insert
    sample_block = {
        'block_num': 1,
        'timestamp': '2020-04-22T17:00:00.000',
        'producer': 'eosio',
        'transactions': []
    }
    
    db.insert_block(sample_block)
    print(f"Inserted block 1")
    
    # Get stats
    stats = db.get_stats()
    print(f"Stats: {stats}")
