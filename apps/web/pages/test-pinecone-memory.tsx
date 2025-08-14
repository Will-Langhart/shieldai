import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';

interface MemoryTest {
  query: string;
  userId: string;
  conversationId?: string;
  topK: number;
}

interface MemoryResult {
  content: string;
  role: string;
  conversationId: string;
  score: number;
  timestamp: string;
  metadata?: any;
}

interface StorageTest {
  conversationId: string;
  userId: string;
  messages: Array<{
    content: string;
    role: 'user' | 'assistant';
    timestamp: string;
  }>;
  metadata?: any;
}

export default function TestPineconeMemory() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Memory retrieval test
  const [memoryTest, setMemoryTest] = useState<MemoryTest>({
    query: 'What is the meaning of life?',
    userId: user?.id || '',
    conversationId: '',
    topK: 5,
  });

  // Memory storage test
  const [storageTest, setStorageTest] = useState<StorageTest>({
    conversationId: `test_${Date.now()}`,
    userId: user?.id || '',
    messages: [
      {
        content: 'Hello, I have a question about faith.',
        role: 'user',
        timestamp: new Date().toISOString(),
      },
      {
        content: 'I\'d be happy to help you with your question about faith. What would you like to know?',
        role: 'assistant',
        timestamp: new Date().toISOString(),
      },
    ],
    metadata: {
      mode: 'accurate',
      topic: 'faith',
      test: true,
    },
  });

  useEffect(() => {
    if (user) {
      setMemoryTest(prev => ({ ...prev, userId: user.id }));
      setStorageTest(prev => ({ ...prev, userId: user.id }));
    }
  }, [user]);

  const testMemoryRetrieval = async () => {
    if (!memoryTest.query || !memoryTest.userId) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        query: memoryTest.query,
        userId: memoryTest.userId,
        topK: memoryTest.topK.toString(),
      });

      if (memoryTest.conversationId) {
        params.append('conversationId', memoryTest.conversationId);
      }

      const response = await fetch(`/api/pinecone/memory?${params}`);
      const data = await response.json();

      if (response.ok) {
        setResults(data);
      } else {
        setError(data.error || 'Failed to retrieve memories');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const testMemoryStorage = async () => {
    if (!storageTest.conversationId || !storageTest.userId || storageTest.messages.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pinecone/memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storageTest),
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data);
        // Update the conversation ID for the next test
        setStorageTest(prev => ({
          ...prev,
          conversationId: `test_${Date.now()}`,
        }));
      } else {
        setError(data.error || 'Failed to store memories');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const testMemoryDeletion = async () => {
    if (!storageTest.conversationId || !storageTest.userId) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        conversationId: storageTest.conversationId,
        userId: storageTest.userId,
      });

      const response = await fetch(`/api/pinecone/memory?${params}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data);
      } else {
        setError(data.error || 'Failed to delete memories');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const addTestMessage = () => {
    setStorageTest(prev => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          content: `Test message ${prev.messages.length + 1} - ${new Date().toLocaleTimeString()}`,
          role: prev.messages.length % 2 === 0 ? 'user' : 'assistant',
          timestamp: new Date().toISOString(),
        },
      ],
    }));
  };

  const removeTestMessage = (index: number) => {
    setStorageTest(prev => ({
      ...prev,
      messages: prev.messages.filter((_, i) => i !== index),
    }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Pinecone Memory System Test
            </h1>
            <p className="text-gray-600">
              Please sign in to test the Pinecone memory system.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Pinecone Memory System Integration Test
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Memory Retrieval Test */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Test Memory Retrieval
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Query
                </label>
                <textarea
                  value={memoryTest.query}
                  onChange={(e) => setMemoryTest(prev => ({ ...prev, query: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter a query to test memory retrieval..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID
                </label>
                <input
                  type="text"
                  value={memoryTest.userId}
                  onChange={(e) => setMemoryTest(prev => ({ ...prev, userId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="User ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conversation ID (optional)
                </label>
                <input
                  type="text"
                  value={memoryTest.conversationId}
                  onChange={(e) => setMemoryTest(prev => ({ ...prev, conversationId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Conversation ID (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Top K Results
                </label>
                <input
                  type="number"
                  value={memoryTest.topK}
                  onChange={(e) => setMemoryTest(prev => ({ ...prev, topK: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="20"
                />
              </div>

              <button
                onClick={testMemoryRetrieval}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Testing...' : 'Test Memory Retrieval'}
              </button>
            </div>
          </div>

          {/* Memory Storage Test */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Test Memory Storage
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conversation ID
                </label>
                <input
                  type="text"
                  value={storageTest.conversationId}
                  onChange={(e) => setStorageTest(prev => ({ ...prev, conversationId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Conversation ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID
                </label>
                <input
                  type="text"
                  value={storageTest.userId}
                  onChange={(e) => setStorageTest(prev => ({ ...prev, userId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="User ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Messages ({storageTest.messages.length})
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {storageTest.messages.map((message, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                      <span className={`px-2 py-1 text-xs rounded ${
                        message.role === 'user' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {message.role}
                      </span>
                      <span className="flex-1 text-sm text-gray-700 truncate">
                        {message.content}
                      </span>
                      <button
                        onClick={() => removeTestMessage(index)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addTestMessage}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add Test Message
                </button>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={testMemoryStorage}
                  disabled={isLoading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {isLoading ? 'Storing...' : 'Test Memory Storage'}
                </button>

                <button
                  onClick={testMemoryDeletion}
                  disabled={isLoading}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isLoading ? 'Deleting...' : 'Test Memory Deletion'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Display */}
        {error && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {results && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Test Results</h3>
            <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto text-sm">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}

        {/* Integration Status */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-800 mb-4">Integration Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Pinecone Index:</span> shieldai
            </div>
            <div>
              <span className="font-medium">Embedding Model:</span> text-embedding-3-small
            </div>
            <div>
              <span className="font-medium">Vector Dimensions:</span> 1024 (converted from 1536)
            </div>
            <div>
              <span className="font-medium">Memory System:</span> Enhanced with semantic chunking
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
