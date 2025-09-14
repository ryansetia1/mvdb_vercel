import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Checkbox } from './ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { CardDescription } from './ui/card'
import { Separator } from './ui/separator'
import { toast } from 'sonner@2.0.3'
import { movieApi, Movie } from '../utils/movieApi'
import { masterDataApi, MasterDataItem } from '../utils/masterDataApi'
import { bulkAssignmentApi, BulkMetadataAssignmentRequest, BulkCastAssignmentRequest, BulkTemplateAssignmentRequest } from '../utils/bulkAssignmentApi'
import { fetchTemplateGroups, CoverTemplateGroup } from './coverTemplateManager/api'
import { BulkMovieActorAssigner } from './BulkMovieActorAssigner'
import { BulkMovieActressAssigner } from './BulkMovieActressAssigner'
import { BulkMovieDirectorAssigner } from './BulkMovieDirectorAssigner'
import { SimpleBulkTagAssigner } from './SimpleBulkTagAssigner'
import { projectId } from '../utils/supabase/info'
import { Users, Tag, Building, Play, Bookmark, User, UserCheck, CheckCircle, Search, Filter, Plus, AlertTriangle, Info, Image } from 'lucide-react'

interface BulkAssignmentManagerProps {
  accessToken: string
}

export function BulkAssignmentManager({ accessToken }: BulkAssignmentManagerProps) {
  const [movies, setMovies] = useState<Movie[]>([])
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([])
  const [selectedMovies, setSelectedMovies] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  // Debug token on component mount
  useEffect(() => {
    console.log('BulkAssignmentManager mounted with token:', {
      hasToken: !!accessToken,
      tokenLength: accessToken?.length || 0,
      tokenStart: accessToken?.substring(0, 20) + '...',
      tokenType: typeof accessToken
    })
  }, [accessToken])
  
  // Metadata assignment state
  const [metadataType, setMetadataType] = useState<'studio' | 'series' | 'type' | 'label'>('studio')
  const [metadataValue, setMetadataValue] = useState('')
  const [availableMetadata, setAvailableMetadata] = useState<MasterDataItem[]>([])
  const [filteredMetadata, setFilteredMetadata] = useState<MasterDataItem[]>([])
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)
  const [metadataSearchQuery, setMetadataSearchQuery] = useState('')
  const [showCreateNewDialog, setShowCreateNewDialog] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  
  // Cast assignment state (removed - now handled by individual components)
  
  // Template assignment state
  const [templateGroups, setTemplateGroups] = useState<CoverTemplateGroup[]>([])
  const [selectedTemplateGroup, setSelectedTemplateGroup] = useState<string>('')
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  
  // Operation state
  const [isAssigning, setIsAssigning] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successData, setSuccessData] = useState<any>({})
  
  // Conflict detection state
  const [conflictAnalysis, setConflictAnalysis] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showConflictPreview, setShowConflictPreview] = useState(false)

  // Load movies on mount
  useEffect(() => {
    loadMovies()
  }, [accessToken])

  // Filter movies based on search and type filter
  useEffect(() => {
    let filtered = movies
    
    if (searchQuery) {
      filtered = filtered.filter(movie => 
        movie.titleEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.titleJp?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.actress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.director?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    if (filterType && filterType !== 'all') {
      filtered = filtered.filter(movie => movie.type === filterType)
    }
    
    setFilteredMovies(filtered)
  }, [movies, searchQuery, filterType])

  // Filter metadata based on search
  useEffect(() => {
    let filtered = availableMetadata
    
    if (metadataSearchQuery) {
      filtered = filtered.filter(item => {
        const displayName = metadataType === 'series' ? item.titleEn : item.name
        return displayName?.toLowerCase().includes(metadataSearchQuery.toLowerCase())
      })
    }
    
    setFilteredMetadata(filtered)
  }, [availableMetadata, metadataSearchQuery, metadataType])

  // Load metadata when type changes
  useEffect(() => {
    if (metadataType) {
      loadMetadata(metadataType)
    }
  }, [metadataType, accessToken])

  // Cast loading handled by individual components

  // Load template groups on mount
  useEffect(() => {
    loadTemplateGroups()
  }, [accessToken])

  const loadMovies = async () => {
    try {
      setIsLoading(true)
      const movieData = await movieApi.getAllMovies()
      setMovies(movieData)
    } catch (error) {
      console.error('Error loading movies:', error)
      toast.error('Failed to load movies')
    } finally {
      setIsLoading(false)
    }
  }

  const loadMetadata = async (type: string) => {
    try {
      setIsLoadingMetadata(true)
      const data = await masterDataApi.getByType(type, accessToken)
      setAvailableMetadata(data || [])
      setMetadataSearchQuery('') // Reset search when changing type
    } catch (error) {
      console.error(`Error loading ${type}:`, error)
    } finally {
      setIsLoadingMetadata(false)
    }
  }

  // Cast loading handled by individual components

  const loadTemplateGroups = async () => {
    try {
      setIsLoadingTemplates(true)
      const data = await fetchTemplateGroups(accessToken)
      setTemplateGroups(data || [])
    } catch (error) {
      console.error('Error loading template groups:', error)
    } finally {
      setIsLoadingTemplates(false)
    }
  }

  const handleMovieSelection = (movieId: string, checked: boolean) => {
    if (checked) {
      setSelectedMovies(prev => [...prev, movieId])
    } else {
      setSelectedMovies(prev => prev.filter(id => id !== movieId))
    }
  }

  const handleSelectAll = () => {
    if (selectedMovies.length === filteredMovies.length) {
      setSelectedMovies([])
    } else {
      setSelectedMovies(filteredMovies.map(movie => movie.id))
    }
  }

  const handleMetadataAssignment = async () => {
    if (selectedMovies.length === 0) {
      toast.error('Please select at least one movie')
      return
    }

    if (!metadataValue) {
      toast.error('Please enter a metadata value')
      return
    }

    try {
      setIsAssigning(true)
      const request: BulkMetadataAssignmentRequest = {
        movieIds: selectedMovies,
        metadataType,
        metadataValue
      }

      const result = await bulkAssignmentApi.assignMetadata(request, accessToken)
      
      // Show success message
      toast.success(`Successfully assigned ${metadataType} "${metadataValue}" to ${result.updatedCount} movies`)
      
      setSuccessData({
        type: 'metadata',
        ...result
      })
      setShowSuccessDialog(true)
      
      // Reload movies to reflect changes
      await loadMovies()
      setSelectedMovies([])
      setMetadataValue('')
      
    } catch (error) {
      console.error('Error assigning metadata:', error)
      toast.error(`Failed to assign metadata: ${error.message || error}`)
    } finally {
      setIsAssigning(false)
    }
  }

  // Cast assignment handled by individual components

  const handleTemplateAssignment = async () => {
    if (selectedMovies.length === 0) {
      toast.error('Please select at least one movie')
      return
    }

    if (!selectedTemplateGroup) {
      toast.error('Please select a template group')
      return
    }

    const templateGroup = templateGroups.find(g => g.id === selectedTemplateGroup)
    if (!templateGroup) {
      toast.error('Template group not found')
      return
    }

    try {
      setIsAssigning(true)
      const request: BulkTemplateAssignmentRequest = {
        movieIds: selectedMovies,
        templateGroupId: selectedTemplateGroup,
        templateUrl: templateGroup.templateUrl,
        galleryTemplate: templateGroup.galleryTemplate,
        applicableStudios: templateGroup.applicableStudios
      }

      const result = await bulkAssignmentApi.assignTemplate(request, accessToken)
      
      setSuccessData({
        type: 'template',
        templateGroupName: templateGroup.name,
        ...result
      })
      setShowSuccessDialog(true)
      
      // Reload movies to reflect changes
      await loadMovies()
      setSelectedMovies([])
      setSelectedTemplateGroup('')
      
    } catch (error) {
      console.error('Error assigning template:', error)
      toast.error('Failed to assign template')
    } finally {
      setIsAssigning(false)
    }
  }

  // Cast member management handled by individual components

  const handleCreateNewMetadata = async () => {
    if (!newItemName.trim()) {
      toast.error('Please enter a name')
      return
    }

    try {
      setIsCreatingNew(true)
      
      // Debug logging for authentication
      console.log('Creating new metadata with token:', accessToken ? 'Token present' : 'No token')
      console.log('Metadata type:', metadataType)
      console.log('New item name:', newItemName.trim())
      
      // Create new metadata item based on type
      let newItem: any
      
      if (metadataType === 'series') {
        // For series, use createSeries with titleEn and titleJp
        console.log('Creating series via createSeries API')
        newItem = await masterDataApi.createSeries(
          newItemName.trim(), // titleEn
          newItemName.trim(), // titleJp (same as titleEn for now)
          '', // seriesLinks (empty for now)
          accessToken
        )
      } else if (metadataType === 'studio') {
        // For studio, use createStudio
        console.log('Creating studio via createStudio API')
        newItem = await masterDataApi.createStudio(
          newItemName.trim(),
          '', // studioLinks (empty for now)
          accessToken
        )
      } else if (metadataType === 'label') {
        // For label, use createLabel
        console.log('Creating label via createLabel API')
        newItem = await masterDataApi.createLabel(
          newItemName.trim(),
          '', // labelLinks (empty for now)
          accessToken
        )
      } else {
        // For simple types (type), use basic create
        console.log('Creating simple type via create API')
        newItem = await masterDataApi.create(metadataType, newItemName.trim(), accessToken)
      }

      console.log('Successfully created metadata item:', newItem)
      toast.success(`New ${metadataType} created successfully`)
      
      // Reload metadata and select the new item
      await loadMetadata(metadataType)
      setMetadataValue(newItemName.trim())
      
      // Reset dialog state
      setShowCreateNewDialog(false)
      setNewItemName('')
      
    } catch (error) {
      console.error('Error creating new metadata:', error)
      
      // Better error message handling
      let errorMessage = 'Unknown error occurred'
      if (error.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error.error) {
        errorMessage = error.error
      }
      
      // Check for authentication errors specifically
      if (errorMessage.toLowerCase().includes('unauthorized') || errorMessage.toLowerCase().includes('jwt')) {
        toast.error(`Authentication error: Please try logging out and back in. Details: ${errorMessage}`)
      } else {
        toast.error(`Failed to create new ${metadataType}: ${errorMessage}`)
      }
    } finally {
      setIsCreatingNew(false)
    }
  }

  const analyzeMetadataConflicts = () => {
    if (selectedMovies.length === 0 || !metadataValue) return null

    const selectedMovieObjects = movies.filter(m => selectedMovies.includes(m.id))
    // Metadata assignment only handles single-value fields now (tags are separate)
    const isMultipleAllowed = false
    
    let moviesWithExisting = []
    let moviesWithoutExisting = []
    let moviesWithSameValue = []

    selectedMovieObjects.forEach(movie => {
      const currentValue = movie[metadataType]
      
      if (currentValue) {
        // For single-value fields, check if it's the same value
        if (currentValue === metadataValue) {
          moviesWithSameValue.push(movie)
        } else {
          moviesWithExisting.push(movie)
        }
      } else {
        moviesWithoutExisting.push(movie)
      }
    })

    return {
      type: 'metadata',
      metadataType,
      metadataValue,
      isMultipleAllowed,
      moviesWithExisting,
      moviesWithoutExisting,
      moviesWithSameValue,
      totalSelected: selectedMovies.length
    }
  }

  // Cast conflict analysis handled by individual components

  const handleMetadataPreview = () => {
    setIsAnalyzing(true)
    const analysis = analyzeMetadataConflicts()
    setConflictAnalysis(analysis)
    setShowConflictPreview(true)
    setIsAnalyzing(false)
  }

  // Cast preview handled by individual components

  // Test auth function
  const testAuth = async () => {
    try {
      console.log('Testing auth with token:', accessToken?.substring(0, 20) + '...')
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf/health`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('Auth test response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Auth test success:', result)
        toast.success('Authentication test successful!')
      } else {
        const error = await response.text()
        console.error('Auth test failed:', error)
        toast.error(`Authentication test failed: ${response.status} ${error}`)
      }
    } catch (error) {
      console.error('Auth test exception:', error)
      toast.error(`Authentication test exception: ${error}`)
    }
  }

  const handleAssignmentComplete = async () => {
    await loadMovies()
    setSelectedMovies([])
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'studio': return Building
      case 'series': return Play
      case 'type': return Tag
      case 'label': return Bookmark
      case 'tag': return Tag
      case 'actress': return Users
      case 'actors': return User
      case 'director': return UserCheck
      default: return Tag
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p>Loading movies...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-h-full overflow-y-auto">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Assignment Manager</CardTitle>
          <CardDescription>
            Assign metadata, cast, and templates to multiple movies at once
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Movie Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Select Movies ({selectedMovies.length} selected)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {Array.from(new Set(movies.map(m => m.type).filter(Boolean))).map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={handleSelectAll}
              className="flex items-center gap-2"
            >
              {selectedMovies.length === filteredMovies.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          {/* Movie List */}
          <div className="max-h-96 overflow-y-auto border rounded-md p-4">
            <div className="grid gap-2">
              {filteredMovies.map((movie) => (
                <div key={movie.id} className="flex items-center space-x-3 p-2 hover:bg-muted rounded">
                  <Checkbox
                    checked={selectedMovies.includes(movie.id)}
                    onCheckedChange={(checked) => handleMovieSelection(movie.id, checked as boolean)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {movie.titleEn || movie.titleJp || 'Untitled'}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {movie.code && <span className="mr-2">{movie.code}</span>}
                      {movie.type && <Badge variant="secondary" className="mr-2">{movie.type}</Badge>}
                      {movie.actress && <span>{movie.actress}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Tabs */}
      <Tabs defaultValue="tags" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tags">Assign Tags</TabsTrigger>
          <TabsTrigger value="metadata">Assign Metadata</TabsTrigger>
          <TabsTrigger value="cast">Assign Cast</TabsTrigger>
          <TabsTrigger value="templates">Assign Templates</TabsTrigger>
        </TabsList>

        {/* Simple Tag Assignment */}
        <TabsContent value="tags">
          <SimpleBulkTagAssigner accessToken={accessToken} />
        </TabsContent>

        {/* Metadata Assignment */}
        <TabsContent value="metadata">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Assign Metadata
              </CardTitle>
              <CardDescription>
                Assign studio, series, type, or label to selected movies. Tags have their own dedicated tab.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Metadata Type</Label>
                  <Select value={metadataType} onValueChange={(value: any) => setMetadataType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="series">Series</SelectItem>
                      <SelectItem value="type">Type</SelectItem>
                      <SelectItem value="label">Label</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Select {metadataType.charAt(0).toUpperCase() + metadataType.slice(1)}</Label>
                  <div className="space-y-3">
                    {/* Current Selection Display */}
                    {metadataValue && (
                      <div className="p-2 bg-muted rounded border">
                        <div className="text-sm text-muted-foreground">Selected:</div>
                        <div className="flex items-center justify-between">
                          <Badge variant="default">{metadataValue}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMetadataValue('')}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Search and Create */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder={`Search ${metadataType}s...`}
                          value={metadataSearchQuery}
                          onChange={(e) => setMetadataSearchQuery(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowCreateNewDialog(true)}
                          title={`Create new ${metadataType}`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Quick input for new value */}
                      <Input
                        value={metadataValue}
                        onChange={(e) => setMetadataValue(e.target.value)}
                        placeholder={`Or type new ${metadataType} name...`}
                      />
                    </div>

                    {/* Available Items List */}
                    {!isLoadingMetadata && filteredMetadata.length > 0 && (
                      <div className="border rounded">
                        <div className="p-2 bg-muted/50 border-b">
                          <div className="text-sm text-muted-foreground">
                            Available {metadataType}s ({filteredMetadata.length})
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredMetadata.map((item) => {
                            const displayName = metadataType === 'series' ? item.titleEn : item.name
                            const isSelected = metadataValue === displayName
                            return (
                              <div
                                key={item.id}
                                className={`p-2 hover:bg-muted cursor-pointer border-b last:border-b-0 ${
                                  isSelected ? 'bg-primary/10 border-primary/20' : ''
                                }`}
                                onClick={() => setMetadataValue(displayName || '')}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={isSelected ? 'font-medium' : ''}>
                                    {displayName}
                                  </span>
                                  {isSelected && (
                                    <CheckCircle className="h-4 w-4 text-primary" />
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* No results message */}
                    {!isLoadingMetadata && filteredMetadata.length === 0 && metadataSearchQuery && (
                      <div className="p-4 text-center text-muted-foreground border rounded">
                        No {metadataType}s found for "{metadataSearchQuery}"
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2"
                          onClick={() => {
                            setNewItemName(metadataSearchQuery)
                            setShowCreateNewDialog(true)
                          }}
                        >
                          Create "{metadataSearchQuery}"
                        </Button>
                      </div>
                    )}

                    {/* Loading state */}
                    {isLoadingMetadata && (
                      <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                        <div className="text-sm text-muted-foreground">Loading {metadataType}s...</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Conflict Analysis for Metadata */}
              {selectedMovies.length > 0 && metadataValue && (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={handleMetadataPreview}
                    disabled={isAnalyzing}
                    className="w-full"
                  >
                    {isAnalyzing ? 'Analyzing...' : (
                      <>
                        <Info className="h-4 w-4 mr-2" />
                        Preview Assignment ({selectedMovies.length} movies)
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleMetadataAssignment}
                    disabled={isAssigning || selectedMovies.length === 0 || !metadataValue}
                    className="w-full"
                  >
                    {isAssigning ? 'Assigning...' : `Assign ${metadataType} to ${selectedMovies.length} movies`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cast Assignment */}
        <TabsContent value="cast">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Assign Cast Members
                </CardTitle>
                <CardDescription>
                  Choose the type of cast member to assign. Each type has its own dedicated interface for better organization.
                </CardDescription>
              </CardHeader>
            </Card>
            
            {/* Cast Type Tabs */}
            <Tabs defaultValue="actors" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="actors">Actors</TabsTrigger>
                <TabsTrigger value="actresses">Actresses</TabsTrigger>
                <TabsTrigger value="directors">Directors</TabsTrigger>
              </TabsList>
              
              <TabsContent value="actors">
                <BulkMovieActorAssigner
                  accessToken={accessToken}
                  selectedMovies={selectedMovies}
                  onAssignmentComplete={handleAssignmentComplete}
                />
              </TabsContent>
              
              <TabsContent value="actresses">
                <BulkMovieActressAssigner
                  accessToken={accessToken}
                  selectedMovies={selectedMovies}
                  onAssignmentComplete={handleAssignmentComplete}
                />
              </TabsContent>
              
              <TabsContent value="directors">
                <BulkMovieDirectorAssigner
                  accessToken={accessToken}
                  selectedMovies={selectedMovies}
                  onAssignmentComplete={handleAssignmentComplete}
                />
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>

        {/* Template Assignment */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Assign Templates
              </CardTitle>
              <CardDescription>
                Apply template groups to selected movies to update cover images and gallery templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Select Template Group</Label>
                {isLoadingTemplates ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    <div className="text-sm text-muted-foreground">Loading template groups...</div>
                  </div>
                ) : (
                  <Select value={selectedTemplateGroup} onValueChange={setSelectedTemplateGroup}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template group to apply" />
                    </SelectTrigger>
                    <SelectContent>
                      {templateGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id || ''}>
                          <div className="flex flex-col">
                            <span>{group.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {group.applicableTypes.length > 0 && `Types: ${group.applicableTypes.join(', ')}`}
                              {group.applicableTypes.length > 0 && (group.applicableStudios || []).length > 0 && '; '}
                              {(group.applicableStudios || []).length > 0 && `Studios: ${(group.applicableStudios || []).join(', ')}`}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Selected Template Preview */}
              {selectedTemplateGroup && (() => {
                const selectedGroup = templateGroups.find(g => g.id === selectedTemplateGroup)
                return selectedGroup ? (
                  <div className="p-4 bg-muted/50 rounded border">
                    <h4 className="font-medium mb-2">Template Preview</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Group:</span>
                        <span className="ml-2 font-medium">{selectedGroup.name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cover Template:</span>
                        <div className="ml-2 font-mono text-xs bg-background p-2 rounded mt-1 break-all">
                          {selectedGroup.templateUrl}
                        </div>
                      </div>
                      {selectedGroup.galleryTemplate && (
                        <div>
                          <span className="text-muted-foreground">Gallery Template:</span>
                          <div className="ml-2 font-mono text-xs bg-background p-2 rounded mt-1 break-all">
                            {selectedGroup.galleryTemplate}
                          </div>
                        </div>
                      )}
                      {selectedGroup.applicableTypes.length > 0 && (
                        <div>
                          <span className="text-muted-foreground">Applicable Types:</span>
                          <div className="ml-2 mt-1 flex flex-wrap gap-1">
                            {selectedGroup.applicableTypes.map(type => (
                              <Badge key={type} variant="secondary" className="text-xs">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {(selectedGroup.applicableStudios || []).length > 0 && (
                        <div>
                          <span className="text-muted-foreground">Applicable Studios:</span>
                          <div className="ml-2 mt-1 flex flex-wrap gap-1">
                            {(selectedGroup.applicableStudios || []).map(studio => (
                              <Badge key={studio} variant="outline" className="text-xs">
                                {studio}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null
              })()}

              {/* Template Assignment Info */}
              {selectedMovies.length > 0 && selectedTemplateGroup && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded border">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800 dark:text-blue-200">
                      Assignment Preview
                    </span>
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    This will apply the selected template group to <strong>{selectedMovies.length}</strong> selected movies.
                    The templates will replace existing cover and gallery URLs for each movie with templates
                    that use the movie's dmcode or code.
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleTemplateAssignment}
                  disabled={isAssigning || selectedMovies.length === 0 || !selectedTemplateGroup}
                  className="flex-1"
                >
                  {isAssigning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Applying Template...
                    </>
                  ) : (
                    <>
                      <Image className="h-4 w-4 mr-2" />
                      Apply Template to {selectedMovies.length} Movie{selectedMovies.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Assignment Successful!
            </DialogTitle>
            <DialogDescription>
              {successData.type === 'metadata' 
                ? `Successfully assigned ${successData.metadataType} "${successData.metadataValue}" to ${successData.updatedCount} movies.`
                : `Successfully assigned ${successData.castMembers?.length} ${successData.castType} to ${successData.updatedCount} movies.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowSuccessDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create New Metadata Dialog */}
      <Dialog open={showCreateNewDialog} onOpenChange={setShowCreateNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New {metadataType.charAt(0).toUpperCase() + metadataType.slice(1)}
            </DialogTitle>
            <DialogDescription>
              Create a new {metadataType} that can be assigned to movies. You can edit details later in Master Data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="newItemName">Name</Label>
              <Input
                id="newItemName"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={`Enter ${metadataType} name...`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isCreatingNew) {
                    handleCreateNewMetadata()
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateNewDialog(false)
                setNewItemName('')
              }}
              disabled={isCreatingNew}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateNewMetadata}
              disabled={isCreatingNew || !newItemName.trim()}
            >
              {isCreatingNew ? 'Creating...' : 'Create & Select'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conflict Preview Dialog */}
      <Dialog open={showConflictPreview} onOpenChange={setShowConflictPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Assignment Preview
            </DialogTitle>
            <DialogDescription>
              Review the impact of this assignment before proceeding
            </DialogDescription>
          </DialogHeader>
          
          {conflictAnalysis && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="p-4 bg-muted rounded border">
                <h4 className="font-medium mb-2">Assignment Summary</h4>
                {conflictAnalysis.type === 'metadata' ? (
                  <p>
                    Assigning <Badge variant="default">{conflictAnalysis.metadataValue}</Badge> as{' '}
                    <Badge variant="secondary">{conflictAnalysis.metadataType}</Badge> to{' '}
                    {conflictAnalysis.totalSelected} movies
                  </p>
                ) : (
                  <p>
                    Assigning <span className="font-medium">{conflictAnalysis.castMembers.length}</span>{' '}
                    <Badge variant="secondary">{conflictAnalysis.castType}</Badge> to{' '}
                    {conflictAnalysis.totalSelected} movies ({conflictAnalysis.assignmentMode} mode)
                  </p>
                )}
              </div>

              {/* Metadata Conflicts */}
              {conflictAnalysis.type === 'metadata' && (
                <div className="space-y-4">
                  {/* Movies that already have the same value */}
                  {conflictAnalysis.moviesWithSameValue.length > 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium text-yellow-800">
                          Already Has Same {conflictAnalysis.metadataType.charAt(0).toUpperCase() + conflictAnalysis.metadataType.slice(1)}
                        </span>
                        <Badge variant="outline">{conflictAnalysis.moviesWithSameValue.length}</Badge>
                      </div>
                      <p className="text-sm text-yellow-700 mb-2">
                        These movies already have "{conflictAnalysis.metadataValue}" and will be skipped:
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {conflictAnalysis.moviesWithSameValue.map((movie: Movie) => (
                          <div key={movie.id} className="text-sm bg-white rounded px-2 py-1">
                            {movie.titleEn || movie.titleJp || 'Untitled'} {movie.code && `(${movie.code})`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Movies that will be updated (have different value) */}
                  {conflictAnalysis.moviesWithExisting.length > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">
                          Will {conflictAnalysis.isMultipleAllowed ? 'Add To' : 'Replace'} Existing {conflictAnalysis.metadataType.charAt(0).toUpperCase() + conflictAnalysis.metadataType.slice(1)}
                        </span>
                        <Badge variant="outline">{conflictAnalysis.moviesWithExisting.length}</Badge>
                      </div>
                      <p className="text-sm text-blue-700 mb-2">
                        {conflictAnalysis.isMultipleAllowed 
                          ? `These movies already have other ${conflictAnalysis.metadataType} and the new value will be added:`
                          : `These movies have different ${conflictAnalysis.metadataType} that will be replaced:`
                        }
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {conflictAnalysis.moviesWithExisting.map((movie: Movie) => (
                          <div key={movie.id} className="text-sm bg-white rounded px-2 py-1 flex justify-between">
                            <span>{movie.titleEn || movie.titleJp || 'Untitled'} {movie.code && `(${movie.code})`}</span>
                            <span className="text-muted-foreground">
                              Current: {movie[conflictAnalysis.metadataType] || 'None'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Movies without existing data */}
                  {conflictAnalysis.moviesWithoutExisting.length > 0 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800">Will Add New {conflictAnalysis.metadataType.charAt(0).toUpperCase() + conflictAnalysis.metadataType.slice(1)}</span>
                        <Badge variant="outline">{conflictAnalysis.moviesWithoutExisting.length}</Badge>
                      </div>
                      <p className="text-sm text-green-700 mb-2">
                        These movies don't have {conflictAnalysis.metadataType} and will get the new value:
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {conflictAnalysis.moviesWithoutExisting.map((movie: Movie) => (
                          <div key={movie.id} className="text-sm bg-white rounded px-2 py-1">
                            {movie.titleEn || movie.titleJp || 'Untitled'} {movie.code && `(${movie.code})`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Cast Conflicts */}
              {conflictAnalysis.type === 'cast' && (
                <div className="space-y-4">
                  {/* Movies with cast conflicts */}
                  {conflictAnalysis.moviesWithConflicts.length > 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium text-yellow-800">
                          Has Duplicate {conflictAnalysis.castType.charAt(0).toUpperCase() + conflictAnalysis.castType.slice(1)}
                        </span>
                        <Badge variant="outline">{conflictAnalysis.moviesWithConflicts.length}</Badge>
                      </div>
                      <p className="text-sm text-yellow-700 mb-2">
                        These movies already have some of the selected {conflictAnalysis.castType}:
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {conflictAnalysis.moviesWithConflicts.map((movie: Movie) => (
                          <div key={movie.id} className="text-sm bg-white rounded px-2 py-1">
                            <div className="font-medium">{movie.titleEn || movie.titleJp || 'Untitled'} {movie.code && `(${movie.code})`}</div>
                            <div className="text-muted-foreground">
                              Duplicates: {conflictAnalysis.conflictDetails[movie.id].join(', ')}
                            </div>
                            <div className="text-muted-foreground">
                              Current: {movie[conflictAnalysis.castType] || 'None'}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-yellow-700 mt-2">
                        {conflictAnalysis.assignmentMode === 'append' 
                          ? 'In append mode, duplicates will be skipped for these movies.'
                          : 'In replace mode, all current cast will be replaced with the new selection.'
                        }
                      </p>
                    </div>
                  )}

                  {/* Movies without conflicts */}
                  {conflictAnalysis.moviesWithoutConflicts.length > 0 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800">No Conflicts</span>
                        <Badge variant="outline">{conflictAnalysis.moviesWithoutConflicts.length}</Badge>
                      </div>
                      <p className="text-sm text-green-700 mb-2">
                        These movies will get the new {conflictAnalysis.castType} without conflicts:
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {conflictAnalysis.moviesWithoutConflicts.map((movie: Movie) => (
                          <div key={movie.id} className="text-sm bg-white rounded px-2 py-1 flex justify-between">
                            <span>{movie.titleEn || movie.titleJp || 'Untitled'} {movie.code && `(${movie.code})`}</span>
                            <span className="text-muted-foreground">
                              Current: {movie[conflictAnalysis.castType] || 'None'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConflictPreview(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowConflictPreview(false)
                if (conflictAnalysis?.type === 'metadata') {
                  handleMetadataAssignment()
                } else {
                  handleCastAssignment()
                }
              }}
            >
              Proceed with Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}