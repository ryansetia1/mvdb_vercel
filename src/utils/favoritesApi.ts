import { projectId, publicAnonKey } from './supabase/info'

export interface FavoriteItem {
  id?: string
  userId?: string
  type: 'movie' | 'image' | 'cast' | 'series'
  itemId: string // For images, this is the URL; for others, this is the ID/name
  sourceId?: string // For images, this is the movie/photobook ID
  metadata?: any // Additional data like title, etc.
  createdAt?: string
}

// Cache for favorites to avoid redundant API calls
let cache = { data: null as FavoriteItem[] | null, timestamp: 0 }
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes for favorites

export const favoritesApi = {
  // Test server connection
  async testConnection() {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf/test-connection`)
      const result = await response.json()
      
      if (response.ok) {
        return { success: true, data: result }
      } else {
        return { success: false, error: result.error || 'Connection test failed' }
      }
    } catch (error) {
      console.error('Connection test error:', error)
      return { success: false, error: error.message || 'Network error' }
    }
  },

  // Health check to test server connectivity
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        return true
      }
      return false
    } catch (error) {
      return false
    }
  },

  async getFavorites(accessToken: string, forceReload = false): Promise<FavoriteItem[]> {
    try {
      // Return cached data if available and fresh
      if (!forceReload && cache && 
          (Date.now() - cache.timestamp) < CACHE_DURATION) {
        return cache.data || []
      }

      // Skip health check to avoid 401 errors
      // Directly try to fetch favorites
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf/favorites`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch favorites: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      const favorites = Array.isArray(data) ? data : []
      
      // Update cache
      cache = {
        data: favorites,
        timestamp: Date.now()
      }
      
      return favorites
    } catch (error) {
      // Return cached data if available, otherwise return empty array
      if (cache && cache.data) {
        return cache.data
      }
      return []
    }
  },

  async addFavorite(favorite: Omit<FavoriteItem, 'id' | 'userId' | 'createdAt'>, accessToken: string): Promise<FavoriteItem> {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf/favorites`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(favorite),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to add favorite: ${response.status} - ${errorText}`)
    }

    const newFavorite = await response.json()
    
    // Update cache
    if (cache) {
      cache.data = cache.data ? [...cache.data, newFavorite] : [newFavorite]
    }
    
    return newFavorite
  },

  async removeFavorite(favoriteId: string, accessToken: string): Promise<void> {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf/favorites/${favoriteId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to remove favorite: ${response.status} - ${errorText}`)
    }
    
    // Update cache
    if (cache) {
      cache.data = cache.data ? cache.data.filter(f => f.id !== favoriteId) : null
    }
  },

  async checkIsFavorite(type: string, itemId: string, sourceId?: string, accessToken?: string): Promise<FavoriteItem | null> {
    if (!accessToken) return null
    
    try {
      // Use cached data if available, otherwise fetch fresh data
      const favorites = await this.getFavorites(accessToken)
      return favorites.find(f => 
        f.type === type && 
        f.itemId === itemId && 
        // Match sourceId exactly - both should be undefined or both should match
        ((sourceId && f.sourceId === sourceId) || (!sourceId && !f.sourceId))
      ) || null
    } catch (error) {
      console.warn('Failed to check favorite status:', error)
      return null
    }
  },

  async toggleFavorite(
    type: FavoriteItem['type'], 
    itemId: string, 
    accessToken: string,
    sourceId?: string,
    metadata?: any
  ): Promise<{ isFavorite: boolean; favorite?: FavoriteItem }> {
    try {
      // Clear cache before toggle to ensure fresh data
      this.clearCache()
      const existingFavorite = await this.checkIsFavorite(type, itemId, sourceId, accessToken)
      
      if (existingFavorite?.id) {
        await this.removeFavorite(existingFavorite.id, accessToken)
        return { isFavorite: false }
      } else {
        try {
          const favorite = await this.addFavorite({
            type,
            itemId,
            sourceId,
            metadata
          }, accessToken)
          return { isFavorite: true, favorite }
        } catch (addError: any) {
          // Handle 409 error - item already exists
          if (addError.message?.includes('409') || addError.message?.includes('already in favorites')) {
            console.warn('Item already in favorites, treating as success')
            return { isFavorite: true }
          }
          throw addError
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      throw error
    }
  },

  // Clear cache manually
  clearCache(): void {
    cache = { data: null, timestamp: 0 }
  },

  // Get cache status
  getCacheStatus(): { isCached: boolean; age: number } {
    if (!cache) {
      return { isCached: false, age: 0 }
    }
    return {
      isCached: true,
      age: Date.now() - cache.timestamp
    }
  }
}