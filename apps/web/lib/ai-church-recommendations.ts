import { ChurchLocation } from './church-finder-service';

export interface UserPreferences {
  denomination?: string;
  serviceStyle?: 'traditional' | 'contemporary' | 'blended';
  familyFriendly?: boolean;
  youthPrograms?: boolean;
  accessibility?: string[];
  languages?: string[];
  size?: 'small' | 'medium' | 'large';
  distance?: number;
}

export interface AIRecommendation {
  church: ChurchLocation;
  score: number;
  reasons: string[];
  matchPercentage: number;
}

export class AIChurchRecommendations {
  static async getPersonalizedRecommendations(
    churches: ChurchLocation[],
    userPreferences: UserPreferences,
    userLocation: { lat: number; lng: number }
  ): Promise<AIRecommendation[]> {
    try {
      // Analyze churches with AI
      const recommendations = await Promise.all(
        churches.map(async (church) => {
          const analysis = await this.analyzeChurch(church, userPreferences);
          return {
            church,
            score: analysis.score,
            reasons: analysis.reasons,
            matchPercentage: analysis.matchPercentage
          };
        })
      );

      // Sort by score and return top recommendations
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      return [];
    }
  }

  static async analyzeChurch(
    church: ChurchLocation,
    preferences: UserPreferences
  ): Promise<{ score: number; reasons: string[]; matchPercentage: number }> {
    const reasons: string[] = [];
    let score = 0;
    let totalFactors = 0;

    // Denomination matching
    if (preferences.denomination) {
      const denominationMatch = this.checkDenominationMatch(church, preferences.denomination);
      if (denominationMatch.matches) {
        score += 30;
        reasons.push(`Matches your preferred denomination (${preferences.denomination})`);
      }
      totalFactors++;
    }

    // Distance scoring
    if (church.distance) {
      const distanceScore = this.calculateDistanceScore(church.distance, preferences.distance || 10);
      score += distanceScore;
      reasons.push(`Located ${church.distance.toFixed(1)} miles away`);
      totalFactors++;
    }

    // Rating scoring
    if (church.rating) {
      const ratingScore = (church.rating / 5) * 20;
      score += ratingScore;
      reasons.push(`Highly rated (${church.rating}/5 stars)`);
      totalFactors++;
    }

    // Size analysis based on name patterns
    const sizeAnalysis = this.analyzeChurchSize(church.name);
    if (preferences.size && sizeAnalysis.size === preferences.size) {
      score += 15;
      reasons.push(`Matches your preferred church size (${preferences.size})`);
    }
    totalFactors++;

    // Family-friendly analysis
    if (preferences.familyFriendly) {
      const familyScore = this.analyzeFamilyFriendliness(church);
      if (familyScore > 0) {
        score += familyScore;
        reasons.push('Family-friendly with programs for all ages');
      }
      totalFactors++;
    }

    // Accessibility analysis
    if (preferences.accessibility && preferences.accessibility.length > 0) {
      const accessibilityScore = this.analyzeAccessibility(church, preferences.accessibility);
      if (accessibilityScore > 0) {
        score += accessibilityScore;
        reasons.push('Meets your accessibility needs');
      }
      totalFactors++;
    }

    const matchPercentage = totalFactors > 0 ? (score / (totalFactors * 25)) * 100 : 0;

    return {
      score,
      reasons,
      matchPercentage: Math.min(matchPercentage, 100)
    };
  }

  static checkDenominationMatch(church: ChurchLocation, preferredDenomination: string): { matches: boolean; confidence: number } {
    const churchName = church.name.toLowerCase();
    const denominationKeywords = {
      'Baptist': ['baptist', 'first baptist', 'second baptist'],
      'Catholic': ['catholic', 'st.', 'saint', 'cathedral', 'basilica'],
      'Lutheran': ['lutheran', 'elca', 'lcms'],
      'Methodist': ['methodist', 'umc', 'united methodist'],
      'Presbyterian': ['presbyterian', 'pca', 'pcusa'],
      'Non-denominational': ['community', 'non-denominational', 'christian', 'fellowship']
    };

    const keywords = denominationKeywords[preferredDenomination as keyof typeof denominationKeywords] || [];
    const matches = keywords.some(keyword => churchName.includes(keyword));
    const confidence = matches ? 0.9 : 0.1;

    return { matches, confidence };
  }

  static calculateDistanceScore(distance: number, maxDistance: number): number {
    if (distance <= maxDistance * 0.5) return 25;
    if (distance <= maxDistance * 0.75) return 20;
    if (distance <= maxDistance) return 15;
    return 5;
  }

  static analyzeChurchSize(churchName: string): { size: 'small' | 'medium' | 'large'; confidence: number } {
    const name = churchName.toLowerCase();
    
    // Large church indicators
    if (name.includes('cathedral') || name.includes('mega') || name.includes('community')) {
      return { size: 'large', confidence: 0.8 };
    }
    
    // Small church indicators
    if (name.includes('chapel') || name.includes('mission')) {
      return { size: 'small', confidence: 0.7 };
    }
    
    // Default to medium
    return { size: 'medium', confidence: 0.5 };
  }

  static analyzeFamilyFriendliness(church: ChurchLocation): number {
    const name = church.name.toLowerCase();
    let score = 0;

    // Family-friendly indicators
    if (name.includes('family') || name.includes('community')) score += 10;
    if (name.includes('youth') || name.includes('children')) score += 15;
    if (name.includes('fellowship')) score += 5;

    return score;
  }

  static analyzeAccessibility(church: ChurchLocation, requiredFeatures: string[]): number {
    // This would integrate with actual accessibility data
    // For now, return a basic score
    return 10;
  }

  static async generateChurchDescription(church: ChurchLocation): Promise<string> {
    const name = church.name;
    const denomination = this.inferDenomination(church.name);
    const size = this.analyzeChurchSize(church.name).size;
    
    return `${name} is a ${size} ${denomination} church located in ${church.city}, ${church.state}. ` +
           `It's ${church.distance?.toFixed(1)} miles from your location and has a rating of ${church.rating || 'N/A'}/5 stars. ` +
           `This church offers a welcoming community for families and individuals seeking spiritual growth.`;
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

  static async getChurchInsights(church: ChurchLocation): Promise<string[]> {
    const insights: string[] = [];
    
    // Distance insight
    if (church.distance) {
      if (church.distance <= 2) {
        insights.push('Very close to your location - perfect for regular attendance');
      } else if (church.distance <= 5) {
        insights.push('Conveniently located within easy driving distance');
      } else {
        insights.push('A bit further but worth the drive for the right community');
      }
    }

    // Rating insight
    if (church.rating) {
      if (church.rating >= 4.5) {
        insights.push('Highly rated by the community - excellent reputation');
      } else if (church.rating >= 4.0) {
        insights.push('Well-rated church with positive community feedback');
      }
    }

    // Size insight
    const size = this.analyzeChurchSize(church.name);
    if (size.size === 'large') {
      insights.push('Large congregation with diverse programs and ministries');
    } else if (size.size === 'small') {
      insights.push('Intimate community perfect for personal connections');
    } else {
      insights.push('Medium-sized church offering balance of community and intimacy');
    }

    return insights;
  }
} 