import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { ImageWithFallback } from '../figma/ImageWithFallback'
import { Plus, Trash2, Eye, EyeOff, ExternalLink, GripVertical } from 'lucide-react'
import { Alert, AlertDescription } from '../ui/alert'
import { GROUP_FORM_CONSTANTS } from './constants'

interface GalleryUrlManagerProps {
  galleryUrls: string[]
  onChange: (urls: string[]) => void
  className?: string
}

export function GalleryUrlManager({ galleryUrls = [], onChange, className }: GalleryUrlManagerProps) {
  const [newUrl, setNewUrl] = useState('')
  const [showPreviews, setShowPreviews] = useState(true)

  // Ensure galleryUrls is always an array
  const safeGalleryUrls = Array.isArray(galleryUrls) ? galleryUrls : []

  const handleAddUrl = () => {
    console.log('=== Gallery URL Add Process ===')
    console.log('New URL:', newUrl)
    console.log('Current gallery URLs:', safeGalleryUrls)
    
    if (!newUrl.trim()) {
      console.log('Empty URL, aborting')
      return
    }
    
    // Check for duplicates
    if (safeGalleryUrls.includes(newUrl.trim())) {
      console.log('Duplicate URL found, aborting')
      alert('This URL is already in the gallery')
      return
    }

    const newUrlArray = [...safeGalleryUrls, newUrl.trim()]
    console.log('New URL array:', newUrlArray)
    onChange(newUrlArray)
    setNewUrl('')
    console.log('=== End Gallery URL Add Process ===')
  }

  const handleRemoveUrl = (index: number) => {
    const newUrls = safeGalleryUrls.filter((_, i) => i !== index)
    onChange(newUrls)
  }

  const handleUrlChange = (index: number, newValue: string) => {
    const newUrls = [...safeGalleryUrls]
    newUrls[index] = newValue
    onChange(newUrls)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newUrls = [...safeGalleryUrls]
    const temp = newUrls[index]
    newUrls[index] = newUrls[index - 1]
    newUrls[index - 1] = temp
    onChange(newUrls)
  }

  const handleMoveDown = (index: number) => {
    if (index === safeGalleryUrls.length - 1) return
    const newUrls = [...safeGalleryUrls]
    const temp = newUrls[index]
    newUrls[index] = newUrls[index + 1]
    newUrls[index + 1] = temp
    onChange(newUrls)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddUrl()
    }
  }

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Header */}
      <div>
        <Label>{GROUP_FORM_CONSTANTS.LABELS.GALLERY}</Label>
        <p className="text-xs text-muted-foreground mt-1">
          {GROUP_FORM_CONSTANTS.HELPER_TEXT.GALLERY}
        </p>
      </div>

      {/* Add New URL */}
      <div className="flex gap-2">
        <Input
          value={newUrl}
          onChange={(e) => {
            console.log('Gallery URL input changing:', e.target.value)
            setNewUrl(e.target.value)
          }}
          placeholder={GROUP_FORM_CONSTANTS.PLACEHOLDERS.GALLERY_URL}
          onKeyPress={(e) => {
            console.log('Gallery URL key pressed:', e.key)
            handleKeyPress(e)
          }}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={handleAddUrl}
          disabled={!newUrl.trim()}
          className="shrink-0"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Gallery Count and Controls */}
      {safeGalleryUrls.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {safeGalleryUrls.length} photo{safeGalleryUrls.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPreviews(!showPreviews)}
          >
            {showPreviews ? (
              <>
                <EyeOff className="h-4 w-4 mr-1" />
                Hide Previews
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Show Previews
              </>
            )}
          </Button>
        </div>
      )}

      {/* Gallery URLs List */}
      {safeGalleryUrls.length > 0 && (
        <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
          {safeGalleryUrls.map((url, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center gap-2">
                {/* Reorder buttons */}
                <div className="flex flex-col">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="h-4 w-4 p-0"
                  >
                    <GripVertical className="h-3 w-3" />
                  </Button>
                </div>

                {/* URL Input */}
                <div className="flex-1">
                  <Input
                    value={url}
                    onChange={(e) => handleUrlChange(index, e.target.value)}
                    placeholder={GROUP_FORM_CONSTANTS.PLACEHOLDERS.GALLERY_URL}
                    className="text-xs"
                  />
                </div>

                {/* Actions */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(url, '_blank')}
                  disabled={!url}
                  className="shrink-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveUrl(index)}
                  className="text-red-600 hover:text-red-800 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Preview */}
              {showPreviews && url && (
                <div className="ml-6">
                  <div className="w-32 h-20 rounded border bg-muted overflow-hidden">
                    <ImageWithFallback
                      src={url}
                      alt={`Gallery photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {safeGalleryUrls.length === 0 && (
        <Alert>
          <AlertDescription>
            No gallery photos added yet. Use the input above to add photo URLs to create a gallery for this group.
          </AlertDescription>
        </Alert>
      )}

      {/* Gallery Preview Grid - Only show when there are multiple images */}
      {showPreviews && safeGalleryUrls.length > 1 && (
        <div>
          <Separator className="mb-3" />
          <Label className="text-sm font-medium">Gallery Preview</Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {safeGalleryUrls.slice(0, 6).map((url, index) => (
              <div key={index} className="aspect-square rounded border bg-muted overflow-hidden">
                <ImageWithFallback
                  src={url}
                  alt={`Gallery preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {safeGalleryUrls.length > 6 && (
              <div className="aspect-square rounded border bg-muted flex items-center justify-center">
                <span className="text-xs text-muted-foreground">
                  +{safeGalleryUrls.length - 6} more
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}