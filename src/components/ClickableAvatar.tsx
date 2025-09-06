import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { VisuallyHidden } from './ui/visually-hidden'
import { X, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react'
import { cn } from './ui/utils'

interface ClickableAvatarProps {
  src?: string
  alt: string
  fallback: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function ClickableAvatar({ 
  src, 
  alt, 
  fallback, 
  className,
  size = 'md' 
}: ClickableAvatarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  }

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5))
  const handleRotate = () => setRotation(prev => (prev + 90) % 360)
  
  const handleDownload = () => {
    if (src) {
      const link = document.createElement('a')
      link.href = src
      link.download = alt || 'image'
      link.click()
    }
  }

  const resetTransform = () => {
    setZoom(1)
    setRotation(0)
  }

  if (!src) {
    return (
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
    )
  }

  return (
    <>
      <Avatar 
        className={cn(sizeClasses[size], 'cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all', className)}
        onClick={() => setIsOpen(true)}
      >
        <AvatarImage src={src} alt={alt} />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>

      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) resetTransform()
      }}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] p-0 overflow-hidden"
          aria-describedby="avatar-viewer-description"
        >
          <DialogHeader>
            <VisuallyHidden>
              <DialogTitle>Avatar Image Viewer</DialogTitle>
            </VisuallyHidden>
            <VisuallyHidden>
              <DialogDescription id="avatar-viewer-description">
                Enlarged view of {alt}. Use controls to zoom, rotate or download the image. Click outside to close.
              </DialogDescription>
            </VisuallyHidden>
          </DialogHeader>

          {/* Header Controls */}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2 flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRotate}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                title="Rotate"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="bg-black/50 backdrop-blur-sm text-white hover:bg-white/20 h-8 w-8 p-0"
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Image Container */}
          <div 
            className="flex items-center justify-center min-h-[400px] bg-black/95 cursor-pointer"
            onClick={() => setIsOpen(false)}
          >
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                cursor: zoom > 1 ? 'grab' : 'pointer'
              }}
              onClick={(e) => e.stopPropagation()}
              draggable={false}
            />
          </div>

          {/* Footer Info */}
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white">
              <p className="text-sm font-medium truncate">{alt}</p>
              <p className="text-xs text-white/70">
                Zoom: {Math.round(zoom * 100)}% | Rotation: {rotation}° | Click outside to close
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}