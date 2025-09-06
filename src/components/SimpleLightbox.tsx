import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { VisuallyHidden } from './ui/visually-hidden'
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react'

interface SimpleLightboxProps {
  src: string
  alt: string
  isOpen: boolean
  onClose: () => void
}

export function SimpleLightbox({ src, alt, isOpen, onClose }: SimpleLightboxProps) {
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setZoom(1)
      setPosition({ x: 0, y: 0 })
      setImageLoaded(false)
      // Prevent body scroll when lightbox is open
      document.body.style.overflow = 'hidden'
    } else {
      // Restore body scroll when lightbox is closed
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, src])

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 0.5, 4)
    setZoom(newZoom)
  }

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.5, 0.5)
    setZoom(newZoom)
    if (newZoom <= 1) {
      setPosition({ x: 0, y: 0 })
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newZoom = Math.max(0.5, Math.min(4, zoom + delta))
    setZoom(newZoom)
    
    if (newZoom <= 1) {
      setPosition({ x: 0, y: 0 })
    }
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

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = src
    link.download = alt || 'image'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return
    
    switch (e.key) {
      case 'Escape':
        onClose()
        break
      case '+':
      case '=':
        handleZoomIn()
        break
      case '-':
        handleZoomOut()
        break
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, zoom])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="w-screen h-screen p-0 m-0 border-0 bg-black overflow-hidden"
        data-lightbox="true"
        aria-describedby="lightbox-description"
      >
        <DialogHeader>
          <VisuallyHidden>
            <DialogTitle>Image Lightbox</DialogTitle>
          </VisuallyHidden>
          <VisuallyHidden>
            <DialogDescription id="lightbox-description">
              Image lightbox for {alt}. Use mouse wheel to zoom, drag to pan when zoomed, Escape to close.
            </DialogDescription>
          </VisuallyHidden>
        </DialogHeader>

        {/* Controls */}
        <div className="absolute top-6 right-6 z-50 flex gap-3">
          <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="text-white hover:bg-white/20 h-9 w-9 p-0"
              title="Zoom Out (-)"
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center px-3 text-white font-medium min-w-[60px] justify-center">
              {Math.round(zoom * 100)}%
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 4}
              className="text-white hover:bg-white/20 h-9 w-9 p-0"
              title="Zoom In (+)"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-white hover:bg-white/20 h-9 w-9 p-0"
              title="Download"
            >
              <Download className="h-5 w-5" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="bg-black/70 backdrop-blur-sm text-white hover:bg-white/20 h-9 w-9 p-0 rounded-lg"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Full viewport image container */}
        <div 
          ref={containerRef}
          className="w-full h-full flex items-center justify-center bg-black cursor-pointer overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose()
            }
          }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent mx-auto mb-4"></div>
                <p className="text-lg">Loading...</p>
              </div>
            </div>
          )}
          
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain select-none transition-transform duration-200"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
            }}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
            onClick={(e) => {
              e.stopPropagation()
              if (zoom === 1) {
                handleZoomIn()
              }
            }}
            draggable={false}
          />
        </div>

        {/* Bottom info overlay */}
        <div className="absolute bottom-6 left-6 right-6 z-40">
          <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-lg">{alt}</p>
              </div>
              <div className="text-sm text-white/80 ml-6">
                Scroll to zoom • Drag to pan • Click outside to close
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}