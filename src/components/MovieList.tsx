import { useState, useEffect, useCallback } from 'react'
import { useGlobalKeyboardPagination } from '../hooks/useGlobalKeyboardPagination'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Plus, Search, Edit, Trash2, Link } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './ui/pagination'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { UnifiedMovieForm } from './UnifiedMovieForm'
import { MovieThumbnail } from './MovieThumbnail'
import { CroppedImage } from './CroppedImage'

import { Movie, movieApi } from '../utils/movieApi'
import { SCMovie } from '../utils/scMovieApi'
import { processTemplate } from '../utils/templateUtils'

interface MovieListProps {
  accessToken: string
  editingMovie?: Movie | null
  onClearEditing?: () => void
}

export function MovieList({ accessToken, editingMovie, onClearEditing }: MovieListProps) {
  const [movies, setMovies] = useState<Movie[]>([])
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [localEditingMovie, setLocalEditingMovie] = useState<Movie | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  // Calculate total pages for keyboard navigation
  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage)
  
  // Keyboard navigation for pagination using global hook
  useGlobalKeyboardPagination(
    currentPage,
    totalPages,
    (page: number) => setCurrentPage(page),
    'movie-list',
    !showForm // Disable when form is open
  )

  useEffect(() => {
    loadMovies()
  }, [])

  // Handle external editing movie
  useEffect(() => {
    if (editingMovie) {
      setLocalEditingMovie(editingMovie)
      setShowForm(true)
    }
  }, [editingMovie])

  useEffect(() => {
    console.log('MovieList: Filtering movies. Total movies:', movies.length, 'Search term:', searchTerm)
    
    // Filter movies based on search term
    if (!searchTerm.trim()) {
      setFilteredMovies(movies)
      console.log('MovieList: No search term, showing all movies:', movies.length)
    } else {
      const searchLower = searchTerm.toLowerCase()
      const filtered = movies.filter(movie => {
        // Search in all relevant fields
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
          movie.type,
          movie.dmcode
        ]
        
        return searchableFields.some(field => 
          field?.toLowerCase().includes(searchLower)
        )
      })
      setFilteredMovies(filtered)
      console.log('MovieList: Filtered movies:', filtered.length)
    }
    // Reset to first page when filtering
    setCurrentPage(1)
  }, [movies, searchTerm])

  const loadMovies = async () => {
    try {
      setIsLoading(true)
      console.log('MovieList: Starting to load movies...')
      
      if (!accessToken) {
        throw new Error('Access token is required')
      }
      
      console.log('MovieList: Calling movieApi.getMovies with token:', accessToken ? 'present' : 'missing')
      const moviesData = await movieApi.getMovies(accessToken)
      console.log('MovieList: Received movies data:', moviesData?.length || 0, 'movies')
      
      // Add some dummy data for testing if no movies found
      if (!moviesData || moviesData.length === 0) {
        console.log('MovieList: No movies found, adding dummy data for testing')
        const dummyMovies = [
          {
            id: '1',
            code: 'TEST-001',
            titleEn: 'Test Movie 1',
            titleJp: 'テスト映画1',
            actress: 'Test Actress',
            actors: 'Test Actor',
            director: 'Test Director',
            studio: 'Test Studio',
            series: 'Test Series',
            releaseDate: '2024-01-01',
            duration: '120',
            type: 'Cen',
            dmcode: 'TEST001',
            cover: '',
            gallery: '',
            label: 'Test Label',
            tags: 'Test, Movie'
          },
          {
            id: '2',
            code: 'TEST-002',
            titleEn: 'Test Movie 2',
            titleJp: 'テスト映画2',
            actress: 'Test Actress 2',
            actors: 'Test Actor 2',
            director: 'Test Director 2',
            studio: 'Test Studio 2',
            series: 'Test Series 2',
            releaseDate: '2024-01-02',
            duration: '90',
            type: 'Uncen',
            dmcode: 'TEST002',
            cover: '',
            gallery: '',
            label: 'Test Label 2',
            tags: 'Test, Movie, Uncen'
          }
        ]
        setMovies(dummyMovies)
        console.log('MovieList: Set dummy movies:', dummyMovies.length)
      } else {
        setMovies(moviesData)
      }
      setError('')
    } catch (error: any) {
      console.log('MovieList: Load movies error:', error)
      setError(`Gagal memuat movies: ${error.message || error}`)
    } finally {
      setIsLoading(false)
      console.log('MovieList: Loading completed')
    }
  }

  const handleAddMovie = () => {
    setLocalEditingMovie(null)
    setShowForm(true)
  }

  const handleEditMovie = (movie: Movie) => {
    setLocalEditingMovie(movie)
    setShowForm(true)
  }

  const handleDeleteMovie = async (movieId: string) => {
    try {
      await movieApi.deleteMovie(movieId, accessToken)
      await loadMovies()
    } catch (error: any) {
      console.log('Delete movie error:', error)
      setError(`Gagal menghapus movie: ${error.message || error}`)
    }
  }

  const handleFormSubmit = async (data: Movie | SCMovie, type: 'hc' | 'sc') => {
    setShowForm(false)
    setLocalEditingMovie(null)
    onClearEditing?.()
    // Only reload if it's an HC movie, as SC movies are handled separately
    if (type === 'hc') {
      await loadMovies()
    }
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setLocalEditingMovie(null)
    onClearEditing?.()
  }

  if (showForm) {
    return (
      <UnifiedMovieForm
        movie={localEditingMovie || undefined}
        onSave={handleFormSubmit}
        onCancel={handleFormCancel}
        accessToken={accessToken}
        defaultTab="hc"
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Movies ({filteredMovies.length})</CardTitle>
          <div className="flex gap-2">
            <Button onClick={handleAddMovie}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Movie
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative max-w-sm">
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
          <div className="text-sm text-muted-foreground">
            {filteredMovies.length} movie(s) found for "{searchTerm}"
          </div>
        )}
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-red-600 bg-red-50 p-3 rounded mb-4 border border-red-200">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 border rounded">
                <div className="w-16 h-20 bg-gray-200 rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm.trim() ? 'No movies found' : 'Belum ada movies'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm.trim() 
                ? 'Try adjusting your search terms.' 
                : 'Mulai dengan menambah movie pertama.'
              }
            </p>
            {!searchTerm.trim() && (
              <Button onClick={handleAddMovie}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Movie Pertama
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Cover</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Actress</TableHead>
                    <TableHead>Release</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead className="w-32 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    // Calculate pagination
                    const totalPages = Math.ceil(filteredMovies.length / itemsPerPage)
                    const startIndex = (currentPage - 1) * itemsPerPage
                    const endIndex = startIndex + itemsPerPage
                    const paginatedMovies = filteredMovies.slice(startIndex, endIndex)
                    
                    return paginatedMovies.map((movie) => {
                      const coverUrl = movie.cover && movie.dmcode 
                        ? processTemplate(movie.cover, { dmcode: movie.dmcode })
                        : movie.cover || ''

                      return (
                        <TableRow key={movie.id}>
                          <TableCell>
                            <div className="w-12 h-16 bg-gray-100 rounded overflow-hidden">
                              {coverUrl ? (
                                <CroppedImage
                                  src={coverUrl}
                                  alt={movie.titleEn || movie.titleJp || 'Movie cover'}
                                  className="w-full h-full object-cover"
                                  cropToRight={movie.cropCover}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-xs">
                                  No Cover
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-mono">
                              {movie.code || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <div className="font-medium truncate">
                                {movie.titleEn || movie.titleJp || 'Untitled'}
                              </div>
                              {movie.titleJp && movie.titleEn && movie.titleJp !== movie.titleEn && (
                                <div className="text-sm text-gray-600 truncate">
                                  {movie.titleJp}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate text-sm">
                              {movie.actress || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {movie.type || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">
                              {movie.createdAt ? new Date(movie.createdAt).toLocaleDateString('id-ID', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              }) : '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 justify-center">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleEditMovie(movie)}
                                className="h-8 px-2"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="h-8 px-2 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Hapus Movie</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Yakin ingin menghapus "{movie.titleEn || movie.titleJp}"? 
                                      Aksi ini tidak dapat dibatalkan.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteMovie(movie.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Hapus
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  })()}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {(() => {
              if (totalPages <= 1) return null
              
              return (
                <div className="flex flex-col items-center gap-2">
                  <div className="text-sm text-muted-foreground">
                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredMovies.length)} to {Math.min(currentPage * itemsPerPage, filteredMovies.length)} of {filteredMovies.length} movies
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            if (currentPage > 1) setCurrentPage(prev => prev - 1)
                          }}
                          className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      
                      {(() => {
                        const pages = []
                        const showEllipsis = totalPages > 7
                        
                        if (!showEllipsis) {
                          // Show all pages if <= 7 pages
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(
                              <PaginationItem key={i}>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    setCurrentPage(i)
                                  }}
                                  isActive={currentPage === i}
                                >
                                  {i}
                                </PaginationLink>
                              </PaginationItem>
                            )
                          }
                        } else {
                          // Show with ellipsis for > 7 pages
                          // Always show first page
                          pages.push(
                            <PaginationItem key={1}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault()
                                  setCurrentPage(1)
                                }}
                                isActive={currentPage === 1}
                              >
                                1
                              </PaginationLink>
                            </PaginationItem>
                          )
                          
                          // Show ellipsis if current page is > 3
                          if (currentPage > 3) {
                            pages.push(
                              <PaginationItem key="ellipsis1">
                                <PaginationEllipsis />
                              </PaginationItem>
                            )
                          }
                          
                          // Show pages around current page
                          const start = Math.max(2, currentPage - 1)
                          const end = Math.min(totalPages - 1, currentPage + 1)
                          
                          for (let i = start; i <= end; i++) {
                            pages.push(
                              <PaginationItem key={i}>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    setCurrentPage(i)
                                  }}
                                  isActive={currentPage === i}
                                >
                                  {i}
                                </PaginationLink>
                              </PaginationItem>
                            )
                          }
                          
                          // Show ellipsis if current page is < totalPages - 2
                          if (currentPage < totalPages - 2) {
                            pages.push(
                              <PaginationItem key="ellipsis2">
                                <PaginationEllipsis />
                              </PaginationItem>
                            )
                          }
                          
                          // Always show last page
                          if (totalPages > 1) {
                            pages.push(
                              <PaginationItem key={totalPages}>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    setCurrentPage(totalPages)
                                  }}
                                  isActive={currentPage === totalPages}
                                >
                                  {totalPages}
                                </PaginationLink>
                              </PaginationItem>
                            )
                          }
                        }
                        
                        return pages
                      })()}
                      
                      <PaginationItem>
                        <PaginationNext 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            if (currentPage < totalPages) setCurrentPage(prev => prev + 1)
                          }}
                          className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  <div className="text-xs text-muted-foreground">
                    Use ← → arrow keys to navigate pages
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}