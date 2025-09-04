# MCP (Model Context Protocol) Servers

This directory contains MCP server implementations for Shield AI services, providing a standardized interface for various external APIs and services.

## Architecture

The MCP servers are organized into the following structure:

```
mcp/
├── config/          # Configuration management
├── core/            # Base classes and utilities
├── services/        # Service implementations
├── middleware/      # Reusable middleware components
├── schemas/         # Type definitions and validation
└── tests/           # Test suite
```

## Services

### Bible API Server (`BibleAPIMCPServer`)
Handles Bible scripture retrieval and search operations.

**Features:**
- Get Bible verses by book, chapter, and verse range
- Search Bible text
- Get list of Bible books
- Get chapters for specific books

**Usage:**
```python
from mcp import BibleAPIMCPServer

server = BibleAPIMCPServer()
await server.initialize()

# Get verses
result = await server.query({
    "type": "get_verses",
    "book": "John",
    "chapter": 3,
    "verse_start": 16,
    "verse_end": 17
})

# Search Bible
result = await server.query({
    "type": "search",
    "query": "love",
    "limit": 10
})
```

### Pinecone Server (`PineconeMCPServer`)
Handles vector database operations using Pinecone.

**Features:**
- Vector similarity search
- Vector upsert operations
- Vector deletion
- Vector fetching by IDs
- Index statistics

**Usage:**
```python
from mcp import PineconeMCPServer

server = PineconeMCPServer()
await server.initialize()

# Search vectors
result = await server.query({
    "type": "search",
    "text": "search query",
    "top_k": 10
})

# Upsert vectors
result = await server.query({
    "type": "upsert",
    "vectors": [{"id": "1", "values": [0.1, 0.2, ...], "metadata": {...}}]
})
```

### Supabase Server (`SupabaseMCPServer`)
Handles database operations using Supabase.

**Features:**
- Select data from tables
- Insert data into tables
- Update existing records
- Delete records
- Upsert operations

**Usage:**
```python
from mcp import SupabaseMCPServer

server = SupabaseMCPServer()
await server.initialize()

# Select data
result = await server.query({
    "type": "select",
    "table": "users",
    "limit": 100,
    "filter": {"active": True}
})

# Insert data
result = await server.query({
    "type": "insert",
    "table": "users",
    "data": {"name": "John", "email": "john@example.com"}
})
```

## Configuration

Configuration is managed through the `Settings` class in `config/settings.py`. Environment variables are automatically loaded:

### Bible API
- `BIBLE_API_KEY`: API key for Bible API
- `BIBLE_API_BASE_URL`: Base URL for Bible API (default: https://api.scripture.api.bible/v1)
- `BIBLE_ID`: Bible version ID (default: de4e12af7f28f599-02)

### Pinecone
- `PINECONE_API_KEY`: API key for Pinecone
- `PINECONE_ENVIRONMENT`: Environment/region (default: us-east-1)
- `PINECONE_INDEX_NAME`: Index name (default: shieldai)
- `PINECONE_DIMENSION`: Vector dimension (default: 1024)

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key

## Middleware

The MCP servers support middleware for common concerns:

- **Authentication**: Token-based authentication
- **Rate Limiting**: Request rate limiting
- **Error Handling**: Standardized error responses

## Error Handling

All servers use standardized error handling with custom exceptions:

- `MCPError`: Base exception for all MCP errors
- `MCPConnectionError`: Connection-related errors
- `MCPValidationError`: Input validation errors

## Testing

Run tests using pytest:

```bash
pytest mcp/tests/
```

## Dependencies

- `aiohttp`: HTTP client for Bible API
- `pinecone-client`: Pinecone vector database client
- `supabase`: Supabase client library
- `pytest`: Testing framework
- `pytest-asyncio`: Async testing support

