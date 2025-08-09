import React, { useState, useEffect } from 'react';
import { Search, Filter, BookOpen, Settings, ChevronDown, ChevronUp, X, Loader2 } from 'lucide-react';
import BibleVerse from './BibleVerse';
import { useAuth } from '../lib/auth-context';

interface BibleVersion {
  id: string;
  name: string;
  abbreviation: string;
  language: {
    id: string;
    name: string;
  };
}

interface AdvancedSearchFilters {
  version: string;
  book: string;
  chapter: number | null;
  verse: number | null;
  searchType: 'exact' | 'contains' | 'starts_with' | 'ends_with';
  caseSensitive: boolean;
  includeApocrypha: boolean;
}

interface AdvancedBibleSearchProps {
  onVerseSelect?: (reference: string, text: string) => void;
  className?: string;
}

export default function AdvancedBibleSearch({ onVerseSelect, className = '' }: AdvancedBibleSearchProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [availableVersions, setAvailableVersions] = useState<BibleVersion[]>([]);
  const [availableBooks, setAvailableBooks] = useState<string[]>([]);
  const [filters, setFilters] = useState<AdvancedSearchFilters>({
    version: 'de4e12af7f28f599-02', // Default NIV
    book: '',
    chapter: null,
    verse: null,
    searchType: 'contains',
    caseSensitive: false,
    includeApocrypha: false,
  });

  // Bible books for filtering
  const bibleBooks = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
    '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
    'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms',
    'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah',
    'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel',
    'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah',
    'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai',
    'Zechariah', 'Malachi',
    'Matthew', 'Mark', 'Luke', 'John', 'Acts',
    'Romans', '1 Corinthians', '2 Corinthians', 'Galatians',
    'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians',
    '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus',
    'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
    '1 John', '2 John', '3 John', 'Jude', 'Revelation'
  ];

  useEffect(() => {
    loadBibleVersions();
  }, []);

  const loadBibleVersions = async () => {
    try {
      const response = await fetch('/api/bible/versions');
      const data = await response.json();
      setAvailableVersions(data.versions || []);
    } catch (error) {
      console.error('Error loading Bible versions:', error);
    }
  };

  const handleAdvancedSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      // Build advanced search parameters
      const params = new URLSearchParams({
        query: searchQuery,
        versionId: filters.version,
        limit: '20',
        searchType: filters.searchType,
        caseSensitive: filters.caseSensitive.toString(),
      });

      if (filters.book) {
        params.append('book', filters.book);
      }
      if (filters.chapter) {
        params.append('chapter', filters.chapter.toString());
      }
      if (filters.verse) {
        params.append('verse', filters.verse.toString());
      }

      // Add user ID if authenticated
      if (user?.id) {
        params.append('userId', user.id);
      }

      const response = await fetch(`/api/bible/advanced-search?${params}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error performing advanced search:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSearch = (query: string) => {
    setSearchQuery(query);
    handleAdvancedSearch();
  };

  const handleVerseSelect = (reference: string, text: string) => {
    if (onVerseSelect) {
      onVerseSelect(reference, text);
    }
  };

  const clearFilters = () => {
    setFilters({
      version: 'de4e12af7f28f599-02',
      book: '',
      chapter: null,
      verse: null,
      searchType: 'contains',
      caseSensitive: false,
      includeApocrypha: false,
    });
    setSearchQuery('');
    setSearchResults(null);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Advanced Bible Search
            </h3>
          </div>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center space-x-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Settings className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Filters</span>
            {showAdvancedFilters ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdvancedSearch()}
            placeholder="Search for verses, topics, or references..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-750 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Bible Version */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bible Version
                </label>
                <select
                  value={filters.version}
                  onChange={(e) => setFilters({ ...filters, version: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {availableVersions.slice(0, 10).map((version) => (
                    <option key={version.id} value={version.id}>
                      {version.name} ({version.abbreviation})
                    </option>
                  ))}
                </select>
              </div>

              {/* Book Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Book
                </label>
                <select
                  value={filters.book}
                  onChange={(e) => setFilters({ ...filters, book: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Books</option>
                  {bibleBooks.map((book) => (
                    <option key={book} value={book}>
                      {book}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chapter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Chapter
                </label>
                <input
                  type="number"
                  value={filters.chapter || ''}
                  onChange={(e) => setFilters({ ...filters, chapter: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Verse */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Verse
                </label>
                <input
                  type="number"
                  value={filters.verse || ''}
                  onChange={(e) => setFilters({ ...filters, verse: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Search Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search Type
                </label>
                <select
                  value={filters.searchType}
                  onChange={(e) => setFilters({ ...filters, searchType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="contains">Contains</option>
                  <option value="exact">Exact Match</option>
                  <option value="starts_with">Starts With</option>
                  <option value="ends_with">Ends With</option>
                </select>
              </div>

              {/* Case Sensitive */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="caseSensitive"
                  checked={filters.caseSensitive}
                  onChange={(e) => setFilters({ ...filters, caseSensitive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="caseSensitive" className="text-sm text-gray-700 dark:text-gray-300">
                  Case Sensitive
                </label>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Clear Filters
              </button>
              <button
                onClick={handleAdvancedSearch}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Searching...</span>
                  </div>
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Quick Search Topics */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quick Search Topics
          </h4>
          <div className="flex flex-wrap gap-2">
            {['salvation', 'faith', 'love', 'hope', 'wisdom', 'prayer', 'grace', 'mercy', 'forgiveness', 'witness'].map((topic) => (
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

      {/* Search Results */}
      <div className="p-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Searching...</span>
          </div>
        )}

        {searchResults && !isLoading && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Search Results ({searchResults.total} found)
              </h4>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Version: {availableVersions.find(v => v.id === filters.version)?.name || 'Unknown'}
              </div>
            </div>
            
            {searchResults.passages && searchResults.passages.length > 0 ? (
              <div className="space-y-3">
                {searchResults.passages.map((passage: any, index: number) => (
                  <BibleVerse
                    key={index}
                    reference={passage.reference}
                    text={passage.text}
                    version={passage.version?.name}
                    onSelect={handleVerseSelect}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No verses found for "{searchResults.query}"</p>
                <p className="text-sm mt-1">Try adjusting your search criteria</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 