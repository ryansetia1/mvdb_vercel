import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './ui/button'
import { X, ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react'

interface SimpleImageViewerProps {
  src: string
  alt: string
  isOpen: boolean
  onClose: () => void
  gallery?: string[]
  currentIndex?: number
  onIndexChange?: (index: number) => void
}

export function SimpleImageViewer({ 
  src, 
  alt, 
  isOpen, 
  onClose,
  gallery = [],
  currentIndex = 0,
  onIndexChange
}: SimpleImageViewerProps) {
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  // Touch gesture states
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchStartTime, setTouchStartTime] = useState<number>(0)
  const [lastTapTime, setLastTapTime] = useState<number>(0)
  const [pinchStart, setPinchStart] = useState<{ distance: number; center: { x: number; y: number } } | null>(null)
  const [swipeStart, setSwipeStart] = useState<{ x: number; y: number } | null>(null)
  
  const containerRef = useRef<HTMLDivElement>(null)

  const currentSrc = gallery.length > 0 ? gallery[currentIndex] : src
  const hasGallery = gallery.length > 1

  // Touch utility functions
  const getDistance = (touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const getCenter = (touch1: Touch, touch2: Touch) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    }
  }

  const isDoubleTap = (currentTime: number) => {
    return currentTime - lastTapTime < 300
  }

  // Reset when image changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1)
      setPosition({ x: 0, y: 0 })
      setRotation(0)
      setImageLoaded(false)
      setImageError(false)
      // Disable body scroll when lightbox is open
      document.body.style.overflow = 'hidden'
    } else {
      // Re-enable body scroll when lightbox is closed
      document.body.style.overflow = ''
    }

    return () => {
      // Cleanup: always re-enable scroll on unmount
      document.body.style.overflow = ''
    }
  }, [isOpen, currentSrc])

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 0.5, 3)
    setZoom(newZoom)
  }

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.5, 0.5)
    setZoom(newZoom)
    if (newZoom <= 1) {
      setPosition({ x: 0, y: 0 })
    }
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleDownload = () => {
    try {
      const fileExtension = currentSrc.split('.').pop()?.toLowerCase() || 'jpg'
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
      const fileName = alt 
        ? `${alt.replace(/[^a-z0-9\s]/gi, '_')}_${timestamp}.${fileExtension}`
        : `image_${timestamp}.${fileExtension}`
      
      // Simple new tab opening
      const link = document.createElement('a')
      link.href = currentSrc
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.download = fileName
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log('Image opened in new tab for download:', fileName)
      
    } catch (error) {
      console.error('Download failed:', error)
    }
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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      e.preventDefault()
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

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    const touches = e.touches
    const currentTime = Date.now()
    
    if (touches.length === 1) {
      // Single touch - potential tap or swipe
      const touch = touches[0]
      setTouchStart({ x: touch.clientX, y: touch.clientY })
      setTouchStartTime(currentTime)
      setSwipeStart({ x: touch.clientX, y: touch.clientY })
    } else if (touches.length === 2) {
      // Two touches - pinch gesture
      const distance = getDistance(touches[0], touches[1])
      const center = getCenter(touches[0], touches[1])
      setPinchStart({ distance, center })
      setIsDragging(false) // Stop mouse dragging when pinch starts
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    const touches = e.touches
    
    if (touches.length === 1 && pinchStart === null) {
      // Single touch move - potential swipe for navigation
      const touch = touches[0]
      if (swipeStart && zoom === 1 && hasGallery) {
        const deltaX = touch.clientX - swipeStart.x
        const deltaY = touch.clientY - swipeStart.y
        
        // Check if it's a horizontal swipe (more horizontal than vertical movement)
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
          // Swipe threshold reached
          if (deltaX > 0) {
            // Swipe right - previous image
            handlePrevious()
          } else {
            // Swipe left - next image
            handleNext()
          }
          setSwipeStart(null)
        }
      } else if (zoom > 1) {
        // Pan when zoomed
        if (touchStart) {
          const deltaX = touch.clientX - touchStart.x
          const deltaY = touch.clientY - touchStart.y
          setPosition({
            x: position.x + deltaX,
            y: position.y + deltaY
          })
          setTouchStart({ x: touch.clientX, y: touch.clientY })
        }
      }
    } else if (touches.length === 2 && pinchStart) {
      // Pinch zoom
      const distance = getDistance(touches[0], touches[1])
      const scale = distance / pinchStart.distance
      const newZoom = Math.max(0.5, Math.min(3, zoom * scale))
      
      setZoom(newZoom)
      
      // Adjust position to zoom towards pinch center
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const centerX = pinchStart.center.x - containerRect.left - containerRect.width / 2
        const centerY = pinchStart.center.y - containerRect.top - containerRect.height / 2
        
        setPosition({
          x: position.x + centerX * (scale - 1),
          y: position.y + centerY * (scale - 1)
        })
      }
      
      setPinchStart({ distance, center: getCenter(touches[0], touches[1]) })
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    const currentTime = Date.now()
    
    if (e.touches.length === 0) {
      // All touches ended
      if (pinchStart === null && touchStart && swipeStart) {
        // Single touch ended - check for tap
        const timeDiff = currentTime - touchStartTime
        const touch = e.changedTouches[0]
        
        if (timeDiff < 300 && touchStart) {
          const deltaX = Math.abs(touch.clientX - touchStart.x)
          const deltaY = Math.abs(touch.clientY - touchStart.y)
          
          if (deltaX < 10 && deltaY < 10) {
            // It's a tap
            if (isDoubleTap(currentTime)) {
              // Double tap - reset zoom
              setZoom(1)
              setPosition({ x: 0, y: 0 })
              setRotation(0)
            } else {
              // Single tap - zoom in if at default zoom
              if (zoom === 1) {
                handleZoomIn()
              }
            }
            setLastTapTime(currentTime)
          }
        }
      }
      
      // Reset all touch states
      setTouchStart(null)
      setPinchStart(null)
      setSwipeStart(null)
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
      case 'R':
        handleRotate()
        break
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, hasGallery, currentIndex])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        {/* Close button - Always visible */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ delay: 0.1, duration: 0.2 }}
          className="absolute top-6 right-6 z-60"
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="h-12 w-12 p-0 bg-black/70 hover:bg-black/90 border-white/20 text-white hover:text-white shadow-xl backdrop-blur-sm touch-manipulation"
            title="Close (Esc)"
          >
            <X className="h-6 w-6" />
          </Button>
        </motion.div>

        {/* Navigation for gallery */}
        {hasGallery && (
          <>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              className="absolute left-6 top-1/2 -translate-y-1/2 z-60"
            >
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrevious}
                className="h-14 w-14 p-0 bg-black/70 hover:bg-black/90 border-white/20 text-white hover:text-white shadow-xl backdrop-blur-sm touch-manipulation"
                title="Previous Image (←)"
              >
                <ChevronLeft className="h-7 w-7" />
              </Button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              className="absolute right-6 top-1/2 -translate-y-1/2 z-60"
            >
              <Button
                variant="secondary"
                size="sm"
                onClick={handleNext}
                className="h-14 w-14 p-0 bg-black/70 hover:bg-black/90 border-white/20 text-white hover:text-white shadow-xl backdrop-blur-sm touch-manipulation"
                title="Next Image (→)"
              >
                <ChevronRight className="h-7 w-7" />
              </Button>
            </motion.div>
          </>
        )}

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="absolute top-6 left-6 z-60"
        >
          <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2 border border-white/10 shadow-xl">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="text-white hover:bg-white/20 h-10 w-10 p-0 disabled:opacity-50 touch-manipulation"
              title="Zoom Out (-)"
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center px-3 text-white font-medium min-w-[60px] justify-center text-sm">
              {Math.round(zoom * 100)}%
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="text-white hover:bg-white/20 h-10 w-10 p-0 disabled:opacity-50 touch-manipulation"
              title="Zoom In (+)"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
            
            <div className="w-px h-6 bg-white/20 mx-1" />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRotate}
              className="text-white hover:bg-white/20 h-10 w-10 p-0 touch-manipulation"
              title="Rotate (R)"
            >
              <RotateCw className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-white hover:bg-white/20 h-10 w-10 p-0 touch-manipulation"
              title="Download"
            >
              <Download className="h-5 w-5" />
            </Button>
          </div>
        </motion.div>

        {/* Image container */}
        <div 
          ref={containerRef}
          className="absolute inset-0 flex items-center justify-center"
          onClick={handleBackdropClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            touchAction: 'none',
            userSelect: 'none',
            overflow: 'visible',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none'
          }}
        >
          {/* Loading state */}
          {!imageLoaded && !imageError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-10"
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="rounded-full h-12 w-12 border-2 border-white/30 border-t-white mx-auto mb-4"
                />
                <p className="text-white/80 text-lg">Loading image...</p>
              </div>
            </motion.div>
          )}

          {/* Error state */}
          {imageError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center text-white/80 z-10"
            >
              <div className="bg-red-500/20 rounded-lg p-6 border border-red-500/30">
                <p className="text-lg mb-2">Failed to load image</p>
                <p className="text-sm text-white/60">The image could not be displayed</p>
              </div>
            </motion.div>
          )}

          {/* Image */}
          {currentSrc && (
            <img
              key={currentSrc}
              src={currentSrc}
              alt={alt}
              className="select-none"
              style={{
                maxWidth: zoom === 1 ? '100vw' : 'none',
                maxHeight: zoom === 1 ? '100vh' : 'none',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                transformOrigin: 'center center',
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                pointerEvents: 'auto',
                display: imageLoaded && !imageError ? 'block' : 'none'
              }}
              onLoad={() => {
                setImageLoaded(true)
                setImageError(false)
              }}
              onError={() => {
                setImageLoaded(true)
                setImageError(true)
              }}
              onClick={(e) => {
                e.stopPropagation()
                if (zoom === 1) {
                  handleZoomIn()
                }
              }}
              draggable={false}
            />
          )}
        </div>

        {/* Bottom info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-6 left-6 right-6 z-60"
        >
          <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4 border border-white/10 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate text-lg">
                  {alt}
                  {hasGallery && gallery.length > 1 && (
                    <span className="ml-4 text-sm text-white/70 font-normal">
                      ({currentIndex + 1} / {gallery.length})
                    </span>
                  )}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6 text-sm text-white/70">
                {hasGallery && gallery.length > 1 && (
                  <span className="inline-flex items-center gap-2">
                    <span>← → to navigate</span>
                  </span>
                )}
                    <span className="inline-flex items-center gap-4 hidden sm:flex">
                      <span>↑ ↓ to zoom</span>
                      <span>•</span>
                      <span>Drag to pan</span>
                      <span>•</span>
                      <span>R to rotate</span>
                      <span>•</span>
                      <span>Click outside to close</span>
                    </span>
                    <span className="inline-flex items-center gap-4 sm:hidden">
                      <span>Pinch to zoom</span>
                      <span>•</span>
                      <span>Swipe to navigate</span>
                      <span>•</span>
                      <span>Tap to zoom</span>
                    </span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}