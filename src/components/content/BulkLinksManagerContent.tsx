import React from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
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
  ChevronDown,
  Users,
  User,
  UserCheck,
  Info
} from 'lucide-react'
import { toast } from 'sonner';
import { ImageWithFallback } from '../figma/ImageWithFallback'
import { projectId, publicAnonKey } from '../../utils/supabase/info'
import { masterDataApi, MasterDataItem } from '../../utils/masterDataApi'
import { bulkAssignmentApi, BulkCastAssignmentRequest } from '../../utils/bulkAssignmentApi'

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

interface CastSelection {
  actresses: string[]
  actors: string[]
  directors: string[]
}

const LINK_TYPES = [
  { value: 'clinks', label: 'Censored', icon: Play, color: 'bg-blue-500' },
  { value: 'ulinks', label: 'Uncensored', icon: ExternalLink, color: 'bg-purple-500' },
  { value: 'slinks', label: 'Others', icon: Download, color: 'bg-green-500' }
]

export function BulkLinksManagerContent({ accessToken, onBack }: BulkLinksManagerContentProps) {
  const [movies, setMovies] = useState<Movie[]>([])
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([])
  const [selectedMovies, setSelectedMovies] = useState<Set<string>>(new Set());
  const [linkInputs, setLinkInputs] = useState<MovieLinkInput[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('')
  const [availableTypes, setAvailableTypes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateProgress, setUpdateProgress] = useState(0)

  // Cast assignment state
  // Ganti state castSelection global menjadi per-movie
  const [castSelections, setCastSelections] = useState<{ [movieId: string]: CastSelection }>({})

  // Fungsi untuk mengubah cast selection per-movie
  type CastType = 'actresses' | 'actors' | 'directors';
  const updateMovieCast = (movieId: string, type: CastType, names: string[]) => {
    setCastSelections(prev => ({
      ...prev,
      [movieId]: {
        ...(prev[movieId] || { actresses: [], actors: [], directors: [] }),
        [type]: names
      }
    }))
  }

  const addCastMember = (movieId: string, type: CastType, name: string) => {
    setCastSelections(prev => {
      const current = prev[movieId] || { actresses: [], actors: [], directors: [] };
      if (current[type].includes(name)) return prev;
      return {
        ...prev,
        [movieId]: {
          ...current,
          [type]: [...current[type], name]
        }
      }
    })
  }

  const removeCastMember = (movieId: string, type: CastType, name: string) => {
    setCastSelections(prev => {
      const current = prev[movieId] || { actresses: [], actors: [], directors: [] };
      return {
        ...prev,
        [movieId]: {
          ...current,
          [type]: current[type].filter((n: string) => n !== name)
        }
      }
    })
  }

  const clearMovieCast = (movieId: string) => {
    setCastSelections(prev => ({
      ...prev,
      [movieId]: { actresses: [], actors: [], directors: [] }
    }))
  }

  const [availableActresses, setAvailableActresses] = useState<MasterDataItem[]>([])
  const [availableActors, setAvailableActors] = useState<MasterDataItem[]>([])
  const [availableDirectors, setAvailableDirectors] = useState<MasterDataItem[]>([])
  const [isLoadingCast, setIsLoadingCast] = useState(false)
  const [castSearchQuery, setCastSearchQuery] = useState('')
  const [assignmentMode, setAssignmentMode] = useState<'replace' | 'append'>('append')

  // Load movies
  useEffect(() => {
    loadMovies()
  }, [])

  // Load cast data
  useEffect(() => {
    loadCastData()
  }, [accessToken])

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
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf/movies`, {
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

  const loadCastData = async () => {
    setIsLoadingCast(true)
    try {
      const [actressesData, actorsData, directorsData] = await Promise.all([
        masterDataApi.getByType('actress', accessToken),
        masterDataApi.getByType('actor', accessToken),
        masterDataApi.getByType('director', accessToken)
      ])
      
      setAvailableActresses(actressesData || [])
      setAvailableActors(actorsData || [])
      setAvailableDirectors(directorsData || [])
    } catch (error) {
      console.error('Error loading cast data:', error)
      toast.error('Failed to load cast data')
    } finally {
      setIsLoadingCast(false)
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

  // Cast management functions
  const clearCastSelection = () => {
    setCastSelections({})
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
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf/movies/${movieId}`, {
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

  const handleCastAssignment = async () => {
    if (selectedMovies.size === 0) {
      toast.error('Please select at least one movie')
      return
    }

    setIsUpdating(true)
    setUpdateProgress(0)

    try {
      const movieIds = Array.from(selectedMovies)
      let successCount = 0
      let errorCount = 0
      let processed = 0
      const total = movieIds.length

      for (const movieId of movieIds) {
        const cast = castSelections[movieId] || { actresses: [], actors: [], directors: [] }
        // Untuk setiap tipe cast, lakukan assign jika ada yang dipilih
        for (const type of ['actress', 'actors', 'director'] as const) {
          let members: string[] = []
          if (type === 'actress') members = cast.actresses
          if (type === 'actors') members = cast.actors
          if (type === 'director') members = cast.directors
          if (members.length === 0) continue
          try {
            const request: BulkCastAssignmentRequest = {
              movieIds: [movieId],
              castType: type as 'actress' | 'actors' | 'director',
              castMembers: members,
              assignmentMode
            }
            await bulkAssignmentApi.assignCast(request, accessToken)
            successCount++
          } catch (error) {
            errorCount++
          }
        }
        processed++
        setUpdateProgress((processed / total) * 100)
      }

      if (successCount > 0) {
        toast.success(`Successfully updated cast for ${successCount} movie(s)`)
        setCastSelections({})
        setSelectedMovies(new Set())
        loadMovies()
      }
      if (errorCount > 0) {
        toast.error(`Failed to update cast for ${errorCount} movie(s)`)
      }
    } catch (error) {
      toast.error('Failed to assign cast')
    } finally {
      setIsUpdating(false)
      setUpdateProgress(0)
    }
  }

  // Helper untuk inisialisasi cast dari movie jika castSelections[movieId] belum ada
  const getInitialCast = (movie: Movie): CastSelection => ({
    actresses: movie.actress ? movie.actress.split(',').map(s => s.trim()).filter(Boolean) : [],
    actors: (movie as any).actors ? (movie as any).actors.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
    directors: (movie as any).director ? (movie as any).director.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
  })

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
              Bulk Links & Cast Manager
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Add multiple link types and cast members to selected movies
            </p>
          </div>
        </div>
        
        {selectedMovies.size > 0 && (
          <div className="text-sm text-muted-foreground">
            {selectedMovies.size} selected
          </div>
        )}
      </div>

      {/* Movie Selection */}
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

      {/* Assignment Tabs */}
      <Tabs defaultValue="links" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="links">Assign Links</TabsTrigger>
          <TabsTrigger value="cast">Assign Cast</TabsTrigger>
        </TabsList>

        {/* Links Assignment Tab */}
        <TabsContent value="links">
          <div className="grid grid-cols-1 gap-3 h-[calc(100vh-20rem)]">
            {/* Link Configuration Panel */}
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
                                              className="text-xs h-7 w-32 flex-shrink-0"
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
        </TabsContent>

        {/* Cast Assignment Tab */}
        <TabsContent value="cast">
          <div className="space-y-4">
            {/* Assignment Mode */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Assignment Mode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={assignmentMode} onValueChange={(value: 'replace' | 'append') => setAssignmentMode(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="append" id="append-cast" />
                    <Label htmlFor="append-cast">Append to existing cast</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="replace" id="replace-cast" />
                    <Label htmlFor="replace-cast">Replace existing cast</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Per-movie Cast Panels */}
            <div className="space-y-4">
              {Array.from(selectedMovies).map((movieId: string) => {
                const movie = movies.find(m => m.id === movieId)
                let cast = castSelections[movieId]
                // Inisialisasi dari movie jika belum ada di castSelections
                if (!cast && movie) {
                  cast = getInitialCast(movie)
                  // Inisialisasi hanya sekali, jangan set state di render
                  if (!(movieId in castSelections)) {
                    setTimeout(() => setCastSelections(prev => ({ ...prev, [movieId]: cast! })), 0);
                  }
                }
                return (
                  <Card key={movieId} className="border-2 border-primary">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        {movie?.titleEn || movie?.titleJp || 'Untitled'}
                        <span className="text-xs text-muted-foreground">{movie?.code}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Actresses */}
                      <div>
                        <Label>Actresses ({cast.actresses.length})</Label>
                        <Input
                          placeholder="Search actresses..."
                          value={castSearchQuery}
                          onChange={(e) => setCastSearchQuery(e.target.value)}
                          className="mb-2"
                        />
                        {castSearchQuery && (
                          <div className="border rounded p-2 mb-2">
                            {availableActresses
                              .filter(actress => String(actress.name || '').toLowerCase().includes(castSearchQuery.toLowerCase()))
                              .slice(0, 8)
                              .map((actress) => (
                              <Button
                                key={actress.id}
                                variant="ghost"
                                className="w-full justify-start h-auto p-2 mb-1"
                                onClick={() => addCastMember(movieId, 'actresses', String(actress.name || ''))}
                                disabled={cast.actresses.includes(String(actress.name || ''))}
                              >
                                <div className="flex items-center gap-2">
                                  <Users className="h-3 w-3" />
                                  <span className="text-sm">{String(actress.name || '')}</span>
                                  {cast.actresses.includes(String(actress.name || '')) && (
                                    <Check className="h-3 w-3 text-green-600 ml-auto" />
                                  )}
                                </div>
                              </Button>
                            ))}
                          </div>
                        )}
                        {cast.actresses.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {cast.actresses.map((name: string) => (
                              <Badge key={name} variant="default" className="text-xs flex items-center gap-1">
                                {name}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-3 w-3 p-0 hover:bg-transparent"
                                  onClick={() => removeCastMember(movieId, 'actresses', name)}
                                >
                                  <X className="h-2 w-2" />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Actors */}
                      <div>
                        <Label>Actors ({cast.actors.length})</Label>
                        <Input
                          placeholder="Search actors..."
                          value={castSearchQuery}
                          onChange={(e) => setCastSearchQuery(e.target.value)}
                          className="mb-2"
                        />
                        {castSearchQuery && (
                          <div className="border rounded p-2 mb-2">
                            {availableActors
                              .filter(actor => String(actor.name || '').toLowerCase().includes(castSearchQuery.toLowerCase()))
                              .slice(0, 8)
                              .map((actor) => (
                              <Button
                                key={actor.id}
                                variant="ghost"
                                className="w-full justify-start h-auto p-2 mb-1"
                                onClick={() => addCastMember(movieId, 'actors', String(actor.name || ''))}
                                disabled={cast.actors.includes(String(actor.name || ''))}
                              >
                                <div className="flex items-center gap-2">
                                  <User className="h-3 w-3" />
                                  <span className="text-sm">{String(actor.name || '')}</span>
                                  {cast.actors.includes(String(actor.name || '')) && (
                                    <Check className="h-3 w-3 text-green-600 ml-auto" />
                                  )}
                                </div>
                              </Button>
                            ))}
                          </div>
                        )}
                        {cast.actors.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {cast.actors.map((name: string) => (
                              <Badge key={name} variant="default" className="text-xs flex items-center gap-1">
                                {name}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-3 w-3 p-0 hover:bg-transparent"
                                  onClick={() => removeCastMember(movieId, 'actors', name)}
                                >
                                  <X className="h-2 w-2" />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Directors */}
                      <div>
                        <Label>Directors ({cast.directors.length})</Label>
                        <Input
                          placeholder="Search directors..."
                          value={castSearchQuery}
                          onChange={(e) => setCastSearchQuery(e.target.value)}
                          className="mb-2"
                        />
                        {castSearchQuery && (
                          <div className="border rounded p-2 mb-2">
                            {availableDirectors
                              .filter(director => String(director.name || '').toLowerCase().includes(castSearchQuery.toLowerCase()))
                              .slice(0, 8)
                              .map((director) => (
                              <Button
                                key={director.id}
                                variant="ghost"
                                className="w-full justify-start h-auto p-2 mb-1"
                                onClick={() => addCastMember(movieId, 'directors', String(director.name || ''))}
                                disabled={cast.directors.includes(String(director.name || ''))}
                              >
                                <div className="flex items-center gap-2">
                                  <UserCheck className="h-3 w-3" />
                                  <span className="text-sm">{String(director.name || '')}</span>
                                  {cast.directors.includes(String(director.name || '')) && (
                                    <Check className="h-3 w-3 text-green-600 ml-auto" />
                                  )}
                                </div>
                              </Button>
                            ))}
                          </div>
                        )}
                        {cast.directors.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {cast.directors.map((name: string) => (
                              <Badge key={name} variant="default" className="text-xs flex items-center gap-1">
                                {name}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-3 w-3 p-0 hover:bg-transparent"
                                  onClick={() => removeCastMember(movieId, 'directors', name)}
                                >
                                  <X className="h-2 w-2" />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Clear Cast Button */}
                      <div className="col-span-3 mt-2">
                        <Button variant="outline" size="sm" onClick={() => clearMovieCast(movieId)}>
                          <X className="h-4 w-4 mr-1" /> Clear Cast for this Movie
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Cast Assignment Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Update Progress */}
                  {isUpdating && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Assigning cast...</span>
                      </div>
                      <Progress value={updateProgress} />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCastAssignment}
                      disabled={isUpdating || selectedMovies.size === 0}
                      className="flex-1"
                      size="sm"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Users className="h-4 w-4 mr-2" />
                      )}
                      Update Cast for {selectedMovies.size} Movie(s)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}