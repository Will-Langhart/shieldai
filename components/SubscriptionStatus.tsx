import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, AlertTriangle, CheckCircle, XCircle, Settings, Shield, Crown } from 'lucide-react';

interface SubscriptionStatusProps {
  subscription?: any;
  isInTrial?: boolean;
  hasActiveSubscription?: boolean;
  onUpgrade?: () => void;
}

export default function SubscriptionStatus({
  subscription,
  isInTrial = false,
  hasActiveSubscription = false,
  onUpgrade,
}: SubscriptionStatusProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCancelSubscription = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        },
        body: JSON.stringify({ cancelAtPeriodEnd: true }),
      });

      if (response.ok) {
        setShowCancelModal(false);
        // Refresh the page to update status
        window.location.reload();
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/subscriptions/reactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        },
      });

      if (response.ok) {
        // Refresh the page to update status
        window.location.reload();
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (isInTrial) return 'text-blue-600';
    if (hasActiveSubscription) return 'text-green-600';
    return 'text-red-600';
  };

  const getStatusIcon = () => {
    if (isInTrial) return <Calendar className="w-5 h-5" />;
    if (hasActiveSubscription) return <CheckCircle className="w-5 h-5" />;
    return <XCircle className="w-5 h-5" />;
  };

  const getStatusText = () => {
    if (isInTrial) return 'Free Trial';
    if (hasActiveSubscription) return 'Active';
    return 'Inactive';
  };

  const getPlanIcon = (planName?: string) => {
    if (planName === 'premium') return <Crown className="w-5 h-5 text-purple-600" />;
    return <Shield className="w-5 h-5 text-blue-600" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Shield AI Subscription</h3>
        </div>
        <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="font-medium">{getStatusText()}</span>
        </div>
      </div>

      {/* Trial Banner */}
      {isInTrial && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-blue-600" />
            <div>
              <h4 className="font-semibold text-blue-900">Free Trial Active</h4>
              <p className="text-sm text-blue-700">
                Your trial ends in 7 days. Upgrade to continue using Shield AI.
              </p>
            </div>
          </div>
          <button
            onClick={onUpgrade}
            className="mt-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-colors"
          >
            Upgrade Now
          </button>
        </div>
      )}

      {/* Subscription Details */}
      {subscription && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Plan</h4>
              <div className="flex items-center space-x-2">
                {getPlanIcon(subscription.subscription_plans?.name)}
                <p className="text-lg font-semibold text-gray-900">
                  {subscription.subscription_plans?.display_name || 'Unknown Plan'}
                </p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Billing Cycle</h4>
              <p className="text-lg font-semibold text-gray-900">Weekly</p>
            </div>
            {subscription.current_period_start && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Period Start</h4>
                <p className="text-gray-900">{formatDate(subscription.current_period_start)}</p>
              </div>
            )}
            {subscription.current_period_end && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Period End</h4>
                <p className="text-gray-900">{formatDate(subscription.current_period_end)}</p>
              </div>
            )}
          </div>

          {/* Cancel at Period End Notice */}
          {subscription.cancel_at_period_end && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <h4 className="font-semibold text-yellow-900">Subscription Canceling</h4>
                  <p className="text-sm text-yellow-700">
                    Your subscription will end on {formatDate(subscription.current_period_end)}.
                  </p>
                </div>
              </div>
              <button
                onClick={handleReactivateSubscription}
                disabled={loading}
                className="mt-3 bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Reactivate Subscription'}
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            {hasActiveSubscription && !subscription.cancel_at_period_end && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Cancel Subscription
              </button>
            )}
            <button
              onClick={onUpgrade}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-colors"
            >
              {hasActiveSubscription ? 'Change Plan' : 'Upgrade'}
            </button>
          </div>
        </div>
      )}

      {/* No Subscription */}
      {!subscription && !isInTrial && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No Active Subscription</h4>
          <p className="text-gray-600 mb-4">
            Subscribe to unlock all features and continue using Shield AI.
          </p>
          <button
            onClick={onUpgrade}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-colors"
          >
            Subscribe Now
          </button>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCancelModal(false)}
          />
          <div className="relative bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cancel Subscription
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel your subscription? You'll continue to have access
              until the end of your current billing period.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Cancel Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 