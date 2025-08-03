import React from 'react';
import { Search, Filter, Settings } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
      {/* Left side - Logo */}
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-shield-blue rounded-lg flex items-center justify-center">
          <span className="text-shield-white font-bold text-lg">S</span>
        </div>
        <span className="text-shield-white font-semibold text-xl">Shield AI</span>
      </div>

      {/* Right side - Navigation and buttons */}
      <div className="flex items-center space-x-4">
        {/* Icons */}
        <button className="p-2 text-shield-white hover:bg-shield-light-gray rounded-lg transition-colors">
          <Search size={20} />
        </button>
        <button className="p-2 text-shield-white hover:bg-shield-light-gray rounded-lg transition-colors">
          <Filter size={20} />
        </button>
        <button className="p-2 text-shield-white hover:bg-shield-light-gray rounded-lg transition-colors">
          <Settings size={20} />
        </button>

        {/* Buttons */}
        <button className="px-4 py-2 text-shield-white border border-gray-600 rounded-full hover:bg-shield-light-gray transition-colors">
          Sign in
        </button>
        <button className="px-4 py-2 bg-shield-white text-shield-black rounded-full hover:bg-gray-200 transition-colors font-medium">
          Sign up
        </button>
      </div>
    </header>
  );
};

export default Header; 