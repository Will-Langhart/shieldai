import React, { useState } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { multilingualService, Language } from '../lib/multilingual-service';

interface LanguageSelectorProps {
  currentLanguage: string;
  onLanguageChange: (languageCode: string) => void;
  theme?: 'light' | 'dark';
  compact?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange,
  theme = 'dark',
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [languages] = useState<Language[]>(multilingualService.getSupportedLanguages());
  
  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  const handleLanguageSelect = (languageCode: string) => {
    onLanguageChange(languageCode);
    setIsOpen(false);
    
    // Store preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('shieldai-language', languageCode);
    }
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2 rounded-xl transition-all duration-200 group ${
            theme === 'dark'
              ? 'text-shield-white hover:bg-shield-light-gray/50'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title={`Language: ${currentLang.nativeName}`}
        >
          <Globe className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <div className={`absolute right-0 top-full mt-2 w-64 rounded-lg shadow-lg border z-20 ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}>
              <div className="p-2 max-h-64 overflow-y-auto">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageSelect(language.code)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                      language.code === currentLanguage
                        ? theme === 'dark'
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50 text-blue-700'
                        : theme === 'dark'
                          ? 'text-gray-300 hover:bg-gray-700'
                          : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{language.code.toUpperCase()}</span>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{language.nativeName}</span>
                        <span className={`text-xs ${
                          language.code === currentLanguage
                            ? 'text-blue-200'
                            : 'text-gray-500'
                        }`}>
                          {language.name}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {language.bibleAvailable && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          theme === 'dark' ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'
                        }`}>
                          Bible
                        </span>
                      )}
                      {language.audioAvailable && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          theme === 'dark' ? 'bg-purple-800 text-purple-200' : 'bg-purple-100 text-purple-800'
                        }`}>
                          Audio
                        </span>
                      )}
                      {language.code === currentLanguage && (
                        <Check className="w-4 h-4" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
            : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
        }`}
      >
        <Globe className="w-4 h-4" />
        <span className="font-medium">{currentLang.nativeName}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className={`absolute left-0 top-full mt-2 w-80 rounded-lg shadow-lg border z-20 ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <div className="p-4">
              <h3 className={`text-lg font-semibold mb-3 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Select Language
              </h3>
              <div className="max-h-64 overflow-y-auto">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageSelect(language.code)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg mb-2 transition-colors ${
                      language.code === currentLanguage
                        ? theme === 'dark'
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50 text-blue-700'
                        : theme === 'dark'
                          ? 'text-gray-300 hover:bg-gray-700'
                          : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-mono">{language.code.toUpperCase()}</span>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{language.nativeName}</span>
                        <span className={`text-sm ${
                          language.code === currentLanguage
                            ? theme === 'dark' ? 'text-blue-200' : 'text-blue-600'
                            : 'text-gray-500'
                        }`}>
                          {language.name}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {language.bibleAvailable && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          theme === 'dark' ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'
                        }`}>
                          Bible Available
                        </span>
                      )}
                      {language.audioAvailable && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          theme === 'dark' ? 'bg-purple-800 text-purple-200' : 'bg-purple-100 text-purple-800'
                        }`}>
                          Audio Support
                        </span>
                      )}
                      {language.code === currentLanguage && (
                        <Check className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              
              <div className={`mt-4 pt-3 border-t text-sm ${
                theme === 'dark' 
                  ? 'border-gray-700 text-gray-400' 
                  : 'border-gray-200 text-gray-600'
              }`}>
                <p>🌍 Bible translations and AI responses available in selected language</p>
                <p>🔊 Audio Bible support varies by language</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;