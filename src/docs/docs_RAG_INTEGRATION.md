# RAG Integration with OpenAI and MCP Servers

This document describes the Retrieval-Augmented Generation (RAG) integration for Shield AI, which combines OpenAI's language models with our MCP (Model Context Protocol) servers to provide biblically-grounded responses.

## Architecture Overview

The RAG system consists of three main components:

1. **OpenAI Integration**: Handles the language model processing
2. **MCP Servers**: Provide context from various data sources
3. **Frontend Chat Service**: Manages the user interface and API calls

## MCP Servers

### 1. Bible API Server (`bible_api_server.py`)
- **Purpose**: Retrieves Bible verses and content from the Bible API
- **Features**:
  - Search Bible text by keywords
  - Get specific verses by book, chapter, and verse
  - Retrieve book and chapter information
  - Supports multiple Bible translations

### 2. Pinecone Server (`pinecone_server.py`)
- **Purpose**: Vector database for semantic search of Bible content
- **Features**:
  - Semantic search using embeddings
  - Vector similarity matching
  - Metadata filtering
  - Batch operations for efficiency

### 3. Supabase Server (`supabase_server.py`)
- **Purpose**: Database operations for conversation storage
- **Features**:
  - Store conversation history
  - Retrieve past conversations
  - User authentication
  - Message metadata storage

## RAG Workflow

1. **User Input**: User sends a message through the chat interface
2. **Context Retrieval**: 
   - Search Pinecone for semantically relevant Bible verses
   - Query Bible API for additional context
   - Retrieve conversation history from Supabase
3. **Context Assembly**: Combine all retrieved context into a comprehensive prompt
4. **OpenAI Processing**: Send the enhanced prompt to OpenAI for response generation
5. **Response Delivery**: Return the biblically-grounded response to the user

## API Endpoints

### `/api/chat-rag` (POST)
Main RAG endpoint that processes chat messages with context retrieval.

**Request Body:**
```json
{
  "message": "What does the Bible say about love?",
  "conversationId": "optional-conversation-id",
  "mode": "gentle|scholarly|debate",
  "stream": false
}
```

**Response:**
```json
{
  "response": "AI-generated response with biblical context",
  "mode": "gentle",
  "timestamp": "2024-01-01T00:00:00Z",
  "conversationId": "conversation-id",
  "context": {
    "relevant_verses": [...],
    "bible_search_results": [...],
    "conversation_history_length": 5
  },
  "metadata": {
    "model": "gpt-4-turbo-preview",
    "max_tokens": 4000,
    "temperature": 0.8,
    "processing_time_ms": 1500
  }
}
```

## Environment Variables

Required environment variables for the RAG system:

```bash
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Bible API
BIBLE_API_KEY=your_bible_api_key
BIBLE_API_BASE_URL=https://api.scripture.api.bible/v1
BIBLE_ID=de4e12af7f28f599-02

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=shield-ai-bible

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Frontend Integration

The frontend chat service has been updated to use the RAG endpoint:

```typescript
// Send a message with RAG
const response = await chatService.sendMessage(
  "What does the Bible say about love?",
  conversationId,
  'gentle',
  false // stream
);
```

## Testing

### 1. Test MCP Servers
```bash
cd /path/to/shieldai
python mcp/run_servers.py
```

### 2. Test RAG Integration
```bash
cd /path/to/shieldai
python tests/test_rag_integration.py
```

### 3. Test Frontend
```bash
cd apps/frontend
npm run dev
```

## Configuration

### Model Selection
The system uses different OpenAI models based on the mode:
- **Gentle**: `gpt-3.5-turbo` (faster, more cost-effective)
- **Scholarly/Debate**: `gpt-4-turbo-preview` (more capable, higher cost)

### Context Limits
- **Pinecone Results**: Top 5 most relevant verses
- **Bible API Results**: Top 5 search results
- **Conversation History**: Last 10 messages
- **Total Context**: Limited by OpenAI's context window

## Error Handling

The system includes comprehensive error handling:
- **Graceful Degradation**: If one service fails, others continue
- **Fallback Responses**: Default responses when services are unavailable
- **Logging**: Detailed logging for debugging and monitoring
- **User Feedback**: Clear error messages for users

## Performance Considerations

- **Async Operations**: All database and API calls are asynchronous
- **Caching**: Conversation history is cached in memory
- **Rate Limiting**: Built-in rate limiting for API calls
- **Timeout Handling**: Configurable timeouts for all operations

## Security

- **Authentication**: JWT-based authentication for all requests
- **Input Validation**: All inputs are validated and sanitized
- **API Key Protection**: Environment variables for sensitive data
- **CORS**: Proper CORS configuration for cross-origin requests

## Monitoring

The system includes comprehensive monitoring:
- **Request Logging**: All requests and responses are logged
- **Performance Metrics**: Processing times and token usage
- **Error Tracking**: Detailed error logging and reporting
- **Usage Analytics**: User interaction tracking

## Future Enhancements

Planned improvements to the RAG system:
1. **Enhanced Vector Search**: Better embedding models and search algorithms
2. **Multi-Modal Support**: Support for images and other media
3. **Real-Time Updates**: Live updates to the knowledge base
4. **Advanced Filtering**: More sophisticated context filtering
5. **Caching Layer**: Redis-based caching for improved performance

## Troubleshooting

### Common Issues

1. **MCP Server Initialization Failed**
   - Check environment variables
   - Verify API keys are valid
   - Check network connectivity

2. **OpenAI API Errors**
   - Verify API key is valid
   - Check rate limits
   - Ensure sufficient credits

3. **Pinecone Search Issues**
   - Verify index exists
   - Check vector dimensions match
   - Ensure proper API key

4. **Supabase Connection Issues**
   - Verify URL and keys
   - Check database permissions
   - Ensure tables exist

### Debug Mode

Enable debug logging by setting:
```bash
LOG_LEVEL=DEBUG
```

This will provide detailed logs for troubleshooting.

## Support

For issues or questions about the RAG integration:
1. Check the logs for error details
2. Verify all environment variables are set
3. Test individual MCP servers
4. Check the API documentation
5. Contact the development team
