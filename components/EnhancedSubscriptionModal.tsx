import React, { useState, useEffect } from 'react';
import { X, Check, Star, Zap, Shield, Crown, Sparkles, Users, BookOpen, Brain, Church } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../lib/auth-context';

interface SubscriptionTier {
  name: 'basic' | 'student' | 'scholar' | 'ministry';
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  limits: {
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
  };
}

interface UsageMetrics {
  conversations_today: number;
  accurate_mode_today: number;
  bible_searches_today: number;
  exports_today: number;
  notes_this_month: number;
  api_calls_this_month: number;
  church_searches_this_month: number;
}

interface EnhancedSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubscription: any;
  theme?: 'light' | 'dark';
}

const EnhancedSubscriptionModal: React.FC<EnhancedSubscriptionModalProps> = ({ 
  isOpen, 
  onClose, 
  currentSubscription,
  theme = 'dark'
}) => {
  const { user, session } = useAuth();
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [usage, setUsage] = useState<UsageMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState<{ valid: boolean; message: string; discount?: number; type?: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTiers();
      loadUsage();
    }
  }, [isOpen]);

  const loadTiers = async () => {
    try {
      const response = await fetch('/api/subscriptions/tiers');
      const data = await response.json();
      if (data.success) {
        setTiers(data.tiers);
      }
    } catch (error) {
      console.error('Error loading tiers:', error);
    }
  };

  const loadUsage = async () => {
    if (!user || !session?.access_token) return;
    
    try {
      const response = await fetch('/api/subscriptions/usage', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUsage(data.usage);
      }
    } catch (error) {
      console.error('Error loading usage:', error);
    }
  };

  const applyPromoCode = async () => {
    if (!promoCode.trim() || !user || !session?.access_token) return;

    try {
      const response = await fetch('/api/subscriptions/promo-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ code: promoCode })
      });

      const data = await response.json();
      setPromoApplied(data);
    } catch (error) {
      console.error('Error applying promo code:', error);
      setPromoApplied({ valid: false, message: 'Error applying promo code' });
    }
  };

  const handleSubscribe = async (tierName: string) => {
    if (!user || !session?.access_token) return;
    
    setLoading(true);
    setSelectedTier(tierName);

    try {
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          planName: tierName, 
          billingPeriod,
          promoCode: promoApplied?.valid ? promoCode : undefined
        }),
      });

      const data = await response.json();
      if (data.success && data.clientSecret) {
        const { error } = await stripe.confirmCardPayment(data.clientSecret);
        if (error) {
          console.error('Payment failed:', error);
        } else {
          onClose();
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setLoading(false);
      setSelectedTier(null);
    }
  };

  const getTierIcon = (tierName: string) => {
    switch (tierName) {
      case 'basic': return <BookOpen className="w-6 h-6" />;
      case 'student': return <Star className="w-6 h-6" />;
      case 'scholar': return <Brain className="w-6 h-6" />;
      case 'ministry': return <Church className="w-6 h-6" />;
      default: return <Zap className="w-6 h-6" />;
    }
  };

  const getTierColor = (tierName: string) => {
    switch (tierName) {
      case 'basic': return 'from-gray-500 to-gray-600';
      case 'student': return 'from-blue-500 to-blue-600';
      case 'scholar': return 'from-purple-500 to-purple-600';
      case 'ministry': return 'from-amber-500 to-amber-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const formatUsageInfo = (tier: SubscriptionTier) => {
    if (!usage) return [];
    
    const info: string[] = [];
    
    if (tier.limits.daily_conversations !== null && tier.limits.daily_conversations !== undefined) {
      info.push(`${usage.conversations_today}/${tier.limits.daily_conversations} conversations today`);
    }
    
    if (tier.limits.daily_bible_searches !== null && tier.limits.daily_bible_searches !== undefined) {
      info.push(`${usage.bible_searches_today}/${tier.limits.daily_bible_searches} Bible searches today`);
    }
    
    if (tier.limits.monthly_notes !== null && tier.limits.monthly_notes !== undefined) {
      info.push(`${usage.notes_this_month}/${tier.limits.monthly_notes} notes this month`);
    }
    
    return info;
  };

  const calculatePrice = (tier: SubscriptionTier) => {
    const basePrice = billingPeriod === 'monthly' ? tier.price_monthly : tier.price_yearly;
    if (promoApplied?.valid && promoApplied.discount) {
      if (promoApplied.type === 'percentage') {
        return basePrice * (1 - promoApplied.discount / 100);
      } else if (promoApplied.type === 'fixed_amount') {
        return Math.max(0, basePrice - promoApplied.discount);
      }
    }
    return basePrice;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`max-w-7xl w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Choose Your Plan
              </h2>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Unlock the full potential of Shield AI for your Bible study
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              <X size={24} />
            </button>
          </div>

          {/* Billing Period Toggle */}
          <div className="flex items-center justify-center mt-6">
            <div className={`flex rounded-lg p-1 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingPeriod === 'monthly'
                    ? theme === 'dark'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-600 text-white'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
                  billingPeriod === 'yearly'
                    ? theme === 'dark'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-600 text-white'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          {/* Promo Code */}
          <div className="mt-6 flex items-center justify-center space-x-2">
            <input
              type="text"
              placeholder="Promo code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              className={`px-3 py-2 border rounded-lg text-sm ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            <button
              onClick={applyPromoCode}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
          </div>

          {promoApplied && (
            <div className={`mt-2 text-center text-sm ${
              promoApplied.valid ? 'text-green-600' : 'text-red-600'
            }`}>
              {promoApplied.message}
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier) => {
              const isCurrentPlan = currentSubscription?.subscription_plans?.name === tier.name;
              const price = calculatePrice(tier);
              const usageInfo = formatUsageInfo(tier);

              return (
                <div
                  key={tier.name}
                  className={`relative rounded-2xl p-6 border-2 transition-all ${
                    isCurrentPlan
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : theme === 'dark'
                        ? 'border-gray-700 bg-gray-800 hover:border-gray-600'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                  } ${tier.name === 'scholar' ? 'ring-2 ring-purple-500 ring-opacity-50' : ''}`}
                >
                  {tier.name === 'scholar' && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${getTierColor(tier.name)}`}>
                      {getTierIcon(tier.name)}
                    </div>
                    <div>
                      <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {tier.display_name}
                      </h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {tier.description}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        ${price.toFixed(2)}
                      </span>
                      <span className={`ml-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        /{billingPeriod === 'monthly' ? 'month' : 'year'}
                      </span>
                    </div>
                    {promoApplied?.valid && (
                      <div className="text-sm text-green-600">
                        Original: ${(billingPeriod === 'monthly' ? tier.price_monthly : tier.price_yearly).toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Usage Information */}
                  {isCurrentPlan && usage && usageInfo.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Current Usage
                      </h4>
                      {usageInfo.map((info, index) => (
                        <div key={index} className="text-xs text-blue-700 dark:text-blue-300">
                          {info}
                        </div>
                      ))}
                    </div>
                  )}

                  <ul className="space-y-3 mb-6">
                    {tier.features.slice(0, 5).map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                    {tier.features.length > 5 && (
                      <li className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        +{tier.features.length - 5} more features
                      </li>
                    )}
                  </ul>

                  <button
                    onClick={() => tier.name !== 'basic' && handleSubscribe(tier.name)}
                    disabled={loading || isCurrentPlan || tier.name === 'basic'}
                    className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                      isCurrentPlan
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : tier.name === 'basic'
                          ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                          : tier.name === 'scholar'
                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                    } ${loading && selectedTier === tier.name ? 'opacity-50' : ''}`}
                  >
                    {loading && selectedTier === tier.name ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : tier.name === 'basic' ? (
                      'Free Trial'
                    ) : (
                      `Upgrade to ${tier.display_name}`
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Feature Comparison */}
          <div className="mt-12">
            <h3 className={`text-xl font-bold mb-6 text-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Feature Comparison
            </h3>
            <div className="overflow-x-auto">
              <table className={`w-full border rounded-lg ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <thead className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <tr>
                    <th className={`p-3 text-left ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Feature</th>
                    {tiers.map(tier => (
                      <th key={tier.name} className={`p-3 text-center ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {tier.display_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'AI Conversations', key: 'daily_conversations' },
                    { name: 'GPT-4 Accurate Mode', key: 'accurate_mode_enabled' },
                    { name: 'Advanced Bible Search', key: 'advanced_bible_search' },
                    { name: 'Cross References', key: 'cross_references_enabled' },
                    { name: 'Collaboration', key: 'collaboration_enabled' },
                    { name: 'API Access', key: 'api_access_enabled' },
                    { name: 'Priority Support', key: 'priority_support' },
                    { name: 'Team Members', key: 'max_team_members' }
                  ].map((feature, index) => (
                    <tr key={feature.key} className={index % 2 === 0 ? (theme === 'dark' ? 'bg-gray-900' : 'bg-white') : (theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50')}>
                      <td className={`p-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {feature.name}
                      </td>
                      {tiers.map(tier => (
                        <td key={tier.name} className="p-3 text-center">
                          {feature.key === 'daily_conversations' ? (
                            tier.limits.daily_conversations === null ? (
                              <span className="text-green-500">Unlimited</span>
                            ) : (
                              <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                                {tier.limits.daily_conversations}
                              </span>
                            )
                          ) : feature.key === 'max_team_members' ? (
                            <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                              {tier.limits.max_team_members}
                            </span>
                          ) : tier.limits[feature.key as keyof typeof tier.limits] ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-red-500 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSubscriptionModal;