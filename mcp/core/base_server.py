"""
Base MCP Server class for Shield AI services.
"""

import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import asyncio
from datetime import datetime

from .exceptions import MCPError, MCPConnectionError, MCPValidationError

logger = logging.getLogger(__name__)


class BaseMCPServer(ABC):
    """Base class for all MCP servers."""
    
    def __init__(self, service_name: str):
        self.service_name = service_name
        self.is_initialized = False
        self.connection_status = "disconnected"
        self.created_at = datetime.utcnow()
        self.last_activity = None
        
    @abstractmethod
    async def initialize(self) -> None:
        """Initialize the MCP server connection."""
        pass
    
    @abstractmethod
    async def cleanup(self) -> None:
        """Clean up resources and close connections."""
        pass
    
    @abstractmethod
    async def query(self, query: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a query against the service."""
        pass
    
    async def get_status(self) -> Dict[str, Any]:
        """Get the current status of the MCP server."""
        return {
            "service_name": self.service_name,
            "is_initialized": self.is_initialized,
            "connection_status": self.connection_status,
            "created_at": self.created_at.isoformat(),
            "last_activity": self.last_activity.isoformat() if self.last_activity else None,
            "timestamp": asyncio.get_event_loop().time()
        }
    
    async def health_check(self) -> bool:
        """Perform a health check on the service."""
        try:
            # Default health check - can be overridden
            return self.is_initialized and self.connection_status == "connected"
        except Exception as e:
            logger.error(f"Health check failed for {self.service_name}: {e}")
            return False
    
    def _update_activity(self) -> None:
        """Update the last activity timestamp."""
        self.last_activity = datetime.utcnow()
    
    def _set_connection_status(self, status: str) -> None:
        """Set the connection status and log the change."""
        old_status = self.connection_status
        self.connection_status = status
        logger.info(f"{self.service_name} connection status changed: {old_status} -> {status}")
    
    def _validate_initialized(self) -> None:
        """Validate that the server is initialized."""
        if not self.is_initialized:
            raise MCPConnectionError(f"{self.service_name} server not initialized")
    
    def _validate_connection(self) -> None:
        """Validate that the server has an active connection."""
        self._validate_initialized()
        if self.connection_status != "connected":
            raise MCPConnectionError(f"{self.service_name} server not connected")

