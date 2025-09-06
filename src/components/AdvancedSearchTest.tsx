import React from 'react'
import { Button } from './ui/button'
import { Search } from 'lucide-react'
import { AdvancedSearchContent } from './content/AdvancedSearchContent'
import { Movie } from '../utils/movieApi'

interface AdvancedSearchTestProps {
  accessToken: string
  onMovieSelect: (movie: Movie) => void
}

export function AdvancedSearchTest({ accessToken, onMovieSelect }: AdvancedSearchTestProps) {
  const [showAdvancedSearch, setShowAdvancedSearch] = React.useState(false)

  if (showAdvancedSearch) {
    return (
      <AdvancedSearchContent
        accessToken={accessToken}
        onBack={() => setShowAdvancedSearch(false)}
        onMovieClick={onMovieSelect}
      />
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setShowAdvancedSearch(true)}
        className="flex items-center gap-2"
      >
        <Search className="h-4 w-4" />
        Advanced Search Test
      </Button>
    </div>
  )
}