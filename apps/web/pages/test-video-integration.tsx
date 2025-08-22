import React, { useState } from 'react';
import Head from 'next/head';
import VideoDisplay from '../components/VideoDisplay';
import { VideoClientService } from '../lib/video-client-service';
import { VideoResult } from '../lib/video-service';

export default function TestVideoIntegration() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VideoResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      // Use curated videos for testing
      const videos = VideoClientService.getCuratedVideos();
      const filtered = VideoClientService.filterVideosByTopic(videos, searchQuery);
      const sorted = VideoClientService.sortVideosByRelevance(filtered);
      setSearchResults(sorted);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const videos = VideoClientService.getVideosByCategory(categoryId);
    setSearchResults(videos);
    setSearchQuery(categoryId);
  };

  const categories = VideoClientService.getVideoCategories();

  return (
    <>
      <Head>
        <title>Test Video Integration - Shield AI</title>
        <meta name="description" content="Test page for Shield AI video integration feature" />
      </Head>

      <div className="min-h-screen bg-shield-black text-shield-white p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">🎥 Video Integration Test</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Panel - Search & Categories */}
            <div className="lg:col-span-1 space-y-6">
              {/* Search */}
              <div className="bg-shield-gray/30 rounded-xl p-6 border border-gray-700/50">
                <h2 className="text-xl font-semibold mb-4">Search Videos</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter search query..."
                    className="w-full px-4 py-2 bg-shield-gray/50 border border-gray-600 rounded-lg text-shield-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-shield-blue/50"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isLoading || !searchQuery.trim()}
                    className="w-full px-4 py-2 bg-shield-blue hover:bg-shield-blue/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                  >
                    {isLoading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>

              {/* Categories */}
              <div className="bg-shield-gray/30 rounded-xl p-6 border border-gray-700/50">
                <h2 className="text-xl font-semibold mb-4">Video Categories</h2>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-shield-blue/20 text-shield-blue border border-shield-blue/50'
                          : 'bg-shield-gray/50 hover:bg-shield-gray/60 text-gray-300 hover:text-shield-white'
                      }`}
                    >
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm text-gray-400">{category.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Test Results */}
              <div className="bg-shield-gray/30 rounded-xl p-6 border border-gray-700/50">
                <h2 className="text-xl font-semibold mb-4">Test Results</h2>
                <div className="space-y-2 text-sm">
                  <div>Search Query: <span className="text-shield-blue">{searchQuery || 'None'}</span></div>
                  <div>Results: <span className="text-shield-blue">{searchResults.length}</span></div>
                  <div>Category: <span className="text-shield-blue">{selectedCategory || 'None'}</span></div>
                </div>
              </div>
            </div>

            {/* Right Panel - Video Display */}
            <div className="lg:col-span-2">
              <div className="bg-shield-gray/30 rounded-xl p-6 border border-gray-700/50">
                <h2 className="text-xl font-semibold mb-4">Video Display Test</h2>
                
                {searchResults.length > 0 ? (
                  <VideoDisplay
                    videos={searchResults}
                    theme="dark"
                    onVideoSelect={(video) => {
                      console.log('Video selected:', video);
                      alert(`Selected: ${video.title}`);
                    }}
                    showScripture={true}
                  />
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-6xl mb-4">🎬</div>
                    <p className="text-lg mb-2">No videos to display</p>
                    <p className="text-sm">Try searching for a topic or selecting a category</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-shield-gray/30 rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-xl font-semibold mb-4">Testing Instructions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-shield-blue mb-2">1. Search Functionality</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Enter search terms like "resurrection", "evil", "creation"</li>
                  <li>• Click search to see filtered results</li>
                  <li>• Check relevance scoring and filtering</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-shield-blue mb-2">2. Category Testing</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Click on different video categories</li>
                  <li>• Verify category-specific filtering</li>
                  <li>• Test video relevance within categories</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-shield-blue mb-2">3. Video Display</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Check thumbnail loading and fallbacks</li>
                  <li>• Test expandable descriptions</li>
                  <li>• Verify scripture context display</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-shield-blue mb-2">4. Interactive Features</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Test video selection handlers</li>
                  <li>• Check responsive design</li>
                  <li>• Verify accessibility features</li>
                </ul>
              </div>
            </div>
          </div>

          {/* API Status */}
          <div className="mt-8 bg-shield-gray/30 rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-xl font-semibold mb-4">API Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-500/20 rounded-lg border border-green-500/30">
                <div className="text-2xl mb-2">✅</div>
                <div className="font-medium text-green-400">Video Service</div>
                <div className="text-sm text-gray-400">Ready</div>
              </div>
              <div className="text-center p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <div className="text-2xl mb-2">📺</div>
                <div className="font-medium text-blue-400">Video Display</div>
                <div className="text-sm text-gray-400">Ready</div>
              </div>
              <div className="text-center p-4 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                <div className="text-2xl mb-2">🔑</div>
                <div className="font-medium text-yellow-400">YouTube API</div>
                <div className="text-sm text-gray-400">Fallback Mode</div>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-400 text-center">
              Note: Currently using curated fallback videos. Configure YouTube API key for live search.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
