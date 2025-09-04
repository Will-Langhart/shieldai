# 🔍 Development Logging System

Shield AI now includes a comprehensive development logging system that helps developers debug YouTube API calls, chat API interactions, and database operations in real-time.

## 🚀 Quick Start

### Method 1: Using the Script (Recommended)
```bash
# From the project root
./scripts/dev-with-logging.sh
```

### Method 2: Manual Start
```bash
# From the project root
cd apps/web
npm run dev
```

## 🎯 What Gets Logged

### YouTube API Operations
- **Search Requests**: Query parameters, filters, API key status
- **API Calls**: HTTP requests, responses, status codes
- **Errors**: Failed attempts, retry logic, fallback usage
- **Success**: Response data, result counts, processing time

### Chat API Operations
- **User Requests**: Message content, user ID, mode, timestamp
- **Streaming**: Response phases, video search triggers
- **Video Integration**: Search queries, result counts, data structure
- **Response Completion**: Final response length, video count, processing time

### Database Operations
- **Saves**: Message storage, conversation creation, metadata
- **Loads**: Conversation retrieval, message history, user data
- **Errors**: Connection issues, query failures, constraint violations

### General Application
- **Authentication**: User login, token validation, session management
- **Memory System**: Context retrieval, topic analysis, emotional tone
- **Analytics**: Feature usage, response tracking, performance metrics

## 🎮 Using the Logging Dashboard

### Accessing the Dashboard
1. Start the development server
2. Look for the **🔍** button in the bottom-right corner
3. Click to open the comprehensive logging dashboard

### Dashboard Features

#### Quick Actions
- **🎬 YouTube Only**: Focus logging on YouTube API operations
- **💬 Chat Only**: Focus logging on chat API operations  
- **💾 Database Only**: Focus logging on database operations
- **🚀 All**: Enable all logging categories
- **🔇 None**: Disable all logging

#### Filters
- **Level**: Filter by log level (error, warn, info, debug)
- **Service**: Filter by service (youtube, chat, database, auth)
- **Auto-scroll**: Automatically scroll to latest logs

#### Actions
- **🗑️ Clear**: Clear all captured logs
- **📥 Export**: Download logs as JSON file

## 📁 Log File Structure

```
logs/
├── dev/                    # Development logs (daily files)
│   ├── 2025-08-22.log     # Today's logs
│   └── 2025-08-21.log     # Yesterday's logs
├── server/                 # Server runtime logs
├── debug/                  # General debugging logs
└── README.md              # Log directory documentation
```

## 🔧 Configuration

### Environment Variables
```bash
# Disable specific logging categories
export DISABLE_YOUTUBE_LOGGING=true
export DISABLE_CHAT_LOGGING=true
export DISABLE_DB_LOGGING=true
export DISABLE_FILE_LOGGING=true

# Enable development logging
export NODE_ENV=development
export ENABLE_DEV_LOGGING=true
```

### Programmatic Control
```typescript
import { quickLogging } from '../lib/dev-logging-config';

// Focus on specific areas
quickLogging.focusOnYouTube();
quickLogging.focusOnChat();
quickLogging.focusOnDatabase();

// Enable/disable all
quickLogging.enableAll();
quickLogging.disableAll();
```

## 🐛 Debugging Common Issues

### YouTube API Problems
1. **Enable YouTube-only logging**: Click "🎬 YouTube Only"
2. **Send a message** to Shield AI
3. **Check logs** for:
   - API key configuration
   - Request parameters
   - Error responses
   - Retry attempts
   - Fallback usage

### Chat API Problems
1. **Enable Chat-only logging**: Click "💬 Chat Only"
2. **Send a message** to Shield AI
3. **Check logs** for:
   - Request processing
   - Streaming phases
   - Video search triggers
   - Response completion
   - Error handling

### Database Problems
1. **Enable Database-only logging**: Click "💾 Database Only"
2. **Refresh the page** or **send a message**
3. **Check logs** for:
   - Connection status
   - Query execution
   - Data persistence
   - Error details

## 📊 Log Format

Each log entry includes:
```json
{
  "t": "2025-08-22T21:45:30.123Z",
  "level": "info",
  "message": "🎬 YouTube API Search Request",
  "cid": "youtube_1755899130123_abc123",
  "service": "youtube",
  "action": "search",
  "query": "evidence for Christianity",
  "filters": { "maxResults": 3 },
  "timestamp": "2025-08-22T21:45:30.123Z"
}
```

### Fields Explained
- **t**: ISO timestamp
- **level**: Log level (debug, info, warn, error)
- **message**: Human-readable message
- **cid**: Correlation ID for tracking related operations
- **service**: Service category (youtube, chat, database, auth)
- **action**: Specific action being performed
- **timestamp**: Additional timestamp for the operation

## 🎯 Best Practices

### During Development
1. **Start with all logging enabled** to get the full picture
2. **Focus on specific areas** when debugging particular issues
3. **Use correlation IDs** to track related operations
4. **Export logs** for offline analysis or sharing

### Performance Considerations
1. **File logging** is automatically disabled in production
2. **Console logging** continues to work in all environments
3. **Log rotation** prevents disk space issues
4. **Filtering** reduces noise when focusing on specific issues

### Troubleshooting
1. **Check log levels** - some issues only appear at debug level
2. **Use service filters** to isolate problems to specific areas
3. **Look for correlation IDs** to trace request flows
4. **Export logs** to share with team members

## 🚨 Common Issues & Solutions

### Dashboard Not Appearing
- Ensure `NODE_ENV=development`
- Check browser console for errors
- Verify component is imported in main page

### No Logs Captured
- Check if logging is enabled in configuration
- Verify console methods are being overridden
- Look for errors in browser console

### Performance Issues
- Reduce log verbosity using filters
- Focus on specific services only
- Clear logs periodically

## 🔗 Related Files

- **`lib/logger.ts`**: Core logging functionality
- **`lib/dev-logging-config.ts`**: Configuration and controls
- **`components/DevLoggingDashboard.tsx`**: Dashboard UI
- **`scripts/dev-with-logging.sh`**: Quick start script

## 📝 Example Usage Scenarios

### Scenario 1: Debugging YouTube API Issues
```bash
# Start server with logging
./scripts/dev-with-logging.sh

# In browser:
# 1. Click 🔍 button
# 2. Click "🎬 YouTube Only"
# 3. Send message: "What is the evidence for Christianity?"
# 4. Watch logs for YouTube API operations
# 5. Look for errors, retries, or fallbacks
```

### Scenario 2: Debugging Chat Response Issues
```bash
# Start server with logging
./scripts/dev-with-logging.sh

# In browser:
# 1. Click 🔍 button
# 2. Click "💬 Chat Only"
# 3. Send message to Shield AI
# 4. Monitor streaming phases and video search
# 5. Check response completion logs
```

### Scenario 3: Debugging Database Issues
```bash
# Start server with logging
./scripts/dev-with-logging.sh

# In browser:
# 1. Click 🔍 button
# 2. Click "💾 Database Only"
# 3. Refresh page or send message
# 4. Look for database connection and query logs
# 5. Check for error details
```

This logging system provides comprehensive visibility into Shield AI's operations, making it much easier to debug issues and understand the application's behavior during development.

