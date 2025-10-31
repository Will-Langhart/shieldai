import { useCallback, useState } from 'react';

interface UserInteraction {
  type: 'copy' | 'share' | 'bookmark' | 'rate' | 'feedback' | 'reaction';
  data?: any;
}

interface UseConversationTrackingReturn {
  trackInteraction: (messageId: string, interaction: UserInteraction) => Promise<void>;
  isTracking: boolean;
  error: string | null;
}

export function useConversationTracking(): UseConversationTrackingReturn {
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trackInteraction = useCallback(async (messageId: string, interaction: UserInteraction) => {
    setIsTracking(true);
    setError(null);

    try {
      const response = await fetch('/api/conversations/track-interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          interaction
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to track interaction');
      }

      const result = await response.json();
      console.log('Interaction tracked:', result);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to track interaction';
      setError(errorMessage);
      console.error('Error tracking interaction:', err);
    } finally {
      setIsTracking(false);
    }
  }, []);

  return {
    trackInteraction,
    isTracking,
    error
  };
}

// Specific interaction hooks for common use cases
export function useMessageInteractions(messageId: string) {
  const { trackInteraction, isTracking, error } = useConversationTracking();

  const copyMessage = useCallback(async () => {
    await trackInteraction(messageId, { type: 'copy' });
  }, [messageId, trackInteraction]);

  const shareMessage = useCallback(async () => {
    await trackInteraction(messageId, { type: 'share' });
  }, [messageId, trackInteraction]);

  const bookmarkMessage = useCallback(async () => {
    await trackInteraction(messageId, { type: 'bookmark' });
  }, [messageId, trackInteraction]);

  const rateMessage = useCallback(async (rating: number) => {
    await trackInteraction(messageId, { 
      type: 'rate', 
      data: { rating } 
    });
  }, [messageId, trackInteraction]);

  const provideFeedback = useCallback(async (feedback: string) => {
    await trackInteraction(messageId, { 
      type: 'feedback', 
      data: { feedback } 
    });
  }, [messageId, trackInteraction]);

  const reactToMessage = useCallback(async (reaction: 'helpful' | 'not_helpful' | 'confusing' | 'excellent') => {
    await trackInteraction(messageId, { 
      type: 'reaction', 
      data: { reaction } 
    });
  }, [messageId, trackInteraction]);

  return {
    copyMessage,
    shareMessage,
    bookmarkMessage,
    rateMessage,
    provideFeedback,
    reactToMessage,
    isTracking,
    error
  };
}
