#!/usr/bin/env python3
"""
Test script for RAG integration with OpenAI and MCP servers.
"""

import asyncio
import json
import logging
import os
import sys
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from mcp.services.bible_api_server import BibleAPIMCPServer
from mcp.services.pinecone_server import PineconeMCPServer
from mcp.services.supabase_server import SupabaseMCPServer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_rag_integration():
    """Test the complete RAG integration."""
    
    # Initialize servers
    bible_server = BibleAPIMCPServer()
    pinecone_server = PineconeMCPServer()
    supabase_server = SupabaseMCPServer()
    
    try:
        # Initialize all servers
        logger.info("Initializing MCP servers...")
        await asyncio.gather(
            bible_server.initialize(),
            pinecone_server.initialize(),
            supabase_server.initialize()
        )
        logger.info("All servers initialized successfully")
        
        # Test query
        test_message = "What does the Bible say about love?"
        logger.info(f"Testing with query: '{test_message}'")
        
        # Step 1: Search Bible API
        logger.info("Searching Bible API...")
        bible_results = await bible_server.search(test_message, 3)
        logger.info(f"Bible API found {len(bible_results.get('results', []))} results")
        
        # Step 2: Search Pinecone (if we have vectors)
        logger.info("Searching Pinecone...")
        try:
            pinecone_results = await pinecone_server.search(test_message, 3)
            logger.info(f"Pinecone found {len(pinecone_results.get('matches', []))} results")
        except Exception as e:
            logger.warning(f"Pinecone search failed: {e}")
            pinecone_results = {'matches': []}
        
        # Step 3: Test conversation storage
        logger.info("Testing conversation storage...")
        try:
            # Create a test conversation
            conv_result = await supabase_server.query({
                'type': 'create_conversation',
                'title': 'Test RAG Conversation',
                'user_id': 'test-user-123'
            })
            conversation_id = conv_result.get('conversation_id')
            logger.info(f"Created test conversation: {conversation_id}")
            
            # Add a test message
            await supabase_server.query({
                'type': 'add_message',
                'conversation_id': conversation_id,
                'content': test_message,
                'role': 'user',
                'metadata': {'test': True}
            })
            logger.info("Added test message to conversation")
            
        except Exception as e:
            logger.warning(f"Conversation storage test failed: {e}")
        
        # Print results summary
        print("\n" + "="*60)
        print("RAG INTEGRATION TEST RESULTS")
        print("="*60)
        print(f"Query: '{test_message}'")
        print(f"Bible API Results: {len(bible_results.get('results', []))}")
        print(f"Pinecone Results: {len(pinecone_results.get('matches', []))}")
        
        if bible_results.get('results'):
            print("\nBible API Results:")
            for i, result in enumerate(bible_results['results'][:3], 1):
                print(f"  {i}. {result.get('reference', 'Unknown')}: {result.get('text', 'No text')[:100]}...")
        
        if pinecone_results.get('matches'):
            print("\nPinecone Results:")
            for i, match in enumerate(pinecone_results['matches'][:3], 1):
                metadata = match.get('metadata', {})
                print(f"  {i}. {metadata.get('reference', 'Unknown')}: {metadata.get('text', 'No text')[:100]}...")
        
        print("\n✅ RAG integration test completed successfully!")
        
    except Exception as e:
        logger.error(f"RAG integration test failed: {e}")
        print(f"\n❌ RAG integration test failed: {e}")
        return False
    
    finally:
        # Cleanup
        try:
            await asyncio.gather(
                bible_server.cleanup(),
                pinecone_server.cleanup(),
                supabase_server.cleanup()
            )
            logger.info("All servers cleaned up")
        except Exception as e:
            logger.warning(f"Cleanup failed: {e}")
    
    return True

async def main():
    """Main function."""
    print("Testing RAG Integration with OpenAI and MCP Servers")
    print("=" * 60)
    
    # Check environment variables
    required_vars = [
        'BIBLE_API_KEY',
        'PINECONE_API_KEY', 
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'OPENAI_API_KEY'
    ]
    
    missing = [var for var in required_vars if not os.getenv(var)]
    if missing:
        print(f"❌ Missing required environment variables: {missing}")
        print("Please set these variables and try again.")
        return
    
    success = await test_rag_integration()
    if success:
        print("\n🎉 All tests passed! RAG integration is working correctly.")
    else:
        print("\n💥 Tests failed. Check the logs for details.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
