# Conversation Persistence System

This document describes the conversation and message persistence system implemented in Shield AI.

## Overview

The conversation persistence system ensures that all user conversations and messages are permanently stored in the database and can be retrieved for display in the sidebar and when clicked, opens the conversation in the center of the screen.

## Database Schema

### Conversations Table
```sql
CREATE TABLE public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    last_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Messages Table
```sql
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role message_role NOT NULL,
    content TEXT NOT NULL,
    mode response_mode,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

### Conversations
- `GET /api/conversations` - Get all conversations for the authenticated user
- `POST /api/conversations` - Create a new conversation
- `GET /api/conversations/[id]` - Get messages for a specific conversation
- `DELETE /api/conversations/[id]` - Delete a conversation and all its messages

### Messages
- `GET /api/messages?conversationId=[id]` - Get messages for a conversation
- `POST /api/messages` - Add a new message to a conversation

## Frontend Implementation

### Chat Component (`apps/frontend/src/pages/Chat.tsx`)
- Displays conversations in the sidebar
- Loads conversation messages when clicked
- Handles new conversation creation
- Manages message streaming and display

### Chat Service (`apps/frontend/src/services/chatService.ts`)
- Handles API communication for conversations and messages
- Manages message streaming
- Saves messages to the database

### API Service (`apps/frontend/src/services/api.ts`)
- Provides methods for conversation and message operations
- Handles authentication headers

## Backend Implementation

### Chat Service (`apps/web/lib/chat-service.ts`)
- Core business logic for conversation and message management
- Handles database operations with proper user context
- Manages RLS (Row Level Security) policies

### API Routes
- `apps/web/pages/api/conversations.ts` - Conversation CRUD operations
- `apps/web/pages/api/conversations/[id].ts` - Individual conversation operations
- `apps/web/pages/api/messages.ts` - Message operations
- `apps/web/pages/api/chat-rag.ts` - Chat with RAG integration

## Key Features

### 1. User Authentication
- All conversations and messages are tied to authenticated users
- RLS policies ensure users can only access their own data

### 2. Message Persistence
- User messages are saved immediately when sent
- Assistant responses are saved after completion
- All messages include metadata (mode, timestamp, etc.)

### 3. Conversation Management
- Conversations are created automatically when first message is sent
- Conversation titles are generated from the first message
- Last message is tracked for sidebar display

### 4. Real-time Updates
- Messages are streamed in real-time
- UI updates immediately with new messages
- Sidebar refreshes when new conversations are created

## Database Migration

To add the required `user_id` column to the messages table, run:

```bash
# Run the migration script
./scripts/run-migration.sh

# Or manually run the SQL in Supabase
cat database/add-user-id-to-messages.sql
```

## Testing

Test the conversation flow with:

```bash
# Run the test script
node scripts/test-conversation-flow.js
```

## Security

### Row Level Security (RLS)
- Users can only view their own conversations
- Users can only view messages in their own conversations
- All operations require authentication

### Data Validation
- Message content is sanitized and limited to 8000 characters
- User input is validated before database insertion
- SQL injection protection through parameterized queries

## Error Handling

- Graceful fallbacks for API failures
- User-friendly error messages
- Comprehensive logging for debugging
- Retry mechanisms for transient failures

## Performance

### Database Indexes
- `idx_conversations_user_id` - Fast user conversation lookup
- `idx_messages_conversation_id` - Fast message retrieval
- `idx_messages_user_id` - Fast user message lookup
- `idx_messages_created_at` - Chronological message ordering

### Caching
- Conversation lists are cached in frontend state
- Messages are loaded on-demand
- Optimistic updates for better UX

## Future Enhancements

1. **Message Search**: Full-text search across all user messages
2. **Conversation Sharing**: Allow users to share conversations
3. **Message Export**: Export conversations to various formats
4. **Message Reactions**: Add emoji reactions to messages
5. **Message Threading**: Support for threaded conversations
6. **Message Encryption**: End-to-end encryption for sensitive conversations

## Troubleshooting

### Common Issues

1. **Messages not saving**: Check authentication and database connection
2. **Conversations not loading**: Verify RLS policies and user permissions
3. **Streaming not working**: Check network connectivity and API endpoints
4. **Database errors**: Run migration script and check schema

### Debug Commands

```bash
# Check database schema
psql -h your-host -U your-user -d your-database -c "\d messages"

# Test API endpoints
curl -H "Authorization: Bearer test-token" http://localhost:3000/api/conversations

# Check logs
tail -f logs/dev-web.out
```

## Related Documentation

- [Database Schema](../database/schema.sql)
- [API Integration Guide](../api/API_INTEGRATION_GUIDE.md)
- [Authentication System](../features/AUTHENTICATION.md)
- [RAG Integration](../features/RAG_INTEGRATION.md)
