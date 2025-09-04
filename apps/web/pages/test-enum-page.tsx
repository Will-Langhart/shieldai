'use client';
import React, { useState } from 'react';
import { useAuth } from '../lib/auth-context';

export default function TestEnumPage() {
  const { user, session } = useAuth();
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testEnum = async () => {
    if (!session?.access_token) {
      setError('No access token available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/test-enum-exists', {
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
    return <div className="p-8">Please log in to test the enum.</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Test Response Mode Enum</h1>
      
      <div className="mb-6">
        <button
          onClick={testEnum}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Enum Exists'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {testResults && (
        <div className="space-y-6">
          {testResults.success ? (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              <strong>✅ SUCCESS!</strong> {testResults.message}
            </div>
          ) : (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong>❌ FAILED!</strong> {testResults.test}
            </div>
          )}

          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">Test Results</h2>
            <pre className="text-sm">{JSON.stringify(testResults, null, 2)}</pre>
          </div>

          {!testResults.success && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              <strong>🔧 Next Steps:</strong>
              <ul className="mt-2 ml-4 list-disc">
                <li>The <code>response_mode</code> enum type does not exist in your database</li>
                <li>You need to run the database migration in Supabase</li>
                <li>Go to Supabase Dashboard → SQL Editor and run the complete schema</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

