import { LinkManager } from '../../LinkManager'
import { Movie } from '../../../utils/movieApi'

interface MovieLinksEditProps {
  editedMovie: Movie
  onLinksChange: (field: string, links: string) => void
}

export function MovieLinksEdit({ 
  editedMovie, 
  onLinksChange 
}: MovieLinksEditProps) {
  return (
    <div className="space-y-6">
      <LinkManager
        label="Censored"
        links={editedMovie.clinks || ''}
        onLinksChange={(links) => onLinksChange('clinks', links)}
        placeholder="Add censored links like trailers, reviews, etc."
      />

      <LinkManager
        label="Uncensored"
        links={editedMovie.ulinks || ''}
        onLinksChange={(links) => onLinksChange('ulinks', links)}
        placeholder="Add uncensored download sources and mirrors"
      />

      <LinkManager
        label="Other"
        links={editedMovie.slinks || ''}
        onLinksChange={(links) => onLinksChange('slinks', links)}
        placeholder="Add other platforms like Netflix, Amazon Prime, etc."
      />
    </div>
  )
}