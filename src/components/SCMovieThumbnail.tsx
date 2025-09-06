import { useState } from 'react'
import { Badge } from './ui/badge'
import { Subtitles } from 'lucide-react'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { SimpleFavoriteButton } from './SimpleFavoriteButton'
import { SCMovie } from '../utils/scMovieApi'

interface SCMovieThumbnailProps {
  scMovie: SCMovie
  onClick?: () => void
  showHoverEffect?: boolean
  className?: string
  showFavoriteButton?: boolean
  accessToken?: string
}

export function SCMovieThumbnail({
  scMovie,
  onClick,
  showHoverEffect = true,
  className = "",
  showFavoriteButton = false,
  accessToken
}: SCMovieThumbnailProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleImageLoad = () => {
    setIsLoading(false)
    setImageError(false)
  }

  const handleImageError = () => {
    setIsLoading(false)
    setImageError(true)
  }

  const handleClick = () => {
    if (onClick) {
      onClick()
    }
  }

  return (
    <div className={`relative group ${className}`}>
      {/* Cover Image Container */}
      <div 
        className={`relative w-full aspect-[7/10] overflow-hidden rounded-lg bg-gray-100 ${
          showHoverEffect ? 'group-hover:shadow-lg transition-shadow duration-200' : ''
        } ${onClick ? 'cursor-pointer' : ''}`}
        onClick={handleClick}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <span className="text-xs text-gray-500">Loading...</span>
          </div>
        )}

        {/* Image or Fallback */}
        {!imageError && scMovie.cover ? (
          <ImageWithFallback
            src={scMovie.cover}
            alt={scMovie.titleEn || 'SC Movie cover'}
            className="w-full h-full object-cover"
            onLoad={handleImageLoad}
            onError={handleImageError}
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
            <span className="text-xs text-center px-2">
              {imageError ? 'Image not available' : 'No cover'}
            </span>
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 space-y-1">
          {/* SC Type Badge */}
          <Badge 
            variant="secondary" 
            className="bg-purple-600/90 text-white border-none text-xs"
          >
            {scMovie.scType === 'real_cut' ? 'Real Cut' : 'Regular'}
          </Badge>
          
          {/* English Subs Badge */}
          {scMovie.hasEnglishSubs && (
            <Badge 
              variant="secondary" 
              className="bg-green-600/90 text-white border-none flex items-center gap-1 text-xs"
            >
              <Subtitles className="h-2.5 w-2.5" />
              EN
            </Badge>
          )}
        </div>

        {/* HC Code Badge */}
        {scMovie.hcCode && (
          <div className="absolute bottom-2 right-2">
            <Badge 
              variant="outline" 
              className="bg-white/95 text-black border-gray-300 text-xs"
              title={`Related HC movie: ${scMovie.hcCode}`}
            >
              {scMovie.hcCode}
            </Badge>
          </div>
        )}

        {/* Favorite Button */}
        {showFavoriteButton && accessToken && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div onClick={(e) => e.stopPropagation()}>
              <SimpleFavoriteButton
                type="scmovie"
                itemId={scMovie.id || ''}
                size="sm"
                variant="ghost"
                className="bg-white/90 hover:bg-white text-gray-700 hover:text-red-500 shadow-lg"
              />
            </div>
          </div>
        )}

        {/* Hover Overlay */}
        {showHoverEffect && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
        )}
      </div>
    </div>
  )
}