import React, { useState, useRef, useEffect } from 'react';
import { X, Maximize2, Play, ExternalLink, AlertTriangle, Info, Target, Heart, BookOpen } from 'lucide-react';
import { VideoResult } from '../lib/video-service';

export interface EnhancedVideoResult extends VideoResult {
  topics?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  targetAudience?: 'seeker' | 'believer' | 'scholar' | 'general';
  emotionalTone?: 'encouraging' | 'educational' | 'defensive' | 'pastoral';
}

interface EnhancedVideoDisplayProps {
  videos: (VideoResult | EnhancedVideoResult)[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export const EnhancedVideoDisplay: React.FC<EnhancedVideoDisplayProps> = ({
  videos,
  title = "▷ Related Videos & Scripture",
  subtitle,
  className = ""
}) => {
  const [selectedVideo, setSelectedVideo] = useState<(VideoResult | EnhancedVideoResult) | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoAvailability, setVideoAvailability] = useState<Map<string, boolean>>(new Map());
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Check video availability when component mounts
  useEffect(() => {
    if (videos.length > 0) {
      checkVideoAvailability();
    }
  }, [videos]);

  const checkVideoAvailability = async () => {
    setCheckingAvailability(true);
    try {
      // For now, we'll assume all videos are available
      // In a real implementation, you'd call the video service to verify
      const availabilityMap = new Map<string, boolean>();
      videos.forEach(video => {
        availabilityMap.set(video.id, true);
      });
      setVideoAvailability(availabilityMap);
    } catch (error) {
      console.error('Error checking video availability:', error);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handlePlayInline = (video: VideoResult | EnhancedVideoResult) => {
    setSelectedVideo(video);
    setShowVideoModal(true);
    setIframeError(false);
  };

  const closeVideoModal = () => {
    setShowVideoModal(false);
    setSelectedVideo(null);
    setIframeError(false);
  };

  const getYouTubeEmbedUrl = (url: string): string => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
    if (videoId) {
      const params = new URLSearchParams({
        autoplay: '0',
        rel: '0',
        modestbranding: '1',
        enablejsapi: '1',
        origin: window.location.origin,
        widget_referrer: window.location.origin,
        hl: 'en',
        cc_load_policy: '1',
        iv_load_policy: '3',
        fs: '1',
        playsinline: '1',
        showinfo: '0'
      });
      return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
    }
    return url;
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getTargetAudienceIcon = (audience?: string) => {
    switch (audience) {
      case 'seeker': return <BookOpen className="w-4 h-4" />;
      case 'believer': return <Heart className="w-4 h-4" />;
      case 'scholar': return <Target className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getEmotionalToneColor = (tone?: string) => {
    switch (tone) {
      case 'encouraging': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'educational': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'defensive': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'pastoral': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatPublishedDate = (publishedAt: string) => {
    const date = new Date(publishedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  if (!videos || videos.length === 0) {
    return null;
  }

  return (
    <div className={`mt-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
          {videos.length} of {videos.length} videos available
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video, index) => (
          <div
            key={video.id}
            className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-2 transition-all duration-200 hover:shadow-lg ${
              index === 0 ? 'border-blue-500' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-gray-200 dark:bg-gray-700">
              {video.thumbnail && video.thumbnail !== '/placeholder-video.jpg' ? (
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-video.jpg';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-gray-400 dark:text-gray-500 text-6xl">▢</div>
                </div>
              )}
              
              {/* Duration overlay */}
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                {video.duration}
              </div>

              {/* Play button overlay */}
              <button
                onClick={() => handlePlayInline(video)}
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 group"
              >
                <div className="bg-white bg-opacity-90 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Play className="w-6 h-6 text-black" fill="black" />
                </div>
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Title */}
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 mb-2">
                {video.title}
              </h4>

              {/* Channel and published date */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                <span className="truncate">{video.channel}</span>
                <span>{formatPublishedDate(video.publishedAt)}</span>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                {video.description}
              </p>

              {/* Enhanced Metadata */}
              <div className="space-y-2">
                {/* Topics */}
                {video.topics && video.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {video.topics.slice(0, 3).map((topic, idx) => (
                      <span
                        key={idx}
                        className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}

                {/* Difficulty and Target Audience */}
                <div className="flex items-center gap-2">
                  {video.difficulty && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(video.difficulty)}`}>
                      {video.difficulty}
                    </span>
                  )}
                  {video.targetAudience && (
                    <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                      {getTargetAudienceIcon(video.targetAudience)}
                      {video.targetAudience}
                    </span>
                  )}
                </div>

                {/* Emotional Tone */}
                {video.emotionalTone && (
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEmotionalToneColor(video.emotionalTone)}`}>
                    {video.emotionalTone}
                  </span>
                )}
              </div>

              {/* Relevance Score */}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Relevance:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div
                        key={star}
                        className={`w-2 h-2 rounded-full ${
                          star <= Math.ceil(video.relevance * 5) 
                            ? 'bg-yellow-400' 
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.round(video.relevance * 100)}%
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handlePlayInline(video)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <Play className="w-3 h-3" />
                  Play
                </button>
                <button
                  onClick={() => setShowVideoModal(true)}
                  className="bg-gray-600 hover:bg-gray-700 text-white text-xs py-2 px-3 rounded-md transition-colors duration-200"
                  title="Fullscreen"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-600 hover:bg-gray-700 text-white text-xs py-2 px-3 rounded-md transition-colors duration-200"
                  title="Open on YouTube"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Modal */}
      {showVideoModal && selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedVideo.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedVideo.channel} • {selectedVideo.duration}
                </p>
              </div>
              <button
                onClick={closeVideoModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video bg-gray-900">
              {iframeError ? (
                <div className="flex items-center justify-center h-full text-white">
                  <div className="text-center">
                    <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
                    <h4 className="text-xl font-semibold mb-2">Video Unavailable</h4>
                    <p className="text-gray-300 mb-4">This video is unavailable</p>
                    <a
                      href={selectedVideo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Watch on YouTube
                    </a>
                  </div>
                </div>
              ) : (
                <iframe
                  ref={iframeRef}
                  src={getYouTubeEmbedUrl(selectedVideo.url)}
                  title={selectedVideo.title}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  onLoad={() => setIframeError(false)}
                  onError={() => setIframeError(true)}
                />
              )}
            </div>

            {/* Video Details */}
            <div className="p-4">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {selectedVideo.description}
              </p>

              {/* Enhanced Metadata in Modal */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {selectedVideo.difficulty && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Difficulty:</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(selectedVideo.difficulty)}`}>
                      {selectedVideo.difficulty}
                    </span>
                  </div>
                )}
                {selectedVideo.targetAudience && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Target:</span>
                    <span className="ml-2 inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                      {getTargetAudienceIcon(selectedVideo.targetAudience)}
                      {selectedVideo.targetAudience}
                    </span>
                  </div>
                )}
                {selectedVideo.emotionalTone && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Tone:</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEmotionalToneColor(selectedVideo.emotionalTone)}`}>
                      {selectedVideo.emotionalTone}
                    </span>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Relevance:</span>
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    {Math.round(selectedVideo.relevance * 100)}%
                  </span>
                </div>
              </div>

              {/* Topics */}
              {selectedVideo.topics && selectedVideo.topics.length > 0 && (
                <div className="mt-4">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Topics:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedVideo.topics.map((topic, idx) => (
                      <span
                        key={idx}
                        className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-3 py-1 rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
