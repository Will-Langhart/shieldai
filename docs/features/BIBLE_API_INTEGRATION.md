# 📖 Bible API Integration Guide

This document outlines the integration of the [API.Bible](https://scripture.api.bible/) service into the Shield AI project, providing comprehensive Bible search and verse retrieval capabilities.

## 🚀 Features

- **Bible Search**: Search across multiple Bible versions for specific terms, topics, or references
- **Popular Verses**: Quick access to commonly referenced verses for apologetics
- **Verse Selection**: Click on verses to add them to your chat conversation
- **Multiple Translations**: Support for NIV, KJV, ESV, NLT, and more
- **Topic-based Search**: Pre-defined topics like salvation, faith, love, etc.
- **Reference Lookup**: Direct verse lookup by reference (e.g., "John 3:16")

## 📋 Setup Instructions

### 1. Get API.Bible API Key

1. Visit [https://scripture.api.bible/](https://scripture.api.bible/)
2. Sign up for a free account
3. Navigate to your dashboard to get your API key
4. The free tier includes:
   - 500 consecutive verses at a time
   - 5,000 queries per day
   - Non-commercial usage

### 2. Configure Environment Variables

Add these to your `.env.local` file:

```bash
# Bible API Configuration
BIBLE_API_KEY=your_bible_api_key_here
BIBLE_API_BASE_URL=https://api.scripture.api.bible/v1
```

### 3. Install Dependencies

The integration uses existing dependencies:
- `axios` (already installed)
- `lucide-react` (already installed)

## 🏗️ Architecture

### Backend Services

#### `lib/bible-service.ts`
Core service handling all API.Bible interactions:

```typescript
// Key methods:
- getBibleVersions(): Promise<BibleVersion[]>
- searchBible(versionId, query, limit): Promise<BibleSearchResult>
- getVerseByReference(versionId, reference): Promise<BiblePassage>
- getPopularVerses(versionId): Promise<BiblePassage[]>
- getVersesByTopic(versionId, topic): Promise<BibleSearchResult>
```

#### API Endpoints

- `GET /api/bible/versions` - Get available Bible versions
- `GET /api/bible/search?query=&versionId=&limit=` - Search Bible
- `GET /api/bible/passage?reference=&versionId=` - Get specific passage
- `GET /api/bible/popular?versionId=` - Get popular verses

### Frontend Components

#### `components/BibleVerse.tsx`
Individual verse display component with actions:
- Copy verse
- Share verse
- Like verse
- Select for chat

#### `components/BibleSearch.tsx`
Comprehensive search interface:
- Search input with filters
- Quick topic buttons
- Popular verses display
- Search results with pagination
- Bible version selection

## 🎯 Usage Examples

### 1. Basic Search

```typescript
// Search for verses containing "love"
const response = await fetch('/api/bible/search?query=love&limit=10');
const results = await response.json();
```

### 2. Get Specific Verse

```typescript
// Get John 3:16
const response = await fetch('/api/bible/passage?reference=John%203:16');
const passage = await response.json();
```

### 3. Get Popular Verses

```typescript
// Get popular apologetics verses
const response = await fetch('/api/bible/popular');
const verses = await response.json();
```

### 4. Topic-based Search

```typescript
// Search for salvation-related verses
const response = await fetch('/api/bible/search?query=salvation&limit=5');
const results = await response.json();
```

## 🔧 Integration Points

### 1. Chat Interface Integration

The Bible search is integrated into the main chat interface:

1. **Header Button**: Bible search icon in the header
2. **Modal Interface**: Full-screen search modal
3. **Verse Selection**: Clicking a verse adds it to the chat
4. **Context Integration**: Verses are sent as messages to the AI

### 2. AI Assistant Integration

When a verse is selected:
1. Verse reference and text are formatted as a message
2. Message is sent to the AI assistant
3. AI can provide context, explanation, or related insights
4. Conversation history includes the verse selection

### 3. Apologetics Enhancement

The Bible integration enhances apologetics by:
- Providing quick access to relevant Scripture
- Supporting theological discussions with biblical references
- Enabling verse-based responses to questions
- Offering multiple translations for comparison

## 🎨 UI/UX Features

### Design Consistency
- Matches existing Shield AI design system
- Dark/light theme support
- Responsive design for mobile/desktop
- Smooth animations and transitions

### User Experience
- Intuitive search interface
- Quick topic buttons for common searches
- Popular verses for immediate access
- Clear verse formatting with reference
- Easy copy/share functionality

### Accessibility
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Clear focus indicators

## 🧪 Testing

### Test Page
Visit `/test-bible-api` to test:
- API endpoint functionality
- Component rendering
- Environment configuration
- Error handling

### Manual Testing Checklist
- [ ] Bible search button appears in header
- [ ] Search modal opens correctly
- [ ] Search functionality works
- [ ] Verse selection adds to chat
- [ ] Popular verses load
- [ ] Different Bible versions work
- [ ] Copy/share functions work
- [ ] Dark/light theme compatibility

## 🚨 Troubleshooting

### Common Issues

#### 1. API Key Not Working
```bash
# Check environment variables
echo $BIBLE_API_KEY

# Verify in .env.local
BIBLE_API_KEY=your_actual_key_here
```

#### 2. CORS Issues
- API calls are server-side only
- No CORS configuration needed
- All requests go through Next.js API routes

#### 3. Rate Limiting
- Free tier: 5,000 queries/day
- Implement caching for popular verses
- Consider upgrading for commercial use

#### 4. Version Not Found
- Default version ID: `de4e12af7f28f599-02` (NIV)
- Check available versions via `/api/bible/versions`
- Update version ID in search component

### Error Handling

The service includes comprehensive error handling:
- Network errors
- API rate limiting
- Invalid references
- Missing environment variables
- Timeout handling

## 📊 Performance Considerations

### Caching Strategy
- Popular verses cached for 1 hour
- Search results cached for 15 minutes
- Bible versions cached for 24 hours

### Optimization
- Lazy loading of search results
- Debounced search input
- Pagination for large result sets
- Image optimization for verse display

## 🔒 Security & Compliance

### API.Bible Fair Use
- Always display copyright information
- Respect usage limits
- Include required JavaScript snippet
- Follow fair use guidelines

### Data Privacy
- No personal data sent to Bible API
- Search queries are anonymous
- No persistent storage of search data
- GDPR compliant

## 🚀 Deployment

### Environment Variables
Ensure these are set in production:
```bash
BIBLE_API_KEY=your_production_key
BIBLE_API_BASE_URL=https://api.scripture.api.bible/v1
```

### Vercel Deployment
1. Add environment variables in Vercel dashboard
2. Deploy with `npm run build`
3. Test Bible search functionality
4. Monitor API usage

## 📈 Future Enhancements

### Planned Features
- [ ] Verse bookmarking
- [ ] Study note integration
- [ ] Cross-reference linking
- [ ] Audio verse playback
- [ ] Multiple language support
- [ ] Advanced search filters
- [ ] Verse comparison tool
- [ ] Daily verse notifications

### API.Bible Premium Features
- [ ] Commercial usage rights
- [ ] Higher rate limits
- [ ] Additional Bible versions
- [ ] Advanced search capabilities
- [ ] Audio content access

## 📚 Resources

- [API.Bible Documentation](https://scripture.api.bible/)
- [API.Bible Fair Use Guidelines](https://scripture.api.bible/docs/fair-use)
- [Bible Version IDs](https://scripture.api.bible/docs/bibles)
- [Search API Reference](https://scripture.api.bible/docs/search)

## 🤝 Support

For issues with the Bible API integration:
1. Check the test page: `/test-bible-api`
2. Review environment configuration
3. Test API endpoints directly
4. Check API.Bible service status
5. Review error logs in browser console

---

**Note**: This integration follows API.Bible's fair use guidelines and is designed for non-commercial, educational use in apologetics and theological discussion. 