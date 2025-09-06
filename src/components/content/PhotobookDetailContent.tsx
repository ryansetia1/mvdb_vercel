import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Label } from '../ui/label'
import { ImageWithFallback } from '../figma/ImageWithFallback'
import { ClickableProfileAvatar } from '../ClickableProfileAvatar'
import { ModernLightbox } from '../ModernLightbox'
import { Photobook, photobookApi, photobookHelpers, ImageTag } from '../../utils/photobookApi'
import { ArrowLeft, Calendar, User, ExternalLink, Images, Shield, Users, Edit3, Save, X } from 'lucide-react'
import { toast } from 'sonner@2.0.3'

interface PhotobookDetailContentProps {
  photobook?: Photobook // Accept photobook object directly
  photobookId?: string  // Or accept photobook ID to fetch
  accessToken: string
  onBack: () => void
  onActressSelect?: (actressName: string) => void
  onProfileSelect?: (type: 'actress', name: string) => void
  showEditButton?: boolean
  onPhotobookUpdated?: (photobook: Photobook) => void
}

export function PhotobookDetailContent({ 
  photobook: initialPhotobook, 
  photobookId, 
  accessToken, 
  onBack, 
  onActressSelect,
  onProfileSelect,
  showEditButton = false,
  onPhotobookUpdated 
}: PhotobookDetailContentProps) {
  const [photobook, setPhotobook] = useState<Photobook | null>(initialPhotobook || null)
  const [isLoading, setIsLoading] = useState(!initialPhotobook && !!photobookId)
  const [error, setError] = useState('')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [galleryTab, setGalleryTab] = useState<'all' | 'nn' | 'n'>('nn')
  const [isEditingRatings, setIsEditingRatings] = useState(false)
  const [isSavingRatings, setIsSavingRatings] = useState(false)

  useEffect(() => {
    // If we have a photobook object, use it directly
    if (initialPhotobook) {
      console.log('PhotobookDetailContent: Using provided photobook:', initialPhotobook.id, initialPhotobook.titleEn)
      console.log('ImageTags in provided photobook:', initialPhotobook.imageTags)
      console.log('Main actress in photobook:', initialPhotobook.actress)
      setPhotobook(initialPhotobook)
      setIsLoading(false)
      setError('')
      return
    }

    // If we have a photobookId, fetch the photobook
    if (photobookId) {
      console.log('PhotobookDetailContent: Fetching photobook by ID:', photobookId)
      loadPhotobook()
    }
  }, [initialPhotobook, photobookId, accessToken])

  const loadPhotobook = async () => {
    if (!photobookId) {
      setError('No photobook ID provided')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      console.log('PhotobookDetailContent: Calling photobookApi.getPhotobook with ID:', photobookId)
      const data = await photobookApi.getPhotobook(photobookId, accessToken)
      console.log('PhotobookDetailContent: Successfully loaded photobook:', data)
      console.log('ImageTags in fetched photobook:', data.imageTags)
      console.log('Main actress in fetched photobook:', data.actress)
      setPhotobook(data)
    } catch (error: any) {
      console.error('PhotobookDetailContent: Failed to load photobook:', error)
      
      console.error('PhotobookDetailContent: Error details:', {
        photobookId,
        accessToken: accessToken ? 'present' : 'missing',
        errorMessage: error.message,
        errorStack: error.stack
      })
      setError(`Failed to load photobook details: ${error.message}`)
      toast.error('Failed to load photobook details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageClick = (images: string[], index: number) => {
    console.log('=== handleImageClick called ===')
    console.log('Images array:', images)
    console.log('Index:', index)
    console.log('Selected image URL:', images[index])
    
    setLightboxImages(images)
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  // Navigation handlers for ModernLightbox
  const handleLightboxNext = () => {
    setLightboxIndex(prevIndex => 
      prevIndex < lightboxImages.length - 1 ? prevIndex + 1 : 0
    )
  }

  const handleLightboxPrevious = () => {
    setLightboxIndex(prevIndex => 
      prevIndex > 0 ? prevIndex - 1 : lightboxImages.length - 1
    )
  }

  const handleActressClick = (actressName: string) => {
    if (onActressSelect) {
      onActressSelect(actressName)
    } else if (onProfileSelect) {
      onProfileSelect('actress', actressName)
    }
  }

  // Toggle content rating editing mode
  const handleToggleEditRatings = () => {
    if (isEditingRatings) {
      // Cancel editing
      setIsEditingRatings(false)
    } else {
      // Start editing
      setIsEditingRatings(true)
    }
  }

  // Handle content rating change for a specific image
  const handleRatingChange = async (imageUrl: string, newRating: 'NN' | 'N' | null) => {
    if (!photobook) return

    // Ensure imageTags is initialized
    const currentTags = photobook.imageTags || []

    // Find the image tag for this URL
    const tagIndex = currentTags.findIndex(tag => tag.url === imageUrl)
    
    let updatedTags: ImageTag[]
    
    if (tagIndex === -1) {
      // If image doesn't exist in tags, create a new tag
      const newTag: ImageTag = {
        url: imageUrl,
        actresses: photobook.actress ? [photobook.actress] : [],
        contentRating: newRating
      }
      updatedTags = [...currentTags, newTag]
    } else {
      // Update existing tag
      updatedTags = [...currentTags]
      updatedTags[tagIndex] = {
        ...updatedTags[tagIndex],
        contentRating: newRating
      }
    }

    const updatedPhotobook = {
      ...photobook,
      imageTags: updatedTags
    }

    setPhotobook(updatedPhotobook)

    try {
      // Update on server
      await photobookApi.updatePhotobook(photobook.id!, { imageTags: updatedTags }, accessToken)
      
      // Notify parent if callback provided
      if (onPhotobookUpdated) {
        onPhotobookUpdated(updatedPhotobook)
      }

      const ratingText = newRating ? newRating : 'unrated'
      toast.success(`Image rating updated to ${ratingText}`)
    } catch (error: any) {
      console.error('Failed to update image rating:', error)
      
      // Revert the local state change on error
      setPhotobook(photobook)
      toast.error('Failed to update image rating')
    }
  }

  // Save all rating changes (if we want a batch save approach)
  const handleSaveRatings = async () => {
    if (!photobook || !photobook.imageTags) return

    setIsSavingRatings(true)

    try {
      await photobookApi.updatePhotobook(photobook.id!, { imageTags: photobook.imageTags }, accessToken)
      
      if (onPhotobookUpdated) {
        onPhotobookUpdated(photobook)
      }

      setIsEditingRatings(false)
      toast.success('Content ratings saved successfully')
    } catch (error: any) {
      console.error('Failed to save ratings:', error)
      toast.error('Failed to save content ratings')
    } finally {
      setIsSavingRatings(false)
    }
  }

  // Get current rating for an image
  const getImageRating = (imageUrl: string): 'NN' | 'N' | null => {
    if (!photobook?.imageTags) return null
    
    const tag = photobook.imageTags.find(tag => tag.url === imageUrl)
    return tag?.contentRating || null
  }

  // Get actresses tagged in a specific image
  const getImageActresses = (imageUrl: string): string[] => {
    console.log('=== getImageActresses called ===')
    console.log('Image URL:', imageUrl)
    console.log('Photobook imageTags:', photobook?.imageTags)
    
    if (!photobook?.imageTags || photobook.imageTags.length === 0) {
      console.log('No imageTags found, using main actress as fallback')
      // Fallback to main actress if no imageTags
      if (photobook?.actress) {
        const fallbackActresses = [photobook.actress]
        console.log('Fallback actresses:', fallbackActresses)
        return fallbackActresses
      }
      return []
    }
    
    const tag = photobook.imageTags.find(tag => tag.url === imageUrl)
    console.log('Found tag for image:', tag)
    
    let actresses = tag?.actresses || []
    
    // If no actresses in tag but we have main actress, use it as fallback
    if (actresses.length === 0 && photobook?.actress) {
      actresses = [photobook.actress]
      console.log('No actresses in tag, using main actress as fallback:', actresses)
    }
    
    console.log('Final actresses:', actresses)
    return actresses
  }

  // Get metadata for lightbox
  const getLightboxMetadata = (imageUrl: string) => {
    const actresses = getImageActresses(imageUrl)
    const contentRating = getImageRating(imageUrl)
    
    console.log('Creating lightbox metadata for:', imageUrl)
    console.log('Actresses:', actresses)
    console.log('Photobook title:', photobook?.titleEn || photobook?.titleJp)
    
    const metadata = {
      sourceType: 'photobook' as const,
      sourceTitle: photobook?.titleEn || photobook?.titleJp || '',
      actresses: actresses,
      actors: [], // Photobooks typically don't have actors
      releaseDate: photobook?.releaseDate,
      onTitleClick: () => {
        // Already on photobook page, no action needed
        console.log('Title clicked - already on photobook page')
      },
      onCastClick: (type: 'actor' | 'actress', name: string) => {
        console.log('Cast clicked:', type, name)
        setLightboxOpen(false) // Close lightbox first
        handleActressClick(name) // Navigate to actress profile
      }
    }
    
    console.log('Final metadata:', metadata)
    return metadata
  }

  // Handle image click in edit mode vs view mode
  const handleImageClickOrEdit = (imageUrl: string, images: string[], index: number, e: React.MouseEvent) => {
    if (isEditingRatings) {
      e.stopPropagation()
      
      // Cycle through ratings: null -> NN -> N -> null
      const currentRating = getImageRating(imageUrl)
      let newRating: 'NN' | 'N' | null
      
      if (currentRating === null) {
        newRating = 'NN'
      } else if (currentRating === 'NN') {
        newRating = 'N'
      } else {
        newRating = null
      }
      
      handleRatingChange(imageUrl, newRating)
    } else {
      handleImageClick(images, index)
    }
  }

  // Get filtered images based on current gallery tab
  const getFilteredImages = (): string[] => {
    if (!photobook) return []
    
    switch (galleryTab) {
      case 'nn':
        return photobookHelpers.getImagesByRating(photobook, 'NN')
      case 'n':
        return photobookHelpers.getImagesByRating(photobook, 'N')
      case 'all':
      default:
        return photobookHelpers.getImagesByRating(photobook) // All images
    }
  }

  // Get image counts for tabs
  const getImageCounts = () => {
    if (!photobook) return { all: 0, nn: 0, n: 0 }
    
    const stats = photobookHelpers.getContentRatingStats(photobook)
    return {
      all: stats.total,
      nn: stats.nn,
      n: stats.n
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading photobook...</p>
        </div>
      </div>
    )
  }

  if (error || !photobook) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || 'Photobook not found'}</p>
        <div className="text-sm text-muted-foreground mb-4">
          <div>Initial Photobook: {initialPhotobook ? '✓ Provided' : '✗ Not provided'}</div>
          <div>Photobook ID: {photobookId || 'Not provided'}</div>
          <div>Access Token: {accessToken ? '✓ Present' : '✗ Missing'}</div>
        </div>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Photobooks
        </Button>
      </div>
    )
  }

  const filteredImages = getFilteredImages()
  const imageCounts = getImageCounts()
  const allActresses = photobookHelpers.getAllActressesFromTags(photobook)

  console.log('=== PhotobookDetailContent Render ===')
  console.log('Photobook data:', {
    id: photobook.id,
    titleEn: photobook.titleEn,
    actress: photobook.actress,
    imageTags: photobook.imageTags,
    totalImages: filteredImages.length
  })

  return (
    <>{/* ModernLightbox with actress metadata */}
      {lightboxOpen && (() => {
        const currentImageUrl = lightboxImages[lightboxIndex]
        console.log('=== Rendering ModernLightbox ===')
        console.log('lightboxOpen:', lightboxOpen)
        console.log('lightboxIndex:', lightboxIndex)
        console.log('lightboxImages.length:', lightboxImages.length)
        console.log('lightboxImages:', lightboxImages)
        console.log('currentImageUrl:', currentImageUrl)
        
        let metadata = undefined
        if (currentImageUrl && photobook) {
          console.log('Generating metadata for:', currentImageUrl)
          metadata = getLightboxMetadata(currentImageUrl)
          console.log('Generated metadata:', metadata)
        } else {
          console.log('Skipping metadata generation:')
          console.log('- currentImageUrl:', currentImageUrl)
          console.log('- photobook exists:', !!photobook)
        }
        
        return (
          <ModernLightbox
            src={currentImageUrl || ''}
            alt={`${photobook.titleEn} - Image ${lightboxIndex + 1}`}
            isOpen={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
            currentIndex={lightboxIndex}
            totalImages={lightboxImages.length}
            onNext={handleLightboxNext}
            onPrevious={handleLightboxPrevious}
            showNavigation={lightboxImages.length > 1}
            metadata={metadata}
          />
        )
      })()}
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Photobooks
        </Button>
      </div>

      {/* Photobook Info */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Left Sidebar - Photobook Details */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Images className="h-5 w-5" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cover */}
              <div className="text-center">
                <div 
                  className={`w-full max-w-48 mx-auto mb-3 aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 relative group ${
                    isEditingRatings && photobook.cover ? 'cursor-pointer ring-2 ring-blue-500 ring-opacity-50' : ''
                  }`}
                  onClick={(e) => {
                    if (isEditingRatings && photobook.cover) {
                      e.stopPropagation()
                      const currentRating = getImageRating(photobook.cover)
                      let newRating: 'NN' | 'N' | null
                      
                      if (currentRating === null) {
                        newRating = 'NN'
                      } else if (currentRating === 'NN') {
                        newRating = 'N'
                      } else {
                        newRating = null
                      }
                      
                      handleRatingChange(photobook.cover, newRating)
                    }
                  }}
                >
                  {photobook.cover ? (
                    <>
                      <ImageWithFallback
                        src={photobook.cover}
                        alt={photobook.titleEn}
                        className="w-full h-full object-cover"
                      />
                      {/* Edit mode overlay */}
                      {isEditingRatings && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Edit3 className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      )}
                      {/* Dynamic Rating Badge for Cover */}
                      {(() => {
                        const coverRating = getImageRating(photobook.cover)
                        return coverRating && (
                          <div className="absolute top-2 right-2">
                            <Badge 
                              variant={coverRating === 'N' ? 'destructive' : 'secondary'} 
                              className="text-xs h-auto py-1 px-2"
                            >
                              {coverRating}
                            </Badge>
                          </div>
                        )
                      })()}
                      {/* Edit Mode Indicator for Cover */}
                      {isEditingRatings && (
                        <div className="absolute top-2 left-2">
                          <Badge variant="outline" className="text-xs h-auto py-1 px-2 bg-blue-500 text-white border-blue-500">
                            EDIT
                          </Badge>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Images className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <h2 className="font-bold text-lg">{photobook.titleEn}</h2>
                {photobook.titleJp && (
                  <p className="text-sm text-muted-foreground">{photobook.titleJp}</p>
                )}
              </div>

              {/* Basic Info */}
              <div className="space-y-2">
                {photobook.releaseDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Released: {new Date(photobook.releaseDate).toLocaleDateString()}</span>
                  </div>
                )}

                {/* Featured Actresses */}
                {allActresses.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Featured Actresses:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {allActresses.map((actress, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-2 py-1"
                          onClick={() => handleActressClick(actress)}
                        >
                          {actress}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {photobook.link && (
                  <a
                    href={photobook.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Official Link</span>
                  </a>
                )}
              </div>

              {/* Statistics */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Images className="h-4 w-4" />
                    Total Images
                  </span>
                  <Badge variant="secondary">{imageCounts.all}</Badge>
                </div>

                {allActresses.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Featured Actresses
                    </span>
                    <Badge variant="outline">{allActresses.length}</Badge>
                  </div>
                )}
              </div>


            </CardContent>
          </Card>
        </div>

        {/* Right Content - Gallery with Content Rating Tabs */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Images className="h-5 w-5" />
                  Gallery
                </div>
                {showEditButton && (
                  <div className="flex items-center gap-2">
                    {isEditingRatings && (
                      <div className="text-xs text-muted-foreground mr-2">
                        Click images to cycle: unrated → NN → N → unrated
                      </div>
                    )}
                    <Button
                      variant={isEditingRatings ? "default" : "outline"}
                      size="sm"
                      onClick={handleToggleEditRatings}
                      disabled={isSavingRatings}
                      className="flex items-center gap-2"
                    >
                      {isEditingRatings ? (
                        <>
                          <X className="h-4 w-4" />
                          Cancel
                        </>
                      ) : (
                        <>
                          <Edit3 className="h-4 w-4" />
                          Edit Ratings
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={galleryTab} onValueChange={(value) => setGalleryTab(value as 'all' | 'nn' | 'n')}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="nn" className="flex items-center gap-2" disabled={imageCounts.nn === 0}>
                    <Shield className="h-4 w-4" />
                    NN ({imageCounts.nn})
                  </TabsTrigger>
                  <TabsTrigger value="n" className="flex items-center gap-2" disabled={imageCounts.n === 0}>
                    <Shield className="h-4 w-4" />
                    N ({imageCounts.n})
                  </TabsTrigger>
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    All ({imageCounts.all})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4">
                  {filteredImages.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {filteredImages.map((imageUrl, index) => {
                        const currentRating = getImageRating(imageUrl)
                        return (
                          <div 
                            key={index} 
                            className={`relative aspect-square group cursor-pointer ${isEditingRatings ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                            onClick={(e) => handleImageClickOrEdit(imageUrl, filteredImages, index, e)}
                          >
                            <ImageWithFallback
                              src={imageUrl}
                              alt={`${photobook.titleEn} - Image ${index + 1}`}
                              className="w-full h-full object-cover rounded border group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                {isEditingRatings ? (
                                  <Edit3 className="h-6 w-6 text-white" />
                                ) : (
                                  <Images className="h-6 w-6 text-white" />
                                )}
                              </div>
                            </div>
                            <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                              {index + 1}
                            </div>
                            {/* Dynamic Rating Badge */}
                            {currentRating && (
                              <div className="absolute top-1 right-1">
                                <Badge 
                                  variant={currentRating === 'N' ? 'destructive' : 'secondary'} 
                                  className="text-xs h-auto py-0 px-1"
                                >
                                  {currentRating}
                                </Badge>
                              </div>
                            )}
                            {/* Edit Mode Indicator */}
                            {isEditingRatings && (
                              <div className="absolute top-1 left-1">
                                <Badge variant="outline" className="text-xs h-auto py-0 px-1 bg-blue-500 text-white border-blue-500">
                                  EDIT
                                </Badge>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-12">
                      <Images className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">No images available</p>
                      <p className="text-sm">This photobook doesn't have any images yet</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="nn" className="mt-4">
                  {filteredImages.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {filteredImages.map((imageUrl, index) => (
                        <div 
                          key={index} 
                          className={`relative aspect-square group cursor-pointer ${isEditingRatings ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                          onClick={(e) => handleImageClickOrEdit(imageUrl, filteredImages, index, e)}
                        >
                          <ImageWithFallback
                            src={imageUrl}
                            alt={`${photobook.titleEn} - NN Image ${index + 1}`}
                            className="w-full h-full object-cover rounded border group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              {isEditingRatings ? (
                                <Edit3 className="h-6 w-6 text-white" />
                              ) : (
                                <Images className="h-6 w-6 text-white" />
                              )}
                            </div>
                          </div>
                          <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                            {index + 1}
                          </div>
                          <div className="absolute top-1 right-1">
                            <Badge variant="secondary" className="text-xs h-auto py-0 px-1">
                              NN
                            </Badge>
                          </div>
                          {/* Edit Mode Indicator */}
                          {isEditingRatings && (
                            <div className="absolute top-1 left-1">
                              <Badge variant="outline" className="text-xs h-auto py-0 px-1 bg-blue-500 text-white border-blue-500">
                                EDIT
                              </Badge>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-12">
                      <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">No NN images available</p>
                      <p className="text-sm">This photobook doesn't have any NN-rated images</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="n" className="mt-4">
                  {filteredImages.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {filteredImages.map((imageUrl, index) => (
                        <div 
                          key={index} 
                          className={`relative aspect-square group cursor-pointer ${isEditingRatings ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                          onClick={(e) => handleImageClickOrEdit(imageUrl, filteredImages, index, e)}
                        >
                          <ImageWithFallback
                            src={imageUrl}
                            alt={`${photobook.titleEn} - N Image ${index + 1}`}
                            className="w-full h-full object-cover rounded border group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              {isEditingRatings ? (
                                <Edit3 className="h-6 w-6 text-white" />
                              ) : (
                                <Images className="h-6 w-6 text-white" />
                              )}
                            </div>
                          </div>
                          <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                            {index + 1}
                          </div>
                          <div className="absolute top-1 right-1">
                            <Badge variant="destructive" className="text-xs h-auto py-0 px-1">
                              N
                            </Badge>
                          </div>
                          {/* Edit Mode Indicator */}
                          {isEditingRatings && (
                            <div className="absolute top-1 left-1">
                              <Badge variant="outline" className="text-xs h-auto py-0 px-1 bg-blue-500 text-white border-blue-500">
                                EDIT
                              </Badge>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-12">
                      <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg mb-2">No N images available</p>
                      <p className="text-sm">This photobook doesn't have any N-rated images</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lightbox */}
      <ModernLightbox
        src={lightboxImages[lightboxIndex]}
        alt={`${photobook.titleEn} - Image ${lightboxIndex + 1}`}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        currentIndex={lightboxIndex}
        totalImages={lightboxImages.length}
        onNext={() => {
          if (lightboxIndex < lightboxImages.length - 1) {
            setLightboxIndex(lightboxIndex + 1)
          }
        }}
        onPrevious={() => {
          if (lightboxIndex > 0) {
            setLightboxIndex(lightboxIndex - 1)
          }
        }}
        showNavigation={lightboxImages.length > 1}
      />
    </div>
    </>
  )
}