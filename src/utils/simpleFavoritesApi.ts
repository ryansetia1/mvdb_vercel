// Simple, stable favorites API
import { projectId, publicAnonKey } from '../utils/supabase/info'

export interface SimpleFavorite {
  id: string
  type: 'movie' | 'image' | 'cast' | 'series'
  itemId: string
  sourceId?: string // For images, this is the movie/photobook ID
  createdAt: string
}

class SimpleFavoritesApi {
  private baseUrl: string
  
  constructor() {
    this.baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf`
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
        ...options.headers
      }
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    return response.json()
  }

  // Get all favorites
  async getFavorites(accessToken: string): Promise<SimpleFavorite[]> {
    try {
      const response = await this.makeRequest('/favorites', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      return response || []
    } catch (error) {
      console.error('Failed to get favorites:', error)
      return []
    }
  }

  // Add a favorite
  async addFavorite(
    type: SimpleFavorite['type'], 
    itemId: string, 
    accessToken: string,
    sourceId?: string
  ): Promise<SimpleFavorite | null> {
    try {
      const response = await this.makeRequest('/favorites', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          type,
          itemId,
          sourceId
        })
      })
      return response
    } catch (error) {
      console.error('Failed to add favorite:', error)
      return null
    }
  }

  // Remove a favorite
  async removeFavorite(favoriteId: string, accessToken: string): Promise<boolean> {
    try {
      await this.makeRequest(`/favorites/${favoriteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      return true
    } catch (error) {
      console.error('Failed to remove favorite:', error)
      return false
    }
  }

  // Check if an item is favorited
  async isFavorited(
    type: SimpleFavorite['type'], 
    itemId: string, 
    accessToken: string,
    sourceId?: string
  ): Promise<SimpleFavorite | null> {
    try {
      const favorites = await this.getFavorites(accessToken)
      return favorites.find(f => 
        f.type === type && 
        f.itemId === itemId && 
        (sourceId ? f.sourceId === sourceId : true)
      ) || null
    } catch (error) {
      console.error('Failed to check favorite status:', error)
      return null
    }
  }
}

export const simpleFavoritesApi = new SimpleFavoritesApi()