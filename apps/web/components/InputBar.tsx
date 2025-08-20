import React, { useState } from 'react';
import { Mic, Zap, ChevronDown, Volume2, Send, Sparkles, BookOpen } from 'lucide-react';

interface InputBarProps {
  onSubmit: (message: string) => void;
  mode: 'fast' | 'accurate';
  onModeChange: (mode: 'fast' | 'accurate') => void;
  isLoading?: boolean;
  disabled?: boolean;
  theme?: 'light' | 'dark';
  onBibleSelectClick?: () => void;
  onMicClick?: () => void;
  selectedBibleVersion?: {
    id: string;
    name: string;
  } | null;
}

const InputBar: React.FC<InputBarProps> = ({ onSubmit, mode, onModeChange, isLoading = false, disabled = false, theme = 'light', onBibleSelectClick, onMicClick, selectedBibleVersion }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with value:', inputValue);
    if (inputValue.trim() && !isLoading && !disabled) {
      onSubmit(inputValue.trim());
      setInputValue('');
    }
  };

  const handleSendClick = () => {
    console.log('Send button clicked with value:', inputValue);
    if (inputValue.trim() && !isLoading && !disabled) {
      onSubmit(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="w-full mx-auto px-2 sm:px-4 min-w-0 mobile-input-bar">
      <form onSubmit={handleSubmit} className="relative min-w-0">
        <div className={`flex items-center backdrop-blur-sm rounded-2xl p-3 sm:p-4 transition-all duration-300 touch-button relative focus-within:ring-2 focus-within:ring-shield-blue/20 focus-within:border-shield-blue/50 ${
          disabled 
            ? theme === 'dark' ? 'bg-gray-600/50 border border-gray-400/30' : 'bg-gray-200 border border-gray-300'
            : theme === 'dark'
              ? 'bg-shield-light-gray/50 border border-gray-600/50 shadow-lg shadow-black/10'
              : 'bg-white border border-gray-200 shadow-lg shadow-gray-200/50'
        } hover:border-opacity-80 hover:shadow-xl before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-transparent before:via-shield-blue/5 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300`}>
          {/* Left side - Microphone */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              console.log('Microphone button clicked');
              onMicClick?.();
            }}
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
              onClick={() => {
                console.log('Mode toggle clicked, current mode:', mode);
                onModeChange(mode === 'fast' ? 'accurate' : 'fast');
              }}
              className={`p-1 rounded transition-all duration-200 ${
                disabled 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : theme === 'dark'
                    ? 'text-gray-400 hover:bg-shield-gray/50'
                    : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ChevronDown size={12} className="sm:w-3.5 sm:h-3.5 transition-transform hover:rotate-180" />
            </button>
          </div>

          {/* Input field */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={disabled ? "Upgrade required to continue..." : "Ask me anything about apologetics, theology, or philosophy..."}
              disabled={isLoading || disabled}
              className={`w-full bg-transparent outline-none text-base sm:text-lg font-medium min-w-0 transition-all duration-300 focus:ring-2 focus:ring-shield-blue/20 ${
                disabled 
                  ? theme === 'dark' ? 'text-gray-400 placeholder-gray-500' : 'text-gray-400 placeholder-gray-400'
                  : isLoading
                    ? theme === 'dark' ? 'text-gray-500 placeholder-gray-600' : 'text-gray-400 placeholder-gray-500'
                    : theme === 'dark' ? 'text-shield-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
              }`}
            />
            {isLoading && (
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-shield-blue' : 'bg-blue-600'} animate-pulse`}></div>
                <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>AI thinking...</span>
              </div>
            )}
          </div>
          


          {/* Bible select button */}
          <button
            type="button"
            onClick={() => {
              console.log('Bible select button clicked');
              onBibleSelectClick?.();
            }}
            disabled={disabled}
            className={`flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all duration-200 ml-2 sm:ml-3 ${
              disabled 
                ? 'text-gray-400 cursor-not-allowed' 
                : selectedBibleVersion
                  ? theme === 'dark'
                    ? 'bg-shield-blue/20 text-shield-blue'
                    : 'bg-blue-50 text-blue-700'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:bg-shield-gray/50'
                    : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BookOpen size={18} className="sm:w-5 sm:h-5" />
            {selectedBibleVersion && (
              <span className="text-xs font-medium hidden sm:block max-w-20 truncate">
                {selectedBibleVersion.name}
              </span>
            )}
          </button>

          {/* Right side - Send button */}
          <button
            type="button"
            onClick={handleSendClick}
            disabled={!inputValue.trim() || isLoading || disabled}
            className={`p-2 sm:p-2.5 rounded-xl transition-all duration-200 ml-2 sm:ml-3 disabled:opacity-50 disabled:cursor-not-allowed group ${
              disabled 
                ? 'text-gray-400' 
                : isLoading
                  ? theme === 'dark'
                    ? 'bg-shield-blue/30 text-shield-blue border border-shield-blue/50'
                    : 'bg-blue-100 text-blue-700 border border-blue-300'
                  : theme === 'dark'
                    ? 'text-shield-white hover:bg-shield-blue/20'
                    : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-medium">Processing...</span>
              </div>
            ) : (
              <Send size={18} className="sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InputBar; 