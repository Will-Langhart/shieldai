import React, { useState } from 'react';
import EnhancedLoadingIndicator from '../components/EnhancedLoadingIndicator';
import EnhancedStreamingText from '../components/EnhancedStreamingText';

export default function TestEnhancedLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const sampleContent = `**Biblical Foundation:**
From Scripture, we find that God's love is the foundation of all creation. As John 3:16 states, "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."

**Addressing the Core Issue:**
The question of God's existence is fundamental to human experience. Throughout history, people have sought to understand the divine through various means - philosophy, science, and personal experience.

**Consider Objections:**
It's important to acknowledge that many intelligent people have different perspectives on this matter. Some find the evidence compelling, while others remain unconvinced.

**Encourage Further Study:**
I'd encourage you to explore the works of C.S. Lewis, William Lane Craig, and other Christian apologists who have thoughtfully addressed these questions.`;

  const handleTestLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 8000); // 8 seconds
  };

  const handleTestStreaming = () => {
    setIsStreaming(true);
    setStreamingContent('');
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < sampleContent.length) {
        setStreamingContent(sampleContent.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsStreaming(false);
      }
    }, 50); // Fast streaming for demo
  };

  return (
    <div className={`min-h-screen p-8 ${theme === 'dark' ? 'bg-shield-black text-shield-white' : 'bg-white text-gray-900'}`}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Enhanced Loading States Demo</h1>
        
        {/* Theme Toggle */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'bg-shield-blue text-white hover:bg-blue-600' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Switch to {theme === 'dark' ? 'Light' : 'Dark'} Theme
          </button>
        </div>

        {/* Test Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={handleTestLoading}
            disabled={isLoading}
            className={`p-4 rounded-lg font-medium transition-all ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : theme === 'dark'
                  ? 'bg-shield-blue hover:bg-blue-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isLoading ? 'Loading...' : '🚀 Test Enhanced Loading'}
          </button>

          <button
            onClick={handleTestStreaming}
            disabled={isStreaming}
            className={`p-4 rounded-lg font-medium transition-all ${
              isStreaming
                ? 'bg-gray-400 cursor-not-allowed'
                : theme === 'dark'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isStreaming ? 'Streaming...' : '📝 Test Enhanced Streaming'}
          </button>
        </div>

        {/* Loading Indicator Demo */}
        {isLoading && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Enhanced Loading Indicator</h2>
            <EnhancedLoadingIndicator
              theme={theme}
              message="Shield AI is analyzing your question and preparing a thoughtful response..."
              showProgress={true}
              variant="thinking"
            />
          </div>
        )}

        {/* Streaming Text Demo */}
        {isStreaming && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Enhanced Streaming Text</h2>
            <div className={`p-6 rounded-2xl border ${
              theme === 'dark' 
                ? 'bg-shield-gray border-gray-700/50' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <EnhancedStreamingText
                content={streamingContent}
                theme={theme}
                isStreaming={isStreaming}
                showTypingIndicator={true}
              />
            </div>
          </div>
        )}

        {/* Different Loading Variants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-lg font-semibold mb-3">Analyzing Variant</h3>
            <EnhancedLoadingIndicator
              theme={theme}
              message="Analyzing your question..."
              showProgress={true}
              variant="analyzing"
            />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Writing Variant</h3>
            <EnhancedLoadingIndicator
              theme={theme}
              message="Writing response..."
              showProgress={true}
              variant="writing"
            />
          </div>
        </div>

        {/* Features Overview */}
        <div className={`p-6 rounded-2xl border ${
          theme === 'dark' 
            ? 'bg-shield-gray border-gray-700/50' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <h2 className="text-xl font-semibold mb-4">Enhanced Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">🎨 Visual Enhancements</h4>
              <ul className="text-sm space-y-1">
                <li>• Smooth animations and transitions</li>
                <li>• Progress bars with gradient effects</li>
                <li>• Phase indicators showing AI progress</li>
                <li>• Enhanced loading dots with delays</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">🚀 User Experience</h4>
              <ul className="text-sm space-y-1">
                <li>• Real-time progress tracking</li>
                <li>• Adaptive streaming speeds</li>
                <li>• Contextual status messages</li>
                <li>• Smooth auto-scrolling</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">⚡ Performance</h4>
              <ul className="text-sm space-y-1">
                <li>• Optimized animations</li>
                <li>• Efficient state management</li>
                <li>• Responsive design</li>
                <li>• Cross-browser compatibility</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">🎯 Accessibility</h4>
              <ul className="text-sm space-y-1">
                <li>• High contrast themes</li>
                <li>• Screen reader friendly</li>
                <li>• Keyboard navigation</li>
                <li>• Reduced motion support</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center text-sm opacity-75">
          <p>Click the buttons above to test the enhanced loading states and streaming text.</p>
          <p>The loading indicator shows different phases and progress, while streaming text demonstrates real-time text animation.</p>
        </div>
      </div>
    </div>
  );
}
