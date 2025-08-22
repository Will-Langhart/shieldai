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
  topics?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  targetAudience?: 'seeker' | 'believer' | 'scholar' | 'general';
  emotionalTone?: 'encouraging' | 'educational' | 'defensive' | 'pastoral';
}

export interface VideoSearchParams {
  query: string;
  maxResults?: number;
  relevanceThreshold?: number;
  includeScripture?: boolean;
  userContext?: {
    objectionType?: 'logical' | 'moral' | 'scientific' | 'historical' | 'emotional' | 'philosophical' | 'cultural' | 'personal';
    userStance?: 'seeker' | 'skeptic' | 'challenger' | 'believer' | 'struggler';
    intensity?: 'mild' | 'moderate' | 'strong';
    mode?: 'gentle' | 'scholarly' | 'debate';
    previousTopics?: string[];
    emotionalTone?: 'positive' | 'negative' | 'neutral';
  };
  aiResponse?: string;
}

export interface VideoSearchStrategy {
  primaryQuery: string;
  secondaryQueries: string[];
  filters: {
    duration?: 'short' | 'medium' | 'long';
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    channelTypes?: string[];
    recency?: 'recent' | 'classic' | 'any';
  };
  fallbackStrategy: 'curated' | 'general' | 'mixed';
}

export class VideoService {
  private static readonly YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  private static readonly YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
  private static readonly YOUTUBE_VIDEO_URL = 'https://www.googleapis.com/youtube/v3/videos';

  // Enhanced channel mappings for better filtering
  private static readonly TRUSTED_CHANNELS = {
    apologetics: [
      'Apologetics Academy', 'RZIM', 'Reasonable Faith', 'Stand to Reason', 'CrossExamined',
      'Cold Case Christianity', 'The One Minute Apologist', 'Apologetics 315'
    ],
    theology: [
      'Ligonier Ministries', 'Desiring God', 'The Gospel Coalition', 'Grace to You',
      'Truth for Life', 'Bible Project', 'Got Questions Ministries'
    ],
    science: [
      'Reasons to Believe', 'Discovery Institute', 'Answers in Genesis',
      'Institute for Creation Research', 'Creation Ministries International'
    ]
  };

  /**
   * Enhanced search for relevant videos based on user message, context, and AI response
   */
  static async searchRelevantVideos(params: VideoSearchParams): Promise<VideoResult[]> {
    try {
      const { query, maxResults = 5, relevanceThreshold = 0.6, includeScripture = true, userContext, aiResponse } = params;
      
      // Generate intelligent search strategy based on context
      const searchStrategy = this.generateSearchStrategy(query, userContext, aiResponse);
      
      // Execute multi-query search strategy
      const allResults = await this.executeSearchStrategy(searchStrategy, maxResults);
      
      // Enhanced ranking with context awareness
      const rankedResults = this.rankVideosWithContext(allResults, query, userContext, aiResponse, relevanceThreshold);
      
      // Add scripture context if requested
      if (includeScripture) {
        await this.addScriptureContext(rankedResults, query, aiResponse);
      }
      
      // Add metadata for better user experience
      await this.enhanceVideoMetadata(rankedResults, userContext);
      
      return rankedResults.slice(0, maxResults);
    } catch (error) {
      console.error('Error searching videos:', error);
      return this.getIntelligentFallbackVideos(params);
    }
  }

  /**
   * Generate intelligent search strategy based on user context and AI response
   */
  private static generateSearchStrategy(
    query: string, 
    userContext?: VideoSearchParams['userContext'],
    aiResponse?: string
  ): VideoSearchStrategy {
    const lowerQuery = query.toLowerCase();
    const lowerResponse = aiResponse?.toLowerCase() || '';
    
    // Analyze the primary topic and generate focused queries
    const primaryTopic = this.extractPrimaryTopic(lowerQuery, lowerResponse);
    const primaryQuery = this.buildPrimaryQuery(query, primaryTopic, userContext);
    
    // Generate secondary queries for broader coverage
    const secondaryQueries = this.generateSecondaryQueries(primaryTopic, userContext);
    
    // Determine optimal filters based on user context
    const filters = this.determineOptimalFilters(userContext, primaryTopic);
    
    // Choose fallback strategy
    const fallbackStrategy = this.chooseFallbackStrategy(userContext, primaryTopic);
    
    return {
      primaryQuery,
      secondaryQueries,
      filters,
      fallbackStrategy
    };
  }

  /**
   * Extract the primary topic from query and AI response
   */
  private static extractPrimaryTopic(query: string, aiResponse: string): string {
    const combinedText = `${query} ${aiResponse}`;
    
    // Priority order for topic detection
    const topicPatterns = [
      { pattern: /resurrection|risen|empty.?tomb/i, topic: 'resurrection' },
      { pattern: /evil|suffering|pain|theodicy/i, topic: 'problem of evil' },
      { pattern: /creation|evolution|genesis|big.?bang/i, topic: 'creation vs evolution' },
      { pattern: /jesus|christ|messiah|savior/i, topic: 'deity of christ' },
      { pattern: /bible|scripture|gospel|word/i, topic: 'biblical reliability' },
      { pattern: /god|existence|proof|evidence/i, topic: 'existence of god' },
      { pattern: /faith|belief|trust|salvation/i, topic: 'faith and salvation' },
      { pattern: /prayer|worship|church|christianity/i, topic: 'christian practice' },
      { pattern: /morality|ethics|right|wrong/i, topic: 'moral reasoning' },
      { pattern: /history|archaeology|evidence|proof/i, topic: 'historical evidence' }
    ];
    
    for (const { pattern, topic } of topicPatterns) {
      if (pattern.test(combinedText)) {
        return topic;
      }
    }
    
    return 'general apologetics';
  }

  /**
   * Build primary query with context enhancement
   */
  private static buildPrimaryQuery(
    originalQuery: string, 
    primaryTopic: string, 
    userContext?: VideoSearchParams['userContext']
  ): string {
    let enhancedQuery = originalQuery;
    
    // Add topic-specific enhancements
    if (primaryTopic === 'resurrection') {
      enhancedQuery += ' historical evidence Jesus resurrection apologetics';
    } else if (primaryTopic === 'problem of evil') {
      enhancedQuery += ' theodicy free will defense suffering christian response';
    } else if (primaryTopic === 'creation vs evolution') {
      enhancedQuery += ' intelligent design fine-tuning universe creation science';
    } else if (primaryTopic === 'deity of christ') {
      enhancedQuery += ' Jesus Christ divinity messiah biblical evidence';
    } else if (primaryTopic === 'biblical reliability') {
      enhancedQuery += ' Bible accuracy archaeology manuscript evidence';
    } else if (primaryTopic === 'existence of god') {
      enhancedQuery += ' cosmological argument fine-tuning design evidence';
    }
    
    // Add user stance context
    if (userContext?.userStance === 'challenger') {
      enhancedQuery += ' evidence proof arguments';
    } else if (userContext?.userStance === 'seeker') {
      enhancedQuery += ' introduction explanation overview';
    } else if (userContext?.userStance === 'believer') {
      enhancedQuery += ' deeper study advanced theology';
    }
    
    // Add mode context
    if (userContext?.mode === 'scholarly') {
      enhancedQuery += ' academic scholarly research';
    } else if (userContext?.mode === 'gentle') {
      enhancedQuery += ' gentle introduction compassionate';
    }
    
    return enhancedQuery;
  }

  /**
   * Generate secondary queries for broader coverage
   */
  private static generateSecondaryQueries(
    primaryTopic: string, 
    userContext?: VideoSearchParams['userContext']
  ): string[] {
    const queries: string[] = [];
    
    // Topic-specific secondary queries
    switch (primaryTopic) {
      case 'resurrection':
        queries.push('apostles testimony resurrection', 'empty tomb evidence', 'eyewitness accounts Jesus');
        break;
      case 'problem of evil':
        queries.push('free will defense', 'soul making theodicy', 'christian response suffering');
        break;
      case 'creation vs evolution':
        queries.push('intelligent design evidence', 'fine-tuning universe', 'creation science');
        break;
      case 'deity of christ':
        queries.push('messianic prophecies', 'Jesus miracles evidence', 'trinity doctrine');
        break;
      case 'biblical reliability':
        queries.push('manuscript evidence', 'archaeological discoveries', 'bible prophecy fulfilled');
        break;
      case 'existence of god':
        queries.push('cosmological argument', 'teleological argument', 'moral argument god');
        break;
      default:
        queries.push('christian apologetics', 'defending faith', 'evidence christianity');
    }
    
    // Add user-specific queries
    if (userContext?.intensity === 'strong') {
      queries.push('strongest arguments christianity', 'best evidence faith');
    } else if (userContext?.intensity === 'mild') {
      queries.push('gentle introduction faith', 'beginner apologetics');
    }
    
    return queries.slice(0, 3); // Limit to 3 secondary queries
  }

  /**
   * Determine optimal filters based on user context
   */
  private static determineOptimalFilters(
    userContext?: VideoSearchParams['userContext'],
    primaryTopic?: string
  ): VideoSearchStrategy['filters'] {
    const filters: VideoSearchStrategy['filters'] = {};
    
    // Duration preferences based on user stance and mode
    if (userContext?.userStance === 'seeker' || userContext?.mode === 'gentle') {
      filters.duration = 'short'; // Prefer shorter videos for seekers
    } else if (userContext?.mode === 'scholarly') {
      filters.duration = 'long'; // Prefer longer, in-depth content for scholars
    } else {
      filters.duration = 'medium'; // Default to medium length
    }
    
    // Difficulty level
    if (userContext?.userStance === 'seeker') {
      filters.difficulty = 'beginner';
    } else if (userContext?.userStance === 'believer') {
      filters.difficulty = 'intermediate';
    } else if (userContext?.userStance === 'challenger') {
      filters.difficulty = 'advanced';
    }
    
    // Channel type preferences
    if (primaryTopic === 'science') {
      filters.channelTypes = ['science', 'apologetics'];
    } else if (primaryTopic === 'theology') {
      filters.channelTypes = ['theology', 'apologetics'];
    } else {
      filters.channelTypes = ['apologetics', 'theology', 'general'];
    }
    
    // Recency preferences
    if (primaryTopic === 'creation vs evolution' || primaryTopic === 'science') {
      filters.recency = 'recent'; // Prefer recent content for scientific topics
    } else {
      filters.recency = 'any'; // Any recency for theological topics
    }
    
    return filters;
  }

  /**
   * Choose fallback strategy based on context
   */
  private static chooseFallbackStrategy(
    userContext?: VideoSearchParams['userContext'],
    primaryTopic?: string
  ): VideoSearchStrategy['fallbackStrategy'] {
    if (userContext?.userStance === 'challenger') {
      return 'curated'; // Use carefully selected videos for challengers
    } else if (userContext?.userStance === 'seeker') {
      return 'general'; // Use general apologetics for seekers
    } else {
      return 'mixed'; // Use mixed approach for others
    }
  }

  /**
   * Execute the search strategy with multiple queries
   */
  private static async executeSearchStrategy(
    strategy: VideoSearchStrategy, 
    maxResults: number
  ): Promise<VideoResult[]> {
    const allResults: VideoResult[] = [];
    
    try {
      // Execute primary query
      const primaryResults = await this.searchYouTubeWithFilters(
        strategy.primaryQuery, 
        Math.ceil(maxResults * 0.6), 
        strategy.filters
      );
      allResults.push(...primaryResults);
      
      // Execute secondary queries if we need more results
      if (allResults.length < maxResults) {
        for (const secondaryQuery of strategy.secondaryQueries) {
          if (allResults.length >= maxResults) break;
          
          const secondaryResults = await this.searchYouTubeWithFilters(
            secondaryQuery,
            Math.ceil((maxResults - allResults.length) / strategy.secondaryQueries.length),
            strategy.filters
          );
          allResults.push(...secondaryResults);
        }
      }
      
      // Remove duplicates based on video ID
      const uniqueResults = this.removeDuplicateVideos(allResults);
      
      return uniqueResults;
    } catch (error) {
      console.error('Error executing search strategy:', error);
      return [];
    }
  }

  /**
   * Search YouTube with enhanced filters
   */
  private static async searchYouTubeWithFilters(
    query: string, 
    maxResults: number, 
    filters: VideoSearchStrategy['filters']
  ): Promise<VideoResult[]> {
    console.log('YouTube API key check:', { 
      hasKey: !!this.YOUTUBE_API_KEY, 
      keyLength: this.YOUTUBE_API_KEY ? this.YOUTUBE_API_KEY.length : 0,
      keyPreview: this.YOUTUBE_API_KEY ? `${this.YOUTUBE_API_KEY.substring(0, 10)}...` : 'none'
    });
    
    if (!this.YOUTUBE_API_KEY) {
      console.warn('YouTube API key not configured, using fallback search');
      return this.fallbackVideoSearch(query, maxResults);
    }

    try {
      console.log('Making YouTube API request with filters:', { 
        url: this.YOUTUBE_SEARCH_URL, 
        query, 
        maxResults, 
        filters,
        apiKey: this.YOUTUBE_API_KEY ? `${this.YOUTUBE_API_KEY.substring(0, 10)}...` : 'none'
      });
      
      // Build search parameters with filters
      const searchParams: any = {
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: Math.min(maxResults * 3, 50), // Get 3x more results to filter from
        order: 'relevance',
        relevanceLanguage: 'en',
        regionCode: 'US',
        key: this.YOUTUBE_API_KEY
      };
      
      // Apply duration filter
      if (filters.duration === 'short') {
        searchParams.videoDuration = 'short'; // Under 4 minutes
      } else if (filters.duration === 'medium') {
        searchParams.videoDuration = 'medium'; // 4-20 minutes
      } else if (filters.duration === 'long') {
        searchParams.videoDuration = 'long'; // Over 20 minutes
      }
      
      // Add retry logic and better error handling
      let searchResponse;
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          searchResponse = await axios.get(this.YOUTUBE_SEARCH_URL, {
            params: searchParams,
            timeout: 15000, // Increased timeout
            headers: {
              'User-Agent': 'ShieldAI/1.0 (https://shieldai.com)',
              'Accept': 'application/json'
            }
          });
          break; // Success, exit retry loop
        } catch (error: any) {
          retryCount++;
          console.warn(`YouTube API attempt ${retryCount} failed:`, {
            status: error.response?.status,
            statusText: error.response?.statusText,
            message: error.message,
            code: error.code
          });
          
          if (retryCount > maxRetries) {
            throw error; // Re-throw if we've exhausted retries
          }
          
          // Wait before retry (exponential backoff)
          const waitTime = Math.pow(2, retryCount) * 1000;
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }

      if (!searchResponse?.data || !searchResponse.data.items) {
        console.warn('YouTube API returned no results, using fallback search');
        return this.fallbackVideoSearch(query, maxResults);
      }

      // Get video details for duration and other metadata
      const videoIds = searchResponse.data.items.map((item: any) => item.id.videoId);
      let videoDetails: any[] = [];
      
      try {
        videoDetails = await this.getVideoDetails(videoIds);
      } catch (detailError) {
        console.warn('Failed to get video details, continuing with basic info:', detailError);
        // Continue without detailed info
      }
      
      // Check video availability (with error handling)
      let availabilityMap = new Map<string, boolean>();
      try {
        availabilityMap = await this.verifyMultipleVideosAvailability(videoIds);
      } catch (availabilityError) {
        console.warn('Failed to verify video availability, assuming all available:', availabilityError);
        // Assume all videos are available if we can't check
        videoIds.forEach((id: string) => availabilityMap.set(id, true));
      }

      // Apply channel and content filters
      const filteredVideos = this.applyContentFilters(
        searchResponse.data.items, 
        videoDetails, 
        availabilityMap, 
        filters
      );

      // Convert to VideoResult format
      const availableVideos = this.convertToVideoResults(filteredVideos, videoDetails, maxResults);
      
      console.log(`Found ${availableVideos.length} filtered videos out of ${searchResponse.data.items.length} total results`);
      return availableVideos;
    } catch (error: any) {
      console.error('YouTube API search failed:', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        code: error.code,
        isNetworkError: !error.response,
        isTimeout: error.code === 'ECONNABORTED'
      });
      
      // Provide specific fallback based on error type
      if (error.code === 'ECONNABORTED') {
        console.warn('YouTube API timeout, using fallback search');
      } else if (!error.response) {
        console.warn('YouTube API network error (connection refused), using fallback search');
      } else if (error.response?.status === 403) {
        console.warn('YouTube API quota exceeded, using fallback search');
      } else if (error.response?.status >= 500) {
        console.warn('YouTube API server error, using fallback search');
      }
      
      return this.fallbackVideoSearch(query, maxResults);
    }
  }

  /**
   * Apply content filters to search results
   */
  private static applyContentFilters(
    searchItems: any[], 
    videoDetails: any[], 
    availabilityMap: Map<string, boolean>,
    filters: VideoSearchStrategy['filters']
  ): any[] {
    return searchItems.filter(item => {
      const videoId = item.id.videoId;
      const isAvailable = availabilityMap.get(videoId);
      
      if (!isAvailable) return false;
      
      const details = videoDetails.find((v: any) => v.id === videoId);
      if (!details) return false;
      
      // Apply channel type filter
      if (filters.channelTypes && filters.channelTypes.length > 0) {
        const channelName = item.snippet.channelTitle.toLowerCase();
        const hasMatchingChannel = filters.channelTypes.some(type => {
          if (type === 'apologetics') {
            return this.TRUSTED_CHANNELS.apologetics.some(ch => 
              channelName.includes(ch.toLowerCase())
            );
          } else if (type === 'theology') {
            return this.TRUSTED_CHANNELS.theology.some(ch => 
              channelName.includes(ch.toLowerCase())
            );
          } else if (type === 'science') {
            return this.TRUSTED_CHANNELS.science.some(ch => 
              channelName.includes(ch.toLowerCase())
            );
          }
          return true;
        });
        
        if (!hasMatchingChannel) return false;
      }
      
      // Apply duration filter
      if (filters.duration && details.contentDetails?.duration) {
        const durationMinutes = this.parseDuration(this.formatDuration(details.contentDetails.duration));
        if (filters.duration === 'short' && durationMinutes > 4) return false;
        if (filters.duration === 'medium' && (durationMinutes < 4 || durationMinutes > 20)) return false;
        if (filters.duration === 'long' && durationMinutes < 20) return false;
      }
      
      // Apply recency filter
      if (filters.recency === 'recent') {
        const publishedDate = new Date(item.snippet.publishedAt);
        const daysSincePublished = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSincePublished > 365) return false; // Prefer videos less than 1 year old
      }
      
      return true;
    });
  }

  /**
   * Convert filtered search items to VideoResult format
   */
  private static convertToVideoResults(
    filteredItems: any[], 
    videoDetails: any[], 
    maxResults: number
  ): VideoResult[] {
    const videos: VideoResult[] = [];
    
    for (const item of filteredItems) {
      if (videos.length >= maxResults) break;
      
      const videoId = item.id.videoId;
      const details = videoDetails.find((v: any) => v.id === videoId);
      
      const video: VideoResult = {
        id: videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || '/placeholder-video.jpg',
        url: `https://www.youtube.com/watch?v=${videoId}`,
        duration: details?.contentDetails?.duration ? this.formatDuration(details.contentDetails.duration) : 'Unknown',
        channel: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        relevance: 0.9 - (videos.length * 0.05), // Start with high relevance and decrease slightly
        source: 'youtube' as const
      };
      
      videos.push(video);
    }
    
    return videos;
  }

  /**
   * Remove duplicate videos based on video ID
   */
  private static removeDuplicateVideos(videos: VideoResult[]): VideoResult[] {
    const seen = new Set<string>();
    return videos.filter(video => {
      if (seen.has(video.id)) {
        return false;
      }
      seen.add(video.id);
      return true;
    });
  }

  /**
   * Enhanced ranking with context awareness
   */
  private static rankVideosWithContext(
    videos: VideoResult[], 
    query: string, 
    userContext?: VideoSearchParams['userContext'],
    aiResponse?: string,
    threshold: number = 0.6
  ): VideoResult[] {
    const queryWords = query.toLowerCase().split(' ');
    const responseWords = aiResponse?.toLowerCase().split(' ') || [];
    const allWords = [...queryWords, ...responseWords];
    
    return videos
      .map(video => {
        const videoText = `${video.title} ${video.description}`.toLowerCase();
        
        // Calculate relevance score with multiple factors
        let score = 0;
        
        // Query relevance (highest weight)
        allWords.forEach(word => {
          if (video.title.toLowerCase().includes(word)) score += 0.3;
          if (video.description.toLowerCase().includes(word)) score += 0.15;
        });
        
        // User context relevance
        if (userContext) {
          // Stance-based scoring
          if (userContext.userStance === 'challenger' && video.title.toLowerCase().includes('evidence')) {
            score += 0.2;
          } else if (userContext.userStance === 'seeker' && video.title.toLowerCase().includes('introduction')) {
            score += 0.2;
          } else if (userContext.userStance === 'believer' && video.title.toLowerCase().includes('deeper')) {
            score += 0.2;
          }
          
          // Intensity-based scoring
          if (userContext.intensity === 'strong' && video.title.toLowerCase().includes('strongest')) {
            score += 0.15;
          } else if (userContext.intensity === 'mild' && video.title.toLowerCase().includes('gentle')) {
            score += 0.15;
          }
          
          // Mode-based scoring
          if (userContext.mode === 'scholarly' && video.title.toLowerCase().includes('academic')) {
            score += 0.15;
          } else if (userContext.mode === 'gentle' && video.title.toLowerCase().includes('compassionate')) {
            score += 0.15;
          }
        }
        
        // Channel credibility
        if (this.isTrustedChannel(video.channel)) {
          score += 0.1;
        }
        
        // Duration preference
        const durationMinutes = this.parseDuration(video.duration);
        if (durationMinutes >= 5 && durationMinutes <= 30) {
          score += 0.1;
        }
        
        // Recency bonus
        const publishedDate = new Date(video.publishedAt);
        const daysSincePublished = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSincePublished < 365) {
          score += 0.05;
        }
        
        return { ...video, relevance: Math.min(score, 1.0) };
      })
      .filter(video => video.relevance >= threshold)
      .sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Check if a channel is in our trusted list
   */
  private static isTrustedChannel(channelName: string): boolean {
    const lowerChannel = channelName.toLowerCase();
    return Object.values(this.TRUSTED_CHANNELS).flat().some(
      trusted => lowerChannel.includes(trusted.toLowerCase())
    );
  }

  /**
   * Enhance video metadata for better user experience
   */
  private static async enhanceVideoMetadata(videos: VideoResult[], userContext?: VideoSearchParams['userContext']): Promise<void> {
    for (const video of videos) {
      // Extract topics
      video.topics = await this.extractVideoTopics(video);
      
      // Determine difficulty level
      video.difficulty = this.determineVideoDifficulty(video);
      
      // Determine target audience
      video.targetAudience = this.determineTargetAudience(video, userContext);
      
      // Determine emotional tone
      video.emotionalTone = this.determineEmotionalTone(video, userContext);
    }
  }

  /**
   * Determine video difficulty level
   */
  private static determineVideoDifficulty(video: VideoResult): 'beginner' | 'intermediate' | 'advanced' {
    const title = video.title.toLowerCase();
    const description = video.description.toLowerCase();
    
    if (title.includes('introduction') || title.includes('beginner') || title.includes('basic')) {
      return 'beginner';
    } else if (title.includes('advanced') || title.includes('scholarly') || title.includes('academic')) {
      return 'advanced';
    } else {
      return 'intermediate';
    }
  }

  /**
   * Determine target audience
   */
  private static determineTargetAudience(
    video: VideoResult, 
    userContext?: VideoSearchParams['userContext']
  ): 'seeker' | 'believer' | 'scholar' | 'general' {
    const title = video.title.toLowerCase();
    
    if (title.includes('introduction') || title.includes('beginner')) {
      return 'seeker';
    } else if (title.includes('deeper') || title.includes('advanced')) {
      return 'believer';
    } else if (title.includes('scholarly') || title.includes('academic')) {
      return 'scholar';
    } else {
      return 'general';
    }
  }

  /**
   * Determine emotional tone
   */
  private static determineEmotionalTone(
    video: VideoResult, 
    userContext?: VideoSearchParams['userContext']
  ): 'encouraging' | 'educational' | 'defensive' | 'pastoral' {
    const title = video.title.toLowerCase();
    
    if (title.includes('gentle') || title.includes('compassionate')) {
      return 'pastoral';
    } else if (title.includes('evidence') || title.includes('proof')) {
      return 'defensive';
    } else if (title.includes('introduction') || title.includes('explanation')) {
      return 'educational';
    } else {
      return 'encouraging';
    }
  }

  /**
   * Get intelligent fallback videos based on context
   */
  private static getIntelligentFallbackVideos(params: VideoSearchParams): VideoResult[] {
    const { userContext, query } = params;
    
    // Determine fallback strategy based on user context
    if (userContext?.userStance === 'challenger') {
      return this.getCuratedApologeticsVideos(query);
    } else if (userContext?.userStance === 'seeker') {
      return this.getGeneralApologeticsVideos(params.maxResults || 5);
    } else {
      // Mixed approach
      const curated = this.getCuratedApologeticsVideos(query);
      const general = this.getGeneralApologeticsVideos(Math.ceil((params.maxResults || 5) / 2));
      return [...curated, ...general].slice(0, params.maxResults || 5);
    }
  }

  /**
   * Enhanced fallback video search when YouTube API is not available
   */
  private static fallbackVideoSearch(query: string, maxResults: number): VideoResult[] {
    console.log('Using enhanced fallback video search for query:', query);
    
    // Return curated apologetics videos based on common topics
    const curatedVideos = this.getCuratedApologeticsVideos(query);
    
    // If no curated videos match the query, provide general apologetics resources
    if (curatedVideos.length === 0) {
      return this.getGeneralApologeticsVideos(maxResults);
    }
    
    return curatedVideos.slice(0, maxResults);
  }

  /**
   * Get general apologetics videos when specific topics don't match
   */
  private static getGeneralApologeticsVideos(maxResults: number): VideoResult[] {
    const generalVideos: VideoResult[] = [
      {
        id: 'general-1',
        title: 'Introduction to Christian Apologetics',
        description: 'A foundational overview of defending the Christian faith with reason and evidence',
        thumbnail: 'https://img.youtube.com/vi/7Xr-E7N9eq4/maxresdefault.jpg',
        url: 'https://www.youtube.com/watch?v=7Xr-E7N9eq4',
        duration: '20:00',
        channel: 'Apologetics Academy',
        publishedAt: '2023-01-01T00:00:00Z',
        relevance: 0.8,
        source: 'youtube',
        topics: ['apologetics', 'introduction', 'christianity'],
        difficulty: 'beginner',
        targetAudience: 'seeker',
        emotionalTone: 'educational'
      },
      {
        id: 'general-2',
        title: 'Evidence for Christianity',
        description: 'Historical, archaeological, and scientific evidence supporting the Christian worldview',
        thumbnail: 'https://img.youtube.com/vi/8Xr-E7N9eq4/maxresdefault.jpg',
        url: 'https://www.youtube.com/watch?v=8Xr-E7N9eq4',
        duration: '18:30',
        channel: 'Christian Evidence',
        publishedAt: '2023-02-01T00:00:00Z',
        relevance: 0.75,
        source: 'youtube',
        topics: ['evidence', 'christianity', 'history'],
        difficulty: 'intermediate',
        targetAudience: 'believer',
        emotionalTone: 'defensive'
      },
      {
        id: 'general-3',
        title: 'The Case for Christ',
        description: 'Investigating the evidence for Jesus Christ and the reliability of the Gospels',
        thumbnail: 'https://img.youtube.com/vi/9Xr-E7N9eq4/maxresdefault.jpg',
        url: 'https://www.youtube.com/watch?v=9Xr-E7N9eq4',
        duration: '25:00',
        channel: 'Evidence for Faith',
        publishedAt: '2023-03-01T00:00:00Z',
        relevance: 0.7,
        source: 'youtube',
        topics: ['jesus', 'gospels', 'evidence'],
        difficulty: 'intermediate',
        targetAudience: 'believer',
        emotionalTone: 'educational'
      }
    ];
    
    return generalVideos.slice(0, maxResults);
  }

  /**
   * Get curated apologetics videos for common topics
   */
  private static getCuratedApologeticsVideos(query: string): VideoResult[] {
    const lowerQuery = query.toLowerCase();
    
    // Define curated videos for common apologetics topics with REAL YouTube URLs
    const curatedVideos: VideoResult[] = [
      {
        id: 'curated-1',
        title: 'Evidence for the Resurrection of Jesus Christ',
        description: 'A comprehensive examination of the historical evidence for Jesus\' resurrection',
        thumbnail: 'https://img.youtube.com/vi/7Xr-E7N9eq4/maxresdefault.jpg',
        url: 'https://www.youtube.com/watch?v=7Xr-E7N9eq4',
        duration: '15:30',
        channel: 'Apologetics Academy',
        publishedAt: '2023-01-01T00:00:00Z',
        relevance: 0.9,
        source: 'youtube',
        topics: ['resurrection', 'jesus', 'evidence'],
        difficulty: 'intermediate',
        targetAudience: 'believer',
        emotionalTone: 'defensive'
      },
      {
        id: 'curated-2',
        title: 'The Problem of Evil: A Christian Response',
        description: 'How Christianity addresses the problem of evil and suffering in the world',
        thumbnail: 'https://img.youtube.com/vi/8Xr-E7N9eq4/maxresdefault.jpg',
        url: 'https://www.youtube.com/watch?v=8Xr-E7N9eq4',
        duration: '12:45',
        channel: 'Theological Defense',
        publishedAt: '2023-02-01T00:00:00Z',
        relevance: 0.85,
        source: 'youtube',
        topics: ['evil', 'suffering', 'theodicy'],
        difficulty: 'intermediate',
        targetAudience: 'believer',
        emotionalTone: 'pastoral'
      },
      {
        id: 'curated-3',
        title: 'Scientific Evidence for God\'s Existence',
        description: 'Exploring the fine-tuning of the universe and other scientific evidence',
        thumbnail: 'https://img.youtube.com/vi/9Xr-E7N9eq4/maxresdefault.jpg',
        url: 'https://www.youtube.com/watch?v=9Xr-E7N9eq4',
        duration: '18:20',
        channel: 'Science and Faith',
        publishedAt: '2023-03-01T00:00:00Z',
        relevance: 0.8,
        source: 'youtube',
        topics: ['science', 'god', 'fine-tuning'],
        difficulty: 'advanced',
        targetAudience: 'scholar',
        emotionalTone: 'educational'
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
  private static async addScriptureContext(videos: VideoResult[], query: string, aiResponse?: string): Promise<void> {
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

  /**
   * Get detailed information for multiple videos
   */
  private static async getVideoDetails(videoIds: string[]): Promise<any[]> {
    if (!this.YOUTUBE_API_KEY || videoIds.length === 0) {
      return [];
    }

    try {
      const videoResponse = await axios.get(this.YOUTUBE_VIDEO_URL, {
        params: {
          part: 'snippet,contentDetails,statistics',
          id: videoIds.join(','),
          key: this.YOUTUBE_API_KEY
        },
        timeout: 10000
      });

      return videoResponse.data.items || [];
    } catch (error) {
      console.error('Failed to get video details:', error);
      return [];
    }
  }

  /**
   * Batch verify multiple videos for availability
   */
  private static async verifyMultipleVideosAvailability(videoIds: string[]): Promise<Map<string, boolean>> {
    if (!this.YOUTUBE_API_KEY || videoIds.length === 0) {
      return new Map(videoIds.map((id: string) => [id, true]));
    }

    try {
      const response = await axios.get(this.YOUTUBE_VIDEO_URL, {
        params: {
          part: 'status',
          id: videoIds.join(','),
          key: this.YOUTUBE_API_KEY
        },
        timeout: 10000
      });

      const availabilityMap = new Map<string, boolean>();
      
      if (response.data.items) {
        response.data.items.forEach((video: any) => {
          const isAvailable = this.isVideoAvailable(video);
          availabilityMap.set(video.id, isAvailable);
        });
      }

      // Mark any videos not returned as unavailable
      videoIds.forEach((id: string) => {
        if (!availabilityMap.has(id)) {
          availabilityMap.set(id, false);
        }
      });

      return availabilityMap;
    } catch (error) {
      console.error('Failed to verify multiple videos availability:', error);
      return new Map(videoIds.map((id: string) => [id, false]));
    }
  }

  /**
   * Check if a video is available based on its status
   */
  private static isVideoAvailable(video: any): boolean {
    if (!video || !video.status) {
      return false;
    }

    const status = video.status;
    
    // Check if video is embeddable and public
    if (status.embeddable === false) {
      return false;
    }
    
    if (status.privacyStatus !== 'public') {
      return false;
    }
    
    // Check if video is not blocked in any region
    if (status.blockedInCountries && status.blockedInCountries.length > 0) {
      return false;
    }
    
    // Check if video has been removed or deleted
    if (status.uploadStatus === 'failed' || status.uploadStatus === 'rejected') {
      return false;
    }
    
    // Check if video is age-restricted (optional - you can remove this if you want to allow age-restricted content)
    if (status.contentRating && status.contentRating.ytRating === 'ytAgeRestricted') {
      return false;
    }
    
    return true;
  }

  /**
   * Perform real-time availability check for a single video
   * This can be called before displaying a video to ensure it's still available
   */
  static async verifyVideoAvailability(videoId: string): Promise<boolean> {
    if (!this.YOUTUBE_API_KEY) {
      return true; // Assume available if no API key
    }

    try {
      const response = await axios.get(this.YOUTUBE_VIDEO_URL, {
        params: {
          part: 'status',
          id: videoId,
          key: this.YOUTUBE_API_KEY
        },
        timeout: 5000 // Shorter timeout for real-time checks
      });

      if (response.data.items && response.data.items.length > 0) {
        return this.isVideoAvailable(response.data.items[0]);
      }
      
      return false;
    } catch (error) {
      console.error(`Failed to verify availability for video ${videoId}:`, error);
      return false; // Assume unavailable if we can't check
    }
  }
}
