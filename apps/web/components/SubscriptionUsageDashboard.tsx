import React, { useState, useEffect } from 'react';
import { Activity, MessageSquare, BookOpen, FileText, Upload, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAuth } from '../lib/auth-context';

interface UsageMetrics {
  conversations_today: number;
  accurate_mode_today: number;
  bible_searches_today: number;
  exports_today: number;
  notes_this_month: number;
  api_calls_this_month: number;
  church_searches_this_month: number;
}

interface SubscriptionLimits {
  daily_conversations?: number;
  daily_accurate_mode?: number;
  daily_bible_searches?: number;
  daily_exports?: number;
  monthly_notes?: number;
  monthly_api_calls?: number;
  monthly_church_searches?: number;
}

interface SubscriptionUsageDashboardProps {
  theme?: 'light' | 'dark';
  currentTier?: string;
  onUpgradeClick?: () => void;
}

const SubscriptionUsageDashboard: React.FC<SubscriptionUsageDashboardProps> = ({
  theme = 'dark',
  currentTier = 'basic',
  onUpgradeClick
}) => {
  const { user, session } = useAuth();
  const [usage, setUsage] = useState<UsageMetrics | null>(null);
  const [limits, setLimits] = useState<SubscriptionLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUsageData();
    }
  }, [user]);

  const loadUsageData = async () => {
    if (!user || !session?.access_token) return;

    try {
      setLoading(true);

      // Load current usage
      const usageResponse = await fetch('/api/subscriptions/usage', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        setUsage(usageData.usage);
      }

      // Load subscription tiers to get limits
      const tiersResponse = await fetch('/api/subscriptions/tiers');
      if (tiersResponse.ok) {
        const tiersData = await tiersResponse.json();
        const currentTierData = tiersData.tiers.find((tier: any) => tier.name === currentTier);
        if (currentTierData) {
          setLimits(currentTierData.limits);
        }
      }
    } catch (error) {
      console.error('Error loading usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = (current: number, limit?: number): number => {
    if (!limit) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getProgressBarColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const UsageCard: React.FC<{
    title: string;
    icon: React.ReactNode;
    current: number;
    limit?: number;
    subtitle: string;
    isUnlimited?: boolean;
  }> = ({ title, icon, current, limit, subtitle, isUnlimited = false }) => {
    const percentage = getUsagePercentage(current, limit);
    const isNearLimit = percentage >= 80;

    return (
      <div className={`p-4 rounded-lg border ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      } ${isNearLimit ? 'ring-2 ring-yellow-500 ring-opacity-50' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              {icon}
            </div>
            <div>
              <h3 className={`font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {title}
              </h3>
              <p className={`text-xs ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {subtitle}
              </p>
            </div>
          </div>
          {isNearLimit && (
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {current.toLocaleString()}
            </span>
            {!isUnlimited && limit && (
              <span className={`text-sm ${getUsageColor(percentage)}`}>
                {percentage.toFixed(0)}%
              </span>
            )}
          </div>

          {!isUnlimited && limit ? (
            <>
              <div className={`w-full h-2 rounded-full ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(percentage)}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  {(limit - current)} remaining
                </span>
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  {limit.toLocaleString()} limit
                </span>
              </div>
            </>
          ) : (
            <div className="text-center">
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-green-400' : 'text-green-600'
              }`}>
                Unlimited
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`p-6 rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="animate-pulse space-y-4">
          <div className={`h-4 rounded ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
          }`} />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`h-24 rounded ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              }`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!usage || !limits) {
    return (
      <div className={`p-6 rounded-lg text-center ${
        theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'
      }`}>
        <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Unable to load usage data</p>
      </div>
    );
  }

  const hasAnyLimits = Object.values(limits).some(limit => limit !== null && limit !== undefined);
  const isNearAnyLimit = hasAnyLimits && [
    { current: usage.conversations_today, limit: limits.daily_conversations },
    { current: usage.accurate_mode_today, limit: limits.daily_accurate_mode },
    { current: usage.bible_searches_today, limit: limits.daily_bible_searches },
    { current: usage.exports_today, limit: limits.daily_exports },
    { current: usage.notes_this_month, limit: limits.monthly_notes },
    { current: usage.api_calls_this_month, limit: limits.monthly_api_calls }
  ].some(({ current, limit }) => limit && getUsagePercentage(current, limit) >= 80);

  return (
    <div className={`p-6 rounded-lg ${
      theme === 'dark' ? 'bg-gray-800' : 'bg-white'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Usage Dashboard
          </h2>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Current plan: <span className="font-medium capitalize">{currentTier}</span>
          </p>
        </div>
        
        {isNearAnyLimit && onUpgradeClick && (
          <button
            onClick={onUpgradeClick}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-purple-700 transition-all flex items-center space-x-2"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Upgrade</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <UsageCard
          title="Conversations"
          icon={<MessageSquare className="w-4 h-4 text-blue-500" />}
          current={usage.conversations_today}
          limit={limits.daily_conversations}
          subtitle="Today"
          isUnlimited={!limits.daily_conversations}
        />

        <UsageCard
          title="Accurate Mode"
          icon={<Zap className="w-4 h-4 text-purple-500" />}
          current={usage.accurate_mode_today}
          limit={limits.daily_accurate_mode}
          subtitle="GPT-4 usage today"
          isUnlimited={!limits.daily_accurate_mode}
        />

        <UsageCard
          title="Bible Searches"
          icon={<BookOpen className="w-4 h-4 text-green-500" />}
          current={usage.bible_searches_today}
          limit={limits.daily_bible_searches}
          subtitle="Today"
          isUnlimited={!limits.daily_bible_searches}
        />

        <UsageCard
          title="Notes Created"
          icon={<FileText className="w-4 h-4 text-yellow-500" />}
          current={usage.notes_this_month}
          limit={limits.monthly_notes}
          subtitle="This month"
          isUnlimited={!limits.monthly_notes}
        />

        <UsageCard
          title="Exports"
          icon={<Upload className="w-4 h-4 text-indigo-500" />}
          current={usage.exports_today}
          limit={limits.daily_exports}
          subtitle="Today"
          isUnlimited={!limits.daily_exports}
        />

        <UsageCard
          title="API Calls"
          icon={<Activity className="w-4 h-4 text-red-500" />}
          current={usage.api_calls_this_month}
          limit={limits.monthly_api_calls}
          subtitle="This month"
          isUnlimited={!limits.monthly_api_calls}
        />
      </div>

      {/* Upgrade Prompt */}
      {isNearAnyLimit && onUpgradeClick && (
        <div className={`p-4 rounded-lg border border-yellow-200 ${
          theme === 'dark' 
            ? 'bg-yellow-900 bg-opacity-20' 
            : 'bg-yellow-50'
        }`}>
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div className="flex-1">
              <h3 className={`font-medium ${
                theme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'
              }`}>
                Approaching Usage Limits
              </h3>
              <p className={`text-sm mt-1 ${
                theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'
              }`}>
                You're approaching the limits of your current plan. Upgrade to unlock unlimited access to all features.
              </p>
              <button
                onClick={onUpgradeClick}
                className={`mt-2 text-sm font-medium ${
                  theme === 'dark' ? 'text-yellow-200 hover:text-yellow-100' : 'text-yellow-800 hover:text-yellow-900'
                } underline`}
              >
                View upgrade options →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionUsageDashboard;