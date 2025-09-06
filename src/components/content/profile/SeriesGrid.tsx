import { useState, useEffect } from 'react'
import { Card, CardContent } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { List, Film } from 'lucide-react'
import { Movie } from '../../../utils/movieApi'

interface SeriesGridProps {
  directorName: string
  movies: Movie[]
  onMovieFilter: (directorName: string, seriesName: string) => void
}

interface SeriesCollaboration {
  seriesName: string
  movieCount: number
  movies: Movie[]
  latestMovie: Movie | null
}

export function SeriesGrid({ directorName, movies, onMovieFilter }: SeriesGridProps) {
  const [series, setSeries] = useState<SeriesCollaboration[]>([])

  useEffect(() => {
    // Group movies by series
    const seriesGroups: { [key: string]: Movie[] } = {}
    
    movies.forEach(movie => {
      if (movie.series) {
        const seriesName = movie.series.trim()
        if (!seriesGroups[seriesName]) {
          seriesGroups[seriesName] = []
        }
        seriesGroups[seriesName].push(movie)
      }
    })

    // Convert to series collaboration data
    const seriesCollaborations: SeriesCollaboration[] = Object.entries(seriesGroups)
      .map(([seriesName, seriesMovies]) => {
        // Sort movies by release date (newest first)
        const sortedMovies = seriesMovies.sort((a, b) => {
          if (!a.releaseDate) return 1
          if (!b.releaseDate) return -1
          return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
        })

        return {
          seriesName,
          movieCount: seriesMovies.length,
          movies: sortedMovies,
          latestMovie: sortedMovies[0] || null
        }
      })
      .sort((a, b) => b.movieCount - a.movieCount) // Sort by movie count (descending)

    setSeries(seriesCollaborations)
  }, [movies])

  if (series.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No series collaborations found</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {series.map((seriesItem) => (
        <Card 
          key={seriesItem.seriesName} 
          className="hover:shadow-md transition-shadow cursor-pointer group"
          onClick={() => onMovieFilter(directorName, seriesItem.seriesName)}
        >
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Series Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1 min-w-0">
                  <h3 className="font-medium group-hover:text-blue-600 transition-colors truncate">
                    {seriesItem.seriesName}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Film className="h-4 w-4" />
                    <span>{seriesItem.movieCount} movie{seriesItem.movieCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <List className="h-5 w-5 text-muted-foreground group-hover:text-blue-600 transition-colors flex-shrink-0 ml-2" />
              </div>

              {/* Latest Movie Info */}
              {seriesItem.latestMovie && (
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Latest: </span>
                    <span className="font-medium">{seriesItem.latestMovie.titleEn || seriesItem.latestMovie.titleJp}</span>
                  </div>
                  {seriesItem.latestMovie.releaseDate && (
                    <div className="text-sm text-muted-foreground">
                      {new Date(seriesItem.latestMovie.releaseDate).getFullYear()}
                    </div>
                  )}
                </div>
              )}

              {/* Collaboration Strength Badge */}
              <div className="flex justify-end">
                <Badge 
                  variant={seriesItem.movieCount >= 5 ? 'default' : seriesItem.movieCount >= 3 ? 'secondary' : 'outline'}
                  className="text-xs"
                >
                  {seriesItem.movieCount >= 5 ? 'Frequent' : seriesItem.movieCount >= 3 ? 'Regular' : 'Occasional'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}