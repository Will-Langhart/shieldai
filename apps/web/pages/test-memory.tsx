import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useAuth } from '../lib/auth-context';
import MemoryInsights from '../components/MemoryInsights';

const TestMemory: NextPage = () => {
  const { user } = useAuth();
  const [selectedMemory, setSelectedMemory] = useState<any>(null);
  const [testQuery, setTestQuery] = useState('');

  const handleMemorySelect = (memory: any) => {
    setSelectedMemory(memory);
    console.log('Selected memory:', memory);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please sign in to test Memory Features
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You need to be authenticated to access the memory features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Memory Test - Shield AI</title>
        <meta name="description" content="Test the enhanced memory functionality" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Memory Test
                </h1>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Testing long-term memory functionality
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Logged in as: {user.email}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Memory Insights */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Memory Insights
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  View your conversation memory statistics and search through your conversation history.
                </p>
                <MemoryInsights
                  onMemorySelect={handleMemorySelect}
                  className="w-full"
                />
              </div>
            </div>

            {/* Selected Memory Details */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Selected Memory Details
                </h2>
                {selectedMemory ? (
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Role:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        selectedMemory.role === 'user' 
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' 
                          : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      }`}>
                        {selectedMemory.role}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Relevance Score:</span>
                      <span className="ml-2 text-sm text-gray-900 dark:text-white">
                        {(selectedMemory.score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Timestamp:</span>
                      <span className="ml-2 text-sm text-gray-900 dark:text-white">
                        {new Date(selectedMemory.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Conversation ID:</span>
                      <span className="ml-2 text-sm text-gray-900 dark:text-white font-mono">
                        {selectedMemory.conversationId}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Content:</span>
                      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {selectedMemory.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="text-sm">Select a memory from the search results to view details.</p>
                  </div>
                )}
              </div>

              {/* Test Query */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Test Memory Search
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Enter a query to test memory search functionality.
                </p>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={testQuery}
                    onChange={(e) => setTestQuery(e.target.value)}
                    placeholder="Enter a test query..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <p>Example queries:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>"What did we discuss about theology?"</li>
                      <li>"Show me conversations about apologetics"</li>
                      <li>"Find discussions about Bible verses"</li>
                      <li>"What questions did I ask about faith?"</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Information Section */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              About Memory Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Long-term Memory</h3>
                <p className="mb-2">
                  Your conversations are stored in Pinecone vector database for semantic search and retrieval.
                </p>
                <p>
                  This allows the AI to remember previous discussions and provide more contextual responses.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Memory Search</h3>
                <p className="mb-2">
                  Search through your conversation history using natural language queries.
                </p>
                <p>
                  Find relevant past discussions based on semantic similarity, not just keywords.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Memory Insights</h3>
                <p className="mb-2">
                  View statistics about your conversation patterns and preferred topics.
                </p>
                <p>
                  Understand your interaction style and areas of interest over time.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Privacy & Control</h3>
                <p className="mb-2">
                  All memories are stored securely and are only accessible to you.
                </p>
                <p>
                  You can request deletion of old memories for privacy management.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TestMemory;

