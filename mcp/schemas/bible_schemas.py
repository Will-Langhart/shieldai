"""
Schema definitions for Bible API operations.
"""

from dataclasses import dataclass
from typing import Optional, List, Dict, Any


@dataclass
class BibleVerseRequest:
    """Request schema for getting Bible verses."""
    book: str
    chapter: int
    verse_start: Optional[int] = None
    verse_end: Optional[int] = None


@dataclass
class BibleSearchRequest:
    """Request schema for searching Bible text."""
    query: str
    limit: int = 10


@dataclass
class BibleBooksRequest:
    """Request schema for getting Bible books."""
    pass  # No additional parameters needed


@dataclass
class BibleChaptersRequest:
    """Request schema for getting Bible chapters."""
    book: str


@dataclass
class BibleVerse:
    """Schema for a Bible verse."""
    text: str
    reference: str
    book: str
    chapter: int
    verse: Optional[int] = None
    verse_start: Optional[int] = None
    verse_end: Optional[int] = None


@dataclass
class BibleBook:
    """Schema for a Bible book."""
    id: str
    name: str
    abbreviation: str
    testament: str


@dataclass
class BibleChapter:
    """Schema for a Bible chapter."""
    id: str
    number: str
    book_id: str


@dataclass
class BibleVerseResponse:
    """Response schema for Bible verse operations."""
    verses: str
    book: str
    chapter: int
    verse_range: Optional[str] = None
    bible_id: str = "de4e12af7f28f599-02"


@dataclass
class BibleSearchResponse:
    """Response schema for Bible search operations."""
    results: List[Dict[str, Any]]
    query: str
    total_results: int
    bible_id: str = "de4e12af7f28f599-02"


@dataclass
class BibleBooksResponse:
    """Response schema for Bible books operations."""
    books: List[BibleBook]
    bible_id: str = "de4e12af7f28f599-02"


@dataclass
class BibleChaptersResponse:
    """Response schema for Bible chapters operations."""
    chapters: List[BibleChapter]
    book: str
    book_id: str
    bible_id: str = "de4e12af7f28f599-02"

