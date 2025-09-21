"""
Rate limiting middleware for MCP servers.
"""

import asyncio
import time
import logging
from typing import Dict, Any
from collections import defaultdict, deque

logger = logging.getLogger(__name__)


class RateLimitingMiddleware:
    """Middleware for rate limiting requests."""
    
    def __init__(self, max_requests: int = 100, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(lambda: deque())
    
    def is_allowed(self, client_id: str) -> bool:
        """
        Check if a request from the given client is allowed.
        
        Args:
            client_id: Unique identifier for the client
        
        Returns:
            True if request is allowed
        """
        now = time.time()
        client_requests = self.requests[client_id]
        
        # Remove old requests outside the window
        while client_requests and client_requests[0] <= now - self.window_seconds:
            client_requests.popleft()
        
        # Check if we're under the limit
        if len(client_requests) >= self.max_requests:
            logger.warning(f"Rate limit exceeded for client {client_id}")
            return False
        
        # Add current request
        client_requests.append(now)
        return True
    
    def get_remaining_requests(self, client_id: str) -> int:
        """
        Get the number of remaining requests for a client.
        
        Args:
            client_id: Unique identifier for the client
        
        Returns:
            Number of remaining requests
        """
        now = time.time()
        client_requests = self.requests[client_id]
        
        # Remove old requests outside the window
        while client_requests and client_requests[0] <= now - self.window_seconds:
            client_requests.popleft()
        
        return max(0, self.max_requests - len(client_requests))
    
    def __call__(self, func):
        """Decorator for applying rate limiting to functions."""
        async def wrapper(*args, **kwargs):
            # Extract client_id from kwargs or request context
            client_id = kwargs.get('client_id') or getattr(args[0], 'client_id', 'default')
            
            if not self.is_allowed(client_id):
                raise RateLimitExceededError(
                    f"Rate limit exceeded. Try again in {self.window_seconds} seconds."
                )
            
            return await func(*args, **kwargs)
        
        return wrapper


class RateLimitExceededError(Exception):
    """Exception raised when rate limit is exceeded."""
    pass

