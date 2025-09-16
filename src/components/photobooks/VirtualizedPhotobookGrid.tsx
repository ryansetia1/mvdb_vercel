import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react'
import { Button } from '../ui/button'
import { Camera, Plus } from 'lucide-react'
import { Photobook } from '../../utils/photobookApi'
import { MasterDataItem } from '../../utils/masterDataApi'
import { PhotobookCard } from './PhotobookCard'

interface VirtualizedPhotobookGridProps {
  photobooks: Photobook[]
  onPhotobookClick: (photobook: Photobook) => void
  onUnlinkPhotobook?: (photobook: Photobook) => void
  showUnlinkButtons?: boolean
  isLoading?: boolean
  emptyStateMessage?: string
  onLinkPhotobooks?: () => void
  generations?: MasterDataItem[]
  lineups?: MasterDataItem[]
  members?: MasterDataItem[]
  // Virtualization props
  itemHeight?: number
  itemWidth?: number
  containerHeight?: number
  containerWidth?: number
}

export const VirtualizedPhotobookGrid = React.memo(function VirtualizedPhotobookGrid({
  photobooks,
  onPhotobookClick,
  onUnlinkPhotobook,
  showUnlinkButtons = false,
  isLoading = false,
  emptyStateMessage = "No photobooks linked",
  onLinkPhotobooks,
  generations = [],
  lineups = [],
  members = [],
  itemHeight = 240,
  itemWidth = 180,
  containerHeight = 600,
  containerWidth = 1200
}: VirtualizedPhotobookGridProps) {
  const [dimensions, setDimensions] = useState({ width: containerWidth, height: containerHeight })
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate grid dimensions
  const { columnCount, rowCount } = useMemo(() => {
    const cols = Math.floor(dimensions.width / itemWidth)
    const rows = Math.ceil((photobooks?.length || 0) / cols)
    return {
      columnCount: Math.max(1, cols),
      rowCount: Math.max(1, rows)
    }
  }, [dimensions.width, itemWidth, photobooks?.length])

  // Update dimensions on window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth - 100, // Account for padding/margins
        height: Math.min(600, window.innerHeight - 200)
      })
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Simple virtual scrolling with intersection observer
  useEffect(() => {
    if ((photobooks?.length || 0) <= 50) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0')
            const buffer = 10
            setVisibleRange(prev => ({
              start: Math.max(0, index - buffer),
              end: Math.min(photobooks?.length || 0, index + buffer)
            }))
          }
        })
      },
      { rootMargin: '100px' }
    )

    const elements = containerRef.current?.querySelectorAll('[data-index]')
    elements?.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [photobooks?.length])

  // Get visible photobooks
  const visiblePhotobooks = useMemo(() => {
    if ((photobooks?.length || 0) <= 50) return photobooks || []
    return (photobooks || []).slice(visibleRange.start, visibleRange.end)
  }, [photobooks, visibleRange])

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: Math.min(photobooks?.length || 8, 12) }).map((_, i) => (
          <div key={i} className="w-40 h-60 bg-gray-200 animate-pulse rounded-lg" />
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

  // Use virtual scrolling for large lists (>50 items)
  if ((photobooks?.length || 0) > 50) {
    return (
      <div ref={containerRef} className="w-full">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {(visiblePhotobooks || []).map((photobook, index) => (
            <div key={photobook.id} data-index={visibleRange.start + index}>
              <PhotobookCard
                photobook={photobook}
                onCardClick={onPhotobookClick}
                onUnlink={onUnlinkPhotobook}
                showUnlinkButton={showUnlinkButtons}
                generations={generations}
                lineups={lineups}
                members={members}
              />
            </div>
          ))}
        </div>
        {/* Spacer for virtual scrolling */}
        <div style={{ height: `${Math.max(0, (rowCount - visibleRange.end) * itemHeight)}px` }} />
      </div>
    )
  }

  // Fallback to regular grid for smaller lists
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {(photobooks || []).map((photobook) => (
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
      ))}
    </div>
  )
})
