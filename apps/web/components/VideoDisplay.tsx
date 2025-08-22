import React, { useState } from 'react';
import { Play, ExternalLink, Clock, User, Calendar, BookOpen, Eye, EyeOff } from 'lucide-react';
import { VideoResult } from '../lib/video-service';

interface VideoDisplayProps {
  videos: VideoResult[];
  theme?: 'light' | 'dark';
  className?: string;
  onVideoSelect?: (video: VideoResult) => void;
  showScripture?: boolean;
}

const VideoDisplay: React.FC<VideoDisplayProps> = ({
  videos,
  theme = 'dark',
  className = '',
  onVideoSelect,
  showScripture = true
}) => {
  const [expandedVideos, setExpandedVideos] = useState<Set<string>>(new Set());
  const [showAllVideos, setShowAllVideos] = useState(false);

  if (!videos || videos.length === 0) {
    return null;
  }

  const displayedVideos = showAllVideos ? videos : videos.slice(0, 3);
  const hasMoreVideos = videos.length > 3;

  const toggleVideoExpansion = (videoId: string) => {
    const newExpanded = new Set(expandedVideos);
    if (newExpanded.has(videoId)) {
      newExpanded.delete(videoId);
    } else {
      newExpanded.add(videoId);
    }
    setExpandedVideos(newExpanded);
  };

  const handleVideoClick = (video: VideoResult) => {
    if (onVideoSelect) {
      onVideoSelect(video);
    } else {
      // Default behavior: open in new tab
      window.open(video.url, '_blank', 'noopener,noreferrer');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 0.8) return 'text-green-400';
    if (relevance >= 0.6) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getRelevanceText = (relevance: number) => {
    if (relevance >= 0.8) return 'Highly Relevant';
    if (relevance >= 0.6) return 'Relevant';
    return 'Somewhat Relevant';
  };

  return (
    <div className={`video-display ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Play className={`w-5 h-5 ${theme === 'dark' ? 'text-shield-blue' : 'text-blue-600'}`} />
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-shield-white' : 'text-gray-900'}`}>
            Related Videos & Scripture
          </h3>
          <span className={`text-sm px-2 py-1 rounded-full ${
            theme === 'dark' ? 'bg-shield-blue/20 text-shield-blue' : 'bg-blue-100 text-blue-700'
          }`}>
            {videos.length} found
          </span>
        </div>
        
        {hasMoreVideos && (
          <button
            onClick={() => setShowAllVideos(!showAllVideos)}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              theme === 'dark'
                ? 'text-gray-300 hover:text-shield-white hover:bg-shield-gray/50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {showAllVideos ? (
              <>
                <EyeOff size={16} />
                <span>Show Less</span>
              </>
            ) : (
              <>
                <Eye size={16} />
                <span>Show All</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedVideos.map((video, index) => (
          <div
            key={video.id}
            className={`video-card rounded-xl overflow-hidden border transition-all duration-300 hover:shadow-lg ${
              theme === 'dark'
                ? 'bg-shield-gray/30 border-gray-700/50 hover:border-shield-blue/50'
                : 'bg-white border-gray-200 hover:border-blue-300'
            } ${className}`}
          >
            {/* Thumbnail */}
            <div className="relative group cursor-pointer" onClick={() => handleVideoClick(video)}>
              <img
                src={video.thumbnail || '/placeholder-video.jpg'}
                alt={video.title}
                className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-video.jpg';
                }}
              />
              
              {/* Play Button Overlay */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className={`w-16 h-16 rounded-full bg-shield-blue/90 flex items-center justify-center`}>
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
              </div>
              
              {/* Duration Badge */}
              <div className={`absolute bottom-2 right-2 px-2 py-1 rounded text-xs font-medium ${
                theme === 'dark' ? 'bg-black/70 text-white' : 'bg-white/90 text-gray-900'
              }`}>
                {video.duration}
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Title */}
              <h4 
                className={`font-semibold text-sm leading-tight mb-2 cursor-pointer hover:underline ${
                  theme === 'dark' ? 'text-shield-white' : 'text-gray-900'
                }`}
                onClick={() => handleVideoClick(video)}
              >
                {video.title}
              </h4>

              {/* Channel and Date */}
              <div className="flex items-center justify-between text-xs mb-3">
                <div className={`flex items-center space-x-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  <User size={12} />
                  <span className="truncate max-w-24">{video.channel}</span>
                </div>
                <div className={`flex items-center space-x-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Calendar size={12} />
                  <span>{formatDate(video.publishedAt)}</span>
                </div>
              </div>

              {/* Relevance Score */}
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-medium ${getRelevanceColor(video.relevance)}`}>
                  {getRelevanceText(video.relevance)}
                </span>
                <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {Math.round(video.relevance * 100)}% match
                </span>
              </div>

              {/* Description Preview */}
              <div className={`text-xs leading-relaxed mb-3 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {expandedVideos.has(video.id) 
                  ? video.description 
                  : `${video.description.substring(0, 100)}${video.description.length > 100 ? '...' : ''}`
                }
                
                {video.description.length > 100 && (
                  <button
                    onClick={() => toggleVideoExpansion(video.id)}
                    className={`ml-1 font-medium hover:underline ${
                      theme === 'dark' ? 'text-shield-blue' : 'text-blue-600'
                    }`}
                  >
                    {expandedVideos.has(video.id) ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>

              {/* Scripture Context */}
              {showScripture && video.description.includes('Related Scripture:') && (
                <div className={`mt-3 p-3 rounded-lg ${
                  theme === 'dark' ? 'bg-shield-blue/10 border border-shield-blue/20' : 'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <BookOpen size={14} className={theme === 'dark' ? 'text-shield-blue' : 'text-blue-600'} />
                    <span className={`text-xs font-medium ${theme === 'dark' ? 'text-shield-blue' : 'text-blue-700'}`}>
                      Related Scripture
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {video.description.split('Related Scripture:')[1]}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200/20">
                <button
                  onClick={() => handleVideoClick(video)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    theme === 'dark'
                      ? 'bg-shield-blue/20 text-shield-blue hover:bg-shield-blue/30'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  <Play size={14} />
                  <span>Watch</span>
                </button>
                
                <button
                  onClick={() => window.open(video.url, '_blank', 'noopener,noreferrer')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:text-shield-white hover:bg-shield-gray/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <ExternalLink size={14} />
                  <span>Open</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Videos Message */}
      {videos.length === 0 && (
        <div className={`text-center py-8 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          <Play className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No relevant videos found for this topic.</p>
          <p className="text-sm mt-1">Try rephrasing your question or check back later.</p>
        </div>
      )}
    </div>
  );
};

export default VideoDisplay;
