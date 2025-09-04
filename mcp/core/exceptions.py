"""
Custom exceptions for MCP servers.
"""


class MCPError(Exception):
    """Base exception for MCP server errors."""
    pass


class MCPConnectionError(MCPError):
    """Exception raised when MCP server connection fails."""
    pass


class MCPValidationError(MCPError):
    """Exception raised when query validation fails."""
    pass


class MCPInitializationError(MCPError):
    """Exception raised when MCP server initialization fails."""
    pass


class MCPQueryError(MCPError):
    """Exception raised when query execution fails."""
    pass

