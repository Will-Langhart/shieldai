import React, { useState, useEffect } from 'react';
import { ChevronDown, BookOpen, Check } from 'lucide-react';

export interface BibleVersion {
  id: string;
  name: string;
  description: string;
  language: {
    id: string;
    name: string;
  };
  type: string;
}

interface BibleVersionSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onVersionSelect: (version: BibleVersion) => void;
  selectedVersion?: BibleVersion;
  theme?: 'light' | 'dark';
}

const BibleVersionSelector: React.FC<BibleVersionSelectorProps> = ({
  isOpen,
  onClose,
  onVersionSelect,
  selectedVersion,
  theme = 'dark'
}) => {
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && versions.length === 0) {
      fetchBibleVersions();
    }
  }, [isOpen, versions.length]);

  const fetchBibleVersions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/bible/versions');
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
      }
    } catch (error) {
      console.error('Error fetching Bible versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVersions = versions.filter(version =>
    version.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    version.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleVersionSelect = (version: BibleVersion) => {
    onVersionSelect(version);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4`}>
        <div className={`w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-shield-gray border border-gray-700/50' 
            : 'bg-white border border-gray-200'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${
            theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200'
          }`}>
            <div className="flex items-center space-x-3">
              <BookOpen className={`w-6 h-6 ${
                theme === 'dark' ? 'text-shield-blue' : 'text-blue-600'
              }`} />
              <h2 className={`text-xl font-semibold ${
                theme === 'dark' ? 'text-shield-white' : 'text-gray-900'
              }`}>
                Select Bible Version
              </h2>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-all duration-200 ${
                theme === 'dark' 
                  ? 'text-gray-400 hover:text-shield-white hover:bg-shield-light-gray/50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ChevronDown className="w-5 h-5 rotate-45" />
            </button>
          </div>

          {/* Search */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700/50">
            <input
              type="text"
              placeholder="Search Bible versions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-shield-light-gray/50 border-gray-600/50 text-shield-white placeholder-gray-400 focus:border-shield-blue focus:ring-2 focus:ring-shield-blue/20'
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
              }`}
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
                  theme === 'dark' ? 'border-shield-blue' : 'border-blue-600'
                }`} />
              </div>
            ) : filteredVersions.length === 0 ? (
              <div className={`text-center py-12 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {searchTerm ? 'No Bible versions found matching your search.' : 'No Bible versions available.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredVersions.map((version) => (
                  <button
                    key={version.id}
                    onClick={() => handleVersionSelect(version)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 hover:shadow-lg ${
                      selectedVersion?.id === version.id
                        ? theme === 'dark'
                          ? 'bg-shield-blue/20 border-shield-blue text-shield-white'
                          : 'bg-blue-50 border-blue-500 text-blue-900'
                        : theme === 'dark'
                          ? 'bg-shield-light-gray/30 border-gray-600/50 text-shield-white hover:bg-shield-light-gray/50 hover:border-gray-500'
                          : 'bg-gray-50 border-gray-200 text-gray-900 hover:bg-gray-100 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-lg">{version.name}</h3>
                          {selectedVersion?.id === version.id && (
                            <Check className={`w-5 h-5 ${
                              theme === 'dark' ? 'text-shield-blue' : 'text-blue-600'
                            }`} />
                          )}
                        </div>
                        <p className={`mt-1 text-sm ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {version.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            theme === 'dark' ? 'bg-shield-blue/20 text-shield-blue' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {version.language.name}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            theme === 'dark' ? 'bg-gray-600/50 text-gray-300' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {version.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`p-6 border-t ${
            theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200'
          }`}>
            <div className={`text-sm text-center ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {selectedVersion 
                ? `Selected: ${selectedVersion.name}`
                : 'Choose a Bible version to enhance your AI conversations with Scripture context'
              }
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BibleVersionSelector;
