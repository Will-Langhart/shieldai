import React, { useState, useEffect, useRef } from 'react';
import { Shield, Sparkles, BookOpen } from 'lucide-react';

interface EnhancedStreamingTextProps {
  content: string;
  theme?: 'light' | 'dark';
  isStreaming?: boolean;
  showTypingIndicator?: boolean;
  className?: string;
}

const EnhancedStreamingText: React.FC<EnhancedStreamingTextProps> = ({
  content,
  theme = 'light',
  isStreaming = false,
  showTypingIndicator = true,
  className = ''
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedContent(content);
      setCurrentCharIndex(content.length);
      return;
    }

    setIsAnimating(true);
    setCurrentCharIndex(0);
    setDisplayedContent('');

    const animationSpeed = Math.max(15, Math.min(40, 2000 / content.length)); // Adaptive speed
    
    const timer = setInterval(() => {
      setCurrentCharIndex(prev => {
        if (prev >= content.length) {
          clearInterval(timer);
          setIsAnimating(false);
          return content.length;
        }
        const newIndex = prev + 1;
        setDisplayedContent(content.slice(0, newIndex));
        return newIndex;
      });
    }, animationSpeed);

    return () => clearInterval(timer);
  }, [content, isStreaming]);

  // Auto-scroll to bottom during streaming
  useEffect(() => {
    if (isStreaming && contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [displayedContent, isStreaming]);

  const renderContent = (text: string) => {
    // Simple markdown parsing for basic formatting
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-semibold text-shield-blue">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
        return (
          <em key={index} className="italic">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className={`px-2 py-1 rounded text-sm ${
            theme === 'dark' ? 'bg-gray-800 text-green-400' : 'bg-gray-100 text-green-700'
          }`}>
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const getStreamingVariant = () => {
    if (currentCharIndex < content.length * 0.3) return 'analyzing';
    if (currentCharIndex < content.length * 0.7) return 'thinking';
    return 'writing';
  };

  const streamingVariant = getStreamingVariant();
  const progress = (currentCharIndex / content.length) * 100;

  return (
    <div className={`relative w-full ${className}`}>
      {/* Streaming Progress Indicator */}
      {isStreaming && (
        <div className="mb-3">
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
              theme === 'dark' ? 'bg-shield-blue/20' : 'bg-blue-100'
            }`}>
              {streamingVariant === 'analyzing' && <Sparkles className="w-3 h-3 text-shield-blue" />}
              {streamingVariant === 'thinking' && <Shield className="w-3 h-3 text-shield-blue" />}
              {streamingVariant === 'writing' && <BookOpen className="w-3 h-3 text-shield-blue" />}
            </div>
            <span className={`text-xs font-medium ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {streamingVariant === 'analyzing' && 'Analyzing question...'}
              {streamingVariant === 'thinking' && 'Searching database & videos...'}
              {streamingVariant === 'writing' && 'Formulating response...'}
            </span>
            <span className={`text-xs ${
              theme === 'dark' ? 'text-shield-blue' : 'text-blue-600'
            }`}>
              {Math.round(progress)}%
            </span>
          </div>
          <div className={`w-full h-1 rounded-full overflow-hidden ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <div 
              className={`h-full rounded-full enhanced-progress transition-all duration-300 ease-out`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Content Display - No box outline, full width */}
      <div 
        ref={contentRef}
        className={`text-sm sm:text-base leading-relaxed w-full ${
          theme === 'dark' ? 'text-shield-white' : 'text-gray-900'
        } ${isAnimating ? 'fade-in-up' : ''}`}
      >
        {renderContent(displayedContent)}
        
        {/* Typing Indicator */}
        {isStreaming && showTypingIndicator && (
          <span className={`inline-block ml-1 text-shield-blue animate-pulse ${
            isAnimating ? 'opacity-100' : 'opacity-0'
          } transition-opacity duration-300`}>
            |
          </span>
        )}
      </div>

      {/* Streaming Status */}
      {isStreaming && (
        <div className="mt-3 pt-2 border-t border-gray-700/30 dark:border-gray-200/30">
          <div className="flex items-center space-x-3 text-xs">
            <div className={`flex items-center space-x-1 ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                theme === 'dark' ? 'bg-shield-blue' : 'bg-blue-600'
              } animate-pulse`}></div>
              <span>Shield AI is thinking...</span>
            </div>
            <div className={`flex items-center space-x-1 ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                theme === 'dark' ? 'bg-green-500' : 'bg-green-600'
              } animate-pulse`}></div>
              <span>{currentCharIndex} characters</span>
            </div>
            <div className={`flex items-center space-x-1 ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                theme === 'dark' ? 'bg-yellow-500' : 'bg-yellow-600'
              } animate-pulse`}></div>
              <span>Searching videos & scripture</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedStreamingText;
