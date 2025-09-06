import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { ImageWithFallback } from '../../figma/ImageWithFallback'
import { Photobook } from '../../../utils/photobookApi'
import { Images, Shield, Calendar, ExternalLink } from 'lucide-react'
import { toast } from 'sonner@2.0.3'

interface PhotobookSelectionProps {
  selectedPhotobook: Photobook
  name: string
  imageCounts: { all: number; nn: number; n: number }
  onPhotobookSelect?: (photobook: Photobook) => void
}

export function PhotobookSelection({
  selectedPhotobook,
  name,
  imageCounts,
  onPhotobookSelect
}: PhotobookSelectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Images className="h-4 w-4" />
          Current Selection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center">
          <div 
            className="w-20 h-28 mx-auto mb-2 rounded overflow-hidden bg-gray-100 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all duration-200"
            onClick={() => {
              if (onPhotobookSelect && selectedPhotobook) {
                onPhotobookSelect(selectedPhotobook)
              } else {
                toast.info(`Navigate to ${selectedPhotobook.titleEn} detail page`)
              }
            }}
          >
            {selectedPhotobook.cover ? (
              <ImageWithFallback
                src={selectedPhotobook.cover}
                alt={selectedPhotobook.titleEn}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Images className="h-6 w-6" />
              </div>
            )}
          </div>
          <h3 className="font-medium text-sm">{selectedPhotobook.titleEn}</h3>
          {selectedPhotobook.titleJp && (
            <p className="text-xs text-muted-foreground">{selectedPhotobook.titleJp}</p>
          )}
        </div>
        
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span>Total Images with {name}</span>
            <Badge variant="outline">{imageCounts.all}</Badge>
          </div>
          
          {imageCounts.nn > 0 && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                NN Images
              </span>
              <Badge variant="destructive">{imageCounts.nn}</Badge>
            </div>
          )}
          
          {imageCounts.n > 0 && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                N Images
              </span>
              <Badge variant="secondary">{imageCounts.n}</Badge>
            </div>
          )}
          
          {selectedPhotobook.releaseDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span>{new Date(selectedPhotobook.releaseDate).toLocaleDateString()}</span>
            </div>
          )}
          
          {selectedPhotobook.link && (
            <a
              href={selectedPhotobook.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Official Link</span>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}