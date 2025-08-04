// Analytics Service for Shield AI
// Tracks objection types, response effectiveness, and user engagement

export interface AnalyticsEvent {
  id: string;
  userId: string;
  timestamp: Date;
  eventType: 'question_asked' | 'response_generated' | 'feedback_given' | 'conversation_started';
  objectionType?: string;
  userStance?: string;
  intensity?: string;
  responseStrategy?: string;
  feedback?: 'positive' | 'negative' | 'neutral';
  questionText?: string;
  responseText?: string;
  sessionId?: string;
  conversationId?: string;
}

export interface AnalyticsSummary {
  totalQuestions: number;
  objectionTypeBreakdown: Record<string, number>;
  userStanceBreakdown: Record<string, number>;
  responseStrategyBreakdown: Record<string, number>;
  averageResponseTime: number;
  feedbackBreakdown: Record<string, number>;
  topQuestions: string[];
  topObjectionTypes: string[];
}

export class AnalyticsService {
  private static events: AnalyticsEvent[] = [];

  // Track a new analytics event
  static trackEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): void {
    const newEvent: AnalyticsEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.events.push(newEvent);
    console.log('Analytics event tracked:', newEvent.eventType, newEvent.objectionType);
  }

  // Track a question being asked
  static trackQuestion(
    userId: string,
    questionText: string,
    objectionType: string,
    userStance: string,
    intensity: string,
    sessionId?: string,
    conversationId?: string
  ): void {
    this.trackEvent({
      userId,
      eventType: 'question_asked',
      objectionType,
      userStance,
      intensity,
      questionText,
      sessionId,
      conversationId
    });
  }

  // Track a response being generated
  static trackResponse(
    userId: string,
    responseText: string,
    responseStrategy: string,
    objectionType: string,
    sessionId?: string,
    conversationId?: string
  ): void {
    this.trackEvent({
      userId,
      eventType: 'response_generated',
      responseStrategy,
      objectionType,
      responseText,
      sessionId,
      conversationId
    });
  }

  // Track user feedback
  static trackFeedback(
    userId: string,
    feedback: 'positive' | 'negative' | 'neutral',
    objectionType?: string,
    sessionId?: string,
    conversationId?: string
  ): void {
    this.trackEvent({
      userId,
      eventType: 'feedback_given',
      feedback,
      objectionType,
      sessionId,
      conversationId
    });
  }

  // Get analytics summary
  static getAnalyticsSummary(timeRange?: { start: Date; end: Date }): AnalyticsSummary {
    let filteredEvents = this.events;

    if (timeRange) {
      filteredEvents = this.events.filter(event => 
        event.timestamp >= timeRange.start && event.timestamp <= timeRange.end
      );
    }

    const questionEvents = filteredEvents.filter(e => e.eventType === 'question_asked');
    const responseEvents = filteredEvents.filter(e => e.eventType === 'response_generated');
    const feedbackEvents = filteredEvents.filter(e => e.eventType === 'feedback_given');

    // Calculate breakdowns
    const objectionTypeBreakdown: Record<string, number> = {};
    const userStanceBreakdown: Record<string, number> = {};
    const responseStrategyBreakdown: Record<string, number> = {};
    const feedbackBreakdown: Record<string, number> = {};

    questionEvents.forEach(event => {
      if (event.objectionType) {
        objectionTypeBreakdown[event.objectionType] = (objectionTypeBreakdown[event.objectionType] || 0) + 1;
      }
      if (event.userStance) {
        userStanceBreakdown[event.userStance] = (userStanceBreakdown[event.userStance] || 0) + 1;
      }
    });

    responseEvents.forEach(event => {
      if (event.responseStrategy) {
        responseStrategyBreakdown[event.responseStrategy] = (responseStrategyBreakdown[event.responseStrategy] || 0) + 1;
      }
    });

    feedbackEvents.forEach(event => {
      if (event.feedback) {
        feedbackBreakdown[event.feedback] = (feedbackBreakdown[event.feedback] || 0) + 1;
      }
    });

    // Get top questions and objection types
    const questionTexts = questionEvents
      .map(e => e.questionText)
      .filter(Boolean) as string[];
    
    const objectionTypes = questionEvents
      .map(e => e.objectionType)
      .filter(Boolean) as string[];

    return {
      totalQuestions: questionEvents.length,
      objectionTypeBreakdown,
      userStanceBreakdown,
      responseStrategyBreakdown,
      averageResponseTime: 0, // Would need to calculate from actual response times
      feedbackBreakdown,
      topQuestions: this.getTopItems(questionTexts, 10),
      topObjectionTypes: this.getTopItems(objectionTypes, 10)
    };
  }

  // Get top items by frequency
  private static getTopItems(items: string[], limit: number): string[] {
    const frequency: Record<string, number> = {};
    
    items.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([item]) => item);
  }

  // Get insights for improvement
  static getInsights(): {
    mostCommonObjections: string[];
    leastEffectiveStrategies: string[];
    userEngagementPatterns: string[];
    recommendations: string[];
  } {
    const summary = this.getAnalyticsSummary();
    
    const mostCommonObjections = Object.entries(summary.objectionTypeBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([objection]) => objection);

    const leastEffectiveStrategies = Object.entries(summary.feedbackBreakdown)
      .filter(([feedback]) => feedback === 'negative')
      .map(([,count]) => count)
      .reduce((a, b) => a + b, 0) > 0 ? 
      Object.entries(summary.responseStrategyBreakdown)
        .sort(([,a], [,b]) => a - b)
        .slice(0, 3)
        .map(([strategy]) => strategy) : [];

    const userEngagementPatterns = [
      `Most users are ${Object.entries(summary.userStanceBreakdown).sort(([,a], [,b]) => b - a)[0]?.[0] || 'seekers'}`,
      `Top objection type: ${mostCommonObjections[0] || 'general questions'}`,
      `Total questions asked: ${summary.totalQuestions}`
    ];

    const recommendations = [
      'Focus on improving responses to the most common objections',
      'Develop more content for frequently asked questions',
      'Consider user feedback to refine response strategies',
      'Track response effectiveness by objection type'
    ];

    return {
      mostCommonObjections,
      leastEffectiveStrategies,
      userEngagementPatterns,
      recommendations
    };
  }

  // Export analytics data
  static exportAnalytics(): AnalyticsEvent[] {
    return [...this.events];
  }

  // Clear analytics data (for testing)
  static clearAnalytics(): void {
    this.events = [];
  }
} 