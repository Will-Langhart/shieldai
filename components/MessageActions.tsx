import React, { useState } from 'react';
import { Copy, Share2, RefreshCw, ThumbsUp, ThumbsDown, MoreHorizontal } from 'lucide-react';

interface MessageActionsProps {
  messageId: string;
  content: string;
  conversationId?: string;
  onRegenerate: () => Promise<void>;
  onCopy: () => void;
  onShare: () => void;
  onFeedback: (type: 'positive' | 'negative') => Promise<void>;
  theme?: 'light' | 'dark';
}

const MessageActions: React.FC<MessageActionsProps> = ({ 
  messageId, 
  content, 
  conversationId, 
  onRegenerate, 
  onCopy, 
  onShare, 
  onFeedback,
  theme = 'dark'
}) => {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'positive' | 'negative' | null>(null);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerate();
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleFeedback = async (type: 'positive' | 'negative') => {
    if (feedbackGiven === type) return; // Prevent duplicate feedback
    
    setFeedbackGiven(type);
    try {
      await onFeedback(type);
    } catch (error) {
      setFeedbackGiven(null); // Reset on error
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    onCopy();
  };

  const handleShare = () => {
    if (conversationId) {
      const url = `${window.location.origin}/chat/${conversationId}`;
      navigator.clipboard.writeText(url);
      onShare();
    }
  };

  return (
    <div className={`flex items-center justify-between mt-3 pt-3 border-t ${
      theme === 'dark' ? 'border-gray-700/30' : 'border-gray-200'
    }`}>
      {/* Left side - Feedback */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => handleFeedback('positive')}
          disabled={feedbackGiven !== null}
          className={`p-1.5 rounded transition-all duration-200 ${
            feedbackGiven === 'positive'
              ? theme === 'dark' ? 'text-green-400 bg-green-400/10' : 'text-green-600 bg-green-50'
              : theme === 'dark'
                ? 'text-gray-400 hover:text-green-400 hover:bg-green-400/10'
                : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
          }`}
          title="Good response"
        >
          <ThumbsUp size={14} />
        </button>
        <button
          onClick={() => handleFeedback('negative')}
          disabled={feedbackGiven !== null}
          className={`p-1.5 rounded transition-all duration-200 ${
            feedbackGiven === 'negative'
              ? theme === 'dark' ? 'text-red-400 bg-red-400/10' : 'text-red-600 bg-red-50'
              : theme === 'dark'
                ? 'text-gray-400 hover:text-red-400 hover:bg-red-400/10'
                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
          }`}
          title="Poor response"
        >
          <ThumbsDown size={14} />
        </button>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center space-x-1">
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className={`p-1.5 rounded transition-all duration-200 ${
            isRegenerating
              ? theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              : theme === 'dark'
                ? 'text-gray-400 hover:text-shield-blue hover:bg-shield-blue/10'
                : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
          }`}
          title="Regenerate response"
        >
          <RefreshCw size={14} className={isRegenerating ? 'animate-spin' : ''} />
        </button>
        <button
          onClick={handleCopy}
          className={`p-1.5 rounded transition-all duration-200 ${
            theme === 'dark'
              ? 'text-gray-400 hover:text-shield-white hover:bg-shield-light-gray/50'
              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
          }`}
          title="Copy message"
        >
          <Copy size={14} />
        </button>
        {conversationId && (
          <button
            onClick={handleShare}
            className={`p-1.5 rounded transition-all duration-200 ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-shield-white hover:bg-shield-light-gray/50'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="Share conversation"
          >
            <Share2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageActions; 