import React, { useState, useEffect } from 'react';
import { BookOpen, Copy, Share2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface VerseComparisonProps {
  reference: string;
  onVerseSelect?: (reference: string, text: string, version: string) => void;
  className?: string;
}

interface ComparisonVerse {
  version: string;
  versionName: string;
  text: string;
  reference: string;
}

export default function VerseComparison({ reference, onVerseSelect, className = '' }: VerseComparisonProps) {
  const [comparisons, setComparisons] = useState<ComparisonVerse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedVersions, setExpandedVersions] = useState<string[]>([]);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([
    'de4e12af7f28f599-02', // NIV
    '65eec8e0b60e656b-01', // KJV
    'f421fe261da7624f-01', // ESV
  ]);

  const availableVersions = [
    { id: 'de4e12af7f28f599-02', name: 'NIV', fullName: 'New International Version' },
    { id: '65eec8e0b60e656b-01', name: 'KJV', fullName: 'King James Version' },
    { id: 'f421fe261da7624f-01', name: 'ESV', fullName: 'English Standard Version' },
    { id: '9879dbb7cfe39e4d-01', name: 'NLT', fullName: 'New Living Translation' },
    { id: 'c315fa9f71d94af9-01', name: 'NKJV', fullName: 'New King James Version' },
    { id: 'a4c2b8c0d8b8c0d8-01', name: 'NASB', fullName: 'New American Standard Bible' },
  ];

  useEffect(() => {
    if (reference) {
      loadVerseComparisons();
    }
  }, [reference, selectedVersions]);

  const loadVerseComparisons = async () => {
    setIsLoading(true);
    const newComparisons: ComparisonVerse[] = [];

    try {
      for (const versionId of selectedVersions) {
        try {
          const response = await fetch(`/api/bible/passage?reference=${encodeURIComponent(reference)}&versionId=${versionId}`);
          const data = await response.json();
          
          if (data.passage) {
            const versionInfo = availableVersions.find(v => v.id === versionId);
            newComparisons.push({
              version: versionId,
              versionName: versionInfo?.name || 'Unknown',
              text: data.passage.content || data.passage.text || '',
              reference: data.passage.reference,
            });
          }
        } catch (error) {
          console.error(`Error loading version ${versionId}:`, error);
        }
      }
    } catch (error) {
      console.error('Error loading verse comparisons:', error);
    } finally {
      setIsLoading(false);
      setComparisons(newComparisons);
    }
  };

  const toggleVersion = (versionId: string) => {
    if (expandedVersions.includes(versionId)) {
      setExpandedVersions(expandedVersions.filter(v => v !== versionId));
    } else {
      setExpandedVersions([...expandedVersions, versionId]);
    }
  };

  const handleVersionToggle = (versionId: string) => {
    if (selectedVersions.includes(versionId)) {
      setSelectedVersions(selectedVersions.filter(v => v !== versionId));
    } else {
      setSelectedVersions([...selectedVersions, versionId]);
    }
  };

  const handleVerseSelect = (text: string, version: string) => {
    if (onVerseSelect) {
      onVerseSelect(reference, text, version);
    }
  };

  const copyAllVersions = async () => {
    const text = comparisons.map(c => `${c.versionName}: ${c.text}`).join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Verse Comparison
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={copyAllVersions}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Copy all versions"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => setExpandedVersions(expandedVersions.length === comparisons.length ? [] : comparisons.map(c => c.version))}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title={expandedVersions.length === comparisons.length ? "Collapse all" : "Expand all"}
            >
              {expandedVersions.length === comparisons.length ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Reference */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Reference: {reference}
          </h4>
        </div>

        {/* Version Selection */}
        <div className="mb-4">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Versions to Compare
          </h5>
          <div className="flex flex-wrap gap-2">
            {availableVersions.map((version) => (
              <button
                key={version.id}
                onClick={() => handleVersionToggle(version.id)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  selectedVersions.includes(version.id)
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {version.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison Results */}
      <div className="p-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading comparisons...</span>
          </div>
        )}

        {!isLoading && comparisons.length > 0 && (
          <div className="space-y-4">
            {comparisons.map((comparison, index) => (
              <div
                key={comparison.version}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                {/* Version Header */}
                <div
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-750 cursor-pointer"
                  onClick={() => toggleVersion(comparison.version)}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {comparison.versionName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {comparison.reference}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVerseSelect(stripHtml(comparison.text), comparison.versionName);
                      }}
                      className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Select this version"
                    >
                      <BookOpen className="w-4 h-4" />
                    </button>
                    {expandedVersions.includes(comparison.version) ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                </div>

                {/* Verse Text */}
                {expandedVersions.includes(comparison.version) && (
                  <div className="p-4 bg-white dark:bg-gray-800">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      "{stripHtml(comparison.text)}"
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!isLoading && comparisons.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No versions selected for comparison</p>
            <p className="text-sm mt-1">Select versions above to compare</p>
          </div>
        )}
      </div>
    </div>
  );
} 