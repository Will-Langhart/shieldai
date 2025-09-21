"""
Shield AI - Main FastAPI Application
A Christian AI assistant with Bible integration and church finder capabilities.
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import uvicorn

# Import MCP servers
from mcp.pinecone_server import PineconeMCPServer
from mcp.supabase_server import SupabaseMCPServer
from mcp.bible_api_server import BibleAPIMCPServer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global MCP server instances
mcp_servers: Dict[str, Any] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown events."""
    # Startup
    logger.info("Starting Shield AI FastAPI application...")
    
    try:
        # Initialize MCP servers
        mcp_servers["pinecone"] = PineconeMCPServer()
        mcp_servers["supabase"] = SupabaseMCPServer()
        mcp_servers["bible_api"] = BibleAPIMCPServer()
        
        # Initialize each MCP server
        for name, server in mcp_servers.items():
            await server.initialize()
            logger.info(f"Initialized {name} MCP server")
        
        logger.info("All MCP servers initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize MCP servers: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down Shield AI FastAPI application...")
    for name, server in mcp_servers.items():
        try:
            await server.cleanup()
            logger.info(f"Cleaned up {name} MCP server")
        except Exception as e:
            logger.error(f"Error cleaning up {name} MCP server: {e}")

# Create FastAPI application
app = FastAPI(
    title="Shield AI",
    description="A Christian AI assistant with Bible integration and church finder capabilities",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001", 
        "https://shieldai.vercel.app",
        "https://shieldai.cloud"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "shieldai.vercel.app", "shieldai.com"]
)

# Mount static files for frontend
app.mount("/static", StaticFiles(directory="frontend/build/static"), name="static")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "message": "Shield AI is running"}

# API routes
@app.get("/api/status")
async def api_status():
    """API status endpoint."""
    return {
        "status": "operational",
        "version": "1.0.0",
        "services": {
            "pinecone": "connected" if mcp_servers.get("pinecone") else "disconnected",
            "supabase": "connected" if mcp_servers.get("supabase") else "disconnected",
            "bible_api": "connected" if mcp_servers.get("bible_api") else "disconnected"
        }
    }

# MCP server endpoints
@app.get("/api/mcp/{service_name}/status")
async def mcp_service_status(service_name: str):
    """Get status of a specific MCP service."""
    if service_name not in mcp_servers:
        raise HTTPException(status_code=404, detail=f"MCP service '{service_name}' not found")
    
    server = mcp_servers[service_name]
    return await server.get_status()

@app.post("/api/mcp/{service_name}/query")
async def mcp_service_query(service_name: str, query: Dict[str, Any]):
    """Query a specific MCP service."""
    if service_name not in mcp_servers:
        raise HTTPException(status_code=404, detail=f"MCP service '{service_name}' not found")
    
    server = mcp_servers[service_name]
    try:
        result = await server.query(query)
        return result
    except Exception as e:
        logger.error(f"Error querying {service_name} MCP server: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Bible API endpoints
@app.get("/api/bible/verses")
async def get_bible_verses(
    book: str,
    chapter: int,
    verse_start: Optional[int] = None,
    verse_end: Optional[int] = None
):
    """Get Bible verses from a specific book and chapter."""
    bible_server = mcp_servers.get("bible_api")
    if not bible_server:
        raise HTTPException(status_code=503, detail="Bible API service not available")
    
    try:
        result = await bible_server.get_verses(book, chapter, verse_start, verse_end)
        return result
    except Exception as e:
        logger.error(f"Error getting Bible verses: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/bible/search")
async def search_bible(query: str, limit: int = 10):
    """Search Bible text."""
    bible_server = mcp_servers.get("bible_api")
    if not bible_server:
        raise HTTPException(status_code=503, detail="Bible API service not available")
    
    try:
        result = await bible_server.search(query, limit)
        return result
    except Exception as e:
        logger.error(f"Error searching Bible: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Pinecone vector search endpoints
@app.post("/api/vector/search")
async def vector_search(query: str, top_k: int = 8):
    """Search vector database using Pinecone."""
    pinecone_server = mcp_servers.get("pinecone")
    if not pinecone_server:
        raise HTTPException(status_code=503, detail="Pinecone service not available")
    
    try:
        result = await pinecone_server.search(query, top_k)
        return result
    except Exception as e:
        logger.error(f"Error searching vectors: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/vector/upsert")
async def vector_upsert(vectors: list):
    """Upsert vectors to Pinecone."""
    pinecone_server = mcp_servers.get("pinecone")
    if not pinecone_server:
        raise HTTPException(status_code=503, detail="Pinecone service not available")
    
    try:
        result = await pinecone_server.upsert(vectors)
        return result
    except Exception as e:
        logger.error(f"Error upserting vectors: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Supabase database endpoints
@app.get("/api/db/{table}")
async def get_table_data(table: str, limit: int = 100):
    """Get data from a Supabase table."""
    supabase_server = mcp_servers.get("supabase")
    if not supabase_server:
        raise HTTPException(status_code=503, detail="Supabase service not available")
    
    try:
        result = await supabase_server.get_table_data(table, limit)
        return result
    except Exception as e:
        logger.error(f"Error getting table data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/db/{table}")
async def insert_table_data(table: str, data: Dict[str, Any]):
    """Insert data into a Supabase table."""
    supabase_server = mcp_servers.get("supabase")
    if not supabase_server:
        raise HTTPException(status_code=503, detail="Supabase service not available")
    
    try:
        result = await supabase_server.insert_data(table, data)
        return result
    except Exception as e:
        logger.error(f"Error inserting data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    """Handle 404 errors."""
    return JSONResponse(
        status_code=404,
        content={"detail": "The requested resource was not found"}
    )

@app.exception_handler(500)
async def internal_error_handler(request: Request, exc: HTTPException):
    """Handle 500 errors."""
    logger.error(f"Internal server error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

if __name__ == "__main__":
    # Development server
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
