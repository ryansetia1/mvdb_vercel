import { useEffect, useRef, useState } from 'react'
import { ImageWithFallback } from './figma/ImageWithFallback'

interface ImageSlideshowProps {
  images: string[]
  alt: string
  className?: string
  autoPlay?: boolean
  interval?: number
  showDots?: boolean
  showCounter?: boolean
  onImageClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function ImageSlideshow({
  images,
  alt,
  className = '',
  autoPlay = true,
  interval = 3000,
  showDots = true,
  showCounter = true,
  onImageClick,
  onMouseEnter,
  onMouseLeave
}: ImageSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Auto play effect
  useEffect(() => {
    if (!autoPlay || images.length <= 1 || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [autoPlay, images.length, interval, isPaused])

  // Reset index when images change
  useEffect(() => {
    setCurrentIndex(0)
  }, [images])

  // Handle dot click
  const handleDotClick = (index: number) => {
    setCurrentIndex(index)
    setIsPaused(true)
    // Resume auto play after 5 seconds
    setTimeout(() => setIsPaused(false), 5000)
  }

  // Handle mouse events
  const handleMouseEnter = () => {
    setIsPaused(true)
    onMouseEnter?.()
  }

  const handleMouseLeave = () => {
    setIsPaused(false)
    onMouseLeave?.()
  }

  if (images.length === 0) {
    return (
      <div className={`aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-gray-400 text-center">
          <div className="text-4xl mb-2">📷</div>
          <div className="text-sm">No images</div>
        </div>
      </div>
    )
  }

  if (images.length === 1) {
    return (
      <div 
        className={`relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 ${onImageClick ? 'cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all duration-200 group' : ''} ${className}`}
        onClick={onImageClick}
      >
        <ImageWithFallback
          src={images[0]}
          alt={alt}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {showCounter && (
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
            <span>1</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className={`relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 ${onImageClick ? 'cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all duration-200 group' : ''} ${className}`}
      onClick={onImageClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Images with crossfade effect */}
      {images.map((image, index) => (
        <div
          key={image}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <ImageWithFallback
            src={image}
            alt={`${alt} ${index + 1}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ))}

      {/* Image counter */}
      {showCounter && (
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
          <span>{images.length}</span>
        </div>
      )}

      {/* Navigation dots */}
      {showDots && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
          {images.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex 
                  ? 'bg-white' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              onClick={(e) => {
                e.stopPropagation()
                handleDotClick(index)
              }}
            />
          ))}
        </div>
      )}

      {/* Hover overlay */}
      {onImageClick && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center gap-1">
            <div className="text-white text-2xl">📷</div>
            {autoPlay && (
              <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">
                {isPaused ? 'Paused' : 'Auto cycling'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
