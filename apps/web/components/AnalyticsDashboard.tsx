import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen, 
  MessageSquare, 
  Heart, 
  Target, 
  Award,
  Calendar,
  Clock,
  MapPin,
  Star
} from 'lucide-react';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalConversations: number;
  totalMessages: number;
  averageSessionLength: number;
  topQuestions: Array<{ question: string; count: number }>;
  objectionTypes: Array<{ type: string; count: number; percentage: number }>;
  bibleSearches: number;
  churchSearches: number;
  moodVerseUsage: number;
  userGrowth: Array<{ date: string; users: number }>;
  engagementByHour: Array<{ hour: number; messages: number }>;
  topBibleVerses: Array<{ reference: string; usage: number }>;
  userSatisfaction: number;
  conversionRate: number;
}

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
  data?: AnalyticsData;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  isOpen, 
  onClose, 
  theme = 'dark',
  data 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'engagement' | 'content' | 'growth'>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const mockData: AnalyticsData = {
    totalUsers: 1247,
    activeUsers: 892,
    totalConversations: 3456,
    totalMessages: 12893,
    averageSessionLength: 23.5,
    topQuestions: [
      { question: "How do I know God exists?", count: 156 },
      { question: "What about the problem of evil?", count: 134 },
      { question: "Is the Bible reliable?", count: 98 },
      { question: "How can I share my faith?", count: 87 },
      { question: "What about other religions?", count: 76 }
    ],
    objectionTypes: [
      { type: 'Logical', count: 234, percentage: 35 },
      { type: 'Moral', count: 189, percentage: 28 },
      { type: 'Scientific', count: 145, percentage: 22 },
      { type: 'Historical', count: 67, percentage: 10 },
      { type: 'Emotional', count: 34, percentage: 5 }
    ],
    bibleSearches: 892,
    churchSearches: 234,
    moodVerseUsage: 567,
    userGrowth: [
      { date: '2024-01', users: 100 },
      { date: '2024-02', users: 150 },
      { date: '2024-03', users: 220 },
      { date: '2024-04', users: 310 },
      { date: '2024-05', users: 450 },
      { date: '2024-06', users: 650 },
      { date: '2024-07', users: 890 },
      { date: '2024-08', users: 1247 }
    ],
    engagementByHour: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      messages: Math.floor(Math.random() * 100) + 10
    })),
    topBibleVerses: [
      { reference: 'John 3:16', usage: 89 },
      { reference: 'Romans 8:28', usage: 67 },
      { reference: 'Philippians 4:13', usage: 54 },
      { reference: 'Psalm 23:1', usage: 43 },
      { reference: 'Jeremiah 29:11', usage: 38 }
    ],
    userSatisfaction: 4.7,
    conversionRate: 23.4
  };

  const analyticsData = data || mockData;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'engagement', label: 'Engagement', icon: TrendingUp },
    { id: 'content', label: 'Content', icon: BookOpen },
    { id: 'growth', label: 'Growth', icon: Users }
  ];

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-lg border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Total Users</p>
              <p className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>{analyticsData.totalUsers.toLocaleString()}</p>
            </div>
            <Users className={`w-8 h-8 ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`} />
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Active Users</p>
              <p className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>{analyticsData.activeUsers.toLocaleString()}</p>
            </div>
            <TrendingUp className={`w-8 h-8 ${
              theme === 'dark' ? 'text-green-400' : 'text-green-600'
            }`} />
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Conversations</p>
              <p className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>{analyticsData.totalConversations.toLocaleString()}</p>
            </div>
            <MessageSquare className={`w-8 h-8 ${
              theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
            }`} />
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Satisfaction</p>
              <p className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>{analyticsData.userSatisfaction}/5.0</p>
            </div>
            <Star className={`w-8 h-8 ${
              theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
            }`} />
          </div>
        </div>
      </div>

      {/* Engagement Chart */}
      <div className={`p-6 rounded-lg border ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>Engagement by Hour</h3>
        <div className="flex items-end space-x-1 h-32">
          {analyticsData.engagementByHour.map((hour, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className={`w-full rounded-t ${
                  theme === 'dark' ? 'bg-blue-500' : 'bg-blue-600'
                }`}
                style={{ height: `${(hour.messages / 100) * 100}%` }}
              />
              <span className={`text-xs mt-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>{hour.hour}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEngagementTab = () => (
    <div className="space-y-6">
      {/* Objection Types */}
      <div className={`p-6 rounded-lg border ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>Objection Types</h3>
        <div className="space-y-3">
          {analyticsData.objectionTypes.map((objection, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className={`font-medium ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>{objection.type}</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      theme === 'dark' ? 'bg-blue-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${objection.percentage}%` }}
                  />
                </div>
                <span className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>{objection.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Questions */}
      <div className={`p-6 rounded-lg border ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>Top Questions</h3>
        <div className="space-y-3">
          {analyticsData.topQuestions.map((question, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>{question.question}</span>
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>{question.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContentTab = () => (
    <div className="space-y-6">
      {/* Feature Usage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-lg border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <BookOpen className={`w-6 h-6 ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <div>
              <p className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Bible Searches</p>
              <p className={`text-xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>{analyticsData.bibleSearches}</p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <MapPin className={`w-6 h-6 ${
              theme === 'dark' ? 'text-green-400' : 'text-green-600'
            }`} />
            <div>
              <p className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Church Searches</p>
              <p className={`text-xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>{analyticsData.churchSearches}</p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <Heart className={`w-6 h-6 ${
              theme === 'dark' ? 'text-pink-400' : 'text-pink-600'
            }`} />
            <div>
              <p className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Mood Verses</p>
              <p className={`text-xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>{analyticsData.moodVerseUsage}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Bible Verses */}
      <div className={`p-6 rounded-lg border ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>Most Referenced Verses</h3>
        <div className="space-y-3">
          {analyticsData.topBibleVerses.map((verse, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className={`font-medium ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>{verse.reference}</span>
              <span className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>{verse.usage} times</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderGrowthTab = () => (
    <div className="space-y-6">
      {/* User Growth Chart */}
      <div className={`p-6 rounded-lg border ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>User Growth</h3>
        <div className="flex items-end space-x-2 h-32">
          {analyticsData.userGrowth.map((month, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className={`w-full rounded-t ${
                  theme === 'dark' ? 'bg-green-500' : 'bg-green-600'
                }`}
                style={{ height: `${(month.users / 1247) * 100}%` }}
              />
              <span className={`text-xs mt-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>{month.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Conversion Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-4 rounded-lg border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <Target className={`w-6 h-6 ${
              theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
            }`} />
            <div>
              <p className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Conversion Rate</p>
              <p className={`text-xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>{analyticsData.conversionRate}%</p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <Clock className={`w-6 h-6 ${
              theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
            }`} />
            <div>
              <p className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Avg Session</p>
              <p className={`text-xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>{analyticsData.averageSessionLength}m</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-7xl mx-4 rounded-2xl shadow-2xl overflow-y-auto max-h-[95vh] ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Analytics Dashboard</h2>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Ministry insights and user engagement metrics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-4 transition-colors ${
                  isActive
                    ? theme === 'dark'
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-blue-600 border-b-2 border-blue-600'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-gray-600 hover:text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'engagement' && renderEngagementTab()}
          {activeTab === 'content' && renderContentTab()}
          {activeTab === 'growth' && renderGrowthTab()}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 