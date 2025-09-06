import { CastManager } from '../../CastManager'
import { Input } from '../../ui/input'
import { Movie } from '../../../utils/movieApi'

interface MovieCastEditProps {
  editedMovie: Movie
  onInputChange: (field: keyof Movie, value: string) => void
  accessToken: string
}

export function MovieCastEdit({ 
  editedMovie, 
  onInputChange, 
  accessToken 
}: MovieCastEditProps) {
  return (
    <div className="space-y-6">
      {/* Actress Management */}
      <div>
        <CastManager
          type="actress"
          currentCast={editedMovie.actress || ''}
          onCastChange={(newCast) => onInputChange('actress', newCast)}
          accessToken={accessToken}
        />
      </div>

      {/* Actors Management */}
      <div>
        <CastManager
          type="actor"
          currentCast={editedMovie.actors || ''}
          onCastChange={(newCast) => onInputChange('actors', newCast)}
          accessToken={accessToken}
        />
      </div>

      {/* Director Management */}
      <div>
        <CastManager
          type="director"
          currentCast={editedMovie.director || ''}
          onCastChange={(newCast) => onInputChange('director', newCast)}
          accessToken={accessToken}
        />
      </div>
    </div>
  )
}