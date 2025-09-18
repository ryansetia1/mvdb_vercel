import React, { useMemo } from 'react'
import { Button } from '../ui/button'
import { Camera, Plus } from 'lucide-react'
import { Photobook } from '../../utils/photobookApi'
import { MasterDataItem } from '../../utils/masterDataApi'
import { PhotobookCard } from './PhotobookCard'
import { VirtualizedPhotobookGrid } from './VirtualizedPhotobookGrid'

interface PhotobookGridProps {
  photobooks: Photobook[]
  onPhotobookClick: (photobook: Photobook) => void
  onUnlinkPhotobook?: (photobook: Photobook) => void
  showUnlinkButtons?: boolean
  isLoading?: boolean
  emptyStateMessage?: string
  onLinkPhotobooks?: () => void
  // New props for hierarchy data
  generations?: MasterDataItem[]
  lineups?: MasterDataItem[]
  members?: MasterDataItem[]
}

export const PhotobookGrid = React.memo(function PhotobookGrid({
  photobooks,
  onPhotobookClick,
  onUnlinkPhotobook,
  showUnlinkButtons = false,
  isLoading = false,
  emptyStateMessage = "No photobooks linked",
  onLinkPhotobooks,
  generations = [],
  lineups = [],
  members = []
}: PhotobookGridProps) {
  // Memoize photobook cards to prevent unnecessary re-renders
  const photobookCards = useMemo(() => {
    return photobooks.map((photobook) => (
      <PhotobookCard
        key={photobook.id}
        photobook={photobook}
        onCardClick={onPhotobookClick}
        onUnlink={onUnlinkPhotobook}
        showUnlinkButton={showUnlinkButtons}
        generations={generations}
        lineups={lineups}
        members={members}
      />
    ))
  }, [photobooks, onPhotobookClick, onUnlinkPhotobook, showUnlinkButtons, generations, lineups, members])
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: Math.min(photobooks?.length || 8, 12) }).map((_, i) => (
          <div key={i} className="w-64 h-96 bg-gray-200 animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if ((photobooks?.length || 0) === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Camera className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {emptyStateMessage}
        </h3>
        <p className="text-gray-500 mb-4">
          Link photobooks to see them here
        </p>
        {onLinkPhotobooks && (
          <Button onClick={onLinkPhotobooks} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Link Photobooks
          </Button>
        )}
      </div>
    )
  }

  return (
    <VirtualizedPhotobookGrid
      photobooks={photobooks}
      onPhotobookClick={onPhotobookClick}
      onUnlinkPhotobook={onUnlinkPhotobook}
      showUnlinkButtons={showUnlinkButtons}
      isLoading={isLoading}
      emptyStateMessage={emptyStateMessage}
      onLinkPhotobooks={onLinkPhotobooks}
      generations={generations}
      lineups={lineups}
      members={members}
    />
  )
})
