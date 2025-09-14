/**
 * SaveableGallery - Wrapper untuk EnhancedGallery dengan fitur save/load
 */

import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { EnhancedGallery } from './EnhancedGallery'
import { ModernLightbox } from './ModernLightbox'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { savedGalleryApi, type SavedGalleryData } from '../utils/savedGalleryApi'
import { parsedGalleryApi, type ParsedGalleryData } from '../utils/parsedGalleryApi'
import { useGalleryCache } from '../hooks/useGalleryCache'
import { Save, RefreshCw, Database, Clock, Grid, List, Eye, Loader2, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface SaveableGalleryProps {
  galleryTemplate: string
  dmcode?: string
  targetImageCount?: number
  accessToken?: string
  movieData?: {
    id?: string
    titleEn?: string
    titleJp?: string
    code?: string
    actress?: string
    actors?: string
    releaseDate?: string
    studio?: string
  }
}

export function SaveableGallery({
  galleryTemplate,
  dmcode,
  targetImageCount = 100,
  accessToken,
  movieData
}: SaveableGalleryProps) {
  const [savedData, setSavedData] = useState<SavedGalleryData | null>(null)
  const [parsedData, setParsedData] = useState<ParsedGalleryData | null>(null)
  const [gallerySource, setGallerySource] = useState<'cached' | 'user_saved' | 'parsed' | 'fresh' | null>(null)
  const [isLoadingSaved, setIsLoadingSaved] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [useEnhancedGallery, setUseEnhancedGallery] = useState(false)
  const [validUrls, setValidUrls] = useState<string[]>([])
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Load gallery with priority: cached → user saved → parsed → fresh
  useEffect(() => {
    const loadGalleryWithPriority = async () => {
      if (!movieData?.id || !accessToken) {
        setIsLoadingSaved(false)
        setUseEnhancedGallery(true)
        setGallerySource('fresh')
        return
      }

      try {
        // Priority 1: Check cached gallery (handled by EnhancedGallery component)
        // Priority 2: Check user saved gallery
        const userSaved = await savedGalleryApi.getSavedGallery(movieData.id, accessToken)
        
        if (userSaved) {
          // Check if template has changed
          const templateChanged = savedGalleryApi.hasTemplateChanged(userSaved, galleryTemplate)
          
          if (!templateChanged) {
            setSavedData(userSaved)
            setValidUrls(userSaved.urls)
            setUseEnhancedGallery(false)
            setGallerySource('user_saved')
            toast.success(`Loaded ${userSaved.urls.length} images from saved gallery`, {
              description: `Saved ${savedGalleryApi.getSaveAgeMinutes(userSaved.savedAt)} minutes ago`
            })
            return
          } else {
            // Template changed, check parsed gallery
            toast.info('Template changed, checking parsed gallery...')
          }
        }

        // Priority 3: Check parsed gallery from R18 JSON
        const parsed = await parsedGalleryApi.getParsedGallery(movieData.id, accessToken)
        
        if (parsed) {
          setParsedData(parsed)
          setValidUrls(parsed.urls)
          setUseEnhancedGallery(false)
          setGallerySource('parsed')
          toast.success(`Loaded ${parsed.urls.length} images from R18 data`, {
            description: `Parsed ${parsedGalleryApi.getParsedAgeMinutes(parsed.parsedAt)} minutes ago`
          })
          return
        }

        // Priority 4: Use enhanced gallery (fresh generation)
        setUseEnhancedGallery(true)
        setGallerySource('fresh')
        
      } catch (error) {
        console.error('Error loading gallery:', error)
        setUseEnhancedGallery(true)
        setGallerySource('fresh')
      } finally {
        setIsLoadingSaved(false)
      }
    }

    loadGalleryWithPriority()
  }, [movieData?.id, galleryTemplate, accessToken])

  // Handle save current valid URLs
  const handleSaveGallery = async (urlsToSave: string[]) => {
    if (!movieData?.id || !accessToken) {
      toast.error('Cannot save: Missing movie ID or access token')
      return
    }

    if (urlsToSave.length === 0) {
      toast.error('No valid URLs to save')
      return
    }

    setIsSaving(true)
    try {
      const success = await savedGalleryApi.saveGallery(
        movieData.id,
        urlsToSave,
        galleryTemplate,
        accessToken
      )

      if (success) {
        const newSavedData: SavedGalleryData = {
          movieId: movieData.id,
          urls: urlsToSave,
          template: galleryTemplate,
          savedAt: Date.now(),
          totalImages: urlsToSave.length
        }
        
        setSavedData(newSavedData)
        setValidUrls(urlsToSave)
        setUseEnhancedGallery(false)
        setGallerySource('user_saved')
        
        toast.success(`Saved ${urlsToSave.length} valid gallery URLs`, {
          description: 'Gallery will now load instantly from database'
        })
      } else {
        toast.error('Failed to save gallery')
      }
    } catch (error) {
      console.error('Error saving gallery:', error)
      toast.error('Error saving gallery')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle refresh (regenerate)
  const handleRefresh = async () => {
    setIsRefreshing(true)
    
    try {
      // Delete saved gallery if exists
      if (savedData && movieData?.id && accessToken) {
        await savedGalleryApi.deleteSavedGallery(movieData.id, accessToken)
      }
      
      // Reset states and use enhanced gallery
      setSavedData(null)
      setParsedData(null)
      setValidUrls([])
      setUseEnhancedGallery(true)
      setGallerySource('fresh')
      
      toast.success('Refreshing gallery...', {
        description: 'Loading fresh images from source'
      })
    } catch (error) {
      console.error('Error refreshing gallery:', error)
      toast.error('Error refreshing gallery')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Open lightbox
  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  // Loading state
  if (isLoadingSaved) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading gallery...</p>
        </div>
      </div>
    )
  }

  // If using saved gallery, render simple grid
  if (!useEnhancedGallery && validUrls.length > 0) {
    return (
      <div className="space-y-4">
        {/* Header with status */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg">
          <div className="flex flex-wrap items-center gap-2">
            {/* Gallery Source Indicator */}
            {gallerySource === 'user_saved' && (
              <Badge variant="default" className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                Saved by User
              </Badge>
            )}
            {gallerySource === 'parsed' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                From R18 Data
              </Badge>
            )}
            
            <span className="text-sm text-muted-foreground">
              {validUrls.length} images
            </span>
            
            {savedData && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {savedGalleryApi.getSaveAgeMinutes(savedData.savedAt)}m ago
              </Badge>
            )}
            {parsedData && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {parsedGalleryApi.getParsedAgeMinutes(parsedData.parsedAt)}m ago
              </Badge>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Saved Gallery Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {validUrls.map((url, index) => (
            <div key={index} className="relative aspect-[3/4] cursor-pointer rounded-lg overflow-hidden">
              <ImageWithFallback
                src={url}
                alt={`Gallery image ${index + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                onClick={() => openLightbox(index)}
              />
              
              {/* Image index - always visible */}
              <div className="absolute top-2 left-2 z-10">
                <Badge variant="secondary" className="text-xs bg-black/70 text-white border-none">
                  {index + 1}
                </Badge>
              </div>
              
              {/* Simple hover overlay with click action */}
              <div 
                className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 hover:opacity-100 rounded-lg"
                onClick={() => openLightbox(index)}
              >
                <div className="bg-white/90 rounded-full p-2 shadow-lg">
                  <Eye className="h-5 w-5 text-gray-700" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cache Info */}
        {savedData && (
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            <div>Saved: {savedGalleryApi.formatSaveTime(savedData.savedAt)}</div>
            <div>Template: {savedData.template}</div>
          </div>
        )}
        {parsedData && (
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            <div>Parsed: {new Date(parsedData.parsedAt).toLocaleString()}</div>
            <div>Source: R18 JSON Data</div>
          </div>
        )}

        {/* Lightbox */}
        <ModernLightbox
          src={validUrls[lightboxIndex] || ''}
          alt={`Gallery image ${lightboxIndex + 1}`}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      </div>
    )
  }

  // If using enhanced gallery, render with save option
  return (
    <div className="space-y-4">
      {/* Enhanced Gallery with Save Option */}
      <EnhancedGalleryWithSave
        galleryTemplate={galleryTemplate}
        dmcode={dmcode}
        targetImageCount={targetImageCount}
        accessToken={accessToken}
        movieData={movieData}
        onSave={handleSaveGallery}
        isSaving={isSaving}
        onGallerySourceChange={(source) => {
          if (source === 'cached') {
            setGallerySource('cached')
          } else if (source === 'fresh') {
            setGallerySource('fresh')
          }
        }}
      />
    </div>
  )
}

// Component wrapper for EnhancedGallery with save functionality
function EnhancedGalleryWithSave({
  galleryTemplate,
  dmcode,
  targetImageCount,
  accessToken,
  movieData,
  onSave,
  isSaving,
  onGallerySourceChange
}: {
  galleryTemplate: string
  dmcode?: string
  targetImageCount?: number
  accessToken?: string
  movieData?: any
  onSave: (urls: string[]) => void
  isSaving: boolean
  onGallerySourceChange?: (source: 'cached' | 'fresh') => void
}) {
  const [validUrls, setValidUrls] = useState<string[]>([])

  return (
    <div className="space-y-4">
      {/* Save Button - only show if we have valid URLs */}
      {validUrls.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={() => onSave(validUrls)}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Save className={`h-4 w-4 ${isSaving ? 'animate-pulse' : ''}`} />
            {isSaving ? 'Saving...' : `Save ${validUrls.length} Valid Images`}
          </Button>
        </div>
      )}

      {/* Enhanced Gallery with URL extraction */}
      <EnhancedGalleryURLExtractor
        galleryTemplate={galleryTemplate}
        dmcode={dmcode}
        targetImageCount={targetImageCount}
        accessToken={accessToken}
        movieData={movieData}
        onValidUrlsChange={setValidUrls}
        onGallerySourceChange={onGallerySourceChange}
      />
    </div>
  )
}

// Enhanced Gallery component that extracts valid URLs
function EnhancedGalleryURLExtractor({ 
  onValidUrlsChange, 
  onGallerySourceChange,
  ...props 
}: { 
  onValidUrlsChange: (urls: string[]) => void 
  onGallerySourceChange?: (source: 'cached' | 'fresh') => void
} & React.ComponentProps<typeof EnhancedGallery>) {
  
  // Use gallery cache to detect cached gallery
  const {
    cachedUrls,
    isLoading: isCacheLoading,
    isCached,
    cacheValid
  } = useGalleryCache({
    dmcode: props.dmcode || '',
    galleryTemplate: props.galleryTemplate,
    accessToken: props.accessToken,
    cacheExpiryHours: 24
  })

  // Update parent when cache status changes
  useEffect(() => {
    if (!isCacheLoading) {
      if (isCached && cacheValid && cachedUrls) {
        onGallerySourceChange?.('cached')
        onValidUrlsChange(cachedUrls)
      } else {
        onGallerySourceChange?.('fresh')
      }
    }
  }, [isCached, cacheValid, cachedUrls, isCacheLoading, onGallerySourceChange, onValidUrlsChange])

  return <EnhancedGallery {...props} />
}