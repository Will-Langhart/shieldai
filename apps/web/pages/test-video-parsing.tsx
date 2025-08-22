import React, { useState } from 'react';
import { VideoResult } from '../lib/video-service';

export default function TestVideoParsing() {
  const [testData, setTestData] = useState<string>('');
  const [parsedData, setParsedData] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const testVideoData = {
    type: 'video_data',
    videos: [
      {
        id: 'test-1',
        title: 'Test Video 1',
        description: 'This is a test video for debugging',
        thumbnail: '/placeholder-video.jpg',
        url: 'https://www.youtube.com/watch?v=test1',
        duration: '10:00',
        channel: 'Test Channel',
        publishedAt: new Date().toISOString(),
        relevance: 0.9,
        source: 'youtube'
      },
      {
        id: 'test-2',
        title: 'Test Video 2',
        description: 'Another test video for debugging',
        thumbnail: '/placeholder-video.jpg',
        url: 'https://www.youtube.com/watch?v=test2',
        duration: '15:00',
        channel: 'Test Channel 2',
        publishedAt: new Date().toISOString(),
        relevance: 0.8,
        source: 'youtube'
      }
    ],
    bibleVerses: [
      {
        reference: 'John 3:16',
        text: 'For God so loved the world...',
        version: 'NIV'
      }
    ]
  };

  const testStreamParsing = () => {
    try {
      // Simulate the stream format
      const streamChunk = `\nVIDEO_DATA_START\n${JSON.stringify(testVideoData)}\nVIDEO_DATA_END\n`;
      
      // Test the parsing logic from the chat page
      let videoData: any = null;
      
      if (streamChunk.includes('VIDEO_DATA_START') && streamChunk.includes('VIDEO_DATA_END')) {
        const startMarker = 'VIDEO_DATA_START';
        const endMarker = 'VIDEO_DATA_END';
        
        const startIndex = streamChunk.indexOf(startMarker) + startMarker.length;
        const endIndex = streamChunk.indexOf(endMarker);
        
        if (startIndex !== -1 && endIndex !== -1) {
          const jsonStr = streamChunk.substring(startIndex, endIndex).trim();
          console.log('Raw JSON string from stream:', jsonStr);
          videoData = JSON.parse(jsonStr);
          console.log('Successfully parsed video data:', videoData);
          console.log('Video count:', videoData.videos?.length || 0);
          console.log('Bible verses count:', videoData.bibleVerses?.length || 0);
        }
      }
      
      setParsedData(videoData);
      setError('');
      
      if (videoData && videoData.videos && Array.isArray(videoData.videos) && videoData.videos.length > 0) {
        console.log('✅ Parsing successful!');
        console.log('First video structure:', videoData.videos[0]);
      } else {
        console.log('❌ Parsing failed or no videos found');
        console.log('Video data structure:', videoData);
      }
      
    } catch (e) {
      console.error('Test failed:', e);
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Video Data Parsing Test</h1>
        
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Video Data</h2>
          <pre className="bg-gray-700 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(testVideoData, null, 2)}
          </pre>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Stream Parsing</h2>
          <button
            onClick={testStreamParsing}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium"
          >
            Test Parsing Logic
          </button>
          
          {error && (
            <div className="mt-4 p-4 bg-red-900 rounded text-red-200">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {parsedData && (
            <div className="mt-4 p-4 bg-green-900 rounded">
              <strong>✅ Parsing Successful!</strong>
              <div className="mt-2">
                <p>Videos found: {parsedData.videos?.length || 0}</p>
                <p>Bible verses found: {parsedData.bibleVerses?.length || 0}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Parsed Data</h2>
          <pre className="bg-gray-700 p-4 rounded overflow-auto text-sm">
            {parsedData ? JSON.stringify(parsedData, null, 2) : 'No data parsed yet'}
          </pre>
        </div>
        
        <div className="mt-8 text-center text-gray-400">
          <p>This test page helps debug video data parsing from the chat stream.</p>
          <p>Check the browser console for detailed logging.</p>
        </div>
      </div>
    </div>
  );
}
