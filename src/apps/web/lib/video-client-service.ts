import { VideoResult, VideoSearchParams } from './video-service';

export class VideoClientService {
  /**
   * Search for relevant videos from the client side
   */
  static async searchVideos(params: VideoSearchParams): Promise<VideoResult[]> {
    try {
      const response = await fetch('/api/videos/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Video search failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.videos || [];
    } catch (error) {
      console.error('Error searching videos:', error);
      return [];
    }
  }

  /**
   * Search for videos with authentication
   */
  static async searchVideosWithAuth(params: VideoSearchParams, accessToken: string): Promise<VideoResult[]> {
    try {
      const response = await fetch('/api/videos/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Video search failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.videos || [];
    } catch (error) {
      console.error('Error searching videos with auth:', error);
      return [];
    }
  }

  /**
   * Get curated videos for common apologetics topics
   */
  static getCuratedVideos(): VideoResult[] {
    return [
      {
        id: 'curated-1',
        title: 'Evidence for the Resurrection of Jesus Christ',
        description: 'A comprehensive examination of the historical evidence for Jesus\' resurrection, including eyewitness accounts and archaeological findings.',
        thumbnail: 'https://img.youtube.com/vi/7Xr-E7N9eq4/default.jpg',
        url: 'https://www.youtube.com/watch?v=7Xr-E7N9eq4',
        duration: '15:30',
        channel: 'Apologetics Academy',
        publishedAt: '2023-01-01T00:00:00Z',
        relevance: 0.9,
        source: 'youtube'
      },
      {
        id: 'curated-2',
        title: 'The Problem of Evil: A Christian Response',
        description: 'How Christianity addresses the problem of evil and suffering in the world through biblical wisdom and philosophical reasoning.',
        thumbnail: 'https://img.youtube.com/vi/7Xr-E7N9eq4/default.jpg',
        url: 'https://www.youtube.com/watch?v=7Xr-E7N9eq4',
        duration: '12:45',
        channel: 'Theological Defense',
        publishedAt: '2023-02-01T00:00:00Z',
        relevance: 0.85,
        source: 'youtube'
      },
      {
        id: 'curated-3',
        title: 'Scientific Evidence for God\'s Existence',
        description: 'Exploring the fine-tuning of the universe, the origin of life, and other scientific evidence that points to intelligent design.',
        thumbnail: 'https://img.youtube.com/vi/7Xr-E7N9eq4/default.jpg',
        url: 'https://www.youtube.com/watch?v=7Xr-E7N9eq4',
        duration: '18:20',
        channel: 'Science and Faith',
        publishedAt: '2023-03-01T00:00:00Z',
        relevance: 0.8,
        source: 'youtube'
      },
      {
        id: 'curated-4',
        title: 'Biblical Archaeology: Evidence for the Bible',
        description: 'Archaeological discoveries that support the historical accuracy of biblical accounts and events.',
        thumbnail: 'https://img.youtube.com/vi/7Xr-E7N9eq4/default.jpg',
        url: 'https://www.youtube.com/watch?v=7Xr-E7N9eq4',
        duration: '22:15',
        channel: 'Biblical Archaeology Society',
        publishedAt: '2023-04-01T00:00:00Z',
        relevance: 0.75,
        source: 'youtube'
      },
      {
        id: 'curated-5',
        title: 'Philosophical Arguments for God',
        description: 'Classical philosophical arguments including the cosmological, teleological, and moral arguments for God\'s existence.',
        thumbnail: 'https://img.youtube.com/vi/7Xr-E7N9eq4/default.jpg',
        url: 'https://www.youtube.com/watch?v=7Xr-E7N9eq4',
        duration: '16:40',
        channel: 'Philosophy of Religion',
        publishedAt: '2023-05-01T00:00:00Z',
        relevance: 0.7,
        source: 'youtube'
      }
    ];
  }

  /**
   * Filter videos by topic relevance
   */
  static filterVideosByTopic(videos: VideoResult[], topic: string): VideoResult[] {
    const lowerTopic = topic.toLowerCase();
    
    return videos.filter(video => {
      const videoText = `${video.title} ${video.description}`.toLowerCase();
      const topicWords = lowerTopic.split(' ');
      
      // Check if any topic words appear in the video content
      return topicWords.some(word => videoText.includes(word));
    });
  }

  /**
   * Sort videos by relevance score
   */
  static sortVideosByRelevance(videos: VideoResult[]): VideoResult[] {
    return [...videos].sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Get video categories for organization
   */
  static getVideoCategories(): { id: string; name: string; description: string }[] {
    return [
      {
        id: 'resurrection',
        name: 'Resurrection Evidence',
        description: 'Historical and archaeological evidence for Jesus\' resurrection'
      },
      {
        id: 'problem-of-evil',
        name: 'Problem of Evil',
        description: 'Christian responses to suffering and evil in the world'
      },
      {
        id: 'creation-science',
        name: 'Creation & Science',
        description: 'Scientific evidence for intelligent design and creation'
      },
      {
        id: 'biblical-archaeology',
        name: 'Biblical Archaeology',
        description: 'Archaeological discoveries supporting biblical accounts'
      },
      {
        id: 'philosophy',
        name: 'Philosophical Arguments',
        description: 'Classical philosophical arguments for God\'s existence'
      },
      {
        id: 'apologetics-basics',
        name: 'Apologetics Basics',
        description: 'Fundamental principles of Christian apologetics'
      }
    ];
  }

  /**
   * Get videos by category
   */
  static getVideosByCategory(categoryId: string): VideoResult[] {
    const curatedVideos = this.getCuratedVideos();
    
    switch (categoryId) {
      case 'resurrection':
        return curatedVideos.filter(v => v.title.toLowerCase().includes('resurrection'));
      case 'problem-of-evil':
        return curatedVideos.filter(v => v.title.toLowerCase().includes('evil'));
      case 'creation-science':
        return curatedVideos.filter(v => v.title.toLowerCase().includes('science') || v.title.toLowerCase().includes('creation'));
      case 'biblical-archaeology':
        return curatedVideos.filter(v => v.title.toLowerCase().includes('archaeology') || v.title.toLowerCase().includes('biblical'));
      case 'philosophy':
        return curatedVideos.filter(v => v.title.toLowerCase().includes('philosophical') || v.title.toLowerCase().includes('philosophy'));
      case 'apologetics-basics':
        return curatedVideos.filter(v => v.title.toLowerCase().includes('apologetics') || v.title.toLowerCase().includes('basics'));
      default:
        return curatedVideos;
    }
  }
}
