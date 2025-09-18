import React from 'react'
import { Movie } from '../utils/movieApi'
import { MasterDataItem } from '../utils/masterDataApi'
import { CategorizedSearchResults } from './CategorizedSearchResults'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { ArrowLeft, Search } from 'lucide-react'

interface CategorizedSearchPageProps {
  searchQuery: string
  movies: Movie[]
  actresses: MasterDataItem[]
  actors: MasterDataItem[]
  directors: MasterDataItem[]
  onMovieSelect: (movie: Movie) => void
  onProfileSelect?: (type: 'actor' | 'actress' | 'director', name: string) => void
  onFilterSelect?: (filterType: string, filterValue: string, title?: string) => void
  onBack?: () => void
  accessToken: string
}

export function CategorizedSearchPage({
  searchQuery,
  movies,
  actresses,
  actors,
  directors,
  onMovieSelect,
  onProfileSelect,
  onFilterSelect,
  onBack,
  accessToken
}: CategorizedSearchPageProps) {
  
  // Helper function to check if a cast member matches search query
  const castMatchesQuery = (castMember: MasterDataItem, query: string): boolean => {
    if (!query || !query.trim()) return true
    
    const searchQuery = query.toLowerCase().trim()
    
    // Check all name fields
    const nameFields = [
      castMember.name,
      castMember.jpname,
      castMember.kanjiName,
      castMember.kanaName,
      castMember.alias
    ].filter(Boolean)
    
    return nameFields.some(field => 
      field?.toLowerCase().includes(searchQuery)
    )
  }

  // Helper function to check if movie code matches query
  const movieCodeMatchesQuery = (movieCode: string | undefined, query: string): boolean => {
    if (!movieCode || !query || !query.trim()) return false
    
    const code = movieCode.toLowerCase()
    const searchQuery = query.toLowerCase().trim()
    
    // Direct match
    if (code.includes(searchQuery)) return true
    
    // Remove dashes and check
    const codeWithoutDashes = code.replace(/-/g, '')
    if (codeWithoutDashes.includes(searchQuery)) return true
    
    return false
  }

  // Helper function to check if movie contains cast that matches query
  const movieContainsCastWithQuery = (movie: Movie, query: string): boolean => {
    if (!query || !query.trim()) return true
    
    // Check actress
    if (movie.actress) {
      const actressNames = movie.actress.split(',').map(name => name.trim())
      for (const actressName of actressNames) {
        const actress = actresses.find(a => a.name === actressName)
        if (actress && castMatchesQuery(actress, query)) {
          return true
        }
        if (actressName.toLowerCase().includes(query.toLowerCase())) {
          return true
        }
      }
    }
    
    // Check actors
    if (movie.actors) {
      const actorNames = movie.actors.split(',').map(name => name.trim())
      for (const actorName of actorNames) {
        const actor = actors.find(a => a.name === actorName)
        if (actor && castMatchesQuery(actor, query)) {
          return true
        }
        if (actorName.toLowerCase().includes(query.toLowerCase())) {
          return true
        }
      }
    }
    
    // Check director
    if (movie.director) {
      const director = directors.find(d => d.name === movie.director)
      if (director && castMatchesQuery(director, query)) {
        return true
      }
      if (movie.director.toLowerCase().includes(query.toLowerCase())) {
        return true
      }
    }
    
    return false
  }

  // Get total count of all matching items
  const getTotalResults = (): number => {
    const query = searchQuery.toLowerCase().trim()
    
    // Count movies
    const matchingMovies = movies.filter(movie =>
      movie.titleEn?.toLowerCase().includes(query) ||
      movie.titleJp?.toLowerCase().includes(query) ||
      movieCodeMatchesQuery(movie.code, query) ||
      movieCodeMatchesQuery(movie.dmcode, query) ||
      movie.studio?.toLowerCase().includes(query) ||
      movie.series?.toLowerCase().includes(query) ||
      movie.tags?.toLowerCase().includes(query) ||
      movie.label?.toLowerCase().includes(query) ||
      movieContainsCastWithQuery(movie, query)
    )

    // Count actresses
    const matchingActresses = actresses.filter(actress => castMatchesQuery(actress, query))
    
    // Count actors
    const matchingActors = actors.filter(actor => castMatchesQuery(actor, query))
    
    // Count directors
    const matchingDirectors = directors.filter(director => castMatchesQuery(director, query))
    
    // Count studios
    const uniqueStudios = [...new Set(movies.map(m => m.studio).filter(Boolean))]
    const matchingStudios = uniqueStudios.filter(studio => 
      studio?.toLowerCase().includes(query)
    )
    
    // Count series
    const uniqueSeries = [...new Set(movies.map(m => m.series).filter(Boolean))]
    const matchingSeries = uniqueSeries.filter(series => 
      series?.toLowerCase().includes(query)
    )
    
    // Count tags
    const allTags = movies.flatMap(m => m.tags?.split(',').map(tag => tag.trim()).filter(Boolean) || [])
    const uniqueTags = [...new Set(allTags)]
    const matchingTags = uniqueTags.filter(tag => 
      tag.toLowerCase().includes(query)
    )
    
    // Count labels
    const uniqueLabels = [...new Set(movies.map(m => m.label).filter(Boolean))]
    const matchingLabels = uniqueLabels.filter(label => 
      label?.toLowerCase().includes(query)
    )

    return matchingMovies.length + 
           matchingActresses.length + 
           matchingActors.length + 
           matchingDirectors.length + 
           matchingStudios.length + 
           matchingSeries.length + 
           matchingTags.length + 
           matchingLabels.length
  }

  const totalResults = getTotalResults()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
        <div className="flex items-center gap-3">
          <Search className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold">Search Results</h1>
            <p className="text-muted-foreground">
              Found {totalResults} results for "{searchQuery}"
            </p>
          </div>
        </div>
      </div>

      {/* Search Results */}
      <CategorizedSearchResults
        searchQuery={searchQuery}
        movies={movies}
        actresses={actresses}
        actors={actors}
        directors={directors}
        onMovieSelect={onMovieSelect}
        onProfileSelect={onProfileSelect}
        accessToken={accessToken}
      />
    </div>
  )
}
