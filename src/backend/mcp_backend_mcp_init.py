"""
MCP (Model Context Protocol) Server implementations for Shield AI.

This package provides MCP server implementations for various services:
- Bible API: Scripture retrieval and search
- Pinecone: Vector database operations
- Supabase: Database operations

Usage:
    from mcp import BibleAPIMCPServer, PineconeMCPServer, SupabaseMCPServer
    
    # Initialize servers
    bible_server = BibleAPIMCPServer()
    await bible_server.initialize()
    
    # Execute queries
    result = await bible_server.query({
        "type": "get_verses",
        "book": "John",
        "chapter": 3,
        "verse_start": 16
    })
"""

from .core import BaseMCPServer, MCPError, MCPConnectionError, MCPValidationError
from .services import BibleAPIMCPServer, PineconeMCPServer, SupabaseMCPServer
from .config import Settings, setup_logging

__version__ = "1.0.0"
__all__ = [
    # Core classes
    'BaseMCPServer',
    'MCPError',
    'MCPConnectionError',
    'MCPValidationError',
    
    # Service implementations
    'BibleAPIMCPServer',
    'PineconeMCPServer',
    'SupabaseMCPServer',
    
    # Configuration
    'Settings',
    'setup_logging',
]