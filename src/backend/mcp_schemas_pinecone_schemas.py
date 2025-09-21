"""
Schema definitions for Pinecone operations.
"""

from dataclasses import dataclass
from typing import List, Dict, Any, Optional


@dataclass
class PineconeSearchRequest:
    """Request schema for Pinecone search operations."""
    text: str
    top_k: int = 8
    filter: Optional[Dict[str, Any]] = None


@dataclass
class PineconeUpsertRequest:
    """Request schema for Pinecone upsert operations."""
    vectors: List[Dict[str, Any]]


@dataclass
class PineconeDeleteRequest:
    """Request schema for Pinecone delete operations."""
    ids: Optional[List[str]] = None
    filter: Optional[Dict[str, Any]] = None


@dataclass
class PineconeFetchRequest:
    """Request schema for Pinecone fetch operations."""
    ids: List[str]


@dataclass
class PineconeMatch:
    """Schema for a Pinecone match result."""
    id: str
    score: float
    metadata: Dict[str, Any]


@dataclass
class PineconeSearchResponse:
    """Response schema for Pinecone search operations."""
    matches: List[PineconeMatch]
    total_matches: int
    query: str


@dataclass
class PineconeUpsertResponse:
    """Response schema for Pinecone upsert operations."""
    upserted_count: int
    total_vectors: int


@dataclass
class PineconeDeleteResponse:
    """Response schema for Pinecone delete operations."""
    deleted_count: int
    operation: str


@dataclass
class PineconeFetchResponse:
    """Response schema for Pinecone fetch operations."""
    vectors: Dict[str, Any]
    fetched_count: int


@dataclass
class PineconeIndexStats:
    """Schema for Pinecone index statistics."""
    total_vector_count: int
    dimension: int
    index_fullness: float
    namespaces: Dict[str, Any]

