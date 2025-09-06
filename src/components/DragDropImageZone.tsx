import { useState, useRef, useCallback } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { Upload, Plus, X, Link as LinkIcon, Image as ImageIcon } from 'lucide-react'

interface DragDropImageZoneProps {
  onUrlsDropped: (urls: string[]) => void
  className?: string
}

export function DragDropImageZone({ onUrlsDropped, className = "" }: DragDropImageZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [draggedUrls, setDraggedUrls] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const dragCounterRef = useRef(0)

  // Extract URLs from drag data
  const extractUrlsFromDataTransfer = (dataTransfer: DataTransfer): string[] => {
    const urls: string[] = []
    
    // Try to get URLs from different sources
    const text = dataTransfer.getData('text/plain')
    const html = dataTransfer.getData('text/html')
    const uriList = dataTransfer.getData('text/uri-list')
    
    // Extract from URI list (most reliable for dragged images)
    if (uriList) {
      const uriUrls = uriList.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .filter(url => url.startsWith('http'))
      urls.push(...uriUrls)
    }
    
    // Extract from HTML (when dragging from web pages)
    if (html && urls.length === 0) {
      const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["']/gi)
      if (imgMatches) {
        imgMatches.forEach(match => {
          const srcMatch = match.match(/src=["']([^"']+)["']/)
          if (srcMatch && srcMatch[1]) {
            const url = srcMatch[1]
            if (url.startsWith('http')) {
              urls.push(url)
            }
          }
        })
      }
    }
    
    // Extract from plain text (fallback)
    if (text && urls.length === 0) {
      const textUrls = text.split(/\s+/)
        .filter(item => item.startsWith('http'))
        .filter(url => {
          // Basic image URL detection
          const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']
          const urlLower = url.toLowerCase()
          return imageExtensions.some(ext => urlLower.includes(ext)) || 
                 url.includes('image') || 
                 url.includes('img') ||
                 url.includes('photo')
        })
      urls.push(...textUrls)
    }
    
    // Remove duplicates
    return [...new Set(urls)]
  }

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current++
    
    if (dragCounterRef.current === 1) {
      setIsDragging(true)
      
      // Try to extract URLs for preview
      const urls = extractUrlsFromDataTransfer(e.dataTransfer)
      setDraggedUrls(urls)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current--
    
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
      setDraggedUrls([])
      setShowPreview(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current = 0
    setIsDragging(false)
    
    const urls = extractUrlsFromDataTransfer(e.dataTransfer)
    setDraggedUrls([])
    setShowPreview(false)
    
    if (urls.length > 0) {
      onUrlsDropped(urls)
    }
  }, [onUrlsDropped])

  const togglePreview = () => {
    setShowPreview(!showPreview)
  }

  return (
    <div 
      className={`
        absolute inset-0 border-2 border-dashed transition-all duration-200 cursor-pointer rounded-lg
        ${isDragging 
          ? 'border-blue-400 bg-blue-50/90 scale-102' 
          : 'border-muted-foreground/30 hover:border-muted-foreground/50'
        }
        ${className}
      `}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="h-full flex flex-col items-center justify-center p-4 text-center space-y-3">
          {isDragging ? (
            <>
              <div className="flex flex-col items-center space-y-2">
                <div className="animate-bounce">
                  <Upload className="h-12 w-12 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl text-blue-900">Drop images here!</h3>
                  <p className="text-blue-700">
                    {draggedUrls.length > 0 
                      ? `${draggedUrls.length} image(s) detected`
                      : 'Release to add images'
                    }
                  </p>
                </div>
              </div>
              
              {/* Preview dragged images */}
              {draggedUrls.length > 0 && (
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={togglePreview}
                    className="text-xs"
                  >
                    <ImageIcon className="h-3 w-3 mr-1" />
                    {showPreview ? 'Hide' : 'Preview'} Images
                  </Button>
                  
                  {showPreview && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-2 max-h-32 overflow-y-auto">
                      {draggedUrls.slice(0, 12).map((url, index) => (
                        <div key={index} className="relative">
                          <ImageWithFallback
                            src={url}
                            alt={`Dragged ${index + 1}`}
                            className="w-full h-12 object-cover rounded border"
                          />
                          <div className="absolute bottom-0 left-0 bg-black/70 text-white text-xs px-1 rounded-tr">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                      {draggedUrls.length > 12 && (
                        <div className="w-full h-12 border-2 border-dashed rounded flex items-center justify-center text-xs text-muted-foreground">
                          +{draggedUrls.length - 12}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex flex-col items-center space-y-3">
                <div className="p-4 bg-muted/50 rounded-full">
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg">Drag & Drop Images Here</h3>
                  <p className="text-muted-foreground">
                    Drag images from your browser or file explorer
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">✓</Badge>
                  <span>Google Images</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">✓</Badge>
                  <span>File Explorer</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">✓</Badge>
                  <span>Web Pages</span>
                </div>
              </div>
            </>
          )}
      </div>
    </div>
  )
}