import { projectId, publicAnonKey } from './supabase/info'

/**
 * Movie API - Handles all movie-related operations
 * 
 * IMPORTANT: Always use the correct method names:
 * - Use movieApi.updateMovie() for updates (NOT movieApi.update)
 * - Use movieApi.createMovie() for creating new movies
 * - Use movieApi.deleteMovie() for deletions
 * - Use movieApi.getMovies() for fetching movies with auth token
 * - Use movieApi.getAllMovies() for public access (no auth required)
 * 
 * The movieApi.update() method is deprecated and should not be used in new code.
 */

export interface Movie {
  id?: string
  cover?: string
  gallery?: string
  code?: string
  dmcode?: string
  releaseDate?: string
  duration?: string
  titleEn?: string
  titleJp?: string
  director?: string
  dmlink?: string
  type?: string
  actress?: string
  actors?: string
  series?: string
  studio?: string
  label?: string
  tags?: string
  cropCover?: boolean

  clinks?: string
  ulinks?: string
  slinks?: string
  createdAt?: string
  updatedAt?: string
  
  // Additional fields from R18.dev format
  galleryImages?: string[]
  coverImage?: string
  sampleUrl?: string
  commentEn?: string
}

const getAuthHeader = (accessToken?: string): Record<string, string> => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${accessToken || publicAnonKey}`,
})

export const movieApi = {
  // Main function used by components (with auth token)
  async getMovies(accessToken: string) {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf/movies`, {
        headers: getAuthHeader(accessToken),
      })
      
      const result = await response.json()
      if (!response.ok) {
        console.log('Get movies API error:', result)
        throw new Error(result.error || 'Failed to fetch movies')
      }
      
      return result.movies || []
    } catch (error) {
      console.log('Get movies exception:', error)
      throw error
    }
  },

  // Alternative function for public access (without auth)
  async getAllMovies() {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf/movies`, {
        headers: getAuthHeader(),
      })
      
      const result = await response.json()
      if (!response.ok) {
        console.log('Get all movies API error:', result)
        throw new Error(result.error || 'Failed to fetch movies')
      }
      
      return result.movies || []
    } catch (error) {
      console.log('Get all movies exception:', error)
      throw error
    }
  },

  async getMovie(accessToken: string, id: string) {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf/movies/${id}`, {
        headers: getAuthHeader(accessToken),
      })
      
      const result = await response.json()
      if (!response.ok) {
        console.log('Get movie API error:', result)
        throw new Error(result.error || 'Failed to fetch movie')
      }
      
      return result.movie
    } catch (error) {
      console.log('Get movie exception:', error)
      throw error
    }
  },

  async createMovie(movie: Movie, accessToken: string) {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf/movies`, {
        method: 'POST',
        headers: getAuthHeader(accessToken),
        body: JSON.stringify(movie),
      })
      
      const result = await response.json()
      if (!response.ok) {
        console.log('Create movie API error:', result)
        throw new Error(result.error || 'Failed to create movie')
      }
      
      return result.movie
    } catch (error) {
      console.log('Create movie exception:', error)
      throw error
    }
  },

  async updateMovie(id: string, movie: Partial<Movie>, accessToken: string) {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf/movies/${id}`, {
        method: 'PUT',
        headers: getAuthHeader(accessToken),
        body: JSON.stringify(movie),
      })
      
      const result = await response.json()
      if (!response.ok) {
        console.log('Update movie API error:', result)
        throw new Error(result.error || 'Failed to update movie')
      }
      
      return result.movie
    } catch (error) {
      console.log('Update movie exception:', error)
      throw error
    }
  },

  async deleteMovie(id: string, accessToken: string) {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf/movies/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(accessToken),
      })
      
      const result = await response.json()
      if (!response.ok) {
        console.log('Delete movie API error:', result)
        throw new Error(result.error || 'Failed to delete movie')
      }
      
      return result
    } catch (error) {
      console.log('Delete movie exception:', error)
      throw error
    }
  },

  async searchMovies(query: string, accessToken?: string) {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf/movies/search/${encodeURIComponent(query)}`, {
        headers: getAuthHeader(accessToken),
      })
      
      const result = await response.json()
      if (!response.ok) {
        console.log('Search movies API error:', result)
        throw new Error(result.error || 'Failed to search movies')
      }
      
      return result.movies || []
    } catch (error) {
      console.log('Search movies exception:', error)
      throw error
    }
  },

  /**
   * @deprecated Use updateMovie instead
   * This alias is kept for backward compatibility but will be removed in future versions
   */
  async update(id: string, movie: Partial<Movie>, accessToken: string) {
    console.warn('movieApi.update is deprecated. Use movieApi.updateMovie instead.')
    return this.updateMovie(id, movie, accessToken)
  }
}