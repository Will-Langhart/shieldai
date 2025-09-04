'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';

export default function TestDatabaseSchemaPage() {
  const { user, session } = useAuth();
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testDatabaseSchema = async () => {
    if (!session?.access_token) {
      setError('No access token available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/test-db-schema', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTestResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="p-8">Please log in to test the database schema.</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Database Schema Test</h1>
      
      <div className="mb-6">
        <button
          onClick={testDatabaseSchema}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Database Schema'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {testResults && (
        <div className="space-y-6">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <strong>✅ Database Test Completed Successfully!</strong>
          </div>

          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">User Info</h2>
            <pre className="text-sm">{JSON.stringify(testResults.user, null, 2)}</pre>
          </div>

          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">Database Schema Status</h2>
            <div className="space-y-2">
              <div><strong>Has relevant_videos column:</strong> {testResults.database.hasRelevantVideos ? '✅ Yes' : '❌ No'}</div>
              <div><strong>Has bible_verses column:</strong> {testResults.database.hasBibleVerses ? '✅ Yes' : '❌ No'}</div>
              <div><strong>Has video_metadata column:</strong> {testResults.database.hasVideoMetadata ? '✅ Yes' : '❌ No'}</div>
              <div><strong>Has mode column:</strong> {testResults.database.hasMode ? '✅ Yes' : '❌ No'}</div>
            </div>
          </div>

          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">Response Mode Enum Test</h2>
            <pre className="text-sm">{JSON.stringify(testResults.database.enumTest, null, 2)}</pre>
          </div>

          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">Insert Test</h2>
            <pre className="text-sm">{JSON.stringify(testResults.database.insertTest, null, 2)}</pre>
          </div>

          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">Full Table Schema</h2>
            <pre className="text-sm">{JSON.stringify(testResults.database.tableSchema, null, 2)}</pre>
          </div>

          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">Conversations</h2>
            <pre className="text-sm">{JSON.stringify(testResults.database.conversations, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

