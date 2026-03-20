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
    primary: '#46A1E2',
    secondary: '#6B7280',
    accent: '#E8B44C',
    background: '#FAFBFC',
    surface: '#F0F3F7',
    text: '#111827',
    textSecondary: '#5C6570'
  }
}

const darkTheme: Theme = {
  name: 'dark',
  colors: {
    primary: '#5EB0EC',
    secondary: '#9CA3AF',
    accent: '#F0C45C',
    background: '#1A1D24',
    surface: '#2C303A',
    text: '#E8EAED',
    textSecondary: '#9CA3AF'
  }
}

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
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

