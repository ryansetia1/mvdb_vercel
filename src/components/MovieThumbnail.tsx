import { CroppedImage } from './CroppedImage'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { SimpleFavoriteButton } from './SimpleFavoriteButton'
import { Movie } from '../utils/movieApi'
import { processTemplate } from '../utils/templateUtils'
import { parseLinks } from './content/movieDetail/MovieDetailHelpers'
import { Button } from './ui/button'
import { Play } from 'lucide-react'

interface MovieThumbnailProps {
  movie: Movie
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  onClick?: () => void
  showHoverEffect?: boolean
  forceAspectRatio?: string
  maxHeight?: string
  showFavoriteButton?: boolean
  accessToken?: string
}

export function MovieThumbnail({
  movie,
  size = 'md',
  className = '',
  onClick,
  showHoverEffect = true,
  forceAspectRatio,
  maxHeight = 'max-h-[300px]', // Default max height for full ratio images
  showFavoriteButton = false,
  accessToken
}: MovieThumbnailProps) {
  // Process the cover URL with template if needed
  const getCoverUrl = (movie: Movie): string => {
    if (!movie.cover) return ''

    // If cover contains template variables (asterix * or curly braces) and we have dmcode, process it
    if ((movie.cover.includes('*') || movie.cover.includes('{{')) && movie.dmcode) {
      return processTemplate(movie.cover, { dmcode: movie.dmcode })
    }

    return movie.cover
  }

  const coverUrl = getCoverUrl(movie)

  // Get first available watch link (Priority: clinks > ulinks > slinks)
  const getFirstWatchLink = (): string | null => {
    const clinks = parseLinks(movie.clinks)
    if (clinks.length > 0) return clinks[0]

    const ulinks = parseLinks(movie.ulinks)
    if (ulinks.length > 0) return ulinks[0]

    const slinks = parseLinks(movie.slinks)
    if (slinks.length > 0) return slinks[0]

    return null
  }

  const watchLink = getFirstWatchLink()

  // Size mappings for responsive design (used for cropped images)
  const sizeClasses = {
    sm: 'w-16 h-20',      // 4:5 ratio
    md: 'w-24 h-32',      // 3:4 ratio  
    lg: 'w-32 h-42',      // 3:4 ratio
    xl: 'w-40 h-52'       // 3:4 ratio
  }

  // Determine aspect ratio and container classes based on crop setting
  // Auto-crop covers for type "cen"
  const shouldUseCrop = movie.cropCover || movie.type === 'cen'
  // Use exact 140:200 ratio (0.7) for cropped covers
  const aspectRatio = forceAspectRatio || (shouldUseCrop ? 'aspect-[7/10]' : '')

  // Different container classes for cropped vs full ratio
  const containerClasses = shouldUseCrop
    ? `
        bg-gray-100 rounded overflow-hidden 
        ${aspectRatio}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `.trim()
    : `
        bg-gray-100 rounded overflow-hidden 
        w-full ${maxHeight}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `.trim()

  const imageClasses = shouldUseCrop
    ? `
        w-full h-full object-cover
        ${showHoverEffect ? 'group-hover:scale-105 transition-transform duration-200' : ''}
      `.trim()
    : `
        w-full h-auto object-contain
        ${showHoverEffect ? 'group-hover:scale-105 transition-transform duration-200' : ''}
      `.trim()

  if (!coverUrl) {
    return (
      <div
        className={containerClasses}
        onClick={onClick}
      >
        <div className={shouldUseCrop
          ? "w-full h-full flex items-center justify-center bg-gray-200 text-gray-500"
          : "w-full min-h-[120px] flex items-center justify-center bg-gray-200 text-gray-500"
        }>
          <div className="text-center p-2">
            <div className="text-xs">No Cover</div>
            {movie.type && <div className="mt-1 text-xs opacity-75">({movie.type})</div>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`${containerClasses} ${showFavoriteButton ? 'group relative' : ''}`}
      onClick={onClick}
    >
      {shouldUseCrop ? (
        // Show cropped version (crop to right side) with fixed aspect ratio
        <CroppedImage
          src={coverUrl}
          alt={movie.titleEn || movie.titleJp || 'Movie cover'}
          className={imageClasses}
          cropToRight={true}
          fixedSize={false} // Use container sizing for responsive behavior
        />
      ) : (
        // Show full image with natural aspect ratio
        <ImageWithFallback
          src={coverUrl}
          alt={movie.titleEn || movie.titleJp || 'Movie cover'}
          className={imageClasses}
        />
      )}

      {/* Movie Thumbnail Favorite Button */}
      {showFavoriteButton && accessToken && coverUrl && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <SimpleFavoriteButton
            type="movie"
            itemId={movie.id || ''}
            size="sm"
            variant="ghost"
            className="bg-white/90 hover:bg-white text-gray-700 hover:text-red-500 shadow-lg"
          />
        </div>
      )}

      {/* Play Button - Bottom Left */}
      {showFavoriteButton && watchLink && (
        <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-full bg-primary/90 hover:bg-primary text-primary-foreground shadow-lg border-none"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              window.open(watchLink, '_blank')
            }}
          >
            <Play className="h-4 w-4 fill-current ml-0.5" />
          </Button>
        </div>
      )}
    </div>
  )
}