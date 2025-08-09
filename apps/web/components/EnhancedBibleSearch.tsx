import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Filter, X, Loader2, Star, Heart, Share2, Copy, Bookmark } from 'lucide-react';
import BibleVerse from './BibleVerse';
import { useBibleAPI } from '../lib/api-integration-hooks';
import { useAuth } from '../lib/auth-context';

interface EnhancedBibleSearchProps {
  onVerseSelect?: (reference: string, text: string) => void;
  onAddNote?: (reference: string, text: string) => void;
  className?: string;
  theme?: 'light' | 'dark';
}

export default function EnhancedBibleSearch({ 
  onVerseSelect, 
  onAddNote, 
  className = '',
  theme = 'dark'
}: EnhancedBibleSearchProps) {
  const { user } = useAuth();
  const { 
    searchBible, 
    getPopularVerses, 
    getDailyVerse, 
    getVerseSuggestions,
    loading, 
    error 
  } = useBibleAPI();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [selectedVersion, setSelectedVersion] = useState('de4e12af7f28f599-02');
  const [showFilters, setShowFilters] = useState(false);
  const [popularVerses, setPopularVerses] = useState<any[]>([]);
  const [dailyVerse, setDailyVerse] = useState<any>(null);
  const [showPopular, setShowPopular] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Popular topics for quick search
  const popularTopics = [
    'salvation', 'faith', 'love', 'hope', 'wisdom', 
    'prayer', 'grace', 'mercy', 'forgiveness', 'witness',
    'resurrection', 'creation', 'baptism', 'communion', 'worship'
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load popular verses and daily verse in parallel
      const [popularData, dailyData] = await Promise.all([
        getPopularVerses(),
        getDailyVerse()
      ]);
      
      setPopularVerses(popularData);
      setDailyVerse(dailyData);
      
      // Load favorites from localStorage
      const savedFavorites = localStorage.getItem('bible-favorites');
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
      
      // Load search history from localStorage
      const savedHistory = localStorage.getItem('bible-search-history');
      if (savedHistory) {
        setSearchHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    try {
      const results = await searchBible(query, selectedVersion);
      setSearchResults(results);
      setShowPopular(false);
      
      // Add to search history
      const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem('bible-search-history', JSON.stringify(newHistory));
      
      // Add user ID to search if authenticated
      if (user?.id) {
        try {
          await fetch('/api/bible/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              query, 
              versionId: selectedVersion,
              userId: user.id 
            })
          });
        } catch (error) {
          console.error('Error saving search history:', error);
        }
      }
    } catch (error) {
      console.error('Error searching Bible:', error);
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

  const handleFavorite = (reference: string) => {
    const newFavorites = favorites.includes(reference)
      ? favorites.filter(f => f !== reference)
      : [...favorites, reference];
    
    setFavorites(newFavorites);
    localStorage.setItem('bible-favorites', JSON.stringify(newFavorites));
  };

  const handleCopyVerse = async (reference: string, text: string) => {
    try {
      await navigator.clipboard.writeText(`${reference}: ${text}`);
      // Could add a toast notification here
    } catch (error) {
      console.error('Error copying verse:', error);
    }
  };

  const handleShareVerse = async (reference: string, text: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: reference,
          text: `${reference}: ${text}`,
          url: window.location.href
        });
      } else {
        // Fallback to copying
        await handleCopyVerse(reference, text);
      }
    } catch (error) {
      console.error('Error sharing verse:', error);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setShowPopular(true);
  };

  const getThemeClasses = () => {
    return theme === 'dark' 
      ? 'bg-shield-black text-shield-white border-shield-gray' 
      : 'bg-white text-gray-900 border-gray-200';
  };

  return (
    <div className={`${className} ${getThemeClasses()} rounded-2xl border backdrop-blur-xl`}>
      {/* Header */}
      <div className="p-6 border-b border-shield-gray">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-6 h-6 text-shield-blue" />
            <h2 className="text-xl font-bold">Bible Search</h2>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded-lg hover:bg-shield-gray transition-colors"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-shield-gray w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
            placeholder="Search Bible verses, topics, or references..."
            className="w-full pl-10 pr-4 py-3 bg-shield-gray rounded-xl border-0 focus:ring-2 focus:ring-shield-blue focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-shield-gray hover:text-shield-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-shield-gray rounded-xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Version</label>
                <select
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  className="w-full p-2 rounded-lg bg-shield-black border border-shield-gray focus:ring-2 focus:ring-shield-blue"
                >
                  <option value="de4e12af7f28f599-02">King James Version</option>
                  <option value="de4e12af7f28f599-01">New International Version</option>
                  <option value="de4e12af7f28f599-03">English Standard Version</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Search Type</label>
                <select className="w-full p-2 rounded-lg bg-shield-black border border-shield-gray focus:ring-2 focus:ring-shield-blue">
                  <option>All</option>
                  <option>Exact Match</option>
                  <option>Contains</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 max-h-96 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-shield-blue" />
            <span className="ml-2">Searching...</span>
          </div>
        )}

        {error && (
          <div className="text-red-400 text-center py-4">
            {error}
          </div>
        )}

        {/* Daily Verse */}
        {dailyVerse && showPopular && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Star className="w-5 h-5 text-yellow-400 mr-2" />
              Daily Verse
            </h3>
            <div className="bg-shield-gray rounded-xl p-4">
              <BibleVerse
                reference={dailyVerse.reference}
                text={dailyVerse.text}
                version={dailyVerse.version?.name}
                onSelect={handleVerseSelect}
                onAddNote={handleAddNote}
                onFavorite={() => handleFavorite(dailyVerse.reference)}
                onCopy={() => handleCopyVerse(dailyVerse.reference, dailyVerse.text)}
                onShare={() => handleShareVerse(dailyVerse.reference, dailyVerse.text)}
                isFavorite={favorites.includes(dailyVerse.reference)}
                theme={theme}
              />
            </div>
          </div>
        )}

        {/* Popular Topics */}
        {showPopular && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Quick Search</h3>
            <div className="flex flex-wrap gap-2">
              {popularTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => handleQuickSearch(topic)}
                  className="px-3 py-1 bg-shield-gray rounded-full text-sm hover:bg-shield-blue hover:text-shield-white transition-colors"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Popular Verses */}
        {showPopular && popularVerses.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Popular Verses</h3>
            <div className="space-y-3">
              {popularVerses.slice(0, 5).map((verse: any) => (
                <BibleVerse
                  key={verse.id}
                  reference={verse.reference}
                  text={verse.text}
                  version={verse.version?.name}
                  onSelect={handleVerseSelect}
                  onAddNote={handleAddNote}
                  onFavorite={() => handleFavorite(verse.reference)}
                  onCopy={() => handleCopyVerse(verse.reference, verse.text)}
                  onShare={() => handleShareVerse(verse.reference, verse.text)}
                  isFavorite={favorites.includes(verse.reference)}
                  theme={theme}
                />
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResults && !showPopular && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Search Results ({searchResults.total || 0})
              </h3>
              <button
                onClick={() => setShowPopular(true)}
                className="text-shield-blue hover:text-shield-white"
              >
                Back to Popular
              </button>
            </div>
            <div className="space-y-3">
              {searchResults.passages?.map((passage: any) => (
                <BibleVerse
                  key={passage.id}
                  reference={passage.reference}
                  text={passage.text}
                  version={passage.version?.name}
                  onSelect={handleVerseSelect}
                  onAddNote={handleAddNote}
                  onFavorite={() => handleFavorite(passage.reference)}
                  onCopy={() => handleCopyVerse(passage.reference, passage.text)}
                  onShare={() => handleShareVerse(passage.reference, passage.text)}
                  isFavorite={favorites.includes(passage.reference)}
                  theme={theme}
                />
              ))}
            </div>
          </div>
        )}

        {/* Search History */}
        {searchHistory.length > 0 && showPopular && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Recent Searches</h3>
            <div className="space-y-2">
              {searchHistory.slice(0, 5).map((query, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(query)}
                  className="w-full text-left p-2 rounded-lg hover:bg-shield-gray transition-colors"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

