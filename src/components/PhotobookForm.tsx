import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Photobook, photobookApi, ImageTag } from '../utils/photobookApi'
import { CastManager } from './CastManager'
import { DatePicker } from './DatePicker'
import { ImageLinksManager } from './ImageLinksManager'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { Edit3, X } from 'lucide-react'
import { toast } from 'sonner@2.0.3'

interface PhotobookFormProps {
  photobook?: Photobook
  onSave: (photobook: Photobook) => void
  onCancel: () => void
  accessToken: string
}

export function PhotobookForm({ photobook, onSave, onCancel, accessToken }: PhotobookFormProps) {
  const [formData, setFormData] = useState<Partial<Photobook>>({
    titleEn: '',
    titleJp: '',
    link: '',
    cover: '',
    releaseDate: '',
    actress: '',
    imageLinks: '',
    imageTags: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isEditingRatings, setIsEditingRatings] = useState(false)

  useEffect(() => {
    if (photobook) {
      console.log('PhotobookForm - Loading photobook for editing:', {
        id: photobook.id,
        titleEn: photobook.titleEn,
        releaseDate: photobook.releaseDate
      })
      const newFormData = {
        ...photobook,
        imageTags: photobook.imageTags || []
      }
      console.log('PhotobookForm - Setting form data with releaseDate:', newFormData.releaseDate)
      setFormData(newFormData)
    }
  }, [photobook])

  // Debug effect to monitor formData changes
  useEffect(() => {
    console.log('PhotobookForm - formData.releaseDate changed to:', formData.releaseDate)
  }, [formData.releaseDate])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleDateChange = (field: string, date: string) => {
    console.log('PhotobookForm - handleDateChange:', field, date)
    setFormData(prev => ({ ...prev, [field]: date }))
  }

  const handleActressChange = (actress: string) => {
    setFormData(prev => ({ ...prev, actress }))
  }

  const handleImageLinksChange = (links: string) => {
    setFormData(prev => ({ ...prev, imageLinks: links }))
  }

  const handleImageTagsChange = (tags: ImageTag[]) => {
    setFormData(prev => ({ ...prev, imageTags: tags }))
  }

  // Toggle content rating editing mode
  const handleToggleEditRatings = () => {
    setIsEditingRatings(!isEditingRatings)
  }

  // Get current rating for an image
  const getImageRating = (imageUrl: string): 'NN' | 'N' | null => {
    if (!formData.imageTags) return null
    
    const tag = formData.imageTags.find(tag => tag.url === imageUrl)
    return tag?.contentRating || null
  }

  // Handle content rating change for cover image
  const handleCoverRatingChange = (newRating: 'NN' | 'N' | null) => {
    if (!formData.cover) return

    // Ensure imageTags is initialized
    const currentTags = formData.imageTags || []
    
    // Find the image tag for the cover URL
    const tagIndex = currentTags.findIndex(tag => tag.url === formData.cover)
    
    if (tagIndex === -1) {
      // If cover image doesn't exist in tags, create a new tag
      const newTag: ImageTag = {
        url: formData.cover,
        actresses: formData.actress ? [formData.actress] : [],
        contentRating: newRating
      }
      setFormData(prev => ({
        ...prev,
        imageTags: [...currentTags, newTag]
      }))
    } else {
      // Update existing tag
      const updatedTags = [...currentTags]
      updatedTags[tagIndex] = {
        ...updatedTags[tagIndex],
        contentRating: newRating
      }
      setFormData(prev => ({ ...prev, imageTags: updatedTags }))
    }

    const ratingText = newRating ? newRating : 'unrated'
    toast.success(`Cover rating updated to ${ratingText}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.titleEn?.trim()) {
      setError('English title is required')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Debug logging for formData
      console.log('PhotobookForm - submitting formData:', {
        ...formData,
        releaseDate: formData.releaseDate
      })
      
      let savedPhotobook: Photobook
      if (photobook?.id) {
        savedPhotobook = await photobookApi.updatePhotobook(photobook.id, formData, accessToken)
      } else {
        savedPhotobook = await photobookApi.createPhotobook(formData as Photobook, accessToken)
      }
      onSave(savedPhotobook)
      toast.success('Photobook saved successfully!')
    } catch (error: any) {
      console.error('Photobook form save error:', error)
      
      // Handle specific authentication errors
      if (error.message?.includes('401') || error.message?.includes('JWT') || error.message?.includes('Invalid JWT')) {
        setError('Session expired. Please refresh the page and log in again.')
        toast.error('Authentication failed. Please log in again.')
      } else {
        setError(`Failed to save: ${error.message || error}`)
        toast.error(`Failed to save: ${error.message || error}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Get stats from image tags
  const getImageStats = () => {
    const tags = formData.imageTags || []
    const totalImages = tags.length
    const allActresses = tags.flatMap(tag => tag.actresses)
    const uniqueActresses = Array.from(new Set(allActresses))
    
    return {
      totalImages,
      uniqueActresses: uniqueActresses.length,
      actressList: uniqueActresses
    }
  }

  // Parse selected actresses from formData.actress
  const getSelectedActresses = (): string[] => {
    if (!formData.actress?.trim()) return []
    return formData.actress.split(',').map(a => a.trim()).filter(Boolean)
  }

  const stats = getImageStats()
  const selectedActresses = getSelectedActresses()

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {photobook?.id ? `Edit: ${formData.titleEn || 'Photobook'}` : 'Add New Photobook'}
        </CardTitle>
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">
            {error}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="titleEn">English Title *</Label>
              <Input
                id="titleEn"
                name="titleEn"
                value={formData.titleEn || ''}
                onChange={handleInputChange}
                placeholder="Enter English title"
                required
              />
            </div>
            <div>
              <Label htmlFor="titleJp">Japanese Title</Label>
              <Input
                id="titleJp"
                name="titleJp"
                value={formData.titleJp || ''}
                onChange={handleInputChange}
                placeholder="Enter Japanese title"
              />
            </div>
          </div>

          {/* Link and Cover */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="link">Official Link</Label>
              <Input
                id="link"
                name="link"
                type="url"
                value={formData.link || ''}
                onChange={handleInputChange}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="cover">Cover Image URL</Label>
              <Input
                id="cover"
                name="cover"
                type="url"
                value={formData.cover || ''}
                onChange={handleInputChange}
                placeholder="https://example.com/cover.jpg"
              />
            </div>
          </div>

          {/* Cover Preview */}
          {formData.cover && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Cover Preview</Label>
                <Button
                  type="button"
                  variant={isEditingRatings ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleEditRatings}
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
                      Edit Rating
                    </>
                  )}
                </Button>
              </div>
              <div className="mt-2 flex items-start gap-4">
                {/* Cover Image with Rating Editor */}
                <div 
                  className={`relative w-48 h-64 rounded border overflow-hidden bg-gray-100 group ${
                    isEditingRatings ? 'cursor-pointer ring-2 ring-blue-500 ring-opacity-50' : ''
                  }`}
                  onClick={() => {
                    if (isEditingRatings) {
                      const currentRating = getImageRating(formData.cover!)
                      let newRating: 'NN' | 'N' | null
                      
                      if (currentRating === null) {
                        newRating = 'NN'
                      } else if (currentRating === 'NN') {
                        newRating = 'N'
                      } else {
                        newRating = null
                      }
                      
                      handleCoverRatingChange(newRating)
                    }
                  }}
                >
                  <ImageWithFallback
                    src={formData.cover}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Edit Mode Overlay */}
                  {isEditingRatings && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Edit3 className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  )}
                  
                  {/* Dynamic Rating Badge for Cover */}
                  {(() => {
                    const coverRating = getImageRating(formData.cover)
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
                  
                  {/* Edit Mode Indicator */}
                  {isEditingRatings && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="outline" className="text-xs h-auto py-1 px-2 bg-blue-500 text-white border-blue-500">
                        EDIT
                      </Badge>
                    </div>
                  )}
                </div>
                
                {/* Rating Instructions */}
                {isEditingRatings && (
                  <div className="flex-1">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">Content Rating Editor</h4>
                      <p className="text-sm text-blue-700 mb-2">
                        Click the cover image to cycle through ratings:
                      </p>
                      <div className="space-y-1 text-xs text-blue-600">
                        <div>• <strong>Unrated</strong> → <Badge variant="secondary" className="text-xs mx-1">NN</Badge></div>
                        <div>• <Badge variant="secondary" className="text-xs mr-1">NN</Badge> → <Badge variant="destructive" className="text-xs mx-1">N</Badge></div>
                        <div>• <Badge variant="destructive" className="text-xs mr-1">N</Badge> → <strong>Unrated</strong></div>
                      </div>
                      <div className="text-xs text-blue-600 mt-2 pt-2 border-t border-blue-200">
                        Current rating: <strong>{getImageRating(formData.cover) || 'Unrated'}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Release Date */}
          <div>
            <Label>Release Date</Label>
            <DatePicker
              value={formData.releaseDate || ''}
              onChange={(date) => handleDateChange('releaseDate', date)}
              placeholder="Select release date"
            />
          </div>

          {/* Actresses - Now supports multiple */}
          <div>
            <CastManager
              type="actress"
              currentCast={formData.actress || ''}
              onCastChange={handleActressChange}
              accessToken={accessToken}
              allowMultiple={true}
              placeholder="Select actresses for this photobook"
            />
            <div className="text-xs text-muted-foreground mt-1">
              You can select multiple actresses who appear in this photobook. Individual images will be limited to these selected actresses for tagging.
            </div>
            
            {/* Show selected actresses count */}
            {selectedActresses.length > 0 && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                <div className="text-sm text-blue-800 font-medium">
                  Selected Actresses ({selectedActresses.length}):
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedActresses.map((actress, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {actress}
                    </Badge>
                  ))}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Only these actresses will be available for individual image tagging below.
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Image Links Manager with Tagging */}
          <div>
            <ImageLinksManager
              label="Image Gallery with Actress Tagging"
              imageLinks={formData.imageLinks || ''}
              onImageLinksChange={handleImageLinksChange}
              imageTags={formData.imageTags || []}
              onImageTagsChange={handleImageTagsChange}
              placeholder="Add image URLs and tag actresses in each image"
              dmcode={formData.titleEn || ''}
              accessToken={accessToken}
              selectedActresses={selectedActresses}
            />
          </div>

          {/* Gallery Statistics */}
          {stats.totalImages > 0 && (
            <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <span className="font-medium">📊 Gallery Statistics</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium text-blue-600">Total Images</div>
                  <div className="text-lg font-bold text-blue-800">{stats.totalImages}</div>
                </div>
                <div>
                  <div className="font-medium text-purple-600">Unique Actresses</div>
                  <div className="text-lg font-bold text-purple-800">{stats.uniqueActresses}</div>
                </div>
                <div className="col-span-2">
                  <div className="font-medium text-green-600 mb-1">Tagged Actresses</div>
                  <div className="flex flex-wrap gap-1">
                    {stats.actressList.slice(0, 5).map((actress, index) => (
                      <span key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {actress}
                      </span>
                    ))}
                    {stats.actressList.length > 5 && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        +{stats.actressList.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {formData.imageLinks?.includes('#') && (
                <div className="text-xs mt-2 text-blue-600 bg-blue-100 p-2 rounded">
                  <strong>Smart Bulk Tagging:</strong> Template pattern detected - actresses will be automatically tagged on all generated images
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-between items-center pt-6 border-t">
            <div className="text-sm text-muted-foreground">
              * Required fields
            </div>

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !formData.titleEn?.trim()}
              >
                {isLoading ? 'Saving...' : photobook?.id ? 'Update' : 'Save'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}