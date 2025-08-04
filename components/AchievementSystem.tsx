import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Star, 
  Zap, 
  BookOpen, 
  Users, 
  Target, 
  TrendingUp, 
  Award,
  Crown,
  Shield,
  Heart,
  MessageSquare,
  Calendar,
  CheckCircle,
  Lock
} from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'apologetics' | 'theology' | 'scripture' | 'community' | 'streak';
  points: number;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  color: string;
}

interface UserProgress {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
  achievementsUnlocked: number;
  totalAchievements: number;
  streakDays: number;
  conversationsCompleted: number;
  versesReferenced: number;
}

interface AchievementSystemProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
  userProgress?: UserProgress;
}

const AchievementSystem: React.FC<AchievementSystemProps> = ({ 
  isOpen, 
  onClose, 
  theme = 'dark',
  userProgress 
}) => {
  const [activeTab, setActiveTab] = useState<'achievements' | 'progress' | 'leaderboard'>('achievements');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock achievements data
  const achievements: Achievement[] = [
    {
      id: 'apologist_badge',
      name: 'Apologist Badge',
      description: 'Complete 50 apologetics conversations',
      icon: <Shield className="w-6 h-6" />,
      category: 'apologetics',
      points: 100,
      progress: 35,
      maxProgress: 50,
      unlocked: false,
      rarity: 'rare',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'theologian_level',
      name: 'Theologian Level',
      description: 'Deep dive into 10 theological topics',
      icon: <BookOpen className="w-6 h-6" />,
      category: 'theology',
      points: 150,
      progress: 7,
      maxProgress: 10,
      unlocked: false,
      rarity: 'epic',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'scripture_scholar',
      name: 'Scripture Scholar',
      description: 'Reference 100 Bible verses',
      icon: <Star className="w-6 h-6" />,
      category: 'scripture',
      points: 200,
      progress: 67,
      maxProgress: 100,
      unlocked: false,
      rarity: 'legendary',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      id: 'witness_warrior',
      name: 'Witness Warrior',
      description: 'Help 25 people with faith questions',
      icon: <Users className="w-6 h-6" />,
      category: 'community',
      points: 125,
      progress: 18,
      maxProgress: 25,
      unlocked: false,
      rarity: 'rare',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'daily_devotion_streak',
      name: 'Daily Devotion Streak',
      description: 'Maintain a 7-day conversation streak',
      icon: <Calendar className="w-6 h-6" />,
      category: 'streak',
      points: 75,
      progress: 5,
      maxProgress: 7,
      unlocked: false,
      rarity: 'common',
      color: 'from-pink-500 to-pink-600'
    },
    {
      id: 'church_leader',
      name: 'Church Leader',
      description: 'Create 5 study groups',
      icon: <Crown className="w-6 h-6" />,
      category: 'community',
      points: 300,
      progress: 2,
      maxProgress: 5,
      unlocked: false,
      rarity: 'epic',
      color: 'from-indigo-500 to-indigo-600'
    }
  ];

  const categories = [
    { id: 'all', name: 'All', icon: <Trophy className="w-4 h-4" /> },
    { id: 'apologetics', name: 'Apologetics', icon: <Shield className="w-4 h-4" /> },
    { id: 'theology', name: 'Theology', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'scripture', name: 'Scripture', icon: <Star className="w-4 h-4" /> },
    { id: 'community', name: 'Community', icon: <Users className="w-4 h-4" /> },
    { id: 'streak', name: 'Streaks', icon: <Calendar className="w-4 h-4" /> }
  ];

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-400 bg-gray-100';
      case 'rare': return 'border-blue-400 bg-blue-100';
      case 'epic': return 'border-purple-400 bg-purple-100';
      case 'legendary': return 'border-yellow-400 bg-yellow-100';
      default: return 'border-gray-400 bg-gray-100';
    }
  };

  const getRarityText = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'Common';
      case 'rare': return 'Rare';
      case 'epic': return 'Epic';
      case 'legendary': return 'Legendary';
      default: return 'Common';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-4xl mx-4 rounded-2xl shadow-2xl overflow-hidden ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Achievements & Progress</h2>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>Track your spiritual growth journey</p>
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

        {/* Progress Overview */}
        {userProgress && (
          <div className={`p-6 border-b ${
            theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`text-center p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-white'
              }`}>
                <div className="text-2xl font-bold text-blue-500">{userProgress.level}</div>
                <div className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Level</div>
              </div>
              <div className={`text-center p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-white'
              }`}>
                <div className="text-2xl font-bold text-green-500">{userProgress.totalXP}</div>
                <div className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Total XP</div>
              </div>
              <div className={`text-center p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-white'
              }`}>
                <div className="text-2xl font-bold text-purple-500">{userProgress.achievementsUnlocked}</div>
                <div className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Achievements</div>
              </div>
              <div className={`text-center p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-white'
              }`}>
                <div className="text-2xl font-bold text-orange-500">{userProgress.streakDays}</div>
                <div className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Day Streak</div>
              </div>
            </div>
            
            {/* XP Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  XP to Next Level
                </span>
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  {userProgress.currentXP} / {userProgress.xpToNextLevel}
                </span>
              </div>
              <div className={`w-full h-3 bg-gray-200 rounded-full overflow-hidden ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${(userProgress.currentXP / userProgress.xpToNextLevel) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className={`flex border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          {[
            { id: 'achievements', name: 'Achievements', icon: <Trophy className="w-4 h-4" /> },
            { id: 'progress', name: 'Progress', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'leaderboard', name: 'Leaderboard', icon: <Award className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-4 transition-colors ${
                activeTab === tab.id
                  ? theme === 'dark'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-blue-600 border-b-2 border-blue-600'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              <span className="font-medium">{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'achievements' && (
            <div>
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2 mb-6">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? theme === 'dark'
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-100 text-blue-700'
                        : theme === 'dark'
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.icon}
                    <span className="text-sm font-medium">{category.name}</span>
                  </button>
                ))}
              </div>

              {/* Achievements Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                      achievement.unlocked
                        ? 'border-green-400 bg-green-50'
                        : theme === 'dark'
                          ? 'border-gray-600 bg-gray-800'
                          : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded-lg ${
                        achievement.unlocked 
                          ? 'bg-green-500' 
                          : `bg-gradient-to-r ${achievement.color}`
                      }`}>
                        {achievement.icon}
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                          getRarityColor(achievement.rarity)
                        }`}>
                          {getRarityText(achievement.rarity)}
                        </div>
                        <div className={`text-sm font-bold mt-1 ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {achievement.points} XP
                        </div>
                      </div>
                    </div>
                    
                    <h3 className={`font-semibold mb-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {achievement.name}
                    </h3>
                    
                    <p className={`text-sm mb-3 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {achievement.description}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                          Progress
                        </span>
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                          {achievement.progress} / {achievement.maxProgress}
                        </span>
                      </div>
                      <div className={`w-full h-2 bg-gray-200 rounded-full overflow-hidden ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            achievement.unlocked
                              ? 'bg-green-500'
                              : 'bg-gradient-to-r from-blue-500 to-purple-500'
                          }`}
                          style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    {achievement.unlocked && (
                      <div className="flex items-center space-x-1 mt-3 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Unlocked!</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="space-y-6">
              <div className={`p-6 rounded-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>Completed apologetics conversation</div>
                      <div className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>+15 XP • 2 hours ago</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Star className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>Referenced Bible verse</div>
                      <div className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>+5 XP • 1 day ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Top Apologists</h3>
                <div className="space-y-3">
                  {[
                    { rank: 1, name: 'Sarah M.', xp: 2840, level: 15 },
                    { rank: 2, name: 'Michael R.', xp: 2675, level: 14 },
                    { rank: 3, name: 'David L.', xp: 2450, level: 13 },
                    { rank: 4, name: 'You', xp: 1890, level: 10 },
                    { rank: 5, name: 'Jennifer K.', xp: 1675, level: 9 }
                  ].map((user) => (
                    <div key={user.rank} className={`flex items-center space-x-3 p-3 rounded-lg ${
                      user.name === 'You' 
                        ? theme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-50'
                        : theme === 'dark' ? 'bg-gray-700' : 'bg-white'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        user.rank === 1 ? 'bg-yellow-500' :
                        user.rank === 2 ? 'bg-gray-400' :
                        user.rank === 3 ? 'bg-orange-500' :
                        'bg-gray-300'
                      } text-white`}>
                        {user.rank}
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>{user.name}</div>
                        <div className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>Level {user.level} • {user.xp} XP</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AchievementSystem; 