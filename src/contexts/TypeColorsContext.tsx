import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { 
  getTypeColorsFromDatabase, 
  getTypeColorsFromLocalStorage,
  saveTypeColorsToLocalStorage,
  initializeTypeColors,
  DEFAULT_TYPE_COLORS,
  MovieTypeColorConfig 
} from '../utils/movieTypeColors'

interface TypeColorsContextType {
  colors: MovieTypeColorConfig
  isLoading: boolean
  error: string | null
  refreshColors: () => Promise<void>
}

const TypeColorsContext = createContext<TypeColorsContextType | undefined>(undefined)

interface TypeColorsProviderProps {
  children: ReactNode
  accessToken?: string
}

export function TypeColorsProvider({ children, accessToken }: TypeColorsProviderProps) {
  const [colors, setColors] = useState<MovieTypeColorConfig>(DEFAULT_TYPE_COLORS)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadColors = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Initialize colors with defaults on first load
      initializeTypeColors()
      
      let currentColors: MovieTypeColorConfig
      
      if (accessToken) {
        // Load from database first, fallback to localStorage
        currentColors = await getTypeColorsFromDatabase(accessToken)
      } else {
        // Load from localStorage only
        currentColors = getTypeColorsFromLocalStorage()
      }
      
      setColors(currentColors)
      
      console.log('Type colors loaded successfully:', currentColors)
      
    } catch (err) {
      console.error('Error loading type colors:', err)
      setError(err instanceof Error ? err.message : 'Failed to load type colors')
      
      // Fallback to localStorage
      try {
        const fallbackColors = getTypeColorsFromLocalStorage()
        setColors(fallbackColors)
      } catch (fallbackErr) {
        console.error('Fallback to localStorage also failed:', fallbackErr)
        setColors(DEFAULT_TYPE_COLORS)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const refreshColors = async () => {
    await loadColors()
  }

  useEffect(() => {
    loadColors()
  }, [accessToken])

  const value: TypeColorsContextType = {
    colors,
    isLoading,
    error,
    refreshColors
  }

  return (
    <TypeColorsContext.Provider value={value}>
      {children}
    </TypeColorsContext.Provider>
  )
}

export function useTypeColors() {
  const context = useContext(TypeColorsContext)
  if (context === undefined) {
    throw new Error('useTypeColors must be used within a TypeColorsProvider')
  }
  return context
}
