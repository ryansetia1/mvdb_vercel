import React from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Camera, X } from 'lucide-react'
import { Photobook } from '../../utils/photobookApi'

interface PhotobookCardProps {
  photobook: Photobook
  onCardClick: (photobook: Photobook) => void
  onUnlink?: (photobook: Photobook) => void
  showUnlinkButton?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function PhotobookCard({ 
  photobook, 
  onCardClick, 
  onUnlink, 
  showUnlinkButton = false,
  size = 'md'
}: PhotobookCardProps) {
  const sizeClasses = {
    sm: 'w-32 h-48',
    md: 'w-40 h-60',
    lg: 'w-48 h-72'
  }

  return (
    <Card 
      className={`${sizeClasses[size]} cursor-pointer hover:shadow-lg transition-shadow group`}
      onClick={() => onCardClick(photobook)}
    >
      <CardContent className="p-0 h-full">
        {/* Cover Image */}
        <div className="relative h-3/4 overflow-hidden rounded-t-lg">
          {photobook.cover ? (
            <img
              src={photobook.cover}
              alt={photobook.titleEn}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-photobook.jpg'
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <Camera className="h-12 w-12 text-gray-400" />
            </div>
          )}
          
          {/* Unlink Button */}
          {showUnlinkButton && onUnlink && (
            <Button
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                onUnlink(photobook)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Title */}
        <div className="p-3 h-1/4 flex flex-col justify-center">
          <h3 className="font-medium text-sm line-clamp-2 text-center">
            {photobook.titleEn}
          </h3>
          {photobook.titleJp && (
            <p className="text-xs text-gray-500 text-center mt-1 line-clamp-1">
              {photobook.titleJp}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
