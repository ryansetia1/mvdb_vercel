import { projectId, publicAnonKey } from './supabase/info'

export interface ImageTag {
  url: string
  actresses: string[] // Array of actress names tagged in this image
  contentRating?: 'NN' | 'N' | null // Content rating: NN (nude), N (partial), null (no rating)
  imageIndex?: number // For pattern-based images
}

export interface Photobook {
  id?: string
  titleEn: string
  titleJp?: string
  link?: string
  cover?: string
  releaseDate?: string
  actress?: string // Main actress (for backward compatibility)
  imageLinks?: string // Raw image links string
  imageTags?: ImageTag[] // New: Individual image tagging
}

export const photobookApi = {
  async getPhotobooks(accessToken: string): Promise<Photobook[]> {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf/photobooks`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch photobooks: ${response.status} - ${errorText}`)
    }

    return response.json()
  },

  async getPhotobook(id: string, accessToken: string): Promise<Photobook> {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf/photobooks/${id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch photobook: ${response.status} - ${errorText}`)
    }

    return response.json()
  },

  async createPhotobook(photobook: Photobook, accessToken: string): Promise<Photobook> {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf/photobooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(photobook),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to create photobook: ${response.status} - ${errorText}`)
    }

    return response.json()
  },

  async updatePhotobook(id: string, updates: Partial<Photobook>, accessToken: string): Promise<Photobook> {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf/photobooks/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to update photobook: ${response.status} - ${errorText}`)
    }

    return response.json()
  },

  async deletePhotobook(id: string, accessToken: string): Promise<void> {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf/photobooks/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to delete photobook: ${response.status} - ${errorText}`)
    }
  },

  async searchPhotobooks(query: string, accessToken: string): Promise<Photobook[]> {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf/photobooks/search?q=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to search photobooks: ${response.status} - ${errorText}`)
    }

    return response.json()
  },

  // New: Get photobooks by actress
  async getPhotobooksByActress(actressName: string, accessToken: string): Promise<Photobook[]> {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf/photobooks/by-actress/${encodeURIComponent(actressName)}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch photobooks by actress: ${response.status} - ${errorText}`)
    }

    return response.json()
  }
}

// Helper functions for image processing
export const photobookHelpers = {
  // Parse image links and generate URLs with indices
  parseImageLinksWithIndices(imageLinks: string, dmcode?: string): { url: string; index: number; source: 'template' | 'manual' }[] {
    if (!imageLinks) return []
    
    const parts = imageLinks.split(',').map(part => part.trim()).filter(Boolean)
    const results: { url: string; index: number; source: 'template' | 'manual' }[] = []
    let currentIndex = 0

    parts.forEach(part => {
      if (part.includes('#')) {
        // Template pattern - generate up to 50 URLs
        for (let i = 1; i <= 50; i++) {
          let processedUrl = part
          
          // Replace # patterns with numbers
          processedUrl = processedUrl.replace(/(#+)/g, (match) => {
            const hashCount = match.length
            return i.toString().padStart(hashCount, '0')
          })

          // Replace * with dmcode/title
          if (processedUrl.includes('*') && dmcode) {
            processedUrl = processedUrl.replace(/\*/g, dmcode)
          }

          results.push({
            url: processedUrl,
            index: currentIndex++,
            source: 'template'
          })
        }
      } else if (part.includes('|')) {
        // Manual link in Title|URL format - extract URL only
        const [title, url] = part.split('|', 2)
        if (url && url.trim()) {
          results.push({
            url: url.trim(),
            index: currentIndex++,
            source: 'manual'
          })
        }
      } else if (part.startsWith('http')) {
        // Plain URL (legacy format)
        results.push({
          url: part,
          index: currentIndex++,
          source: 'manual'
        })
      }
    })

    return results
  },

  // Get all unique actresses from image tags (raw data, no auto-tagging)
  getAllActressesFromTagsRaw(photobook: Photobook): string[] {
    if (!photobook.imageTags) {
      // Fallback to main actress if no image tags
      return photobook.actress ? [photobook.actress] : []
    }
    
    const allActresses = photobook.imageTags.flatMap(tag => tag.actresses)
    const uniqueActresses = Array.from(new Set(allActresses))
    
    // If no actresses found in tags, fallback to main actress
    return uniqueActresses.length > 0 ? uniqueActresses : (photobook.actress ? [photobook.actress] : [])
  },

  // Apply auto-tagging: if no actresses are tagged to an image, tag all actresses
  applyAutoTagging(photobook: Photobook): Photobook {
    if (!photobook.imageTags) return photobook

    // Get all unique actresses from the photobook (raw data)
    const allActresses = this.getAllActressesFromTagsRaw(photobook)
    
    if (allActresses.length === 0) return photobook

    // Apply auto-tagging to images with no actress tags
    const updatedImageTags = photobook.imageTags.map(tag => {
      if (tag.actresses.length === 0) {
        return {
          ...tag,
          actresses: [...allActresses] // Tag with all actresses
        }
      }
      return tag
    })

    return {
      ...photobook,
      imageTags: updatedImageTags
    }
  },

  // Get images tagged with specific actress (with auto-tagging applied)
  getImagesForActress(photobook: Photobook, actressName: string): string[] {
    if (!photobook.imageTags) return []
    
    const processedPhotobook = this.applyAutoTagging(photobook)
    
    return processedPhotobook.imageTags!
      .filter(tag => tag.actresses.includes(actressName))
      .map(tag => tag.url)
  },

  // Get images tagged with specific actress and content rating (with auto-tagging applied)
  getImagesForActressWithRating(photobook: Photobook, actressName: string, contentRating?: 'NN' | 'N' | null): string[] {
    if (!photobook.imageTags) return []
    
    const processedPhotobook = this.applyAutoTagging(photobook)
    
    return processedPhotobook.imageTags!
      .filter(tag => {
        const hasActress = tag.actresses.includes(actressName)
        if (!hasActress) return false
        
        // If no rating filter specified, return all
        if (contentRating === undefined) return true
        
        // Match specific rating (including null for unrated)
        return tag.contentRating === contentRating
      })
      .map(tag => tag.url)
  },

  // Get images by content rating (for photobook detail page) with cover first in ALL tab
  getImagesByRating(photobook: Photobook, contentRating?: 'NN' | 'N' | null): string[] {
    if (!photobook.imageTags) return []
    
    const processedPhotobook = this.applyAutoTagging(photobook)
    
    const filteredImages = processedPhotobook.imageTags!
      .filter(tag => {
        // If no rating filter specified, return all
        if (contentRating === undefined) return true
        
        // Match specific rating (including null for unrated)
        return tag.contentRating === contentRating
      })
      .map(tag => tag.url)

    // Put cover first if it matches the rating filter
    if (photobook.cover) {
      // Check if cover should be included based on rating filter
      let shouldIncludeCover = false
      
      if (contentRating === undefined) {
        // All tab - always include cover
        shouldIncludeCover = true
      } else {
        // NN or N tab - check if cover has the same rating
        const coverTag = processedPhotobook.imageTags!.find(tag => tag.url === photobook.cover)
        if (coverTag && coverTag.contentRating === contentRating) {
          shouldIncludeCover = true
        }
      }
      
      if (shouldIncludeCover) {
        const coverIndex = filteredImages.indexOf(photobook.cover)
        if (coverIndex > 0) {
          // Remove cover from current position and add to front
          filteredImages.splice(coverIndex, 1)
          filteredImages.unshift(photobook.cover)
        } else if (coverIndex === -1) {
          // Cover not in filtered images, add it to front
          filteredImages.unshift(photobook.cover)
        }
      }
    }

    return filteredImages
  },

  // Get all unique actresses from image tags (with auto-tagging applied)
  getAllActressesFromTags(photobook: Photobook): string[] {
    const processedPhotobook = this.applyAutoTagging(photobook)
    return this.getAllActressesFromTagsRaw(processedPhotobook)
  },

  // Get content rating statistics
  getContentRatingStats(photobook: Photobook): { nn: number; n: number; unrated: number; total: number } {
    if (!photobook.imageTags) return { nn: 0, n: 0, unrated: 0, total: 0 }
    
    const stats = {
      nn: 0,
      n: 0,
      unrated: 0,
      total: photobook.imageTags.length
    }

    photobook.imageTags.forEach(tag => {
      if (tag.contentRating === 'NN') {
        stats.nn++
      } else if (tag.contentRating === 'N') {
        stats.n++
      } else {
        stats.unrated++
      }
    })

    return stats
  }
}