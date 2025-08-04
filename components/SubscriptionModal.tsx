import React, { useState, useEffect } from 'react';
import { X, Check, Star, Zap, Shield } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface SubscriptionPlan {
  id: string;
  name: 'basic' | 'premium';
  display_name: string;
  description: string;
  price_weekly: number;
  price_monthly?: number;
  price_yearly?: number;
  features: string[];
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubscription?: any;
  isInTrial?: boolean;
}

export default function SubscriptionModal({
  isOpen,
  onClose,
  currentSubscription,
  isInTrial = false,
}: SubscriptionModalProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium' | null>(null);
  const [billingCycle, setBillingCycle] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscriptions/plans');
      const data = await response.json();
      setPlans(data.plans);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const handleSubscribe = async (planName: 'basic' | 'premium') => {
    setLoading(true);
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        },
        body: JSON.stringify({ planName }),
      });

      const { clientSecret } = await response.json();

      if (clientSecret) {
        const { error } = await stripe.confirmCardPayment(clientSecret);
        if (error) {
          console.error('Payment failed:', error);
        } else {
          onClose();
          // Refresh subscription status
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPrice = (plan: SubscriptionPlan) => {
    switch (billingCycle) {
      case 'weekly':
        return plan.price_weekly;
      case 'monthly':
        return plan.price_monthly || plan.price_weekly * 4;
      case 'yearly':
        return plan.price_yearly || plan.price_weekly * 52;
      default:
        return plan.price_weekly;
    }
  };

  const getBillingText = () => {
    switch (billingCycle) {
      case 'weekly':
        return 'per week';
      case 'monthly':
        return 'per month';
      case 'yearly':
        return 'per year';
      default:
        return 'per week';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
              <p className="text-gray-600">Unlock the full potential of Shield AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Trial Banner */}
        {isInTrial && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <Star className="w-5 h-5" />
              <span className="font-semibold">Free Trial Active</span>
            </div>
            <p className="text-sm opacity-90 mt-1">
              Your trial ends in 7 days. Choose a plan to continue using Shield AI.
            </p>
          </div>
        )}

        {/* Billing Cycle Toggle */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Billing Cycle:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['weekly', 'monthly', 'yearly'] as const).map((cycle) => (
                <button
                  key={cycle}
                  onClick={() => setBillingCycle(cycle)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    billingCycle === cycle
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative p-6 rounded-xl border-2 transition-all ${
                  plan.name === 'premium'
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {plan.name === 'premium' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {plan.display_name}
                  </h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">
                      ${getPrice(plan)}
                    </span>
                    <span className="text-gray-600 ml-2">{getBillingText()}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSubscribe(plan.name)}
                  disabled={loading}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                    plan.name === 'premium'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    `Subscribe to ${plan.display_name}`
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="text-center text-sm text-gray-600">
            <p>All plans include a 7-day free trial. Cancel anytime.</p>
            <p className="mt-1">
              Need help? Contact our support team at{' '}
              <a href="mailto:support@shieldai.com" className="text-blue-600 hover:underline">
                support@shieldai.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 