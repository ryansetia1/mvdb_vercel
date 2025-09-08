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
  
  // Parse movie types
  const currentTypes = editedMovie.type ? editedMovie.type.split(',').map(t => t.trim()) : []
  
  // Determine which link sections to show based on type
  const getLinkSectionsToShow = () => {
    if (!editedMovie.type) {
      // If no type selected, show all sections
      return { showCensored: true, showUncensored: true, showOthers: true }
    }

    const types = currentTypes.map(t => t.toLowerCase())
    
    // Check for specific types
    const hasCen = types.includes('cen')
    const hasSem = types.includes('sem') 
    const hasUn = types.includes('un')
    const hasLeaks = types.includes('leaks')

    let showCensored = false
    let showUncensored = false
    let showOthers = false

    if (hasCen || hasSem) {
      // Cen, Sem = censored, others
      showCensored = true
      showOthers = true
    } else if (hasUn) {
      // Un = Uncensored, others  
      showUncensored = true
      showOthers = true
    } else if (hasLeaks) {
      // Leaks = censored, uncensored, others
      showCensored = true
      showUncensored = true
      showOthers = true
    } else {
      // For other types, show all sections
      showCensored = true
      showUncensored = true
      showOthers = true
    }

    return { showCensored, showUncensored, showOthers }
  }

  const { showCensored, showUncensored, showOthers } = getLinkSectionsToShow()

  return (
    <div className="space-y-6">
      {showCensored && (
        <LinkManager
          label="Censored"
          links={editedMovie.clinks || ''}
          onLinksChange={(links) => onLinksChange('clinks', links)}
          placeholder="Add censored links like trailers, reviews, etc."
        />
      )}

      {showUncensored && (
        <LinkManager
          label="Uncensored"
          links={editedMovie.ulinks || ''}
          onLinksChange={(links) => onLinksChange('ulinks', links)}
          placeholder="Add uncensored download sources and mirrors"
        />
      )}

      {showOthers && (
        <LinkManager
          label="Other"
          links={editedMovie.slinks || ''}
          onLinksChange={(links) => onLinksChange('slinks', links)}
          placeholder="Add other platforms like Netflix, Amazon Prime, etc."
        />
      )}
    </div>
  )
}