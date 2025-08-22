import React, { useState, useEffect } from 'react';
import { Play, ExternalLink, Clock, User, Calendar, BookOpen, Eye, EyeOff, X, Maximize2, AlertTriangle } from 'lucide-react';
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
  const [selectedVideo, setSelectedVideo] = useState<VideoResult | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoAvailability, setVideoAvailability] = useState<Map<string, boolean>>(new Map());
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Check video availability when videos change
  useEffect(() => {
    if (videos && videos.length > 0) {
      checkVideoAvailability();
    }
  }, [videos]);

  const checkVideoAvailability = async () => {
    setCheckingAvailability(true);
    try {
      // Import the video service dynamically to avoid SSR issues
      const { VideoService } = await import('../lib/video-service');
      const videoIds = videos.map(v => v.id);
      const availability = await VideoService.verifyMultipleVideosAvailability(videoIds);
      setVideoAvailability(availability);
    } catch (error) {
      console.error('Failed to check video availability:', error);
      // Assume all videos are available if check fails
      const availability = new Map(videos.map(v => [v.id, true]));
      setVideoAvailability(availability);
    } finally {
      setCheckingAvailability(false);
    }
  };

  if (!videos || videos.length === 0) {
    return null;
  }

  // Filter out unavailable videos
  const availableVideos = videos.filter(video => videoAvailability.get(video.id) !== false);
  const displayedVideos = showAllVideos ? availableVideos : availableVideos.slice(0, 3);
  const hasMoreVideos = availableVideos.length > 3;

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
      // Open video in modal for inline viewing
      setSelectedVideo(video);
      setShowVideoModal(true);
    }
  };

  const handlePlayInline = (video: VideoResult) => {
    setSelectedVideo(video);
    setShowVideoModal(true);
  };

  const closeVideoModal = () => {
    setShowVideoModal(false);
    setSelectedVideo(null);
  };

  const getYouTubeEmbedUrl = (url: string) => {
    // Handle different YouTube URL formats
    let videoId = null;
    
    // youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (watchMatch) {
      videoId = watchMatch[1];
    }
    
    // youtube.com/embed/VIDEO_ID
    const embedMatch = url.match(/youtube\.com\/embed\/([^&\n?#]+)/);
    if (embedMatch) {
      videoId = embedMatch[1];
    }
    
    // youtube.com/v/VIDEO_ID
    const vMatch = url.match(/youtube\.com\/v\/([^&\n?#]+)/);
    if (vMatch) {
      videoId = vMatch[1];
    }
    
    if (videoId) {
      // Use enhanced embed parameters for better compatibility
      return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
    }
    
    // Fallback to original URL if we can't parse it
    return url;
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
          {checkingAvailability && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              <span>Verifying availability...</span>
            </div>
          )}
        </div>
        
        {/* Availability Status */}
        <div className="flex items-center space-x-2 text-sm">
          <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {availableVideos.length} of {videos.length} videos available
          </span>
          {availableVideos.length < videos.length && (
            <div className="flex items-center space-x-1 text-yellow-500">
              <AlertTriangle size={14} />
              <span>Some videos unavailable</span>
            </div>
          )}
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

      {/* No Videos Message */}
      {availableVideos.length === 0 && !checkingAvailability && (
        <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          <Play className="w-12 h-12 mx-auto mb-3 opacity-50" />
          {videos.length === 0 ? (
            <>
              <p>No relevant videos found for this topic.</p>
              <p className="text-sm mt-1">Try rephrasing your question or check back later.</p>
            </>
          ) : (
            <>
              <p>All found videos are currently unavailable.</p>
              <p className="text-sm mt-1">This can happen when videos are removed, made private, or blocked in your region.</p>
              <p className="text-sm mt-2">Try asking a different question or check back later for new content.</p>
            </>
          )}
        </div>
      )}

      {/* Videos Grid */}
      {availableVideos.length > 0 && (
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
            <div className="relative group">
              <img
                src={video.thumbnail || '/placeholder-video.jpg'}
                alt={video.title}
                className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  console.warn(`Failed to load thumbnail for video: ${video.title}`, video.thumbnail);
                  target.src = '/placeholder-video.jpg';
                }}
                onLoad={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.opacity = '1';
                }}
                style={{ opacity: 0 }}
              />
              
              {/* Play Button Overlay */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className={`w-16 h-16 rounded-full bg-shield-blue/90 flex items-center justify-center cursor-pointer`} onClick={() => handlePlayInline(video)}>
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
              </div>
              
              {/* Duration Badge */}
              <div className={`absolute bottom-2 right-2 px-2 py-1 rounded text-xs font-medium ${
                theme === 'dark' ? 'bg-black/70 text-white' : 'bg-white/90 text-gray-900'
              }`}>
                {video.duration}
              </div>

              {/* Inline Play Button */}
              <button
                onClick={() => handlePlayInline(video)}
                className="absolute top-2 right-2 w-8 h-8 bg-shield-blue/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                <Play className="w-4 h-4 text-white ml-0.5" />
              </button>
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
                <div className="flex items-center space-x-2">
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {Math.round(video.relevance * 100)}% match
                  </span>
                  {/* Availability Badge */}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    videoAvailability.get(video.id) === false
                      ? 'bg-red-100 text-red-700'
                      : videoAvailability.get(video.id) === true
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {videoAvailability.get(video.id) === false
                      ? 'Unavailable'
                      : videoAvailability.get(video.id) === true
                      ? 'Available'
                      : 'Checking...'}
                  </span>
                </div>
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
                  onClick={() => handlePlayInline(video)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    theme === 'dark'
                      ? 'bg-shield-blue/20 text-shield-blue hover:bg-shield-blue/30'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  <Play size={14} />
                  <span>Play</span>
                </button>
                
                <button
                  onClick={() => handleVideoClick(video)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    theme === 'dark'
                      ? 'bg-shield-blue/20 text-shield-blue hover:bg-shield-blue/30'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  <Maximize2 size={14} />
                  <span>Fullscreen</span>
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
      )}

      {/* Video Modal */}
      {showVideoModal && selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closeVideoModal}
          />
          
          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-4xl mx-auto">
            <div className={`rounded-xl overflow-hidden shadow-2xl ${
              theme === 'dark' ? 'bg-shield-gray border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700/30">
                <div className="flex-1 min-w-0">
                  <h3 className={`text-lg font-semibold truncate ${
                    theme === 'dark' ? 'text-shield-white' : 'text-gray-900'
                  }`}>
                    {selectedVideo.title}
                  </h3>
                  <p className={`text-sm mt-1 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {selectedVideo.channel} • {selectedVideo.duration}
                  </p>
                </div>
                <button
                  onClick={closeVideoModal}
                  className={`p-2 rounded-lg hover:bg-gray-700/30 transition-colors ${
                    theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Video Player */}
              <div className="relative w-full aspect-video bg-black">
                <iframe
                  src={getYouTubeEmbedUrl(selectedVideo.url)}
                  title={selectedVideo.title}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onError={(e) => {
                    console.error('Video iframe failed to load:', e);
                  }}
                />
                {/* Fallback message if video fails */}
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white hidden" id="video-fallback">
                  <div className="text-center">
                    <p className="mb-2">Video unavailable</p>
                    <button
                      onClick={() => window.open(selectedVideo.url, '_blank', 'noopener,noreferrer')}
                      className="px-4 py-2 bg-shield-blue rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Watch on YouTube
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Video Info */}
              <div className="p-4">
                <p className={`text-sm leading-relaxed ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {selectedVideo.description}
                </p>
                
                {/* Additional Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700/30">
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      theme === 'dark' ? 'bg-shield-blue/20 text-shield-blue' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {Math.round(selectedVideo.relevance * 100)}% relevant
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedVideo.source}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => window.open(selectedVideo.url, '_blank', 'noopener,noreferrer')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      theme === 'dark'
                        ? 'bg-shield-blue/20 text-shield-blue hover:bg-shield-blue/30'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    <ExternalLink size={14} />
                    <span>Open on YouTube</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoDisplay;
