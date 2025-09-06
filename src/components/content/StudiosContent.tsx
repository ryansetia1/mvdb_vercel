import { useState, useMemo } from 'react'
import { Movie } from '../../utils/movieApi'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { MovieThumbnail } from '../MovieThumbnail'
import { PaginationEnhanced } from '../ui/pagination-enhanced'

interface StudiosContentProps {
  movies: Movie[]
  searchQuery: string
  onFilterSelect: (filterType: string, filterValue: string, title?: string) => void
}

interface StudioInfo {
  name: string
  movieCount: number
  firstMovie: Movie
  coverUrl: string
}

export function StudiosContent({ movies, searchQuery, onFilterSelect }: StudiosContentProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(24)

  const studiosData = useMemo(() => {
    // Group movies by studio
    const studiosMap = new Map<string, Movie[]>()
    
    movies.forEach(movie => {
      if (movie.studio) {
        if (!studiosMap.has(movie.studio)) {
          studiosMap.set(movie.studio, [])
        }
        studiosMap.get(movie.studio)!.push(movie)
      }
    })
    
    // Create studio info with first movie (by release date) as thumbnail
    const studiosInfo: StudioInfo[] = []
    
    studiosMap.forEach((studioMovies, studioName) => {
      // Sort by release date to get the first movie
      const sortedMovies = [...studioMovies].sort((a, b) => {
        if (!a.releaseDate && !b.releaseDate) return 0
        if (!a.releaseDate) return 1
        if (!b.releaseDate) return -1
        return new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
      })
      
      const firstMovie = sortedMovies[0]
      
      studiosInfo.push({
        name: studioName,
        movieCount: studioMovies.length,
        firstMovie,
        coverUrl: '' // We'll use MovieThumbnail component instead
      })
    })
    
    // Sort studios by name
    return studiosInfo.sort((a, b) => a.name.localeCompare(b.name))
  }, [movies])

  const filteredStudios = useMemo(() => {
    if (!searchQuery.trim()) return studiosData
    
    const query = searchQuery.toLowerCase()
    return studiosData.filter(studio =>
      studio.name.toLowerCase().includes(query)
    )
  }, [studiosData, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredStudios.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedStudios = filteredStudios.slice(startIndex, startIndex + itemsPerPage)

  if (filteredStudios.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {searchQuery ? `No studios found for "${searchQuery}"` : 'No studios available'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pagination - Top */}
      <PaginationEnhanced
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={filteredStudios.length}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(newItemsPerPage) => {
          setItemsPerPage(newItemsPerPage)
          setCurrentPage(1)
        }}
      />

      {/* Studios Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {paginatedStudios.map((studio) => (
          <Card 
            key={studio.name} 
            className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
            onClick={() => onFilterSelect('studio', studio.name, `Studio: ${studio.name}`)}
          >
            <MovieThumbnail
              movie={studio.firstMovie}
              onClick={() => onFilterSelect('studio', studio.name, `Studio: ${studio.name}`)}
              showHoverEffect={true}
            />
            
            <CardContent className="p-3 space-y-2">
              <h3 className="font-medium line-clamp-2 text-sm">{studio.name}</h3>
              <Badge variant="secondary" className="text-xs">
                {studio.movieCount} movies
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}