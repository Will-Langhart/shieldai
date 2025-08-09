import React, { useState, useEffect } from 'react';
import { X, Check, Star, Zap, Shield, Crown, Sparkles, Loader2, AlertTriangle, CreditCard, Lock } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { useSubscriptionAPI } from '../lib/api-integration-hooks';
import { useAuth } from '../lib/auth-context';

interface SubscriptionPlan {
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

interface EnhancedSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
  onSubscriptionChange?: () => void;
}

const EnhancedSubscriptionModal: React.FC<EnhancedSubscriptionModalProps> = ({ 
  isOpen, 
  onClose, 
  theme = 'dark',
  onSubscriptionChange
}) => {
  const { user } = useAuth();
  const { 
    subscriptionStatus, 
    getSubscriptionPlans, 
    createSubscription,
    checkFeatureAccess,
    loading, 
    error 
  } = useSubscriptionAPI();
  
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [promoCode, setPromoCode] = useState('');
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPlans();
    }
  }, [isOpen]);

  const loadPlans = async () => {
    try {
      const plansData = await getSubscriptionPlans();
      setPlans(plansData);
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  };

  const handleSubscribe = async (planName: string) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    setPaymentProcessing(true);
    setSelectedPlan(planName);

    try {
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          planName,
          billingCycle,
          promoCode: promoCode || undefined
        }),
      });

      const data = await response.json();
      if (data.success && data.clientSecret) {
        const { error } = await stripe.confirmCardPayment(data.clientSecret);
        if (error) {
          console.error('Payment failed:', error);
          throw new Error(error.message);
        } else {
          onClose();
          onSubscriptionChange?.();
          // Optionally refresh the page or update subscription status
          window.location.reload();
        }
      } else {
        throw new Error(data.error || 'Failed to create subscription');
      }
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setPaymentProcessing(false);
      setSelectedPlan(null);
    }
  };

  const handlePromoCode = async () => {
    if (!promoCode.trim()) return;

    try {
      const response = await fetch('/api/subscriptions/promo-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: promoCode }),
      });

      const data = await response.json();
      
      if (data.valid) {
        setPromoSuccess(`Promo code applied! ${data.discount}% discount`);
        setPromoError('');
      } else {
        setPromoError(data.message || 'Invalid promo code');
        setPromoSuccess('');
      }
    } catch (error) {
      setPromoError('Error applying promo code');
      setPromoSuccess('');
    }
  };

  const getPrice = (plan: SubscriptionPlan) => {
    const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
    return price.toFixed(2);
  };

  const getBillingText = () => {
    return billingCycle === 'yearly' ? '/year' : '/month';
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'ministry': return <Crown className="w-6 h-6" />;
      case 'scholar': return <Star className="w-6 h-6" />;
      case 'student': return <Zap className="w-6 h-6" />;
      default: return <Shield className="w-6 h-6" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case 'ministry': return 'from-purple-500 to-pink-500';
      case 'scholar': return 'from-blue-500 to-indigo-500';
      case 'student': return 'from-green-500 to-teal-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getThemeClasses = () => {
    return theme === 'dark' 
      ? 'bg-shield-black text-shield-white border-shield-gray' 
      : 'bg-white text-gray-900 border-gray-200';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`relative w-full max-w-4xl max-h-[90vh] ${getThemeClasses()} rounded-2xl border backdrop-blur-xl overflow-hidden`}>
        {/* Header */}
        <div className="p-6 border-b border-shield-gray">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="w-6 h-6 text-shield-blue" />
              <h2 className="text-xl font-bold">Choose Your Plan</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-shield-gray transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="mt-4 flex items-center justify-center space-x-4">
            <span className="text-sm">Billing Cycle:</span>
            <div className="flex bg-shield-gray rounded-lg p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  billingCycle === 'monthly' 
                    ? 'bg-shield-blue text-shield-white' 
                    : 'text-shield-gray hover:text-shield-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  billingCycle === 'yearly' 
                    ? 'bg-shield-blue text-shield-white' 
                    : 'text-shield-gray hover:text-shield-white'
                }`}
              >
                Yearly
                <span className="ml-1 text-xs bg-green-500 text-white px-1 rounded">Save 20%</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-shield-blue" />
              <span className="ml-2">Loading plans...</span>
            </div>
          )}

          {error && (
            <div className="text-red-400 text-center py-4">
              {error}
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                  selectedPlan === plan.name
                    ? 'border-shield-blue bg-shield-blue bg-opacity-10'
                    : 'border-shield-gray hover:border-shield-blue'
                }`}
              >
                {/* Plan Header */}
                <div className="text-center mb-4">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-r ${getPlanColor(plan.name)} mb-3`}>
                    {getPlanIcon(plan.name)}
                  </div>
                  <h3 className="text-lg font-bold">{plan.display_name}</h3>
                  <p className="text-sm text-shield-gray mt-1">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold">
                    ${getPrice(plan)}
                  </div>
                  <div className="text-sm text-shield-gray">
                    {getBillingText()}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Limits */}
                {plan.limits && (
                  <div className="space-y-2 mb-6">
                    {plan.limits.daily_conversations && (
                      <div className="text-xs text-shield-gray">
                        {plan.limits.daily_conversations} conversations/day
                      </div>
                    )}
                    {plan.limits.daily_accurate_mode && (
                      <div className="text-xs text-shield-gray">
                        {plan.limits.daily_accurate_mode} accurate mode/day
                      </div>
                    )}
                    {plan.limits.monthly_notes && (
                      <div className="text-xs text-shield-gray">
                        {plan.limits.monthly_notes} notes/month
                      </div>
                    )}
                  </div>
                )}

                {/* Subscribe Button */}
                <button
                  onClick={() => handleSubscribe(plan.name)}
                  disabled={paymentProcessing}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    paymentProcessing && selectedPlan === plan.name
                      ? 'bg-shield-gray text-shield-white cursor-not-allowed'
                      : 'bg-shield-blue text-shield-white hover:bg-blue-600'
                  }`}
                >
                  {paymentProcessing && selectedPlan === plan.name ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </div>
                  ) : (
                    'Subscribe Now'
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Promo Code Section */}
          <div className="mt-8 p-4 bg-shield-gray rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Have a promo code?</h4>
              <button
                onClick={() => setShowPromoInput(!showPromoInput)}
                className="text-shield-blue hover:text-shield-white text-sm"
              >
                {showPromoInput ? 'Hide' : 'Add Code'}
              </button>
            </div>

            {showPromoInput && (
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter promo code"
                    className="flex-1 p-2 rounded-lg bg-shield-black border border-shield-gray focus:ring-2 focus:ring-shield-blue focus:outline-none"
                  />
                  <button
                    onClick={handlePromoCode}
                    className="px-4 py-2 bg-shield-blue text-shield-white rounded-lg hover:bg-blue-600"
                  >
                    Apply
                  </button>
                </div>
                {promoError && (
                  <div className="text-red-400 text-sm">{promoError}</div>
                )}
                {promoSuccess && (
                  <div className="text-green-400 text-sm">{promoSuccess}</div>
                )}
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-shield-gray rounded-xl">
            <div className="flex items-center space-x-2 mb-2">
              <Lock className="w-4 h-4 text-green-400" />
              <span className="font-medium">Secure Payment</span>
            </div>
            <p className="text-sm text-shield-gray">
              Your payment information is encrypted and secure. We use Stripe for all transactions.
            </p>
          </div>

          {/* Current Subscription Status */}
          {subscriptionStatus && (
            <div className="mt-6 p-4 bg-shield-gray rounded-xl">
              <h4 className="font-semibold mb-2">Current Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Plan:</span>
                  <span className="font-medium">{subscriptionStatus.currentTier || 'Free'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`font-medium ${
                    subscriptionStatus.hasActiveSubscription ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {subscriptionStatus.hasActiveSubscription ? 'Active' : 'Trial'}
                  </span>
                </div>
                {subscriptionStatus.remainingMessages !== undefined && (
                  <div className="flex justify-between">
                    <span>Remaining Messages:</span>
                    <span className="font-medium">{subscriptionStatus.remainingMessages}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedSubscriptionModal;