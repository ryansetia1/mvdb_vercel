import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { ImageWithFallback } from '../../figma/ImageWithFallback'
import { MultipleClickableAvatars } from '../../MultipleClickableAvatars'
import { Photobook, photobookHelpers } from '../../../utils/photobookApi'
import { Camera } from 'lucide-react'

interface PhotobooksGridProps {
  photobooks: Photobook[]
  name: string
  onPhotobookSelect: (photobook: Photobook) => void
  onActressClick?: (actressName: string) => void
  accessToken?: string
}

export function PhotobooksGrid({ 
  photobooks, 
  name, 
  onPhotobookSelect,
  onActressClick,
  accessToken 
}: PhotobooksGridProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Photobooks featuring {name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {photobooks.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photobooks.map((photobook) => {
              const imageCount = photobookHelpers.getImagesForActress(photobook, name).length
              const nnCount = photobookHelpers.getImagesForActressWithRating(photobook, name, 'NN').length
              const nCount = photobookHelpers.getImagesForActressWithRating(photobook, name, 'N').length
              
              return (
                <div
                  key={photobook.id}
                  className="group cursor-pointer"
                  onClick={() => onPhotobookSelect(photobook)}
                >
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 mb-2">
                    {photobook.cover ? (
                      <ImageWithFallback
                        src={photobook.cover}
                        alt={photobook.titleEn}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Camera className="h-8 w-8" />
                      </div>
                    )}
                    {/* Image count overlay */}
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                      {imageCount} pics
                    </div>
                    {/* Content rating badges */}
                    {(nnCount > 0 || nCount > 0) && (
                      <div className="absolute bottom-2 left-2 flex gap-1">
                        {nnCount > 0 && (
                          <Badge variant="secondary" className="text-xs h-auto py-0 px-1">
                            NN({nnCount})
                          </Badge>
                        )}
                        {nCount > 0 && (
                          <Badge variant="destructive" className="text-xs h-auto py-0 px-1">
                            N({nCount})
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {photobook.titleEn}
                    </h3>
                    {photobook.titleJp && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {photobook.titleJp}
                      </p>
                    )}
                    {photobook.releaseDate && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(photobook.releaseDate).getFullYear()}
                      </p>
                    )}
                    
                    {/* Show all actresses in photobook with clickable avatars */}
                    {photobook.actress && accessToken && onActressClick && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <MultipleClickableAvatars
                          names={photobook.actress}
                          onProfileClick={onActressClick}
                          accessToken={accessToken}
                          size="sm"
                          showNames={false}
                          maxDisplay={4}
                          className="justify-start"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-12">
            <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No photobooks found</p>
            <p className="text-sm">{name} has not appeared in any photobooks yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}