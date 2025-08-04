import React, { useState, useEffect } from 'react';
import { X, Check, Star, Zap, Shield, Crown, Sparkles } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

interface SubscriptionPlan {
  name: 'basic' | 'premium';
  display_name: string;
  description: string;
  price_weekly: number;
  features: string[];
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubscription: any;
  isInTrial?: boolean;
  theme?: 'light' | 'dark';
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ 
  isOpen, 
  onClose, 
  currentSubscription, 
  isInTrial = false,
  theme = 'dark'
}) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPlans();
    }
  }, [isOpen]);

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/subscriptions/plans');
      const data = await response.json();
      if (data.success) {
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  };

  const handleSubscribe = async (planName: string) => {
    setLoading(true);
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
        body: JSON.stringify({ planName }),
      });

      const data = await response.json();
      if (data.success && data.clientSecret) {
        const { error } = await stripe.confirmCardPayment(data.clientSecret);
        if (error) {
          console.error('Payment failed:', error);
        } else {
          onClose();
          // Optionally refresh the page or update subscription status
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const getPrice = (plan: SubscriptionPlan) => {
    return plan.price_weekly.toFixed(2);
  };

  const getBillingText = () => {
    return '/week';
  };

  const getPlanIcon = (planName: string) => {
    return planName === 'premium' ? <Crown className="w-6 h-6" /> : <Shield className="w-6 h-6" />;
  };

  const getPlanColor = (planName: string) => {
    return planName === 'premium' 
      ? 'from-purple-600 to-blue-600' 
      : 'from-blue-600 to-indigo-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-5xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Choose Your Shield AI Plan</h2>
              <p className="text-gray-600">Unlock the full potential of AI-powered apologetics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Plans */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-6 rounded-xl border-2 transition-all duration-300 ${
                  plan.name === 'premium'
                    ? 'border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50'
                    : 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50'
                }`}
              >
                {plan.name === 'premium' && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center space-x-2">
                      <Crown className="w-4 h-4" />
                      <span>Most Popular</span>
                    </div>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 bg-gradient-to-r ${getPlanColor(plan.name)} rounded-full`}>
                      {getPlanIcon(plan.name)}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.display_name}
                  </h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-gray-900">
                      ${getPrice(plan)}
                    </span>
                    <span className="text-gray-600 ml-2 text-lg">{getBillingText()}</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Check className="w-5 h-5 text-green-500" />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSubscribe(plan.name)}
                  disabled={loading}
                  className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                    plan.name === 'premium'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    'Choose Plan'
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="text-center text-sm text-gray-600">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Shield AI Subscription</span>
            </div>
            <p>All plans include a 7-day free trial. Cancel anytime.</p>
            <p className="mt-1">
              By subscribing, you agree to our <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal; 