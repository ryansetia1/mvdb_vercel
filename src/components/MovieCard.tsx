import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { MovieThumbnail } from './MovieThumbnail'
import { MultipleClickableAvatars } from './MultipleClickableAvatars'
import { Movie } from '../utils/movieApi'
import { copyToClipboard } from '../utils/clipboard'
import { getTypeColorClasses, getTypeColorStyles } from '../utils/movieTypeColors'

interface MovieCardProps {
  movie: Movie
  onClick?: () => void
  onActressClick?: (actressName: string, event: React.MouseEvent) => void
  showEditButton?: boolean
  onEdit?: () => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
  accessToken?: string
}

export function MovieCard({
  movie,
  onClick,
  onActressClick,
  showEditButton = false,
  onEdit,
  size = 'md',
  className = '',
  accessToken
}: MovieCardProps) {
  
  // Parse actress names and handle truncation
  const parseActressNames = (actressString: string | undefined) => {
    if (!actressString) return []
    
    // Split by common delimiters (comma, semicolon, slash)
    const names = actressString
      .split(/[,;/]/)
      .map(name => name.trim())
      .filter(name => name.length > 0)
    
    return names
  }

  const actressNames = parseActressNames(movie.actress)
  const displayActresses = actressNames.slice(0, 3)
  const hasMoreActresses = actressNames.length > 3
  const moreCount = actressNames.length - 3

  const handleActressClick = (actressName: string) => {
    if (onActressClick) {
      // Create a synthetic event for backwards compatibility
      const syntheticEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }) as any
      onActressClick(actressName, syntheticEvent)
    }
  }

  const handleCodeClick = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering movie card onClick
    e.preventDefault()
    
    const code = movie.code?.toUpperCase() || 'NO CODE'
    if (code !== 'NO CODE') {
      await copyToClipboard(code, 'Movie code')
    }
  }

  return (
    <Card 
      className={`group hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer relative ${className}`}
      onClick={onClick}
    >
      <div className="p-3 space-y-3">
        {/* Code Badge and Type Label */}
        <div className="flex items-center justify-between gap-2">
          <Badge 
            variant="secondary" 
            className={`text-sm font-mono px-3 py-1 transition-all duration-200 select-none ${
              movie.code 
                ? 'cursor-pointer hover:bg-secondary/80 hover:shadow-sm active:scale-95 transform' 
                : 'cursor-not-allowed opacity-60'
            }`}
            onClick={movie.code ? handleCodeClick : undefined}
            title={movie.code ? `Click to copy: ${movie.code.toUpperCase()}` : 'No code available'}
          >
            {movie.code?.toUpperCase() || 'NO CODE'}
          </Badge>
          
          {/* Type Label */}
          {movie.type && (
            <span 
              className={`text-xs px-2 py-1 rounded-md font-medium ${getTypeColorClasses(movie.type)}`}
              style={getTypeColorStyles(movie.type)}
              title={`Movie type: ${movie.type}`}
            >
              {movie.type.toUpperCase()}
            </span>
          )}
        </div>
      
      {/* Year positioned absolutely in bottom right */}
      {movie.releaseDate && (
        <span className="absolute bottom-3 right-3 text-xs text-gray-500">
          {new Date(movie.releaseDate).getFullYear()}
        </span>
      )}

        {/* Cover using MovieThumbnail component */}
        <MovieThumbnail
          movie={movie}
          onClick={onClick}
          showHoverEffect={true}
          className="group" // Enable hover effects
          maxHeight="max-h-[200px]" // Reasonable max height for card layout
          showFavoriteButton={true}
          accessToken={accessToken}
        />

        {/* Title */}
        <div className="space-y-1">
          <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {movie.titleEn || movie.titleJp || 'Untitled'}
          </h3>
          
          {/* Japanese title if different from English */}
          {movie.titleJp && movie.titleEn && movie.titleJp !== movie.titleEn && (
            <p className="text-xs text-gray-600 line-clamp-1">
              {movie.titleJp}
            </p>
          )}
        </div>

        {/* Actresses - Using MultipleClickableAvatars */}
        {movie.actress && accessToken && (
          <div className="pr-16 mb-8">
            <MultipleClickableAvatars
              names={movie.actress}
              onProfileClick={handleActressClick}
              accessToken={accessToken}
              size="sm"
              showNames={true}
              maxDisplay={3}
              className="justify-start"
            />
          </div>
        )}

        {/* Fallback for when no accessToken is provided */}
        {movie.actress && !accessToken && (
          <div className="text-xs text-gray-600 pr-16 mb-8">
            <div className="line-clamp-2">
              {movie.actress.split(',').map(name => name.trim()).slice(0, 3).join(', ')}
              {movie.actress.split(',').length > 3 && (
                <span className="text-gray-500 italic">
                  {' '} & {movie.actress.split(',').length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Edit button for admin mode */}
        {showEditButton && onEdit && (
          <div className="pt-2 border-t pr-16 mb-8">
            <button
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onEdit()
              }}
              className="w-full text-xs text-blue-600 hover:text-blue-800 hover:underline"
            >
              Edit Movie
            </button>
          </div>
        )}
      </div>
    </Card>
  )
}