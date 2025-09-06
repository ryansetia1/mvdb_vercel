import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Checkbox } from './ui/checkbox'
import { Separator } from './ui/separator'
import { toast } from 'sonner@2.0.3'
import { movieApi, Movie } from '../utils/movieApi'
import { masterDataApi, MasterDataItem } from '../utils/masterDataApi'
import { Tag, Search, Plus, Check, X, Info } from 'lucide-react'

interface SimpleBulkTagAssignerProps {
  accessToken: string
}

export function SimpleBulkTagAssigner({ accessToken }: SimpleBulkTagAssignerProps) {
  // Movie selection state
  const [movies, setMovies] = useState<Movie[]>([])
  const [selectedMovies, setSelectedMovies] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoadingMovies, setIsLoadingMovies] = useState(true)

  // Tag management state
  const [availableTags, setAvailableTags] = useState<MasterDataItem[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [tagSearchQuery, setTagSearchQuery] = useState('')
  const [isLoadingTags, setIsLoadingTags] = useState(false)

  // Operation state
  const [isAssigning, setIsAssigning] = useState(false)

  // Load movies on mount
  useEffect(() => {
    loadMovies()
  }, [])

  // Load tags on mount
  useEffect(() => {
    loadTags()
  }, [accessToken])

  const loadMovies = async () => {
    try {
      setIsLoadingMovies(true)
      const movieData = await movieApi.getAllMovies()
      setMovies(movieData)
    } catch (error) {
      console.error('Error loading movies:', error)
      toast.error('Failed to load movies')
    } finally {
      setIsLoadingMovies(false)
    }
  }

  const loadTags = async () => {
    try {
      setIsLoadingTags(true)
      const tagData = await masterDataApi.getByType('tag', accessToken)
      setAvailableTags(tagData || [])
    } catch (error) {
      console.error('Error loading tags:', error)
      toast.error('Failed to load tags')
    } finally {
      setIsLoadingTags(false)
    }
  }

  // Filter movies based on search
  const filteredMovies = movies.filter(movie => 
    !searchQuery || 
    movie.titleEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    movie.titleJp?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    movie.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    movie.actress?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Filter tags based on search
  const filteredTags = availableTags.filter(tag =>
    !tagSearchQuery || 
    tag.name?.toLowerCase().includes(tagSearchQuery.toLowerCase())
  )

  const handleMovieSelection = (movieId: string, checked: boolean) => {
    if (checked) {
      setSelectedMovies(prev => [...prev, movieId])
    } else {
      setSelectedMovies(prev => prev.filter(id => id !== movieId))
    }
  }

  const handleSelectAllMovies = () => {
    if (selectedMovies.length === filteredMovies.length) {
      setSelectedMovies([])
    } else {
      setSelectedMovies(filteredMovies.map(movie => movie.id))
    }
  }

  const handleTagSelection = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(prev => prev.filter(t => t !== tagName))
    } else {
      setSelectedTags(prev => [...prev, tagName])
    }
  }

  const handleCreateNewTag = async () => {
    if (!newTagName.trim()) {
      toast.error('Please enter a tag name')
      return
    }

    // Check if tag already exists
    const existingTag = availableTags.find(tag => 
      tag.name?.toLowerCase() === newTagName.trim().toLowerCase()
    )
    
    if (existingTag) {
      toast.error('Tag already exists')
      setNewTagName('')
      return
    }

    try {
      await masterDataApi.create('tag', newTagName.trim(), accessToken)
      toast.success('New tag created successfully')
      
      // Reload tags and auto-select the new one
      await loadTags()
      setSelectedTags(prev => [...prev, newTagName.trim()])
      setNewTagName('')
    } catch (error) {
      console.error('Error creating tag:', error)
      toast.error('Failed to create new tag')
    }
  }

  const handleAssignTags = async () => {
    if (selectedMovies.length === 0) {
      toast.error('Please select at least one movie')
      return
    }

    if (selectedTags.length === 0) {
      toast.error('Please select at least one tag')
      return
    }

    try {
      setIsAssigning(true)
      
      // Process each movie individually to properly handle existing tags
      let successCount = 0
      const errors = []

      for (const movieId of selectedMovies) {
        try {
          const movie = movies.find(m => m.id === movieId)
          if (!movie) continue

          // Get existing tags
          const existingTags = movie.tags ? 
            movie.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : 
            []
          
          // Combine existing tags with new tags (remove duplicates)
          const allTags = [...new Set([...existingTags, ...selectedTags])]
          const tagsString = allTags.join(', ')

          // Update movie with combined tags
          await movieApi.update(movieId, { tags: tagsString }, accessToken)
          successCount++
        } catch (error) {
          console.error(`Error updating movie ${movieId}:`, error)
          errors.push(`Failed to update movie ${movieId}`)
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully assigned tags to ${successCount} movies`)
        
        // Reload movies to reflect changes
        await loadMovies()
        
        // Reset selections
        setSelectedMovies([])
        setSelectedTags([])
      }

      if (errors.length > 0) {
        console.error('Some updates failed:', errors)
        toast.error(`${errors.length} movies failed to update`)
      }

    } catch (error) {
      console.error('Error in bulk tag assignment:', error)
      toast.error('Failed to assign tags')
    } finally {
      setIsAssigning(false)
    }
  }

  if (isLoadingMovies) {
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
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Simple Bulk Tag Assignment
          </CardTitle>
          <p className="text-muted-foreground">
            Select movies and assign tags to them in bulk. Tags will be added to existing tags without replacing them.
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Movie Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Select Movies ({selectedMovies.length} selected)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Movie Search */}
            <div className="flex gap-2">
              <Input
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleSelectAllMovies}
              >
                {selectedMovies.length === filteredMovies.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            {/* Movie List */}
            <div className="max-h-80 overflow-y-auto border rounded-md">
              {filteredMovies.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No movies found
                </div>
              ) : (
                <div className="p-2 space-y-1">
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
                          {movie.actress && <span>{movie.actress}</span>}
                        </div>
                        {movie.tags && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Current tags: {movie.tags}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tag Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Select Tags ({selectedTags.length} selected)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected Tags Display */}
            {selectedTags.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Tags:</Label>
                <div className="flex flex-wrap gap-1 p-2 bg-muted rounded border">
                  {selectedTags.map((tag) => (
                    <Badge key={tag} variant="default" className="flex items-center gap-1">
                      {tag}
                      <button
                        onClick={() => handleTagSelection(tag)}
                        className="ml-1 hover:bg-black/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Create New Tag */}
            <div className="space-y-2">
              <Label>Create New Tag</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter new tag name..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateNewTag()
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCreateNewTag}
                  disabled={!newTagName.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Existing Tags Search */}
            <div className="space-y-2">
              <Label>Select Existing Tags</Label>
              <Input
                placeholder="Search existing tags..."
                value={tagSearchQuery}
                onChange={(e) => setTagSearchQuery(e.target.value)}
              />
            </div>

            {/* Available Tags List */}
            <div className="max-h-60 overflow-y-auto border rounded-md">
              {isLoadingTags ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <div className="text-sm text-muted-foreground">Loading tags...</div>
                </div>
              ) : filteredTags.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {tagSearchQuery ? `No tags found for "${tagSearchQuery}"` : 'No tags available'}
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag.name || '')
                    return (
                      <div
                        key={tag.id}
                        className={`flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer ${
                          isSelected ? 'bg-primary/10 border border-primary/20' : ''
                        }`}
                        onClick={() => handleTagSelection(tag.name || '')}
                      >
                        <span className={isSelected ? 'font-medium' : ''}>
                          {tag.name}
                        </span>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Action */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              <span>
                Ready to assign {selectedTags.length} tag(s) to {selectedMovies.length} movie(s)
              </span>
            </div>
            <Button
              onClick={handleAssignTags}
              disabled={isAssigning || selectedMovies.length === 0 || selectedTags.length === 0}
              size="lg"
            >
              {isAssigning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Assigning...
                </>
              ) : (
                `Assign Tags to ${selectedMovies.length} Movies`
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}