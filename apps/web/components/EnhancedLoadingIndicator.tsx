import React, { useState, useEffect } from 'react';
import { Shield, Brain, Sparkles, BookOpen, Heart } from 'lucide-react';

interface EnhancedLoadingIndicatorProps {
  theme?: 'light' | 'dark';
  message?: string;
  showProgress?: boolean;
  variant?: 'default' | 'thinking' | 'analyzing' | 'writing';
}

const EnhancedLoadingIndicator: React.FC<EnhancedLoadingIndicatorProps> = ({
  theme = 'dark',
  message = 'Shield AI is thinking...',
  showProgress = true,
  variant = 'default'
}) => {
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const phases = [
    'Analyzing your question...',
    'Searching Scripture...',
    'Formulating response...',
    'Preparing answer...'
  ];

  const icons = {
    default: Shield,
    thinking: Brain,
    analyzing: Sparkles,
    writing: BookOpen
  };

  const IconComponent = icons[variant];

  useEffect(() => {
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + Math.random() * 15;
      });
    }, 800);

    // Phase transitions
    const phaseInterval = setInterval(() => {
      setCurrentPhase(prev => (prev + 1) % phases.length);
    }, 2000);

    // Typing indicator
    const typingInterval = setInterval(() => {
      setIsTyping(prev => !prev);
    }, 500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(phaseInterval);
      clearInterval(typingInterval);
    };
  }, [phases.length]);

  const getProgressColor = () => {
    if (progress < 30) return theme === 'dark' ? 'bg-red-500' : 'bg-red-600';
    if (progress < 70) return theme === 'dark' ? 'bg-yellow-500' : 'bg-yellow-600';
    return theme === 'dark' ? 'bg-green-500' : 'bg-green-600';
  };

  return (
    <div className="flex justify-start fade-in-up duration-300 w-full">
      <div className={`w-full px-6 py-4 ${theme === 'dark' ? 'text-shield-white' : 'text-gray-900'}`}>
        <div className="flex items-start space-x-4">
          {/* Enhanced Icon */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 ${
            theme === 'dark' ? 'bg-shield-blue/20' : 'bg-blue-100'
          }`}>
            <IconComponent 
              className={`w-6 h-6 ${theme === 'dark' ? 'text-shield-blue' : 'text-blue-600'} animate-pulse`} 
            />
          </div>

          <div className="flex-1 pt-1">
            {/* Phase Indicator */}
            <div className="flex items-center space-x-2 mb-3">
              <div className={`text-sm font-medium ${
                theme === 'dark' ? 'text-shield-white' : 'text-gray-900'
              }`}>
                {phases[currentPhase]}
              </div>
              <div className="flex space-x-1">
                <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-shield-blue' : 'bg-blue-600'} loading-dot loading-state-1`}></div>
                <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-shield-blue' : 'bg-blue-600'} loading-dot loading-state-2`}></div>
                <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-shield-blue' : 'bg-blue-600'} loading-dot loading-state-3`}></div>
              </div>
            </div>

            {/* Progress Bar */}
            {showProgress && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Processing...
                  </span>
                  <span className={`text-xs font-medium ${theme === 'dark' ? 'text-shield-blue' : 'text-blue-600'}`}>
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <div 
                    className={`h-full rounded-full enhanced-progress transition-all duration-500 ease-out`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Enhanced Loading Animation */}
            <div className="space-y-2 mb-3">
              <div className={`h-2 rounded animate-pulse ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              }`} style={{ width: '85%' }}></div>
              <div className={`h-2 rounded animate-pulse ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              }`} style={{ width: '70%' }}></div>
              <div className={`h-2 rounded animate-pulse ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              }`} style={{ width: '55%' }}></div>
            </div>

            {/* Status Message */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full pulse-glow ${
                theme === 'dark' ? 'bg-shield-blue' : 'bg-blue-600'
              }`}></div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {message}
                <span className={`ml-1 ${isTyping ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
                  |
                </span>
              </p>
            </div>

            {/* Additional Info */}
            <div className="mt-3 pt-3 border-t border-gray-700/30 dark:border-gray-200/30">
              <div className="flex items-center space-x-4 text-xs">
                <div className={`flex items-center space-x-1 ${
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  <Brain className="w-3 h-3" />
                  <span>AI Processing</span>
                </div>
                <div className={`flex items-center space-x-1 ${
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  <BookOpen className="w-3 h-3" />
                  <span>Scripture Search</span>
                </div>
                <div className={`flex items-center space-x-1 ${
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  <Heart className="w-3 h-3" />
                  <span>Faith Building</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLoadingIndicator;
