"""
Pinecone MCP Server for Shield AI
Handles vector database operations using Pinecone.
"""

import logging
from typing import Dict, Any, List, Optional
import asyncio
from pinecone import Pinecone, PineconeException, ServerlessSpec

from ..core.base_server import BaseMCPServer
from ..core.exceptions import MCPConnectionError, MCPValidationError
from ..core.utils import retry_async, validate_query
from ..config.settings import settings
from ..schemas.pinecone_schemas import (
    PineconeSearchRequest, PineconeUpsertRequest, PineconeDeleteRequest, PineconeFetchRequest,
    PineconeSearchResponse, PineconeUpsertResponse, PineconeDeleteResponse, PineconeFetchResponse
)

logger = logging.getLogger(__name__)


class PineconeMCPServer(BaseMCPServer):
    """MCP Server for Pinecone vector database operations."""
    
    def __init__(self):
        super().__init__("pinecone")
        self.pc = None
        self.index = None
        self.index_name = settings.pinecone.index_name
        self.dimension = settings.pinecone.dimension
        self.top_k = settings.pinecone.top_k
        self.min_similarity = settings.pinecone.min_similarity
        self.batch_size = settings.pinecone.batch_size
        self.max_retries = settings.pinecone.max_retries
        self.backoff_ms = settings.pinecone.backoff_ms
    
    async def initialize(self) -> None:
        """Initialize Pinecone connection and index."""
        try:
            api_key = settings.pinecone.api_key
            environment = settings.pinecone.environment
            
            if not api_key:
                raise MCPValidationError("PINECONE_API_KEY environment variable is required")
            
            # Initialize Pinecone client
            self.pc = Pinecone(api_key=api_key)
            
            # Check if index exists, create if not
            if self.index_name not in self.pc.list_indexes().names():
                logger.info(f"Creating Pinecone index: {self.index_name}")
                self.pc.create_index(
                    name=self.index_name,
                    dimension=self.dimension,
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud="aws",
                        region=environment
                    )
                )
                
                # Wait for index to be ready
                while not self.pc.describe_index(self.index_name).status['ready']:
                    await asyncio.sleep(1)
                    logger.info("Waiting for index to be ready...")
            
            # Connect to index
            self.index = self.pc.Index(self.index_name)
            
            self.is_initialized = True
            self._set_connection_status("connected")
            logger.info(f"Pinecone MCP server initialized successfully with index: {self.index_name}")
            
        except Exception as e:
            logger.error(f"Failed to initialize Pinecone MCP server: {e}")
            self._set_connection_status("error")
            raise MCPConnectionError(f"Failed to initialize Pinecone: {e}")
    
    async def cleanup(self) -> None:
        """Clean up Pinecone connections."""
        try:
            if self.index:
                self.index = None
            if self.pc:
                self.pc = None
            
            self.is_initialized = False
            self._set_connection_status("disconnected")
            logger.info("Pinecone MCP server cleaned up successfully")
            
        except Exception as e:
            logger.error(f"Error cleaning up Pinecone MCP server: {e}")
    
    async def query(self, query: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a query against Pinecone."""
        self._validate_connection()
        self._update_activity()
        
        try:
            query_type = query.get("type", "search")
            
            if query_type == "search":
                return await self._search(query)
            elif query_type == "upsert":
                return await self._upsert(query)
            elif query_type == "delete":
                return await self._delete(query)
            elif query_type == "fetch":
                return await self._fetch(query)
            else:
                raise MCPValidationError(f"Unknown query type: {query_type}")
                
        except Exception as e:
            logger.error(f"Error executing Pinecone query: {e}")
            raise
    
    @retry_async(max_retries=3, delay=1.0)
    async def search(self, query_text: str, top_k: Optional[int] = None, filter_dict: Optional[Dict] = None) -> Dict[str, Any]:
        """Search for similar vectors."""
        self._validate_connection()
        
        try:
            top_k = top_k or self.top_k
            
            # For text queries, we would typically embed the text first
            # This is a simplified version - in practice, you'd use an embedding model
            result = self.index.query(
                vector=[0.0] * self.dimension,  # Placeholder vector
                top_k=top_k,
                include_metadata=True,
                filter=filter_dict
            )
            
            return {
                "matches": result.matches,
                "total_matches": len(result.matches),
                "query": query_text
            }
            
        except PineconeException as e:
            logger.error(f"Pinecone search error: {e}")
            raise MCPConnectionError(f"Pinecone search failed: {e}")
    
    @retry_async(max_retries=3, delay=1.0)
    async def upsert(self, vectors: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Upsert vectors to the index."""
        self._validate_connection()
        
        try:
            # Process vectors in batches
            total_upserted = 0
            for i in range(0, len(vectors), self.batch_size):
                batch = vectors[i:i + self.batch_size]
                self.index.upsert(vectors=batch)
                total_upserted += len(batch)
            
            return {
                "upserted_count": total_upserted,
                "total_vectors": len(vectors)
            }
            
        except PineconeException as e:
            logger.error(f"Pinecone upsert error: {e}")
            raise MCPConnectionError(f"Pinecone upsert failed: {e}")
    
    async def _search(self, query: Dict[str, Any]) -> Dict[str, Any]:
        """Internal search method."""
        validate_query(query, ["text"], ["top_k", "filter"])
        
        query_text = query.get("text", "")
        top_k = query.get("top_k", self.top_k)
        filter_dict = query.get("filter")
        
        return await self.search(query_text, top_k, filter_dict)
    
    async def _upsert(self, query: Dict[str, Any]) -> Dict[str, Any]:
        """Internal upsert method."""
        validate_query(query, ["vectors"])
        
        vectors = query.get("vectors", [])
        return await self.upsert(vectors)
    
    async def _delete(self, query: Dict[str, Any]) -> Dict[str, Any]:
        """Delete vectors from the index."""
        self._validate_connection()
        
        try:
            ids = query.get("ids", [])
            filter_dict = query.get("filter")
            
            if ids:
                self.index.delete(ids=ids)
            elif filter_dict:
                self.index.delete(filter=filter_dict)
            else:
                raise MCPValidationError("Either 'ids' or 'filter' must be provided for delete operation")
            
            return {
                "deleted_count": len(ids) if ids else "filtered",
                "operation": "delete"
            }
            
        except PineconeException as e:
            logger.error(f"Pinecone delete error: {e}")
            raise MCPConnectionError(f"Pinecone delete failed: {e}")
    
    async def _fetch(self, query: Dict[str, Any]) -> Dict[str, Any]:
        """Fetch vectors by IDs."""
        self._validate_connection()
        
        try:
            ids = query.get("ids", [])
            if not ids:
                raise MCPValidationError("IDs must be provided for fetch operation")
            
            result = self.index.fetch(ids=ids)
            
            return {
                "vectors": result.vectors,
                "fetched_count": len(result.vectors)
            }
            
        except PineconeException as e:
            logger.error(f"Pinecone fetch error: {e}")
            raise MCPConnectionError(f"Pinecone fetch failed: {e}")
    
    async def get_index_stats(self) -> Dict[str, Any]:
        """Get index statistics."""
        self._validate_connection()
        
        try:
            stats = self.index.describe_index_stats()
            return {
                "total_vector_count": stats.total_vector_count,
                "dimension": stats.dimension,
                "index_fullness": stats.index_fullness,
                "namespaces": stats.namespaces
            }
            
        except PineconeException as e:
            logger.error(f"Error getting index stats: {e}")
            raise MCPConnectionError(f"Failed to get index stats: {e}")

