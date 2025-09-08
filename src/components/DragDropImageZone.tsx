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
        absolute inset-0 border-2 border-dashed transition-all duration-300 cursor-pointer rounded-xl
        ${isDragging 
          ? 'border-primary bg-primary/10 scale-[1.02] shadow-lg shadow-primary/20' 
          : 'border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/5 hover:shadow-md'
        }
        ${className}
      `}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="h-full flex flex-col items-center justify-center p-4 text-center space-y-3 max-h-full overflow-hidden">
          {isDragging ? (
            <>
              <div className="flex flex-col items-center space-y-3">
                <div className="relative">
                  <div className="animate-pulse">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                      <Upload className="h-8 w-8 text-primary animate-bounce" />
                    </div>
                  </div>
                  <div className="absolute -inset-2 border-2 border-primary/30 rounded-full animate-ping"></div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold text-primary">Drop images here!</h3>
                  <p className="text-primary/80 text-sm">
                    {draggedUrls.length > 0 
                      ? `${draggedUrls.length} image(s) detected`
                      : 'Release to add images'
                    }
                  </p>
                </div>
              </div>
              
              {/* Preview dragged images */}
              {draggedUrls.length > 0 && (
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={togglePreview}
                    className="text-xs bg-white/90 hover:bg-white border-primary/30 hover:border-primary/50"
                  >
                    <ImageIcon className="h-3 w-3 mr-1" />
                    {showPreview ? 'Hide' : 'Preview'} Images ({draggedUrls.length})
                  </Button>
                  
                  {showPreview && (
                    <div className="bg-white/95 backdrop-blur-sm rounded-lg p-2 border border-primary/20 max-h-24 overflow-hidden">
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5 max-h-20 overflow-y-auto">
                        {draggedUrls.slice(0, 16).map((url, index) => (
                          <div key={index} className="relative group">
                            <ImageWithFallback
                              src={url}
                              alt={`Dragged ${index + 1}`}
                              className="w-full h-8 object-cover rounded border border-primary/20 group-hover:border-primary/50 transition-colors"
                            />
                            <div className="absolute bottom-0 left-0 bg-primary text-white text-xs px-1 py-0.5 rounded-tr rounded-bl font-medium leading-none">
                              {index + 1}
                            </div>
                          </div>
                        ))}
                        {draggedUrls.length > 16 && (
                          <div className="w-full h-8 border border-dashed border-primary/30 rounded flex items-center justify-center text-xs text-primary/70 bg-primary/5">
                            +{draggedUrls.length - 16}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex flex-col items-center space-y-3">
                <div className="relative group">
                  <div className="p-4 bg-gradient-to-br from-muted/30 to-muted/60 rounded-xl group-hover:from-primary/10 group-hover:to-primary/20 transition-all duration-300">
                    <ImageIcon className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground">Drag & Drop Images Here</h3>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    Drag images from your browser, file explorer, or web pages
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center gap-2 text-xs">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-700 dark:text-green-400">
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Google Images</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-700 dark:text-blue-400">
                  <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  <span className="font-medium">File Explorer</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-700 dark:text-purple-400">
                  <div className="w-1 h-1 bg-purple-500 rounded-full"></div>
                  <span className="font-medium">Web Pages</span>
                </div>
              </div>
            </>
          )}
      </div>
    </div>
  )
}