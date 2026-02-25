"""
Main CLI application for blockchain indexer.
"""

import click
import logging
import time
from pathlib import Path

from .config import Config
from .fetcher import RPCFetcher
from .parser import BlockParser
from .db import Database

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@click.group()
@click.pass_context
def cli(ctx):
    """Proton Blockchain Indexer - Stream blockchain data into SQL database."""
    pass


@cli.command()
@click.option('--config', default='config.yml', help='Config file path')
@click.pass_context
def init(ctx, config):
    """Initialize database tables."""
    try:
        cfg = Config(config)
        db = Database(cfg.database_url)
        
        click.echo("Creating database tables...")
        db.create_tables()
        
        click.echo("✓ Database initialized successfully!")
        click.echo(f"  Database: {cfg.database_url}")
        
    except Exception as e:
        click.echo(f"✗ Error: {e}", err=True)
        raise


@cli.command()
@click.option('--config', default='config.yml', help='Config file path')
@click.option('--start-block', type=int, help='Starting block number')
@click.option('--end-block', type=int, help='Ending block number (optional)')
@click.option('--resume/--no-resume', default=True, help='Resume from last synced block')
@click.pass_context
def sync(ctx, config, start_block, end_block, resume):
    """Sync blockchain data to database."""
    try:
        # Load config
        cfg = Config(config)
        
        # Initialize components
        fetcher = RPCFetcher(cfg.rpc_url, timeout=cfg.rpc_timeout)
        parser = BlockParser()
        db = Database(cfg.database_url)
        
        # Determine starting block
        if resume and not start_block:
            last_synced = db.get_last_synced_block()
            start_block = last_synced + 1 if last_synced > 0 else cfg.start_block
            click.echo(f"Resuming from block {start_block}")
        elif not start_block:
            start_block = cfg.start_block
        
        # Get chain info
        info = fetcher.get_info()
        head_block = info['head_block_num']
        
        if not end_block:
            end_block = head_block
        
        click.echo(f"Starting sync...")
        click.echo(f"  RPC: {cfg.rpc_url}")
        click.echo(f"  Database: {cfg.database_url}")
        click.echo(f"  Range: {start_block} -> {end_block}")
        click.echo(f"  Batch size: {cfg.batch_size}")
        click.echo()
        
        # Sync blocks
        blocks_processed = 0
        start_time = time.time()
        last_report_time = start_time
        
        with click.progressbar(
            length=end_block - start_block + 1,
            label='Syncing blocks'
        ) as bar:
            
            for block_data in fetcher.stream_blocks(start_block, end_block):
                try:
                    # Parse and insert
                    parsed_block = parser.parse_block(block_data)
                    db.insert_block(parsed_block)
                    
                    blocks_processed += 1
                    bar.update(1)
                    
                    # Update sync state every batch
                    if blocks_processed % cfg.batch_size == 0:
                        db.update_sync_state(block_data['block_num'])
                        
                        # Report progress
                        elapsed = time.time() - last_report_time
                        rate = cfg.batch_size / elapsed if elapsed > 0 else 0
                        
                        logger.info(
                            f"Processed {blocks_processed} blocks "
                            f"(block {block_data['block_num']}) "
                            f"- {rate:.1f} blocks/sec"
                        )
                        
                        last_report_time = time.time()
                
                except Exception as e:
                    logger.error(f"Error processing block {block_data.get('block_num')}: {e}")
                    # Continue with next block
                    continue
        
        # Final sync state update
        if blocks_processed > 0:
            db.update_sync_state(end_block)
        
        # Report completion
        total_time = time.time() - start_time
        avg_rate = blocks_processed / total_time if total_time > 0 else 0
        
        click.echo()
        click.echo("✓ Sync completed!")
        click.echo(f"  Blocks processed: {blocks_processed}")
        click.echo(f"  Time elapsed: {total_time:.1f}s")
        click.echo(f"  Average rate: {avg_rate:.1f} blocks/sec")
        
        # Show stats
        stats = db.get_stats()
        click.echo()
        click.echo("Database statistics:")
        for key, value in stats.items():
            click.echo(f"  {key}: {value:,}")
        
    except KeyboardInterrupt:
        click.echo("\n\nInterrupted by user")
        click.echo("Progress has been saved. Use --resume to continue.")
        
    except Exception as e:
        click.echo(f"✗ Error: {e}", err=True)
        raise


@cli.command()
@click.option('--config', default='config.yml', help='Config file path')
@click.pass_context
def stats(ctx, config):
    """Show database statistics."""
    try:
        cfg = Config(config)
        db = Database(cfg.database_url)
        
        stats = db.get_stats()
        last_block = db.get_last_synced_block()
        
        click.echo("Database Statistics:")
        click.echo(f"  Blocks: {stats['blocks']:,}")
        click.echo(f"  Transactions: {stats['transactions']:,}")
        click.echo(f"  Actions: {stats['actions']:,}")
        click.echo(f"  Accounts: {stats['accounts']:,}")
        click.echo(f"  Last synced block: {last_block:,}")
        
    except Exception as e:
        click.echo(f"✗ Error: {e}", err=True)
        raise


@cli.command()
@click.option('--config', default='config.yml', help='Config file path')
@click.pass_context
def reset(ctx, config):
    """Reset database (drop all tables)."""
    if not click.confirm('⚠️  This will delete ALL data. Continue?'):
        click.echo("Cancelled.")
        return
    
    try:
        cfg = Config(config)
        db = Database(cfg.database_url)
        
        click.echo("Dropping all tables...")
        db.drop_tables()
        
        click.echo("✓ Database reset complete!")
        click.echo("Run 'blockchain-indexer init' to recreate tables.")
        
    except Exception as e:
        click.echo(f"✗ Error: {e}", err=True)
        raise


if __name__ == '__main__':
    cli()
