import React, { useState } from 'react';
import { Mic, Zap, ChevronDown, Volume2, Send, Sparkles } from 'lucide-react';

interface InputBarProps {
  onSubmit: (message: string) => void;
  mode: 'fast' | 'accurate';
  onModeChange: (mode: 'fast' | 'accurate') => void;
  isLoading?: boolean;
  disabled?: boolean;
  theme?: 'light' | 'dark';
}

const InputBar: React.FC<InputBarProps> = ({ onSubmit, mode, onModeChange, isLoading = false, disabled = false, theme = 'dark' }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading && !disabled) {
      onSubmit(inputValue.trim());
      setInputValue('');
    }
  };

  const handleSendClick = () => {
    if (inputValue.trim() && !isLoading && !disabled) {
      onSubmit(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className={`flex items-center backdrop-blur-sm rounded-2xl p-3 sm:p-4 border shadow-lg transition-colors duration-300 ${
          disabled 
            ? theme === 'dark' ? 'bg-gray-600/50 border-gray-500/50' : 'bg-gray-200 border-gray-300'
            : theme === 'dark'
              ? 'bg-shield-light-gray/50 border-gray-700/50'
              : 'bg-white border-gray-200'
        }`}>
          {/* Left side - Microphone */}
          <button
            type="button"
            disabled={disabled}
            className={`p-2 sm:p-2.5 rounded-xl transition-all duration-200 mr-2 sm:mr-3 group ${
              disabled 
                ? 'text-gray-400 cursor-not-allowed' 
                : theme === 'dark'
                  ? 'text-shield-white hover:bg-shield-gray/50'
                  : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Mic size={18} className="sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
          </button>

          {/* Mode toggle */}
          <div className={`flex items-center space-x-1 sm:space-x-2 mr-2 sm:mr-4 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 ${
            disabled 
              ? theme === 'dark' ? 'bg-gray-500/30' : 'bg-gray-200'
              : theme === 'dark' ? 'bg-shield-gray/30' : 'bg-gray-100'
          }`}>
            <Sparkles size={12} className="sm:w-3.5 sm:h-3.5 text-blue-500" />
            <span className={`text-xs sm:text-sm font-medium ${
              disabled 
                ? 'text-gray-400' 
                : theme === 'dark' ? 'text-shield-white' : 'text-gray-700'
            }`}>
              {mode === 'fast' ? 'Fast' : 'Accurate'}
            </span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onModeChange(mode === 'fast' ? 'accurate' : 'fast')}
              className={`p-1 rounded transition-all duration-200 ${
                disabled 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : theme === 'dark'
                    ? 'text-shield-white hover:bg-shield-gray/50'
                    : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ChevronDown size={12} className="sm:w-3.5 sm:h-3.5 transition-transform hover:rotate-180" />
            </button>
          </div>

          {/* Input field */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={disabled ? "Upgrade required to continue..." : "Ask me anything about apologetics, theology, or philosophy..."}
            disabled={isLoading || disabled}
            className={`flex-1 bg-transparent outline-none text-base sm:text-lg font-medium min-w-0 transition-colors duration-300 ${
              disabled 
                ? theme === 'dark' ? 'text-gray-400 placeholder-gray-500' : 'text-gray-400 placeholder-gray-400'
                : theme === 'dark' ? 'text-shield-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
            }`}
          />

          {/* Right side - Send button */}
          <button
            type="button"
            onClick={handleSendClick}
            disabled={!inputValue.trim() || isLoading || disabled}
            className={`p-2 sm:p-2.5 rounded-xl transition-all duration-200 ml-2 sm:ml-3 disabled:opacity-50 disabled:cursor-not-allowed group ${
              disabled 
                ? 'text-gray-400' 
                : theme === 'dark'
                  ? 'text-shield-white hover:bg-shield-blue/20'
                  : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            <Send size={18} className="sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default InputBar; 