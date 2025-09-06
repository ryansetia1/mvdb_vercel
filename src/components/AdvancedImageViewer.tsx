import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { VisuallyHidden } from './ui/visually-hidden'
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Maximize2, 
  Minimize2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Info
} from 'lucide-react'
import { cn } from './ui/utils'

interface AdvancedImageViewerProps {
  src: string
  alt: string
  isOpen: boolean
  onClose: () => void
  gallery?: string[]
  currentIndex?: number
  onIndexChange?: (index: number) => void
}

export function AdvancedImageViewer({ 
  src, 
  alt, 
  isOpen, 
  onClose,
  gallery = [],
  currentIndex = 0,
  onIndexChange
}: AdvancedImageViewerProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [flipHorizontal, setFlipHorizontal] = useState(false)
  const [flipVertical, setFlipVertical] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentSrc = gallery.length > 0 ? gallery[currentIndex] : src
  const hasGallery = gallery.length > 1

  // Reset transformations when image changes
  useEffect(() => {
    resetTransformations()
  }, [currentSrc])

  // Reset transformations when dialog opens
  useEffect(() => {
    if (isOpen) {
      resetTransformations()
    }
  }, [isOpen])

  const resetTransformations = () => {
    setZoom(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
    setFlipHorizontal(false)
    setFlipVertical(false)
    setImageLoaded(false)
  }

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 5))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.1))
  const handleRotateClockwise = () => setRotation(prev => (prev + 90) % 360)
  const handleRotateCounterClockwise = () => setRotation(prev => (prev - 90 + 360) % 360)
  const handleFlipHorizontal = () => setFlipHorizontal(prev => !prev)
  const handleFlipVertical = () => setFlipVertical(prev => !prev)
  
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight
    })
    setImageLoaded(true)
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = currentSrc
    link.download = alt || 'image'
    link.click()
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handlePrevious = () => {
    if (hasGallery && onIndexChange) {
      const newIndex = currentIndex > 0 ? currentIndex - 1 : gallery.length - 1
      onIndexChange(newIndex)
    }
  }

  const handleNext = () => {
    if (hasGallery && onIndexChange) {
      const newIndex = currentIndex < gallery.length - 1 ? currentIndex + 1 : 0
      onIndexChange(newIndex)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return
    
    switch (e.key) {
      case 'Escape':
        onClose()
        break
      case 'ArrowLeft':
        if (hasGallery) handlePrevious()
        break
      case 'ArrowRight':
        if (hasGallery) handleNext()
        break
      case '+':
      case '=':
        handleZoomIn()
        break
      case '-':
        handleZoomOut()
        break
      case 'r':
        handleRotateClockwise()
        break
      case 'R':
        handleRotateCounterClockwise()
        break
      case '0':
        resetTransformations()
        break
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, hasGallery, currentIndex])

  const transformStyle = {
    transform: `
      translate(${position.x}px, ${position.y}px) 
      scale(${zoom}) 
      rotate(${rotation}deg)
      scaleX(${flipHorizontal ? -1 : 1})
      scaleY(${flipVertical ? -1 : 1})
    `,
    cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
    transition: isDragging ? 'none' : 'transform 0.2s ease'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "max-w-7xl max-h-screen p-0 overflow-hidden border-0",
          isFullscreen && "w-screen h-screen max-w-none max-h-none"
        )}
        aria-describedby="image-viewer-description"
      >
        <DialogHeader>
          <VisuallyHidden>
            <DialogTitle>Image Viewer</DialogTitle>
          </VisuallyHidden>
          <VisuallyHidden>
            <DialogDescription id="image-viewer-description">
              Advanced image viewer with zoom, rotate, and navigation controls. Use keyboard shortcuts: arrows to navigate, +/- to zoom, R to rotate, Escape to close.
            </DialogDescription>
          </VisuallyHidden>
        </DialogHeader>

        {/* Top Controls */}
        <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start">
          <div className="bg-black/70 backdrop-blur-sm rounded-lg p-2 flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 0.1}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              title="Zoom Out (-)"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 5}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              title="Zoom In (+)"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center px-2 text-white text-xs">
              {Math.round(zoom * 100)}%
            </div>
          </div>

          <div className="bg-black/70 backdrop-blur-sm rounded-lg p-2 flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRotateCounterClockwise}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              title="Rotate Left (Shift+R)"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRotateClockwise}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              title="Rotate Right (R)"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFlipHorizontal}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              title="Flip Horizontal"
            >
              <FlipHorizontal className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFlipVertical}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              title="Flip Vertical"
            >
              <FlipVertical className="h-4 w-4" />
            </Button>
          </div>

          <div className="bg-black/70 backdrop-blur-sm rounded-lg p-2 flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInfo(!showInfo)}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              title="Image Info"
            >
              <Info className="h-4 w-4" />
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
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Gallery Navigation */}
        {hasGallery && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/70 text-white hover:bg-white/20 h-12 w-12 p-0"
              title="Previous (←)"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/70 text-white hover:bg-white/20 h-12 w-12 p-0"
              title="Next (→)"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Main Image Container */}
        <div 
          ref={containerRef}
          className="flex items-center justify-center min-h-[500px] bg-black cursor-pointer relative overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose()
            }
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            ref={imageRef}
            src={currentSrc}
            alt={alt}
            className="max-w-full max-h-full object-contain select-none"
            style={transformStyle}
            onLoad={handleImageLoad}
            onClick={(e) => {
              e.stopPropagation()
              if (zoom === 1) {
                handleZoomIn()
              }
            }}
            draggable={false}
          />
          
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-2"></div>
                <p className="text-sm">Loading image...</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Info Panel */}
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center justify-between text-white">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{alt}</h3>
                {hasGallery && (
                  <p className="text-sm text-white/70">
                    {currentIndex + 1} of {gallery.length}
                  </p>
                )}
              </div>
              
              {showInfo && imageLoaded && (
                <div className="text-xs text-white/70 text-right space-y-1">
                  <p>Dimensions: {imageDimensions.width} × {imageDimensions.height}</p>
                  <p>Zoom: {Math.round(zoom * 100)}% | Rotation: {rotation}°</p>
                  <div className="flex gap-1">
                    {flipHorizontal && <Badge variant="secondary" className="text-xs">H-Flip</Badge>}
                    {flipVertical && <Badge variant="secondary" className="text-xs">V-Flip</Badge>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="absolute bottom-16 right-4 z-20">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2 text-xs text-white/70">
            Click outside to close | Drag when zoomed | Scroll or +/- to zoom
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}