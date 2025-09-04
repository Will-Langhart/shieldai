"""
Tests for BaseMCPServer.
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock

from ..core.base_server import BaseMCPServer
from ..core.exceptions import MCPConnectionError


class TestMCPServer(BaseMCPServer):
    """Test implementation of BaseMCPServer."""
    
    async def initialize(self) -> None:
        self.is_initialized = True
        self.connection_status = "connected"
    
    async def cleanup(self) -> None:
        self.is_initialized = False
        self.connection_status = "disconnected"
    
    async def query(self, query: dict) -> dict:
        return {"result": "test"}


class TestBaseMCPServer:
    """Test cases for BaseMCPServer."""
    
    def test_initialization(self):
        """Test server initialization."""
        server = TestMCPServer("test_service")
        assert server.service_name == "test_service"
        assert not server.is_initialized
        assert server.connection_status == "disconnected"
    
    @pytest.mark.asyncio
    async def test_initialize(self):
        """Test server initialization process."""
        server = TestMCPServer("test_service")
        await server.initialize()
        assert server.is_initialized
        assert server.connection_status == "connected"
    
    @pytest.mark.asyncio
    async def test_cleanup(self):
        """Test server cleanup process."""
        server = TestMCPServer("test_service")
        await server.initialize()
        await server.cleanup()
        assert not server.is_initialized
        assert server.connection_status == "disconnected"
    
    @pytest.mark.asyncio
    async def test_get_status(self):
        """Test getting server status."""
        server = TestMCPServer("test_service")
        status = await server.get_status()
        
        assert "service_name" in status
        assert "is_initialized" in status
        assert "connection_status" in status
        assert "timestamp" in status
        assert status["service_name"] == "test_service"
    
    @pytest.mark.asyncio
    async def test_health_check(self):
        """Test health check functionality."""
        server = TestMCPServer("test_service")
        
        # Should return False when not initialized
        assert not await server.health_check()
        
        # Should return True when initialized and connected
        await server.initialize()
        assert await server.health_check()
        
        # Should return False when disconnected
        server.connection_status = "disconnected"
        assert not await server.health_check()
    
    @pytest.mark.asyncio
    async def test_query(self):
        """Test query execution."""
        server = TestMCPServer("test_service")
        await server.initialize()
        
        result = await server.query({"test": "query"})
        assert result == {"result": "test"}
    
    def test_validate_initialized(self):
        """Test initialization validation."""
        server = TestMCPServer("test_service")
        
        with pytest.raises(MCPConnectionError):
            server._validate_initialized()
        
        server.is_initialized = True
        # Should not raise
        server._validate_initialized()
    
    def test_validate_connection(self):
        """Test connection validation."""
        server = TestMCPServer("test_service")
        
        # Should raise when not initialized
        with pytest.raises(MCPConnectionError):
            server._validate_connection()
        
        server.is_initialized = True
        server.connection_status = "disconnected"
        
        # Should raise when not connected
        with pytest.raises(MCPConnectionError):
            server._validate_connection()
        
        server.connection_status = "connected"
        # Should not raise
        server._validate_connection()

