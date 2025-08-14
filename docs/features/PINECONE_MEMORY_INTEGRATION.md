# Pinecone Memory Integration for Shield AI

## Overview

Shield AI now integrates with Pinecone as a long-term memory vertex database, enabling the chatbot to remember conversations across sessions and provide contextually relevant responses based on previous interactions.

## Features

### 🧠 Long-Term Memory Storage
- **Persistent Storage**: All conversations are stored in Pinecone with vector embeddings
- **Semantic Search**: Find relevant past conversations using semantic similarity
- **Context Awareness**: Chatbot remembers user preferences, topics, and conversation patterns

### 🔍 Enhanced Memory Retrieval
- **Smart Scoring**: Enhanced similarity scoring with metadata consideration
- **Semantic Chunking**: Intelligent message chunking for better retrieval
- **Conversation Flow Analysis**: Understands conversation structure and patterns

### 📊 Memory Analytics
- **User Preferences**: Tracks user interests and conversation topics
- **Emotional Tone Analysis**: Monitors conversation sentiment over time
- **Key Topic Extraction**: Identifies recurring themes and subjects

## Architecture

### Components

1. **PineconeService** (`lib/pinecone.ts`)
   - Handles vector storage and retrieval
   - Manages index operations and metadata
   - Provides conversation context and similarity search

2. **MemoryService** (`lib/memory-service.ts`)
   - Orchestrates memory operations
   - Enhances memory retrieval with smart scoring
   - Manages conversation metadata and analysis

3. **EmbeddingService** (`lib/embeddings.ts`)
   - Generates OpenAI embeddings (text-embedding-3-small)
   - Converts 1536-dimensional vectors to 1024 dimensions for Pinecone
   - Implements weighted averaging for dimension reduction

### Data Flow

```
User Message → Embedding Generation → Pinecone Storage → Memory Index
     ↓
AI Response → Embedding Generation → Pinecone Storage → Memory Index
     ↓
Memory Retrieval → Context Enhancement → AI Response Generation
```

## Configuration

### Environment Variables

Create a `.env.local` file with the following Pinecone configuration:

```bash
# Pinecone Vector Database
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=shieldai
```

### Index Requirements

Your Pinecone index should have the following configuration:
- **Name**: `shieldai`
- **Dimensions**: `1024`
- **Metric**: `cosine`
- **Model**: `llama-text-embed-v2`
- **Type**: `Dense`
- **Capacity Mode**: `Serverless`

## Setup Instructions

### 1. Automated Setup

Run the setup script from the project root:

```bash
./scripts/setup-pinecone-memory.sh
```

This script will:
- Check your current configuration
- Prompt for Pinecone credentials
- Update environment variables
- Test the connection
- Create test scripts

### 2. Manual Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your Pinecone credentials
   ```

3. **Test Connection**
   ```bash
   cd apps/web
   npm run dev
   # Visit: http://localhost:3001/api/pinecone/test-key
   ```

## Usage

### Automatic Memory Integration

The memory system is automatically integrated into the chat flow:

1. **Message Storage**: Every user message and AI response is automatically stored in Pinecone
2. **Context Retrieval**: Relevant past conversations are automatically retrieved for context
3. **Enhanced Responses**: AI responses are enhanced with historical context and user preferences

### Manual Memory Operations

#### Store Conversation Memory

```typescript
import { MemoryService } from '../lib/memory-service';

await MemoryService.storeConversationMemory(
  conversationId,
  userId,
  messages,
  metadata
);
```

#### Retrieve Relevant Memories

```typescript
const memories = await MemoryService.retrieveRelevantMemories(
  query,
  userId,
  conversationId,
  topK
);
```

#### Get Enhanced Context

```typescript
const context = await MemoryService.getEnhancedConversationContext(
  conversationId,
  userId,
  currentMessage
);
```

## Testing

### Interactive Test Interface

Visit the test page to manually test the memory system:

```
http://localhost:3001/test-pinecone-memory
```

Features:
- **Memory Retrieval Testing**: Test semantic search with custom queries
- **Memory Storage Testing**: Store test conversations and verify storage
- **Memory Deletion Testing**: Clean up test data
- **Real-time Results**: View API responses and system status

### API Endpoints

#### Test Memory Retrieval
```bash
GET /api/pinecone/memory?query=your_query&userId=user_id&topK=5
```

#### Test Memory Storage
```bash
POST /api/pinecone/memory
{
  "conversationId": "conv_123",
  "userId": "user_456",
  "messages": [...],
  "metadata": {...}
}
```

#### Test Memory Deletion
```bash
DELETE /api/pinecone/memory?conversationId=conv_123&userId=user_456
```

## Performance Optimization

### Vector Search Optimization

1. **Filtering**: Use metadata filters to narrow search scope
2. **Scoring**: Enhanced scoring considers recency and relevance
3. **Chunking**: Semantic chunking improves retrieval accuracy

### Memory Management

1. **Automatic Cleanup**: Test data is automatically cleaned up
2. **Conversation Deletion**: Remove entire conversations when needed
3. **User Data Management**: Delete all user data on request

## Monitoring and Debugging

### Logging

The system provides comprehensive logging:

```typescript
console.log(`Storing ${messages.length} messages in Pinecone memory`);
console.log(`Retrieved ${memories.length} relevant memories`);
console.log(`Enhanced context created with ${context.messages.length} messages`);
```

### Error Handling

- **Graceful Degradation**: Memory failures don't break the main chat flow
- **Fallback Mechanisms**: System falls back to database-only storage if needed
- **Detailed Error Logging**: Comprehensive error information for debugging

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Verify Pinecone API key and environment
   - Check index status and accessibility
   - Ensure proper environment variable format

2. **Dimension Mismatch**
   - System automatically converts 1536→1024 dimensions
   - Verify embedding model compatibility
   - Check Pinecone index configuration

3. **Memory Retrieval Issues**
   - Verify user authentication
   - Check conversation ID format
   - Monitor similarity score thresholds

### Debug Commands

```bash
# Test Pinecone connection
curl http://localhost:3001/api/pinecone/test-key

# Check environment configuration
curl http://localhost:3001/api/pinecone/env

# View index statistics
curl http://localhost:3001/api/pinecone/stats
```

## Security Considerations

### Data Privacy

- **User Isolation**: Memories are filtered by user ID
- **Metadata Security**: Sensitive data is not stored in vectors
- **Access Control**: API endpoints require authentication

### API Security

- **Rate Limiting**: Built-in rate limiting for memory operations
- **Input Validation**: All inputs are validated and sanitized
- **Error Handling**: No sensitive information in error messages

## Future Enhancements

### Planned Features

1. **Advanced NLP**: Integration with more sophisticated language models
2. **Memory Compression**: Intelligent memory summarization and compression
3. **Multi-modal Memory**: Support for images, audio, and other media types
4. **Memory Clustering**: Automatic topic clustering and organization

### Performance Improvements

1. **Batch Operations**: Optimized batch storage and retrieval
2. **Caching Layer**: Redis-based caching for frequently accessed memories
3. **Async Processing**: Background memory processing for better performance

## Support

For issues or questions about the Pinecone memory integration:

1. Check the troubleshooting section above
2. Review the test interface for system status
3. Check server logs for detailed error information
4. Verify Pinecone index configuration and status

## Contributing

To contribute to the memory system:

1. Follow the existing code patterns
2. Add comprehensive tests for new features
3. Update documentation for any changes
4. Ensure backward compatibility

---

**Note**: This integration requires an active Pinecone account and properly configured index. The system will gracefully degrade if Pinecone is unavailable, but optimal performance requires proper configuration.
