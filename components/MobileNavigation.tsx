import React from 'react';
import { Home, MessageSquare, BookOpen, MapPin, Heart, Settings } from 'lucide-react';

interface MobileNavigationProps {
  currentSection: 'chat' | 'bible' | 'church' | 'mood' | 'settings';
  onSectionChange: (section: 'chat' | 'bible' | 'church' | 'mood' | 'settings') => void;
  theme?: 'light' | 'dark';
  onNewConversation?: () => void;
  onBibleSearchClick?: () => void;
  onChurchFinderClick?: () => void;
  onMoodVerseClick?: () => void;
  onSettingsClick?: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentSection,
  onSectionChange,
  theme = 'dark',
  onNewConversation,
  onBibleSearchClick,
  onChurchFinderClick,
  onMoodVerseClick,
  onSettingsClick
}) => {
  const navItems = [
    {
      id: 'chat' as const,
      icon: MessageSquare,
      label: 'Chat',
      action: onNewConversation
    },
    {
      id: 'bible' as const,
      icon: BookOpen,
      label: 'Bible',
      action: onBibleSearchClick
    },
    {
      id: 'church' as const,
      icon: MapPin,
      label: 'Churches',
      action: onChurchFinderClick
    },
    {
      id: 'mood' as const,
      icon: Heart,
      label: 'Mood',
      action: onMoodVerseClick
    },
    {
      id: 'settings' as const,
      icon: Settings,
      label: 'Settings',
      action: onSettingsClick
    }
  ];

  return (
    <nav className="mobile-nav">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => {
                onSectionChange(item.id);
                item.action?.();
              }}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 touch-button ${
                isActive
                  ? theme === 'dark'
                    ? 'text-shield-blue bg-shield-blue/20'
                    : 'text-blue-600 bg-blue-50'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-shield-white hover:bg-shield-gray/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon size={20} className="mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavigation; 