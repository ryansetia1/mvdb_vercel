import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs'
import { Badge } from '../../ui/badge'
import { ImageWithFallback } from '../../figma/ImageWithFallback'
import { Photobook } from '../../../utils/photobookApi'
import { Images, Shield } from 'lucide-react'

interface PhotobookGalleryProps {
  selectedPhotobook: Photobook
  name: string
  galleryTab: 'all' | 'nn' | 'n'
  filteredImages: string[]
  imageCounts: { all: number; nn: number; n: number }
  onGalleryTabChange: (value: 'all' | 'nn' | 'n') => void
  onImageClick: (images: string[], index: number) => void
}

export function PhotobookGallery({
  selectedPhotobook,
  name,
  galleryTab,
  filteredImages,
  imageCounts,
  onGalleryTabChange,
  onImageClick
}: PhotobookGalleryProps) {
  const renderImageGrid = (rating?: 'NN' | 'N') => {
    if (filteredImages.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-12">
          <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">
            No {rating ? `${rating} ` : ''}images found
          </p>
          <p className="text-sm">
            {name} is not tagged in any {rating ? `${rating}-rated ` : ''}images from this photobook
          </p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredImages.map((imageUrl, index) => (
          <div 
            key={index} 
            className="relative aspect-square group cursor-pointer"
            onClick={() => onImageClick(filteredImages, index)}
          >
            <ImageWithFallback
              src={imageUrl}
              alt={`${name} in ${selectedPhotobook.titleEn} - ${rating ? `${rating} ` : ''}Image ${index + 1}`}
              className="w-full h-full object-cover rounded border group-hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Images className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
              {index + 1}
            </div>
            {rating && (
              <div className="absolute top-1 right-1">
                <Badge 
                  variant={rating === 'NN' ? 'destructive' : 'secondary'} 
                  className="text-xs h-auto py-0 px-1"
                >
                  {rating}
                </Badge>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Images className="h-5 w-5" />
          {selectedPhotobook.titleEn} - Images with {name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={galleryTab} onValueChange={onGalleryTabChange}>
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

          <TabsContent value="nn" className="mt-4">
            {renderImageGrid('NN')}
          </TabsContent>

          <TabsContent value="n" className="mt-4">
            {renderImageGrid('N')}
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            {renderImageGrid()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}