import React, { useState } from 'react';

export default function TestBiblePinecone() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleBibleImport = async () => {
    setLoading(true);
    setMessage('Starting Bible import...');
    
    try {
      // Using ESV Bible version ID (you can change this)
      const response = await fetch('/api/pinecone/bible-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import',
          versionId: 'de4e12af7f28f599-02', // ESV
          books: ['Genesis', 'John'], // Start with these books
          maxChapters: 10 // Limit for testing
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ Bible import completed! Imported ${data.maxChapters} chapters from ${data.books} books.`);
      } else {
        setMessage(`❌ Import failed: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetNamespaces = async () => {
    setLoading(true);
    setMessage('Getting Bible namespaces...');
    
    try {
      const response = await fetch('/api/pinecone/bible-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-namespaces'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setNamespaces(data.namespaces);
        setMessage(`✅ Found ${data.count} Bible namespaces!`);
      } else {
        setMessage(`❌ Failed to get namespaces: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setMessage('Searching Bible content...');
    
    try {
      const response = await fetch('/api/pinecone/bible-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search',
          query: 'love',
          topK: 5,
          filters: { type: 'bible_verse' }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.results);
        setMessage(`✅ Search completed! Found ${data.count} results.`);
      } else {
        setMessage(`❌ Search failed: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Bible Pinecone Namespace Test</h1>
      
      <div className="mb-8 p-6 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">What This Does</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li><strong>Creates SQL-like namespaces</strong> for each Bible chapter (e.g., "genesis_1", "john_3")</li>
          <li><strong>Stores Bible verses</strong> with embeddings in Pinecone vector database</li>
          <li><strong>Enables semantic search</strong> across all Scripture content</li>
          <li><strong>Integrates with Shield AI</strong> for contextually rich responses</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button
          onClick={handleBibleImport}
          disabled={loading}
          className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Importing...' : '🚀 Import Bible Content'}
        </button>

        <button
          onClick={handleGetNamespaces}
          disabled={loading}
          className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : '📚 Get Namespaces'}
        </button>

        <button
          onClick={handleSearch}
          disabled={loading}
          className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Searching...' : '🔍 Search Bible Content'}
        </button>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <p className="font-medium">{message}</p>
        </div>
      )}

      {namespaces.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Bible Namespaces Found</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {namespaces.map((namespace, index) => (
              <div key={index} className="p-2 bg-gray-200 rounded text-sm text-center">
                {namespace}
              </div>
            ))}
          </div>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Search Results</h3>
          <div className="space-y-4">
            {searchResults.map((result, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-blue-600">{result.reference}</span>
                  <span className="text-sm text-gray-500">Score: {result.score.toFixed(3)}</span>
                </div>
                <p className="text-gray-700 mb-2">{result.text}</p>
                <div className="text-sm text-gray-500">
                  {result.book} {result.chapter}:{result.verse} • {result.version}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 p-6 bg-yellow-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Next Steps</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li><strong>Import Bible content</strong> to create chapter namespaces</li>
          <li><strong>Verify namespaces</strong> are created correctly</li>
          <li><strong>Test search functionality</strong> across Scripture</li>
          <li><strong>Integrate with chat API</strong> to enhance Shield AI responses</li>
          <li><strong>Scale up</strong> to include more books and chapters</li>
        </ol>
      </div>
    </div>
  );
}
