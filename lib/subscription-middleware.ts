import React from 'react';
import { EnhancedStripeService, FeatureCheckResult } from './enhanced-stripe-service';

export interface SubscriptionFeatureGate {
  checkFeature: (feature: string, incrementUsage?: boolean) => Promise<FeatureCheckResult>;
  incrementUsage: (metricType: string, increment?: number) => Promise<void>;
  getCurrentUsage: () => Promise<any>;
}

export class SubscriptionMiddleware {
  private static cache = new Map<string, { result: FeatureCheckResult; timestamp: number }>();
  private static cacheTimeout = 5 * 60 * 1000; // 5 minutes

  // Create middleware for checking features with caching
  static createFeatureGate(userId: string): SubscriptionFeatureGate {
    return {
      checkFeature: async (feature: string, incrementUsage: boolean = false): Promise<FeatureCheckResult> => {
        const cacheKey = `${userId}:${feature}`;
        const cached = this.cache.get(cacheKey);
        
        // Return cached result if still valid and not incrementing usage
        if (cached && !incrementUsage && (Date.now() - cached.timestamp) < this.cacheTimeout) {
          return cached.result;
        }

        try {
          const result = await EnhancedStripeService.checkFeatureAccess(userId, feature, incrementUsage);
          
          // Cache successful results
          if (!incrementUsage) {
            this.cache.set(cacheKey, {
              result,
              timestamp: Date.now()
            });
          }

          return result;
        } catch (error) {
          console.error('Error checking feature access:', error);
          return {
            allowed: false,
            upgrade_required: true,
            current_tier: 'error'
          };
        }
      },

      incrementUsage: async (metricType: string, increment: number = 1): Promise<void> => {
        try {
          await EnhancedStripeService.incrementUsage(
            userId, 
            metricType as any, 
            increment
          );
          // Clear related cache entries
          this.clearUserCache(userId);
        } catch (error) {
          console.error('Error incrementing usage:', error);
        }
      },

      getCurrentUsage: async () => {
        try {
          return await EnhancedStripeService.getCurrentUsage(userId);
        } catch (error) {
          console.error('Error getting current usage:', error);
          return null;
        }
      }
    };
  }

  // Clear cache for a specific user
  static clearUserCache(userId: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Clear all cache
  static clearAllCache(): void {
    this.cache.clear();
  }

  // Middleware for API routes
  static async checkApiFeatureAccess(
    userId: string,
    feature: string,
    incrementUsage: boolean = true
  ): Promise<{ allowed: boolean; response?: any }> {
    try {
      const result = await EnhancedStripeService.checkFeatureAccess(userId, feature, incrementUsage);
      
      if (!result.allowed) {
        return {
          allowed: false,
          response: {
            success: false,
            error: 'Feature not available',
            upgrade_required: result.upgrade_required,
            current_tier: result.current_tier,
            required_tier: result.required_tier,
            remaining: result.remaining,
            limit: result.limit
          }
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error in API feature check:', error);
      return {
        allowed: false,
        response: {
          success: false,
          error: 'Error checking feature access'
        }
      };
    }
  }

  // Specific feature checkers for common use cases
  static async checkChatAccess(userId: string, mode: 'fast' | 'accurate' = 'fast'): Promise<FeatureCheckResult> {
    const featureGate = this.createFeatureGate(userId);
    
    if (mode === 'accurate') {
      return await featureGate.checkFeature('accurate_mode', true);
    } else {
      return await featureGate.checkFeature('ai_conversation', true);
    }
  }

  static async checkBibleSearchAccess(userId: string, advanced: boolean = false): Promise<FeatureCheckResult> {
    const featureGate = this.createFeatureGate(userId);
    
    if (advanced) {
      return await featureGate.checkFeature('advanced_bible_search', true);
    } else {
      return await featureGate.checkFeature('bible_search', true);
    }
  }

  static async checkNoteCreationAccess(userId: string): Promise<FeatureCheckResult> {
    const featureGate = this.createFeatureGate(userId);
    return await featureGate.checkFeature('note_creation', true);
  }

  static async checkExportAccess(userId: string): Promise<FeatureCheckResult> {
    const featureGate = this.createFeatureGate(userId);
    return await featureGate.checkFeature('export', true);
  }

  static async checkCollaborationAccess(userId: string): Promise<FeatureCheckResult> {
    const featureGate = this.createFeatureGate(userId);
    return await featureGate.checkFeature('collaboration');
  }

  static async checkApiAccess(userId: string): Promise<FeatureCheckResult> {
    const featureGate = this.createFeatureGate(userId);
    return await featureGate.checkFeature('api_access', true);
  }

  // Usage tracking helpers
  static async trackConversation(userId: string, mode: 'fast' | 'accurate' = 'fast'): Promise<void> {
    const featureGate = this.createFeatureGate(userId);
    await featureGate.incrementUsage('conversation');
    
    if (mode === 'accurate') {
      await featureGate.incrementUsage('accurate_mode');
    }
  }

  static async trackBibleSearch(userId: string): Promise<void> {
    const featureGate = this.createFeatureGate(userId);
    await featureGate.incrementUsage('bible_search');
  }

  static async trackNoteCreation(userId: string): Promise<void> {
    const featureGate = this.createFeatureGate(userId);
    await featureGate.incrementUsage('note_created');
  }

  static async trackExport(userId: string): Promise<void> {
    const featureGate = this.createFeatureGate(userId);
    await featureGate.incrementUsage('export');
  }

  static async trackChurchSearch(userId: string): Promise<void> {
    const featureGate = this.createFeatureGate(userId);
    await featureGate.incrementUsage('church_search');
  }

  static async trackApiCall(userId: string): Promise<void> {
    const featureGate = this.createFeatureGate(userId);
    await featureGate.incrementUsage('api_call');
  }
}

// React hook for subscription features
export const useSubscriptionFeatures = (userId: string | null) => {
  if (!userId) {
    return {
      checkFeature: async () => ({ allowed: false, upgrade_required: true }),
      incrementUsage: async () => {},
      getCurrentUsage: async () => null
    };
  }

  return SubscriptionMiddleware.createFeatureGate(userId);
};

// Higher-order component for feature gating
export const withFeatureGate = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredFeature: string,
  fallbackComponent?: React.ComponentType<any>
) => {
  return (props: P & { userId?: string }) => {
    const [hasAccess, setHasAccess] = React.useState<boolean | null>(null);
    const { userId } = props;

    React.useEffect(() => {
      const checkAccess = async () => {
        if (!userId) {
          setHasAccess(false);
          return;
        }

        const result = await SubscriptionMiddleware.createFeatureGate(userId).checkFeature(requiredFeature);
        setHasAccess(result.allowed);
      };

      checkAccess();
    }, [userId, requiredFeature]);

    if (hasAccess === null) {
      return <div>Loading...</div>;
    }

    if (!hasAccess) {
      if (fallbackComponent) {
        const FallbackComponent = fallbackComponent;
        return <FallbackComponent {...props} />;
      }
      return <div>Feature not available. Please upgrade your subscription.</div>;
    }

    return <WrappedComponent {...props} />;
  };
};