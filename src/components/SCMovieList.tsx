import React, { useState, useEffect, useCallback } from 'react'
import { useGlobalKeyboardPagination } from '../hooks/useGlobalKeyboardPagination'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Plus, Search, Edit, Trash2, PlayCircle } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './ui/pagination'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { SCMovieForm } from './SCMovieForm'
import { CroppedImage } from './CroppedImage'

import { SCMovie, scMovieApi } from '../utils/scMovieApi'

interface SCMovieListProps {
  accessToken: string
  editingSCMovie?: SCMovie | null
  onClearEditing?: () => void
}

export function SCMovieList({ accessToken, editingSCMovie, onClearEditing }: SCMovieListProps) {
  const [scMovies, setScMovies] = useState<SCMovie[]>([])
  const [filteredMovies, setFilteredMovies] = useState<SCMovie[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [localEditingMovie, setLocalEditingMovie] = useState<SCMovie | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  useEffect(() => {
    loadSCMovies()
  }, [])

  // Handle external editing movie
  useEffect(() => {
    if (editingSCMovie) {
      setLocalEditingMovie(editingSCMovie)
      setShowForm(true)
    }
  }, [editingSCMovie])

  useEffect(() => {
    // Filter movies based on search term
    if (!searchTerm.trim()) {
      setFilteredMovies(scMovies)
    } else {
      const searchLower = searchTerm.toLowerCase()
      const filtered = scMovies.filter(movie => {
        // Search in all relevant fields
        const searchableFields = [
          movie.titleEn,
          movie.titleJp,
          movie.cast,
          movie.hcCode,
          movie.scType,
          movie.releaseDate
        ]
        
        return searchableFields.some(field => 
          field?.toLowerCase().includes(searchLower)
        )
      })
      setFilteredMovies(filtered)
    }
    // Reset to first page when filtering
    setCurrentPage(1)
  }, [searchTerm, scMovies])

  const loadSCMovies = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      if (!accessToken) {
        throw new Error('Access token is required')
      }
      
      const moviesData = await scMovieApi.getSCMovies(accessToken)
      setScMovies(moviesData)
      setError('')
    } catch (error: any) {
      console.log('Load SC movies error:', error)
      setError(`Gagal memuat SC movies: ${error.message || error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddMovie = () => {
    setLocalEditingMovie(null)
    setShowForm(true)
  }

  const handleEditMovie = (movie: SCMovie) => {
    setLocalEditingMovie(movie)
    setShowForm(true)

    if (onClearEditing) {
      onClearEditing()
    }
  }

  const handleDeleteMovie = async (movie: SCMovie) => {
    if (!movie.id) return

    try {
      await scMovieApi.deleteSCMovie(movie.id, accessToken)
      await loadSCMovies()
      setError('')
    } catch (error: any) {
      console.log('Delete SC movie error:', error)
      setError(`Gagal menghapus SC movie: ${error.message || error}`)
    }
  }

  const handleFormSubmit = async (data: SCMovie) => {
    setShowForm(false)
    setLocalEditingMovie(null)
    onClearEditing?.()
    await loadSCMovies()
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setLocalEditingMovie(null)
    onClearEditing?.()
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentMovies = filteredMovies.slice(startIndex, endIndex)

  // Keyboard navigation for pagination using global hook
  useGlobalKeyboardPagination(
    currentPage,
    totalPages,
    (page: number) => setCurrentPage(page),
    'sc-movie-list',
    !showForm // Disable when form is open
  )

  if (showForm) {
    return (
      <SCMovieForm
        scMovie={localEditingMovie || undefined}
        onSave={handleFormSubmit}
        onCancel={handleFormCancel}
        accessToken={accessToken}
      />
    )
  }

  // Pagination component
  const PaginationComponent = () => {
    if (totalPages <= 1) return null

    const pages: React.ReactNode[] = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => setCurrentPage(i)}
              isActive={currentPage === i}
              size="sm"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        )
      }
    } else {
      // Show first page
      pages.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => setCurrentPage(1)}
            isActive={currentPage === 1}
            size="sm"
          >
            1
          </PaginationLink>
        </PaginationItem>
      )

      // Show ellipsis if needed
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
        if (i !== 1 && i !== totalPages) {
          pages.push(
            <PaginationItem key={i}>
              <PaginationLink
                onClick={() => setCurrentPage(i)}
                isActive={currentPage === i}
                size="sm"
              >
                {i}
              </PaginationLink>
            </PaginationItem>
          )
        }
      }

      // Show ellipsis if needed
      if (currentPage < totalPages - 2) {
        pages.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        )
      }

      // Show last page
      if (totalPages > 1) {
        pages.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              onClick={() => setCurrentPage(totalPages)}
              isActive={currentPage === totalPages}
              size="sm"
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        )
      }
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              size="sm"
            />
          </PaginationItem>
          {pages}
          <PaginationItem>
            <PaginationNext
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              size="sm"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>SC Movies ({filteredMovies.length})</CardTitle>
          <div className="flex gap-2">
            <Button onClick={handleAddMovie}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah SC Movie
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search SC movies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Search Results Info */}
        {searchTerm.trim() && (
          <div className="text-sm text-muted-foreground">
            {filteredMovies.length} SC movie(s) found for "{searchTerm}"
          </div>
        )}
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-muted-foreground">Loading SC movies...</p>
          </div>
        ) : (
          <>
            {currentMovies.length === 0 ? (
              <div className="text-center py-8">
                <PlayCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No SC movies found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm.trim() 
                    ? `No SC movies match your search "${searchTerm}"`
                    : 'Get started by adding your first SC movie.'
                  }
                </p>
                {!searchTerm.trim() && (
                  <div className="mt-6">
                    <Button onClick={handleAddMovie}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah SC Movie
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Cover</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Cast</TableHead>
                        <TableHead>Release</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>HC Code</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentMovies.map((movie) => (
                        <TableRow key={movie.id}>
                          <TableCell>
                            <div className="w-16 h-20 relative">
                              <CroppedImage
                                src={movie.cover}
                                alt={movie.titleEn}
                                className="w-full h-full object-cover rounded"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{movie.titleEn}</div>
                              {movie.titleJp && (
                                <div className="text-sm text-muted-foreground">{movie.titleJp}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {movie.cast || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {movie.scType === 'regular_censorship' ? 'Regular Censorship' : 'Real Cut'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {movie.hcCode || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditMovie(movie)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete SC Movie</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{movie.titleEn}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteMovie(movie)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="mt-6">
                  <PaginationComponent />
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
