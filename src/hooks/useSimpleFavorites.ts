import { useState, useEffect, useCallback } from 'react'
import { simpleFavoritesApi, SimpleFavorite } from '../utils/simpleFavoritesApi'
import { toast } from 'sonner@2.0.3'

export function useSimpleFavorites(accessToken: string) {
  const [favorites, setFavorites] = useState<SimpleFavorite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load favorites on mount
  useEffect(() => {
    if (!accessToken || isInitialized) return

    const loadFavorites = async () => {
      setIsLoading(true)
      try {
        const favoritesData = await simpleFavoritesApi.getFavorites(accessToken)
        setFavorites(favoritesData)
      } catch (error) {
        console.error('Failed to load favorites:', error)
        toast.error('Failed to load favorites')
      } finally {
        setIsLoading(false)
        setIsInitialized(true)
      }
    }

    loadFavorites()
  }, [accessToken, isInitialized])

  // Add favorite
  const addFavorite = useCallback(async (
    type: SimpleFavorite['type'],
    itemId: string,
    sourceId?: string
  ) => {
    try {
      const newFavorite = await simpleFavoritesApi.addFavorite(type, itemId, accessToken, sourceId)
      if (newFavorite) {
        setFavorites(prev => [...prev, newFavorite])
        toast.success('Added to favorites')
        return newFavorite
      }
    } catch (error) {
      console.error('Failed to add favorite:', error)
      toast.error('Failed to add to favorites')
    }
    return null
  }, [accessToken])

  // Remove favorite
  const removeFavorite = useCallback(async (favoriteId: string) => {
    try {
      const success = await simpleFavoritesApi.removeFavorite(favoriteId, accessToken)
      if (success) {
        setFavorites(prev => prev.filter(f => f.id !== favoriteId))
        toast.success('Removed from favorites')
        return true
      }
    } catch (error) {
      console.error('Failed to remove favorite:', error)
      toast.error('Failed to remove from favorites')
    }
    return false
  }, [accessToken])

  // Check if item is favorited
  const isFavorited = useCallback((
    type: SimpleFavorite['type'],
    itemId: string,
    sourceId?: string
  ): SimpleFavorite | null => {
    return favorites.find(f => 
      f.type === type && 
      f.itemId === itemId && 
      (sourceId ? f.sourceId === sourceId : true)
    ) || null
  }, [favorites])

  // Get favorites by type
  const getFavoritesByType = useCallback((type: SimpleFavorite['type']) => {
    return favorites.filter(f => f.type === type)
  }, [favorites])

  // Toggle favorite
  const toggleFavorite = useCallback(async (
    type: SimpleFavorite['type'],
    itemId: string,
    sourceId?: string
  ) => {
    const existing = isFavorited(type, itemId, sourceId)
    if (existing) {
      return await removeFavorite(existing.id)
    } else {
      return await addFavorite(type, itemId, sourceId)
    }
  }, [isFavorited, addFavorite, removeFavorite])

  return {
    favorites,
    isLoading,
    isInitialized,
    addFavorite,
    removeFavorite,
    isFavorited,
    getFavoritesByType,
    toggleFavorite
  }
}