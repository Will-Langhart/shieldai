import React, { useState } from 'react';
import { Search, Filter, Settings, User, LogOut } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import AuthModal from './AuthModal';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

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

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-800/50 backdrop-blur-sm bg-shield-black/50">
      {/* Left side - Logo */}
      <div className="flex items-center space-x-2">
        <img src="/logo.png" alt="Shield AI Logo" className="w-10 h-10 sm:w-14 sm:h-14" />
        <span className="text-shield-white font-semibold text-lg sm:text-xl">Shield AI</span>
      </div>

      {/* Right side - Navigation and buttons */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Icons */}
        <button className="p-2 text-shield-white hover:bg-shield-light-gray/50 rounded-xl transition-all duration-200 group">
          <Search size={20} className="group-hover:scale-110 transition-transform" />
        </button>
        <button className="p-2 text-shield-white hover:bg-shield-light-gray/50 rounded-xl transition-all duration-200 group">
          <Filter size={20} className="group-hover:scale-110 transition-transform" />
        </button>
        <button className="p-2 text-shield-white hover:bg-shield-light-gray/50 rounded-xl transition-all duration-200 group">
          <Settings size={20} className="group-hover:scale-110 transition-transform" />
        </button>

        {/* Buttons */}
        {user ? (
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden sm:flex items-center space-x-2">
              <div className="w-8 h-8 bg-shield-blue rounded-lg flex items-center justify-center">
                <User size={16} className="text-shield-white" />
              </div>
              <span className="text-shield-white text-sm font-medium">
                {user.email}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 text-shield-white hover:bg-shield-light-gray/50 rounded-xl transition-all duration-200 group"
              title="Sign Out"
            >
              <LogOut size={18} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={handleSignIn}
              className="hidden sm:block px-4 py-2 text-shield-white border border-gray-600/50 rounded-full hover:bg-shield-light-gray/50 transition-all duration-200"
            >
              Sign in
            </button>
            <button
              onClick={handleSignUp}
              className="hidden sm:block px-4 py-2 bg-shield-white text-shield-black rounded-full hover:bg-gray-200 transition-all duration-200 font-medium"
            >
              Sign up
            </button>
          </>
        )}
      </div>
          </header>
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
      />
    </>
  );
};

export default Header; 