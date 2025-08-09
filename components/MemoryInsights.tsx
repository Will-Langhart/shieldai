import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';

interface MemoryStats {
  totalMemories: number;
  totalConversations: number;
  averageRelevance: number;
  topTopics: string[];
}

interface MemorySearchResult {
  content: string;
  role: string;
  conversationId: string;
  score: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface MemoryInsightsProps {
  conversationId?: string;
  onMemorySelect?: (memory: MemorySearchResult) => void;
  className?: string;
}

export default function MemoryInsights({ 
  conversationId, 
  onMemorySelect, 
  className = '' 
}: MemoryInsightsProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MemorySearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (user) {
      loadMemoryStats();
    }
  }, [user]);

  const loadMemoryStats = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const sessionToken = session?.access_token;

      const response = await fetch('/api/memory/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      } else {
        console.error('Failed to load memory stats');
      }
    } catch (error) {
      console.error('Error loading memory stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchMemories = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const { data: { session } } = await supabase.auth.getSession();
      const sessionToken = session?.access_token;

      const response = await fetch('/api/memory/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` }),
        },
        body: JSON.stringify({
          query: searchQuery,
          conversationId,
          topK: 10,
          minScore: 0.6,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.memories);
      } else {
        console.error('Failed to search memories');
      }
    } catch (error) {
      console.error('Error searching memories:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchMemories();
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-500';
    if (score >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Memory Insights
        </h3>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          {showSearch ? 'Hide Search' : 'Search Memories'}
        </button>
      </div>

      {/* Memory Statistics */}
      {stats && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Total Memories:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {stats.totalMemories}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Conversations:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {stats.totalConversations}
              </span>
            </div>
            {stats.topTopics.length > 0 && (
              <div className="col-span-2">
                <span className="text-gray-600 dark:text-gray-400">Key Topics:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {stats.topTopics.map((topic, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Memory Search */}
      {showSearch && (
        <div className="mb-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your conversation history..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </form>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((memory, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => onMemorySelect?.(memory)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      memory.role === 'user' 
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' 
                        : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    }`}>
                      {memory.role}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${getRelevanceColor(memory.score)}`}>
                        {(memory.score * 100).toFixed(0)}% match
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimestamp(memory.timestamp)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                    {memory.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {searchResults.length === 0 && isSearching && (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              Searching memories...
            </div>
          )}

          {searchResults.length === 0 && !isSearching && searchQuery && (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              No memories found matching your search.
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading memory insights...</p>
        </div>
      )}

      {/* No Data State */}
      {!isLoading && !stats && (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No memory data available yet.</p>
          <p className="text-xs mt-1">Start conversations to build your memory profile.</p>
        </div>
      )}
    </div>
  );
}

