import { useState, useEffect } from 'react'
import { Card, CardContent } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Building, Film } from 'lucide-react'
import { Movie } from '../../../utils/movieApi'

interface StudiosGridProps {
  directorName: string
  movies: Movie[]
  onMovieFilter: (directorName: string, studioName: string) => void
}

interface StudioCollaboration {
  studioName: string
  movieCount: number
  movies: Movie[]
  latestMovie: Movie | null
}

export function StudiosGrid({ directorName, movies, onMovieFilter }: StudiosGridProps) {
  const [studios, setStudios] = useState<StudioCollaboration[]>([])

  useEffect(() => {
    // Group movies by studio
    const studioGroups: { [key: string]: Movie[] } = {}
    
    movies.forEach(movie => {
      if (movie.studio) {
        const studioName = movie.studio.trim()
        if (!studioGroups[studioName]) {
          studioGroups[studioName] = []
        }
        studioGroups[studioName].push(movie)
      }
    })

    // Convert to studio collaboration data
    const studioCollaborations: StudioCollaboration[] = Object.entries(studioGroups)
      .map(([studioName, studioMovies]) => {
        // Sort movies by release date (newest first)
        const sortedMovies = studioMovies.sort((a, b) => {
          if (!a.releaseDate) return 1
          if (!b.releaseDate) return -1
          return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
        })

        return {
          studioName,
          movieCount: studioMovies.length,
          movies: sortedMovies,
          latestMovie: sortedMovies[0] || null
        }
      })
      .sort((a, b) => b.movieCount - a.movieCount) // Sort by movie count (descending)

    setStudios(studioCollaborations)
  }, [movies])

  if (studios.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No studio collaborations found</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {studios.map((studio) => (
        <Card 
          key={studio.studioName} 
          className="hover:shadow-md transition-shadow cursor-pointer group"
          onClick={() => onMovieFilter(directorName, studio.studioName)}
        >
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Studio Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1 min-w-0">
                  <h3 className="font-medium group-hover:text-blue-600 transition-colors truncate">
                    {studio.studioName}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Film className="h-4 w-4" />
                    <span>{studio.movieCount} movie{studio.movieCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <Building className="h-5 w-5 text-muted-foreground group-hover:text-blue-600 transition-colors flex-shrink-0 ml-2" />
              </div>

              {/* Latest Movie Info */}
              {studio.latestMovie && (
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Latest: </span>
                    <span className="font-medium">{studio.latestMovie.titleEn || studio.latestMovie.titleJp}</span>
                  </div>
                  {studio.latestMovie.releaseDate && (
                    <div className="text-sm text-muted-foreground">
                      {new Date(studio.latestMovie.releaseDate).getFullYear()}
                    </div>
                  )}
                </div>
              )}

              {/* Collaboration Strength Badge */}
              <div className="flex justify-end">
                <Badge 
                  variant={studio.movieCount >= 5 ? 'default' : studio.movieCount >= 3 ? 'secondary' : 'outline'}
                  className="text-xs"
                >
                  {studio.movieCount >= 5 ? 'Frequent' : studio.movieCount >= 3 ? 'Regular' : 'Occasional'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}