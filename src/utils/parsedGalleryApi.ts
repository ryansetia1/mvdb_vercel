/**
 * Parsed Gallery API - Mengakses gallery yang diekstrak dari R18 JSON parsing
 */

import { projectId, publicAnonKey } from './supabase/info'

interface ParsedGalleryData {
  movieId: string
  urls: string[]
  source: 'r18_json'
  parsedAt: number
  totalImages: number
}

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf`

class ParsedGalleryApi {
  /**
   * Get parsed gallery untuk movie tertentu dari movie data
   */
  async getParsedGallery(movieId: string, accessToken: string): Promise<ParsedGalleryData | null> {
    try {
      // Get movie data to extract galleryImages
      const response = await fetch(`${API_BASE_URL}/movies/${movieId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Failed to fetch movie: ${response.statusText}`)
      }

      const result = await response.json()
      const movie = result.movie

      // Check if movie has galleryImages from R18 JSON parsing
      if (movie?.galleryImages && Array.isArray(movie.galleryImages) && movie.galleryImages.length > 0) {
        return {
          movieId,
          urls: movie.galleryImages,
          source: 'r18_json',
          parsedAt: new Date(movie.createdAt || movie.updatedAt).getTime(),
          totalImages: movie.galleryImages.length
        }
      }

      return null
    } catch (error) {
      console.error('Error getting parsed gallery:', error)
      return null
    }
  }

  /**
   * Check if movie has parsed gallery available
   */
  async hasParsedGallery(movieId: string, accessToken: string): Promise<boolean> {
    const parsed = await this.getParsedGallery(movieId, accessToken)
    return parsed !== null
  }

  /**
   * Get parsed gallery age in minutes
   */
  getParsedAgeMinutes(parsedAt: number): number {
    return Math.floor((Date.now() - parsedAt) / (1000 * 60))
  }
}

export const parsedGalleryApi = new ParsedGalleryApi()
