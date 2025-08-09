import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';

export default function TestPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const [testResult, setTestResult] = useState<string>('');

  const testSupabaseConnection = async () => {
    try {
      // Test basic Supabase connection
      const { data, error } = await supabase.from('conversations').select('count').limit(1);
      if (error) {
        setTestResult(`Supabase connection error: ${error.message}`);
      } else {
        setTestResult('Supabase connection successful!');
      }
    } catch (error) {
      setTestResult(`Connection test failed: ${error}`);
    }
  };

  const testAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setTestResult(`User authenticated: ${user.email}`);
      } else {
        setTestResult('No authenticated user found');
      }
    } catch (error) {
      setTestResult(`Auth test failed: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-shield-black text-shield-white p-8">
      <h1 className="text-2xl font-bold mb-4">Shield AI - Test Page</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Authentication Status</h2>
          <p>Loading: {loading ? 'Yes' : 'No'}</p>
          <p>User: {user ? user.email : 'Not signed in'}</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Tests</h2>
          <button 
            onClick={testSupabaseConnection}
            className="bg-shield-blue px-4 py-2 rounded mr-2"
          >
            Test Supabase Connection
          </button>
          <button 
            onClick={testAuth}
            className="bg-shield-blue px-4 py-2 rounded"
          >
            Test Authentication
          </button>
        </div>

        {testResult && (
          <div className="mt-4 p-4 bg-shield-gray rounded">
            <h3 className="font-semibold mb-2">Test Result:</h3>
            <p>{testResult}</p>
          </div>
        )}
      </div>
    </div>
  );
} 