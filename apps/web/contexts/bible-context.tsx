import React, { createContext, useContext, useState, useEffect } from 'react';
import { BibleVersion } from '../components/BibleVersionSelector';

interface BibleContextType {
  selectedVersion: BibleVersion | null;
  setSelectedVersion: (version: BibleVersion | null) => void;
  isLoading: boolean;
}

const BibleContext = createContext<BibleContextType | undefined>(undefined);

export function BibleProvider({ children }: { children: React.ReactNode }) {
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load saved Bible version from localStorage
    const savedVersion = localStorage.getItem('selectedBibleVersion');
    if (savedVersion) {
      try {
        const parsed = JSON.parse(savedVersion);
        setSelectedVersion(parsed);
      } catch (error) {
        console.error('Error parsing saved Bible version:', error);
        localStorage.removeItem('selectedBibleVersion');
      }
    }
    setIsLoading(false);
  }, []);

  const handleSetSelectedVersion = (version: BibleVersion | null) => {
    setSelectedVersion(version);
    if (version) {
      localStorage.setItem('selectedBibleVersion', JSON.stringify(version));
    } else {
      localStorage.removeItem('selectedBibleVersion');
    }
  };

  const value = {
    selectedVersion,
    setSelectedVersion: handleSetSelectedVersion,
    isLoading,
  };

  return <BibleContext.Provider value={value}>{children}</BibleContext.Provider>;
}

export function useBible() {
  const context = useContext(BibleContext);
  if (context === undefined) {
    throw new Error('useBible must be used within a BibleProvider');
  }
  return context;
}
