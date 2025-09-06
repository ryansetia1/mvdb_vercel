import { useState, useEffect } from 'react'

interface ImageResolutionInfoProps {
  src: string
  className?: string
}

export function ImageResolutionInfo({ src, className = "" }: ImageResolutionInfoProps) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!src) return

    const img = new Image()
    img.onload = () => {
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight })
      setIsLoading(false)
    }
    img.onerror = () => {
      setIsLoading(false)
    }
    img.src = src
  }, [src])

  if (isLoading) {
    return (
      <div className={`text-xs text-muted-foreground ${className}`}>
        Loading dimensions...
      </div>
    )
  }

  if (!dimensions) {
    return (
      <div className={`text-xs text-muted-foreground ${className}`}>
        Unable to load image
      </div>
    )
  }

  const aspectRatio = (dimensions.width / dimensions.height).toFixed(2)
  const isStandard800x540 = dimensions.width === 800 && dimensions.height === 540

  return (
    <div className={`text-xs text-muted-foreground space-y-1 ${className}`}>
      <div>
        <strong>Resolution:</strong> {dimensions.width} × {dimensions.height}
      </div>
      <div>
        <strong>Aspect Ratio:</strong> {aspectRatio}:1
        {isStandard800x540 && (
          <span className="ml-2 bg-green-100 text-green-700 px-1 rounded text-xs">
            Standard
          </span>
        )}
      </div>
      {isStandard800x540 && (
        <div className="text-green-600">
          ✓ Perfect for cropping (will be 400×540 when cropped)
        </div>
      )}
    </div>
  )
}