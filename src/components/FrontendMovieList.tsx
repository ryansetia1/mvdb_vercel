import { useState, useEffect } from 'react'
import { Card } from './ui/card'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { MovieCard } from './MovieCard'
import { MoviePage } from './MoviePage'
import { ProfilePage } from './ProfilePage'
import { Movie, movieApi } from '../utils/movieApi'

import { Search, ArrowLeft } from 'lucide-react'

interface FrontendMovieListProps {
  accessToken: string
  onEditMovie?: (movie: Movie) => void
  initialMovie?: Movie
}

export function FrontendMovieList({ accessToken, onEditMovie, initialMovie }: FrontendMovieListProps) {
  const [movies, setMovies] = useState<Movie[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [showProfile, setShowProfile] = useState<{ name: string; type: 'actress' } | null>(null)

  useEffect(() => {
    loadMovies()
  }, [])

  useEffect(() => {
    if (initialMovie) {
      setSelectedMovie(initialMovie)
    }
  }, [initialMovie])

  const loadMovies = async () => {
    try {
      setIsLoading(true)
      
      if (!accessToken) {
        throw new Error('Access token is required')
      }
      
      const moviesData = await movieApi.getMovies(accessToken)
      setMovies(moviesData)
      setError('')
    } catch (error: any) {
      console.log('Load movies error:', error)
      setError(`Gagal memuat movies: ${error.message || error}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter movies based on search term
  const filteredMovies = movies.filter(movie => {
    if (!searchTerm.trim()) return true
    
    const searchLower = searchTerm.toLowerCase()
    
    // Search in all text fields
    const searchableFields = [
      movie.code,
      movie.titleEn,
      movie.titleJp,
      movie.actress,
      movie.actors,
      movie.director,
      movie.studio,
      movie.series,
      movie.label,
      movie.tags,
      movie.type
    ]
    
    return searchableFields.some(field => 
      field?.toLowerCase().includes(searchLower)
    )
  })

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie)
  }

  const handleBackToList = () => {
    setSelectedMovie(null)
    setShowProfile(null)
  }

  const handleActressClick = (actress: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent movie click
    setShowProfile({ name: actress, type: 'actress' })
  }

  if (showProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ProfilePage
          type={showProfile.type}
          name={showProfile.name}
          accessToken={accessToken}
          onBack={handleBackToList}
          onMovieSelect={(movie) => {
            setSelectedMovie(movie)
            setShowProfile(null)
          }}
        />
      </div>
    )
  }

  if (selectedMovie) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 bg-white border-b px-4 py-3 z-10">
          <Button 
            variant="ghost" 
            onClick={handleBackToList}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Movies
          </Button>
        </div>
        <MoviePage 
          movie={selectedMovie} 
          accessToken={accessToken} 
          onEdit={onEditMovie}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-4">Movie Database</h1>
          
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search movies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Search Results Info */}
          {searchTerm.trim() && (
            <div className="mt-2 text-sm text-gray-600">
              {filteredMovies.length} movie(s) found for "{searchTerm}"
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200 mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="aspect-[3/4] bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm.trim() ? 'No movies found' : 'No movies available'}
            </h3>
            <p className="text-gray-600">
              {searchTerm.trim() 
                ? 'Try adjusting your search terms.' 
                : 'Movies will appear here once added to the database.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredMovies.map((movie) => {
              // Debug logging for movie covers
              if (movie.cover) {
                console.log(`FrontendMovieList: Movie "${movie.titleEn || movie.titleJp}" has cover: ${movie.cover.substring(0, 30)}... (cropCover: ${movie.cropCover})`)
              }
              
              return (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onMovieClick={handleMovieClick}
                  onActressClick={handleActressClick}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}