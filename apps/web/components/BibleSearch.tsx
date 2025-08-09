import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Filter, X, Loader2 } from 'lucide-react';
import BibleVerse from './BibleVerse';
import { useAuth } from '../lib/auth-context';

interface BibleSearchResult {
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

interface BibleSearchProps {
  onVerseSelect?: (reference: string, text: string) => void;
  onAddNote?: (reference: string, text: string) => void;
  className?: string;
}

export default function BibleSearch({ onVerseSelect, onAddNote, className = '' }: BibleSearchProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BibleSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState('de4e12af7f28f599-02'); // Default NIV
  const [showFilters, setShowFilters] = useState(false);
  const [popularVerses, setPopularVerses] = useState<any[]>([]);
  const [showPopular, setShowPopular] = useState(true);

  // Popular topics for quick search
  const popularTopics = [
    'salvation', 'faith', 'love', 'hope', 'wisdom', 
    'prayer', 'grace', 'mercy', 'forgiveness', 'witness'
  ];

  useEffect(() => {
    loadPopularVerses();
  }, []);

  const loadPopularVerses = async () => {
    try {
      const response = await fetch('/api/bible/popular');
      const data = await response.json();
      setPopularVerses(data.verses || []);
    } catch (error) {
      console.error('Error loading popular verses:', error);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        query: query,
        versionId: selectedVersion
      });

      // Add user ID if authenticated
      if (user?.id) {
        params.append('userId', user.id);
      }

      const response = await fetch(`/api/bible/search?${params}`);
      const data = await response.json();
      setSearchResults(data);
      setShowPopular(false);
    } catch (error) {
      console.error('Error searching Bible:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSearch = (topic: string) => {
    setSearchQuery(topic);
    handleSearch(topic);
  };

  const handleVerseSelect = (reference: string, text: string) => {
    if (onVerseSelect) {
      onVerseSelect(reference, text);
    }
  };

  const handleAddNote = (reference: string, text: string) => {
    if (onAddNote) {
      onAddNote(reference, text);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setShowPopular(true);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Search Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 mb-4">
          <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Bible Search
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="ml-auto p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Search filters"
          >
            <Filter className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
            placeholder="Search for verses, topics, or references..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-750 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bible Version
            </label>
            <select
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="de4e12af7f28f599-02">NIV (New International Version)</option>
              <option value="65eec8e0b60e656b-01">KJV (King James Version)</option>
              <option value="f421fe261da7624f-01">ESV (English Standard Version)</option>
              <option value="9879dbb7cfe39e4d-01">NLT (New Living Translation)</option>
            </select>
          </div>
        )}

        {/* Quick Search Topics */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quick Search Topics
          </h4>
          <div className="flex flex-wrap gap-2">
            {popularTopics.map((topic) => (
              <button
                key={topic}
                onClick={() => handleQuickSearch(topic)}
                className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors capitalize"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Searching...</span>
          </div>
        )}

        {/* Popular Verses */}
        {showPopular && !isLoading && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Popular Verses
            </h4>
                         <div className="space-y-3">
               {popularVerses && popularVerses.slice(0, 5).map((verse, index) => (
                 <BibleVerse
                   key={index}
                   reference={verse.reference}
                   text={verse.text}
                   version={verse.version?.name}
                   onSelect={handleVerseSelect}
                   showActions={false}
                 />
               ))}
             </div>
          </div>
        )}

        {/* Search Results */}
        {searchResults && !isLoading && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Search Results ({searchResults.total} found)
              </h4>
              <button
                onClick={() => setShowPopular(true)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Show Popular Verses
              </button>
            </div>
            
                                           {searchResults.passages && searchResults.passages.length > 0 ? (
                    <div className="space-y-3">
                      {searchResults.passages.map((passage, index) => (
                        <BibleVerse
                          key={index}
                          reference={passage.reference}
                          text={passage.text}
                          version={passage.version?.name}
                          onSelect={handleVerseSelect}
                          onAddNote={handleAddNote}
                        />
                      ))}
                    </div>
                  ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No verses found for "{searchResults.query}"</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 