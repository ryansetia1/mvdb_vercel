import { useState, useEffect } from 'react'
import { ClickableProfileAvatar } from './ClickableProfileAvatar'
import { MasterDataItem, masterDataApi } from '../utils/masterDataApi'

interface MultipleClickableAvatarsProps {
  names: string // comma-separated actress names
  onProfileClick?: (actressName: string) => void
  accessToken: string
  size?: 'sm' | 'md' | 'lg'
  showNames?: boolean
  maxDisplay?: number // Maximum number to show before showing "+X more"
  className?: string
}

export function MultipleClickableAvatars({ 
  names, 
  onProfileClick,
  accessToken,
  size = 'sm',
  showNames = true,
  maxDisplay,
  className = ''
}: MultipleClickableAvatarsProps) {
  const [actresses, setActresses] = useState<MasterDataItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadActresses = async () => {
      if (!names?.trim()) {
        setActresses([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const actressNames = names.split(',').map(name => name.trim()).filter(Boolean)
        
        // Load all actresses from the API with retry logic
        const allActresses = await masterDataApi.getByType('actress', accessToken)
        
        // Find the matching actresses
        const matchedActresses = actressNames.map(name => {
          const found = allActresses?.find(actress => actress.name === name)
          return found || {
            id: `temp-${name}`,
            name,
            type: 'actress' as const,
            profilePicture: undefined
          }
        }).filter(Boolean) as MasterDataItem[]

        setActresses(matchedActresses)
      } catch (error) {
        console.error('Failed to load actresses:', error)
        // Fallback: create basic entries from names
        const actressNames = names.split(',').map(name => name.trim()).filter(Boolean)
        const fallbackActresses = actressNames.map(name => ({
          id: `fallback-${name}`,
          name,
          type: 'actress' as const,
          profilePicture: undefined
        })) as MasterDataItem[]
        
        setActresses(fallbackActresses)
      } finally {
        setIsLoading(false)
      }
    }

    loadActresses()
  }, [names, accessToken])

  if (isLoading) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
        </div>
        <span className="text-xs text-muted-foreground">Loading...</span>
      </div>
    )
  }

  if (actresses.length === 0) {
    return null
  }

  const displayActresses = maxDisplay ? actresses.slice(0, maxDisplay) : actresses
  const remainingCount = maxDisplay && actresses.length > maxDisplay ? actresses.length - maxDisplay : 0

  const avatarSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-10 w-10'
  }

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {displayActresses.map((actress, index) => (
        <ClickableProfileAvatar
          key={actress.id || `${actress.name}-${index}`}
          name={actress.name!}
          profilePicture={actress.profilePicture}
          onProfileClick={onProfileClick}
          size={size}
          showName={showNames}
        />
      ))}
      
      {remainingCount > 0 && (
        <div className="flex items-center">
          <div className={`${avatarSizes[size]} rounded-full bg-muted flex items-center justify-center`}>
            <span className="text-xs text-muted-foreground">+{remainingCount}</span>
          </div>
          {showNames && (
            <span className="text-xs text-muted-foreground ml-1">more</span>
          )}
        </div>
      )}
    </div>
  )
}