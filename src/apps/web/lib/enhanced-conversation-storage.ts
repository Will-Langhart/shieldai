// Enhanced conversation storage with user response tracking and analytics
import fs from 'fs';
import path from 'path';

// Enhanced interfaces for comprehensive conversation tracking
interface EnhancedConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  
  // Enhanced metadata
  metadata: {
    total_messages: number;
    user_messages: number;
    assistant_messages: number;
    conversation_duration_seconds: number;
    average_response_time_ms: number;
    topics: string[];
    sentiment_score: number; // -1 to 1
    engagement_level: 'low' | 'medium' | 'high';
    conversation_quality_score: number; // 0 to 100
    user_satisfaction_rating?: number; // 1 to 5
    user_feedback?: string;
    tags: string[];
    difficulty_level: 'beginner' | 'intermediate' | 'advanced';
    bible_verses_referenced: number;
    questions_asked: number;
    follow_up_questions: number;
  };
  
  // User engagement tracking
  engagement: {
    time_spent_reading_ms: number;
    scroll_depth_percentage: number;
    messages_clicked: string[];
    copy_actions: number;
    share_actions: number;
    bookmark_actions: number;
    last_activity_at: string;
    return_visits: number;
  };
  
  // Analytics
  analytics: {
    session_id: string;
    device_type: 'mobile' | 'tablet' | 'desktop';
    browser: string;
    referrer?: string;
    utm_source?: string;
    utm_campaign?: string;
    ip_address?: string; // Hashed for privacy
    location?: {
      country: string;
      region: string;
      city: string;
    };
  };
}

interface EnhancedMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  
  // Enhanced message metadata
  metadata: {
    mode: 'gentle' | 'scholarly' | 'debate';
    timestamp: string;
    processing_time_ms: number;
    token_count: number;
    word_count: number;
    character_count: number;
    
    // User response tracking
    user_interactions: {
      time_to_read_ms?: number;
      was_copied: boolean;
      was_shared: boolean;
      was_bookmarked: boolean;
      was_rated: boolean;
      rating?: number; // 1 to 5
      feedback?: string;
      reaction?: 'helpful' | 'not_helpful' | 'confusing' | 'excellent';
    };
    
    // Content analysis
    content_analysis: {
      sentiment: 'positive' | 'neutral' | 'negative';
      topics: string[];
      entities: string[];
      bible_references: string[];
      questions_asked: number;
      answers_provided: number;
      scripture_quotes: number;
      apologetics_arguments: number;
    };
    
    // AI response quality metrics
    ai_metrics: {
      relevance_score: number; // 0 to 1
      accuracy_score: number; // 0 to 1
      helpfulness_score: number; // 0 to 1
      clarity_score: number; // 0 to 1
      biblical_accuracy: number; // 0 to 1
      response_completeness: number; // 0 to 1
    };
  };
}

interface UserProfile {
  user_id: string;
  preferences: {
    preferred_mode: 'gentle' | 'scholarly' | 'debate';
    topics_of_interest: string[];
    difficulty_preference: 'beginner' | 'intermediate' | 'advanced';
    notification_preferences: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  
  engagement_stats: {
    total_conversations: number;
    total_messages: number;
    average_session_duration: number;
    favorite_topics: string[];
    most_used_mode: string;
    engagement_trend: 'increasing' | 'stable' | 'decreasing';
    last_active: string;
    streak_days: number;
  };
  
  learning_progress: {
    topics_studied: string[];
    knowledge_gaps: string[];
    recommended_topics: string[];
    skill_level: 'beginner' | 'intermediate' | 'advanced';
    learning_goals: string[];
  };
}

interface EnhancedStorageData {
  conversations: Record<string, EnhancedConversation>;
  messages: Record<string, EnhancedMessage[]>;
  user_conversations: Record<string, string[]>;
  user_profiles: Record<string, UserProfile>;
  analytics: {
    total_conversations: number;
    total_messages: number;
    active_users: number;
    average_conversation_length: number;
    most_popular_topics: string[];
    user_satisfaction_average: number;
    last_updated: string;
  };
}

class EnhancedConversationStorage {
  private conversations: Map<string, EnhancedConversation> = new Map();
  private messages: Map<string, EnhancedMessage[]> = new Map();
  private userConversations: Map<string, string[]> = new Map();
  private userProfiles: Map<string, UserProfile> = new Map();
  private storageFile: string;

  constructor() {
    this.storageFile = path.join(process.cwd(), '.enhanced-conversation-storage.json');
    this.loadFromFile();
  }

  private loadFromFile(): void {
    try {
      if (fs.existsSync(this.storageFile)) {
        const data = JSON.parse(fs.readFileSync(this.storageFile, 'utf8')) as EnhancedStorageData;
        this.conversations = new Map(Object.entries(data.conversations || {}));
        this.messages = new Map(Object.entries(data.messages || {}));
        this.userConversations = new Map(Object.entries(data.user_conversations || {}));
        this.userProfiles = new Map(Object.entries(data.user_profiles || {}));
      }
    } catch (error) {
      console.warn('Failed to load enhanced conversation storage:', error);
    }
  }

  private saveToFile(): void {
    try {
      const data: EnhancedStorageData = {
        conversations: Object.fromEntries(this.conversations),
        messages: Object.fromEntries(this.messages),
        user_conversations: Object.fromEntries(this.userConversations),
        user_profiles: Object.fromEntries(this.userProfiles),
        analytics: this.generateAnalytics()
      };
      
      fs.writeFileSync(this.storageFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save enhanced conversation storage:', error);
    }
  }

  private generateAnalytics() {
    const totalConversations = this.conversations.size;
    const totalMessages = Array.from(this.messages.values()).reduce((sum, msgs) => sum + msgs.length, 0);
    const activeUsers = this.userProfiles.size;
    
    const conversationLengths = Array.from(this.conversations.values()).map(conv => conv.metadata.total_messages);
    const averageConversationLength = conversationLengths.length > 0 
      ? conversationLengths.reduce((sum, len) => sum + len, 0) / conversationLengths.length 
      : 0;

    // Extract topics from all conversations
    const allTopics = Array.from(this.conversations.values())
      .flatMap(conv => conv.metadata.topics);
    const topicCounts = allTopics.reduce((acc, topic) => {
      acc[topic] = (acc[topic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostPopularTopics = Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([topic]) => topic);

    // Calculate average user satisfaction
    const satisfactionRatings = Array.from(this.conversations.values())
      .map(conv => conv.metadata.user_satisfaction_rating)
      .filter(rating => rating !== undefined) as number[];
    const averageSatisfaction = satisfactionRatings.length > 0
      ? satisfactionRatings.reduce((sum, rating) => sum + rating, 0) / satisfactionRatings.length
      : 0;

    return {
      total_conversations: totalConversations,
      total_messages: totalMessages,
      active_users: activeUsers,
      average_conversation_length: averageConversationLength,
      most_popular_topics: mostPopularTopics,
      user_satisfaction_average: averageSatisfaction,
      last_updated: new Date().toISOString()
    };
  }

  // Enhanced conversation management
  createConversation(conversation: Omit<EnhancedConversation, 'id' | 'created_at' | 'updated_at' | 'metadata' | 'engagement' | 'analytics'>): string {
    const id = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const enhancedConversation: EnhancedConversation = {
      ...conversation,
      id,
      created_at: now,
      updated_at: now,
      metadata: {
        total_messages: 0,
        user_messages: 0,
        assistant_messages: 0,
        conversation_duration_seconds: 0,
        average_response_time_ms: 0,
        topics: [],
        sentiment_score: 0,
        engagement_level: 'low',
        conversation_quality_score: 0,
        tags: [],
        difficulty_level: 'beginner',
        bible_verses_referenced: 0,
        questions_asked: 0,
        follow_up_questions: 0
      },
      engagement: {
        time_spent_reading_ms: 0,
        scroll_depth_percentage: 0,
        messages_clicked: [],
        copy_actions: 0,
        share_actions: 0,
        bookmark_actions: 0,
        last_activity_at: now,
        return_visits: 0
      },
      analytics: {
        session_id: `session-${Date.now()}`,
        device_type: 'desktop', // Default, will be updated
        browser: 'unknown',
        ip_address: undefined
      }
    };

    this.conversations.set(id, enhancedConversation);
    this.messages.set(id, []);
    
    const userConversations = this.userConversations.get(conversation.user_id) || [];
    userConversations.push(id);
    this.userConversations.set(conversation.user_id, userConversations);
    
    this.saveToFile();
    return id;
  }

  // Enhanced message management with user response tracking
  addMessage(message: Omit<EnhancedMessage, 'id' | 'created_at' | 'metadata'>): string {
    const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const enhancedMessage: EnhancedMessage = {
      ...message,
      id,
      created_at: now,
      metadata: {
        mode: 'gentle',
        timestamp: now,
        processing_time_ms: 0,
        token_count: this.estimateTokenCount(message.content),
        word_count: message.content.split(' ').length,
        character_count: message.content.length,
        user_interactions: {
          was_copied: false,
          was_shared: false,
          was_bookmarked: false,
          was_rated: false
        },
        content_analysis: {
          sentiment: this.analyzeSentiment(message.content),
          topics: this.extractTopics(message.content),
          entities: this.extractEntities(message.content),
          bible_references: this.extractBibleReferences(message.content),
          questions_asked: this.countQuestions(message.content),
          answers_provided: this.countAnswers(message.content),
          scripture_quotes: this.countScriptureQuotes(message.content),
          apologetics_arguments: this.countApologeticsArguments(message.content)
        },
        ai_metrics: {
          relevance_score: 0.8, // Default, will be calculated
          accuracy_score: 0.8,
          helpfulness_score: 0.8,
          clarity_score: 0.8,
          biblical_accuracy: 0.9,
          response_completeness: 0.8
        }
      }
    };

    const messages = this.messages.get(message.conversation_id) || [];
    messages.push(enhancedMessage);
    this.messages.set(message.conversation_id, messages);
    
    // Update conversation metadata
    this.updateConversationMetadata(message.conversation_id);
    
    this.saveToFile();
    return id;
  }

  // Track user interactions with messages
  trackUserInteraction(messageId: string, interaction: {
    type: 'copy' | 'share' | 'bookmark' | 'rate' | 'feedback' | 'reaction';
    data?: any;
  }): void {
    for (const [conversationId, messages] of this.messages.entries()) {
      const message = messages.find(msg => msg.id === messageId);
      if (message) {
        switch (interaction.type) {
          case 'copy':
            message.metadata.user_interactions.was_copied = true;
            break;
          case 'share':
            message.metadata.user_interactions.was_shared = true;
            break;
          case 'bookmark':
            message.metadata.user_interactions.was_bookmarked = true;
            break;
          case 'rate':
            message.metadata.user_interactions.was_rated = true;
            message.metadata.user_interactions.rating = interaction.data?.rating;
            break;
          case 'feedback':
            message.metadata.user_interactions.feedback = interaction.data?.feedback;
            break;
          case 'reaction':
            message.metadata.user_interactions.reaction = interaction.data?.reaction;
            break;
        }
        
        this.messages.set(conversationId, messages);
        this.updateConversationMetadata(conversationId);
        this.saveToFile();
        break;
      }
    }
  }

  // Update conversation metadata based on messages
  private updateConversationMetadata(conversationId: string): void {
    const conversation = this.conversations.get(conversationId);
    const messages = this.messages.get(conversationId) || [];
    
    if (!conversation) return;

    const userMessages = messages.filter(msg => msg.role === 'user');
    const assistantMessages = messages.filter(msg => msg.role === 'assistant');
    
    // Calculate conversation duration
    const startTime = new Date(conversation.created_at).getTime();
    const endTime = new Date(conversation.updated_at).getTime();
    const durationSeconds = Math.floor((endTime - startTime) / 1000);
    
    // Calculate average response time
    let totalResponseTime = 0;
    let responseCount = 0;
    
    for (let i = 0; i < messages.length - 1; i++) {
      if (messages[i].role === 'user' && messages[i + 1].role === 'assistant') {
        const userTime = new Date(messages[i].created_at).getTime();
        const assistantTime = new Date(messages[i + 1].created_at).getTime();
        totalResponseTime += (assistantTime - userTime);
        responseCount++;
      }
    }
    
    const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
    
    // Extract topics from all messages
    const allTopics = messages.flatMap(msg => msg.metadata.content_analysis.topics);
    const uniqueTopics = [...new Set(allTopics)];
    
    // Calculate sentiment score
    const sentiments = messages.map(msg => msg.metadata.content_analysis.sentiment);
    const positiveCount = sentiments.filter(s => s === 'positive').length;
    const negativeCount = sentiments.filter(s => s === 'negative').length;
    const sentimentScore = sentiments.length > 0 ? (positiveCount - negativeCount) / sentiments.length : 0;
    
    // Calculate engagement level
    const totalInteractions = messages.reduce((sum, msg) => {
      const interactions = msg.metadata.user_interactions;
      return sum + (interactions.was_copied ? 1 : 0) + (interactions.was_shared ? 1 : 0) + 
             (interactions.was_bookmarked ? 1 : 0) + (interactions.was_rated ? 1 : 0);
    }, 0);
    
    const engagementLevel = totalInteractions > 10 ? 'high' : totalInteractions > 5 ? 'medium' : 'low';
    
    // Count Bible references and questions
    const bibleVersesReferenced = messages.reduce((sum, msg) => 
      sum + msg.metadata.content_analysis.bible_references.length, 0);
    const questionsAsked = messages.reduce((sum, msg) => 
      sum + msg.metadata.content_analysis.questions_asked, 0);
    
    // Update conversation metadata
    conversation.metadata = {
      ...conversation.metadata,
      total_messages: messages.length,
      user_messages: userMessages.length,
      assistant_messages: assistantMessages.length,
      conversation_duration_seconds: durationSeconds,
      average_response_time_ms: averageResponseTime,
      topics: uniqueTopics,
      sentiment_score: sentimentScore,
      engagement_level: engagementLevel,
      bible_verses_referenced: bibleVersesReferenced,
      questions_asked: questionsAsked,
      follow_up_questions: questionsAsked - 1 // Subtract initial question
    };
    
    conversation.updated_at = new Date().toISOString();
    this.conversations.set(conversationId, conversation);
  }

  // Analytics and insights methods
  getUserInsights(userId: string) {
    const userConversations = this.userConversations.get(userId) || [];
    const conversations = userConversations.map(id => this.conversations.get(id)).filter(Boolean) as EnhancedConversation[];
    
    const totalMessages = conversations.reduce((sum, conv) => sum + conv.metadata.total_messages, 0);
    const totalDuration = conversations.reduce((sum, conv) => sum + conv.metadata.conversation_duration_seconds, 0);
    const averageSessionDuration = conversations.length > 0 ? totalDuration / conversations.length : 0;
    
    const allTopics = conversations.flatMap(conv => conv.metadata.topics);
    const topicCounts = allTopics.reduce((acc, topic) => {
      acc[topic] = (acc[topic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const favoriteTopics = Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);
    
    const mostUsedMode = conversations.reduce((acc, conv) => {
      // This would need to be tracked per conversation
      return acc;
    }, 'gentle');
    
    return {
      total_conversations: conversations.length,
      total_messages,
      average_session_duration: averageSessionDuration,
      favorite_topics: favoriteTopics,
      most_used_mode: mostUsedMode,
      engagement_trend: 'stable', // Would need historical data
      last_active: conversations.length > 0 ? 
        Math.max(...conversations.map(conv => new Date(conv.updated_at).getTime())) : null
    };
  }

  getConversationAnalytics(conversationId: string) {
    const conversation = this.conversations.get(conversationId);
    const messages = this.messages.get(conversationId) || [];
    
    if (!conversation) return null;
    
    return {
      conversation,
      message_analytics: {
        total_messages: messages.length,
        user_engagement: messages.reduce((sum, msg) => {
          const interactions = msg.metadata.user_interactions;
          return sum + (interactions.was_copied ? 1 : 0) + (interactions.was_shared ? 1 : 0) + 
                 (interactions.was_bookmarked ? 1 : 0) + (interactions.was_rated ? 1 : 0);
        }, 0),
        average_rating: messages
          .map(msg => msg.metadata.user_interactions.rating)
          .filter(rating => rating !== undefined)
          .reduce((sum, rating, _, arr) => sum + rating / arr.length, 0),
        sentiment_analysis: {
          positive: messages.filter(msg => msg.metadata.content_analysis.sentiment === 'positive').length,
          neutral: messages.filter(msg => msg.metadata.content_analysis.sentiment === 'neutral').length,
          negative: messages.filter(msg => msg.metadata.content_analysis.sentiment === 'negative').length
        }
      }
    };
  }

  // Helper methods for content analysis
  private estimateTokenCount(text: string): number {
    return Math.ceil(text.length / 4); // Rough estimation
  }

  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    // Simple sentiment analysis - in production, use a proper NLP library
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'helpful', 'thank', 'love', 'blessed'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'wrong', 'confused', 'disappointed'];
    
    const words = text.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private extractTopics(text: string): string[] {
    // Simple topic extraction - in production, use proper NLP
    const topics = [];
    const bibleTopics = ['jesus', 'god', 'christ', 'bible', 'faith', 'prayer', 'salvation', 'sin', 'heaven', 'hell'];
    const apologeticsTopics = ['apologetics', 'evidence', 'proof', 'resurrection', 'creation', 'evolution', 'atheism'];
    
    const words = text.toLowerCase().split(/\s+/);
    
    bibleTopics.forEach(topic => {
      if (words.some(word => word.includes(topic))) {
        topics.push(topic);
      }
    });
    
    apologeticsTopics.forEach(topic => {
      if (words.some(word => word.includes(topic))) {
        topics.push(topic);
      }
    });
    
    return [...new Set(topics)];
  }

  private extractEntities(text: string): string[] {
    // Simple entity extraction - in production, use proper NLP
    const entities = [];
    const bibleNames = ['jesus', 'christ', 'god', 'moses', 'david', 'paul', 'peter', 'john', 'mary'];
    const places = ['jerusalem', 'bethlehem', 'galilee', 'judea', 'rome', 'corinth', 'ephesus'];
    
    const words = text.toLowerCase().split(/\s+/);
    
    [...bibleNames, ...places].forEach(entity => {
      if (words.some(word => word.includes(entity))) {
        entities.push(entity);
      }
    });
    
    return [...new Set(entities)];
  }

  private extractBibleReferences(text: string): string[] {
    // Extract Bible references like "John 3:16", "Matthew 5:1-10", etc.
    const bibleRefPattern = /\b(?:genesis|exodus|leviticus|numbers|deuteronomy|joshua|judges|ruth|samuel|kings|chronicles|ezra|nehemiah|esther|job|psalms|proverbs|ecclesiastes|song|isaiah|jeremiah|lamentations|ezekiel|daniel|hosea|joel|amos|obadiah|jonah|micah|nahum|habakkuk|zephaniah|haggai|zechariah|malachi|matthew|mark|luke|john|acts|romans|corinthians|galatians|ephesians|philippians|colossians|thessalonians|timothy|titus|philemon|hebrews|james|peter|jude|revelation)\s+\d+(?::\d+(?:-\d+)?)?/gi;
    
    return text.match(bibleRefPattern) || [];
  }

  private countQuestions(text: string): number {
    return (text.match(/\?/g) || []).length;
  }

  private countAnswers(text: string): number {
    // Simple heuristic - look for answer indicators
    const answerIndicators = ['answer', 'explanation', 'because', 'therefore', 'thus', 'so', 'the reason'];
    const words = text.toLowerCase().split(/\s+/);
    return answerIndicators.filter(indicator => words.includes(indicator)).length;
  }

  private countScriptureQuotes(text: string): number {
    // Count quoted scripture (text in quotes that might be scripture)
    const quotePattern = /"[^"]*"/g;
    const quotes = text.match(quotePattern) || [];
    return quotes.length;
  }

  private countApologeticsArguments(text: string): number {
    // Count apologetic argument indicators
    const argumentIndicators = ['evidence', 'proof', 'argument', 'reason', 'logical', 'rational', 'demonstrate', 'prove'];
    const words = text.toLowerCase().split(/\s+/);
    return argumentIndicators.filter(indicator => words.includes(indicator)).length;
  }

  // Getter methods for compatibility
  getConversations(userId: string): EnhancedConversation[] {
    const userConversations = this.userConversations.get(userId) || [];
    return userConversations.map(id => this.conversations.get(id)).filter(Boolean) as EnhancedConversation[];
  }

  getMessages(conversationId: string): EnhancedMessage[] {
    return this.messages.get(conversationId) || [];
  }

  getAnalytics() {
    return this.generateAnalytics();
  }
}

export const enhancedConversationStorage = new EnhancedConversationStorage();
export type { EnhancedConversation, EnhancedMessage, UserProfile, EnhancedStorageData };
