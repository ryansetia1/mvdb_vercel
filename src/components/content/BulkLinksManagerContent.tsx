import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Checkbox } from '../ui/checkbox'
import { Separator } from '../ui/separator'
import { Progress } from '../ui/progress'
import { ScrollArea } from '../ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { 
  Link as LinkIcon, 
  Plus, 
  Check, 
  X, 
  Loader2, 
  Search,
  ArrowLeft,
  ExternalLink,
  Download,
  Play,
  ChevronDown
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { ImageWithFallback } from '../figma/ImageWithFallback'
import { projectId, publicAnonKey } from '../../utils/supabase/info'

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
  actress?: string
}

interface BulkLinksManagerContentProps {
  accessToken: string
  onBack: () => void
}

interface MovieLinkInput {
  id: string
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

export function BulkLinksManagerContent({ accessToken, onBack }: BulkLinksManagerContentProps) {
  const [movies, setMovies] = useState<Movie[]>([])
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([])
  const [selectedMovies, setSelectedMovies] = useState<Set<string>>(new Set())
  const [linkInputs, setLinkInputs] = useState<MovieLinkInput[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('')
  const [availableTypes, setAvailableTypes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateProgress, setUpdateProgress] = useState(0)

  // Load movies
  useEffect(() => {
    loadMovies()
  }, [])

  // Extract available movie types when movies load
  useEffect(() => {
    const types = Array.from(new Set(
      movies
        .map(movie => movie.type)
        .filter(type => type && type.trim())
        .sort()
    ))
    setAvailableTypes(types)
  }, [movies])

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
        // Keep existing inputs for this movie and link type
        const existingInputsForType = linkInputs.filter(input => 
          input.movieId === movieId && input.linkType === linkType.value
        )
        
        if (existingInputsForType.length > 0) {
          // Keep existing inputs
          newInputs.push(...existingInputsForType)
        } else {
          // Create new default input
          newInputs.push({
            id: `${movieId}-${linkType.value}-${Date.now()}-${Math.random()}`,
            movieId,
            linkType: linkType.value,
            title: '',
            url: ''
          })
        }
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

  const handleLinkInputChange = (inputId: string, field: 'title' | 'url', value: string) => {
    setLinkInputs(prev => 
      prev.map(input => 
        input.id === inputId
          ? { ...input, [field]: value }
          : input
      )
    )
  }

  const addNewLinkInput = (movieId: string, linkType: string) => {
    const newInput: MovieLinkInput = {
      id: `${movieId}-${linkType}-${Date.now()}-${Math.random()}`,
      movieId,
      linkType,
      title: '',
      url: ''
    }
    setLinkInputs(prev => [...prev, newInput])
  }

  const removeLinkInput = (inputId: string) => {
    setLinkInputs(prev => {
      // Find the input to remove
      const inputToRemove = prev.find(input => input.id === inputId)
      if (!inputToRemove) return prev
      
      // Check if this is the last input of this type for this movie
      const sameTypeInputs = prev.filter(input => 
        input.movieId === inputToRemove.movieId && input.linkType === inputToRemove.linkType
      )
      
      if (sameTypeInputs.length <= 1) return prev // Don't remove if it's the last one
      
      return prev.filter(input => input.id !== inputId)
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
    <div className="w-full max-w-[1200px] mx-auto p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Bulk Links Manager
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Add multiple link types to selected movies
            </p>
          </div>
        </div>
        
        {selectedMovies.size > 0 && (
          <div className="text-sm text-muted-foreground">
            {selectedMovies.size} selected
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-[calc(100vh-10rem)]">
        {/* Left Panel - Movie Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4" />
              Select Movies ({selectedMovies.size} selected)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Filters */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Search movies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="w-32">
                <Select
                  value={filterType}
                  onValueChange={(value) => setFilterType(value === 'all' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {availableTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={handleSelectAll}
                size="sm"
              >
                {filteredMovies.length > 0 && filteredMovies.every(movie => selectedMovies.has(movie.id)) ? 'None' : 'All'}
              </Button>
            </div>

            {/* Movie List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Loading...
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto border rounded p-3">
                <div className="space-y-2">
                  {filteredMovies.map((movie) => (
                    <div key={movie.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
                      <Checkbox
                        checked={selectedMovies.has(movie.id)}
                        onCheckedChange={(checked) => handleMovieSelection(movie.id, checked as boolean)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-sm">
                          {movie.titleEn || movie.titleJp || 'Untitled'}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {movie.code && <span className="mr-2">{movie.code}</span>}
                          {movie.type && <Badge variant="secondary" className="mr-1 text-xs">{movie.type}</Badge>}
                          {movie.actress && <span>{movie.actress}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Panel - Link Configuration */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="text-base flex items-center gap-2">
              Configure Links
              {selectedMovies.size > 0 && (
                <Badge variant="outline" className="text-xs">{selectedMovies.size} movies</Badge>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 min-h-0 p-3 flex flex-col">
            {selectedMovies.size > 0 ? (
              <div className="flex flex-col h-full">
                <div className="flex-1 min-h-0">
                  <ScrollArea className="h-full">
                    <div className="space-y-2 pr-2">
                      {Array.from(selectedMovies).map((movieId) => {
                        const movie = movies.find(m => m.id === movieId)
                        const movieInputs = linkInputs.filter(input => input.movieId === movieId)
                        
                        return (
                          <Card key={movieId} className="p-2 border">
                            <div className="space-y-2 min-w-0">
                              {/* Movie Header */}
                              <div className="pb-1 border-b">
                                <div className="font-medium truncate text-sm">
                                  {movie?.titleEn || movie?.titleJp || 'Untitled'}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {movie?.code && <span className="mr-2">{movie.code}</span>}
                                  {movie?.type && <Badge variant="secondary" className="mr-1 text-xs">{movie.type}</Badge>}
                                </div>
                              </div>
                              
                              {/* Link Types */}
                              <div className="space-y-2">
                                {LINK_TYPES.map((linkType) => {
                                  const Icon = linkType.icon
                                  const typeInputs = movieInputs.filter(input => input.linkType === linkType.value)
                                  
                                  return (
                                    <div key={linkType.value} className="space-y-1">
                                      <div className="flex items-center gap-1">
                                        <div className={`w-2 h-2 rounded-full ${linkType.color} flex-shrink-0`} />
                                        <Icon className="h-3 w-3 flex-shrink-0" />
                                        <Label className="text-xs font-medium flex-1 min-w-0 truncate">{linkType.label}</Label>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => addNewLinkInput(movieId, linkType.value)}
                                          className="h-4 w-4 p-0 flex-shrink-0"
                                        >
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      
                                      <div className="space-y-1 ml-3">
                                        {typeInputs.map((input, index) => (
                                          <div key={input.id} className="flex gap-1 min-w-0">
                                            <Input
                                              placeholder="Title"
                                              value={input.title}
                                              onChange={(e) => 
                                                handleLinkInputChange(input.id, 'title', e.target.value)
                                              }
                                              className="text-xs h-7 w-16 flex-shrink-0"
                                            />
                                            <Input
                                              placeholder="URL"
                                              value={input.url}
                                              onChange={(e) => 
                                                handleLinkInputChange(input.id, 'url', e.target.value)
                                              }
                                              className="text-xs h-7 flex-1 min-w-0"
                                            />
                                            {typeInputs.length > 1 && (
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeLinkInput(input.id)}
                                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
                                              >
                                                <X className="h-3 w-3" />
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
                </div>

                {/* Update Progress */}
                {isUpdating && (
                  <div className="space-y-2 mt-2 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Updating...</span>
                    </div>
                    <Progress value={updateProgress} />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 mt-2 border-t flex-shrink-0">
                  <Button
                    onClick={handleBulkUpdate}
                    disabled={isUpdating || linkInputs.every(input => !input.title.trim() || !input.url.trim())}
                    className="flex-1"
                    size="sm"
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Update {selectedMovies.size}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedMovies(new Set())
                      setLinkInputs([])
                    }}
                    disabled={isUpdating}
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <LinkIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <h3 className="font-medium mb-1 text-sm">No Movies Selected</h3>
                  <p className="text-xs">
                    Select movies from the left to add links.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}