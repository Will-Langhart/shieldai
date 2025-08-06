import React from 'react';
import { Crown, ArrowRight, X } from 'lucide-react';

interface UpgradePromptProps {
  feature: string;
  currentTier: string;
  requiredTier: string;
  remaining?: number;
  limit?: number;
  onUpgrade: () => void;
  onDismiss?: () => void;
  theme?: 'light' | 'dark';
  variant?: 'modal' | 'banner' | 'inline';
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  feature,
  currentTier,
  requiredTier,
  remaining,
  limit,
  onUpgrade,
  onDismiss,
  theme = 'dark',
  variant = 'modal'
}) => {
  const getTierDisplayName = (tier: string) => {
    switch (tier) {
      case 'basic': return 'Explorer';
      case 'student': return 'Bible Student';
      case 'scholar': return 'Bible Scholar';
      case 'ministry': return 'Ministry';
      default: return tier;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'student': return 'from-blue-500 to-blue-600';
      case 'scholar': return 'from-purple-500 to-purple-600';
      case 'ministry': return 'from-amber-500 to-amber-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getFeatureMessage = () => {
    if (remaining !== undefined && limit !== undefined) {
      return `You've used ${limit - remaining} of ${limit} ${feature} for your current plan.`;
    }
    return `${feature} is not available on your current plan.`;
  };

  if (variant === 'banner') {
    return (
      <div className={`relative px-4 py-3 rounded-lg border ${
        theme === 'dark'
          ? 'bg-gradient-to-r from-purple-900 to-purple-800 border-purple-700'
          : 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200'
      }`}>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`absolute top-2 right-2 p-1 rounded-lg hover:bg-black hover:bg-opacity-20 ${
              theme === 'dark' ? 'text-purple-200' : 'text-purple-600'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        <div className="flex items-center space-x-3">
          <Crown className={`w-5 h-5 ${
            theme === 'dark' ? 'text-purple-300' : 'text-purple-600'
          }`} />
          <div className="flex-1">
            <p className={`text-sm font-medium ${
              theme === 'dark' ? 'text-purple-100' : 'text-purple-800'
            }`}>
              {getFeatureMessage()}
            </p>
            <p className={`text-xs ${
              theme === 'dark' ? 'text-purple-200' : 'text-purple-600'
            }`}>
              Upgrade to {getTierDisplayName(requiredTier)} to unlock this feature.
            </p>
          </div>
          <button
            onClick={onUpgrade}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-purple-600 text-white hover:bg-purple-500'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            Upgrade
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`p-3 rounded-lg border ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="text-center">
          <Crown className={`w-8 h-8 mx-auto mb-2 ${
            theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
          }`} />
          <h3 className={`font-medium mb-1 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Upgrade Required
          </h3>
          <p className={`text-sm mb-3 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {getFeatureMessage()}
          </p>
          <button
            onClick={onUpgrade}
            className={`px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r ${getTierColor(requiredTier)} text-white hover:opacity-90 transition-opacity`}
          >
            Upgrade to {getTierDisplayName(requiredTier)}
          </button>
        </div>
      </div>
    );
  }

  // Modal variant
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`max-w-md w-full rounded-2xl shadow-2xl ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="p-6">
          <div className="text-center">
            <div className={`inline-flex p-3 rounded-full bg-gradient-to-r ${getTierColor(requiredTier)} mb-4`}>
              <Crown className="w-8 h-8 text-white" />
            </div>
            
            <h2 className={`text-xl font-bold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Upgrade to Continue
            </h2>
            
            <p className={`text-sm mb-4 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {getFeatureMessage()}
            </p>

            {remaining !== undefined && limit !== undefined && (
              <div className={`p-3 rounded-lg mb-4 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Current Plan Usage
                  </span>
                  <span className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {limit - remaining}/{limit}
                  </span>
                </div>
                <div className={`w-full h-2 rounded-full mt-2 ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-red-500 to-red-600"
                    style={{ width: `${((limit - remaining) / limit) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className={`p-4 rounded-lg mb-6 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Current Plan
                  </p>
                  <p className={`font-medium ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {getTierDisplayName(currentTier)}
                  </p>
                </div>
                <ArrowRight className={`w-5 h-5 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`} />
                <div className="text-right">
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Upgrade to
                  </p>
                  <p className={`font-medium bg-gradient-to-r ${getTierColor(requiredTier)} bg-clip-text text-transparent`}>
                    {getTierDisplayName(requiredTier)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className={`flex-1 py-2 px-4 rounded-lg border font-medium transition-colors ${
                    theme === 'dark'
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Not Now
                </button>
              )}
              <button
                onClick={onUpgrade}
                className={`flex-1 py-2 px-4 rounded-lg font-medium text-white bg-gradient-to-r ${getTierColor(requiredTier)} hover:opacity-90 transition-opacity`}
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradePrompt;