import React, { useRef, useEffect } from 'react';
import { Copy, Share, ThumbsUp, ThumbsDown, RotateCcw, Reply } from 'lucide-react';
import { createMessageGestures } from '../lib/gesture-service';

interface MobileMessageProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
  };
  index: number;
  theme: 'light' | 'dark';
  user?: any;
  onCopy: () => void;
  onShare: () => void;
  onFeedback: (type: 'positive' | 'negative') => void;
  onRegenerate: () => void;
  onReply: () => void;
}

const MobileMessage: React.FC<MobileMessageProps> = ({
  message,
  index,
  theme,
  user,
  onCopy,
  onShare,
  onFeedback,
  onRegenerate,
  onReply
}) => {
  const messageRef = useRef<HTMLDivElement>(null);
  const gestureService = useRef<any>(null);

  useEffect(() => {
    if (messageRef.current) {
      gestureService.current = createMessageGestures(
        `message-${index}`,
        undefined, // onDelete - not implemented yet
        onReply,
        onCopy
      );
      gestureService.current.attach(messageRef.current);
    }

    return () => {
      if (messageRef.current && gestureService.current) {
        gestureService.current.detach(messageRef.current);
      }
    };
  }, [index, onCopy, onReply]);

  return (
    <div
      ref={messageRef}
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300 min-w-0`}
    >
      <div
        className={`max-w-xs sm:max-w-md lg:max-w-2xl px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-lg min-w-0 message-bubble-mobile ${
          message.role === 'user' 
            ? theme === 'dark'
              ? 'bg-shield-blue/20 border border-shield-blue/30 text-shield-white'
              : 'bg-blue-100 border border-blue-200 text-gray-900'
            : theme === 'dark'
              ? 'bg-transparent border border-gray-700/30 text-shield-white'
              : 'bg-transparent border border-gray-200 text-gray-900'
        }`}
      >
        <div className="flex items-start space-x-2 sm:space-x-3">
          {message.role === 'assistant' && (
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 shadow-lg ${
              theme === 'dark' ? 'bg-shield-blue' : 'bg-blue-600'
            }`}>
              <img src="/logo.png" alt="Shield AI" className="w-6 h-6 sm:w-8 sm:h-8 rounded" />
            </div>
          )}
          {message.role === 'user' && (
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-lg ${
              theme === 'dark'
                ? 'bg-shield-blue/20 border border-shield-blue/30'
                : 'bg-blue-100 border border-blue-200'
            }`}>
              {user?.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="User" 
                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
                />
              ) : (
                <span className={`font-bold text-xs sm:text-sm ${
                  theme === 'dark' ? 'text-shield-blue' : 'text-blue-600'
                }`}>
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className={`leading-relaxed text-sm sm:text-base break-words ${
              theme === 'dark' ? 'text-shield-white' : 'text-gray-900'
            }`}>{message.content}</p>
            <p className={`text-xs mt-2 opacity-60 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {message.timestamp && new Date(message.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
        
        {/* Mobile-optimized message actions for AI responses */}
        {message.role === 'assistant' && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <button
                onClick={onCopy}
                className={`p-2 rounded-lg transition-all duration-200 touch-button ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-shield-white hover:bg-shield-gray/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                title="Copy message"
              >
                <Copy size={16} />
              </button>
              <button
                onClick={onShare}
                className={`p-2 rounded-lg transition-all duration-200 touch-button ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-shield-white hover:bg-shield-gray/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                title="Share message"
              >
                <Share size={16} />
              </button>
              <button
                onClick={onReply}
                className={`p-2 rounded-lg transition-all duration-200 touch-button ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-shield-white hover:bg-shield-gray/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                title="Reply to message"
              >
                <Reply size={16} />
              </button>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onFeedback('positive')}
                className={`p-2 rounded-lg transition-all duration-200 touch-button ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-green-400 hover:bg-shield-gray/50'
                    : 'text-gray-500 hover:text-green-600 hover:bg-gray-100'
                }`}
                title="Positive feedback"
              >
                <ThumbsUp size={16} />
              </button>
              <button
                onClick={() => onFeedback('negative')}
                className={`p-2 rounded-lg transition-all duration-200 touch-button ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-red-400 hover:bg-shield-gray/50'
                    : 'text-gray-500 hover:text-red-600 hover:bg-gray-100'
                }`}
                title="Negative feedback"
              >
                <ThumbsDown size={16} />
              </button>
              <button
                onClick={onRegenerate}
                className={`p-2 rounded-lg transition-all duration-200 touch-button ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-shield-blue hover:bg-shield-gray/50'
                    : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'
                }`}
                title="Regenerate response"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileMessage; 