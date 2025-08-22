# Video Integration Feature

## Overview

The Video Integration feature enhances Shield AI's responses by automatically fetching and displaying relevant videos from the internet, along with corresponding scripture references. This feature provides users with multimedia content that complements the AI's textual responses, making apologetics and theological discussions more engaging and informative.

## Features

### 🎥 **Automatic Video Discovery**
- Searches YouTube and other video platforms for relevant content
- Uses advanced relevance scoring based on user queries
- Enhances search queries with apologetics and theological context
- Falls back to curated content when external APIs are unavailable

### 📖 **Scripture Integration**
- Automatically adds relevant Bible verses to video descriptions
- Integrates with existing Bible service for verse suggestions
- Provides context for how videos relate to biblical teachings

### 🎯 **Smart Relevance Scoring**
- Analyzes video titles, descriptions, and channels for relevance
- Prefers content from reputable apologetics and theological sources
- Considers video duration, recency, and user engagement
- Filters results based on configurable relevance thresholds

### 🔄 **Real-time Integration**
- Videos are fetched automatically when users send messages
- Integrated into streaming chat responses
- Displays videos alongside AI responses for immediate access

## Technical Implementation

### Architecture

```
User Message → Chat API → Video Service → YouTube API → Video Display
     ↓              ↓           ↓           ↓           ↓
  AI Response   Video Search  Relevance   Thumbnails  Interactive
     ↓              ↓         Scoring      & Metadata    Cards
  Scripture    Fallback to   Filtering    Processing   with Actions
  Context      Curated       & Ranking    & Storage    (Watch/Open)
```

### Components

#### 1. **VideoService** (`apps/web/lib/video-service.ts`)
- Core service for video search and management
- YouTube API integration with fallback mechanisms
- Relevance scoring and filtering algorithms
- Scripture context integration

#### 2. **VideoDisplay** (`apps/web/components/VideoDisplay.tsx`)
- React component for displaying video results
- Interactive video cards with thumbnails and metadata
- Expandable descriptions and scripture context
- Action buttons for watching and opening videos

#### 3. **VideoClientService** (`apps/web/lib/video-client-service.ts`)
- Client-side service for video operations
- Curated video fallback content
- Video categorization and filtering

#### 4. **Video Search API** (`apps/web/pages/api/videos/search.ts`)
- RESTful endpoint for video search requests
- Authentication and rate limiting
- Error handling and logging

### Integration Points

#### Chat API Enhancement
- Modified `/api/chat` to include video search
- Added video context to AI system prompts
- Integrated video data into streaming responses
- Enhanced response payload with video metadata

#### Message Rendering
- Updated chat interface to display videos
- Added video state management
- Integrated video display with message actions

#### Data Persistence
- Videos are stored in the database with each message
- Video data persists across page refreshes
- Automatic loading of videos when conversations are loaded
- Metadata tracking for search queries and relevance scores

## Database Schema

### Video Storage in Messages Table

The video integration adds three new columns to the `messages` table:

```sql
-- Add video storage capabilities to messages table
ALTER TABLE public.messages ADD COLUMN relevant_videos JSONB DEFAULT '[]';
ALTER TABLE public.messages ADD COLUMN bible_verses JSONB DEFAULT '[]';
ALTER TABLE public.messages ADD COLUMN video_metadata JSONB DEFAULT '{}';

-- Performance indexes
CREATE INDEX idx_messages_videos ON public.messages USING GIN (relevant_videos);
CREATE INDEX idx_messages_bible_verses ON public.messages USING GIN (bible_verses);
```

#### Column Descriptions

- **`relevant_videos`**: Array of video objects with YouTube metadata
- **`bible_verses`**: Array of relevant scripture references and text
- **`video_metadata`**: Search context including query, timestamp, and counts

### Data Flow

1. **User sends message** → AI processes with video search
2. **Videos found** → Stored in database with message
3. **Page refresh** → Videos loaded from database
4. **Conversation history** → Includes all video data

## Configuration

```bash
# YouTube API Configuration
YOUTUBE_API_KEY=your-youtube-api-key
```

### API Keys Required

1. **YouTube Data API v3**
   - Enable YouTube Data API v3 in Google Cloud Console
   - Create API key with appropriate quotas
   - Configure domain restrictions for security

### Fallback Configuration

When YouTube API is unavailable, the system automatically falls back to curated content:

```typescript
// Curated videos for common apologetics topics
const curatedVideos = [
  'Evidence for the Resurrection',
  'The Problem of Evil',
  'Scientific Evidence for God',
  'Biblical Archaeology',
  'Philosophical Arguments'
];
```

## Setup and Migration

### Running the Database Migration

To enable video persistence, run the database migration:

```bash
# From the project root
./scripts/run-video-storage-migration.sh

# Or manually in Supabase SQL Editor
# Copy and paste the contents of database/add-video-storage.sql
```

### Migration Contents

The migration adds:
- Video storage columns to messages table
- Performance indexes for video search
- Backward compatibility for existing messages

## Usage

### For Users

1. **Send a message** to Shield AI about any apologetics or theological topic
2. **Receive AI response** with integrated video suggestions
3. **View video cards** with thumbnails, descriptions, and scripture context
4. **Click to watch** videos directly or open in new tabs
5. **Expand descriptions** to see full content and related scripture

### For Developers

#### Adding Video Search to Custom Components

```typescript
import { VideoService } from '../lib/video-service';

// Search for relevant videos
const videos = await VideoService.searchRelevantVideos({
  query: 'user message',
  maxResults: 5,
  relevanceThreshold: 0.6,
  includeScripture: true
});

// Display videos using VideoDisplay component
<VideoDisplay
  videos={videos}
  theme="dark"
  onVideoSelect={(video) => handleVideoSelect(video)}
  showScripture={true}
/>
```

#### Customizing Video Display

```typescript
// Custom video selection handler
const handleVideoSelect = (video: VideoResult) => {
  // Custom logic for video handling
  console.log('Selected video:', video);
  
  // Example: Track video views
  analytics.track('video_selected', {
    videoId: video.id,
    title: video.title,
    channel: video.channel
  });
};
```

## API Reference

### VideoService Methods

#### `searchRelevantVideos(params: VideoSearchParams)`

```typescript
interface VideoSearchParams {
  query: string;                    // User's search query
  maxResults?: number;              // Maximum videos to return (default: 5)
  relevanceThreshold?: number;      // Minimum relevance score (default: 0.6)
  includeScripture?: boolean;       // Include scripture context (default: true)
}
```

#### `getVideoTranscript(videoId: string)`

Retrieves video transcript if available (future enhancement).

#### `extractVideoTopics(video: VideoResult)`

Extracts key topics from video content for categorization.

### VideoResult Interface

```typescript
interface VideoResult {
  id: string;                       // Unique video identifier
  title: string;                    // Video title
  description: string;              // Video description
  thumbnail: string;                // Thumbnail URL
  url: string;                      // Video URL
  duration: string;                 // Video duration (formatted)
  channel: string;                  // Channel name
  publishedAt: string;              // Publication date
  relevance: number;                // Relevance score (0-1)
  source: 'youtube' | 'vimeo' | 'other';
}
```

## Performance Considerations

### Caching Strategy
- Video search results are not cached to ensure freshness
- Thumbnail images are served from external CDNs
- Relevance scoring is computed in real-time

### Rate Limiting
- YouTube API has daily quotas (typically 10,000 units/day)
- Each search request consumes 100 units
- Fallback to curated content when quotas are exceeded

### Optimization
- Videos are limited to 3-5 per response
- Thumbnails are optimized for web display
- Lazy loading for video descriptions

## Security & Privacy

### Data Handling
- No user video viewing data is stored
- Video metadata is processed but not persisted
- External video URLs are opened in new tabs

### API Security
- YouTube API key is server-side only
- Domain restrictions on API key usage
- Authentication required for video search

## Future Enhancements

### Planned Features
1. **Video Transcripts**: Extract and search video content
2. **User Preferences**: Save favorite video channels and topics
3. **Video Playlists**: Curated collections for specific topics
4. **Analytics**: Track video engagement and effectiveness
5. **Multi-platform**: Support for Vimeo, DailyMotion, etc.

### Technical Improvements
1. **Smart Caching**: Cache popular video searches
2. **ML Enhancement**: Use AI to improve relevance scoring
3. **Content Moderation**: Filter inappropriate content
4. **Accessibility**: Add captions and audio descriptions

## Troubleshooting

### Common Issues

#### No Videos Displayed
- Check YouTube API key configuration
- Verify API quotas and rate limits
- Review browser console for errors
- Check network connectivity

#### Poor Relevance
- Adjust relevance threshold in search parameters
- Review query enhancement logic
- Check fallback content quality

#### Performance Issues
- Reduce maxResults parameter
- Implement client-side caching
- Optimize thumbnail loading

### Debug Mode

Enable debug logging for video service:

```typescript
// In development environment
console.log('Video search debug:', {
  query: userMessage,
  results: videoResults,
  relevance: relevanceScores
});
```

## Contributing

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables
4. Run development server: `npm run dev`

### Testing
- Test video search with various queries
- Verify fallback mechanisms work
- Check responsive design on different devices
- Validate accessibility features

### Code Standards
- Follow TypeScript best practices
- Use consistent error handling
- Add comprehensive JSDoc comments
- Include unit tests for new features

## Support

For technical support or feature requests:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation wiki
- Review existing issues and solutions

---

*This feature enhances Shield AI's ability to provide comprehensive, multimedia responses that combine AI insights with relevant video content and scripture references.*
