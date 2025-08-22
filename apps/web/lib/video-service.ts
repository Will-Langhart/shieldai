import axios from 'axios';

export interface VideoResult {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  url: string;
  duration: string;
  channel: string;
  publishedAt: string;
  relevance: number;
  source: 'youtube' | 'vimeo' | 'other';
}

export interface VideoSearchParams {
  query: string;
  maxResults?: number;
  relevanceThreshold?: number;
  includeScripture?: boolean;
}

export class VideoService {
  private static readonly YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  private static readonly YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
  private static readonly YOUTUBE_VIDEO_URL = 'https://www.googleapis.com/youtube/v3/videos';

  /**
   * Search for relevant videos based on user message and context
   */
  static async searchRelevantVideos(params: VideoSearchParams): Promise<VideoResult[]> {
    try {
      const { query, maxResults = 5, relevanceThreshold = 0.6, includeScripture = true } = params;
      
      // Enhance query with apologetics and theological context
      const enhancedQuery = this.enhanceQueryForApologetics(query, includeScripture);
      
      // Search YouTube for relevant content
      const youtubeResults = await this.searchYouTube(enhancedQuery, maxResults);
      
      // Filter and rank results by relevance
      const rankedResults = this.rankVideosByRelevance(youtubeResults, query, relevanceThreshold);
      
      // Add scripture context if requested
      if (includeScripture) {
        await this.addScriptureContext(rankedResults, query);
      }
      
      return rankedResults.slice(0, maxResults);
    } catch (error) {
      console.error('Error searching videos:', error);
      return [];
    }
  }

  /**
   * Enhance search query with apologetics and theological context
   */
  private static enhanceQueryForApologetics(query: string, includeScripture: boolean): string {
    let enhancedQuery = query;
    
    // Add apologetics context if not already present
    if (!query.toLowerCase().includes('apologetics') && !query.toLowerCase().includes('defense')) {
      enhancedQuery += ' apologetics defense';
    }
    
    // Add theological context if not already present
    if (!query.toLowerCase().includes('theology') && !query.toLowerCase().includes('bible')) {
      enhancedQuery += ' theology bible';
    }
    
    // Add Christian perspective if not already present
    if (!query.toLowerCase().includes('christian') && !query.toLowerCase().includes('faith')) {
      enhancedQuery += ' christian faith';
    }
    
    return enhancedQuery;
  }

  /**
   * Search YouTube for relevant videos
   */
  private static async searchYouTube(query: string, maxResults: number): Promise<VideoResult[]> {
    if (!this.YOUTUBE_API_KEY) {
      console.warn('YouTube API key not configured, using fallback search');
      return this.fallbackVideoSearch(query, maxResults);
    }

    try {
      // Search for videos
      const searchResponse = await axios.get(this.YOUTUBE_SEARCH_URL, {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          maxResults: Math.min(maxResults * 2, 50), // Get more results to filter from
          order: 'relevance',
          videoDuration: 'medium', // Prefer medium-length videos (4-20 minutes)
          relevanceLanguage: 'en',
          regionCode: 'US',
          key: this.YOUTUBE_API_KEY
        }
      });

      const searchResults = searchResponse.data.items || [];
      
      if (searchResults.length === 0) {
        return this.fallbackVideoSearch(query, maxResults);
      }

      // Get detailed video information
      const videoIds = searchResults.map((item: any) => item.id.videoId).join(',');
      const videoResponse = await axios.get(this.YOUTUBE_VIDEO_URL, {
        params: {
          part: 'snippet,contentDetails,statistics',
          id: videoIds,
          key: this.YOUTUBE_API_KEY
        }
      });

      const videoDetails = videoResponse.data.items || [];
      
      return videoDetails.map((video: any) => ({
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.medium?.url || '',
        url: `https://www.youtube.com/watch?v=${video.id}`,
        duration: this.formatDuration(video.contentDetails?.duration || ''),
        channel: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
        relevance: 0.8, // Will be recalculated
        source: 'youtube' as const
      }));
    } catch (error) {
      console.error('YouTube API error:', error);
      return this.fallbackVideoSearch(query, maxResults);
    }
  }

  /**
   * Fallback video search when YouTube API is not available
   */
  private static fallbackVideoSearch(query: string, maxResults: number): VideoResult[] {
    // Return curated apologetics videos based on common topics
    const curatedVideos = this.getCuratedApologeticsVideos(query);
    return curatedVideos.slice(0, maxResults);
  }

  /**
   * Get curated apologetics videos for common topics
   */
  private static getCuratedApologeticsVideos(query: string): VideoResult[] {
    const lowerQuery = query.toLowerCase();
    
    // Define curated videos for common apologetics topics
    const curatedVideos: VideoResult[] = [
      {
        id: 'curated-1',
        title: 'Evidence for the Resurrection of Jesus Christ',
        description: 'A comprehensive examination of the historical evidence for Jesus\' resurrection',
        thumbnail: 'https://img.youtube.com/vi/placeholder1/default.jpg',
        url: 'https://www.youtube.com/watch?v=placeholder1',
        duration: '15:30',
        channel: 'Apologetics Academy',
        publishedAt: '2023-01-01T00:00:00Z',
        relevance: 0.9,
        source: 'youtube'
      },
      {
        id: 'curated-2',
        title: 'The Problem of Evil: A Christian Response',
        description: 'How Christianity addresses the problem of evil and suffering in the world',
        thumbnail: 'https://img.youtube.com/vi/placeholder2/default.jpg',
        url: 'https://www.youtube.com/watch?v=placeholder2',
        duration: '12:45',
        channel: 'Theological Defense',
        publishedAt: '2023-02-01T00:00:00Z',
        relevance: 0.85,
        source: 'youtube'
      },
      {
        id: 'curated-3',
        title: 'Scientific Evidence for God\'s Existence',
        description: 'Exploring the fine-tuning of the universe and other scientific evidence',
        thumbnail: 'https://img.youtube.com/vi/placeholder3/default.jpg',
        url: 'https://www.youtube.com/watch?v=placeholder3',
        duration: '18:20',
        channel: 'Science and Faith',
        publishedAt: '2023-03-01T00:00:00Z',
        relevance: 0.8,
        source: 'youtube'
      }
    ];

    // Filter by relevance to query
    return curatedVideos.filter(video => {
      const videoText = `${video.title} ${video.description}`.toLowerCase();
      const queryWords = query.toLowerCase().split(' ');
      const matchCount = queryWords.filter(word => videoText.includes(word)).length;
      return matchCount > 0;
    });
  }

  /**
   * Rank videos by relevance to the user's query
   */
  private static rankVideosByRelevance(videos: VideoResult[], query: string, threshold: number): VideoResult[] {
    const queryWords = query.toLowerCase().split(' ');
    
    return videos
      .map(video => {
        const videoText = `${video.title} ${video.description}`.toLowerCase();
        
        // Calculate relevance score
        let score = 0;
        
        // Title relevance (highest weight)
        queryWords.forEach(word => {
          if (video.title.toLowerCase().includes(word)) score += 0.4;
        });
        
        // Description relevance
        queryWords.forEach(word => {
          if (video.description.toLowerCase().includes(word)) score += 0.2;
        });
        
        // Channel relevance
        if (video.channel.toLowerCase().includes('apologetics') || 
            video.channel.toLowerCase().includes('theology') ||
            video.channel.toLowerCase().includes('christian')) {
          score += 0.2;
        }
        
        // Duration preference (prefer medium-length videos)
        const durationMinutes = this.parseDuration(video.duration);
        if (durationMinutes >= 5 && durationMinutes <= 30) {
          score += 0.1;
        }
        
        // Recency bonus
        const publishedDate = new Date(video.publishedAt);
        const daysSincePublished = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSincePublished < 365) {
          score += 0.1;
        }
        
        return { ...video, relevance: Math.min(score, 1.0) };
      })
      .filter(video => video.relevance >= threshold)
      .sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Add scripture context to video results
   */
  private static async addScriptureContext(videos: VideoResult[], query: string): Promise<void> {
    // This would integrate with the existing Bible service
    // For now, we'll add placeholder scripture references
    videos.forEach(video => {
      if (video.title.toLowerCase().includes('resurrection')) {
        video.description += '\n\nRelated Scripture: 1 Corinthians 15:1-8, Matthew 28:1-10';
      } else if (video.title.toLowerCase().includes('evil')) {
        video.description += '\n\nRelated Scripture: Romans 8:28, Genesis 50:20, Job 1-2';
      } else if (video.title.toLowerCase().includes('creation') || video.title.toLowerCase().includes('science')) {
        video.description += '\n\nRelated Scripture: Genesis 1:1, Psalm 19:1-6, Romans 1:20';
      }
    });
  }

  /**
   * Format duration from ISO 8601 format to readable format
   */
  private static formatDuration(duration: string): string {
    if (!duration) return 'Unknown';
    
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 'Unknown';
    
    const hours = match[1] ? parseInt(match[1].replace('H', '')) : 0;
    const minutes = match[2] ? parseInt(match[2].replace('M', '')) : 0;
    const seconds = match[3] ? parseInt(match[3].replace('S', '')) : 0;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Parse duration string to minutes
   */
  private static parseDuration(duration: string): number {
    const parts = duration.split(':').map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  }

  /**
   * Get video transcript if available
   */
  static async getVideoTranscript(videoId: string): Promise<string | null> {
    try {
      // This would use the youtube-transcript package if available
      // For now, return null
      return null;
    } catch (error) {
      console.error('Error getting video transcript:', error);
      return null;
    }
  }

  /**
   * Extract key topics from video description and transcript
   */
  static async extractVideoTopics(video: VideoResult): Promise<string[]> {
    const topics: string[] = [];
    
    // Extract topics from title and description
    const text = `${video.title} ${video.description}`.toLowerCase();
    
    // Common apologetics topics
    const topicKeywords = [
      'resurrection', 'evil', 'suffering', 'creation', 'evolution', 'bible', 'scripture',
      'god', 'jesus', 'christ', 'faith', 'belief', 'evidence', 'proof', 'argument',
      'philosophy', 'theology', 'apologetics', 'defense', 'witness', 'testimony'
    ];
    
    topicKeywords.forEach(topic => {
      if (text.includes(topic)) {
        topics.push(topic);
      }
    });
    
    return topics;
  }
}
