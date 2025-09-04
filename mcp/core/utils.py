"""
Utility functions for MCP servers.
"""

import asyncio
import logging
from typing import Any, Dict, Callable, Optional
from functools import wraps

logger = logging.getLogger(__name__)


def retry_async(
    max_retries: int = 3,
    delay: float = 1.0,
    backoff_factor: float = 2.0,
    exceptions: tuple = (Exception,)
):
    """
    Decorator for retrying async functions with exponential backoff.
    
    Args:
        max_retries: Maximum number of retry attempts
        delay: Initial delay between retries in seconds
        backoff_factor: Multiplier for delay after each retry
        exceptions: Tuple of exceptions to catch and retry on
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_delay = delay
            last_exception = None
            
            for attempt in range(max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    if attempt == max_retries:
                        logger.error(f"Function {func.__name__} failed after {max_retries} retries: {e}")
                        raise e
                    
                    logger.warning(f"Function {func.__name__} failed (attempt {attempt + 1}/{max_retries + 1}): {e}")
                    await asyncio.sleep(current_delay)
                    current_delay *= backoff_factor
            
            # This should never be reached, but just in case
            raise last_exception
        
        return wrapper
    return decorator


def validate_query(query: Dict[str, Any], required_fields: list, optional_fields: list = None) -> bool:
    """
    Validate a query dictionary against required and optional fields.
    
    Args:
        query: Query dictionary to validate
        required_fields: List of required field names
        optional_fields: List of optional field names
    
    Returns:
        True if validation passes
    
    Raises:
        MCPValidationError: If validation fails
    """
    from .exceptions import MCPValidationError
    
    if not isinstance(query, dict):
        raise MCPValidationError("Query must be a dictionary")
    
    # Check required fields
    missing_fields = [field for field in required_fields if field not in query]
    if missing_fields:
        raise MCPValidationError(f"Missing required fields: {', '.join(missing_fields)}")
    
    # Check for unknown fields
    all_valid_fields = set(required_fields)
    if optional_fields:
        all_valid_fields.update(optional_fields)
    
    unknown_fields = [field for field in query.keys() if field not in all_valid_fields]
    if unknown_fields:
        logger.warning(f"Unknown fields in query: {', '.join(unknown_fields)}")
    
    return True


def sanitize_query(query: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitize a query dictionary by removing None values and empty strings.
    
    Args:
        query: Query dictionary to sanitize
    
    Returns:
        Sanitized query dictionary
    """
    return {
        key: value for key, value in query.items()
        if value is not None and value != ""
    }


def format_error_message(error: Exception, context: str = "") -> str:
    """
    Format an error message with optional context.
    
    Args:
        error: Exception to format
        context: Optional context string
    
    Returns:
        Formatted error message
    """
    message = str(error)
    if context:
        message = f"{context}: {message}"
    return message

