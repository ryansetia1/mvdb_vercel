import { useState, useEffect } from 'react'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { generateGalleryUrls } from '../utils/templateUtils'
import { useGalleryCache } from '../hooks/useGalleryCache'

interface GalleryThumbnailsProps {
  galleryTemplate: string
  dmcode?: string
  onImageClick: (imageUrl: string) => void
  className?: string
}

interface ImageStatus {
  url: string
  exists: boolean
  loading: boolean
}

export function GalleryThumbnails({ 
  galleryTemplate, 
  dmcode, 
  onImageClick, 
  className = "" 
}: GalleryThumbnailsProps) {
  const [imageStatuses, setImageStatuses] = useState<ImageStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Gallery cache hook
  const {
    cachedUrls,
    isLoading: isCacheLoading,
    isCached,
    cacheValid,
    saveToCache
  } = useGalleryCache({
    dmcode: dmcode || '',
    galleryTemplate,
    cacheExpiryHours: 24
  })

  useEffect(() => {
    if (!galleryTemplate || !galleryTemplate.includes('#')) {
      setImageStatuses([])
      setIsLoading(false)
      return
    }

    // Check if we have cached data first
    if (isCacheLoading) {
      return // Wait for cache to load
    }

    if (cachedUrls && cacheValid) {
      // Use cached data
      console.log(`🎯 Using cached gallery thumbnails for ${dmcode}: ${cachedUrls.length} images`)
      
      const cachedStatuses: ImageStatus[] = cachedUrls.map(url => ({
        url,
        exists: true,
        loading: false
      }))
      
      setImageStatuses(cachedStatuses)
      setIsLoading(false)
      return
    }

    // No cache or cache invalid, load fresh data
    const galleryUrls = generateGalleryUrls(galleryTemplate, dmcode)
    
    // Initialize status for all URLs
    const initialStatuses: ImageStatus[] = galleryUrls.map(url => ({
      url,
      exists: false,
      loading: true
    }))
    
    setImageStatuses(initialStatuses)
    setIsLoading(true)

    // Check which images actually exist
    const checkImageExists = (url: string): Promise<boolean> => {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve(true)
        img.onerror = () => resolve(false)
        img.src = url
        
        // Set a timeout to avoid hanging on slow/non-existent images
        setTimeout(() => resolve(false), 5000)
      })
    }

    // Check all images in batches to avoid overwhelming the browser
    const checkImagesInBatches = async () => {
      const batchSize = 10
      const updatedStatuses = [...initialStatuses]
      
      for (let i = 0; i < galleryUrls.length; i += batchSize) {
        const batch = galleryUrls.slice(i, i + batchSize)
        const batchPromises = batch.map(async (url, batchIndex) => {
          const exists = await checkImageExists(url)
          const statusIndex = i + batchIndex
          updatedStatuses[statusIndex] = {
            url,
            exists,
            loading: false
          }
          return { statusIndex, exists }
        })

        await Promise.all(batchPromises)
        
        // Update state after each batch
        setImageStatuses([...updatedStatuses])
      }
      
      // Save valid URLs to cache
      const validUrls = updatedStatuses
        .filter(status => status.exists && !status.loading)
        .map(status => status.url)
      
      if (validUrls.length > 0) {
        saveToCache(validUrls)
        console.log(`💾 Saved ${validUrls.length} valid thumbnail URLs to cache`)
      }
      
      setIsLoading(false)
    }

    checkImagesInBatches()
  }, [galleryTemplate, dmcode, isCacheLoading, cachedUrls, cacheValid, saveToCache])

  const validImages = imageStatuses.filter(status => status.exists && !status.loading)

  if (!galleryTemplate || !galleryTemplate.includes('#')) {
    return (
      <div className={`text-center text-muted-foreground ${className}`}>
        <p>No gallery template configured</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`text-center ${className}`}>
        <div className="flex flex-wrap gap-2">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="w-20 h-20 bg-muted rounded animate-pulse"
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Checking gallery images...
        </p>
      </div>
    )
  }

  if (validImages.length === 0) {
    return (
      <div className={`text-center text-muted-foreground ${className}`}>
        <p>No gallery images found</p>
        <p className="text-xs mt-1">
          Checked {imageStatuses.length} possible URLs
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="mb-3">
        <h4 className="font-medium">Gallery ({validImages.length} images)</h4>
        <p className="text-xs text-muted-foreground">
          Found {validImages.length} out of {imageStatuses.length} possible images
        </p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {validImages.map((imageStatus, index) => (
          <div
            key={imageStatus.url}
            className="aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all"
            onClick={() => onImageClick(imageStatus.url)}
          >
            <ImageWithFallback
              src={imageStatus.url}
              alt={`Gallery image ${index + 1}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
            />
          </div>
        ))}
      </div>
    </div>
  )
}