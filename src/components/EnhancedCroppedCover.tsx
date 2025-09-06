import { useState } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { CroppedImage } from './CroppedImage'
import { Maximize, RotateCcw, Crop, Info } from 'lucide-react'

interface EnhancedCroppedCoverProps {
  src: string
  alt: string
  className?: string
  onClick?: () => void
  showToggle?: boolean
  showInfo?: boolean
}

export function EnhancedCroppedCover({ 
  src, 
  alt, 
  className = "", 
  onClick, 
  showToggle = true,
  showInfo = false
}: EnhancedCroppedCoverProps) {
  const [cropMode, setCropMode] = useState<'right' | 'full'>('right')
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleImageLoad = () => {
    setIsLoading(false)
    setImageError(false)
  }

  const handleImageError = () => {
    setIsLoading(false)
    setImageError(true)
  }

  const toggleCropMode = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCropMode(prev => prev === 'right' ? 'full' : 'right')
  }

  // If image failed to load, show fallback
  if (imageError) {
    return (
      <div className={`${className} bg-gray-200 flex items-center justify-center text-gray-500 rounded-lg`}>
        <span className="text-sm">No Cover Available</span>
      </div>
    )
  }

  return (
    <div className={`${className} overflow-hidden relative group rounded-lg bg-gray-100`} onClick={onClick}>
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center rounded-lg">
          <span className="text-sm text-gray-500">Loading cover...</span>
        </div>
      )}

      {/* Image */}
      {cropMode === 'right' ? (
        // Cropped view - show right portion (text/info area)
        <CroppedImage
          src={src}
          alt={alt}
          className="w-full h-full"
          cropToRight={true}
          fixedSize={false}
        />
      ) : (
        // Full view - show entire image
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-contain"
          onLoad={handleImageLoad}
          onError={handleImageError}
          draggable={false}
        />
      )}

      {/* Overlay with controls */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2">
          {/* View Full Size Button */}
          <Button
            variant="secondary"
            size="sm"
            className="bg-black/60 text-white border-white/20 hover:bg-black/80"
            onClick={(e) => {
              e.stopPropagation()
              onClick?.()
            }}
          >
            <Maximize className="h-4 w-4 mr-2" />
            View Full Size
          </Button>

          {/* Crop Toggle Button */}
          {showToggle && (
            <Button
              variant="secondary"
              size="sm"
              className="bg-black/60 text-white border-white/20 hover:bg-black/80"
              onClick={toggleCropMode}
              title={cropMode === 'right' ? 'Show full cover' : 'Show cropped view'}
            >
              {cropMode === 'right' ? (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Show Full
                </>
              ) : (
                <>
                  <Crop className="h-4 w-4 mr-2" />
                  Crop Right
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Crop indicator */}
      {cropMode === 'right' && (
        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
          <Badge variant="secondary" className="bg-blue-600 text-white border-0">
            Right Side View
          </Badge>
        </div>
      )}

      {/* Info indicator */}
      {showInfo && cropMode === 'right' && (
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <Info className="h-3 w-3" />
          <span>Text & Info Area</span>
        </div>
      )}
    </div>
  )
}