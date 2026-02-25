"""
RPC Fetcher - Fetch blockchain data from Proton node.
"""

import requests
import logging
import time
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


class RPCFetcher:
    """Fetch data from Proton RPC endpoint."""
    
    def __init__(self, rpc_url: str, timeout: int = 10, max_retries: int = 3, retry_delay: int = 5):
        self.rpc_url = rpc_url.rstrip('/')
        self.timeout = timeout
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        
        # Verify connection
        try:
            info = self.get_info()
            logger.info(f"Connected to {rpc_url}")
            logger.info(f"Chain ID: {info.get('chain_id')}")
            logger.info(f"Head block: {info.get('head_block_num')}")
        except Exception as e:
            logger.error(f"Failed to connect to RPC: {e}")
            raise
    
    def _request(self, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make HTTP request with retry logic."""
        url = f"{self.rpc_url}{endpoint}"
        
        for attempt in range(self.max_retries):
            try:
                if data is None:
                    response = requests.get(url, timeout=self.timeout)
                else:
                    response = requests.post(url, json=data, timeout=self.timeout)
                
                response.raise_for_status()
                return response.json()
            
            except requests.exceptions.RequestException as e:
                if attempt < self.max_retries - 1:
                    logger.warning(f"Request failed (attempt {attempt + 1}/{self.max_retries}): {e}")
                    time.sleep(self.retry_delay)
                else:
                    logger.error(f"Request failed after {self.max_retries} attempts: {e}")
                    raise
    
    def get_info(self) -> Dict[str, Any]:
        """Get blockchain info."""
        return self._request("/v1/chain/get_info")
    
    def get_block(self, block_num_or_id: int | str) -> Dict[str, Any]:
        """Get block by number or ID."""
        return self._request("/v1/chain/get_block", {"block_num_or_id": block_num_or_id})
    
    def get_account(self, account_name: str) -> Dict[str, Any]:
        """Get account information."""
        return self._request("/v1/chain/get_account", {"account_name": account_name})
    
    def get_table_rows(self, code: str, scope: str, table: str, 
                       limit: int = 100, lower_bound: str = None,
                       upper_bound: str = None) -> Dict[str, Any]:
        """Query contract table rows."""
        data = {
            "json": True,
            "code": code,
            "scope": scope,
            "table": table,
            "limit": limit
        }
        
        if lower_bound is not None:
            data["lower_bound"] = lower_bound
        if upper_bound is not None:
            data["upper_bound"] = upper_bound
        
        return self._request("/v1/chain/get_table_rows", data)
    
    def get_currency_balance(self, code: str, account: str, symbol: str = None) -> list:
        """Get token balance for account."""
        data = {
            "code": code,
            "account": account
        }
        if symbol:
            data["symbol"] = symbol
        
        result = self._request("/v1/chain/get_currency_balance", data)
        return result if isinstance(result, list) else []
    
    def get_supported_apis(self) -> Dict[str, Any]:
        """Get list of supported APIs."""
        return self._request("/v1/node/get_supported_apis")
    
    def get_head_block_num(self) -> int:
        """Get current head block number."""
        info = self.get_info()
        return info['head_block_num']
    
    def stream_blocks(self, start_block: int, end_block: Optional[int] = None):
        """
        Generator to stream blocks.
        
        Args:
            start_block: Starting block number
            end_block: Ending block number (None = stream indefinitely)
        
        Yields:
            Block data dictionaries
        """
        current_block = start_block
        
        while True:
            # Check if we've reached end block
            if end_block is not None and current_block > end_block:
                logger.info(f"Reached end block {end_block}")
                break
            
            try:
                block_data = self.get_block(current_block)
                yield block_data
                current_block += 1
                
            except Exception as e:
                # Check if block doesn't exist yet (caught up to head)
                head_block = self.get_head_block_num()
                if current_block > head_block:
                    logger.info(f"Caught up to head block {head_block}")
                    if end_block is None:
                        # Wait for new blocks
                        logger.debug(f"Waiting for block {current_block}...")
                        time.sleep(1)
                        continue
                    else:
                        # Finished sync
                        break
                else:
                    logger.error(f"Error fetching block {current_block}: {e}")
                    raise


if __name__ == "__main__":
    # Test fetcher with config file
    import sys
    from pathlib import Path
    
    # Add parent directory to path for imports
    sys.path.insert(0, str(Path(__file__).parent.parent))
    
    from src.config import Config
    
    logging.basicConfig(level=logging.INFO)
    
    # Load config
    config = Config("config.yml")
    
    # Create fetcher
    fetcher = RPCFetcher(config.rpc_url, timeout=config.rpc_timeout)
    
    # Get chain info
    info = fetcher.get_info()
    print(f"\n✓ Connected to Proton blockchain!")
    print(f"  Chain ID: {info['chain_id'][:16]}...")
    print(f"  Head Block: {info['head_block_num']:,}")
    print(f"  Head Producer: {info['head_block_producer']}")
    
    # Get latest block
    block = fetcher.get_block(info['head_block_num'])
    print(f"\n✓ Fetched block {block['block_num']:,}")
    print(f"  Timestamp: {block['timestamp']}")
    print(f"  Producer: {block['producer']}")
    print(f"  Transactions: {len(block.get('transactions', []))}")
    
    # Test streaming (just 1 block)
    print(f"\n✓ Testing block streaming...")
    for block in fetcher.stream_blocks(1, 1):
        print(f"  Block 1: {block['producer']} at {block['timestamp']}")
        break
    
    print(f"\n✅ All tests passed!")
