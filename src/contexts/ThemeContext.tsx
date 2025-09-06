import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  effectiveTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system')
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Load theme from localStorage on mount
    const storedTheme = localStorage.getItem('theme') as Theme
    if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
      setTheme(storedTheme)
    } else {
      // Default to system theme if no stored preference
      setTheme('system')
    }
  }, [])

  useEffect(() => {
    // Update effective theme based on theme setting
    const updateEffectiveTheme = () => {
      if (theme === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setEffectiveTheme(systemPrefersDark ? 'dark' : 'light')
      } else {
        setEffectiveTheme(theme)
      }
    }

    updateEffectiveTheme()

    // Listen for system theme changes if using system theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => updateEffectiveTheme()
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  useEffect(() => {
    // Apply theme to document root
    const root = document.documentElement
    
    // Add transitioning class to prevent flash
    root.classList.add('theme-transitioning')
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark')
    
    // Add current theme class
    root.classList.add(effectiveTheme)
    
    // Also set data attribute for better CSS targeting
    root.setAttribute('data-theme', effectiveTheme)
    
    // Store theme preference
    localStorage.setItem('theme', theme)
    
    // Remove transitioning class after a short delay
    setTimeout(() => {
      root.classList.remove('theme-transitioning')
    }, 100)
  }, [theme, effectiveTheme])

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme)
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: handleSetTheme,
        effectiveTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}