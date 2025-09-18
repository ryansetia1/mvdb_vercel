import React, { useMemo, useState } from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Camera, X, Users, Calendar, Users2, User } from 'lucide-react'
import { Photobook } from '../../utils/photobookApi'
import { MasterDataItem } from '../../utils/masterDataApi'
import { LazyImage } from '../ui/LazyImage'

interface PhotobookCardProps {
  photobook: Photobook
  onCardClick: (photobook: Photobook) => void
  onUnlink?: (photobook: Photobook) => void
  showUnlinkButton?: boolean
  size?: 'sm' | 'md' | 'lg'
  // New props for hierarchy data
  generations?: MasterDataItem[]
  lineups?: MasterDataItem[]
  members?: MasterDataItem[]
}

export const PhotobookCard = React.memo(function PhotobookCard({ 
  photobook, 
  onCardClick, 
  onUnlink, 
  showUnlinkButton = false,
  size = 'lg',
  generations = [],
  lineups = [],
  members = []
}: PhotobookCardProps) {
  
  const sizeClasses = {
    sm: 'w-40 h-60',
    md: 'w-52 h-78',
    lg: 'w-64 h-96'
  }

  // Memoize linked items calculation to prevent recalculation on every render
  const linkedItems = useMemo(() => {
    const items: Array<{ type: string, name: string, icon: React.ReactNode }> = []
    
    if (photobook.linkedTo?.generationId) {
      const generation = generations.find(g => g.id === photobook.linkedTo?.generationId)
      if (generation) {
        items.push({
          type: 'generation',
          name: generation.name,
          icon: <Calendar className="h-3 w-3" />
        })
      }
    }
    
    if (photobook.linkedTo?.lineupId) {
      const lineup = lineups.find(l => l.id === photobook.linkedTo?.lineupId)
      if (lineup) {
        items.push({
          type: 'lineup',
          name: lineup.name,
          icon: <Users2 className="h-3 w-3" />
        })
      }
    }
    
    if (photobook.linkedTo?.memberId) {
      const member = members.find(m => m.id === photobook.linkedTo?.memberId)
      if (member) {
        items.push({
          type: 'member',
          name: member.name,
          icon: <User className="h-3 w-3" />
        })
      }
    }
    
    return items
  }, [photobook.linkedTo, generations, lineups, members])

  const handleImageLoad = () => {
    // Image loaded successfully
  }

  const handleImageError = () => {
    // Image failed to load
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
            <LazyImage
              src={photobook.cover}
              alt={photobook.titleEn}
              className="w-full h-full group-hover:scale-105 transition-transform duration-200"
              onLoad={handleImageLoad}
              onError={handleImageError}
              threshold={0.1}
              rootMargin="100px"
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
          
          {/* Ownership Badges */}
          {linkedItems.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2 justify-center">
              {linkedItems.map((item, index) => (
                <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                  <div className="flex items-center gap-1">
                    {item.icon}
                    <span className="truncate max-w-16">{item.name}</span>
                  </div>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})
