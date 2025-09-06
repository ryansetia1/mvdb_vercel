import { Movie } from '../utils/movieApi'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { processTemplate } from '../utils/templateUtils'

interface SimpleMovieCardProps {
  movie: Movie
  onClick: () => void
}

export function SimpleMovieCard({ movie, onClick }: SimpleMovieCardProps) {
  // Process the cover URL with template if needed
  const getCoverUrl = (movie: Movie): string => {
    if (!movie.cover) return ''
    
    // If cover contains template variables and we have dmcode, process it
    if ((movie.cover.includes('*') || movie.cover.includes('{{')) && movie.dmcode) {
      return processTemplate(movie.cover, { dmcode: movie.dmcode })
    }
    
    return movie.cover
  }

  const coverUrl = getCoverUrl(movie)

  return (
    <div 
      className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      {/* Cover Image */}
      <div className="aspect-[7/10] bg-gray-100 overflow-hidden">
        {coverUrl ? (
          <ImageWithFallback
            src={coverUrl}
            alt={movie.titleEn || movie.titleJp || 'Movie cover'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
            <div className="text-center p-2">
              <div className="text-xs">No Cover</div>
              {movie.type && <div className="mt-1 text-xs opacity-75">({movie.type})</div>}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Code */}
        {movie.code && (
          <div className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded inline-block">
            {movie.code.toUpperCase()}
          </div>
        )}

        {/* Title */}
        <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
          {movie.titleEn || movie.titleJp || 'Untitled'}
        </h3>

        {/* Japanese title if different */}
        {movie.titleJp && movie.titleEn && movie.titleJp !== movie.titleEn && (
          <p className="text-xs text-gray-600 line-clamp-1">
            {movie.titleJp}
          </p>
        )}

        {/* Actress (simple text display) */}
        {movie.actress && (
          <div className="text-xs text-gray-600 line-clamp-1">
            {movie.actress.split(',').map(name => name.trim()).slice(0, 2).join(', ')}
            {movie.actress.split(',').length > 2 && ' & others'}
          </div>
        )}

        {/* Release Year */}
        {movie.releaseDate && (
          <div className="text-xs text-gray-500">
            {new Date(movie.releaseDate).getFullYear()}
          </div>
        )}
      </div>
    </div>
  )
}