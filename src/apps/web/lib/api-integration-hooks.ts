import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context';

// Types for API responses
export interface BibleSearchResult {
  query: string;
  total: number;
  passages: Array<{
    id: string;
    reference: string;
    text: string;
    version: {
      name: string;
    };
  }>;
}

export interface ChurchLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  website?: string;
  rating?: number;
  review_count?: number;
  photos?: string[];
  types: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  distance?: number;
  place_id: string;
}

export interface SubscriptionStatus {
  isInTrial: boolean;
  hasActiveSubscription: boolean;
  messageLimit: number;
  remainingMessages: number;
  currentTier?: string;
  subscriptionEndDate?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  mode?: 'fast' | 'accurate';
  conversationId?: string;
}

export interface Conversation {
  id: string;
  title: string;
  last_message: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Hook for Bible API integration
export function useBibleAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchBible = useCallback(async (query: string, versionId: string = 'de4e12af7f28f599-02'): Promise<BibleSearchResult | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        query: query,
        versionId: versionId
      });

      const response = await fetch(`/api/bible/search?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Bible search failed');
      }
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bible search failed';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPopularVerses = useCallback(async (): Promise<any[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/bible/popular');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load popular verses');
      }
      
      return data.verses || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load popular verses';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getDailyVerse = useCallback(async (): Promise<any | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/bible/daily-verse');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load daily verse');
      }
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load daily verse';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getVerseSuggestions = useCallback(async (context: string): Promise<any[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({ context });
      const response = await fetch(`/api/bible/suggestions?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get verse suggestions');
      }
      
      return data.suggestions || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get verse suggestions';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    searchBible,
    getPopularVerses,
    getDailyVerse,
    getVerseSuggestions,
    loading,
    error
  };
}

// Hook for Church Finder API integration
export function useChurchFinderAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findChurchesNearby = useCallback(async (
    latitude: number, 
    longitude: number, 
    radius: number = 5000,
    denomination?: string
  ): Promise<ChurchLocation[]> => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the improved ChurchFinderService that handles both server-side and client-side
      const { ChurchFinderService } = await import('./church-finder-service');
      const churches = await ChurchFinderService.findChurchesNearby({
        latitude,
        longitude,
        radius,
        denomination
      });
      
      return churches;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to find churches';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserLocation = useCallback((): Promise<{lat: number, lng: number} | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log('❌ Geolocation not supported by browser');
        resolve(null);
        return;
      }

      console.log('📍 Requesting user location...');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ Location obtained successfully:', position.coords);
          console.log(`📍 Coordinates: ${position.coords.latitude}, ${position.coords.longitude}`);
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('❌ Geolocation error:', error);
          switch (error.code) {
            case error.PERMISSION_DENIED:
              console.error('❌ Location permission denied by user');
              break;
            case error.POSITION_UNAVAILABLE:
              console.error('❌ Location information unavailable');
              break;
            case error.TIMEOUT:
              console.error('❌ Location request timed out');
              break;
            default:
              console.error('❌ Unknown geolocation error');
          }
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000, // Reduced timeout for faster response
          maximumAge: 60000 // 1 minute - more recent location
        }
      );
    });
  }, []);

  return {
    findChurchesNearby,
    getUserLocation,
    loading,
    error
  };
}

// Hook for Subscription API integration
export function useSubscriptionAPI() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);

  const loadSubscriptionStatus = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await import('./supabase').then(m => m.supabase.auth.getSession());
      const sessionToken = session?.access_token;

      const response = await fetch('/api/subscriptions/status', {
        headers: {
          ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus({
          isInTrial: data.isInTrial,
          hasActiveSubscription: data.hasActiveSubscription,
          messageLimit: data.subscription?.messageLimit || 0,
          remainingMessages: data.subscription?.remainingMessages || 0,
          currentTier: data.subscription?.tier,
          subscriptionEndDate: data.subscription?.endDate
        });
      } else {
        throw new Error('Failed to load subscription status');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load subscription status';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getSubscriptionPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/subscriptions/plans');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load subscription plans');
      }
      
      return data.plans || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load subscription plans';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createSubscription = useCallback(async (planName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planName }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription');
      }
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create subscription';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkFeatureAccess = useCallback(async (feature: string) => {
    if (!user) return { allowed: false };
    
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await import('./supabase').then(m => m.supabase.auth.getSession());
      const sessionToken = session?.access_token;

      const response = await fetch('/api/subscriptions/check-feature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` }),
        },
        body: JSON.stringify({ feature }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to check feature access');
      }
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check feature access';
      setError(errorMessage);
      return { allowed: false };
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Auto-load subscription status when user changes
  useEffect(() => {
    if (user) {
      loadSubscriptionStatus();
    }
  }, [user, loadSubscriptionStatus]);

  return {
    subscriptionStatus,
    loadSubscriptionStatus,
    getSubscriptionPlans,
    createSubscription,
    checkFeatureAccess,
    loading,
    error
  };
}

// Hook for Chat API integration
export function useChatAPI() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (
    message: string, 
    mode: 'fast' | 'accurate' = 'fast',
    conversationId?: string
  ): Promise<{ response: string; conversationId?: string } | null> => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await import('./supabase').then(m => m.supabase.auth.getSession());
      const token = session?.access_token;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message,
          conversationId,
          mode,
          developerMode: user?.email === 'langhartcw@gmail.com'
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return {
        response: data.response,
        conversationId: data.conversationId
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getConversations = useCallback(async (): Promise<Conversation[]> => {
    if (!user) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await import('./supabase').then(m => m.supabase.auth.getSession());
      const token = session?.access_token;

      const response = await fetch('/api/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load conversations');
      }
      
      return data.conversations || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversations';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getMessages = useCallback(async (conversationId: string): Promise<ChatMessage[]> => {
    if (!user) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await import('./supabase').then(m => m.supabase.auth.getSession());
      const token = session?.access_token;

      const response = await fetch(`/api/messages?conversationId=${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load messages');
      }
      
      return data.messages || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load messages';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    sendMessage,
    getConversations,
    getMessages,
    loading,
    error
  };
}

// Hook for Health Check API
export function useHealthCheck() {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test-api-integration');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Health check failed');
      }
      
      setHealthStatus(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Health check failed';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    healthStatus,
    checkHealth,
    loading,
    error
  };
}
