import { StripeService } from './stripe';

export interface SubscriptionCheck {
  hasAccess: boolean;
  isInTrial: boolean;
  hasActiveSubscription: boolean;
  subscription?: any;
  message?: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_subscription_id?: string;
  status: 'trial' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'unpaid';
  current_period_start?: Date;
  current_period_end?: Date;
  cancel_at_period_end: boolean;
  canceled_at?: Date;
  created_at: Date;
  updated_at: Date;
  subscription_plans?: {
    name: 'basic' | 'premium';
    display_name: string;
    description: string;
    price_weekly: number;
    features: string[];
  };
}

export class SubscriptionMiddleware {
  static async checkAccess(userId: string): Promise<SubscriptionCheck> {
    try {
      const isInTrial = await StripeService.isInTrialPeriod(userId);
      const hasActiveSubscription = await StripeService.hasActiveSubscription(userId);
      const subscription = await StripeService.getUserSubscription(userId);

      // User has access if they're in trial or have active subscription
      const hasAccess = isInTrial || hasActiveSubscription;

      return {
        hasAccess,
        isInTrial,
        hasActiveSubscription,
        subscription,
        message: hasAccess ? undefined : 'Subscription required to access this feature',
      };
    } catch (error) {
      console.error('Error checking subscription access:', error);
      return {
        hasAccess: false,
        isInTrial: false,
        hasActiveSubscription: false,
        message: 'Error checking subscription status',
      };
    }
  }

  static async checkMessageLimit(userId: string, currentMessageCount: number = 0): Promise<{
    canSend: boolean;
    limit: number;
    remaining: number;
    message?: string;
  }> {
    try {
      const isInTrial = await StripeService.isInTrialPeriod(userId);
      const hasActiveSubscription = await StripeService.hasActiveSubscription(userId);
      const subscription = await StripeService.getUserSubscription(userId);

      // Define limits based on subscription status
      let limit = 0;
      if (isInTrial) {
        limit = 50; // 50 messages during trial
      } else if (hasActiveSubscription) {
        const planName = subscription?.subscription_plans?.name;
        if (planName === 'premium') {
          limit = 1000; // Unlimited for premium (set high limit)
        } else {
          limit = 200; // 200 messages for basic plan
        }
      } else {
        limit = 0; // No access without subscription
      }

      const remaining = Math.max(0, limit - currentMessageCount);
      const canSend = remaining > 0;

      return {
        canSend,
        limit,
        remaining,
        message: canSend ? undefined : 'Message limit reached. Please upgrade your subscription.',
      };
    } catch (error) {
      console.error('Error checking message limit:', error);
      return {
        canSend: false,
        limit: 0,
        remaining: 0,
        message: 'Error checking message limit',
      };
    }
  }

  static async checkFeatureAccess(userId: string, feature: string): Promise<{
    hasAccess: boolean;
    message?: string;
  }> {
    try {
      const isInTrial = await StripeService.isInTrialPeriod(userId);
      const hasActiveSubscription = await StripeService.hasActiveSubscription(userId);
      const subscription = await StripeService.getUserSubscription(userId);

      // Define feature access based on subscription
      const featureAccess: Record<string, { trial: boolean; basic: boolean; premium: boolean }> = {
        'chat': { trial: true, basic: true, premium: true },
        'conversation_history': { trial: true, basic: true, premium: true },
        'advanced_ai_models': { trial: false, basic: false, premium: true },
        'export_conversations': { trial: false, basic: false, premium: true },
        'priority_support': { trial: false, basic: false, premium: true },
        'unlimited_conversations': { trial: true, basic: true, premium: true },
      };

      const featureConfig = featureAccess[feature];
      if (!featureConfig) {
        return { hasAccess: false, message: 'Feature not found' };
      }

      let hasAccess = false;
      if (isInTrial) {
        hasAccess = featureConfig.trial;
      } else if (hasActiveSubscription) {
        const planName = subscription?.subscription_plans?.name;
        if (planName === 'premium') {
          hasAccess = featureConfig.premium;
        } else {
          hasAccess = featureConfig.basic;
        }
      }

      return {
        hasAccess,
        message: hasAccess ? undefined : `${feature} requires a premium subscription`,
      };
    } catch (error) {
      console.error('Error checking feature access:', error);
      return {
        hasAccess: false,
        message: 'Error checking feature access',
      };
    }
  }

  static async trackUsage(userId: string, usageType: string, value: number = 1): Promise<void> {
    try {
      // This would typically update usage metrics in the database
      // For now, we'll just log the usage
      console.log(`Usage tracked: ${userId} - ${usageType}: ${value}`);
      
      // In a real implementation, you would:
      // 1. Update the usage_metrics table
      // 2. Check against limits
      // 3. Trigger alerts if limits are exceeded
    } catch (error) {
      console.error('Error tracking usage:', error);
    }
  }
} 