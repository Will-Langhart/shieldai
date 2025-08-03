import React, { useState } from 'react';
import { Mic, Zap, ChevronDown, Volume2, Send } from 'lucide-react';

interface InputBarProps {
  onSubmit: (message: string) => void;
  mode: 'fast' | 'accurate';
  onModeChange: (mode: 'fast' | 'accurate') => void;
}

const InputBar: React.FC<InputBarProps> = ({ onSubmit, mode, onModeChange }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSubmit(inputValue.trim());
      setInputValue('');
    }
  };

  const handleSendClick = () => {
    if (inputValue.trim()) {
      onSubmit(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center bg-shield-light-gray rounded-xl p-4 border border-gray-700">
          {/* Left side - Microphone */}
          <button
            type="button"
            className="p-2 text-shield-white hover:bg-shield-gray rounded-lg transition-colors mr-3"
          >
            <Mic size={20} />
          </button>

          {/* Mode toggle */}
          <div className="flex items-center space-x-2 mr-4">
            <Zap size={16} className="text-shield-white" />
            <span className="text-shield-white text-sm font-medium">
              {mode === 'fast' ? 'Fast' : 'Accurate'}
            </span>
            <button
              type="button"
              onClick={() => onModeChange(mode === 'fast' ? 'accurate' : 'fast')}
              className="p-1 text-shield-white hover:bg-shield-gray rounded transition-colors"
            >
              <ChevronDown size={16} />
            </button>
          </div>

          {/* Input field */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="What do you want to know?"
            className="flex-1 bg-transparent text-shield-white placeholder-gray-400 outline-none text-lg"
          />

          {/* Right side - Send button */}
          <button
            type="button"
            onClick={handleSendClick}
            disabled={!inputValue.trim()}
            className="p-2 text-shield-white hover:bg-shield-gray rounded-lg transition-colors ml-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default InputBar; 