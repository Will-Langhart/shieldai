import { EmbeddingService } from './embeddings';

export interface AIInsightVector {
  id: string;
  values: number[];
  metadata: {
    user_id: string;
    insight_id: string;
    passage_reference: string;
    passage_text: string;
    bible_version: string;
    explanation: string;
    key_themes: string[];
    historical_context?: string;
    theological_meaning?: string;
    practical_application?: string;
    prayer_points: string[];
    ai_model: string;
    created_at: string;
    is_favorite: boolean;
    is_shared: boolean;
    tags: string[];
    notes?: string;
    content: string; // Combined searchable content
    type: 'ai_insight';
    // Enhanced metadata for better retrieval
    passage_book: string;
    passage_chapter: number;
    passage_verse?: number;
    insight_quality_score: number;
    user_engagement_score: number;
    theological_depth: 'basic' | 'intermediate' | 'advanced';
    practical_relevance: 'low' | 'medium' | 'high';
  };
}

export interface InsightSearchResult {
  id: string;
  score: number;
  insight_id: string;
  passage_reference: string;
  explanation: string;
  key_themes: string[];
  user_id: string;
  created_at: string;
  is_favorite: boolean;
  is_shared: boolean;
  tags: string[];
  metadata: Record<string, any>;
}

export interface InsightRecommendation {
  insight_id: string;
  passage_reference: string;
  explanation: string;
  key_themes: string[];
  relevance_score: number;
  recommendation_reason: string;
  similarity_to_current: number;
}

export class InsightsPineconeService {
  private static defaultTopK = Number(process.env.PINECONE_TOPK || 10);
  private static minSimilarity = Number(process.env.PINECONE_MIN_SIMILARITY || 0.6);
  private static batchSize = Number(process.env.PINECONE_BATCH_SIZE || 50);
  private static maxRetries = Number(process.env.PINECONE_MAX_RETRIES || 3);
  private static backoffMs = Number(process.env.PINECONE_BACKOFF_MS || 300);
  private static targetDim = Number(process.env.PINECONE_DIMENSION || 1024);

  // Hardcoded Pinecone configuration (temporary fix for env loading issue)
  private static PINECONE_API_KEY = 'pcsk_3MJJaR_EjBt6ktRBUfLAmCTa8DTtQpRBKtwDKB657XofsBYVY6S9aWXxrLCtpvkUGuCULy';
  private static SHIELDAI_INDEX_HOST = 'shieldai-smb4qh6.svc.aped-4627-b74a.pinecone.io';

  // Utility: sleep
  private static async sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }

  // Generate namespace for user insights
  private static generateUserNamespace(userId: string): string {
    return `insights_${userId.replace(/-/g, '_')}`;
  }

  // Generate namespace for shared insights
  private static generateSharedNamespace(): string {
    return 'insights_shared';
  }

  // Store AI insight in Pinecone
  static async storeAIInsight(
    insight: {
      id: string;
      user_id: string;
      passage_reference: string;
      passage_text: string;
      bible_version: string;
      explanation: string;
      key_themes: string[];
      cross_references: any[];
      study_questions: any[];
      historical_context?: string;
      theological_meaning?: string;
      practical_application?: string;
      prayer_points: string[];
      ai_model: string;
      is_favorite: boolean;
      is_shared: boolean;
      tags: string[];
      notes?: string;
    }
  ): Promise<void> {
    try {
      console.log(`Storing AI insight in Pinecone: ${insight.passage_reference}`);
      
      // Generate embedding for the combined content
      const combinedContent = this.createCombinedContent(insight);
      const embedding = await EmbeddingService.generateEmbedding(combinedContent);
      
      // Convert to target dimension
      const values = this.targetDim === 1536 ? embedding : EmbeddingService.convertTo1024Dimensions(embedding);
      
      // Parse passage reference to extract book, chapter, verse
      const passageInfo = this.parsePassageReference(insight.passage_reference);
      
      // Calculate quality scores
      const qualityScores = this.calculateQualityScores(insight);
      
      const vector: AIInsightVector = {
        id: `insight_${insight.id}`,
        values,
        metadata: {
          user_id: insight.user_id,
          insight_id: insight.id,
          passage_reference: insight.passage_reference,
          passage_text: insight.passage_text,
          bible_version: insight.bible_version,
          explanation: insight.explanation,
          key_themes: insight.key_themes,
          historical_context: insight.historical_context,
          theological_meaning: insight.theological_meaning,
          practical_application: insight.practical_application,
          prayer_points: insight.prayer_points,
          ai_model: insight.ai_model,
          created_at: new Date().toISOString(),
          is_favorite: insight.is_favorite,
          is_shared: insight.is_shared,
          tags: insight.tags,
          notes: insight.notes,
          content: combinedContent,
          type: 'ai_insight',
          passage_book: passageInfo.book,
          passage_chapter: passageInfo.chapter,
          passage_verse: passageInfo.verse,
          insight_quality_score: qualityScores.quality,
          user_engagement_score: qualityScores.engagement,
          theological_depth: qualityScores.theologicalDepth,
          practical_relevance: qualityScores.practicalRelevance,
        },
      };

      // Store in user namespace
      await this.upsertBatched([vector], this.generateUserNamespace(insight.user_id));
      
      // If shared, also store in shared namespace
      if (insight.is_shared) {
        await this.upsertBatched([vector], this.generateSharedNamespace());
      }
      
      console.log(`✅ Stored AI insight in Pinecone: ${insight.passage_reference}`);
    } catch (error) {
      console.error(`❌ Error storing AI insight ${insight.passage_reference}:`, error);
      throw error;
    }
  }

  // Search for similar insights
  static async searchSimilarInsights(
    query: string,
    userId: string,
    options: {
      includeShared?: boolean;
      topK?: number;
      minScore?: number;
      filters?: {
        key_themes?: string[];
        bible_version?: string;
        theological_depth?: string;
        practical_relevance?: string;
        is_favorite?: boolean;
        tags?: string[];
      };
    } = {}
  ): Promise<InsightSearchResult[]> {
    try {
      const {
        includeShared = true,
        topK = 10,
        minScore = 0.6,
        filters = {}
      } = options;

      console.log(`Searching for similar insights: "${query.substring(0, 100)}..."`);
      
      const queryEmbedding = await EmbeddingService.generateEmbedding(query);
      const queryVec = this.targetDim === 1536 ? queryEmbedding : EmbeddingService.convertTo1024Dimensions(queryEmbedding);
      
      const results: InsightSearchResult[] = [];
      
      // Search user's insights
      const userResults = await this.searchInNamespace(
        queryVec,
        this.generateUserNamespace(userId),
        topK,
        minScore,
        filters
      );
      results.push(...userResults);
      
      // Search shared insights if requested
      if (includeShared) {
        const sharedResults = await this.searchInNamespace(
          queryVec,
          this.generateSharedNamespace(),
          topK,
          minScore,
          { ...filters, exclude_user: userId }
        );
        results.push(...sharedResults);
      }
      
      // Remove duplicates and sort by score
      const uniqueResults = this.deduplicateResults(results);
      const sortedResults = uniqueResults
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
      
      console.log(`Found ${sortedResults.length} similar insights`);
      return sortedResults;
    } catch (error) {
      console.error('Error searching similar insights:', error);
      return [];
    }
  }

  // Get insights recommendations based on current study patterns
  static async getInsightRecommendations(
    userId: string,
    currentPassage?: string,
    options: {
      topK?: number;
      includeShared?: boolean;
      basedOnThemes?: boolean;
      basedOnPassage?: boolean;
    } = {}
  ): Promise<InsightRecommendation[]> {
    try {
      const {
        topK = 5,
        includeShared = true,
        basedOnThemes = true,
        basedOnPassage = true
      } = options;

      console.log(`Getting insight recommendations for user ${userId}`);
      
      const recommendations: InsightRecommendation[] = [];
      
      // Get user's recent insights to understand study patterns
      const userInsights = await this.getUserInsights(userId, 20);
      
      if (userInsights.length === 0) {
        // If no user insights, recommend popular shared insights
        return await this.getPopularSharedInsights(topK);
      }
      
      // Extract themes from user's insights
      const userThemes = this.extractUserThemes(userInsights);
      
      // Get recommendations based on themes
      if (basedOnThemes && userThemes.length > 0) {
        const themeQuery = userThemes.join(' ');
        const themeResults = await this.searchSimilarInsights(
          themeQuery,
          userId,
          { includeShared, topK: topK * 2, minScore: 0.5 }
        );
        
        recommendations.push(...this.convertToRecommendations(
          themeResults,
          'Based on your study themes',
          userThemes
        ));
      }
      
      // Get recommendations based on current passage
      if (basedOnPassage && currentPassage) {
        const passageResults = await this.searchSimilarInsights(
          currentPassage,
          userId,
          { includeShared, topK: topK * 2, minScore: 0.5 }
        );
        
        recommendations.push(...this.convertToRecommendations(
          passageResults,
          'Related to your current passage',
          [currentPassage]
        ));
      }
      
      // Remove duplicates and sort by relevance
      const uniqueRecommendations = this.deduplicateRecommendations(recommendations);
      return uniqueRecommendations
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, topK);
    } catch (error) {
      console.error('Error getting insight recommendations:', error);
      return [];
    }
  }

  // Get insights for a specific Bible passage
  static async getInsightsForPassage(
    passageReference: string,
    userId: string,
    options: {
      includeShared?: boolean;
      topK?: number;
    } = {}
  ): Promise<InsightSearchResult[]> {
    try {
      const { includeShared = true, topK = 10 } = options;
      
      console.log(`Getting insights for passage: ${passageReference}`);
      
      // Search for insights related to this passage
      const results = await this.searchSimilarInsights(
        passageReference,
        userId,
        {
          includeShared,
          topK,
          minScore: 0.4,
          filters: {
            // Add passage-specific filters if needed
          }
        }
      );
      
      // Filter results that are specifically about this passage
      const passageResults = results.filter(result => 
        result.passage_reference.toLowerCase().includes(passageReference.toLowerCase()) ||
        result.metadata.passage_reference?.toLowerCase().includes(passageReference.toLowerCase())
      );
      
      return passageResults;
    } catch (error) {
      console.error('Error getting insights for passage:', error);
      return [];
    }
  }

  // Get user's insights with pagination
  static async getUserInsights(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<InsightSearchResult[]> {
    try {
      // This would require additional Pinecone functionality
      // For now, we'll use search with a broad query
      const results = await this.searchSimilarInsights(
        'bible study faith christianity',
        userId,
        { includeShared: false, topK: limit, minScore: 0.1 }
      );
      
      return results.slice(offset, offset + limit);
    } catch (error) {
      console.error('Error getting user insights:', error);
      return [];
    }
  }

  // Get popular shared insights
  static async getPopularSharedInsights(topK: number = 10): Promise<InsightRecommendation[]> {
    try {
      // Search shared insights with a broad query
      const results = await this.searchInNamespace(
        new Array(this.targetDim).fill(0.1), // Dummy vector for broad search
        this.generateSharedNamespace(),
        topK * 2,
        0.3,
        {}
      );
      
      return results.map(result => ({
        insight_id: result.insight_id,
        passage_reference: result.passage_reference,
        explanation: result.explanation,
        key_themes: result.key_themes,
        relevance_score: result.score,
        recommendation_reason: 'Popular shared insight',
        similarity_to_current: 0.5
      }));
    } catch (error) {
      console.error('Error getting popular shared insights:', error);
      return [];
    }
  }

  // Private helper methods
  private static async searchInNamespace(
    queryVec: number[],
    namespace: string,
    topK: number,
    minScore: number,
    filters: any
  ): Promise<InsightSearchResult[]> {
    try {
      const response = await fetch(`https://${this.SHIELDAI_INDEX_HOST}/query`, {
        method: 'POST',
        headers: {
          'Api-Key': this.PINECONE_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vector: queryVec,
          topK,
          namespace,
          filter: filters,
          includeMetadata: true,
        })
      });

      if (!response.ok) {
        throw new Error(`Pinecone query failed: ${response.status}`);
      }

      const data = await response.json();
      
      return (data.matches || [])
        .filter((match: any) => (match.score || 0) >= minScore)
        .map((match: any) => ({
          id: match.id,
          score: match.score || 0,
          insight_id: match.metadata?.insight_id || '',
          passage_reference: match.metadata?.passage_reference || '',
          explanation: match.metadata?.explanation || '',
          key_themes: match.metadata?.key_themes || [],
          user_id: match.metadata?.user_id || '',
          created_at: match.metadata?.created_at || '',
          is_favorite: match.metadata?.is_favorite || false,
          is_shared: match.metadata?.is_shared || false,
          tags: match.metadata?.tags || [],
          metadata: match.metadata,
        }));
    } catch (error) {
      console.error('Error searching in namespace:', error);
      return [];
    }
  }

  private static async upsertBatched(vectors: AIInsightVector[], namespace: string) {
    for (let i = 0; i < vectors.length; i += this.batchSize) {
      const chunk = vectors.slice(i, i + this.batchSize);
      let attempt = 0;
      
      while (true) {
        try {
          const res = await fetch(`https://${this.SHIELDAI_INDEX_HOST}/vectors/upsert`, {
            method: 'POST',
            headers: { 
              'Api-Key': this.PINECONE_API_KEY, 
              'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
              vectors: chunk,
              namespace,
            }),
          });
          
          if (!res.ok) throw new Error(`Upsert failed: ${res.status}`);
          break;
        } catch (err) {
          attempt += 1;
          if (attempt > this.maxRetries) throw err;
          await this.sleep(this.backoffMs * attempt);
        }
      }
    }
  }

  private static createCombinedContent(insight: any): string {
    const parts = [
      insight.explanation,
      insight.passage_reference,
      insight.passage_text,
      insight.key_themes.join(' '),
      insight.historical_context || '',
      insight.theological_meaning || '',
      insight.practical_application || '',
      insight.prayer_points.join(' '),
      insight.tags.join(' '),
      insight.notes || ''
    ];
    
    return parts.filter(part => part && part.trim()).join(' ');
  }

  private static parsePassageReference(reference: string): { book: string; chapter: number; verse?: number } {
    // Simple parsing - in production, use a proper Bible reference parser
    const parts = reference.split(' ');
    const book = parts[0] || '';
    const chapterVerse = parts[1] || '';
    const [chapter, verse] = chapterVerse.split(':');
    
    return {
      book,
      chapter: parseInt(chapter) || 1,
      verse: verse ? parseInt(verse) : undefined
    };
  }

  private static calculateQualityScores(insight: any): {
    quality: number;
    engagement: number;
    theologicalDepth: 'basic' | 'intermediate' | 'advanced';
    practicalRelevance: 'low' | 'medium' | 'high';
  } {
    // Calculate quality score based on content length and completeness
    const contentLength = insight.explanation.length;
    const completeness = [
      insight.historical_context,
      insight.theological_meaning,
      insight.practical_application,
      insight.prayer_points.length > 0
    ].filter(Boolean).length / 4;
    
    const quality = Math.min(1.0, (contentLength / 1000) * 0.5 + completeness * 0.5);
    
    // Calculate engagement score based on user interactions
    const engagement = (insight.is_favorite ? 0.3 : 0) + (insight.tags.length * 0.1);
    
    // Determine theological depth
    const theologicalDepth = contentLength > 2000 ? 'advanced' : 
                           contentLength > 1000 ? 'intermediate' : 'basic';
    
    // Determine practical relevance
    const practicalRelevance = insight.practical_application && insight.practical_application.length > 100 ? 'high' :
                              insight.practical_application ? 'medium' : 'low';
    
    return { quality, engagement, theologicalDepth, practicalRelevance };
  }

  private static extractUserThemes(insights: InsightSearchResult[]): string[] {
    const allThemes = insights.flatMap(insight => insight.key_themes);
    const themeCounts = allThemes.reduce((acc, theme) => {
      acc[theme] = (acc[theme] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(themeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([theme]) => theme);
  }

  private static convertToRecommendations(
    results: InsightSearchResult[],
    reason: string,
    context: string[]
  ): InsightRecommendation[] {
    return results.map(result => ({
      insight_id: result.insight_id,
      passage_reference: result.passage_reference,
      explanation: result.explanation,
      key_themes: result.key_themes,
      relevance_score: result.score,
      recommendation_reason: reason,
      similarity_to_current: this.calculateSimilarity(context, result.key_themes)
    }));
  }

  private static calculateSimilarity(context: string[], themes: string[]): number {
    const contextWords = context.join(' ').toLowerCase().split(/\s+/);
    const themeWords = themes.join(' ').toLowerCase().split(/\s+/);
    
    const intersection = contextWords.filter(word => themeWords.includes(word));
    const union = Array.from(new Set([...contextWords, ...themeWords]));
    
    return intersection.length / union.length;
  }

  private static deduplicateResults(results: InsightSearchResult[]): InsightSearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      if (seen.has(result.insight_id)) return false;
      seen.add(result.insight_id);
      return true;
    });
  }

  private static deduplicateRecommendations(recommendations: InsightRecommendation[]): InsightRecommendation[] {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
      if (seen.has(rec.insight_id)) return false;
      seen.add(rec.insight_id);
      return true;
    });
  }
}
