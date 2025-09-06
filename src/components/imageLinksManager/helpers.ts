import { ImageTag } from '../../utils/photobookApi'
import { ManualLink, ContentRatingSelectValue } from './types'

// Helper functions to convert between internal values and rating values
export const ratingToSelectValue = (rating?: 'NN' | 'N' | null): ContentRatingSelectValue => {
  if (rating === 'NN') return 'NN'
  if (rating === 'N') return 'N'
  return 'none'
}

export const selectValueToRating = (value: ContentRatingSelectValue): 'NN' | 'N' | null => {
  if (value === 'NN') return 'NN'
  if (value === 'N') return 'N'
  return null
}

// Parse existing imageLinks into template URL and manual links
export const parseImageLinks = (imageLinks: string, imageTags: ImageTag[]) => {
  if (!imageLinks) {
    return { templateUrl: '', manualLinks: [] }
  }

  const parts = imageLinks.split(',').map(part => part.trim()).filter(Boolean)
  
  let foundTemplate = ''
  const foundManualLinks: ManualLink[] = []

  parts.forEach(part => {
    if (part.includes('#')) {
      // This looks like a template pattern
      if (!foundTemplate) {
        foundTemplate = part
      }
    } else if (part.startsWith('http')) {
      // Plain URL - find actresses and rating from imageTags
      const tag = imageTags.find(tag => tag.url === part)
      foundManualLinks.push({ 
        url: part, 
        actresses: tag?.actresses || [],
        contentRating: tag?.contentRating || null
      })
    }
  })

  return { templateUrl: foundTemplate, manualLinks: foundManualLinks }
}

// Generate template actresses from imageTags
export const getTemplateActressesFromTags = (templateUrl: string, imageTags: ImageTag[]): string => {
  if (templateUrl && imageTags.length > 0) {
    const firstTemplateTag = imageTags.find(tag => tag.imageIndex === 0)
    if (firstTemplateTag) {
      return firstTemplateTag.actresses.join(', ')
    }
  }
  return ''
}

// Generate preview URLs for display
export const generatePreviewUrls = (templateUrl: string, dmcode: string, manualLinks: ManualLink[]): string[] => {
  const urls: string[] = []

  // Process template URL to get first few images
  if (templateUrl && templateUrl.includes('#')) {
    // Generate first 4 URLs from template for preview
    for (let i = 1; i <= 4; i++) {
      let processedUrl = templateUrl
      
      // Replace # patterns with numbers
      processedUrl = processedUrl.replace(/(#+)/g, (match) => {
        const hashCount = match.length
        return i.toString().padStart(hashCount, '0')
      })

      // Replace * with dmcode if available
      if (dmcode && processedUrl.includes('*')) {
        processedUrl = processedUrl.replace(/\*/g, dmcode)
      }

      urls.push(processedUrl)
    }
  }

  // Add manual links
  manualLinks.forEach(link => {
    if (link.url.trim()) {
      urls.push(link.url.trim())
    }
  })

  return urls
}

// Calculate total estimated images
export const calculateTotalImages = (templateUrl: string, manualLinks: ManualLink[]): number => {
  return (templateUrl && templateUrl.includes('#') ? 50 : 0) + manualLinks.length
}

// Update parent with combined template and manual data
export const buildImageLinksString = (templateUrl: string, manualLinks: ManualLink[]): string => {
  const parts: string[] = []

  // Add template if exists
  if (templateUrl.trim()) {
    parts.push(templateUrl.trim())
  }

  // Add manual links as plain URLs
  manualLinks.forEach(link => {
    if (link.url.trim()) {
      parts.push(link.url.trim())
    }
  })

  return parts.join(', ')
}

// Generate manual image tags from manual links
export const generateManualImageTags = (manualLinks: ManualLink[], startingIndex: number): ImageTag[] => {
  const manualImageTags: ImageTag[] = []
  let currentIndex = startingIndex

  manualLinks.forEach(link => {
    if (link.url.trim()) {
      manualImageTags.push({
        url: link.url.trim(),
        actresses: link.actresses,
        contentRating: link.contentRating,
        imageIndex: currentIndex++
      })
    }
  })

  return manualImageTags
}