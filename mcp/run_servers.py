#!/usr/bin/env python3
"""
MCP Server Runner for Shield AI
Starts all MCP servers for testing and development.
"""

import asyncio
import logging
import sys
import os
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from mcp.services.bible_api_server import BibleAPIMCPServer
from mcp.services.pinecone_server import PineconeMCPServer
from mcp.services.supabase_server import SupabaseMCPServer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_servers():
    """Test all MCP servers."""
    servers = {
        'bible': BibleAPIMCPServer(),
        'pinecone': PineconeMCPServer(),
        'supabase': SupabaseMCPServer()
    }
    
    results = {}
    
    for name, server in servers.items():
        try:
            logger.info(f"Testing {name} server...")
            await server.initialize()
            
            # Test basic functionality
            if name == 'bible':
                # Test getting books
                books_result = await server.get_books()
                results[name] = {
                    'status': 'success',
                    'books_count': len(books_result.get('books', []))
                }
            elif name == 'pinecone':
                # Test getting index stats
                stats = await server.get_index_stats()
                results[name] = {
                    'status': 'success',
                    'total_vectors': stats.get('total_vector_count', 0)
                }
            elif name == 'supabase':
                # Test basic query - just check if we can query a simple table
                test_query = {'type': 'select', 'table': 'conversations', 'limit': 1}
                try:
                    await server.query(test_query)
                    results[name] = {
                        'status': 'success',
                        'connection': 'ok'
                    }
                except Exception as e:
                    # If conversations table doesn't exist, that's ok for testing
                    if 'relation "conversations" does not exist' in str(e):
                        results[name] = {
                            'status': 'success',
                            'connection': 'ok',
                            'note': 'Connected but conversations table not found (expected)'
                        }
                    else:
                        raise
            
            await server.cleanup()
            logger.info(f"{name} server test completed successfully")
            
        except Exception as e:
            logger.error(f"{name} server test failed: {e}")
            results[name] = {
                'status': 'error',
                'error': str(e)
            }
    
    return results

async def main():
    """Main function to run server tests."""
    logger.info("Starting MCP server tests...")
    
    # Check environment variables
    required_env_vars = [
        'BIBLE_API_KEY',
        'PINECONE_API_KEY',
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY'
    ]
    
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]
    if missing_vars:
        logger.error(f"Missing required environment variables: {missing_vars}")
        logger.info("Please set the required environment variables and try again.")
        return
    
    results = await test_servers()
    
    # Print results
    print("\n" + "="*50)
    print("MCP SERVER TEST RESULTS")
    print("="*50)
    
    for name, result in results.items():
        status = result['status']
        print(f"{name.upper()}: {status.upper()}")
        if status == 'success':
            for key, value in result.items():
                if key != 'status':
                    print(f"  {key}: {value}")
        else:
            print(f"  error: {result.get('error', 'Unknown error')}")
        print()
    
    # Check if all servers are working
    all_success = all(result['status'] == 'success' for result in results.values())
    if all_success:
        print("✅ All MCP servers are working correctly!")
    else:
        print("❌ Some MCP servers failed. Check the errors above.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
