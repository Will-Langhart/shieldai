import React, { useState } from 'react';
import Head from 'next/head';
import EnhancedBibleInterface from '../components/EnhancedBibleInterface';
import AdvancedBibleSearch from '../components/AdvancedBibleSearch';
import VerseComparison from '../components/VerseComparison';
import BibleStudyTools from '../components/BibleStudyTools';
import BibleSearch from '../components/BibleSearch';

export default function TestBibleEnhancements() {
  const [selectedVerse, setSelectedVerse] = useState('John 3:16');
  const [activeTest, setActiveTest] = useState<'enhanced' | 'advanced' | 'comparison' | 'study' | 'basic'>('enhanced');

  const handleVerseSelect = (reference: string, text: string, version?: string) => {
    console.log('Selected verse:', { reference, text, version });
    setSelectedVerse(reference);
  };

  const tests = [
    { id: 'enhanced', label: 'Enhanced Interface', description: 'Complete Bible study suite with all features' },
    { id: 'advanced', label: 'Advanced Search', description: 'Filtered search with multiple criteria' },
    { id: 'comparison', label: 'Verse Comparison', description: 'Compare verses across translations' },
    { id: 'study', label: 'Study Tools', description: 'Concordance, cross-references, and notes' },
    { id: 'basic', label: 'Basic Search', description: 'Simple keyword search' },
  ];

  return (
    <>
      <Head>
        <title>Bible Enhancements Test - Shield AI</title>
        <meta name="description" content="Test all Bible feature enhancements" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Bible Enhancements Test
                </h1>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Testing all new Bible features
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Selected: {selectedVerse}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Test Navigation */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-1 py-4 overflow-x-auto">
              {tests.map((test) => (
                <button
                  key={test.id}
                  onClick={() => setActiveTest(test.id as any)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTest === test.id
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  {test.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Test Description */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {tests.find(t => t.id === activeTest)?.description}
            </p>
          </div>
        </div>

        {/* Test Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            {activeTest === 'enhanced' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Enhanced Bible Interface
                </h2>
                <EnhancedBibleInterface
                  onVerseSelect={handleVerseSelect}
                  className="w-full"
                />
              </div>
            )}

            {activeTest === 'advanced' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Advanced Bible Search
                </h2>
                <AdvancedBibleSearch
                  onVerseSelect={handleVerseSelect}
                  className="w-full"
                />
              </div>
            )}

            {activeTest === 'comparison' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Verse Comparison
                </h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Test Verse Reference
                  </label>
                  <input
                    type="text"
                    value={selectedVerse}
                    onChange={(e) => setSelectedVerse(e.target.value)}
                    placeholder="e.g., John 3:16"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <VerseComparison
                  reference={selectedVerse}
                  onVerseSelect={handleVerseSelect}
                  className="w-full"
                />
              </div>
            )}

            {activeTest === 'study' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Bible Study Tools
                </h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Test Verse Reference
                  </label>
                  <input
                    type="text"
                    value={selectedVerse}
                    onChange={(e) => setSelectedVerse(e.target.value)}
                    placeholder="e.g., John 3:16"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <BibleStudyTools
                  reference={selectedVerse}
                  onVerseSelect={handleVerseSelect}
                  className="w-full"
                />
              </div>
            )}

            {activeTest === 'basic' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Basic Bible Search
                </h2>
                <BibleSearch
                  onVerseSelect={handleVerseSelect}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>

        {/* API Test Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                API Endpoint Tests
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <APITestCard
                  title="Bible Versions"
                  endpoint="/api/bible/versions"
                  description="Get available Bible translations"
                />
                <APITestCard
                  title="Search Bible"
                  endpoint="/api/bible/search?query=love&limit=3"
                  description="Search for verses by keyword"
                />
                <APITestCard
                  title="Get Passage"
                  endpoint="/api/bible/passage?reference=John%203:16"
                  description="Get specific verse by reference"
                />
                <APITestCard
                  title="Popular Verses"
                  endpoint="/api/bible/popular"
                  description="Get popular verses for apologetics"
                />
                <APITestCard
                  title="Advanced Search"
                  endpoint="/api/bible/advanced-search?query=love&book=John&limit=5"
                  description="Advanced search with filters"
                />
                <APITestCard
                  title="Concordance"
                  endpoint="/api/bible/concordance?reference=John%203:16"
                  description="Word analysis for verses"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function APITestCard({ title, endpoint, description }: { title: string; endpoint: string; description: string }) {
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testEndpoint = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h3 className="font-medium text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{description}</p>
      <div className="space-y-3">
        <button
          onClick={testEndpoint}
          disabled={isLoading}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {isLoading ? 'Testing...' : 'Test Endpoint'}
        </button>
        
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
            Error: {error}
          </div>
        )}
        
        {result && (
          <div className="text-sm">
            <details className="cursor-pointer">
              <summary className="font-medium text-gray-700 dark:text-gray-300">
                View Result ({Object.keys(result).length} keys)
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
} 