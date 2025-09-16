import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Camera } from 'lucide-react'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  placeholder?: React.ReactNode
  onLoad?: () => void
  onError?: () => void
  threshold?: number
  rootMargin?: string
}

export const LazyImage = React.memo(function LazyImage({
  src,
  alt,
  className = '',
  placeholder,
  onLoad,
  onError,
  threshold = 0.1,
  rootMargin = '50px'
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Intersection Observer callback
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries
    if (entry.isIntersecting) {
      setIsInView(true)
      // Disconnect observer once image is in view
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  // Set up intersection observer
  useEffect(() => {
    if (!imgRef.current) return

    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin
    })

    observerRef.current.observe(imgRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [handleIntersection, threshold, rootMargin])

  const handleImageLoad = useCallback(() => {
    setIsLoaded(true)
    onLoad?.()
  }, [onLoad])

  const handleImageError = useCallback(() => {
    setIsError(true)
    setIsLoaded(true)
    onError?.()
  }, [onError])

  const defaultPlaceholder = (
    <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
      <Camera className="h-8 w-8 text-gray-400" />
    </div>
  )

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {/* Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0">
          {placeholder || defaultPlaceholder}
        </div>
      )}

      {/* Actual Image */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      )}

      {/* Error State */}
      {isError && (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <Camera className="h-12 w-12 text-gray-400" />
        </div>
      )}
    </div>
  )
})
