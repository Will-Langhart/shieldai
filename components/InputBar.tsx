import React, { useState } from 'react';
import { Mic, Zap, ChevronDown, Volume2, Send, Sparkles } from 'lucide-react';

interface InputBarProps {
  onSubmit: (message: string) => void;
  mode: 'fast' | 'accurate';
  onModeChange: (mode: 'fast' | 'accurate') => void;
  isLoading?: boolean;
}

const InputBar: React.FC<InputBarProps> = ({ onSubmit, mode, onModeChange, isLoading = false }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSubmit(inputValue.trim());
      setInputValue('');
    }
  };

  const handleSendClick = () => {
    if (inputValue.trim() && !isLoading) {
      onSubmit(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center bg-shield-light-gray/50 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-gray-700/50 shadow-lg">
          {/* Left side - Microphone */}
          <button
            type="button"
            className="p-2 sm:p-2.5 text-shield-white hover:bg-shield-gray/50 rounded-xl transition-all duration-200 mr-2 sm:mr-3 group"
          >
            <Mic size={18} className="sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
          </button>

          {/* Mode toggle */}
          <div className="flex items-center space-x-1 sm:space-x-2 mr-2 sm:mr-4 bg-shield-gray/30 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5">
            <Sparkles size={12} className="sm:w-3.5 sm:h-3.5 text-shield-blue" />
            <span className="text-shield-white text-xs sm:text-sm font-medium">
              {mode === 'fast' ? 'Fast' : 'Accurate'}
            </span>
            <button
              type="button"
              onClick={() => onModeChange(mode === 'fast' ? 'accurate' : 'fast')}
              className="p-1 text-shield-white hover:bg-shield-gray/50 rounded transition-all duration-200"
            >
              <ChevronDown size={12} className="sm:w-3.5 sm:h-3.5 transition-transform hover:rotate-180" />
            </button>
          </div>

          {/* Input field */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything about apologetics, theology, or philosophy..."
            disabled={isLoading}
            className="flex-1 bg-transparent text-shield-white placeholder-gray-400 outline-none text-base sm:text-lg font-medium disabled:opacity-50 min-w-0"
          />

          {/* Right side - Send button */}
          <button
            type="button"
            onClick={handleSendClick}
            disabled={!inputValue.trim() || isLoading}
            className="p-2 sm:p-2.5 text-shield-white hover:bg-shield-blue/20 rounded-xl transition-all duration-200 ml-2 sm:ml-3 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <Send size={18} className="sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default InputBar; 