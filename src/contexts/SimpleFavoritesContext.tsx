import React, { createContext, useContext } from 'react'
import { useSimpleFavorites } from '../hooks/useSimpleFavorites'
import { SimpleFavorite } from '../utils/simpleFavoritesApi'

interface SimpleFavoritesContextType {
  favorites: SimpleFavorite[]
  isLoading: boolean
  isInitialized: boolean
  addFavorite: (type: SimpleFavorite['type'], itemId: string, sourceId?: string) => Promise<SimpleFavorite | null>
  removeFavorite: (favoriteId: string) => Promise<boolean>
  isFavorited: (type: SimpleFavorite['type'], itemId: string, sourceId?: string) => SimpleFavorite | null
  getFavoritesByType: (type: SimpleFavorite['type']) => SimpleFavorite[]
  toggleFavorite: (type: SimpleFavorite['type'], itemId: string, sourceId?: string) => Promise<boolean | SimpleFavorite | null>
}

const SimpleFavoritesContext = createContext<SimpleFavoritesContextType | null>(null)

interface SimpleFavoritesProviderProps {
  children: React.ReactNode
  accessToken: string
}

export function SimpleFavoritesProvider({ children, accessToken }: SimpleFavoritesProviderProps) {
  const favoritesHook = useSimpleFavorites(accessToken)

  return (
    <SimpleFavoritesContext.Provider value={favoritesHook}>
      {children}
    </SimpleFavoritesContext.Provider>
  )
}

export function useSimpleFavoritesContext() {
  const context = useContext(SimpleFavoritesContext)
  if (!context) {
    throw new Error('useSimpleFavoritesContext must be used within a SimpleFavoritesProvider')
  }
  return context
}