import React, { useState } from 'react'
import { ImageWithFallback } from './figma/ImageWithFallback'

interface CroppedImageProps {
  src: string
  alt: string
  className?: string
  cropToRight?: boolean
  onClick?: () => void
  fixedSize?: boolean // Whether to use fixed 140x200 size or inherit from container
}

export function CroppedImage({ src, alt, className = "", cropToRight = false, onClick, fixedSize = false }: CroppedImageProps) {
  const [isLoading, setIsLoading] = useState(true)

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  const handleImageError = () => {
    setIsLoading(false)
  }

  // Reset loading state when src changes
  React.useEffect(() => {
    if (src) {
      setIsLoading(true)
    }
  }, [src])

  // If no src provided, show fallback immediately
  if (!src || src.trim() === '') {
    const fallbackClasses = cropToRight 
      ? fixedSize 
        ? 'w-[140px] h-[200px] flex-shrink-0'
        : className.includes('w-') && className.includes('h-')
          ? className
          : 'w-[140px] h-[200px] flex-shrink-0' // Default cropped size
      : className || 'w-full h-full'
      
    return (
      <div className={`${fallbackClasses} bg-gray-200 flex items-center justify-center text-gray-500`}>
        <span className="text-xs">No image URL</span>
      </div>
    )
  }

  // If cropping is disabled, show normal image
  if (!cropToRight) {
    const containerClasses = fixedSize 
      ? `w-[140px] h-[200px] relative flex-shrink-0 ${className}`
      : `${className} relative`
      
    return (
      <div className={containerClasses} onClick={onClick}>
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center z-10">
            <span className="text-xs text-gray-500">Loading...</span>
          </div>
        )}
        <ImageWithFallback
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>
    )
  }

  // For cropped images, show RIGHT SIDE (area with text & info)
  // Default cropped covers should be 140x200px for consistency
  const containerClasses = fixedSize 
    ? `w-[140px] h-[200px] overflow-hidden relative flex-shrink-0 ${className}`
    : className.includes('w-') && className.includes('h-')
      ? `${className} overflow-hidden relative`
      : `w-[140px] h-[200px] overflow-hidden relative flex-shrink-0 ${className}`
    
  const imageClasses = fixedSize 
    ? "w-full h-full object-cover"
    : className.includes('w-') && className.includes('h-') 
      ? "w-full h-full object-cover" 
      : "w-[140px] h-[200px] object-cover"
  
  return (
    <div className={containerClasses} onClick={onClick}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center z-10">
          <span className="text-xs text-gray-500">Loading...</span>
        </div>
      )}
      <ImageWithFallback
        src={src}
        alt={alt}
        className={imageClasses}
        style={{
          objectPosition: '100% center', // Show RIGHT SIDE - area with text & info
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
        draggable={false}
      />
    </div>
  )
}