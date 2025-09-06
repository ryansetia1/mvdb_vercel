import React, { useState, forwardRef } from 'react'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

export const ImageWithFallback = forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  (props, ref) => {
    const [didError, setDidError] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const { src, alt, style, className, onLoad, onError, ...rest } = props

    const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      setIsLoading(false)
      setDidError(false)
      if (onLoad) {
        onLoad(e)
      }
    }

    const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
      setIsLoading(false)
      setDidError(true)
      // Don't log errors to console as this is expected behavior for missing images
      if (onError) {
        onError(e)
      }
    }

    // Reset states when src changes
    React.useEffect(() => {
      if (src && src.trim() !== '') {
        setIsLoading(true)
        setDidError(false)
      } else {
        setIsLoading(false)
        setDidError(false)
      }
    }, [src])

    // Don't render anything if no src provided
    if (!src || src.trim() === '') {
      return (
        <div
          className={`inline-block bg-gray-100 text-center align-middle flex items-center justify-center ${className ?? ''}`}
          style={style}
        >
          <span className="text-xs text-gray-500">No image</span>
        </div>
      )
    }

    // Show error state
    if (didError) {
      return (
        <div
          className={`inline-block bg-gray-100 text-center align-middle flex items-center justify-center ${className ?? ''}`}
          style={style}
        >
          <img 
            src={ERROR_IMG_SRC} 
            alt="Failed to load image" 
            className="max-w-full max-h-full opacity-50"
            {...rest} 
            data-original-url={src}
            ref={ref}
          />
        </div>
      )
    }

    // Show image with optional loading state
    return (
      <div className="relative w-full h-full">
        {isLoading && (
          <div 
            className={`absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center z-10 ${className ?? ''}`}
            style={style}
          >
            <span className="text-xs text-gray-400">Loading...</span>
          </div>
        )}
        <img 
          src={src} 
          alt={alt || 'Image'} 
          className={`${className ?? ''} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`} 
          style={style} 
          {...rest} 
          onLoad={handleLoad}
          onError={handleError}
          ref={ref}
        />
      </div>
    )
  }
)

ImageWithFallback.displayName = 'ImageWithFallback'