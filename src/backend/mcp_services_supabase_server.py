"""
Supabase MCP Server for Shield AI
Handles database operations using Supabase.
"""

import logging
from typing import Dict, Any, List, Optional
import asyncio
from supabase import create_client, Client
from supabase.lib.client_options import ClientOptions

from ..core.base_server import BaseMCPServer
from ..core.exceptions import MCPConnectionError, MCPValidationError
from ..core.utils import retry_async, validate_query
from ..config.settings import settings
from ..schemas.supabase_schemas import (
    SupabaseSelectRequest, SupabaseInsertRequest, SupabaseUpdateRequest,
    SupabaseDeleteRequest, SupabaseUpsertRequest, SupabaseResponse
)

logger = logging.getLogger(__name__)


class SupabaseMCPServer(BaseMCPServer):
    """MCP Server for Supabase database operations."""
    
    def __init__(self):
        super().__init__("supabase")
        self.client: Optional[Client] = None
        self.url = settings.supabase.url
        self.anon_key = settings.supabase.anon_key
        self.service_role_key = settings.supabase.service_role_key
        self.database_url = settings.supabase.database_url
    
    async def initialize(self) -> None:
        """Initialize Supabase client connection."""
        try:
            if not self.url or not self.anon_key:
                raise MCPValidationError("Supabase URL and anon key are required")
            
            # Create Supabase client
            self.client = create_client(
                self.url,
                self.anon_key,
                options=ClientOptions(
                    auto_refresh_token=True,
                    persist_session=True
                )
            )
            
            # Test connection
            await self._test_connection()
            
            self.is_initialized = True
            self._set_connection_status("connected")
            logger.info("Supabase MCP server initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Supabase MCP server: {e}")
            self._set_connection_status("error")
            raise MCPConnectionError(f"Failed to initialize Supabase: {e}")
    
    async def cleanup(self) -> None:
        """Clean up Supabase connections."""
        try:
            if self.client:
                # Close any active sessions
                self.client.auth.sign_out()
                self.client = None
            
            self.is_initialized = False
            self._set_connection_status("disconnected")
            logger.info("Supabase MCP server cleaned up successfully")
            
        except Exception as e:
            logger.error(f"Error cleaning up Supabase MCP server: {e}")
    
    async def query(self, query: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a query against Supabase."""
        self._validate_connection()
        self._update_activity()
        
        try:
            query_type = query.get("type", "select")
            
            if query_type == "select":
                return await self._select(query)
            elif query_type == "insert":
                return await self._insert(query)
            elif query_type == "update":
                return await self._update(query)
            elif query_type == "delete":
                return await self._delete(query)
            elif query_type == "upsert":
                return await self._upsert(query)
            else:
                raise MCPValidationError(f"Unknown query type: {query_type}")
                
        except Exception as e:
            logger.error(f"Error executing Supabase query: {e}")
            raise
    
    @retry_async(max_retries=3, delay=1.0)
    async def get_table_data(self, table: str, limit: int = 100) -> Dict[str, Any]:
        """Get data from a specific table."""
        self._validate_connection()
        
        try:
            result = self.client.table(table).select("*").limit(limit).execute()
            
            return {
                "data": result.data,
                "count": len(result.data),
                "table": table
            }
            
        except Exception as e:
            logger.error(f"Error getting table data from {table}: {e}")
            raise MCPConnectionError(f"Failed to get table data: {e}")
    
    @retry_async(max_retries=3, delay=1.0)
    async def insert_data(self, table: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert data into a table."""
        self._validate_connection()
        
        try:
            result = self.client.table(table).insert(data).execute()
            
            return {
                "data": result.data,
                "count": len(result.data) if result.data else 0,
                "table": table,
                "operation": "insert"
            }
            
        except Exception as e:
            logger.error(f"Error inserting data into {table}: {e}")
            raise MCPConnectionError(f"Failed to insert data: {e}")
    
    @retry_async(max_retries=3, delay=1.0)
    async def update_data(self, table: str, data: Dict[str, Any], filter_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Update data in a table."""
        self._validate_connection()
        
        try:
            query = self.client.table(table).update(data)
            
            # Apply filters
            for key, value in filter_dict.items():
                query = query.eq(key, value)
            
            result = query.execute()
            
            return {
                "data": result.data,
                "count": len(result.data) if result.data else 0,
                "table": table,
                "operation": "update"
            }
            
        except Exception as e:
            logger.error(f"Error updating data in {table}: {e}")
            raise MCPConnectionError(f"Failed to update data: {e}")
    
    @retry_async(max_retries=3, delay=1.0)
    async def delete_data(self, table: str, filter_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Delete data from a table."""
        self._validate_connection()
        
        try:
            query = self.client.table(table).delete()
            
            # Apply filters
            for key, value in filter_dict.items():
                query = query.eq(key, value)
            
            result = query.execute()
            
            return {
                "data": result.data,
                "count": len(result.data) if result.data else 0,
                "table": table,
                "operation": "delete"
            }
            
        except Exception as e:
            logger.error(f"Error deleting data from {table}: {e}")
            raise MCPConnectionError(f"Failed to delete data: {e}")
    
    async def _test_connection(self) -> None:
        """Test the Supabase connection."""
        try:
            # Try to get the current user (this will work even if not authenticated)
            self.client.auth.get_user()
            logger.info("Supabase connection test successful")
        except Exception as e:
            logger.warning(f"Supabase connection test failed: {e}")
            # Don't raise here as the connection might still work for public operations
    
    async def _select(self, query: Dict[str, Any]) -> Dict[str, Any]:
        """Internal select method."""
        validate_query(query, ["table"], ["columns", "limit", "filter", "order_by"])
        
        table = query.get("table")
        columns = query.get("columns", "*")
        limit = query.get("limit", 100)
        filter_dict = query.get("filter", {})
        order_by = query.get("order_by")
        
        try:
            db_query = self.client.table(table).select(columns)
            
            # Apply filters
            for key, value in filter_dict.items():
                db_query = db_query.eq(key, value)
            
            # Apply ordering
            if order_by:
                db_query = db_query.order(order_by)
            
            # Apply limit
            db_query = db_query.limit(limit)
            
            result = db_query.execute()
            
            return {
                "data": result.data,
                "count": len(result.data),
                "table": table
            }
            
        except Exception as e:
            logger.error(f"Error in select operation: {e}")
            raise MCPConnectionError(f"Select operation failed: {e}")
    
    async def _insert(self, query: Dict[str, Any]) -> Dict[str, Any]:
        """Internal insert method."""
        validate_query(query, ["table", "data"])
        
        table = query.get("table")
        data = query.get("data", {})
        
        return await self.insert_data(table, data)
    
    async def _update(self, query: Dict[str, Any]) -> Dict[str, Any]:
        """Internal update method."""
        validate_query(query, ["table", "data", "filter"])
        
        table = query.get("table")
        data = query.get("data", {})
        filter_dict = query.get("filter", {})
        
        return await self.update_data(table, data, filter_dict)
    
    async def _delete(self, query: Dict[str, Any]) -> Dict[str, Any]:
        """Internal delete method."""
        validate_query(query, ["table", "filter"])
        
        table = query.get("table")
        filter_dict = query.get("filter", {})
        
        return await self.delete_data(table, filter_dict)
    
    async def _upsert(self, query: Dict[str, Any]) -> Dict[str, Any]:
        """Internal upsert method."""
        validate_query(query, ["table", "data"], ["on_conflict"])
        
        table = query.get("table")
        data = query.get("data", {})
        on_conflict = query.get("on_conflict")
        
        try:
            db_query = self.client.table(table).upsert(data)
            
            if on_conflict:
                db_query = db_query.on_conflict(on_conflict)
            
            result = db_query.execute()
            
            return {
                "data": result.data,
                "count": len(result.data) if result.data else 0,
                "table": table,
                "operation": "upsert"
            }
            
        except Exception as e:
            logger.error(f"Error in upsert operation: {e}")
            raise MCPConnectionError(f"Upsert operation failed: {e}")

