import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { X, ZoomIn, ZoomOut, Download, RotateCw, Maximize2, ChevronLeft, ChevronRight, Copy, ExternalLink, User, Grid3X3 } from 'lucide-react'
import { copyToClipboard } from '../utils/clipboard'

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

interface LightboxWithThumbnailsProps {
  images: string[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onIndexChange: (index: number) => void
  metadata?: LightboxMetadata
  altPrefix?: string
  disableZoom?: boolean // For cast profiles where zoom might not be needed
}

export function LightboxWithThumbnails({ 
  images,
  currentIndex,
  isOpen, 
  onClose, 
  onIndexChange,
  metadata,
  altPrefix = 'Image',
  disableZoom = false
}: LightboxWithThumbnailsProps) {
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [showThumbnails, setShowThumbnails] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const thumbnailsRef = useRef<HTMLDivElement>(null)
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout>()

  const currentImage = images[currentIndex]

  // Reset states when opening/closing or image changes
  useEffect(() => {
    if (isOpen) {
      setZoom(1)
      setPosition({ x: 0, y: 0 })
      setRotation(0)
      setImageLoaded(false)
      setImageError(false)
      setShowControls(true)
      setIsDragging(false)
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
  }, [isOpen, currentIndex])

  // Apply transform to image when zoom changes
  useEffect(() => {
    if (imageRef.current && imageLoaded && !disableZoom) {
      const transformValue = `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`
      imageRef.current.style.transform = transformValue
      imageRef.current.style.transformOrigin = 'center center'
    }
  }, [zoom, position, rotation, imageLoaded, disableZoom])

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

  // Zoom functions
  const handleZoomIn = useCallback(() => {
    if (disableZoom) return
    setZoom(prevZoom => Math.min(prevZoom + 0.5, 4))
    resetControlsTimer()
  }, [disableZoom, resetControlsTimer])

  const handleZoomOut = useCallback(() => {
    if (disableZoom) return
    setZoom(prevZoom => {
      const newZoom = Math.max(prevZoom - 0.5, 0.25)
      if (newZoom <= 1) {
        setPosition({ x: 0, y: 0 })
      }
      return newZoom
    })
    resetControlsTimer()
  }, [disableZoom, resetControlsTimer])

  const handleRotate = useCallback(() => {
    setRotation(prev => prev + 90)
    resetControlsTimer()
  }, [resetControlsTimer])

  const handleReset = useCallback(() => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
    setRotation(0)
    resetControlsTimer()
  }, [resetControlsTimer])

  // Navigation functions
  const handleNext = useCallback(() => {
    if (currentIndex < images.length - 1) {
      onIndexChange(currentIndex + 1)
      setZoom(1)
      setPosition({ x: 0, y: 0 })
      setRotation(0)
    }
    resetControlsTimer()
  }, [currentIndex, images.length, onIndexChange, resetControlsTimer])

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1)
      setZoom(1)
      setPosition({ x: 0, y: 0 })
      setRotation(0)
    }
    resetControlsTimer()
  }, [currentIndex, onIndexChange, resetControlsTimer])

  // Thumbnail click
  const handleThumbnailClick = (index: number) => {
    if (index !== currentIndex) {
      onIndexChange(index)
      setZoom(1)
      setPosition({ x: 0, y: 0 })
      setRotation(0)
    }
    resetControlsTimer()
  }

  // Scroll thumbnails to show current image
  useEffect(() => {
    if (thumbnailsRef.current && isOpen) {
      const thumbnail = thumbnailsRef.current.children[currentIndex] as HTMLElement
      if (thumbnail) {
        thumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [currentIndex, isOpen])

  // Check navigation availability
  const hasNext = currentIndex < images.length - 1
  const hasPrevious = currentIndex > 0

  // Wheel event handler
  const handleWheel = useCallback((e: WheelEvent) => {
    if (disableZoom) return
    e.preventDefault()
    e.stopPropagation()
    
    const delta = e.deltaY
    setZoom(prevZoom => {
      const zoomFactor = delta > 0 ? 0.9 : 1.1
      const newZoom = Math.max(0.25, Math.min(4, prevZoom * zoomFactor))
      
      if (newZoom <= 1) {
        setPosition({ x: 0, y: 0 })
      }
      
      return newZoom
    })
    
    resetControlsTimer()
  }, [disableZoom, resetControlsTimer])

  // Mouse events for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disableZoom || zoom <= 1) return
    e.preventDefault()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
    resetControlsTimer()
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    resetControlsTimer()
    if (isDragging && zoom > 1 && !disableZoom) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Keyboard handling
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      resetControlsTimer()
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (hasPrevious) handlePrevious()
          break
        case 'ArrowRight':
          e.preventDefault()
          if (hasNext) handleNext()
          break
        case 'ArrowUp':
          e.preventDefault()
          if (!disableZoom) handleZoomIn()
          break
        case 'ArrowDown':
          e.preventDefault()
          if (!disableZoom) handleZoomOut()
          break
        case '+':
        case '=':
          e.preventDefault()
          if (!disableZoom) handleZoomIn()
          break
        case '-':
          e.preventDefault()
          if (!disableZoom) handleZoomOut()
          break
        case 'r':
        case 'R':
          handleRotate()
          break
        case '0':
          handleReset()
          break
        case 't':
        case 'T':
          setShowThumbnails(prev => !prev)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleZoomIn, handleZoomOut, handleRotate, handleReset, handleNext, handlePrevious, hasNext, hasPrevious, disableZoom])

  // Wheel event setup
  useEffect(() => {
    if (!isOpen || !containerRef.current || disableZoom) return

    const container = containerRef.current
    container.addEventListener('wheel', handleWheel, { passive: false, capture: true })

    return () => {
      container.removeEventListener('wheel', handleWheel, true)
    }
  }, [isOpen, handleWheel, disableZoom])

  const handleDownload = () => {
    try {
      const link = document.createElement('a')
      link.href = currentImage
      link.download = `${altPrefix}-${currentIndex + 1}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Download failed:', error)
    }
    resetControlsTimer()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen || !currentImage) return null

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
        {/* Close button */}
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

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
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
                {!disableZoom && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleZoomOut}
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
                      onClick={handleZoomIn}
                      disabled={zoom >= 4}
                      className="text-white hover:bg-white/20 h-8 w-8 p-0 disabled:opacity-50"
                      title="Zoom In (+)"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    
                    <div className="w-px h-6 bg-white/20 mx-1" />
                  </>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRotate}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  title="Rotate (R)"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  title="Reset (0)"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                
                <div className="w-px h-6 bg-white/20 mx-1" />
                
                {images.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowThumbnails(prev => !prev)}
                    className="text-white hover:bg-white/20 h-8 w-8 p-0"
                    title="Toggle Thumbnails (T)"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                )}
                
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image container */}
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
            overflow: 'visible',
            paddingBottom: showThumbnails && images.length > 1 ? '120px' : '0px'
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
          {currentImage && (
            <img
              ref={imageRef}
              key={`${currentImage}-${currentIndex}`}
              src={currentImage}
              alt={`${altPrefix} ${currentIndex + 1}`}
              className="select-none"
              style={{
                maxWidth: disableZoom ? '100vw' : (zoom === 1 ? '100vw' : 'none'),
                maxHeight: disableZoom ? '100vh' : (zoom === 1 ? '100vh' : 'none'),
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                cursor: !disableZoom && zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : (!disableZoom && zoom === 1 ? 'zoom-in' : 'default'),
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                transformOrigin: 'center center',
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
                if (!disableZoom && zoom === 1) {
                  handleZoomIn()
                }
              }}
              draggable={false}
            />
          )}
        </div>

        {/* Thumbnails */}
        <AnimatePresence>
          {showThumbnails && images.length > 1 && showControls && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-6 left-6 right-6 z-60"
            >
              <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4 border border-white/10 shadow-xl">
                <div 
                  ref={thumbnailsRef}
                  className="flex gap-2 overflow-x-auto scrollbar-none"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      onClick={() => handleThumbnailClick(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all duration-200 ${
                        index === currentIndex 
                          ? 'border-white shadow-lg scale-110' 
                          : 'border-white/30 hover:border-white/60 hover:scale-105'
                      }`}
                    >
                      <ImageWithFallback
                        src={image}
                        alt={`${altPrefix} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image info with metadata */}
        <AnimatePresence>
          {showControls && imageLoaded && !imageError && (!showThumbnails || images.length === 1) && (
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
                      {`${altPrefix} ${currentIndex + 1}`}
                      {images.length > 1 && (
                        <span className="ml-4 text-sm text-white/70 font-normal">
                          ({currentIndex + 1} / {images.length})
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6 text-sm text-white/70">
                    {images.length > 1 && (
                      <span className="inline-flex items-center gap-2">
                        <span>← → to navigate</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-4 hidden sm:flex">
                      {!disableZoom && (
                        <>
                          <span>↑ ↓ to zoom</span>
                          <span>•</span>
                          <span>Drag to pan</span>
                          <span>•</span>
                        </>
                      )}
                      <span>R to rotate</span>
                      <span>•</span>
                      <span>0 to reset</span>
                      {images.length > 1 && (
                        <>
                          <span>•</span>
                          <span>T for thumbnails</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Metadata section */}
                {metadata && (
                  <div className="border-t border-white/20 pt-4 space-y-3">
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