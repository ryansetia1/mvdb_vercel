import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { ModernLightbox } from './ModernLightbox'
import { SimpleFavoriteButton } from './SimpleFavoriteButton'
import { processTemplate, generateSmartGalleryUrls } from '../utils/templateUtils'
import { ImageIcon, Eye, Grid, List, Loader2, AlertTriangle, Save } from 'lucide-react'

interface EnhancedGalleryProps {
  galleryTemplate: string
  dmcode?: string
  targetImageCount?: number
  accessToken?: string
  movieData?: {
    id?: string
    titleEn?: string
    titleJp?: string
    code?: string
    actress?: string
    actors?: string
    releaseDate?: string
    studio?: string
  }
  onValidUrlsChange?: (urls: string[]) => void
  showSaveOption?: boolean
  onSaveGallery?: (urls: string[]) => void
  isSaving?: boolean
}

interface ImageStatus {
  url: string
  loaded: boolean
  failed: boolean
  isPlaceholder: boolean
  width?: number
  height?: number
  size?: number
  index: number
}

export function EnhancedGallery({ 
  galleryTemplate, 
  dmcode, 
  targetImageCount = 200, 
  accessToken, 
  movieData, 
  onValidUrlsChange,
  showSaveOption = false,
  onSaveGallery,
  isSaving = false
}: EnhancedGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0)
  const [showLightbox, setShowLightbox] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [imageStatuses, setImageStatuses] = useState<ImageStatus[]>([])
  const [isPreloading, setIsPreloading] = useState(true)
  const [preloadProgress, setPreloadProgress] = useState(0)

  const generateImageUrls = () => {
    if (!dmcode) return []
    
    // Use the enhanced gallery URL generator that supports all placeholders
    return generateSmartGalleryUrls(
      galleryTemplate, 
      dmcode, 
      targetImageCount, 
      {
        studio: movieData?.studio,
        actress: movieData?.actress
      }
    )
  }

  // Enhanced function to detect placeholder images including 404 pages
  const isPlaceholderImage = (img: HTMLImageElement): boolean => {
    const width = img.naturalWidth
    const height = img.naturalHeight
    
    // Known placeholder/error page dimensions - REFINED LIST
    // Removed legitimate content dimensions that caused false positives
    const placeholderSizes = [
      // Very small placeholders (high confidence)
      { w: 100, h: 100 },
      { w: 150, h: 150 },
      { w: 200, h: 200 },
      { w: 250, h: 250 },
      { w: 300, h: 300 },
      
      // Confirmed 404/Error page dimensions only
      { w: 300, h: 420 }, // DMM 404 error page
      { w: 320, h: 240 }, // Small 4:3 error
      { w: 400, h: 300 }, // Small 4:3 error
      
      // Square error pages (small to medium only)
      { w: 350, h: 350 },
      { w: 400, h: 400 },
      { w: 450, h: 450 },
      
      // Common ad/banner error dimensions
      { w: 728, h: 90 },  // Banner
      { w: 300, h: 250 }, // Medium rectangle
      { w: 336, h: 280 }, // Large rectangle
      { w: 970, h: 250 }, // Billboard
      { w: 468, h: 60 },  // Banner
      
      // Very specific small social media placeholders
      { w: 400, h: 225 }, // 16:9 very small - likely placeholder
    ]
    
    // 1. Check exact placeholder dimensions
    for (const size of placeholderSizes) {
      if (width === size.w && height === size.h) {
        console.log(`Detected common placeholder/404 size: ${width}x${height}`)
        return true
      }
    }
    
    // 2. Very small images (likely placeholders) - more conservative
    if (width < 200 || height < 200) {
      console.log(`Detected very small placeholder: ${width}x${height}`)
      return true
    }
    
    // 3. Small square images (common for "NOW PRINTING" placeholders) - more conservative
    if (width === height && width < 400) {
      console.log(`Detected square placeholder: ${width}x${height}`)
      return true
    }
    
    // 4. Extreme aspect ratio images (likely banners/placeholders) - more permissive
    const aspectRatio = width / height
    if (aspectRatio > 8 || aspectRatio < 0.15) {
      console.log(`Detected extreme aspect ratio placeholder: ${aspectRatio} (${width}x${height})`)
      return true
    }
    
    // 5. Specific error page patterns (narrow detection) - DMM style only
    if (aspectRatio >= 0.7 && aspectRatio <= 0.76 && width <= 320 && height <= 440) {
      console.log(`Detected DMM 404-style placeholder: ${aspectRatio} (${width}x${height})`)
      return true
    }
    
    // 6. Very specific small placeholder patterns only - more restrictive
    if ((width === 300 && height >= 400 && height <= 450) || 
        (width === 320 && height >= 200 && height <= 250)) {
      console.log(`Detected specific small placeholder pattern: ${width}x${height}`)
      return true
    }
    
    // 7. Only very small images for gallery content - much more permissive
    // Reduced threshold significantly to avoid false positives on legitimate content
    if (width < 300 && height < 300) {
      console.log(`Detected suspiciously small image for gallery: ${width}x${height}`)
      return true
    }
    
    return false
  }

  // Enhanced image loading with placeholder detection
  const loadAndAnalyzeImage = (url: string, index: number): Promise<ImageStatus> => {
    return new Promise((resolve) => {
      const img = new Image()
      
      // Set up timeout
      const timeout = setTimeout(() => {
        console.log(`Image ${index + 1} timed out`)
        resolve({
          url,
          loaded: false,
          failed: true,
          isPlaceholder: false,
          index
        })
      }, 8000) // 8 second timeout
      
      img.onload = () => {
        clearTimeout(timeout)
        
        const width = img.naturalWidth
        const height = img.naturalHeight
        const isPlaceholder = isPlaceholderImage(img)
        
        console.log(`Image ${index + 1}: ${width}x${height}, placeholder: ${isPlaceholder}`)
        
        resolve({
          url,
          loaded: true,
          failed: false,
          isPlaceholder,
          width,
          height,
          index
        })
      }
      
      img.onerror = () => {
        clearTimeout(timeout)
        console.log(`Image ${index + 1} failed to load`)
        resolve({
          url,
          loaded: false,
          failed: true,
          isPlaceholder: false,
          index
        })
      }
      
      // Start loading
      img.src = url
    })
  }

  // Pre-load all images to check which ones exist and are valid
  useEffect(() => {
    if (!dmcode) return

    const urls = generateImageUrls()
    if (urls.length === 0) return

    setIsPreloading(true)
    setPreloadProgress(0)

    const initialStatuses: ImageStatus[] = urls.map((url, index) => ({
      url,
      loaded: false,
      failed: false,
      isPlaceholder: false,
      index
    }))

    setImageStatuses(initialStatuses)

    let completedCount = 0

    // Load and analyze all images
    const loadPromises = urls.map(async (url, index) => {
      const status = await loadAndAnalyzeImage(url, index)
      
      setImageStatuses(prev => {
        const newStatuses = [...prev]
        newStatuses[index] = status
        return newStatuses
      })

      completedCount++
      setPreloadProgress(Math.round((completedCount / urls.length) * 100))
      
      if (completedCount === urls.length) {
        setTimeout(() => setIsPreloading(false), 500)
      }
      
      return status
    })

    Promise.all(loadPromises).then((results) => {
      const validCount = results.filter(r => r.loaded && !r.failed && !r.isPlaceholder).length
      const placeholderCount = results.filter(r => r.isPlaceholder).length
      const failedCount = results.filter(r => r.failed).length
      
      console.log(`Gallery analysis complete:`)
      console.log(`- Valid images: ${validCount}`)
      console.log(`- Placeholder/404 images: ${placeholderCount}`)
      console.log(`- Failed images: ${failedCount}`)
      
      // Log specific placeholder dimensions for debugging
      const placeholders = results.filter(r => r.isPlaceholder)
      placeholders.forEach(p => {
        console.log(`Placeholder #${p.index + 1}: ${p.width}x${p.height}`)
      })
    })

  }, [dmcode, galleryTemplate, targetImageCount])

  // Get only successfully loaded images that are NOT placeholders
  const validImages = imageStatuses.filter(status => 
    status.loaded && !status.failed && !status.isPlaceholder
  )

  // Notify parent about valid URLs whenever they change
  useEffect(() => {
    if (onValidUrlsChange) {
      const validUrls = validImages.map(img => img.url)
      onValidUrlsChange(validUrls)
    }
  }, [validImages, onValidUrlsChange])

  const placeholderImages = imageStatuses.filter(status => 
    status.loaded && !status.failed && status.isPlaceholder
  )

  const handleImageClick = (validIndex: number) => {
    setSelectedImageIndex(validIndex)
    setShowLightbox(true)
  }

  const handleNext = () => {
    if (selectedImageIndex < validImages.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1)
    }
  }

  // Note: Arrow up/down are now used for zoom in ModernLightbox, not navigation
  // Left/Right arrows still work for navigation in the lightbox

  const renderGridView = () => (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {validImages.map((imageStatus, validIndex) => (
        <div
          key={imageStatus.index}
          className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative group cursor-pointer transition-all duration-200 hover:shadow-lg"
          onClick={() => handleImageClick(validIndex)}
        >
          <img
            src={imageStatus.url}
            alt={`Gallery image ${imageStatus.index + 1}`}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            loading="lazy"
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Eye className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Image number badge */}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-xs">
              {imageStatus.index + 1}
            </Badge>
          </div>

          {/* Image info badge - smaller resolution text */}
          {imageStatus.width && imageStatus.height && (
            <div className="absolute top-2 right-2">
              <Badge variant="outline" className="text-[10px] bg-black/70 text-white border-white/20 px-1 py-0">
                {imageStatus.width}×{imageStatus.height}
              </Badge>
            </div>
          )}
          
          {/* Gallery Image Favorite Button */}
          {accessToken && movieData && (
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <SimpleFavoriteButton
                type="image"
                itemId={imageStatus.url}
                sourceId={movieData.id || ''}
                size="sm"
                variant="ghost"
                className="bg-white/90 hover:bg-white text-gray-700 hover:text-red-500 shadow-lg"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )

  const renderListView = () => (
    <div className="space-y-2">
      {validImages.map((imageStatus, validIndex) => (
        <div
          key={imageStatus.index}
          className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors duration-200"
          onClick={() => handleImageClick(validIndex)}
        >
          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
            <img
              src={imageStatus.url}
              alt={`Gallery image ${imageStatus.index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                #{imageStatus.index + 1}
              </Badge>
              <span className="text-sm font-medium">
                Gallery Image {imageStatus.index + 1}
              </span>
              {imageStatus.width && imageStatus.height && (
                <Badge variant="secondary" className="text-xs">
                  {imageStatus.width}×{imageStatus.height}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-mono break-all">
              {imageStatus.url}
            </p>
          </div>
          
          <Eye className="h-4 w-4 text-muted-foreground" />
        </div>
      ))}
    </div>
  )

  if (!dmcode) {
    return (
      <div className="text-center py-8">
        <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">DM code required to generate gallery</p>
      </div>
    )
  }

  if (imageStatuses.length === 0 && !isPreloading) {
    return (
      <div className="text-center py-8">
        <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No gallery template found</p>
      </div>
    )
  }

  // Show preloading state
  if (isPreloading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Gallery Preview</h3>
          <Badge variant="outline">
            Analyzing images...
          </Badge>
        </div>
        
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground mb-2">Analyzing {targetImageCount} images for content...</p>
          <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${preloadProgress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">{preloadProgress}% complete</p>
          <p className="text-xs text-muted-foreground mt-1">Filtering out 404 pages, placeholders, and error images</p>
        </div>
      </div>
    )
  }

  // Show no valid images found
  if (validImages.length === 0) {
    const failedCount = imageStatuses.filter(s => s.failed).length
    const placeholderCount = placeholderImages.length
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Gallery Preview</h3>
          <Badge variant="destructive">
            No valid images found
          </Badge>
        </div>
        
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">No valid content images found in this gallery</p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Checked {imageStatuses.length} images:</p>
            <p>• {failedCount} failed to load</p>
            <p>• {placeholderCount} were 404/placeholder images</p>
            <p>• {validImages.length} valid content images</p>
          </div>
          <div className="mt-4">
            <code className="bg-muted px-2 py-1 rounded text-xs">{galleryTemplate}</code>
          </div>
          
          {/* Debug info for placeholders */}
          {placeholderCount > 0 && (
            <div className="mt-4 text-xs">
              <details className="text-left bg-muted/50 rounded p-2">
                <summary className="cursor-pointer font-medium">Filtered placeholder details</summary>
                <div className="mt-2 space-y-1">
                  {placeholderImages.slice(0, 10).map(p => (
                    <div key={p.index} className="font-mono">
                      #{p.index + 1}: {p.width}×{p.height}
                    </div>
                  ))}
                  {placeholderImages.length > 10 && (
                    <div className="text-muted-foreground">... and {placeholderImages.length - 10} more</div>
                  )}
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-medium">Gallery Preview</h3>
          <Badge variant="outline">
            {validImages.length} valid / {imageStatuses.length} total
          </Badge>
          {placeholderImages.length > 0 && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              {placeholderImages.length} 404/placeholders filtered
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Save Gallery Button */}
          {showSaveOption && validImages.length > 0 && onSaveGallery && (
            <Button
              onClick={() => onSaveGallery(validImages.map(img => img.url))}
              disabled={isSaving}
              size="sm"
              className="flex items-center gap-2"
            >
              <Save className={`h-4 w-4 ${isSaving ? 'animate-pulse' : ''}`} />
              {isSaving ? 'Saving...' : `Save ${validImages.length} Images`}
            </Button>
          )}
          
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Gallery content - only show valid images */}
      {viewMode === 'grid' ? renderGridView() : renderListView()}

      {/* Modern Lightbox - only for valid images */}
      {validImages.length > 0 && (
        <ModernLightbox
          src={validImages[selectedImageIndex]?.url || ''}
          alt={`Gallery image ${validImages[selectedImageIndex]?.index + 1 || 1}`}
          isOpen={showLightbox}
          onClose={() => setShowLightbox(false)}
          currentIndex={selectedImageIndex}
          totalImages={validImages.length}
          onNext={handleNext}
          onPrevious={handlePrevious}
          showNavigation={validImages.length > 1}
        />
      )}

      {/* Footer info */}
      <div className="text-center pt-4">
        <p className="text-sm text-muted-foreground">
          Template: <code className="bg-muted px-1 rounded text-xs">{galleryTemplate}</code>
        </p>
        <div className="space-y-1 text-xs text-muted-foreground mt-2">
          {imageStatuses.length > validImages.length && (
            <p>
              {imageStatuses.length - validImages.length} image(s) filtered out:
              {placeholderImages.length > 0 && ` ${placeholderImages.length} 404/placeholders`}
              {placeholderImages.length > 0 && imageStatuses.filter(s => s.failed).length > 0 && ', '}
              {imageStatuses.filter(s => s.failed).length > 0 && ` ${imageStatuses.filter(s => s.failed).length} failed`}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}