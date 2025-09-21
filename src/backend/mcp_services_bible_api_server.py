"""
Bible API MCP Server for Shield AI
Handles Bible API operations for scripture retrieval and search.
"""

import logging
from typing import Dict, Any, List, Optional
import asyncio
import aiohttp
import json

from ..core.base_server import BaseMCPServer
from ..core.exceptions import MCPConnectionError, MCPValidationError
from ..core.utils import retry_async, validate_query
from ..config.settings import settings
from ..schemas.bible_schemas import (
    BibleVerseRequest, BibleSearchRequest, BibleBooksRequest, BibleChaptersRequest,
    BibleVerseResponse, BibleSearchResponse, BibleBooksResponse, BibleChaptersResponse
)

logger = logging.getLogger(__name__)


class BibleAPIMCPServer(BaseMCPServer):
    """MCP Server for Bible API operations."""
    
    def __init__(self):
        super().__init__("bible_api")
        self.api_key = settings.bible_api.api_key
        self.base_url = settings.bible_api.base_url
        self.bible_id = settings.bible_api.bible_id
        self.timeout = settings.bible_api.timeout
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def initialize(self) -> None:
        """Initialize Bible API connection."""
        try:
            if not self.api_key:
                raise MCPValidationError("BIBLE_API_KEY environment variable is required")
            
            # Create aiohttp session
            self.session = aiohttp.ClientSession(
                headers={
                    "api-key": self.api_key,
                    "Content-Type": "application/json"
                },
                timeout=aiohttp.ClientTimeout(total=self.timeout)
            )
            
            # Test connection
            await self._test_connection()
            
            self.is_initialized = True
            self._set_connection_status("connected")
            logger.info("Bible API MCP server initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Bible API MCP server: {e}")
            self._set_connection_status("error")
            raise MCPConnectionError(f"Failed to initialize Bible API: {e}")
    
    async def cleanup(self) -> None:
        """Clean up Bible API connections."""
        try:
            if self.session:
                await self.session.close()
                self.session = None
            
            self.is_initialized = False
            self._set_connection_status("disconnected")
            logger.info("Bible API MCP server cleaned up successfully")
            
        except Exception as e:
            logger.error(f"Error cleaning up Bible API MCP server: {e}")
    
    async def query(self, query: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a query against Bible API."""
        self._validate_connection()
        self._update_activity()
        
        try:
            query_type = query.get("type", "get_verses")
            
            if query_type == "get_verses":
                return await self._get_verses(query)
            elif query_type == "search":
                return await self._search(query)
            elif query_type == "get_books":
                return await self._get_books(query)
            elif query_type == "get_chapters":
                return await self._get_chapters(query)
            else:
                raise MCPValidationError(f"Unknown query type: {query_type}")
                
        except Exception as e:
            logger.error(f"Error executing Bible API query: {e}")
            raise
    
    @retry_async(max_retries=3, delay=1.0)
    async def get_verses(self, book: str, chapter: int, verse_start: Optional[int] = None, verse_end: Optional[int] = None) -> Dict[str, Any]:
        """Get Bible verses from a specific book and chapter."""
        self._validate_connection()
        
        try:
            # Get book ID
            book_id = await self._get_book_id(book)
            if not book_id:
                raise MCPValidationError(f"Book '{book}' not found")
            
            # Get chapter ID
            chapter_id = await self._get_chapter_id(book_id, chapter)
            if not chapter_id:
                raise MCPValidationError(f"Chapter {chapter} not found in {book}")
            
            # Build verse range
            if verse_start and verse_end:
                verse_range = f"{verse_start}-{verse_end}"
            elif verse_start:
                verse_range = str(verse_start)
            else:
                verse_range = None
            
            # Make API request
            url = f"{self.base_url}/bibles/{self.bible_id}/chapters/{chapter_id}"
            if verse_range:
                url += f"/verses/{verse_range}"
            
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    return {
                        "verses": data.get("data", {}).get("content", ""),
                        "book": book,
                        "chapter": chapter,
                        "verse_range": verse_range,
                        "bible_id": self.bible_id
                    }
                else:
                    error_text = await response.text()
                    raise MCPConnectionError(f"API request failed: {response.status} - {error_text}")
                    
        except Exception as e:
            logger.error(f"Error getting Bible verses: {e}")
            raise
    
    @retry_async(max_retries=3, delay=1.0)
    async def search(self, query: str, limit: int = 10) -> Dict[str, Any]:
        """Search Bible text."""
        self._validate_connection()
        
        try:
            url = f"{self.base_url}/bibles/{self.bible_id}/search"
            params = {
                "query": query,
                "limit": limit
            }
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return {
                        "results": data.get("data", {}).get("verses", []),
                        "query": query,
                        "total_results": len(data.get("data", {}).get("verses", [])),
                        "bible_id": self.bible_id
                    }
                else:
                    error_text = await response.text()
                    raise MCPConnectionError(f"Search request failed: {response.status} - {error_text}")
                    
        except Exception as e:
            logger.error(f"Error searching Bible: {e}")
            raise
    
    @retry_async(max_retries=3, delay=1.0)
    async def get_books(self) -> Dict[str, Any]:
        """Get list of Bible books."""
        self._validate_connection()
        
        try:
            url = f"{self.base_url}/bibles/{self.bible_id}/books"
            
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    return {
                        "books": data.get("data", []),
                        "bible_id": self.bible_id
                    }
                else:
                    error_text = await response.text()
                    raise MCPConnectionError(f"Get books request failed: {response.status} - {error_text}")
                    
        except Exception as e:
            logger.error(f"Error getting Bible books: {e}")
            raise
    
    @retry_async(max_retries=3, delay=1.0)
    async def get_chapters(self, book: str) -> Dict[str, Any]:
        """Get chapters for a specific book."""
        self._validate_connection()
        
        try:
            book_id = await self._get_book_id(book)
            if not book_id:
                raise MCPValidationError(f"Book '{book}' not found")
            
            url = f"{self.base_url}/bibles/{self.bible_id}/books/{book_id}/chapters"
            
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    return {
                        "chapters": data.get("data", []),
                        "book": book,
                        "book_id": book_id,
                        "bible_id": self.bible_id
                    }
                else:
                    error_text = await response.text()
                    raise MCPConnectionError(f"Get chapters request failed: {response.status} - {error_text}")
                    
        except Exception as e:
            logger.error(f"Error getting chapters for {book}: {e}")
            raise
    
    async def _test_connection(self) -> None:
        """Test the Bible API connection."""
        try:
            url = f"{self.base_url}/bibles"
            async with self.session.get(url) as response:
                if response.status == 200:
                    logger.info("Bible API connection test successful")
                else:
                    raise MCPConnectionError(f"Connection test failed: {response.status}")
        except Exception as e:
            logger.warning(f"Bible API connection test failed: {e}")
            raise
    
    async def _get_book_id(self, book_name: str) -> Optional[str]:
        """Get book ID from book name."""
        try:
            books_data = await self.get_books()
            books = books_data.get("books", [])
            
            # Try exact match first
            for book in books:
                if book.get("name", "").lower() == book_name.lower():
                    return book.get("id")
            
            # Try partial match
            for book in books:
                if book_name.lower() in book.get("name", "").lower():
                    return book.get("id")
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting book ID for {book_name}: {e}")
            return None
    
    async def _get_chapter_id(self, book_id: str, chapter_number: int) -> Optional[str]:
        """Get chapter ID from book ID and chapter number."""
        try:
            url = f"{self.base_url}/bibles/{self.bible_id}/books/{book_id}/chapters"
            
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    chapters = data.get("data", [])
                    
                    for chapter in chapters:
                        if chapter.get("number") == str(chapter_number):
                            return chapter.get("id")
                    
                    return None
                else:
                    return None
                    
        except Exception as e:
            logger.error(f"Error getting chapter ID: {e}")
            return None
    
    async def _get_verses(self, query: Dict[str, Any]) -> Dict[str, Any]:
        """Internal get verses method."""
        validate_query(query, ["book", "chapter"], ["verse_start", "verse_end"])
        
        book = query.get("book")
        chapter = query.get("chapter")
        verse_start = query.get("verse_start")
        verse_end = query.get("verse_end")
        
        return await self.get_verses(book, chapter, verse_start, verse_end)
    
    async def _search(self, query: Dict[str, Any]) -> Dict[str, Any]:
        """Internal search method."""
        validate_query(query, ["query"], ["limit"])
        
        search_query = query.get("query", "")
        limit = query.get("limit", 10)
        
        return await self.search(search_query, limit)
    
    async def _get_books(self, query: Dict[str, Any]) -> Dict[str, Any]:
        """Internal get books method."""
        return await self.get_books()
    
    async def _get_chapters(self, query: Dict[str, Any]) -> Dict[str, Any]:
        """Internal get chapters method."""
        validate_query(query, ["book"])
        
        book = query.get("book")
        return await self.get_chapters(book)

