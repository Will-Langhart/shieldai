import React, { useState } from 'react';
import { Search, Filter, Settings, User, LogOut, MessageSquare, Menu, Heart, MapPin, BookOpen } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import AuthModal from './AuthModal';
import UserSettings from './UserSettings';
import FilterModal, { FilterOptions } from './FilterModal';

interface HeaderProps {
  onMenuClick?: () => void;
  showSidebar?: boolean;
  theme?: 'light' | 'dark';
  onThemeToggle?: () => void;
  themeIcon?: React.ReactNode;
  onAchievementClick?: () => void;
  onMoodVerseClick?: () => void;
  onChurchFinderClick?: () => void;
  onBibleSearchClick?: () => void;
  onApologeticsBibleClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onMenuClick, 
  showSidebar, 
  theme = 'dark', 
  onThemeToggle, 
  themeIcon, 
  onAchievementClick,
  onMoodVerseClick,
  onChurchFinderClick,
  onBibleSearchClick,
  onApologeticsBibleClick
}) => {
  const { user, signOut } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>({
    dateRange: 'all',
    topic: '',
    responseMode: 'all',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  const handleSignIn = () => {
    setAuthMode('signin');
    setAuthModalOpen(true);
  };

  const handleSignUp = () => {
    setAuthMode('signup');
    setAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleApplyFilters = (filters: FilterOptions) => {
    setCurrentFilters(filters);
    // TODO: Apply filters to conversation list
    console.log('Applied filters:', filters);
  };

  return (
    <>
      <header className={`flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b backdrop-blur-sm transition-colors duration-300 mobile-header ${
        theme === 'dark' 
          ? 'border-gray-800/50 bg-shield-black/50' 
          : 'border-gray-200 bg-white/50'
      }`}>
        {/* Left side - Logo */}
        <div className="flex items-center space-x-2">
          <img src="/logo.png" alt="Shield AI Logo" className="w-10 h-10 sm:w-14 sm:h-14" />
          <span className={`font-semibold text-lg sm:text-xl ${
            theme === 'dark' ? 'text-shield-white' : 'text-gray-900'
          }`}>Shield AI</span>
        </div>

        {/* Right side - Navigation and buttons */}
        <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
          {/* Theme Toggle */}
          <button
            onClick={onThemeToggle}
            className={`p-2 rounded-xl transition-all duration-200 group ${
              theme === 'dark' 
                ? 'text-shield-white hover:bg-shield-light-gray/50' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            title="Toggle theme"
          >
            {themeIcon}
          </button>

          {/* Achievement System */}
          <button
            onClick={onAchievementClick}
            className={`p-2 rounded-xl transition-all duration-200 group ${
              theme === 'dark' 
                ? 'text-shield-white hover:bg-shield-light-gray/50' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            title="Achievements & Progress"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </button>

          {/* Mood Verse System */}
          <button
            onClick={onMoodVerseClick}
            className={`p-2 rounded-xl transition-all duration-200 group ${
              theme === 'dark' 
                ? 'text-shield-white hover:bg-shield-light-gray/50' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            title="Mood-based Bible Verses"
          >
            <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>

          {/* Church Finder */}
          <button
            onClick={onChurchFinderClick}
            className={`p-2 rounded-xl transition-all duration-200 group ${
              theme === 'dark' 
                ? 'text-shield-white hover:bg-shield-light-gray/50' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            title="Find Local Churches"
          >
            <MapPin className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>

                      {/* Enhanced Bible Study Suite */}
            <button
              onClick={onBibleSearchClick}
              className={`p-2 rounded-xl transition-all duration-200 group ${
                theme === 'dark'
                  ? 'text-shield-white hover:bg-shield-light-gray/50'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title="Bible Study Suite - Search, Compare, Study"
            >
              <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>

            {/* Apologetics Bible Study */}
            <button
              onClick={onApologeticsBibleClick}
              className={`p-2 rounded-xl transition-all duration-200 group ${
                theme === 'dark'
                  ? 'text-shield-white hover:bg-shield-light-gray/50'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title="Apologetics Bible Study - Curated verses for defending the faith"
            >
              <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>

          {/* Icons - Hide search on mobile for space */}
          <button className={`p-2 rounded-xl transition-all duration-200 group hidden md:block ${
            theme === 'dark' 
              ? 'text-shield-white hover:bg-shield-light-gray/50' 
              : 'text-gray-700 hover:bg-gray-100'
          }`} title="Search">
            <Search size={20} className="group-hover:scale-110 transition-transform" />
          </button>
          <button 
            onClick={() => setFilterModalOpen(true)}
            className={`p-2 rounded-xl transition-all duration-200 group ${
              theme === 'dark' 
                ? 'text-shield-white hover:bg-shield-light-gray/50' 
                : 'text-gray-700 hover:bg-gray-100'
            }`} 
            title="Filter conversations"
          >
            <Filter size={20} className="group-hover:scale-110 transition-transform" />
          </button>
          {user && (
            <button 
              onClick={() => setSettingsModalOpen(true)}
              className={`p-2 rounded-xl transition-all duration-200 group ${
                theme === 'dark' 
                  ? 'text-shield-white hover:bg-shield-light-gray/50' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`} 
              title="User settings"
            >
              <Settings size={20} className="group-hover:scale-110 transition-transform" />
            </button>
          )}

          {/* Buttons */}
          {user ? (
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
              <div className="hidden md:flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  theme === 'dark' ? 'bg-shield-blue' : 'bg-blue-600'
                }`}>
                  <User size={16} className="text-white" />
                </div>
                <span className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-shield-white' : 'text-gray-900'
                }`}>
                  {user.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className={`p-2 rounded-xl transition-all duration-200 group ${
                  theme === 'dark' 
                    ? 'text-shield-white hover:bg-shield-light-gray/50' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title="Sign Out"
              >
                <LogOut size={18} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={handleSignIn}
                className={`hidden md:block px-4 py-2 border rounded-full transition-all duration-200 ${
                  theme === 'dark'
                    ? 'text-shield-white border-gray-600/50 hover:bg-shield-light-gray/50'
                    : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Sign in
              </button>
              <button
                onClick={handleSignUp}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-shield-blue text-shield-white hover:bg-shield-blue/90'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </header>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
      />

      <UserSettings
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />

      <FilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={currentFilters}
      />
    </>
  );
};

export default Header; 