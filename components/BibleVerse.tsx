import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Copy, Share2, Heart, ExternalLink, Edit } from 'lucide-react';

interface BibleVerseProps {
  reference: string;
  text: string;
  version?: string;
  onSelect?: (reference: string, text: string) => void;
  onAddNote?: (reference: string, text: string) => void;
  onCopy?: () => void;
  onShare?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
  theme?: 'light' | 'dark';
  showActions?: boolean;
  className?: string;
}

export default function BibleVerse({
  reference,
  text,
  version = 'NIV',
  onSelect,
  onAddNote,
  onCopy,
  onShare,
  onFavorite,
  isFavorite,
  theme,
  showActions = true,
  className = '',
}: BibleVerseProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${reference} - ${text}`);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Bible Verse: ${reference}`,
          text: `${reference} - ${text}`,
        });
      } else {
        await handleCopy();
      }
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const handleLike = () => {
    if (onFavorite) {
      onFavorite();
      return;
    }
    setIsLiked(!isLiked);
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect(reference, text);
    }
  };

  const handleAddNote = () => {
    if (onAddNote) {
      onAddNote(reference, text);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="font-semibold text-gray-900 dark:text-white">
            {reference}
          </span>
          {version && (
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {version}
            </span>
          )}
        </div>
        {showActions && (
          <div className="flex items-center space-x-1">
            {onAddNote && (
              <button
                onClick={handleAddNote}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
                title="Add study note"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleLike}
              className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                (isFavorite ?? isLiked) ? 'text-red-500' : 'text-gray-400'
              }`}
              title="Like verse"
            >
              <Heart className="w-4 h-4" fill={(isFavorite ?? isLiked) ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={onCopy ?? handleCopy}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title={isCopied ? 'Copied!' : 'Copy verse'}
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={onShare ?? handleShare}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Share verse"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
      <div 
        className="text-gray-700 dark:text-gray-300 leading-relaxed cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 p-2 rounded transition-colors"
        onClick={handleSelect}
      >
        "{text}"
      </div>
      
      {isCopied && (
        <div className="mt-2 text-xs text-green-600 dark:text-green-400">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
} 