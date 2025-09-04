"""
Error handling middleware for MCP servers.
"""

import logging
from typing import Dict, Any, Callable
from functools import wraps

from ..core.exceptions import MCPError, MCPConnectionError, MCPValidationError

logger = logging.getLogger(__name__)


class ErrorHandlingMiddleware:
    """Middleware for handling errors in MCP servers."""
    
    def __init__(self, log_errors: bool = True, return_errors: bool = True):
        self.log_errors = log_errors
        self.return_errors = return_errors
    
    def handle_error(self, error: Exception, context: str = "") -> Dict[str, Any]:
        """
        Handle an error and return a standardized error response.
        
        Args:
            error: The exception that occurred
            context: Additional context about where the error occurred
        
        Returns:
            Standardized error response dictionary
        """
        error_type = type(error).__name__
        error_message = str(error)
        
        if self.log_errors:
            logger.error(f"Error in {context}: {error_type} - {error_message}")
        
        # Determine error code based on exception type
        if isinstance(error, MCPValidationError):
            error_code = "VALIDATION_ERROR"
            status_code = 400
        elif isinstance(error, MCPConnectionError):
            error_code = "CONNECTION_ERROR"
            status_code = 503
        elif isinstance(error, MCPError):
            error_code = "MCP_ERROR"
            status_code = 500
        else:
            error_code = "UNKNOWN_ERROR"
            status_code = 500
        
        error_response = {
            "error": True,
            "error_type": error_type,
            "error_code": error_code,
            "message": error_message,
            "status_code": status_code
        }
        
        if context:
            error_response["context"] = context
        
        return error_response
    
    def __call__(self, func: Callable) -> Callable:
        """Decorator for applying error handling to functions."""
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                context = f"{func.__name__} in {func.__module__}"
                error_response = self.handle_error(e, context)
                
                if self.return_errors:
                    return error_response
                else:
                    raise e
        
        return wrapper

