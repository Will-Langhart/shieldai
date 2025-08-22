import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '../lib/auth-context';

export default function TestYouTubeAPI() {
  const { user, session, loading: authLoading } = useAuth();
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testYouTubeAPI = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Test video search API
      const response = await fetch('/api/videos/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          query: 'Christian apologetics evidence',
          maxResults: 3
        })
      });

      if (!response.ok) {
        throw new Error(`Video search failed: ${response.status} ${response.statusText}`);
      }

      const videoResults = await response.json();
      
      // Test database schema
      const dbResponse = await fetch('/api/test-db-schema', {
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`
        }
      });

      if (!dbResponse.ok) {
        throw new Error(`Database schema test failed: ${dbResponse.status} ${dbResponse.statusText}`);
      }

      const dbResults = await dbResponse.json();

      setTestResults({
        videoSearch: videoResults,
        databaseSchema: dbResults,
        timestamp: new Date().toISOString()
      });

    } catch (err: any) {
      setError(err.message);
      console.error('Test failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const testChatAPI = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          message: 'What is the evidence for Christianity?',
          mode: 'gentle',
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Chat API failed: ${response.status} ${response.statusText}`);
      }

      const chatResults = await response.json();
      
      setTestResults((prev: any) => ({
        ...prev,
        chatAPI: chatResults,
        chatTimestamp: new Date().toISOString()
      }));

    } catch (err: any) {
      setError(err.message);
      console.error('Chat test failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p>Please sign in to test the YouTube API and database schema.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Test YouTube API & Database Schema - Shield AI</title>
      </Head>
      
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">🔧 YouTube API & Database Schema Test</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">🧪 Test Controls</h2>
              <div className="space-y-4">
                <button
                  onClick={testYouTubeAPI}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg font-medium"
                >
                  {loading ? 'Testing...' : 'Test YouTube API & Database Schema'}
                </button>
                
                <button
                  onClick={testChatAPI}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded-lg font-medium"
                >
                  {loading ? 'Testing...' : 'Test Chat API with Video Integration'}
                </button>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">👤 User Info</h2>
              <div className="space-y-2 text-sm">
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Email Verified:</strong> {user.email_confirmed_at ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-red-200 mb-2">❌ Error</h3>
              <p className="text-red-100">{error}</p>
            </div>
          )}

          {testResults && (
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">📊 Test Results</h2>
                <div className="text-sm">
                  <p><strong>Timestamp:</strong> {testResults.timestamp}</p>
                  {testResults.chatTimestamp && (
                    <p><strong>Chat Test:</strong> {testResults.chatTimestamp}</p>
                  )}
                </div>
              </div>

              {testResults.videoSearch && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">🎬 Video Search Results</h3>
                  <pre className="bg-gray-900 p-4 rounded overflow-auto text-xs">
                    {JSON.stringify(testResults.videoSearch, null, 2)}
                  </pre>
                </div>
              )}

              {testResults.databaseSchema && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">🗄️ Database Schema Results</h3>
                  <pre className="bg-gray-900 p-4 rounded overflow-auto text-xs">
                    {JSON.stringify(testResults.databaseSchema, null, 2)}
                  </pre>
                </div>
              )}

              {testResults.chatAPI && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">💬 Chat API Results</h3>
                  <pre className="bg-gray-900 p-4 rounded overflow-auto text-xs">
                    {JSON.stringify(testResults.chatAPI, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
