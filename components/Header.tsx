import React from 'react';
import { Search, Filter, Settings } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800/50 backdrop-blur-sm bg-shield-black/50">
      {/* Left side - Logo */}
      <div className="flex items-center space-x-2">
        <img src="/logo.png" alt="Shield AI Logo" className="w-14 h-14" />
        <span className="text-shield-white font-semibold text-xl">Shield AI</span>
      </div>

      {/* Right side - Navigation and buttons */}
      <div className="flex items-center space-x-4">
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
        <button className="px-4 py-2 text-shield-white border border-gray-600/50 rounded-full hover:bg-shield-light-gray/50 transition-all duration-200">
          Sign in
        </button>
        <button className="px-4 py-2 bg-shield-white text-shield-black rounded-full hover:bg-gray-200 transition-all duration-200 font-medium">
          Sign up
        </button>
      </div>
    </header>
  );
};

export default Header; 