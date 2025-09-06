/**
 * Saved Gallery API - Simple system untuk save dan load gallery URLs yang valid
 */

import { projectId, publicAnonKey } from './supabase/info'

interface SavedGalleryData {
  movieId: string
  urls: string[]
  template: string
  savedAt: number
  totalImages: number
}

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f3064b20`

class SavedGalleryApi {
  /**
   * Get saved gallery untuk movie tertentu
   */
  async getSavedGallery(movieId: string, accessToken: string): Promise<SavedGalleryData | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/saved-gallery/${movieId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 404) {
        return null // No saved gallery found
      }

      if (!response.ok) {
        throw new Error(`Failed to get saved gallery: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting saved gallery:', error)
      return null
    }
  }

  /**
   * Save gallery URLs untuk movie
   */
  async saveGallery(
    movieId: string, 
    urls: string[], 
    template: string,
    accessToken: string
  ): Promise<boolean> {
    try {
      const saveData: SavedGalleryData = {
        movieId,
        urls,
        template,
        savedAt: Date.now(),
        totalImages: urls.length
      }

      const response = await fetch(`${API_BASE_URL}/saved-gallery/${movieId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(saveData)
      })

      if (!response.ok) {
        throw new Error(`Failed to save gallery: ${response.statusText}`)
      }

      return true
    } catch (error) {
      console.error('Error saving gallery:', error)
      return false
    }
  }

  /**
   * Delete saved gallery untuk movie
   */
  async deleteSavedGallery(movieId: string, accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/saved-gallery/${movieId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to delete saved gallery: ${response.statusText}`)
      }

      return true
    } catch (error) {
      console.error('Error deleting saved gallery:', error)
      return false
    }
  }

  /**
   * Check apakah template sudah berubah
   */
  hasTemplateChanged(savedData: SavedGalleryData, currentTemplate: string): boolean {
    return savedData.template !== currentTemplate
  }

  /**
   * Format timestamp untuk display
   */
  formatSaveTime(timestamp: number): string {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  /**
   * Get umur saved gallery dalam menit
   */
  getSaveAgeMinutes(timestamp: number): number {
    return Math.floor((Date.now() - timestamp) / (1000 * 60))
  }
}

export const savedGalleryApi = new SavedGalleryApi()
export type { SavedGalleryData }