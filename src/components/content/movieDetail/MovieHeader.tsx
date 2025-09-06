import { Input } from '../../ui/input'
import { Badge } from '../../ui/badge'
import { Copy } from 'lucide-react'
import { Movie } from '../../../utils/movieApi'
import { copyToClipboard } from '../../../utils/clipboard'

interface MovieHeaderProps {
  movie: Movie
  editedMovie: Movie
  isEditing: boolean
  onInputChange: (field: keyof Movie, value: string) => void
  renderClickableText: (text: string, type: string) => JSX.Element
}

export function MovieHeader({
  movie,
  editedMovie,
  isEditing,
  onInputChange,
  renderClickableText
}: MovieHeaderProps) {
  const currentMovie = isEditing ? editedMovie : movie

  return (
    <div className="space-y-4">
      {/* Movie Code and English Title - Side by side */}
      {isEditing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Movie Code</label>
            <Input
              value={editedMovie.code || ''}
              onChange={(e) => onInputChange('code', e.target.value)}
              placeholder="Movie Code"
              className="font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">English Title</label>
            <Input
              value={editedMovie.titleEn || ''}
              onChange={(e) => onInputChange('titleEn', e.target.value)}
              placeholder="English Title"
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          {/* Movie Code */}
          {currentMovie.code ? (
            <div className="flex-shrink-0">
              <Badge 
                variant="secondary" 
                className="text-lg px-4 py-2 font-mono cursor-pointer hover:bg-secondary/80 transition-colors" 
                onClick={() => copyToClipboard(currentMovie.code!, 'Code')}
                title="Click to copy code"
              >
                {currentMovie.code.toUpperCase()}
                <Copy className="h-4 w-4 ml-2 opacity-50" />
              </Badge>
            </div>
          ) : (
            <div className="flex-shrink-0"></div>
          )}
          
          {/* English Title */}
          <div className="flex-1 min-w-0 text-left">
            <h1 className="text-2xl sm:text-3xl font-bold">
              {currentMovie.titleEn ? renderClickableText(currentMovie.titleEn, 'title') : (currentMovie.titleJp ? renderClickableText(currentMovie.titleJp, 'title') : 'Untitled Movie')}
            </h1>
          </div>
        </div>
      )}

      {/* Japanese Title - Full width below, only if different from English title */}
      {isEditing ? (
        <div>
          <label className="block text-sm font-medium mb-2">Japanese Title</label>
          <Input
            value={editedMovie.titleJp || ''}
            onChange={(e) => onInputChange('titleJp', e.target.value)}
            placeholder="Japanese Title"
          />
        </div>
      ) : (
        currentMovie.titleJp && currentMovie.titleEn && currentMovie.titleJp !== currentMovie.titleEn && (
          <div>
            <h2 className="text-xl sm:text-2xl text-muted-foreground text-center">
              {renderClickableText(currentMovie.titleJp, 'title')}
            </h2>
          </div>
        )
      )}
    </div>
  )
}