import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Settings, Copy, Share2, Heart, ExternalLink, ChevronDown, ChevronUp, X, Edit } from 'lucide-react';
import BibleSearch from './BibleSearch';
import AdvancedBibleSearch from './AdvancedBibleSearch';
import VerseComparison from './VerseComparison';
import BibleStudyTools from './BibleStudyTools';
import BibleVerse from './BibleVerse';

interface EnhancedBibleInterfaceProps {
  onVerseSelect?: (reference: string, text: string, version?: string) => void;
  onAddNote?: (reference: string, text: string) => void;
  className?: string;
}

type BibleMode = 'search' | 'advanced' | 'comparison' | 'study';

export default function EnhancedBibleInterface({ onVerseSelect, onAddNote, className = '' }: EnhancedBibleInterfaceProps) {
  const [activeMode, setActiveMode] = useState<BibleMode>('search');
  const [selectedVerse, setSelectedVerse] = useState<string>('');
  const [showInterface, setShowInterface] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [favoriteVerses, setFavoriteVerses] = useState<Array<{ reference: string; text: string; version: string }>>([]);

  const modes = [
    { id: 'search', label: 'Quick Search', icon: Search },
    { id: 'advanced', label: 'Advanced Search', icon: Settings },
    { id: 'comparison', label: 'Verse Comparison', icon: BookOpen },
    { id: 'study', label: 'Study Tools', icon: BookOpen },
  ];

  const handleVerseSelect = (reference: string, text: string, version?: string) => {
    if (onVerseSelect) {
      onVerseSelect(reference, text, version);
    }
    setSelectedVerse(reference);
  };

  const handleAddNote = (reference: string, text: string) => {
    setSelectedVerse(reference);
    setActiveMode('study');
    if (onAddNote) {
      onAddNote(reference, text);
    }
  };

  const addToFavorites = (reference: string, text: string, version: string) => {
    const newFavorite = { reference, text, version };
    setFavoriteVerses(prev => {
      const exists = prev.find(fav => fav.reference === reference);
      if (!exists) {
        return [...prev, newFavorite];
      }
      return prev;
    });
  };

  const removeFromFavorites = (reference: string) => {
    setFavoriteVerses(prev => prev.filter(fav => fav.reference !== reference));
  };

  const addToRecentSearches = (search: string) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== search);
      return [search, ...filtered].slice(0, 5);
    });
  };

  const copyVerseToClipboard = async (reference: string, text: string) => {
    try {
      await navigator.clipboard.writeText(`${reference}: "${text}"`);
    } catch (error) {
      console.error('Failed to copy verse:', error);
    }
  };

  const shareVerse = async (reference: string, text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Bible Verse',
          text: `${reference}: "${text}"`,
        });
      } catch (error) {
        console.error('Failed to share verse:', error);
      }
    } else {
      // Fallback to copying
      await copyVerseToClipboard(reference, text);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Bible Study Suite
            </h2>
          </div>
          <button
            onClick={() => setShowInterface(!showInterface)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {showInterface ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex space-x-1 mb-4">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id as BibleMode)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeMode === mode.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Actions */}
        {showInterface && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recent Searches */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recent Searches
              </h4>
              <div className="space-y-1">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setActiveMode('search');
                      // Trigger search with this term
                    }}
                    className="block w-full text-left text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1 rounded"
                  >
                    {search}
                  </button>
                ))}
                {recentSearches.length === 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">No recent searches</p>
                )}
              </div>
            </div>

            {/* Favorite Verses */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Favorite Verses
              </h4>
              <div className="space-y-1">
                {favoriteVerses.slice(0, 3).map((favorite, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-750 rounded">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {favorite.reference}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {favorite.text.substring(0, 50)}...
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={() => copyVerseToClipboard(favorite.reference, favorite.text)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Copy"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromFavorites(favorite.reference)}
                        className="p-1 text-red-400 hover:text-red-600"
                        title="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
                {favoriteVerses.length === 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">No favorite verses</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {activeMode === 'search' && (
          <BibleSearch
            onVerseSelect={(reference, text) => {
              handleVerseSelect(reference, text);
              addToRecentSearches(reference);
            }}
            onAddNote={handleAddNote}
          />
        )}

        {activeMode === 'advanced' && (
          <AdvancedBibleSearch
            onVerseSelect={(reference, text) => {
              handleVerseSelect(reference, text);
              addToRecentSearches(reference);
            }}
          />
        )}

        {activeMode === 'comparison' && (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter Verse Reference
              </label>
              <input
                type="text"
                value={selectedVerse}
                onChange={(e) => setSelectedVerse(e.target.value)}
                placeholder="e.g., John 3:16"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            {selectedVerse && (
              <VerseComparison
                reference={selectedVerse}
                onVerseSelect={handleVerseSelect}
              />
            )}
          </div>
        )}

        {activeMode === 'study' && selectedVerse && (
          <BibleStudyTools
            reference={selectedVerse}
            onVerseSelect={handleVerseSelect}
          />
        )}

        {activeMode === 'study' && !selectedVerse && (
          <div className="space-y-6">
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Select a verse to use study tools</p>
              <p className="text-sm mt-1">Enter a verse reference above</p>
            </div>
            
            {/* Quick Access to Study Notes */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Edit className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">Quick Study Notes</h3>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-300 mb-4">
                Enter any verse reference to start creating study notes, or use the Bible search to find verses.
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  value={selectedVerse}
                  onChange={(e) => setSelectedVerse(e.target.value)}
                  placeholder="e.g., John 3:16, Psalm 23:1, Matthew 6:9"
                  className="w-full px-4 py-3 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      if (selectedVerse.trim()) {
                        // This will trigger the BibleStudyTools component
                      }
                    }}
                    disabled={!selectedVerse.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Open Study Tools</span>
                  </button>
                  <button
                    onClick={() => setActiveMode('search')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Search Bible
                  </button>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">💡 Study Notes Features:</h4>
                <ul className="text-xs text-blue-600 dark:text-blue-300 space-y-1">
                  <li>• Auto-save notes as you type</li>
                  <li>• Add tags to organize your notes</li>
                  <li>• View all notes in User Settings</li>
                  <li>• Access concordance and cross-references</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
        <div className="flex items-center justify-end">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.open('https://scripture.api.bible/', '_blank')}
              className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              <ExternalLink className="w-3 h-3" />
              <span>API Documentation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 