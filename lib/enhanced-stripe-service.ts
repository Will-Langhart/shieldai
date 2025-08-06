import Stripe from 'stripe';
import { supabase } from './supabase';
import { StripeService } from './stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export interface SubscriptionTier {
  name: 'basic' | 'student' | 'scholar' | 'ministry';
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  limits: SubscriptionLimits;
}

export interface SubscriptionLimits {
  daily_conversations?: number;
  daily_accurate_mode?: number;
  daily_bible_searches?: number;
  daily_exports?: number;
  monthly_notes?: number;
  monthly_api_calls?: number;
  monthly_church_searches?: number;
  accurate_mode_enabled: boolean;
  advanced_bible_search: boolean;
  cross_references_enabled: boolean;
  collaboration_enabled: boolean;
  api_access_enabled: boolean;
  priority_support: boolean;
  white_label_enabled: boolean;
  max_team_members: number;
}

export interface UsageMetrics {
  conversations_today: number;
  accurate_mode_today: number;
  bible_searches_today: number;
  exports_today: number;
  notes_this_month: number;
  api_calls_this_month: number;
  church_searches_this_month: number;
}

export interface FeatureCheckResult {
  allowed: boolean;
  remaining?: number;
  limit?: number;
  upgrade_required?: boolean;
  current_tier?: string;
  required_tier?: string;
}

export class EnhancedStripeService extends StripeService {
  
  // Get subscription tiers with limits
  static async getSubscriptionTiers(): Promise<SubscriptionTier[]> {
    try {
      const { data: plans, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly');

      if (plansError) throw plansError;

      const { data: limits, error: limitsError } = await supabase
        .from('subscription_limits')
        .select('*');

      if (limitsError) throw limitsError;

      const tiers: SubscriptionTier[] = plans.map(plan => {
        const planLimits = limits.find(l => l.plan_name === plan.name);
        return {
          name: plan.name,
          display_name: plan.display_name,
          description: plan.description,
          price_monthly: parseFloat(plan.price_monthly || '0'),
          price_yearly: parseFloat(plan.price_yearly || '0'),
          features: plan.features || [],
          limits: {
            daily_conversations: planLimits?.daily_conversations,
            daily_accurate_mode: planLimits?.daily_accurate_mode,
            daily_bible_searches: planLimits?.daily_bible_searches,
            daily_exports: planLimits?.daily_exports,
            monthly_notes: planLimits?.monthly_notes,
            monthly_api_calls: planLimits?.monthly_api_calls,
            monthly_church_searches: planLimits?.monthly_church_searches,
            accurate_mode_enabled: planLimits?.accurate_mode_enabled || false,
            advanced_bible_search: planLimits?.advanced_bible_search || false,
            cross_references_enabled: planLimits?.cross_references_enabled || false,
            collaboration_enabled: planLimits?.collaboration_enabled || false,
            api_access_enabled: planLimits?.api_access_enabled || false,
            priority_support: planLimits?.priority_support || false,
            white_label_enabled: planLimits?.white_label_enabled || false,
            max_team_members: planLimits?.max_team_members || 1,
          }
        };
      });

      return tiers;
    } catch (error) {
      console.error('Error fetching subscription tiers:', error);
      throw error;
    }
  }

  // Get current user usage
  static async getCurrentUsage(userId: string): Promise<UsageMetrics> {
    try {
      const { data, error } = await supabase
        .rpc('get_current_usage', { p_user_id: userId });

      if (error) throw error;

      const usage = data?.[0];
      return {
        conversations_today: usage?.conversations_today || 0,
        accurate_mode_today: usage?.accurate_mode_today || 0,
        bible_searches_today: usage?.bible_searches_today || 0,
        exports_today: usage?.exports_today || 0,
        notes_this_month: usage?.notes_this_month || 0,
        api_calls_this_month: usage?.api_calls_this_month || 0,
        church_searches_this_month: usage?.church_searches_this_month || 0,
      };
    } catch (error) {
      console.error('Error fetching current usage:', error);
      return {
        conversations_today: 0,
        accurate_mode_today: 0,
        bible_searches_today: 0,
        exports_today: 0,
        notes_this_month: 0,
        api_calls_this_month: 0,
        church_searches_this_month: 0,
      };
    }
  }

  // Increment usage metric
  static async incrementUsage(
    userId: string, 
    metricType: 'conversation' | 'accurate_mode' | 'bible_search' | 'note_created' | 'export' | 'api_call' | 'church_search',
    increment: number = 1
  ): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('increment_usage', {
          p_user_id: userId,
          p_metric_type: metricType,
          p_increment: increment
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      // Don't throw here to avoid breaking app functionality
    }
  }

  // Check if user can access a feature
  static async checkFeatureAccess(
    userId: string,
    feature: string,
    incrementUsage: boolean = false
  ): Promise<FeatureCheckResult> {
    try {
      // Get user's subscription
      const subscription = await this.getUserSubscription(userId);
      if (!subscription?.subscription_plans) {
        return {
          allowed: false,
          upgrade_required: true,
          current_tier: 'none',
          required_tier: 'student'
        };
      }

      const planName = subscription.subscription_plans.name;

      // Get subscription limits
      const { data: limits, error: limitsError } = await supabase
        .from('subscription_limits')
        .select('*')
        .eq('plan_name', planName)
        .single();

      if (limitsError) throw limitsError;

      // Get current usage
      const usage = await this.getCurrentUsage(userId);

      let result: FeatureCheckResult = {
        allowed: true,
        current_tier: planName
      };

      // Check specific features
      switch (feature) {
        case 'ai_conversation':
          if (limits.daily_conversations !== null) {
            const remaining = limits.daily_conversations - usage.conversations_today;
            result = {
              allowed: remaining > 0,
              remaining: Math.max(0, remaining),
              limit: limits.daily_conversations,
              upgrade_required: remaining <= 0,
              current_tier: planName,
              required_tier: remaining <= 0 ? 'student' : undefined
            };
            
            if (incrementUsage && result.allowed) {
              await this.incrementUsage(userId, 'conversation');
            }
          }
          break;

        case 'accurate_mode':
          if (!limits.accurate_mode_enabled) {
            result = {
              allowed: false,
              upgrade_required: true,
              current_tier: planName,
              required_tier: 'scholar'
            };
          } else if (limits.daily_accurate_mode !== null) {
            const remaining = limits.daily_accurate_mode - usage.accurate_mode_today;
            result = {
              allowed: remaining > 0,
              remaining: Math.max(0, remaining),
              limit: limits.daily_accurate_mode,
              upgrade_required: remaining <= 0,
              current_tier: planName,
              required_tier: remaining <= 0 ? 'scholar' : undefined
            };

            if (incrementUsage && result.allowed) {
              await this.incrementUsage(userId, 'accurate_mode');
            }
          }
          break;

        case 'advanced_bible_search':
          result = {
            allowed: limits.advanced_bible_search,
            upgrade_required: !limits.advanced_bible_search,
            current_tier: planName,
            required_tier: !limits.advanced_bible_search ? 'student' : undefined
          };
          break;

        case 'cross_references':
          result = {
            allowed: limits.cross_references_enabled,
            upgrade_required: !limits.cross_references_enabled,
            current_tier: planName,
            required_tier: !limits.cross_references_enabled ? 'student' : undefined
          };
          break;

        case 'bible_search':
          if (limits.daily_bible_searches !== null) {
            const remaining = limits.daily_bible_searches - usage.bible_searches_today;
            result = {
              allowed: remaining > 0,
              remaining: Math.max(0, remaining),
              limit: limits.daily_bible_searches,
              upgrade_required: remaining <= 0,
              current_tier: planName,
              required_tier: remaining <= 0 ? 'student' : undefined
            };

            if (incrementUsage && result.allowed) {
              await this.incrementUsage(userId, 'bible_search');
            }
          }
          break;

        case 'note_creation':
          if (limits.monthly_notes !== null) {
            const remaining = limits.monthly_notes - usage.notes_this_month;
            result = {
              allowed: remaining > 0,
              remaining: Math.max(0, remaining),
              limit: limits.monthly_notes,
              upgrade_required: remaining <= 0,
              current_tier: planName,
              required_tier: remaining <= 0 ? 'student' : undefined
            };

            if (incrementUsage && result.allowed) {
              await this.incrementUsage(userId, 'note_created');
            }
          }
          break;

        case 'export':
          if (limits.daily_exports !== null) {
            const remaining = limits.daily_exports - usage.exports_today;
            result = {
              allowed: remaining > 0,
              remaining: Math.max(0, remaining),
              limit: limits.daily_exports,
              upgrade_required: remaining <= 0,
              current_tier: planName,
              required_tier: remaining <= 0 ? 'student' : undefined
            };

            if (incrementUsage && result.allowed) {
              await this.incrementUsage(userId, 'export');
            }
          }
          break;

        case 'collaboration':
          result = {
            allowed: limits.collaboration_enabled,
            upgrade_required: !limits.collaboration_enabled,
            current_tier: planName,
            required_tier: !limits.collaboration_enabled ? 'scholar' : undefined
          };
          break;

        case 'api_access':
          if (!limits.api_access_enabled) {
            result = {
              allowed: false,
              upgrade_required: true,
              current_tier: planName,
              required_tier: 'scholar'
            };
          } else if (limits.monthly_api_calls !== null) {
            const remaining = limits.monthly_api_calls - usage.api_calls_this_month;
            result = {
              allowed: remaining > 0,
              remaining: Math.max(0, remaining),
              limit: limits.monthly_api_calls,
              upgrade_required: remaining <= 0,
              current_tier: planName,
              required_tier: remaining <= 0 ? 'scholar' : undefined
            };

            if (incrementUsage && result.allowed) {
              await this.incrementUsage(userId, 'api_call');
            }
          }
          break;

        case 'priority_support':
          result = {
            allowed: limits.priority_support,
            upgrade_required: !limits.priority_support,
            current_tier: planName,
            required_tier: !limits.priority_support ? 'scholar' : undefined
          };
          break;

        case 'white_label':
          result = {
            allowed: limits.white_label_enabled,
            upgrade_required: !limits.white_label_enabled,
            current_tier: planName,
            required_tier: !limits.white_label_enabled ? 'ministry' : undefined
          };
          break;

        default:
          result = { allowed: true, current_tier: planName };
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
  }

  // Apply promo code
  static async applyPromoCode(userId: string, code: string): Promise<{
    valid: boolean;
    discount?: number;
    type?: string;
    message?: string;
  }> {
    try {
      const { data: promoCode, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (error || !promoCode) {
        return { valid: false, message: 'Invalid promo code' };
      }

      // Check if code is still valid
      const now = new Date();
      if (new Date(promoCode.valid_from) > now || new Date(promoCode.valid_until) < now) {
        return { valid: false, message: 'Promo code has expired' };
      }

      // Check usage limits
      if (promoCode.max_uses && promoCode.current_uses >= promoCode.max_uses) {
        return { valid: false, message: 'Promo code usage limit reached' };
      }

      // Check if user already used this code
      const { data: existingUsage } = await supabase
        .from('promo_code_usage')
        .select('id')
        .eq('promo_code_id', promoCode.id)
        .eq('user_id', userId)
        .single();

      if (existingUsage) {
        return { valid: false, message: 'You have already used this promo code' };
      }

      // Check if first-time only restriction applies
      if (promoCode.first_time_only) {
        const { data: userSubscriptions } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', userId);

        if (userSubscriptions && userSubscriptions.length > 0) {
          return { valid: false, message: 'This promo code is for new users only' };
        }
      }

      return {
        valid: true,
        discount: parseFloat(promoCode.value),
        type: promoCode.type,
        message: 'Promo code is valid'
      };
    } catch (error) {
      console.error('Error applying promo code:', error);
      return { valid: false, message: 'Error validating promo code' };
    }
  }

  // Create referral code for user
  static async createReferralCode(userId: string): Promise<string> {
    try {
      // Check if user already has a referral code
      const { data: existing } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('user_id', userId)
        .single();

      if (existing) {
        return existing.code;
      }

      // Generate unique code
      const code = this.generateReferralCode();

      const { data, error } = await supabase
        .from('referral_codes')
        .insert({
          user_id: userId,
          code: code
        })
        .select('code')
        .single();

      if (error) throw error;

      return data.code;
    } catch (error) {
      console.error('Error creating referral code:', error);
      throw error;
    }
  }

  // Process referral
  static async processReferral(referralCode: string, refereeId: string): Promise<{
    success: boolean;
    message: string;
    extendedTrial?: number;
  }> {
    try {
      const { data: referralData, error } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('code', referralCode.toUpperCase())
        .single();

      if (error || !referralData) {
        return { success: false, message: 'Invalid referral code' };
      }

      // Check if referee is the same as referrer
      if (referralData.user_id === refereeId) {
        return { success: false, message: 'You cannot refer yourself' };
      }

      // Check if referral already exists
      const { data: existingReferral } = await supabase
        .from('referrals')
        .select('id')
        .eq('referrer_id', referralData.user_id)
        .eq('referee_id', refereeId)
        .single();

      if (existingReferral) {
        return { success: false, message: 'Referral already exists' };
      }

      // Create referral record
      const { error: referralError } = await supabase
        .from('referrals')
        .insert({
          referral_code_id: referralData.id,
          referrer_id: referralData.user_id,
          referee_id: refereeId
        });

      if (referralError) throw referralError;

      // Extend referee's trial
      const trialExtension = referralData.referee_reward_value;
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          trial_end_date: new Date(Date.now() + trialExtension * 24 * 60 * 60 * 1000)
        })
        .eq('id', refereeId);

      if (userUpdateError) throw userUpdateError;

      return {
        success: true,
        message: `Trial extended by ${trialExtension} days`,
        extendedTrial: trialExtension
      };
    } catch (error) {
      console.error('Error processing referral:', error);
      return { success: false, message: 'Error processing referral' };
    }
  }

  // Get subscription analytics
  static async getSubscriptionAnalytics(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('subscription_analytics')
        .select('*');

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching subscription analytics:', error);
      throw error;
    }
  }

  // Helper function to generate referral code
  private static generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}