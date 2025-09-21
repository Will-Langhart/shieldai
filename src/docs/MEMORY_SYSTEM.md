# Memory System Documentation

## Overview

The Shield AI memory system provides long-term memory capabilities using Pinecone as a vector database for storing and retrieving conversation context. This enables the AI to remember previous discussions and provide more contextual, personalized responses.

## Architecture

### Components

1. **MemoryService** (`lib/memory-service.ts`)
   - Core service for managing conversation memories
   - Handles storage, retrieval, and analysis of conversation data
   - Provides enhanced metadata extraction and context analysis

2. **PineconeService** (`lib/pinecone.ts`)
   - Handles vector storage and similarity search
   - Converts embeddings to 1024 dimensions for Pinecone compatibility
   - Manages message storage with metadata

3. **EmbeddingService** (`lib/embeddings.ts`)
   - Generates embeddings using OpenAI's text-embedding-ada-002 model
   - Converts 1536-dimensional embeddings to 1024 dimensions
   - Provides similarity calculations

4. **MemoryInsights Component** (`components/MemoryInsights.tsx`)
   - React component for displaying memory statistics
   - Provides search interface for conversation history
   - Shows memory insights and user preferences

## Features

### Long-term Memory Storage

- **Vector Embeddings**: Each message is converted to a 1024-dimensional vector using OpenAI's embedding model
- **Metadata Storage**: Rich metadata including conversation type, emotional tone, key topics, and user preferences
- **Semantic Search**: Find relevant past conversations using natural language queries
- **Context Retrieval**: Automatically retrieve relevant memories for current conversations

### Memory Analysis

- **Topic Extraction**: Automatically identifies key topics from conversations
- **Emotional Tone Analysis**: Analyzes the emotional tone of conversations
- **Conversation Type Detection**: Categorizes conversations (bible_study, apologetics, spiritual, etc.)
- **User Preference Learning**: Tracks user communication style and topic preferences

### Memory Search

- **Semantic Similarity**: Search based on meaning, not just keywords
- **Relevance Scoring**: Results ranked by similarity score (0-1)
- **Filtering Options**: Search within specific conversations or across all conversations
- **Minimum Score Threshold**: Configurable relevance threshold for quality control

## API Endpoints

### Memory Statistics
```
GET /api/memory/stats
```
Returns memory statistics including:
- Total memories stored
- Total conversations
- Average relevance scores
- Top topics discussed

### Memory Search
```
POST /api/memory/search
```
Body parameters:
- `query`: Search query string
- `conversationId`: Optional conversation filter
- `topK`: Number of results to return (default: 10)
- `minScore`: Minimum relevance score (default: 0.7)

## Integration with Chat System

### Enhanced Context Retrieval

The chat API now uses the MemoryService to provide enhanced context:

1. **Memory Context**: Retrieves relevant memories from all conversations
2. **Topic Analysis**: Identifies key topics and emotional patterns
3. **User Preferences**: Incorporates learned user preferences
4. **System Prompt Enhancement**: Adds memory context to AI prompts

### Memory Storage Process

1. **Message Storage**: Each message is stored in both Supabase and Pinecone
2. **Embedding Generation**: OpenAI embeddings are generated for semantic search
3. **Metadata Extraction**: Conversation type, topics, and emotional tone are analyzed
4. **Memory Indexing**: Messages are indexed in Pinecone with rich metadata

## Usage Examples

### Basic Memory Search

```typescript
// Search for memories related to theology
const memories = await MemoryService.retrieveRelevantMemories(
  "What did we discuss about theology?",
  userId,
  undefined, // Search all conversations
  10, // Top 10 results
  0.7 // Minimum relevance score
);
```

### Enhanced Context Retrieval

```typescript
// Get enhanced conversation context
const context = await MemoryService.getEnhancedConversationContext(
  conversationId,
  userId,
  currentMessage,
  15 // Top 15 relevant messages
);
```

### Memory Storage

```typescript
// Store conversation memory with metadata
await MemoryService.storeConversationMemory(
  conversationId,
  userId,
  messages,
  {
    mode: 'accurate',
    objectionType: 'logical',
    emotionalTone: 'neutral',
    keyThemes: ['theology', 'apologetics']
  }
);
```

## Configuration

### Environment Variables

```env
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX_NAME=shieldai
OPENAI_API_KEY=your_openai_api_key
```

### Pinecone Index Configuration

- **Dimensions**: 1024 (converted from OpenAI's 1536 dimensions)
- **Metric**: Cosine similarity
- **Index Type**: Standard (for production) or Starter (for development)

## Performance Considerations

### Embedding Generation
- OpenAI API calls for embedding generation
- Consider caching embeddings for frequently accessed content
- Batch embedding generation for multiple messages

### Vector Search
- Pinecone query limits and rate limiting
- Index size management for cost optimization
- Relevance score thresholds for quality control

### Memory Cleanup
- Optional cleanup of old memories for privacy
- Configurable retention periods
- User-controlled memory deletion

## Privacy and Security

### Data Protection
- All memories are user-specific and isolated
- No cross-user memory sharing
- Secure API authentication required

### User Control
- Users can request memory deletion
- Configurable retention periods
- Transparent memory usage statistics

## Future Enhancements

### Planned Features
1. **Memory Summarization**: AI-generated conversation summaries
2. **Memory Clustering**: Group related conversations automatically
3. **Memory Export**: Allow users to export their conversation history
4. **Advanced Analytics**: Detailed conversation pattern analysis
5. **Memory Recommendations**: Suggest relevant past discussions

### Technical Improvements
1. **Embedding Optimization**: More efficient embedding generation
2. **Search Enhancement**: Advanced filtering and sorting options
3. **Memory Compression**: Efficient storage of large conversation histories
4. **Real-time Updates**: Live memory updates during conversations

## Troubleshooting

### Common Issues

1. **Memory Not Found**
   - Check Pinecone index configuration
   - Verify embedding generation is working
   - Ensure proper user authentication

2. **Low Relevance Scores**
   - Adjust minimum score thresholds
   - Check embedding quality
   - Verify search query specificity

3. **Performance Issues**
   - Monitor Pinecone API limits
   - Check OpenAI rate limits
   - Optimize batch operations

### Debug Information

Enable debug logging to troubleshoot memory issues:

```typescript
console.log('Memory context:', memoryContext);
console.log('Search results:', searchResults);
console.log('Embedding generation:', embedding);
```

## Testing

### Test Page
Visit `/test-memory` to test memory functionality:
- Memory statistics display
- Memory search interface
- Memory selection and details
- Example queries and usage

### API Testing
Use the provided API endpoints to test memory functionality:
- `/api/memory/stats` for statistics
- `/api/memory/search` for memory search
- Chat API with memory context enabled



