/**
 * GalleryWithSave - Simple wrapper untuk gallery dengan fitur save dan load
 */

import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { EnhancedGallery } from './EnhancedGallery'
import { ModernLightbox } from './ModernLightbox'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { savedGalleryApi, type SavedGalleryData } from '../utils/savedGalleryApi'
import { parsedGalleryApi, type ParsedGalleryData } from '../utils/parsedGalleryApi'
import { favoritesApi } from '../utils/favoritesApi'
import { RefreshCw, Database, Clock, Eye, Loader2, FileText } from 'lucide-react'
import { SimpleFavoriteButton } from './SimpleFavoriteButton'
import { toast } from 'sonner'

interface GalleryWithSaveProps {
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

export function GalleryWithSave({
  galleryTemplate,
  dmcode,
  targetImageCount = 100,
  accessToken,
  movieData
}: GalleryWithSaveProps) {
  const [savedData, setSavedData] = useState<SavedGalleryData | null>(null)
  const [parsedData, setParsedData] = useState<ParsedGalleryData | null>(null)
  const [gallerySource, setGallerySource] = useState<'cached' | 'user_saved' | 'parsed' | 'fresh' | null>(null)
  const [isLoadingSaved, setIsLoadingSaved] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [useSavedGallery, setUseSavedGallery] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  // State untuk track favorite status di lightbox
  const [currentImageFavorite, setCurrentImageFavorite] = useState(false)

  // Check favorite status for current image when lightbox opens
  useEffect(() => {
    const checkCurrentImageFavorite = async () => {
      const urls = savedData?.urls || parsedData?.urls || []
      if (!lightboxOpen || !accessToken || !urls.length) return
      
      const currentImageUrl = urls[lightboxIndex]
      if (!currentImageUrl) return

      try {
        const favorite = await favoritesApi.checkIsFavorite(
          'image',
          currentImageUrl,
          movieData?.id,
          accessToken
        )
        
        setCurrentImageFavorite(!!favorite)
      } catch (error) {
        console.warn('Failed to check favorite status:', error)
        setCurrentImageFavorite(false)
      }
    }

    checkCurrentImageFavorite()
  }, [lightboxOpen, lightboxIndex, savedData?.urls, parsedData?.urls, accessToken, movieData?.id])

  // Load gallery with priority: cached → user saved → parsed → fresh
  useEffect(() => {
    const loadGalleryWithPriority = async () => {
      if (!movieData?.id || !accessToken) {
        setIsLoadingSaved(false)
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
            setUseSavedGallery(true)
            setGallerySource('user_saved')
            console.log(`Loaded saved gallery: ${userSaved.urls.length} images`)
            return
          } else {
            // Template changed, check parsed gallery
            console.log('Template changed, checking parsed gallery...')
          }
        }

        // Priority 3: Check parsed gallery from R18 JSON
        const parsed = await parsedGalleryApi.getParsedGallery(movieData.id, accessToken)
        
        if (parsed) {
          setParsedData(parsed)
          setUseSavedGallery(true)
          setGallerySource('parsed')
          console.log(`Loaded parsed gallery: ${parsed.urls.length} images`)
          return
        }

        // Priority 4: Use enhanced gallery (fresh generation)
        setGallerySource('fresh')
        
      } catch (error) {
        console.error('Error loading gallery:', error)
        setGallerySource('fresh')
      } finally {
        setIsLoadingSaved(false)
      }
    }

    loadGalleryWithPriority()
  }, [movieData?.id, galleryTemplate, accessToken])

  // Handle save gallery
  const handleSaveGallery = async (urls: string[]) => {
    if (!movieData?.id || !accessToken) {
      toast.error('Cannot save gallery')
      return
    }

    setIsSaving(true)
    try {
      const success = await savedGalleryApi.saveGallery(
        movieData.id,
        urls,
        galleryTemplate,
        accessToken
      )

      if (success) {
        const newSavedData: SavedGalleryData = {
          movieId: movieData.id,
          urls,
          template: galleryTemplate,
          savedAt: Date.now(),
          totalImages: urls.length
        }
        
        setSavedData(newSavedData)
        setUseSavedGallery(true)
        setGallerySource('user_saved')
        
        toast.success(`Gallery saved! ${urls.length} images will load instantly next time`)
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

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    
    try {
      // Delete saved gallery if exists
      if (savedData && movieData?.id && accessToken) {
        await savedGalleryApi.deleteSavedGallery(movieData.id, accessToken)
      }
      
      setSavedData(null)
      setParsedData(null)
      setUseSavedGallery(false)
      setGallerySource('fresh')
      
      toast.success('Gallery refreshed')
    } catch (error) {
      console.error('Error refreshing gallery:', error)
      toast.error('Error refreshing gallery')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Handle toggle favorite for current image in lightbox
  const handleToggleFavorite = async () => {
    const currentImageUrl = (savedData?.urls || parsedData?.urls || [])[lightboxIndex]
    if (!currentImageUrl || !accessToken) return

    try {
      const { isFavorite: newIsFavorite } = await favoritesApi.toggleFavorite(
        'image',
        currentImageUrl,
        accessToken,
        movieData?.id, // sourceId
        {
          sourceType: 'movie',
          sourceTitle: movieData?.titleEn,
          movieCode: movieData?.code,
          actresses: movieData?.actress ? [movieData.actress] : [],
          actors: movieData?.actors || [],
          releaseDate: movieData?.releaseDate
        }
      )
      
      setCurrentImageFavorite(newIsFavorite)
      toast.success(newIsFavorite ? 'Added to favorites' : 'Removed from favorites')
    } catch (error: any) {
      console.error('Failed to toggle favorite:', error)
      
      // Handle specific error cases
      if (error.message?.includes('409') || error.message?.includes('already in favorites')) {
        // Item already exists, treat as success
        setCurrentImageFavorite(true)
        toast.success('Added to favorites')
      } else {
        toast.error('Could not update favorites at this time')
      }
    }
  }

  // Loading state
  if (isLoadingSaved) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  // Render saved gallery (user saved or parsed)
  if (useSavedGallery && (savedData || parsedData)) {
    return (
      <div className="space-y-4">
        {/* Status bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex flex-wrap items-center gap-2">
            {/* Gallery Source Indicator */}
            {gallerySource === 'user_saved' && savedData && (
              <Badge variant="default" className="bg-green-600 flex items-center gap-1">
                <Database className="h-3 w-3" />
                Saved by User
              </Badge>
            )}
            {gallerySource === 'parsed' && parsedData && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                From R18 Data
              </Badge>
            )}
            
            <span className="text-sm text-muted-foreground">
              {(savedData?.urls.length || parsedData?.urls.length || 0)} images
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
            Refresh Gallery
          </Button>
        </div>

        {/* Saved images grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {(savedData?.urls || parsedData?.urls || []).map((url, index) => (
            <div
              key={index}
              className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative cursor-pointer"
            >
              <img
                src={url}
                alt={`Gallery image ${index + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                loading="lazy"
                onClick={() => {
                  console.log('Saved gallery image clicked:', index)
                  setLightboxIndex(index)
                  setLightboxOpen(true)
                }}
              />
              
              {/* Image number badge - always visible */}
              <div className="absolute top-2 left-2 z-10">
                <Badge variant="secondary" className="text-xs bg-black/70 text-white border-none">
                  {index + 1}
                </Badge>
              </div>
              
              {/* Simple hover overlay with click action */}
              <div 
                className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 hover:opacity-100"
                onClick={() => {
                  setLightboxIndex(index)
                  setLightboxOpen(true)
                }}
              >
                <div className="bg-white/90 rounded-full p-2 shadow-lg">
                  <Eye className="h-5 w-5 text-gray-700" />
                </div>
              </div>
              
              {/* Gallery Image Favorite Button - always visible */}
              {accessToken && movieData && (
                <div className="absolute bottom-2 right-2 z-10">
                  <div 
                    className="opacity-70 hover:opacity-100 transition-opacity duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <SimpleFavoriteButton
                      type="image"
                      itemId={url}
                      sourceId={movieData.id || ''}
                      size="sm"
                      variant="ghost"
                      className="bg-white/90 hover:bg-white text-gray-700 hover:text-red-500 shadow-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Info footer */}
        {savedData && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p>Saved: {savedGalleryApi.formatSaveTime(savedData.savedAt)}</p>
            <p>Template: <code className="bg-muted px-1 rounded">{savedData.template}</code></p>
          </div>
        )}
        {parsedData && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p>Parsed: {new Date(parsedData.parsedAt).toLocaleString()}</p>
            <p>Source: R18 JSON Data</p>
          </div>
        )}

        {/* Lightbox */}
        {((savedData?.urls.length || parsedData?.urls.length || 0) > 0) && (
          <ModernLightbox
            src={(savedData?.urls || parsedData?.urls || [])[lightboxIndex] || ''}
            alt={`Gallery image ${lightboxIndex + 1}`}
            isOpen={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
            currentIndex={lightboxIndex}
            totalImages={(savedData?.urls.length || parsedData?.urls.length || 0)}
            onNext={() => {
              const totalImages = (savedData?.urls.length || parsedData?.urls.length || 0)
              if (lightboxIndex < totalImages - 1) {
                setLightboxIndex(lightboxIndex + 1)
              }
            }}
            onPrevious={() => {
              if (lightboxIndex > 0) {
                setLightboxIndex(lightboxIndex - 1)
              }
            }}
            showNavigation={(savedData?.urls.length || parsedData?.urls.length || 0) > 1}
            isFavorite={currentImageFavorite}
            onToggleFavorite={handleToggleFavorite}
            accessToken={accessToken}
          />
        )}
      </div>
    )
  }

  // Render enhanced gallery with save option
  return (
    <EnhancedGallery
      galleryTemplate={galleryTemplate}
      dmcode={dmcode}
      targetImageCount={targetImageCount}
      accessToken={accessToken}
      movieData={movieData}
      showSaveOption={true}
      onSaveGallery={handleSaveGallery}
      isSaving={isSaving}
    />
  )
}