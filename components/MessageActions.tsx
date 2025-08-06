import React, { useState } from 'react';
import { Copy, Share2, RefreshCw, ThumbsUp, ThumbsDown, MoreHorizontal, Check, BookOpen, MessageSquare, Download, Edit, Volume2 } from 'lucide-react';

interface MessageActionsProps {
  messageId: string;
  content: string;
  conversationId?: string;
  onRegenerate: () => Promise<void>;
  onCopy: () => void;
  onShare: () => void;
  onFeedback: (type: 'positive' | 'negative') => Promise<void>;
  onEdit?: () => void;
  onQuote?: () => void;
  onSpeech?: () => void;
  onExport?: () => void;
  theme?: 'light' | 'dark';
  showExtendedActions?: boolean;
}

const MessageActions: React.FC<MessageActionsProps> = ({ 
  messageId, 
  content, 
  conversationId, 
  onRegenerate, 
  onCopy, 
  onShare, 
  onFeedback,
  onEdit,
  onQuote,
  onSpeech,
  onExport,
  theme = 'dark',
  showExtendedActions = false
}) => {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'positive' | 'negative' | null>(null);
  const [copied, setCopied] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      onCopy();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = () => {
    if (conversationId) {
      const url = `${window.location.origin}/chat/${conversationId}`;
      navigator.clipboard.writeText(url);
      onShare();
    }
  };

  const handleSpeech = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(content);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
      }
    }
    onSpeech?.();
  };

  const handleExport = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `message-${messageId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onExport?.();
  };

  return (
    <div className={`mt-3 pt-3 border-t ${
      theme === 'dark' ? 'border-gray-700/30' : 'border-gray-200'
    }`}>
      {/* Main actions row */}
      <div className="flex items-center justify-between">
        {/* Left side - Feedback */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleFeedback('positive')}
            disabled={feedbackGiven !== null}
            className={`p-1.5 rounded-lg transition-all duration-200 group ${
              feedbackGiven === 'positive'
                ? theme === 'dark' ? 'text-green-400 bg-green-400/10' : 'text-green-600 bg-green-50'
                : theme === 'dark'
                  ? 'text-gray-400 hover:text-green-400 hover:bg-green-400/10'
                  : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
            }`}
            title="Good response"
          >
            <ThumbsUp size={14} className="transition-transform group-hover:scale-110" />
          </button>
          <button
            onClick={() => handleFeedback('negative')}
            disabled={feedbackGiven !== null}
            className={`p-1.5 rounded-lg transition-all duration-200 group ${
              feedbackGiven === 'negative'
                ? theme === 'dark' ? 'text-red-400 bg-red-400/10' : 'text-red-600 bg-red-50'
                : theme === 'dark'
                  ? 'text-gray-400 hover:text-red-400 hover:bg-red-400/10'
                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
            }`}
            title="Poor response"
          >
            <ThumbsDown size={14} className="transition-transform group-hover:scale-110" />
          </button>
        </div>

        {/* Right side - Primary Actions */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handleCopy}
            className={`p-1.5 rounded-lg transition-all duration-200 group ${
              copied
                ? theme === 'dark' ? 'text-green-400 bg-green-400/10' : 'text-green-600 bg-green-50'
                : theme === 'dark'
                  ? 'text-gray-400 hover:text-shield-white hover:bg-shield-light-gray/50'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title={copied ? 'Copied!' : 'Copy message'}
          >
            {copied ? (
              <Check size={14} className="text-green-500" />
            ) : (
              <Copy size={14} className="transition-transform group-hover:scale-110" />
            )}
          </button>

          {/* Text-to-speech */}
          <button
            onClick={handleSpeech}
            className={`p-1.5 rounded-lg transition-all duration-200 group ${
              isSpeaking
                ? theme === 'dark' ? 'text-blue-400 bg-blue-400/10' : 'text-blue-600 bg-blue-50'
                : theme === 'dark'
                  ? 'text-gray-400 hover:text-shield-white hover:bg-shield-light-gray/50'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title={isSpeaking ? 'Stop speech' : 'Read aloud'}
          >
            <Volume2 size={14} className={`transition-transform group-hover:scale-110 ${isSpeaking ? 'animate-pulse' : ''}`} />
          </button>

          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className={`p-1.5 rounded-lg transition-all duration-200 group ${
              isRegenerating
                ? theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                : theme === 'dark'
                  ? 'text-gray-400 hover:text-shield-blue hover:bg-shield-blue/10'
                  : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title="Regenerate response"
          >
            <RefreshCw size={14} className={`transition-transform group-hover:scale-110 ${isRegenerating ? 'animate-spin' : ''}`} />
          </button>

          {/* More actions toggle */}
          <button
            onClick={() => setShowMoreActions(!showMoreActions)}
            className={`p-1.5 rounded-lg transition-all duration-200 group ${
              showMoreActions
                ? theme === 'dark' ? 'text-shield-blue bg-shield-blue/10' : 'text-blue-600 bg-blue-50'
                : theme === 'dark'
                  ? 'text-gray-400 hover:text-shield-white hover:bg-shield-light-gray/50'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="More actions"
          >
            <MoreHorizontal size={14} className="transition-transform group-hover:scale-110" />
          </button>
        </div>
      </div>

      {/* Extended actions (collapsible) */}
      {showMoreActions && (
        <div className={`mt-3 pt-3 border-t flex flex-wrap gap-2 ${
          theme === 'dark' ? 'border-gray-700/30' : 'border-gray-200'
        }`}>
          {onEdit && (
            <button
              onClick={onEdit}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-200 ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 border border-gray-700'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 border border-gray-200'
              }`}
              title="Edit message"
            >
              <Edit size={12} />
              <span>Edit</span>
            </button>
          )}

          {onQuote && (
            <button
              onClick={onQuote}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-200 ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 border border-gray-700'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 border border-gray-200'
              }`}
              title="Quote message"
            >
              <MessageSquare size={12} />
              <span>Quote</span>
            </button>
          )}

          <button
            onClick={handleExport}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-200 ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 border border-gray-700'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 border border-gray-200'
            }`}
            title="Export message"
          >
            <Download size={12} />
            <span>Export</span>
          </button>

          {conversationId && (
            <button
              onClick={handleShare}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-200 ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 border border-gray-700'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 border border-gray-200'
              }`}
              title="Share conversation"
            >
              <Share2 size={12} />
              <span>Share</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageActions; 