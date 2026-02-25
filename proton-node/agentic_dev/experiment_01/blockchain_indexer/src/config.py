"""
Configuration loader for blockchain indexer.
"""

import yaml
import os
from pathlib import Path


class Config:
    """Load and manage configuration from YAML file."""
    
    def __init__(self, config_path="config.yml"):
        self.config_path = config_path
        self.config = self._load_config()
        
    def _load_config(self):
        """Load configuration from YAML file."""
        if not os.path.exists(self.config_path):
            # Try example config
            example_path = "config.example.yml"
            if os.path.exists(example_path):
                print(f"Config file not found, copying from {example_path}")
                import shutil
                shutil.copy(example_path, self.config_path)
            else:
                raise FileNotFoundError(
                    f"Config file '{self.config_path}' not found. "
                    f"Copy config.example.yml to config.yml"
                )
        
        with open(self.config_path, 'r') as f:
            return yaml.safe_load(f)
    
    @property
    def rpc_url(self):
        return self.config['node']['rpc_url']
    
    @property
    def rpc_timeout(self):
        return self.config['node'].get('timeout', 10)
    
    @property
    def db_type(self):
        return self.config['database']['type']
    
    @property
    def db_path(self):
        """Get database path (for SQLite)."""
        return self.config['database'].get('path', 'data/blockchain.db')
    
    @property
    def db_url(self):
        """Get SQLAlchemy database URL."""
        db_config = self.config['database']
        
        if db_config['type'] == 'sqlite':
            # Ensure data directory exists
            db_path = db_config.get('path', 'data/blockchain.db')
            os.makedirs(os.path.dirname(db_path), exist_ok=True)
            return f"sqlite:///{db_path}"
        
        elif db_config['type'] == 'postgresql':
            host = db_config['host']
            port = db_config.get('port', 5432)
            database = db_config['database']
            user = db_config['user']
            password = db_config['password']
            return f"postgresql://{user}:{password}@{host}:{port}/{database}"
        
        else:
            raise ValueError(f"Unsupported database type: {db_config['type']}")
    
    @property
    def database_url(self):
        """Alias for db_url."""
        return self.db_url
    
    @property
    def start_block(self):
        """Default start block."""
        return self.config.get('sync', {}).get('start_block', 1)
    
    @property
    def batch_size(self):
        return self.config['sync'].get('batch_size', 100)
    
    @property
    def checkpoint_interval(self):
        return self.config['sync'].get('checkpoint_interval', 10)
    
    @property
    def max_retries(self):
        return self.config['sync'].get('max_retries', 3)
    
    @property
    def retry_delay(self):
        return self.config['sync'].get('retry_delay', 5)
    
    @property
    def poll_interval(self):
        return self.config['sync'].get('poll_interval', 1)
    
    @property
    def log_level(self):
        return self.config['logging'].get('level', 'INFO')
    
    @property
    def log_file(self):
        log_file = self.config['logging'].get('file', 'data/indexer.log')
        # Ensure directory exists
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        return log_file
    
    @property
    def log_format(self):
        return self.config['logging'].get(
            'format',
            '[%(asctime)s] %(levelname)s: %(message)s'
        )


# Global config instance
_config = None

def get_config(config_path="config.yml"):
    """Get global config instance."""
    global _config
    if _config is None:
        _config = Config(config_path)
    return _config
