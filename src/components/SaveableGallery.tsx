/**
 * SaveableGallery - Wrapper untuk EnhancedGallery dengan fitur save/load
 */

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { EnhancedGallery } from './EnhancedGallery'
import { ModernLightbox } from './ModernLightbox'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { savedGalleryApi, type SavedGalleryData } from '../utils/savedGalleryApi'
import { Save, RefreshCw, Database, Clock, Grid, List, Eye, Loader2 } from 'lucide-react'
import { toast } from 'sonner@2.0.3'

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
  const [isLoadingSaved, setIsLoadingSaved] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [useEnhancedGallery, setUseEnhancedGallery] = useState(false)
  const [validUrls, setValidUrls] = useState<string[]>([])
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Load saved gallery on mount
  useEffect(() => {
    const loadSavedGallery = async () => {
      if (!movieData?.id || !accessToken) {
        setIsLoadingSaved(false)
        setUseEnhancedGallery(true)
        return
      }

      try {
        const saved = await savedGalleryApi.getSavedGallery(movieData.id, accessToken)
        
        if (saved) {
          // Check if template has changed
          const templateChanged = savedGalleryApi.hasTemplateChanged(saved, galleryTemplate)
          
          if (!templateChanged) {
            setSavedData(saved)
            setValidUrls(saved.urls)
            setUseEnhancedGallery(false)
            toast.success(`Loaded ${saved.urls.length} images from saved gallery`, {
              description: `Saved ${savedGalleryApi.getSaveAgeMinutes(saved.savedAt)} minutes ago`
            })
          } else {
            // Template changed, use enhanced gallery
            setUseEnhancedGallery(true)
            toast.info('Template changed, loading fresh gallery...')
          }
        } else {
          // No saved gallery, use enhanced gallery
          setUseEnhancedGallery(true)
        }
      } catch (error) {
        console.error('Error loading saved gallery:', error)
        setUseEnhancedGallery(true)
      } finally {
        setIsLoadingSaved(false)
      }
    }

    loadSavedGallery()
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
      setValidUrls([])
      setUseEnhancedGallery(true)
      
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
            <Badge variant="default" className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              Saved Gallery
            </Badge>
            
            <span className="text-sm text-muted-foreground">
              {validUrls.length} images
            </span>
            
            {savedData && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {savedGalleryApi.getSaveAgeMinutes(savedData.savedAt)}m ago
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
            <div key={index} className="relative aspect-[3/4] group">
              <ImageWithFallback
                src={url}
                alt={`Gallery image ${index + 1}`}
                className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openLightbox(index)}
              />
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center rounded-lg">
                <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
              
              {/* Image index */}
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="text-xs">
                  {index + 1}
                </Badge>
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

        {/* Lightbox */}
        <ModernLightbox
          images={validUrls}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          startIndex={lightboxIndex}
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
  isSaving
}: {
  galleryTemplate: string
  dmcode?: string
  targetImageCount?: number
  accessToken?: string
  movieData?: any
  onSave: (urls: string[]) => void
  isSaving: boolean
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
      />
    </div>
  )
}

// Enhanced Gallery component that extracts valid URLs
function EnhancedGalleryURLExtractor({ 
  onValidUrlsChange, 
  ...props 
}: { 
  onValidUrlsChange: (urls: string[]) => void 
} & React.ComponentProps<typeof EnhancedGallery>) {
  
  // We'll need to modify EnhancedGallery to expose valid URLs or create our own logic
  // For now, let's render the original EnhancedGallery
  return <EnhancedGallery {...props} />
}