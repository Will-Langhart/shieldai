# Pinecone Vector Database Setup

## Environment Variables Required

Add these environment variables to your `.env` file:

```env
# Pinecone Configuration
PINECONE_API_KEY=your-pinecone-api-key-here
PINECONE_INDEX_NAME=quickstart
```

## Vercel Environment Variables

Also add these to your Vercel project environment variables:

1. Go to your Vercel dashboard
2. Navigate to your project settings
3. Go to the "Environment Variables" section
4. Add:
   - `PINECONE_API_KEY` = your Pinecone API key
   - `PINECONE_INDEX_NAME` = your Pinecone index name (default: "quickstart")

## Getting Your Pinecone API Key

1. Go to [Pinecone Console](https://app.pinecone.io/)
2. Create an account or sign in
3. Create a new project
4. Create an index named "quickstart" (or use your preferred name)
5. Copy your API key from the project settings
6. Update the `PINECONE_INDEX_NAME` if you used a different index name

## Features Enabled

With Pinecone integration, your Shield AI application now has:

1. **Vector Embeddings**: All messages are converted to embeddings using OpenAI's text-embedding-ada-002 model
2. **Similarity Search**: Find similar previous conversations to provide better context
3. **Semantic Memory**: The AI can reference past conversations that are semantically similar
4. **Enhanced Context**: Better responses based on historical conversation patterns
5. **User-Specific Search**: All searches are filtered by user ID for privacy

## How It Works

1. When a user sends a message, it's converted to a vector embedding
2. The embedding is stored in Pinecone with metadata (user ID, conversation ID, role, etc.)
3. When generating responses, the system searches for similar previous messages
4. Similar messages are used as context to improve the AI's response
5. This creates a "memory" system that improves over time

## Index Configuration

Your Pinecone index should be configured with:
- **Dimensions**: 1536 (for OpenAI text-embedding-ada-002)
- **Metric**: cosine
- **Pod Type**: p1.x1 (or your preferred tier)

## Troubleshooting

If you encounter issues:

1. **Check API Key**: Ensure your Pinecone API key is correct
2. **Index Name**: Verify the index name matches your Pinecone index
3. **Dimensions**: Make sure your index has 1536 dimensions
4. **Environment Variables**: Confirm all variables are set in both local and Vercel environments 