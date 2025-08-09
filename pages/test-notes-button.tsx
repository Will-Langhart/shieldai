import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useAuth } from '../lib/auth-context';
import Header from '../components/Header';

const TestNotesButton: NextPage = () => {
  const { user } = useAuth();
  const [showNotesManager, setShowNotesManager] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const handleNotesClick = () => {
    console.log('Notes button clicked!');
    setShowNotesManager(true);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const getThemeIcon = () => {
    return theme === 'dark' ? '🌙' : '☀️';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please sign in to test Notes Button
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You need to be authenticated to access the notes features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Test Notes Button - Shield AI</title>
        <meta name="description" content="Test the notes button functionality" />
      </Head>

      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Header */}
        <Header
          theme={theme}
          onThemeToggle={toggleTheme}
          themeIcon={getThemeIcon()}
          onNotesManagerClick={handleNotesClick}
        />

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6`}>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Test Notes Button
            </h1>
            
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Instructions
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  1. Look for the notes button (MessageSquare icon) in the header
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  2. Click the notes button to test if it opens the notes manager
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  3. Check the browser console for debug messages
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Debug Information
                </h2>
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>User:</strong> {user?.email}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Notes Manager State:</strong> {showNotesManager ? 'Open' : 'Closed'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Theme:</strong> {theme}
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Manual Test
                </h2>
                <button
                  onClick={handleNotesClick}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Test Notes Button (Manual)
                </button>
              </div>
            </div>
          </div>

          {/* Notes Manager Modal */}
          {showNotesManager && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNotesManager(false)} />
              <div className="relative w-full max-w-4xl mx-4 max-h-[95vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Notes Manager (Test)
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    The notes manager modal is working! This is a test implementation.
                  </p>
                  <button
                    onClick={() => setShowNotesManager(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TestNotesButton;

