import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { X, ZoomIn, ZoomOut, Download, RotateCw, Maximize2, ChevronLeft, ChevronRight, Copy, ExternalLink, User, Heart } from 'lucide-react'
import { copyToClipboard } from '../utils/clipboard'
import { toast } from 'sonner'

interface LightboxMetadata {
  sourceType?: 'movie' | 'photobook'
  sourceTitle?: string
  movieCode?: string
  actresses?: string[]
  actors?: string[]
  releaseDate?: string
  onTitleClick?: () => void
  onCastClick?: (type: 'actor' | 'actress', name: string) => void
}

interface ModernLightboxProps {
  src: string
  alt: string
  isOpen: boolean
  onClose: () => void
  // Navigation props
  currentIndex?: number
  totalImages?: number
  onNext?: () => void
  onPrevious?: () => void
  showNavigation?: boolean
  // New metadata props
  metadata?: LightboxMetadata
  // Favorite props
  isFavorite?: boolean
  onToggleFavorite?: () => void
  accessToken?: string
  // Zoom props
  defaultZoom?: number
}

export function ModernLightbox({ 
  src, 
  alt, 
  isOpen, 
  onClose, 
  currentIndex = 0,
  totalImages = 1,
  onNext,
  onPrevious,
  showNavigation = false,
  metadata,
  isFavorite = false,
  onToggleFavorite,
  accessToken,
  defaultZoom = 1
}: ModernLightboxProps) {
  const [zoom, setZoom] = useState(defaultZoom)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout>()
  const lastClickTimeRef = useRef<number>(0)

  // Update zoom when defaultZoom changes
  useEffect(() => {
    console.log('🎯 ModernLightbox: defaultZoom changed to:', defaultZoom)
    setZoom(defaultZoom)
  }, [defaultZoom])

  // Reset states when opening/closing or src changes
  useEffect(() => {
    if (isOpen) {
      console.log('🎯 ModernLightbox: Setting zoom to defaultZoom:', defaultZoom)
      setZoom(defaultZoom)
      setPosition({ x: 0, y: 0 })
      setRotation(0)
      setImageLoaded(false)
      setImageError(false)
      setShowControls(true)
      setIsDragging(false)
      setIsDownloading(false)
      document.body.style.overflow = 'hidden'
      resetControlsTimer()
    } else {
      document.body.style.overflow = ''
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current)
      }
    }

    return () => {
      document.body.style.overflow = ''
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current)
      }
    }
  }, [isOpen, src, defaultZoom])

  // Apply transform directly to image when zoom changes
  useEffect(() => {
    if (imageRef.current && imageLoaded) {
      const transformValue = `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`
      console.log('Applying transform:', transformValue)
      imageRef.current.style.transform = transformValue
      imageRef.current.style.transformOrigin = 'center center'
    }
  }, [zoom, position, rotation, imageLoaded])

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true)
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current)
    }
    hideControlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 3000)
  }, [])

  // Zoom functions with useCallback for stable references
  const handleZoomIn = useCallback(() => {
    console.log('Zoom in clicked, current zoom:', zoom)
    setZoom(prevZoom => {
      const newZoom = Math.min(prevZoom + 0.5, 4)
      console.log('New zoom:', newZoom)
      return newZoom
    })
    resetControlsTimer()
  }, [zoom, resetControlsTimer])

  const handleZoomOut = useCallback(() => {
    console.log('Zoom out clicked, current zoom:', zoom)
    setZoom(prevZoom => {
      const newZoom = Math.max(prevZoom - 0.5, 0.25)
      console.log('New zoom:', newZoom)
      if (newZoom <= defaultZoom) {
        setPosition({ x: 0, y: 0 })
      }
      return newZoom
    })
    resetControlsTimer()
  }, [zoom, defaultZoom, resetControlsTimer])

  const handleRotate = useCallback(() => {
    console.log('Rotate clicked')
    setRotation(prev => prev + 90)
    resetControlsTimer()
  }, [resetControlsTimer])

  const handleReset = useCallback(() => {
    console.log('Reset clicked')
    setZoom(defaultZoom)
    setPosition({ x: 0, y: 0 })
    setRotation(0)
    resetControlsTimer()
  }, [defaultZoom, resetControlsTimer])

  // Handle double click to reset zoom and position
  const handleDoubleClick = useCallback(() => {
    console.log('Double click detected - resetting zoom and position')
    setZoom(defaultZoom)
    setPosition({ x: 0, y: 0 })
    setRotation(0)
    resetControlsTimer()
  }, [defaultZoom, resetControlsTimer])

  // Navigation functions
  const handleNext = useCallback(() => {
    if (showNavigation && onNext) {
      onNext()
      // Reset image state for new image
      setZoom(defaultZoom)
      setPosition({ x: 0, y: 0 })
      setRotation(0)
    }
    resetControlsTimer()
  }, [showNavigation, onNext, defaultZoom, resetControlsTimer])

  const handlePrevious = useCallback(() => {
    if (showNavigation && onPrevious) {
      onPrevious()
      // Reset image state for new image
      setZoom(defaultZoom)
      setPosition({ x: 0, y: 0 })
      setRotation(0)
    }
    resetControlsTimer()
  }, [showNavigation, onPrevious, defaultZoom, resetControlsTimer])

  // Check if navigation is available
  const hasNext = showNavigation && onNext && currentIndex < totalImages - 1
  const hasPrevious = showNavigation && onPrevious && currentIndex > 0

  // Wheel event handler
  const handleWheel = useCallback((e: WheelEvent) => {
    console.log('Wheel event detected:', e.deltaY)
    e.preventDefault()
    e.stopPropagation()
    
    const delta = e.deltaY
    setZoom(prevZoom => {
      const zoomFactor = delta > 0 ? 0.9 : 1.1
      const newZoom = Math.max(0.25, Math.min(4, prevZoom * zoomFactor))
      console.log('Wheel zoom - prev:', prevZoom, 'new:', newZoom)
      
      if (newZoom <= defaultZoom) {
        setPosition({ x: 0, y: 0 })
      }
      
      return newZoom
    })
    
    resetControlsTimer()
  }, [resetControlsTimer])

  // Wheel event setup
  useEffect(() => {
    if (!isOpen || !containerRef.current) {
      console.log('Wheel event setup skipped - isOpen:', isOpen, 'container:', !!containerRef.current)
      return
    }

    console.log('Setting up wheel event listener')
    const container = containerRef.current
    
    // Add event listener with proper options
    container.addEventListener('wheel', handleWheel, { 
      passive: false,
      capture: true 
    })

    return () => {
      console.log('Cleaning up wheel event listener')
      container.removeEventListener('wheel', handleWheel, true)
    }
  }, [isOpen, handleWheel])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > defaultZoom) {
      e.preventDefault()
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
    resetControlsTimer()
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    resetControlsTimer()
    if (isDragging && zoom > defaultZoom) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleDownload = () => {
    setIsDownloading(true)
    try {
      // Simple and reliable - open in new tab
      const link = document.createElement('a')
      link.href = src
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.download = '' // This will suggest download if server supports it
      
      // Add some attributes that might help with download
      const fileExtension = src.split('.').pop()?.toLowerCase() || 'jpg'
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
      const suggestedName = alt 
        ? `${alt.replace(/[^a-z0-9\s]/gi, '_')}_${timestamp}.${fileExtension}` 
        : `image_${timestamp}.${fileExtension}`
      
      link.download = suggestedName
      
      // Trigger the link
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log('Image opened in new tab for download:', suggestedName)
      toast.success('Image opened in new tab. You can save it from there!')
      
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to open image. Please right-click the image and save manually.')
    } finally {
      setTimeout(() => {
        setIsDownloading(false)
      }, 500)
    }
    resetControlsTimer()
  }

  // Keyboard handling
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('Key pressed:', e.key)
      resetControlsTimer()
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (hasPrevious) {
            handlePrevious()
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          if (hasNext) {
            handleNext()
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          handleZoomIn()
          break
        case 'ArrowDown':
          e.preventDefault()
          handleZoomOut()
          break
        case '+':
        case '=':
          e.preventDefault()
          handleZoomIn()
          break
        case '-':
          e.preventDefault()
          handleZoomOut()
          break
        case 'r':
        case 'R':
          handleRotate()
          break
        case '0':
          handleReset()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleZoomIn, handleZoomOut, handleRotate, handleReset, handleNext, handlePrevious, hasNext, hasPrevious])

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

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
        onMouseMove={resetControlsTimer}
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
            className="h-10 w-10 p-0 bg-black/70 hover:bg-black/90 border-white/20 text-white hover:text-white shadow-xl backdrop-blur-sm"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </Button>
        </motion.div>

        {/* Navigation Arrows - Always visible when available */}
        {showNavigation && (
          <>
            {/* Previous button */}
            {hasPrevious && (
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
                  className="h-12 w-12 p-0 bg-black/70 hover:bg-black/90 border-white/20 text-white hover:text-white shadow-xl backdrop-blur-sm"
                  title="Previous Image (←)"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              </motion.div>
            )}

            {/* Next button */}
            {hasNext && (
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
                  className="h-12 w-12 p-0 bg-black/70 hover:bg-black/90 border-white/20 text-white hover:text-white shadow-xl backdrop-blur-sm"
                  title="Next Image (→)"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </motion.div>
            )}
          </>
        )}

        {/* Controls */}
        <AnimatePresence>
          {showControls && (
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
                  onClick={(e) => {
                    console.log('Zoom out button clicked')
                    e.preventDefault()
                    e.stopPropagation()
                    handleZoomOut()
                  }}
                  disabled={zoom <= 0.25}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0 disabled:opacity-50"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center px-3 text-white font-medium min-w-[60px] justify-center text-sm">
                  {Math.round(zoom * 100)}%
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    console.log('Zoom in button clicked')
                    e.preventDefault()
                    e.stopPropagation()
                    handleZoomIn()
                  }}
                  disabled={zoom >= 4}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0 disabled:opacity-50"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                
                <div className="w-px h-6 bg-white/20 mx-1" />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleRotate()
                  }}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  title="Rotate (R)"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleReset()
                  }}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  title="Reset (0)"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                
                <div className="w-px h-6 bg-white/20 mx-1" />
                
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleDownload()
                  }}
                  disabled={isDownloading}
                  className={`text-white hover:bg-white/20 h-8 w-8 p-0 transition-all duration-200 ${
                    isDownloading ? 'bg-green-500/20 cursor-not-allowed' : ''
                  }`}
                  title={isDownloading ? 'Downloading...' : 'Download Image'}
                >
                  {isDownloading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
                
                {/* Favorite Button - only show if accessToken and onToggleFavorite are provided */}
                {accessToken && onToggleFavorite && (
                  <>
                    <div className="w-px h-6 bg-white/20 mx-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onToggleFavorite()
                      }}
                      className={`text-white hover:bg-white/20 h-8 w-8 p-0 transition-all duration-200 ${
                        isFavorite ? 'text-red-400 hover:text-red-300' : 'hover:text-red-400'
                      }`}
                      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image container with wheel event handling */}
        <div 
          ref={containerRef}
          className="absolute inset-0 flex items-center justify-center"
          onClick={handleBackdropClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            touchAction: 'none',
            userSelect: 'none',
            overflow: 'visible' // Allow image to overflow when zoomed
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

          {/* Image - Removed size constraints to allow scaling */}
          {src && (
            <img
              ref={imageRef}
              key={src}
              src={src}
              alt={alt}
              className="select-none"
              style={{
                // Set initial size to fit viewport nicely
                maxWidth: '90vw',
                maxHeight: '90vh',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                cursor: zoom > defaultZoom ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                transformOrigin: 'center center',
                // Don't set transform here - it's handled by useEffect
                pointerEvents: 'auto',
                // Ensure image is visible
                display: imageLoaded && !imageError ? 'block' : 'none'
              }}
              onLoad={() => {
                console.log('Image loaded successfully')
                setImageLoaded(true)
                setImageError(false)
              }}
              onError={() => {
                console.error('Image failed to load')
                setImageLoaded(true)
                setImageError(true)
              }}
              onClick={(e) => {
                e.stopPropagation()
                const currentTime = Date.now()
                const timeDiff = currentTime - lastClickTimeRef.current
                
                if (timeDiff < 300) {
                  // Double click detected (within 300ms)
                  handleDoubleClick()
                } else {
                  // Single click - zoom in if at default zoom
                  if (zoom === defaultZoom) {
                    console.log('Image clicked - zooming to 2.5x')
                    setZoom(2.5) // Zoom to 2.5x
                  }
                }
                
                lastClickTimeRef.current = currentTime
              }}
              draggable={false}
            />
          )}
        </div>

        {/* Image info */}
        <AnimatePresence>
          {showControls && imageLoaded && !imageError && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-6 left-6 right-6 z-60"
            >
              <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4 border border-white/10 shadow-xl space-y-4">
                {/* Primary image info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate text-lg">
                      {alt}
                      {showNavigation && totalImages > 1 && (
                        <span className="ml-4 text-sm text-white/70 font-normal">
                          ({currentIndex + 1} / {totalImages})
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6 text-sm text-white/70">
                    {showNavigation && totalImages > 1 && (
                      <span className="inline-flex items-center gap-2">
                        <span>← → to navigate</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-4 hidden sm:flex">
                      <span>+ - to zoom</span>
                      <span>•</span>
                      <span>Drag to pan</span>
                      <span>•</span>
                      <span>R to rotate</span>
                      <span>•</span>
                      <span>0 to reset</span>
                    </span>
                  </div>
                </div>

                {/* Metadata section */}
                {metadata && (
                  <div className="border-t border-white/20 pt-4 space-y-3">
                    {/* Source Info */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {metadata.sourceType && (
                            <Badge variant="secondary" className="text-xs">
                              {metadata.sourceType === 'movie' ? 'Movie' : 'Photobook'}
                            </Badge>
                          )}
                          {metadata.sourceTitle && metadata.onTitleClick && (
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 h-auto text-white hover:text-white/80 text-sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                metadata.onTitleClick?.()
                              }}
                            >
                              {metadata.sourceTitle}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                        </div>
                        
                        {/* Movie Code */}
                        {metadata.movieCode && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white/70">Code:</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-auto text-xs text-white hover:bg-white/10"
                              onClick={(e) => {
                                e.stopPropagation()
                                copyToClipboard(metadata.movieCode!, 'Movie code')
                              }}
                            >
                              {metadata.movieCode}
                              <Copy className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        )}

                        {/* Release Date */}
                        {metadata.releaseDate && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm text-white/70">Released:</span>
                            <span className="text-sm text-white">
                              {new Date(metadata.releaseDate).getFullYear()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Cast Info */}
                      {((metadata.actresses && metadata.actresses.length > 0) || 
                        (metadata.actors && metadata.actors.length > 0)) && (
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-3 w-3 text-white/70" />
                            <span className="text-sm text-white/70">Cast:</span>
                          </div>
                          
                          <div className="space-y-2">
                            {/* Actresses */}
                            {metadata.actresses && metadata.actresses.length > 0 && (
                              <div>
                                <p className="text-xs text-white/60 mb-1">Actresses:</p>
                                <div className="flex flex-wrap gap-1">
                                  {metadata.actresses.map((actress, index) => (
                                    <Button
                                      key={index}
                                      variant="ghost"
                                      size="sm"
                                      className="p-1 h-auto text-xs text-white hover:bg-white/10"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        metadata.onCastClick?.('actress', actress)
                                      }}
                                    >
                                      {actress}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Actors */}
                            {metadata.actors && metadata.actors.length > 0 && (
                              <div>
                                <p className="text-xs text-white/60 mb-1">Actors:</p>
                                <div className="flex flex-wrap gap-1">
                                  {metadata.actors.map((actor, index) => (
                                    <Button
                                      key={index}
                                      variant="ghost"
                                      size="sm"
                                      className="p-1 h-auto text-xs text-white hover:bg-white/10"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        metadata.onCastClick?.('actor', actor)
                                      }}
                                    >
                                      {actor}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}