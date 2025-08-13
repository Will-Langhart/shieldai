import React from 'react';
import Header from './Header';

interface AppHeaderProps {
  onMenuClick?: () => void;
  showSidebar?: boolean;
  theme?: 'light' | 'dark';
  onThemeToggle?: () => void;
  themeIcon?: React.ReactNode;
  onMoodVerseClick?: () => void;
  onChurchFinderClick?: () => void;
  onBibleSearchClick?: () => void;
  onApologeticsBibleClick?: () => void;
  onNotesManagerClick?: () => void;
  currentLanguage?: string;
  onLanguageChange?: (language: string) => void;
}

// AppHeader: a slim wrapper around Header so pages can depend on one top-level header component.
// Centralizes header props for consistent use across screens.
const AppHeader: React.FC<AppHeaderProps> = (props) => {
  return <Header {...props} />;
};

export default AppHeader;


