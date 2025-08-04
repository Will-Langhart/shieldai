import React, { useState } from 'react';
import { RotateCcw, Copy, Share2, ThumbsUp, ThumbsDown, MoreHorizontal } from 'lucide-react';

interface MessageActionsProps {
  messageId: string;
  content: string;
  conversationId?: string;
  onRegenerate?: () => void;
  onCopy?: () => void;
  onShare?: () => void;
  onFeedback?: (type: 'positive' | 'negative') => void;
}

export default function MessageActions({
  messageId,
  content,
  conversationId,
  onRegenerate,
  onCopy,
  onShare,
  onFeedback
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = conversationId 
        ? `${window.location.origin}/chat/${conversationId}`
        : window.location.href;
      
      await navigator.clipboard.writeText(shareUrl);
      onShare?.();
    } catch (error) {
      console.error('Failed to copy share link:', error);
    }
  };

  const handleFeedback = (type: 'positive' | 'negative') => {
    setFeedback(type);
    onFeedback?.(type);
  };

  return (
    <div className="flex items-center space-x-2 mt-2 ml-2">
      {/* Regenerate Button */}
      <button
        onClick={onRegenerate}
        className="p-2 text-gray-400 hover:text-shield-white transition-colors rounded-full hover:bg-gray-700/50"
        title="Regenerate response"
      >
        <RotateCcw size={16} />
      </button>

      {/* Copy Button */}
      <button
        onClick={handleCopy}
        className="p-2 text-gray-400 hover:text-shield-white transition-colors rounded-full hover:bg-gray-700/50"
        title={copied ? "Copied!" : "Copy message"}
      >
        <Copy size={16} />
      </button>

      {/* Share Link Button */}
      <button
        onClick={handleShare}
        className="p-2 text-gray-400 hover:text-shield-white transition-colors rounded-full hover:bg-gray-700/50"
        title="Copy share link"
      >
        <Share2 size={16} />
      </button>

      {/* Thumbs Up Button */}
      <button
        onClick={() => handleFeedback('positive')}
        className={`p-2 transition-colors rounded-full hover:bg-gray-700/50 ${
          feedback === 'positive' 
            ? 'text-green-400 hover:text-green-300' 
            : 'text-gray-400 hover:text-shield-white'
        }`}
        title="Loves this"
      >
        <ThumbsUp size={16} />
      </button>

      {/* Thumbs Down Button */}
      <button
        onClick={() => handleFeedback('negative')}
        className={`p-2 transition-colors rounded-full hover:bg-gray-700/50 ${
          feedback === 'negative' 
            ? 'text-red-400 hover:text-red-300' 
            : 'text-gray-400 hover:text-shield-white'
        }`}
        title="Needs improvement"
      >
        <ThumbsDown size={16} />
      </button>

      {/* More Options Button */}
      <button
        className="p-2 text-gray-400 hover:text-shield-white transition-colors rounded-full hover:bg-gray-700/50"
        title="More options"
      >
        <MoreHorizontal size={16} />
      </button>
    </div>
  );
} 