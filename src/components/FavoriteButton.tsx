import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Heart } from 'lucide-react'
import { favoritesApi, FavoriteItem } from '../utils/favoritesApi'
import { toast } from 'sonner@2.0.3'

interface FavoriteButtonProps {
  type: FavoriteItem['type']
  itemId: string
  sourceId?: string
  metadata?: any
  accessToken: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  className?: string
  showText?: boolean
}

export function FavoriteButton({ 
  type, 
  itemId, 
  sourceId, 
  metadata, 
  accessToken, 
  size = 'sm',
  variant = 'ghost',
  className = '',
  showText = false
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    checkFavoriteStatus()
  }, [type, itemId, sourceId, accessToken])

  const checkFavoriteStatus = async () => {
    if (!accessToken) return
    
    try {
      const favorite = await favoritesApi.checkIsFavorite(type, itemId, sourceId, accessToken)
      setIsFavorite(!!favorite)
    } catch (error) {
      console.warn('Failed to check favorite status:', error)
      // Don't show error to user, just assume not favorite
      setIsFavorite(false)
    }
  }

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    if (isLoading) return

    setIsLoading(true)

    try {
      // Clear cache before toggle to ensure fresh data
      favoritesApi.clearCache()
      
      const { isFavorite: newIsFavorite } = await favoritesApi.toggleFavorite(
        type, 
        itemId, 
        accessToken,
        sourceId,
        metadata
      )
      
      setIsFavorite(newIsFavorite)
      
      toast.success(newIsFavorite ? 'Added to favorites' : 'Removed from favorites')
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      
      // Refresh the status from server if toggle fails
      await checkFavoriteStatus()
      
      // Show error message
      const errorMessage = error?.message || 'Could not update favorites at this time'
      if (errorMessage.includes('already in favorites')) {
        toast.error('This item is already in your favorites')
      } else {
        toast.error('Could not update favorites at this time')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const buttonSize = size === 'sm' ? 'h-8 w-8' : size === 'md' ? 'h-10 w-10' : 'h-12 w-12'
  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'

  return (
    <Button
      variant={variant}
      size={showText ? size : 'icon'}
      className={`${buttonSize} ${className} ${isLoading ? 'opacity-60' : ''}`}
      onClick={handleToggleFavorite}
      disabled={isLoading}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart 
        className={`${iconSize} ${isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'} transition-colors`}
      />
      {showText && (
        <span className="ml-2">
          {isFavorite ? 'Favorited' : 'Favorite'}
        </span>
      )}
    </Button>
  )
}