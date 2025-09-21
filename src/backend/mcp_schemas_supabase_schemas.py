"""
Schema definitions for Supabase operations.
"""

from dataclasses import dataclass
from typing import List, Dict, Any, Optional


@dataclass
class SupabaseSelectRequest:
    """Request schema for Supabase select operations."""
    table: str
    columns: str = "*"
    limit: int = 100
    filter: Optional[Dict[str, Any]] = None
    order_by: Optional[str] = None


@dataclass
class SupabaseInsertRequest:
    """Request schema for Supabase insert operations."""
    table: str
    data: Dict[str, Any]


@dataclass
class SupabaseUpdateRequest:
    """Request schema for Supabase update operations."""
    table: str
    data: Dict[str, Any]
    filter: Dict[str, Any]


@dataclass
class SupabaseDeleteRequest:
    """Request schema for Supabase delete operations."""
    table: str
    filter: Dict[str, Any]


@dataclass
class SupabaseUpsertRequest:
    """Request schema for Supabase upsert operations."""
    table: str
    data: Dict[str, Any]
    on_conflict: Optional[str] = None


@dataclass
class SupabaseResponse:
    """Response schema for Supabase operations."""
    data: List[Dict[str, Any]]
    count: int
    table: str
    operation: Optional[str] = None

