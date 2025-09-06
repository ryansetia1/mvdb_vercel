import { projectId, publicAnonKey } from './supabase/info'

/**
 * SC Movie API - Handles all SC movie-related operations
 * 
 * CONSISTENT METHOD NAMING:
 * - Use scMovieApi.updateSCMovie() for updates
 * - Use scMovieApi.createSCMovie() for creating new SC movies
 * - Use scMovieApi.deleteSCMovie() for deletions
 * - Use scMovieApi.getSCMovies() for fetching SC movies with auth token
 * - Use scMovieApi.getAllSCMovies() for public access (no auth required)
 * 
 * This API follows consistent naming conventions to avoid confusion.
 */

export interface SCMovie {
  id?: string
  titleEn: string
  titleJp?: string
  cover: string
  scType: 'real_cut' | 'regular_censorship'
  releaseDate?: string
  cast?: string
  hcCode?: string
  hasEnglishSubs: boolean
  scStreamingLinks: string[]
  hcStreamingLinks: string[]
  createdAt?: string
  updatedAt?: string
}

const getAuthHeader = (accessToken?: string): Record<string, string> => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${accessToken || publicAnonKey}`,
})

export const scMovieApi = {
  // Main function used by components (with auth token)
  async getSCMovies(accessToken: string) {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f3064b20/sc-movies`, {
        headers: getAuthHeader(accessToken),
      })
      
      const result = await response.json()
      if (!response.ok) {
        console.log('Get SC movies API error:', result)
        throw new Error(result.error || 'Failed to fetch SC movies')
      }
      
      return result.scMovies || []
    } catch (error) {
      console.log('Get SC movies exception:', error)
      throw error
    }
  },

  // Alternative function for public access (without auth)
  async getAllSCMovies() {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f3064b20/sc-movies`, {
        headers: getAuthHeader(),
      })
      
      const result = await response.json()
      if (!response.ok) {
        console.log('Get all SC movies API error:', result)
        throw new Error(result.error || 'Failed to fetch SC movies')
      }
      
      return result.scMovies || []
    } catch (error) {
      console.log('Get all SC movies exception:', error)
      throw error
    }
  },

  async getSCMovie(id: string) {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f3064b20/sc-movies/${id}`, {
        headers: getAuthHeader(),
      })
      
      const result = await response.json()
      if (!response.ok) {
        console.log('Get SC movie API error:', result)
        throw new Error(result.error || 'Failed to fetch SC movie')
      }
      
      return result.scMovie
    } catch (error) {
      console.log('Get SC movie exception:', error)
      throw error
    }
  },

  async createSCMovie(scMovie: SCMovie, accessToken: string) {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f3064b20/sc-movies`, {
        method: 'POST',
        headers: getAuthHeader(accessToken),
        body: JSON.stringify(scMovie),
      })
      
      const result = await response.json()
      if (!response.ok) {
        console.log('Create SC movie API error:', result)
        throw new Error(result.error || 'Failed to create SC movie')
      }
      
      return result.scMovie
    } catch (error) {
      console.log('Create SC movie exception:', error)
      throw error
    }
  },

  async updateSCMovie(id: string, scMovie: Partial<SCMovie>, accessToken: string) {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f3064b20/sc-movies/${id}`, {
        method: 'PUT',
        headers: getAuthHeader(accessToken),
        body: JSON.stringify(scMovie),
      })
      
      const result = await response.json()
      if (!response.ok) {
        console.log('Update SC movie API error:', result)
        throw new Error(result.error || 'Failed to update SC movie')
      }
      
      return result.scMovie
    } catch (error) {
      console.log('Update SC movie exception:', error)
      throw error
    }
  },

  async deleteSCMovie(id: string, accessToken: string) {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f3064b20/sc-movies/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(accessToken),
      })
      
      const result = await response.json()
      if (!response.ok) {
        console.log('Delete SC movie API error:', result)
        throw new Error(result.error || 'Failed to delete SC movie')
      }
      
      return result
    } catch (error) {
      console.log('Delete SC movie exception:', error)
      throw error
    }
  },

  async searchSCMovies(query: string, accessToken?: string) {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f3064b20/sc-movies/search/${encodeURIComponent(query)}`, {
        headers: getAuthHeader(accessToken),
      })
      
      const result = await response.json()
      if (!response.ok) {
        console.log('Search SC movies API error:', result)
        throw new Error(result.error || 'Failed to search SC movies')
      }
      
      return result.scMovies || []
    } catch (error) {
      console.log('Search SC movies exception:', error)
      throw error
    }
  }
}