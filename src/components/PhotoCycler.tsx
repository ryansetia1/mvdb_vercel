import { useState, useEffect, useRef } from 'react'

interface PhotoCyclerProps {
  photos: string[]
  name: string
  className?: string
  interval?: number // in milliseconds, default 2000
}

export function PhotoCycler({ photos, name, className = "w-16 h-16", interval = 2000 }: PhotoCyclerProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Reset state when photos change
  useEffect(() => {
    setLoadedImages(new Set())
    setFailedImages(new Set())
    setCurrentPhotoIndex(0)
  }, [photos])

  // Handle cycling on hover
  useEffect(() => {
    if (isHovered && photos.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)
      }, interval)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      // Reset to first image when not hovering
      if (!isHovered) {
        setCurrentPhotoIndex(0)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isHovered, photos.length, interval])

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => new Set([...prev, index]))
  }

  const handleImageError = (index: number) => {
    console.log(`Image failed to load at index ${index}:`, photos[index])
    setFailedImages(prev => new Set([...prev, index]))
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  if (!photos || photos.length === 0) {
    return (
      <div className={`${className} object-cover rounded border bg-muted flex items-center justify-center`}>
        <span className="text-xs text-muted-foreground">No Photo</span>
      </div>
    )
  }

  const currentImage = photos[currentPhotoIndex]
  const isCurrentImageLoaded = loadedImages.has(currentPhotoIndex)
  const isCurrentImageFailed = failedImages.has(currentPhotoIndex)

  return (
    <div 
      className={`relative ${className} object-cover rounded border overflow-hidden bg-muted cursor-pointer`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main image display */}
      {photos.map((photo, index) => (
        <img
          key={`photo-${index}`}
          src={photo}
          alt={`${name} ${index + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            index === currentPhotoIndex ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => handleImageLoad(index)}
          onError={() => handleImageError(index)}
          style={{ display: 'block' }}
        />
      ))}
      
      {/* Error fallback */}
      {isCurrentImageFailed && (
        <div className="absolute inset-0 bg-muted flex flex-col items-center justify-center text-muted-foreground">
          <div className="w-8 h-8 mb-2 opacity-50">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
            </svg>
          </div>
          <span className="text-xs text-center px-2">Failed to load</span>
        </div>
      )}
      
      {/* Loading state */}
      {!isCurrentImageLoaded && !isCurrentImageFailed && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        </div>
      )}
      
      {/* Photo counter - only show on hover when multiple photos */}
      {photos.length > 1 && isHovered && (
        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded transition-opacity duration-300">
          {currentPhotoIndex + 1}/{photos.length}
        </div>
      )}
      
      {/* Hover indicator for multiple photos */}
      {photos.length > 1 && !isHovered && (
        <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
          +{photos.length - 1}
        </div>
      )}
    </div>
  )
}