import React, { useState } from 'react';
import { useMessageInteractions } from '../../../hooks/useConversationTracking';
import { Copy, Share2, Bookmark, ThumbsUp, ThumbsDown, Shield, Send } from 'lucide-react';

interface EnhancedMessageProps {
  message: {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    created_at: string;
    metadata?: {
      user_interactions?: {
        was_copied?: boolean;
        was_shared?: boolean;
        was_bookmarked?: boolean;
        was_rated?: boolean;
        rating?: number;
        feedback?: string;
        reaction?: string;
      };
    };
  };
  onFeedback?: (messageId: string, feedback: string) => void;
}

export function EnhancedMessage({ message, onFeedback }: EnhancedMessageProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [hovered, setHovered] = useState(false);
  
  const {
    copyMessage,
    shareMessage,
    bookmarkMessage,
    rateMessage,
    provideFeedback,
    reactToMessage,
    isTracking,
    error
  } = useMessageInteractions(message.id);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      await copyMessage();
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'ShieldAI Message',
          text: message.content,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(message.content);
      }
      await shareMessage();
    } catch (err) {
      console.error('Failed to share message:', err);
    }
  };

  const handleBookmark = async () => {
    await bookmarkMessage();
  };

  const handleRate = async (rating: number) => {
    setSelectedRating(rating);
    await rateMessage(rating);
  };

  const handleReaction = async (reaction: 'helpful' | 'not_helpful' | 'confusing' | 'excellent') => {
    await reactToMessage(reaction);
  };

  const handleFeedbackSubmit = async () => {
    if (feedbackText.trim()) {
      await provideFeedback(feedbackText);
      setFeedbackText('');
      setShowFeedback(false);
      onFeedback?.(message.id, feedbackText);
    }
  };

  const isUserMessage = message.role === 'user';
  const interactions = message.metadata?.user_interactions;

  return (
    <div 
      className={`enhanced-message-wrapper ${isUserMessage ? 'user' : 'assistant'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Icon */}
      <div className="message-icon">
        {isUserMessage ? (
          <div className="user-icon-circle">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 8C9.65685 8 11 6.65685 11 5C11 3.34315 9.65685 2 8 2C6.34315 2 5 3.34315 5 5C5 6.65685 6.34315 8 8 8Z" fill="currentColor"/>
              <path d="M8 9C5.79086 9 4 10.7909 4 13H12C12 10.7909 10.2091 9 8 9Z" fill="currentColor"/>
            </svg>
          </div>
        ) : (
          <div className="ai-icon-circle">
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
        )}
      </div>

      {/* Message Bubble */}
      <div className={`message-bubble ${isUserMessage ? 'user-bubble' : 'assistant-bubble'}`}>
        {/* Message Content */}
        <div className="message-content">
          <div className="message-text whitespace-pre-wrap break-words">
            {message.content}
          </div>
        </div>
        
        {/* Enhanced Actions - Only for AI messages */}
        {!isUserMessage && (
          <div className={`message-actions ${hovered ? 'visible' : ''}`}>
            {/* Actions Row - Compact with ratings and feedback inline */}
            <div className="actions-row-compact">
              {/* Left Side: Action Buttons */}
              <div className="quick-actions-row">
                <button
                  onClick={handleCopy}
                  disabled={isTracking}
                  className={`quick-action-btn ${interactions?.was_copied ? 'active' : ''}`}
                  title="Copy"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                
                <button
                  onClick={handleShare}
                  disabled={isTracking}
                  className={`quick-action-btn ${interactions?.was_shared ? 'active' : ''}`}
                  title="Share"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
                
                <button
                  onClick={handleBookmark}
                  disabled={isTracking}
                  className={`quick-action-btn ${interactions?.was_bookmarked ? 'active' : ''}`}
                  title="Bookmark"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                </button>

                <div className="divider"></div>

                <button
                  onClick={() => handleReaction('helpful')}
                  disabled={isTracking}
                  className={`quick-action-btn ${interactions?.reaction === 'helpful' ? 'active' : ''}`}
                  title="Helpful"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleReaction('not_helpful')}
                  disabled={isTracking}
                  className={`quick-action-btn ${interactions?.reaction === 'not_helpful' ? 'active' : ''}`}
                  title="Not helpful"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Right Side: Rating and Feedback */}
              <div className="secondary-actions-row">
                {/* Rating Section - Inline */}
                {(!interactions?.was_rated || interactions.rating === undefined) && (
                  <div className="rating-section-inline">
                    <span className="rating-label-inline">Rate:</span>
                    <div className="rating-stars-inline">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRate(star)}
                          disabled={isTracking}
                          className={`star-btn-inline ${selectedRating && star <= selectedRating ? 'filled' : ''}`}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill={selectedRating && star <= selectedRating ? 'currentColor' : 'none'} stroke="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback Button - Inline */}
                <button
                  onClick={() => setShowFeedback(!showFeedback)}
                  className="feedback-toggle-btn-inline"
                >
                  <span>Feedback</span>
                </button>
              </div>
            </div>

            {/* Feedback Form - Expandable */}
            {showFeedback && (
              <div className="feedback-form-compact">
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="feedback-textarea-compact"
                  rows={2}
                />
                <div className="feedback-actions-compact">
                  <button
                    onClick={handleFeedbackSubmit}
                    disabled={isTracking || !feedbackText.trim()}
                    className="submit-feedback-btn-compact"
                  >
                    <Send className="w-3.5 h-3.5 mr-1" />
                    Send
                  </button>
                  <button
                    onClick={() => setShowFeedback(false)}
                    className="cancel-feedback-btn-compact"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="error-message-compact">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Professional CSS styles matching ChatGPT/Claude design
const styles = `
.enhanced-message-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  position: relative;
  width: 100%;
}

.enhanced-message-wrapper.user {
  flex-direction: row-reverse;
  justify-content: flex-end;
}

.enhanced-message-wrapper.assistant {
  flex-direction: row;
  justify-content: flex-start;
}

.message-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.25rem;
}

.user-icon-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: rgba(59, 130, 246, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.9);
}

.ai-icon-circle {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #60A5FA;
}

.message-bubble {
  position: relative;
  max-width: 85%;
  padding: 0.875rem 1rem;
  border-radius: 1rem;
  word-wrap: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.user-bubble {
  background: rgba(59, 130, 246, 0.95);
  color: #ffffff;
  border-bottom-right-radius: 0.25rem;
  margin-left: auto;
}

.user-bubble::after {
  content: '';
  position: absolute;
  right: -8px;
  bottom: 12px;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 8px 8px 0;
  border-color: transparent rgba(59, 130, 246, 0.95) transparent transparent;
}

.assistant-bubble {
  background: transparent;
  backdrop-filter: none;
  color: #E0E0E0;
  border: none;
  padding: 0.5rem 0;
  box-shadow: none;
}

.assistant-bubble::before {
  display: none;
}

.message-content {
  margin-bottom: 0.5rem;
}

.message-text {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: inherit;
}

/* Actions - Compact and Professional */
.message-actions {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.message-actions.visible {
  opacity: 1;
}

.actions-row-compact {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.quick-actions-row {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.secondary-actions-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.quick-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.15s ease;
}

.quick-action-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.95);
}

.quick-action-btn.active {
  background: rgba(59, 130, 246, 0.3);
  color: #60A5FA;
}

.quick-action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.quick-action-btn svg {
  width: 14px;
  height: 14px;
}

.divider {
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.15);
  margin: 0 0.25rem;
}

.rating-section-inline {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.rating-label-inline {
  font-size: 0.6875rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.rating-stars-inline {
  display: flex;
  gap: 0.125rem;
}

.star-btn-inline {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.125rem;
  color: rgba(255, 255, 255, 0.4);
  transition: color 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.star-btn-inline:hover {
  color: rgba(255, 193, 7, 0.8);
}

.star-btn-inline.filled {
  color: #FFC107;
}

.star-btn-inline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.feedback-toggle-btn-inline {
  display: flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.6875rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.feedback-toggle-btn-inline:hover {
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.9);
}

.feedback-form-compact {
  margin-top: 0.625rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.feedback-textarea-compact {
  width: 100%;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #E0E0E0;
  font-size: 0.8125rem;
  resize: vertical;
  font-family: inherit;
  margin-bottom: 0.5rem;
}

.feedback-textarea-compact:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(255, 255, 255, 0.08);
}

.feedback-textarea-compact::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.feedback-actions-compact {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.submit-feedback-btn-compact {
  display: flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  background: rgba(59, 130, 246, 0.8);
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.submit-feedback-btn-compact:hover:not(:disabled) {
  background: rgba(59, 130, 246, 1);
}

.submit-feedback-btn-compact:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-feedback-btn-compact {
  padding: 0.375rem 0.75rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.cancel-feedback-btn-compact:hover {
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.9);
}

.error-message-compact {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  color: #FCA5A5;
  font-size: 0.75rem;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  styleSheet.setAttribute('data-enhanced-message-styles', 'true');
  if (!document.querySelector('style[data-enhanced-message-styles="true"]')) {
    document.head.appendChild(styleSheet);
  }
}
