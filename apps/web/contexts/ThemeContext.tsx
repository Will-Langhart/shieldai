import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Theme } from '../types'

interface ThemeContextType {
  theme: Theme
  isDark: boolean
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

const lightTheme: Theme = {
  name: 'light',
  colors: {
    primary: '#3B82F6',
    secondary: '#6B7280',
    accent: '#F59E0B',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#111827',
    textSecondary: '#6B7280'
  }
}

const darkTheme: Theme = {
  name: 'dark',
  colors: {
    primary: '#60A5FA',
    secondary: '#9CA3AF',
    accent: '#FBBF24',
    background: '#111827',
    surface: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB'
  }
}

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(lightTheme)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setThemeState(darkTheme)
      setIsDark(true)
    } else {
      setThemeState(lightTheme)
      setIsDark(false)
    }
  }, [])

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  const toggleTheme = () => {
    if (isDark) {
      setThemeState(lightTheme)
      setIsDark(false)
      localStorage.setItem('theme', 'light')
    } else {
      setThemeState(darkTheme)
      setIsDark(true)
      localStorage.setItem('theme', 'dark')
    }
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    setIsDark(newTheme.name === 'dark')
    localStorage.setItem('theme', newTheme.name)
  }

  const value: ThemeContextType = {
    theme,
    isDark,
    toggleTheme,
    setTheme
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

