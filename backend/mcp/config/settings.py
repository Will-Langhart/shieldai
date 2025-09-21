"""
Configuration settings for MCP servers.
"""

import os
from typing import Optional
from dataclasses import dataclass


@dataclass
class BibleAPISettings:
    """Bible API configuration settings."""
    api_key: Optional[str] = None
    base_url: str = "https://api.scripture.api.bible/v1"
    bible_id: str = "de4e12af7f28f599-02"  # Default to ESV
    timeout: int = 30


@dataclass
class PineconeSettings:
    """Pinecone configuration settings."""
    api_key: Optional[str] = None
    environment: str = "us-east-1"
    index_name: str = "shieldai"
    dimension: int = 1024
    top_k: int = 8
    min_similarity: float = 0.18
    batch_size: int = 50
    max_retries: int = 3
    backoff_ms: int = 300


@dataclass
class SupabaseSettings:
    """Supabase configuration settings."""
    url: Optional[str] = None
    anon_key: Optional[str] = None
    service_role_key: Optional[str] = None
    database_url: Optional[str] = None


class Settings:
    """Main settings class for MCP servers."""
    
    def __init__(self):
        self.bible_api = BibleAPISettings(
            api_key=os.getenv("BIBLE_API_KEY"),
            base_url=os.getenv("BIBLE_API_BASE_URL", "https://api.scripture.api.bible/v1"),
            bible_id=os.getenv("BIBLE_ID", "de4e12af7f28f599-02"),
            timeout=int(os.getenv("BIBLE_API_TIMEOUT", "30"))
        )
        
        self.pinecone = PineconeSettings(
            api_key=os.getenv("PINECONE_API_KEY"),
            environment=os.getenv("PINECONE_ENVIRONMENT", "us-east-1"),
            index_name=os.getenv("PINECONE_INDEX_NAME", "shieldai"),
            dimension=int(os.getenv("PINECONE_DIMENSION", "1024")),
            top_k=int(os.getenv("PINECONE_TOPK", "8")),
            min_similarity=float(os.getenv("PINECONE_MIN_SIMILARITY", "0.18")),
            batch_size=int(os.getenv("PINECONE_BATCH_SIZE", "50")),
            max_retries=int(os.getenv("PINECONE_MAX_RETRIES", "3")),
            backoff_ms=int(os.getenv("PINECONE_BACKOFF_MS", "300"))
        )
        
        self.supabase = SupabaseSettings(
            url=os.getenv("NEXT_PUBLIC_SUPABASE_URL"),
            anon_key=os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
            service_role_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
            database_url=os.getenv("DATABASE_URL")
        )
    
    def validate(self) -> bool:
        """Validate that all required settings are present."""
        errors = []
        
        if not self.bible_api.api_key:
            errors.append("BIBLE_API_KEY is required")
        
        if not self.pinecone.api_key:
            errors.append("PINECONE_API_KEY is required")
        
        if not self.supabase.url:
            errors.append("NEXT_PUBLIC_SUPABASE_URL is required")
        
        if not self.supabase.anon_key:
            errors.append("NEXT_PUBLIC_SUPABASE_ANON_KEY is required")
        
        if errors:
            raise ValueError(f"Configuration validation failed: {', '.join(errors)}")
        
        return True


# Global settings instance
settings = Settings()

