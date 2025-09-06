import { useState } from 'react'
import { Button } from './ui/button'
import { Heart } from 'lucide-react'
import { useSimpleFavoritesContext } from '../contexts/SimpleFavoritesContext'
import { SimpleFavorite } from '../utils/simpleFavoritesApi'
import { cn } from './ui/utils'

interface SimpleFavoriteButtonProps {
  type: SimpleFavorite['type']
  itemId: string
  sourceId?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost' | 'outline'
  showText?: boolean
  className?: string
}

export function SimpleFavoriteButton({
  type,
  itemId,
  sourceId,
  size = 'md',
  variant = 'ghost',
  showText = false,
  className
}: SimpleFavoriteButtonProps) {
  const { isFavorited, toggleFavorite } = useSimpleFavoritesContext()
  const [isToggling, setIsToggling] = useState(false)

  const favorite = isFavorited(type, itemId, sourceId)
  const isFaved = !!favorite

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isToggling) return

    setIsToggling(true)
    try {
      await toggleFavorite(type, itemId, sourceId)
    } finally {
      setIsToggling(false)
    }
  }

  const sizeClasses = {
    sm: 'h-6 w-6 p-0',
    md: 'h-8 w-8 p-0',
    lg: 'h-10 w-10 p-0'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  return (
    <Button
      size={showText ? 'sm' : 'icon'}
      variant={variant}
      onClick={handleToggle}
      disabled={isToggling}
      className={cn(
        !showText && sizeClasses[size],
        'transition-colors duration-200',
        isFaved && 'text-red-500 hover:text-red-600',
        !isFaved && 'text-muted-foreground hover:text-foreground',
        className
      )}
      title={isFaved ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart 
        className={cn(
          iconSizes[size],
          isFaved && 'fill-current',
          isToggling && 'animate-pulse'
        )} 
      />
      {showText && (
        <span className="ml-2">
          {isFaved ? 'Favorited' : 'Favorite'}
        </span>
      )}
    </Button>
  )
}