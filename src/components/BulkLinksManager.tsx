import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Checkbox } from './ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Separator } from './ui/separator'
import { Progress } from './ui/progress'
import { ScrollArea } from './ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog'
import { 
  Link as LinkIcon, 
  Plus, 
  Check, 
  X, 
  Loader2, 
  Search,
  Filter,
  ExternalLink,
  Download,
  Play
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface Movie {
  id: string
  titleEn: string
  titleJp?: string
  code?: string
  type?: string
  cover?: string
  clinks?: string
  ulinks?: string
  slinks?: string
}

interface BulkLinksManagerProps {
  accessToken: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

interface MovieLinkInput {
  movieId: string
  linkType: string
  title: string
  url: string
}

const LINK_TYPES = [
  { value: 'clinks', label: 'Censored', icon: Play, color: 'bg-blue-500' },
  { value: 'ulinks', label: 'Uncensored', icon: ExternalLink, color: 'bg-purple-500' },
  { value: 'slinks', label: 'Others', icon: Download, color: 'bg-green-500' }
]

export function BulkLinksManager({ accessToken, isOpen, onOpenChange }: BulkLinksManagerProps) {
  const [movies, setMovies] = useState<Movie[]>([])
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([])
  const [selectedMovies, setSelectedMovies] = useState<Set<string>>(new Set())
  const [linkInputs, setLinkInputs] = useState<MovieLinkInput[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateProgress, setUpdateProgress] = useState(0)

  // Load movies
  useEffect(() => {
    if (isOpen) {
      loadMovies()
    }
  }, [isOpen])

  // Filter movies based on search and type
  useEffect(() => {
    let filtered = movies
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(movie => 
        movie.titleEn?.toLowerCase().includes(query) ||
        movie.titleJp?.toLowerCase().includes(query) ||
        movie.code?.toLowerCase().includes(query)
      )
    }
    
    if (filterType) {
      filtered = filtered.filter(movie => 
        movie.type?.toLowerCase().includes(filterType.toLowerCase())
      )
    }
    
    setFilteredMovies(filtered)
  }, [movies, searchQuery, filterType])

  // Update link inputs when selection changes - create inputs for all link types
  useEffect(() => {
    const newInputs: MovieLinkInput[] = []
    
    Array.from(selectedMovies).forEach(movieId => {
      LINK_TYPES.forEach(linkType => {
        const existingInput = linkInputs.find(input => 
          input.movieId === movieId && input.linkType === linkType.value
        )
        
        newInputs.push({
          movieId,
          linkType: linkType.value,
          title: existingInput?.title || '',
          url: existingInput?.url || ''
        })
      })
    })
    
    setLinkInputs(newInputs)
  }, [selectedMovies, movies])

  const loadMovies = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f3064b20/movies`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load movies')
      }

      const data = await response.json()
      setMovies(data.movies || [])
    } catch (error) {
      console.error('Error loading movies:', error)
      toast.error('Failed to load movies')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMovieSelection = (movieId: string, checked: boolean) => {
    const newSelection = new Set(selectedMovies)
    if (checked) {
      newSelection.add(movieId)
    } else {
      newSelection.delete(movieId)
    }
    setSelectedMovies(newSelection)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allMovieIds = new Set(filteredMovies.map(movie => movie.id))
      setSelectedMovies(allMovieIds)
    } else {
      setSelectedMovies(new Set())
    }
  }

  const handleLinkInputChange = (movieId: string, linkType: string, field: 'title' | 'url', value: string) => {
    setLinkInputs(prev => 
      prev.map(input => 
        input.movieId === movieId && input.linkType === linkType
          ? { ...input, [field]: value }
          : input
      )
    )
  }

  const addNewLinkInput = (movieId: string, linkType: string) => {
    const newInput: MovieLinkInput = {
      movieId,
      linkType,
      title: '',
      url: ''
    }
    setLinkInputs(prev => [...prev, newInput])
  }

  const removeLinkInput = (movieId: string, linkType: string, index: number) => {
    setLinkInputs(prev => {
      const movieInputs = prev.filter(input => 
        input.movieId === movieId && input.linkType === linkType
      )
      if (movieInputs.length <= 1) return prev // Don't remove if it's the last one
      
      return prev.filter((input, i) => {
        if (input.movieId === movieId && input.linkType === linkType) {
          const movieTypeInputs = prev.filter(inp => 
            inp.movieId === movieId && inp.linkType === linkType
          )
          const inputIndex = movieTypeInputs.findIndex(inp => inp === input)
          return inputIndex !== index
        }
        return true
      })
    })
  }

  const handleBulkUpdate = async () => {
    const validInputs = linkInputs.filter(input => 
      input.title.trim() && input.url.trim()
    )

    if (validInputs.length === 0) {
      toast.error('Please fill in at least one link')
      return
    }

    setIsUpdating(true)
    setUpdateProgress(0)

    try {
      // Group inputs by movie and link type
      const movieUpdates: Record<string, Record<string, MovieLinkInput[]>> = {}
      
      validInputs.forEach(input => {
        if (!movieUpdates[input.movieId]) {
          movieUpdates[input.movieId] = {}
        }
        if (!movieUpdates[input.movieId][input.linkType]) {
          movieUpdates[input.movieId][input.linkType] = []
        }
        movieUpdates[input.movieId][input.linkType].push(input)
      })

      let successCount = 0
      let errorCount = 0
      const totalUpdates = Object.keys(movieUpdates).length
      let processedUpdates = 0

      for (const [movieId, linkTypeUpdates] of Object.entries(movieUpdates)) {
        try {
          // Get current movie data
          const currentMovie = movies.find(m => m.id === movieId)
          if (!currentMovie) continue

          const updateData: Record<string, string> = {}

          // Process each link type for this movie
          for (const [linkType, inputs] of Object.entries(linkTypeUpdates)) {
            // Parse existing links using the same format as LinkManager (#-separated)
            const existingLinksStr = currentMovie[linkType as keyof Movie] as string || ''
            const existingLinks = existingLinksStr ? 
              existingLinksStr.split(',').map(link => {
                const parts = link.trim().split('#')
                return { title: parts[0]?.trim() || '', url: parts[1]?.trim() || '' }
              }).filter(link => link.title && link.url) : []

            // Add new links
            const newLinks = inputs.map(input => ({ title: input.title, url: input.url }))
            const updatedLinks = [...existingLinks, ...newLinks]
            const linksString = updatedLinks.map(link => `${link.title}#${link.url}`).join(', ')
            
            updateData[linkType] = linksString
          }

          // Update movie with all link types at once
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f3064b20/movies/${movieId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
          })

          if (response.ok) {
            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          console.error(`Error updating movie ${movieId}:`, error)
          errorCount++
        }

        processedUpdates++
        setUpdateProgress((processedUpdates / totalUpdates) * 100)
      }

      if (successCount > 0) {
        toast.success(`Successfully updated ${successCount} movie(s) with ${validInputs.length} link(s)`)
        // Reset form
        setSelectedMovies(new Set())
        setLinkInputs([])
        // Reload movies to get updated data
        loadMovies()
      }
      
      if (errorCount > 0) {
        toast.error(`Failed to update ${errorCount} movie(s)`)
      }

    } catch (error) {
      console.error('Bulk update error:', error)
      toast.error('Failed to update movies')
    } finally {
      setIsUpdating(false)
      setUpdateProgress(0)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Bulk Links Manager
          </DialogTitle>
          <DialogDescription>
            Add multiple link types (Censored, Uncensored, Others) to selected movies simultaneously. Select movies from the left panel and configure links on the right.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(95vh-8rem)]">
          {/* Left Panel - Movie Selection */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Select Movies</CardTitle>
                
                {/* Search and Filter */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by title or code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Input
                    placeholder="Filter by type..."
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  />
                </div>

                {/* Select All */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="selectAll"
                    checked={filteredMovies.length > 0 && filteredMovies.every(movie => selectedMovies.has(movie.id))}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="selectAll" className="text-sm">
                    Select All ({filteredMovies.length} movies)
                  </Label>
                </div>
              </CardHeader>
              
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading movies...
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {filteredMovies.map((movie) => (
                        <div
                          key={movie.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                            selectedMovies.has(movie.id) 
                              ? 'bg-primary/5 border-primary' 
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <Checkbox
                            checked={selectedMovies.has(movie.id)}
                            onCheckedChange={(checked) => 
                              handleMovieSelection(movie.id, checked as boolean)
                            }
                          />
                          
                          <ImageWithFallback
                            src={movie.cover || ''}
                            alt={movie.titleEn}
                            className="w-12 h-16 object-cover rounded"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{movie.titleEn}</h4>
                            {movie.code && (
                              <p className="text-sm text-muted-foreground">{movie.code}</p>
                            )}
                            {movie.type && (
                              <Badge variant="secondary" className="text-xs">
                                {movie.type}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Link Configuration */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Configure Multiple Link Types
                  {selectedMovies.size > 0 && (
                    <Badge variant="outline">{selectedMovies.size} movies selected</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Link Inputs for Selected Movies */}
                {selectedMovies.size > 0 ? (
                  <div className="space-y-4">
                    <ScrollArea className="h-[calc(95vh-16rem)]">
                      <div className="space-y-6 pr-2">
                        {Array.from(selectedMovies).map((movieId) => {
                          const movie = movies.find(m => m.id === movieId)
                          const movieInputs = linkInputs.filter(input => input.movieId === movieId)
                          
                          return (
                            <Card key={movieId} className="p-4">
                              <div className="space-y-4">
                                {/* Movie Header */}
                                <div className="flex items-center gap-3 pb-2 border-b">
                                  <ImageWithFallback
                                    src={movie?.cover || ''}
                                    alt={movie?.titleEn || ''}
                                    className="w-10 h-14 object-cover rounded"
                                  />
                                  <div className="flex-1">
                                    <h4 className="font-medium text-sm">
                                      {movie?.titleEn}
                                    </h4>
                                    {movie?.code && (
                                      <p className="text-xs text-muted-foreground">
                                        {movie.code}
                                      </p>
                                    )}
                                    {movie?.type && (
                                      <Badge variant="secondary" className="text-xs mt-1">
                                        {movie.type}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Link Types */}
                                <div className="grid grid-cols-1 gap-4">
                                  {LINK_TYPES.map((linkType) => {
                                    const Icon = linkType.icon
                                    const typeInputs = movieInputs.filter(input => input.linkType === linkType.value)
                                    
                                    return (
                                      <div key={linkType.value} className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <div className={`w-3 h-3 rounded-full ${linkType.color}`} />
                                          <Icon className="h-4 w-4" />
                                          <Label className="text-sm font-medium">{linkType.label}</Label>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => addNewLinkInput(movieId, linkType.value)}
                                            className="h-6 w-6 p-0"
                                          >
                                            <Plus className="h-3 w-3" />
                                          </Button>
                                        </div>
                                        
                                        <div className="space-y-2 ml-5">
                                          {typeInputs.map((input, index) => (
                                            <div key={`${input.movieId}-${input.linkType}-${index}`} className="flex gap-2">
                                              <Input
                                                placeholder="Link title"
                                                value={input.title}
                                                onChange={(e) => 
                                                  handleLinkInputChange(input.movieId, input.linkType, 'title', e.target.value)
                                                }
                                                className="text-sm flex-1"
                                              />
                                              <Input
                                                placeholder="URL (https://...)"
                                                value={input.url}
                                                onChange={(e) => 
                                                  handleLinkInputChange(input.movieId, input.linkType, 'url', e.target.value)
                                                }
                                                className="text-sm flex-1"
                                              />
                                              {typeInputs.length > 1 && (
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => removeLinkInput(movieId, linkType.value, index)}
                                                  className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                                                >
                                                  <X className="h-4 w-4" />
                                                </Button>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                    </ScrollArea>

                    {/* Update Progress */}
                    {isUpdating && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Updating movies...</span>
                        </div>
                        <Progress value={updateProgress} />
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        onClick={handleBulkUpdate}
                        disabled={isUpdating || linkInputs.every(input => !input.title.trim() || !input.url.trim())}
                        className="flex-1"
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Check className="h-4 w-4 mr-2" />
                        )}
                        Update {selectedMovies.size} Movies with Links
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedMovies(new Set())
                          setLinkInputs([])
                        }}
                        disabled={isUpdating}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear All
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <LinkIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="font-medium mb-2">No Movies Selected</h3>
                    <p className="text-sm">
                      Select movies from the left panel to start adding multiple link types (Censored, Uncensored, Others) to each movie.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

