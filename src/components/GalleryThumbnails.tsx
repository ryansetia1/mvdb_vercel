import { useState, useEffect } from 'react'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { generateGalleryUrls } from '../utils/templateUtils'

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

  useEffect(() => {
    if (!galleryTemplate || !galleryTemplate.includes('#')) {
      setImageStatuses([])
      setIsLoading(false)
      return
    }

    // Generate all possible gallery URLs
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
      
      setIsLoading(false)
    }

    checkImagesInBatches()
  }, [galleryTemplate, dmcode])

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