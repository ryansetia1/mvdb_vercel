import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Label } from './ui/label'
import { Separator } from './ui/separator'
import { Search, Link, Trash2, ExternalLink, Plus, ArrowRightLeft } from 'lucide-react'
import { Input } from './ui/input'
import { toast } from 'sonner@2.0.3'
import { movieLinksApi, MovieLink } from '../utils/movieLinksApi'
import { movieApi, Movie } from '../utils/movieApi'
import { SearchableMovieSelector } from './SearchableMovieSelector'

interface MovieLinksManagerProps {
  accessToken: string
}

export function MovieLinksManager({ accessToken }: MovieLinksManagerProps) {
  const [movieLinks, setMovieLinks] = useState<MovieLink[]>([])
  const [movies, setMovies] = useState<Movie[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingLink, setIsAddingLink] = useState(false)
  
  // Add link form state
  const [primaryMovieId, setPrimaryMovieId] = useState<string>('')
  const [linkedMovieId, setLinkedMovieId] = useState<string>('')
  const [linkDescription, setLinkDescription] = useState<string>('')
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [accessToken])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [linksData, moviesData] = await Promise.all([
        movieLinksApi.getMovieLinks(accessToken),
        movieApi.getMovies(accessToken)
      ])
      setMovieLinks(linksData)
      setMovies(moviesData)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load movie links data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddLink = async () => {
    if (!primaryMovieId || !linkedMovieId) {
      toast.error('Please select both movies')
      return
    }

    if (primaryMovieId === linkedMovieId) {
      toast.error('Cannot link a movie to itself')
      return
    }

    try {
      await movieLinksApi.createMovieLink(accessToken, {
        primaryMovieId,
        linkedMovieId,
        description: linkDescription || 'Linked movies'
      })
      
      toast.success('Movie link created successfully')
      setIsAddingLink(false)
      setPrimaryMovieId('')
      setLinkedMovieId('')
      setLinkDescription('')
      loadData()
    } catch (error) {
      console.error('Failed to create movie link:', error)
      toast.error('Failed to create movie link')
    }
  }

  const handleDeleteLink = async (linkId: string) => {
    try {
      await movieLinksApi.deleteMovieLink(accessToken, linkId)
      toast.success('Movie link deleted successfully')
      loadData()
    } catch (error) {
      console.error('Failed to delete movie link:', error)
      toast.error('Failed to delete movie link')
    }
  }

  const getMovieTitle = (movieId: string): string => {
    const movie = movies.find(m => m.id === movieId)
    return movie ? (movie.titleEn || movie.titleJp || movie.code || 'Unknown Movie') : 'Unknown Movie'
  }

  const getMovieType = (movieId: string): string => {
    const movie = movies.find(m => m.id === movieId)
    return movie?.type || 'Unknown'
  }

  const getMovieCode = (movieId: string): string => {
    const movie = movies.find(m => m.id === movieId)
    return movie?.code || 'N/A'
  }

  // Filter functions
  const filteredLinks = movieLinks.filter(link => {
    const primaryTitle = getMovieTitle(link.primaryMovieId).toLowerCase()
    const linkedTitle = getMovieTitle(link.linkedMovieId).toLowerCase()
    const primaryCode = getMovieCode(link.primaryMovieId).toLowerCase()
    const linkedCode = getMovieCode(link.linkedMovieId).toLowerCase()
    
    const matchesSearch = searchTerm === '' || 
      primaryTitle.includes(searchTerm.toLowerCase()) ||
      linkedTitle.includes(searchTerm.toLowerCase()) ||
      primaryCode.includes(searchTerm.toLowerCase()) ||
      linkedCode.includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === 'all' || 
      getMovieType(link.primaryMovieId).toLowerCase() === typeFilter.toLowerCase() ||
      getMovieType(link.linkedMovieId).toLowerCase() === typeFilter.toLowerCase()

    return matchesSearch && matchesType
  })

  // Get unique movie types for filter
  const movieTypes = [...new Set(movies.map(m => m.type).filter(Boolean))]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold">Movie Links Manager</h3>
        <p className="text-muted-foreground">
          Kelola hubungan antar movie untuk memungkinkan quick switch di halaman detail
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search movies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {movieTypes.map(type => (
                <SelectItem key={type} value={type.toLowerCase()}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Add Link Button */}
        <Dialog open={isAddingLink} onOpenChange={setIsAddingLink}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Movie Link
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add Movie Link</DialogTitle>
              <DialogDescription>
                Link two movies to enable quick switching between them
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primary-movie">Primary Movie</Label>
                <SearchableMovieSelector
                  movies={movies}
                  value={primaryMovieId}
                  onValueChange={setPrimaryMovieId}
                  placeholder="Search and select primary movie"
                  isLoading={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linked-movie">Linked Movie</Label>
                <SearchableMovieSelector
                  movies={movies}
                  value={linkedMovieId}
                  onValueChange={setLinkedMovieId}
                  placeholder="Search and select linked movie"
                  excludeId={primaryMovieId}
                  isLoading={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="e.g., Censored and Uncensored versions"
                  value={linkDescription}
                  onChange={(e) => setLinkDescription(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddingLink(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddLink} 
                  disabled={!primaryMovieId || !linkedMovieId}
                >
                  <Link className="h-4 w-4 mr-2" />
                  Create Link
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{movieLinks.length}</div>
            <p className="text-xs text-muted-foreground">Total Links</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{filteredLinks.length}</div>
            <p className="text-xs text-muted-foreground">Filtered Results</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{movies.length}</div>
            <p className="text-xs text-muted-foreground">Total Movies</p>
          </CardContent>
        </Card>
      </div>

      {/* Links List */}
      <div className="space-y-4">
        {filteredLinks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ArrowRightLeft className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No movie links found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || typeFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Start by creating your first movie link'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredLinks.map(link => (
            <Card key={link.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    {/* Primary Movie */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          {getMovieType(link.primaryMovieId)}
                        </Badge>
                        <span className="font-mono text-xs text-muted-foreground flex-shrink-0">
                          {getMovieCode(link.primaryMovieId)}
                        </span>
                      </div>
                      <h4 className="font-medium truncate">{getMovieTitle(link.primaryMovieId)}</h4>
                    </div>

                    {/* Link Arrow */}
                    <div className="flex items-center flex-shrink-0">
                      <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
                    </div>

                    {/* Linked Movie */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          {getMovieType(link.linkedMovieId)}
                        </Badge>
                        <span className="font-mono text-xs text-muted-foreground flex-shrink-0">
                          {getMovieCode(link.linkedMovieId)}
                        </span>
                      </div>
                      <h4 className="font-medium truncate">{getMovieTitle(link.linkedMovieId)}</h4>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteLink(link.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Description */}
                {link.description && (
                  <>
                    <Separator className="my-3" />
                    <p className="text-sm text-muted-foreground">{link.description}</p>
                  </>
                )}

                {/* Created date */}
                <Separator className="my-3" />
                <p className="text-xs text-muted-foreground">
                  Created: {new Date(link.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}