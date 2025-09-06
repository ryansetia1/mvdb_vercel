import { Input } from '../../ui/input'
import { DateDurationInputs } from '../../DateDurationInputs'
import { MetadataSelector } from '../../MetadataSelector'
import { CastManager } from '../../CastManager'
import { LinkManager } from '../../LinkManager'
import { TagsManager } from '../../TagsManager'
import { Movie } from '../../../utils/movieApi'
import { Building, Tag, LinkIcon } from 'lucide-react'

interface MovieBasicInfoEditProps {
  editedMovie: Movie
  onInputChange: (field: keyof Movie, value: string) => void
  onLinksChange: (field: string, links: string) => void
  accessToken: string
}

export function MovieBasicInfoEdit({ 
  editedMovie, 
  onInputChange, 
  onLinksChange, 
  accessToken 
}: MovieBasicInfoEditProps) {
  return (
    <div className="space-y-4">
      {/* Release Date and Duration */}
      <DateDurationInputs
        releaseDate={editedMovie.releaseDate || ''}
        duration={editedMovie.duration || ''}
        onReleaseDateChange={(date) => onInputChange('releaseDate', date)}
        onDurationChange={(duration) => onInputChange('duration', duration)}
        isEditing={true}
      />

      {/* Type */}
      <div className="flex items-center gap-3">
        <Tag className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1">
          <span className="text-sm text-muted-foreground block">Type</span>
          <MetadataSelector
            type="type"
            currentValue={editedMovie.type || ''}
            onValueChange={(value) => onInputChange('type', value)}
            accessToken={accessToken}
          />
        </div>
      </div>

      {/* Studio */}
      <div className="flex items-center gap-3">
        <Building className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1">
          <span className="text-sm text-muted-foreground block">Studio</span>
          <MetadataSelector
            type="studio"
            currentValue={editedMovie.studio || ''}
            onValueChange={(value) => onInputChange('studio', value)}
            accessToken={accessToken}
          />
        </div>
      </div>

      {/* Series */}
      <div>
        <span className="text-sm text-muted-foreground block">Series</span>
        <MetadataSelector
          type="series"
          currentValue={editedMovie.series || ''}
          onValueChange={(value) => onInputChange('series', value)}
          accessToken={accessToken}
        />
      </div>

      {/* Label */}
      <div>
        <span className="text-sm text-muted-foreground block">Label</span>
        <MetadataSelector
          type="label"
          currentValue={editedMovie.label || ''}
          onValueChange={(value) => onInputChange('label', value)}
          accessToken={accessToken}
        />
      </div>

      {/* Official Link */}
      <div className="flex items-center gap-3">
        <LinkIcon className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1">
          <span className="text-sm text-muted-foreground block">Official Page</span>
          <Input
            value={editedMovie.dmlink || ''}
            onChange={(e) => onInputChange('dmlink', e.target.value)}
            placeholder="https://..."
            className="font-medium"
          />
        </div>
      </div>
    </div>
  )
}