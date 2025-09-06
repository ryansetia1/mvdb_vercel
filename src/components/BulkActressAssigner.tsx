import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Checkbox } from './ui/checkbox'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { Users, CheckSquare, Square, UserPlus, RotateCcw } from 'lucide-react'
import { ImageTag } from '../utils/photobookApi'
import { toast } from 'sonner@2.0.3'

interface BulkActressAssignerProps {
  selectedActresses: string[] // Available actresses for this photobook
  imageTags: ImageTag[]
  onImageTagsChange: (tags: ImageTag[]) => void
  templateUrl?: string
  dmcode?: string
  manualLinks?: { url: string }[]
}

interface ImageItem {
  url: string
  index: number
  source: 'template' | 'manual'
  currentActresses: string[]
  contentRating?: 'NN' | 'N' | null
}

export function BulkActressAssigner({
  selectedActresses,
  imageTags,
  onImageTagsChange,
  templateUrl,
  dmcode,
  manualLinks = []
}: BulkActressAssignerProps) {
  const [selectedActress, setSelectedActress] = useState<string>('')
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [allImages, setAllImages] = useState<ImageItem[]>([])

  // Generate all images (template + manual)
  useEffect(() => {
    const images: ImageItem[] = []
    let currentIndex = 0

    // Add template images if template URL exists
    if (templateUrl && templateUrl.includes('#')) {
      for (let i = 1; i <= 50; i++) {
        let processedUrl = templateUrl
        
        // Replace # patterns with numbers
        processedUrl = processedUrl.replace(/(#+)/g, (match) => {
          const hashCount = match.length
          return i.toString().padStart(hashCount, '0')
        })

        // Replace * with dmcode
        if (processedUrl.includes('*') && dmcode) {
          processedUrl = processedUrl.replace(/\*/g, dmcode)
        }

        // Get current actresses for this image
        const imageTag = imageTags.find(tag => tag.url === processedUrl)
        
        images.push({
          url: processedUrl,
          index: currentIndex++,
          source: 'template',
          currentActresses: imageTag?.actresses || [],
          contentRating: imageTag?.contentRating
        })
      }
    }

    // Add manual images
    manualLinks.forEach(link => {
      const imageTag = imageTags.find(tag => tag.url === link.url)
      
      images.push({
        url: link.url,
        index: currentIndex++,
        source: 'manual',
        currentActresses: imageTag?.actresses || [],
        contentRating: imageTag?.contentRating
      })
    })

    setAllImages(images)
  }, [templateUrl, dmcode, manualLinks, imageTags])

  // Handle image selection
  const handleImageSelect = (imageUrl: string, selected: boolean) => {
    const newSelected = new Set(selectedImages)
    if (selected) {
      newSelected.add(imageUrl)
    } else {
      newSelected.delete(imageUrl)
    }
    setSelectedImages(newSelected)
  }

  // Select all images
  const handleSelectAll = () => {
    if (selectedImages.size === allImages.length) {
      // Deselect all
      setSelectedImages(new Set())
    } else {
      // Select all
      setSelectedImages(new Set(allImages.map(img => img.url)))
    }
  }

  // Filter images by actress
  const handleFilterByActress = (actress: string) => {
    const imagesWithActress = allImages
      .filter(img => img.currentActresses.includes(actress))
      .map(img => img.url)
    
    setSelectedImages(new Set(imagesWithActress))
    toast.success(`Selected ${imagesWithActress.length} images featuring ${actress}`)
  }

  // Apply actress to selected images
  const handleApplyAssignment = () => {
    if (!selectedActress) {
      toast.error('Please select an actress to assign')
      return
    }

    if (selectedImages.size === 0) {
      toast.error('Please select at least one image')
      return
    }

    const newImageTags = [...imageTags]
    
    selectedImages.forEach(imageUrl => {
      const existingTagIndex = newImageTags.findIndex(tag => tag.url === imageUrl)
      
      if (existingTagIndex >= 0) {
        // Update existing tag
        const currentActresses = [...newImageTags[existingTagIndex].actresses]
        if (!currentActresses.includes(selectedActress)) {
          newImageTags[existingTagIndex] = {
            ...newImageTags[existingTagIndex],
            actresses: [...currentActresses, selectedActress]
          }
        }
      } else {
        // Create new tag
        const imageItem = allImages.find(img => img.url === imageUrl)
        newImageTags.push({
          url: imageUrl,
          actresses: [selectedActress],
          contentRating: imageItem?.contentRating || null,
          imageIndex: imageItem?.index
        })
      }
    })

    onImageTagsChange(newImageTags)
    
    // Clear selections
    setSelectedImages(new Set())
    setSelectedActress('')
    
    toast.success(`Assigned ${selectedActress} to ${selectedImages.size} images`)
  }

  // Remove actress from selected images
  const handleRemoveAssignment = () => {
    if (!selectedActress) {
      toast.error('Please select an actress to remove')
      return
    }

    if (selectedImages.size === 0) {
      toast.error('Please select at least one image')
      return
    }

    const newImageTags = [...imageTags]
    
    selectedImages.forEach(imageUrl => {
      const existingTagIndex = newImageTags.findIndex(tag => tag.url === imageUrl)
      
      if (existingTagIndex >= 0) {
        const updatedActresses = newImageTags[existingTagIndex].actresses.filter(
          actress => actress !== selectedActress
        )
        
        newImageTags[existingTagIndex] = {
          ...newImageTags[existingTagIndex],
          actresses: updatedActresses
        }
      }
    })

    onImageTagsChange(newImageTags)
    
    // Clear selections
    setSelectedImages(new Set())
    setSelectedActress('')
    
    toast.success(`Removed ${selectedActress} from ${selectedImages.size} images`)
  }

  const getContentRatingBadge = (rating?: 'NN' | 'N' | null) => {
    if (!rating) return null
    
    const variants = {
      'NN': { variant: 'secondary' as const, label: 'NN' },
      'N': { variant: 'destructive' as const, label: 'N' }
    }
    
    const config = variants[rating]
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    )
  }

  if (selectedActresses.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No actresses assigned to this photobook yet.</p>
            <p className="text-xs mt-1">Add actresses to the photobook to use bulk assignment.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4" />
          Bulk Actress Assignment
          <Badge variant="outline" className="text-xs">
            {allImages.length} images
          </Badge>
          {selectedImages.size > 0 && (
            <Badge variant="default" className="text-xs">
              {selectedImages.size} selected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instructions */}
        <div className="p-3 bg-blue-50 rounded border text-sm text-blue-700">
          <div><strong>Bulk Assignment:</strong> Select an actress, then select multiple images to assign her to</div>
          <div className="text-xs mt-1 space-y-1">
            <div>• Choose actress from dropdown below</div>
            <div>• Click images to select them (or use bulk selection buttons)</div>
            <div>• Click "Assign" to tag selected actress to selected images</div>
          </div>
        </div>

        {/* Actress Selection and Actions */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Select Actress</label>
              <Select value={selectedActress} onValueChange={setSelectedActress}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose actress to assign..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedActresses.map(actress => (
                    <SelectItem key={actress} value={actress}>
                      {actress}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="flex items-center gap-1"
              >
                {selectedImages.size === allImages.length ? (
                  <>
                    <Square className="h-3 w-3" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-3 w-3" />
                    Select All
                  </>
                )}
              </Button>
              
              {selectedActress && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterByActress(selectedActress)}
                  className="flex items-center gap-1 text-xs"
                >
                  <Users className="h-3 w-3" />
                  Select {selectedActress}
                </Button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleApplyAssignment}
              disabled={!selectedActress || selectedImages.size === 0}
              className="flex items-center gap-1"
            >
              <UserPlus className="h-3 w-3" />
              Assign to {selectedImages.size} image{selectedImages.size !== 1 ? 's' : ''}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleRemoveAssignment}
              disabled={!selectedActress || selectedImages.size === 0}
              className="flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Remove from {selectedImages.size} image{selectedImages.size !== 1 ? 's' : ''}
            </Button>
            
            <div className="flex-1" />
            
            <div className="text-xs text-muted-foreground">
              {selectedImages.size} of {allImages.length} images selected
            </div>
          </div>
        </div>

        {/* Images Grid */}
        <div className="grid grid-cols-3 gap-3">
          {allImages.map((image) => {
            const isSelected = selectedImages.has(image.url)
            const hasSelectedActress = selectedActress && image.currentActresses.includes(selectedActress)
            
            return (
              <div key={image.url} className="relative group">
                {/* Checkbox overlay */}
                <div className="absolute top-1 left-1 z-10">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleImageSelect(image.url, !!checked)}
                    className="bg-white/90 border-2"
                  />
                </div>
                
                <div 
                  className={`relative border-2 rounded overflow-hidden cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : hasSelectedActress
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => handleImageSelect(image.url, !isSelected)}
                >
                  <ImageWithFallback
                    src={image.url}
                    alt={`Image ${image.index + 1}`}
                    className="w-full aspect-square object-cover"
                  />
                  
                  {/* Image number */}
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                    {image.index + 1}
                  </div>
                  
                  {/* Source indicator */}
                  <div className="absolute bottom-1 left-1">
                    <Badge 
                      variant={image.source === 'template' ? 'secondary' : 'default'} 
                      className="text-xs h-auto py-0 px-1"
                    >
                      {image.source === 'template' ? 'T' : 'M'}
                    </Badge>
                  </div>
                  
                  {/* Content rating */}
                  {image.contentRating && (
                    <div className="absolute top-1 right-1">
                      {getContentRatingBadge(image.contentRating)}
                    </div>
                  )}
                  
                  {/* Selected actress indicator */}
                  {hasSelectedActress && (
                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                      <div className="bg-green-500 text-white rounded-full p-1">
                        <Users className="h-3 w-3" />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Current actresses display */}
                {image.currentActresses.length > 0 && (
                  <div className="mt-1 space-y-1">
                    <div className="flex flex-wrap gap-1">
                      {image.currentActresses.slice(0, 2).map((actress, i) => (
                        <Badge 
                          key={i} 
                          variant={actress === selectedActress ? 'default' : 'secondary'} 
                          className="text-xs h-auto py-0 px-1"
                        >
                          {actress}
                        </Badge>
                      ))}
                      {image.currentActresses.length > 2 && (
                        <Badge variant="outline" className="text-xs h-auto py-0 px-1">
                          +{image.currentActresses.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/30 p-2 rounded">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border-2 border-blue-500 bg-blue-50 rounded"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border-2 border-green-500 bg-green-50 rounded"></div>
            <span>Has selected actress</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs h-auto py-0 px-1">T</Badge>
            <span>Template</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="default" className="text-xs h-auto py-0 px-1">M</Badge>
            <span>Manual</span>
          </div>
        </div>

        {/* Summary */}
        {allImages.length > 0 && (
          <div className="text-xs text-muted-foreground space-y-1">
            <div><strong>💡 Quick Assignment Tips:</strong></div>
            <div>• Click an actress name in the dropdown, then click "Select [Actress]" to quickly select all images featuring that actress</div>
            <div>• Use "Select All" to select all images at once</div>
            <div>• Images with green highlight already feature the selected actress</div>
            <div>• You can assign the same actress to an image multiple times (it will be ignored)</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}