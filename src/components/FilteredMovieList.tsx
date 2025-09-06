import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ArrowLeft, Search, Filter } from 'lucide-react'
import { Movie, movieApi } from '../utils/movieApi'
import { CroppedImage } from './CroppedImage'
import { processTemplate } from '../utils/templateUtils'

interface FilteredMovieListProps {
  accessToken: string
  filterType: 'studio' | 'series' | 'type' | 'tag' | 'actress' | 'actor' | 'director'
  filterValue: string
  onBack: () => void
  onMovieSelect: (movie: Movie) => void
}

export function FilteredMovieList({ 
  accessToken, 
  filterType, 
  filterValue, 
  onBack, 
  onMovieSelect 
}: FilteredMovieListProps) {
  const [movies, setMovies] = useState<Movie[]>([])
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadMovies()
  }, [filterType, filterValue])

  useEffect(() => {
    // Apply search filter
    if (searchQuery.trim()) {
      const filtered = movies.filter(movie =>
        movie.titleEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.titleJp?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.code?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredMovies(filtered)
    } else {
      setFilteredMovies(movies)
    }
  }, [movies, searchQuery])

  const loadMovies = async () => {
    try {
      setIsLoading(true)
      const allMovies = await movieApi.getMovies(accessToken)
      
      // Filter movies based on type and value
      const filtered = allMovies.filter((movie: Movie) => {
        switch (filterType) {
          case 'studio':
            return movie.studio?.toLowerCase().includes(filterValue.toLowerCase())
          case 'series':
            return movie.series?.toLowerCase().includes(filterValue.toLowerCase())
          case 'type':
            return movie.type?.toLowerCase().includes(filterValue.toLowerCase())
          case 'tag':
            return movie.tags?.toLowerCase().includes(filterValue.toLowerCase())
          case 'actress':
            return movie.actress?.toLowerCase().includes(filterValue.toLowerCase())
          case 'actor':
            return movie.actors?.toLowerCase().includes(filterValue.toLowerCase())
          case 'director':
            return movie.director?.toLowerCase().includes(filterValue.toLowerCase())
          default:
            return false
        }
      })
      
      setMovies(filtered)
      setError('')
    } catch (error: any) {
      console.log('Error loading movies:', error)
      setError('Failed to load movies')
    } finally {
      setIsLoading(false)
    }
  }

  const getFilterLabel = () => {
    switch (filterType) {
      case 'studio': return 'Studio'
      case 'series': return 'Series'
      case 'type': return 'Type'
      case 'tag': return 'Tag'
      case 'actress': return 'Actress'
      case 'actor': return 'Actor'
      case 'director': return 'Director'
      default: return 'Filter'
    }
  }

  const getCoverUrl = (movie: Movie) => {
    return movie.cover && movie.dmcode 
      ? processTemplate(movie.cover, { dmcode: movie.dmcode })
      : movie.cover || ''
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold">
              {getFilterLabel()}: {filterValue}
            </h1>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {filteredMovies.length} movies
            </Badge>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search movies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading movies...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>{error}</p>
            </div>
          ) : filteredMovies.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>
                {searchQuery 
                  ? `No movies found matching "${searchQuery}"` 
                  : `No movies found for ${getFilterLabel().toLowerCase()}: "${filterValue}"`
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {filteredMovies.map((movie) => (
                <div
                  key={movie.id}
                  className="cursor-pointer group"
                  onClick={() => onMovieSelect(movie)}
                >
                  <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-2">
                    {getCoverUrl(movie) ? (
                      <CroppedImage
                        src={getCoverUrl(movie)}
                        alt={movie.titleEn || movie.titleJp || 'Movie cover'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        cropToRight={movie.cropCover}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-xs">
                        No Cover
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {movie.titleEn || movie.titleJp || 'Untitled'}
                    </h4>
                    {movie.code && (
                      <Badge variant="outline" className="text-xs">
                        {movie.code.toUpperCase()}
                      </Badge>
                    )}
                    {movie.actress && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {movie.actress}
                      </p>
                    )}
                    {movie.releaseDate && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(movie.releaseDate).getFullYear()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}