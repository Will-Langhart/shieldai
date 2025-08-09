import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Heart, Share2, Copy, ExternalLink, ChevronRight } from 'lucide-react';
import BibleVerse from './BibleVerse';

interface ApologeticsBibleProps {
  onVerseSelect?: (reference: string, text: string, version?: string) => void;
  onAddNote?: (reference: string, text: string) => void;
  className?: string;
}

interface ApologeticsCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
}

const apologeticsCategories: ApologeticsCategory[] = [
  {
    id: 'existence-of-god',
    name: 'Existence of God',
    description: 'Verses addressing God\'s existence and creation',
    icon: BookOpen
  },
  {
    id: 'problem-of-evil',
    name: 'Problem of Evil',
    description: 'Biblical responses to suffering and evil',
    icon: BookOpen
  },
  {
    id: 'resurrection',
    name: 'Resurrection',
    description: 'Evidence and significance of Christ\'s resurrection',
    icon: BookOpen
  },
  {
    id: 'salvation',
    name: 'Salvation',
    description: 'Core verses about salvation and grace',
    icon: BookOpen
  },
  {
    id: 'bible-reliability',
    name: 'Bible Reliability',
    description: 'Verses about Scripture\'s authority and truth',
    icon: BookOpen
  },
  {
    id: 'witnessing',
    name: 'Witnessing',
    description: 'Verses about sharing the Gospel',
    icon: BookOpen
  },
  {
    id: 'faith-and-reason',
    name: 'Faith & Reason',
    description: 'Balancing faith with intellectual inquiry',
    icon: BookOpen
  },
  {
    id: 'creation',
    name: 'Creation',
    description: 'Verses about God\'s creative work',
    icon: BookOpen
  }
];

export default function ApologeticsBible({ onVerseSelect, onAddNote, className = '' }: ApologeticsBibleProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [verses, setVerses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchApologeticsVerses = async (category: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bible/apologetics?category=${category}`);
      const data = await response.json();
      setVerses(data.verses || []);
    } catch (error) {
      console.error('Error fetching apologetics verses:', error);
      setVerses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    fetchApologeticsVerses(categoryId);
  };

  const handleVerseSelect = (reference: string, text: string, version?: string) => {
    if (onVerseSelect) {
      onVerseSelect(reference, text, version);
    }
  };

  const handleAddNote = (reference: string, text: string) => {
    if (onAddNote) {
      onAddNote(reference, text);
    }
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
              Apologetics Bible Study
            </h2>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Curated Bible verses for apologetics and defending the Christian faith
        </p>
      </div>

      {/* Categories Grid */}
      {!selectedCategory && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {apologeticsCategories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                      <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {category.description}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Verses List */}
      {selectedCategory && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span>Back to Categories</span>
            </button>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {apologeticsCategories.find(c => c.id === selectedCategory)?.name}
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading verses...</span>
            </div>
          ) : verses.length > 0 ? (
            <div className="space-y-4">
              {verses.map((verse, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">
                        {verse.reference}
                      </h4>
                      <p className="text-gray-900 dark:text-white leading-relaxed">
                        "{verse.text}"
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleVerseSelect(verse.reference, verse.text)}
                        className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                        title="Use in conversation"
                      >
                        <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleAddNote(verse.reference, verse.text)}
                        className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900 transition-colors"
                        title="Add note"
                      >
                        <Heart className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </button>
                      <button
                        onClick={() => copyVerseToClipboard(verse.reference, verse.text)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Copy verse"
                      >
                        <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={() => shareVerse(verse.reference, verse.text)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Share verse"
                      >
                        <Share2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No verses found for this category.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 