import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import BibleSearch from '../components/BibleSearch';

export default function TestBibleAPI() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testAPIEndpoints = async () => {
    setIsLoading(true);
    const results: any = {};

    try {
      // Test Bible versions
      const versionsResponse = await fetch('/api/bible/versions');
      results.versions = await versionsResponse.json();

      // Test popular verses
      const popularResponse = await fetch('/api/bible/popular');
      results.popular = await popularResponse.json();

      // Test search
      const searchResponse = await fetch('/api/bible/search?query=love&limit=3');
      results.search = await searchResponse.json();

      // Test passage
      const passageResponse = await fetch('/api/bible/passage?reference=John%203:16');
      results.passage = await passageResponse.json();

    } catch (error) {
      console.error('API test error:', error);
      results.error = error;
    }

    setTestResults(results);
    setIsLoading(false);
  };

  return (
    <>
      <Head>
        <title>Bible API Test - Shield AI</title>
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Bible API Integration Test
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* API Test Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                API Endpoint Tests
              </h2>
              
              <button
                onClick={testAPIEndpoints}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-4"
              >
                {isLoading ? 'Testing...' : 'Test API Endpoints'}
              </button>

              {testResults && (
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-750 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Versions API</h3>
                    <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                      {JSON.stringify(testResults.versions, null, 2)}
                    </pre>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-750 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Popular Verses API</h3>
                    <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                      {JSON.stringify(testResults.popular, null, 2)}
                    </pre>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-750 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Search API</h3>
                    <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                      {JSON.stringify(testResults.search, null, 2)}
                    </pre>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-750 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Passage API</h3>
                    <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                      {JSON.stringify(testResults.passage, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Bible Search Component Test */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Bible Search Component
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Test the Bible search component functionality:
                </p>
              </div>
              
              <BibleSearch
                onVerseSelect={(reference, text) => {
                  alert(`Selected: ${reference} - "${text}"`);
                }}
                className="border-t border-gray-200 dark:border-gray-700"
              />
            </div>
          </div>

          {/* Environment Check */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Environment Configuration
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">BIBLE_API_KEY:</span>
                <span className="text-gray-900 dark:text-white">
                  {process.env.NEXT_PUBLIC_BIBLE_API_KEY ? '✅ Set' : '❌ Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">BIBLE_API_BASE_URL:</span>
                <span className="text-gray-900 dark:text-white">
                  {process.env.NEXT_PUBLIC_BIBLE_API_BASE_URL || 'https://api.scripture.api.bible/v1'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 