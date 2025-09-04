"""
Schema definitions for MCP servers.
"""

from .bible_schemas import *
from .pinecone_schemas import *
from .supabase_schemas import *

__all__ = [
    # Bible schemas
    'BibleVerseRequest',
    'BibleSearchRequest', 
    'BibleBooksRequest',
    'BibleChaptersRequest',
    'BibleVerseResponse',
    'BibleSearchResponse',
    'BibleBooksResponse',
    'BibleChaptersResponse',
    
    # Pinecone schemas
    'PineconeSearchRequest',
    'PineconeUpsertRequest',
    'PineconeDeleteRequest',
    'PineconeFetchRequest',
    'PineconeSearchResponse',
    'PineconeUpsertResponse',
    'PineconeDeleteResponse',
    'PineconeFetchResponse',
    
    # Supabase schemas
    'SupabaseSelectRequest',
    'SupabaseInsertRequest',
    'SupabaseUpdateRequest',
    'SupabaseDeleteRequest',
    'SupabaseUpsertRequest',
    'SupabaseResponse'
]

