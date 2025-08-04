import React, { useState } from 'react';
import { Search, Filter, Settings, User, LogOut, MessageSquare, Menu } from 'lucide-react';
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
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, showSidebar, theme = 'dark', onThemeToggle, themeIcon }) => {
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
      <header className={`flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b backdrop-blur-sm transition-colors duration-300 ${
        theme === 'dark' 
          ? 'border-gray-800/50 bg-shield-black/50' 
          : 'border-gray-200 bg-white/50'
      }`}>
        {/* Left side - Logo and Menu */}
        <div className="flex items-center space-x-2">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-xl transition-all duration-200 hover:bg-opacity-50"
          >
            <Menu size={20} className={theme === 'dark' ? 'text-shield-white' : 'text-gray-700'} />
          </button>
          
          <img src="/logo.png" alt="Shield AI Logo" className="w-10 h-10 sm:w-14 sm:h-14" />
          <span className={`font-semibold text-lg sm:text-xl ${
            theme === 'dark' ? 'text-shield-white' : 'text-gray-900'
          }`}>Shield AI</span>
        </div>

        {/* Right side - Navigation and buttons */}
        <div className="flex items-center space-x-2 sm:space-x-4">
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

          {/* Icons */}
          <button className={`p-2 rounded-xl transition-all duration-200 group ${
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
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:flex items-center space-x-2">
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
                className={`hidden sm:block px-4 py-2 border rounded-full transition-all duration-200 ${
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