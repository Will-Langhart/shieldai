import React, { useState } from 'react';

export default function TestChurchAPI() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testClientSideAPI = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
      console.log('Testing client-side API with key:', apiKey);
      
      const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=30.2672,-97.7431&radius=25000&type=church&key=${apiKey}`;
      
      console.log('Making request to:', searchUrl);
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      console.log('API Response:', data);
      setResults(data);
      
      if (data.status === 'OK') {
        console.log(`Found ${data.results?.length || 0} churches`);
      } else {
        console.error('API Error:', data.status, data.error_message);
        setError(`API Error: ${data.status} - ${data.error_message}`);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Fetch error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const testServerSideAPI = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/churches/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: 30.2672,
          longitude: -97.7431,
          radius: 25000,
          denomination: 'all'
        })
      });
      
      const data = await response.json();
      console.log('Server-side API Response:', data);
      setResults(data);
      
    } catch (err) {
      console.error('Server-side API error:', err);
      setError(`Server-side API error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Church Finder API Test</h1>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={testClientSideAPI}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Client-Side API'}
          </button>
          
          <button
            onClick={testServerSideAPI}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 ml-4"
          >
            {loading ? 'Testing...' : 'Test Server-Side API'}
          </button>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-4">
            <h3 className="text-red-200 font-bold">Error:</h3>
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {results && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-green-200 font-bold mb-4">Results:</h3>
            <pre className="text-sm overflow-auto max-h-96">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

