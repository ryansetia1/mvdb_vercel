import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { Shield, Eye, EyeOff, Users, Lock } from 'lucide-react'
import { ImageTag } from '../utils/photobookApi'

interface IndividualImageTaggerProps {
  templateUrl: string
  dmcode?: string
  actresses: string[]
  imageTags: ImageTag[]
  onImageTagsChange: (tags: ImageTag[]) => void
}

export function IndividualImageTagger({ 
  templateUrl, 
  dmcode, 
  actresses,
  imageTags,
  onImageTagsChange 
}: IndividualImageTaggerProps) {
  const [visibleCount, setVisibleCount] = useState(12)
  
  // Generate all template URLs (up to 50)
  const generateTemplateUrls = (): string[] => {
    const urls: string[] = []
    
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

      urls.push(processedUrl)
    }
    
    return urls
  }

  const templateUrls = generateTemplateUrls()

  // Get current rating for a specific URL
  const getCurrentRating = (url: string): 'NN' | 'N' | null => {
    const tag = imageTags.find(tag => tag.url === url)
    return tag?.contentRating || null
  }

  // Update rating for a specific image
  const updateImageRating = (url: string, rating: 'NN' | 'N' | null) => {
    const urlIndex = templateUrls.indexOf(url)
    
    const newImageTags = [...imageTags]
    const existingTagIndex = newImageTags.findIndex(tag => tag.url === url)
    
    if (existingTagIndex >= 0) {
      // Update existing tag
      newImageTags[existingTagIndex] = {
        ...newImageTags[existingTagIndex],
        contentRating: rating
      }
    } else {
      // Create new tag
      newImageTags.push({
        url,
        actresses,
        contentRating: rating,
        imageIndex: urlIndex
      })
    }
    
    onImageTagsChange(newImageTags)
  }

  // Get content rating badge
  const getContentRatingBadge = (rating?: 'NN' | 'N' | null) => {
    if (!rating) return null
    
    const variants = {
      'NN': { variant: 'secondary' as const, label: 'NN' }, // Gray for NN
      'N': { variant: 'destructive' as const, label: 'N' }  // Red for N
    }
    
    const config = variants[rating]
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    )
  }

  // Get statistics
  const stats = {
    total: templateUrls.length,
    nn: imageTags.filter(tag => tag.contentRating === 'NN').length,
    n: imageTags.filter(tag => tag.contentRating === 'N').length,
    unrated: templateUrls.length - imageTags.filter(tag => tag.contentRating).length
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Individual Image Content Rating
            {actresses.length > 0 && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                <Users className="h-3 w-3 mr-1" />
                {actresses.length} actress{actresses.length !== 1 ? 'es' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="secondary" className="text-xs">NN: {stats.nn}</Badge>
            <Badge variant="destructive" className="text-xs">N: {stats.n}</Badge>
            <Badge variant="outline" className="text-xs">Unrated: {stats.unrated}</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Actress restriction notice and instructions */}
        <div className="space-y-2">
          {/* Actress selection info */}
          {actresses.length > 0 && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              <div className="flex items-center gap-1 mb-1">
                <Users className="h-3 w-3" />
                <span className="font-medium">Template Actresses Selected</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {actresses.map((actress, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {actress}
                  </Badge>
                ))}
              </div>
              <div className="mt-1">All template images are tagged with these actresses. Use the rating controls below to set content ratings individually.</div>
            </div>
          )}

          {/* Instructions */}
          <div className="p-3 bg-blue-50 rounded border text-sm text-blue-700">
            <div><strong>Individual Tagging:</strong> Click rating buttons for each image to set its content rating</div>
            <div className="text-xs mt-1 space-y-1">
              <div>• <Badge variant="secondary" className="text-xs mx-1">NN</Badge> = Full content (gray badge)</div>
              <div>• <Badge variant="destructive" className="text-xs mx-1">N</Badge> = Partial content (red badge)</div>
              <div>• <strong>Unrated</strong> = No content rating set</div>
            </div>
          </div>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {templateUrls.slice(0, visibleCount).map((url, index) => {
            const currentRating = getCurrentRating(url)
            
            return (
              <div key={index} className="relative group">
                <div className="relative border rounded overflow-hidden">
                  <ImageWithFallback
                    src={url}
                    alt={`Image ${index + 1}`}
                    className="w-full h-16 object-cover"
                  />
                  
                  {/* Image number */}
                  <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                    {index + 1}
                  </div>
                  
                  {/* Current rating badge */}
                  {currentRating && (
                    <div className="absolute top-1 right-1">
                      {getContentRatingBadge(currentRating)}
                    </div>
                  )}
                  
                  {/* Click overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors cursor-pointer" />
                </div>
                
                {/* Rating buttons - show on hover */}
                <div className="absolute inset-x-0 -bottom-8 group-hover:bottom-0 transition-all duration-200 bg-white border border-t-0 rounded-b p-1 opacity-0 group-hover:opacity-100">
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant={currentRating === 'N' ? 'destructive' : 'outline'}
                      onClick={() => updateImageRating(url, currentRating === 'N' ? null : 'N')}
                      className="flex-1 h-6 text-xs px-1"
                    >
                      N
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={currentRating === 'NN' ? 'secondary' : 'outline'}
                      onClick={() => updateImageRating(url, currentRating === 'NN' ? null : 'NN')}
                      className="flex-1 h-6 text-xs px-1"
                    >
                      NN
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Load more / Show less */}
        {templateUrls.length > 12 && (
          <div className="flex justify-center gap-2">
            {visibleCount < templateUrls.length && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount(prev => Math.min(prev + 12, templateUrls.length))}
                className="flex items-center gap-1"
              >
                <Eye className="h-3 w-3" />
                Show More ({templateUrls.length - visibleCount} remaining)
              </Button>
            )}
            {visibleCount > 12 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount(12)}
                className="flex items-center gap-1"
              >
                <EyeOff className="h-3 w-3" />
                Show Less
              </Button>
            )}
          </div>
        )}

        {/* Bulk actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <span className="text-sm text-muted-foreground">Bulk actions:</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const newImageTags = templateUrls.map((url, index) => ({
                url,
                actresses,
                contentRating: 'N' as const,
                imageIndex: index
              }))
              onImageTagsChange(newImageTags)
            }}
            className="text-xs"
          >
            Set All N
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const newImageTags = templateUrls.map((url, index) => ({
                url,
                actresses,
                contentRating: 'NN' as const,
                imageIndex: index
              }))
              onImageTagsChange(newImageTags)
            }}
            className="text-xs"
          >
            Set All NN
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const newImageTags = templateUrls.map((url, index) => ({
                url,
                actresses,
                contentRating: null,
                imageIndex: index
              }))
              onImageTagsChange(newImageTags)
            }}
            className="text-xs"
          >
            Clear All
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}