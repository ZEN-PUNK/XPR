"""
Parse blockchain data from RPC responses.
"""

from datetime import datetime
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)


class BlockParser:
    """Parse block data from RPC responses."""
    
    @staticmethod
    def parse_block(block_data: dict) -> dict:
        """
        Parse block data from get_block response.
        
        Args:
            block_data: Raw block data from RPC
            
        Returns:
            Parsed block dictionary
        """
        try:
            return {
                'block_num': block_data.get('block_num'),
                'timestamp': block_data.get('timestamp'),
                'producer': block_data.get('producer'),
                'previous': block_data.get('previous'),
                'transaction_mroot': block_data.get('transaction_mroot'),
                'action_mroot': block_data.get('action_mroot'),
                'transactions': block_data.get('transactions', [])
            }
        except Exception as e:
            logger.error(f"Error parsing block: {e}")
            raise
    
    @staticmethod
    def extract_transfers(block_data: dict) -> List[dict]:
        """
        Extract all token transfers from a block.
        
        Args:
            block_data: Parsed block data
            
        Returns:
            List of transfer actions
        """
        transfers = []
        
        for tx in block_data.get('transactions', []):
            if tx.get('status') != 'executed':
                continue
            
            trx = tx.get('trx')
            if isinstance(trx, str):  # Deferred transaction
                continue
            
            tx_id = trx.get('id')
            actions = trx.get('transaction', {}).get('actions', [])
            
            for action in actions:
                if action['account'] == 'eosio.token' and action['name'] == 'transfer':
                    data = action.get('data', {})
                    transfers.append({
                        'tx_id': tx_id,
                        'block_num': block_data['block_num'],
                        'timestamp': block_data['timestamp'],
                        'from': data.get('from'),
                        'to': data.get('to'),
                        'quantity': data.get('quantity'),
                        'memo': data.get('memo', '')
                    })
        
        return transfers
    
    @staticmethod
    def extract_actions_by_contract(block_data: dict, contract: str) -> List[dict]:
        """
        Extract all actions for a specific contract.
        
        Args:
            block_data: Parsed block data
            contract: Contract account name
            
        Returns:
            List of actions
        """
        actions = []
        
        for tx in block_data.get('transactions', []):
            if tx.get('status') != 'executed':
                continue
            
            trx = tx.get('trx')
            if isinstance(trx, str):
                continue
            
            tx_id = trx.get('id')
            tx_actions = trx.get('transaction', {}).get('actions', [])
            
            for action in tx_actions:
                if action['account'] == contract:
                    actions.append({
                        'tx_id': tx_id,
                        'block_num': block_data['block_num'],
                        'timestamp': block_data['timestamp'],
                        'account': action['account'],
                        'name': action['name'],
                        'authorization': action.get('authorization', []),
                        'data': action.get('data', {})
                    })
        
        return actions
    
    @staticmethod
    def get_block_summary(block_data: dict) -> dict:
        """
        Get a summary of block contents.
        
        Args:
            block_data: Parsed block data
            
        Returns:
            Block summary dictionary
        """
        transactions = block_data.get('transactions', [])
        
        # Count actions by type
        action_counts = {}
        total_actions = 0
        
        for tx in transactions:
            if tx.get('status') != 'executed':
                continue
            
            trx = tx.get('trx')
            if isinstance(trx, str):
                continue
            
            actions = trx.get('transaction', {}).get('actions', [])
            for action in actions:
                key = f"{action['account']}::{action['name']}"
                action_counts[key] = action_counts.get(key, 0) + 1
                total_actions += 1
        
        return {
            'block_num': block_data['block_num'],
            'timestamp': block_data['timestamp'],
            'producer': block_data['producer'],
            'transaction_count': len(transactions),
            'action_count': total_actions,
            'action_types': action_counts
        }


if __name__ == "__main__":
    # Test parser
    logging.basicConfig(level=logging.INFO)
    
    # Sample block data
    sample_block = {
        'block_num': 12345,
        'timestamp': '2024-01-01T12:00:00.000',
        'producer': 'testproducer',
        'transactions': [
            {
                'status': 'executed',
                'trx': {
                    'id': 'abc123',
                    'transaction': {
                        'actions': [
                            {
                                'account': 'eosio.token',
                                'name': 'transfer',
                                'authorization': [{'actor': 'alice', 'permission': 'active'}],
                                'data': {
                                    'from': 'alice',
                                    'to': 'bob',
                                    'quantity': '10.0000 XPR',
                                    'memo': 'test transfer'
                                }
                            }
                        ]
                    }
                }
            }
        ]
    }
    
    parser = BlockParser()
    
    # Test parse
    parsed = parser.parse_block(sample_block)
    print(f"Parsed block: {parsed['block_num']}")
    
    # Test extract transfers
    transfers = parser.extract_transfers(sample_block)
    print(f"Transfers: {len(transfers)}")
    for t in transfers:
        print(f"  {t['from']} -> {t['to']}: {t['quantity']}")
    
    # Test summary
    summary = parser.get_block_summary(sample_block)
    print(f"Summary: {summary}")
