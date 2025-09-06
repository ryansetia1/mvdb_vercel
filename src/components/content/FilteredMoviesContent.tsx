import { useMemo, useState, useEffect } from 'react'
import { Movie } from '../../utils/movieApi'
import { MovieCard } from '../MovieCard'
import { MasterDataItem, masterDataApi } from '../../utils/masterDataApi'

interface FilteredMoviesContentProps {
  movies: Movie[]
  filterType: string
  filterValue: string
  searchQuery: string
  onMovieSelect: (movie: Movie) => void
  onProfileSelect?: (type: 'actor' | 'actress' | 'director', name: string) => void
  actorName?: string
  actressName?: string
  accessToken: string
}

export function FilteredMoviesContent({ 
  movies, 
  filterType, 
  filterValue, 
  searchQuery, 
  onMovieSelect,
  onProfileSelect,
  actorName,
  actressName,
  accessToken
}: FilteredMoviesContentProps) {
  const [actresses, setActresses] = useState<MasterDataItem[]>([])

  useEffect(() => {
    // Load actresses data if we need to filter by group
    if (filterType === 'group') {
      const loadActresses = async () => {
        try {
          const actressesData = await masterDataApi.getByType('actress', accessToken)
          setActresses(actressesData || [])
        } catch (error) {
          console.error('Failed to load actresses for group filtering:', error)
        }
      }
      loadActresses()
    }
  }, [filterType, accessToken])
  const filteredMovies = useMemo(() => {
    let filtered = movies.filter(movie => {
      switch (filterType) {
        case 'collaboration':
          // Check if movie contains both actor and actress
          if (!actorName || !actressName) return false
          
          const hasActor = movie.actors?.split(',').map(name => name.trim()).includes(actorName) || false
          const hasActress = movie.actress?.split(',').map(name => name.trim()).includes(actressName) || false
          
          return hasActor && hasActress
        case 'actress':
          return movie.actress?.toLowerCase().includes(filterValue.toLowerCase())
        case 'actor':
          return movie.actors?.toLowerCase().includes(filterValue.toLowerCase())
        case 'director':
          return movie.director?.toLowerCase().includes(filterValue.toLowerCase())
        case 'series':
          return movie.series === filterValue
        case 'studio':
          return movie.studio === filterValue
        case 'tag':
          const movieTags = movie.tags ? movie.tags.split(',').map(tag => tag.trim()) : []
          return movieTags.some(tag => tag.toLowerCase().includes(filterValue.toLowerCase()))
        case 'type':
          return movie.type === filterValue
        case 'group':
          // Find actresses in the specified group
          const groupActresses = actresses.filter(actress => 
            actress.selectedGroups && actress.selectedGroups.includes(filterValue)
          )
          const groupActressNames = groupActresses.map(actress => actress.name)
          
          // Check if movie features any actress from this group
          if (movie.actress) {
            const movieActresses = movie.actress.split(',').map(name => name.trim())
            return movieActresses.some(actressName => 
              groupActressNames.some(groupActress => 
                groupActress?.toLowerCase().includes(actressName.toLowerCase())
              )
            )
          }
          return false
        default:
          return false
      }
    })

    // Apply search query if present
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(movie =>
        movie.titleEn?.toLowerCase().includes(query) ||
        movie.titleJp?.toLowerCase().includes(query) ||
        movie.code?.toLowerCase().includes(query) ||
        movie.actress?.toLowerCase().includes(query) ||
        movie.actors?.toLowerCase().includes(query) ||
        movie.director?.toLowerCase().includes(query) ||
        movie.studio?.toLowerCase().includes(query) ||
        movie.series?.toLowerCase().includes(query) ||
        movie.tags?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [movies, filterType, filterValue, searchQuery])

  if (filteredMovies.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {filterType === 'collaboration' 
            ? `No movies found featuring both ${actorName} and ${actressName}${searchQuery ? ` matching "${searchQuery}"` : ''}`
            : searchQuery 
              ? `No movies found for "${searchQuery}" in ${filterType}: ${filterValue}`
              : `No movies found for ${filterType}: ${filterValue}`
          }
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {filterType === 'collaboration' 
          ? `Showing ${filteredMovies.length} movies featuring both ${actorName} and ${actressName}${searchQuery ? ` matching "${searchQuery}"` : ''}`
          : `Showing ${filteredMovies.length} movies for ${filterType}: ${filterValue}${searchQuery ? ` matching "${searchQuery}"` : ''}`
        }
      </p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {filteredMovies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onClick={() => onMovieSelect(movie)}
            onActressClick={onProfileSelect ? (actressName, e) => {
              e.stopPropagation()
              onProfileSelect('actress', actressName)
            } : undefined}
          />
        ))}
      </div>
    </div>
  )
}