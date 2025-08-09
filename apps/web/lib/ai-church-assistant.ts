import { ChurchLocation } from './church-finder-service';

export interface ChurchQuestion {
  type: 'general' | 'denomination' | 'location' | 'spiritual' | 'practical';
  question: string;
  context?: {
    userLocation?: { lat: number; lng: number };
    selectedChurch?: ChurchLocation;
    preferences?: any;
  };
}

export interface AIChurchResponse {
  answer: string;
  suggestions?: string[];
  relatedChurches?: ChurchLocation[];
  bibleVerses?: string[];
  followUpQuestions?: string[];
}

export class AIChurchAssistant {
  static async answerChurchQuestion(question: ChurchQuestion): Promise<AIChurchResponse> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: this.formatQuestionForAI(question),
          mode: 'accurate',
          context: 'church-finder'
        })
      });

      const data = await response.json();
      
      return {
        answer: data.response,
        suggestions: this.generateSuggestions(question),
        followUpQuestions: this.generateFollowUpQuestions(question)
      };
    } catch (error) {
      console.error('Error getting AI response:', error);
      return {
        answer: "I'm here to help you find the perfect church! What specific questions do you have about churches in your area?",
        suggestions: [
          "What denomination are you looking for?",
          "Do you prefer traditional or contemporary services?",
          "Are you looking for family-friendly churches?",
          "What's your preferred distance from home?"
        ]
      };
    }
  }

  static formatQuestionForAI(question: ChurchQuestion): string {
    let prompt = `As a Christian AI assistant helping with church finding, please answer this question: "${question.question}"`;
    
    if (question.context?.selectedChurch) {
      prompt += `\n\nContext: User is asking about ${question.context.selectedChurch.name} in ${question.context.selectedChurch.city}, ${question.context.selectedChurch.state}.`;
    }
    
    if (question.context?.preferences) {
      prompt += `\n\nUser preferences: ${JSON.stringify(question.context.preferences)}`;
    }

    prompt += `\n\nPlease provide a helpful, encouraging response that guides the user in their church search journey. Include relevant Bible verses if appropriate.`;

    return prompt;
  }

  static generateSuggestions(question: ChurchQuestion): string[] {
    const suggestions: string[] = [];

    switch (question.type) {
      case 'denomination':
        suggestions.push(
          "What aspects of worship style are important to you?",
          "Do you have any theological preferences?",
          "Are you looking for a specific size congregation?"
        );
        break;
      case 'location':
        suggestions.push(
          "What's your preferred travel distance?",
          "Do you need public transportation access?",
          "Are you looking for churches in a specific area?"
        );
        break;
      case 'spiritual':
        suggestions.push(
          "What spiritual needs are you seeking to fulfill?",
          "Are you looking for specific ministries or programs?",
          "Do you prefer traditional or contemporary worship?"
        );
        break;
      case 'practical':
        suggestions.push(
          "What service times work best for you?",
          "Do you need childcare or youth programs?",
          "Are accessibility features important to you?"
        );
        break;
      default:
        suggestions.push(
          "What denomination interests you?",
          "How far are you willing to travel?",
          "What's most important in a church community?"
        );
    }

    return suggestions;
  }

  static generateFollowUpQuestions(question: ChurchQuestion): string[] {
    const followUps: string[] = [];

    if (question.question.toLowerCase().includes('baptist')) {
      followUps.push(
        "Are you looking for Southern Baptist, American Baptist, or Independent Baptist churches?",
        "Do you prefer traditional or contemporary Baptist services?"
      );
    } else if (question.question.toLowerCase().includes('catholic')) {
      followUps.push(
        "Are you looking for a parish with specific Mass times?",
        "Do you need Spanish-language services?"
      );
    } else if (question.question.toLowerCase().includes('family')) {
      followUps.push(
        "Do you have children? What ages?",
        "Are you looking for specific youth programs?",
        "Do you need childcare during services?"
      );
    }

    return followUps;
  }

  static async getChurchComparison(churches: ChurchLocation[]): Promise<string> {
    if (churches.length < 2) {
      return "I need at least 2 churches to provide a comparison.";
    }

    const comparison = churches.map(church => ({
      name: church.name,
      distance: church.distance,
      rating: church.rating,
      denomination: this.inferDenomination(church.name)
    }));

    return `Here's a comparison of the churches you're considering:

${comparison.map(church => 
  `• ${church.name} (${church.denomination}): ${church.distance?.toFixed(1)} miles away, ${church.rating || 'N/A'}/5 stars`
).join('\n')}

Each church has its unique strengths. Consider visiting a few to see which feels like the right fit for your spiritual journey.`;
  }

  static inferDenomination(churchName: string): string {
    const name = churchName.toLowerCase();
    
    if (name.includes('baptist')) return 'Baptist';
    if (name.includes('catholic') || name.includes('st.') || name.includes('saint')) return 'Catholic';
    if (name.includes('lutheran')) return 'Lutheran';
    if (name.includes('methodist')) return 'Methodist';
    if (name.includes('presbyterian')) return 'Presbyterian';
    if (name.includes('community') || name.includes('non-denominational')) return 'Non-denominational';
    
    return 'Christian';
  }

  static async getSpiritualGuidance(topic: string): Promise<AIChurchResponse> {
    const guidancePrompts = {
      'first-time': "I'm visiting a church for the first time. What should I expect and how should I prepare?",
      'denomination': "I'm confused about different denominations. Can you help me understand the differences?",
      'community': "How do I get involved in a church community? What are good ways to connect?",
      'worship': "What are the different styles of worship and how do I know which is right for me?",
      'family': "How do I find a church that's good for my family, especially with children?"
    };

    const prompt = guidancePrompts[topic as keyof typeof guidancePrompts] || topic;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `As a Christian AI assistant, please provide spiritual guidance on: ${prompt}. Include relevant Bible verses and practical advice.`,
          mode: 'accurate',
          context: 'spiritual-guidance'
        })
      });

      const data = await response.json();
      
      return {
        answer: data.response,
        bibleVerses: this.getRelevantBibleVerses(topic),
        suggestions: this.getSpiritualSuggestions(topic)
      };
    } catch (error) {
      return {
        answer: "I'm here to provide spiritual guidance as you search for a church home. What specific aspect would you like to explore?",
        suggestions: [
          "Understanding different denominations",
          "Preparing for your first visit",
          "Finding family-friendly churches",
          "Getting involved in church community"
        ]
      };
    }
  }

  static getRelevantBibleVerses(topic: string): string[] {
    const verses: { [key: string]: string[] } = {
      'first-time': [
        "Hebrews 10:25 - 'Not neglecting to meet together, as is the habit of some, but encouraging one another...'",
        "Psalm 122:1 - 'I was glad when they said to me, \"Let us go to the house of the Lord!\"'"
      ],
      'community': [
        "Acts 2:42 - 'And they devoted themselves to the apostles teaching and the fellowship, to the breaking of bread and the prayers.'",
        "1 Corinthians 12:27 - 'Now you are the body of Christ and individually members of it.'"
      ],
      'worship': [
        "John 4:24 - 'God is spirit, and those who worship him must worship in spirit and truth.'",
        "Psalm 95:6 - 'Oh come, let us worship and bow down; let us kneel before the Lord, our Maker!'"
      ],
      'family': [
        "Proverbs 22:6 - 'Train up a child in the way he should go; even when he is old he will not depart from it.'",
        "Deuteronomy 6:7 - 'You shall teach them diligently to your children...'"
      ]
    };

    return verses[topic] || [
      "Matthew 18:20 - 'For where two or three are gathered in my name, there am I among them.'"
    ];
  }

  static getSpiritualSuggestions(topic: string): string[] {
    const suggestions: { [key: string]: string[] } = {
      'first-time': [
        "Pray before your visit for guidance",
        "Dress comfortably but respectfully",
        "Arrive 10-15 minutes early",
        "Introduce yourself to greeters",
        "Stay for coffee/fellowship time"
      ],
      'community': [
        "Join a small group or Bible study",
        "Volunteer for church ministries",
        "Attend church events and activities",
        "Get to know church leaders",
        "Participate in church social media groups"
      ],
      'family': [
        "Look for churches with active children's programs",
        "Ask about youth ministry opportunities",
        "Check if they offer family events",
        "Inquire about childcare during services",
        "See if they have family counseling resources"
      ]
    };

    return suggestions[topic] || [
      "Take time to pray about your decision",
      "Visit multiple churches to compare",
      "Talk to church members about their experience",
      "Consider your spiritual needs and goals"
    ];
  }
} 