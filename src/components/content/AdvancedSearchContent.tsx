import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { MultiSelect } from '../ui/multi-select'
import { 
  Search, 
  Filter, 
  X, 
  ArrowLeft,
  Calendar,
  Film,
  Users,
  User,
  Building,
  Tag as TagIcon,
  PlayCircle
} from 'lucide-react'
import { Movie, movieApi } from '../../utils/movieApi'
import { MasterDataItem, masterDataApi, getAllAliases, movieCodeMatchesQuery } from '../../utils/masterDataApi'
import { MovieCard } from '../MovieCard'

interface AdvancedSearchContentProps {
  accessToken: string
  onBack: () => void
  onMovieClick: (movie: Movie) => void
  onProfileSelect?: (type: 'actor' | 'actress' | 'director', name: string) => void
}

interface SearchFilters {
  query: string
  types: string[]
  studios: string[]
  actors: string[]
  actresses: string[]
  tags: string[]
  series: string[]
  yearFrom: string
  yearTo: string
  sortBy: 'newest' | 'oldest' | 'title' | 'relevance'
}

export function AdvancedSearchContent({ accessToken, onBack, onMovieClick, onProfileSelect }: AdvancedSearchContentProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    types: [],
    studios: [],
    actors: [],
    actresses: [],
    tags: [],
    series: [],
    yearFrom: '',
    yearTo: '',
    sortBy: 'relevance'
  })

  const [searchResults, setSearchResults] = useState<Movie[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Master data for filters
  const [availableTypes, setAvailableTypes] = useState<string[]>([])
  const [availableStudios, setAvailableStudios] = useState<string[]>([])
  const [availableActors, setAvailableActors] = useState<MasterDataItem[]>([])
  const [availableActresses, setAvailableActresses] = useState<MasterDataItem[]>([])
  const [availableTags, setAvailableTags] = useState<MasterDataItem[]>([])
  const [availableSeries, setAvailableSeries] = useState<string[]>([])

  const loadMasterData = async () => {
    try {
      // Load all movies to extract types, studios, and series
      const movies = await movieApi.getMovies(accessToken)
      
      // Extract unique types and studios from movies
      const uniqueTypes = [...new Set(movies.map(movie => movie.type).filter(Boolean))].sort()
      const uniqueStudios = [...new Set(movies.map(movie => movie.studio).filter(Boolean))].sort()
      const uniqueSeries = [...new Set(movies.map(movie => movie.series).filter(Boolean))].sort()
      
      // Load master data using the correct API
      const [actors, actresses, tags] = await Promise.all([
        masterDataApi.getByType('actor', accessToken).catch(() => []),
        masterDataApi.getByType('actress', accessToken).catch(() => []),
        masterDataApi.getByType('tag', accessToken).catch(() => []),
      ])

      setAvailableTypes(uniqueTypes)
      setAvailableStudios(uniqueStudios)
      setAvailableSeries(uniqueSeries)
      setAvailableActors(actors.sort((a, b) => (a.name || '').localeCompare(b.name || '')))
      setAvailableActresses(actresses.sort((a, b) => (a.name || '').localeCompare(b.name || '')))
      setAvailableTags(tags.sort((a, b) => (a.name || '').localeCompare(b.name || '')))
    } catch (error) {
      console.error('Error loading master data:', error)
    }
  }

  // Load master data on component mount
  useEffect(() => {
    loadMasterData()
  }, [accessToken]) // Add accessToken as dependency

  const handleSearch = async () => {
    if (!filters.query.trim() && 
        filters.types.length === 0 && 
        filters.studios.length === 0 && 
        filters.actors.length === 0 && 
        filters.actresses.length === 0 && 
        filters.tags.length === 0 && 
        filters.series.length === 0 &&
        !filters.yearFrom && 
        !filters.yearTo) {
      return
    }

    setIsSearching(true)
    setHasSearched(true)

    try {
      const movies = await movieApi.getMovies(accessToken)
      
      // Apply filters
      let filteredMovies = movies.filter(movie => {
        // Text search
        if (filters.query.trim()) {
          const query = filters.query.toLowerCase()
          
          // Check movie codes with enhanced matching
          const movieCodeMatch = movieCodeMatchesQuery(movie.code, query) || 
                                movieCodeMatchesQuery(movie.dmcode, query)
          
          // Check other searchable text
          const searchableText = [
            movie.titleEn,
            movie.titleJp, 
            movie.director,
            movie.actress,
            movie.actors,
            movie.studio,
            movie.label,
            movie.tags
          ].filter(Boolean).join(' ').toLowerCase()
          
          const textMatch = searchableText.includes(query)
          
          if (!movieCodeMatch && !textMatch) {
            return false
          }
        }

        // Type filter
        if (filters.types.length > 0 && !filters.types.includes(movie.type)) {
          return false
        }

        // Studio filter
        if (filters.studios.length > 0 && !filters.studios.includes(movie.studio)) {
          return false
        }

        // Actor filter
        if (filters.actors.length > 0) {
          const movieActors = movie.actors?.split(',').map(a => a.trim()) || []
          // Check if any selected actor matches any movie actor (considering aliases)
          const hasMatchingActor = filters.actors.some(selectedActor => {
            return movieActors.some(movieActor => {
              // Direct name match
              if (movieActor === selectedActor) return true
              
              // Check if movieActor has aliases that match selectedActor
              const actorData = availableActors.find(a => a.name === movieActor)
              if (actorData) {
                const aliases = getAllAliases(actorData)
                return aliases.includes(selectedActor)
              }
              
              return false
            })
          })
          if (!hasMatchingActor) {
            return false
          }
        }

        // Actress filter
        if (filters.actresses.length > 0) {
          const movieActresses = movie.actress?.split(',').map(a => a.trim()) || []
          // Check if any selected actress matches any movie actress (considering aliases)
          const hasMatchingActress = filters.actresses.some(selectedActress => {
            return movieActresses.some(movieActress => {
              // Direct name match
              if (movieActress === selectedActress) return true
              
              // Check if movieActress has aliases that match selectedActress
              const actressData = availableActresses.find(a => a.name === movieActress)
              if (actressData) {
                const aliases = getAllAliases(actressData)
                return aliases.includes(selectedActress)
              }
              
              return false
            })
          })
          if (!hasMatchingActress) {
            return false
          }
        }

        // Tags filter
        if (filters.tags.length > 0) {
          const movieTags = movie.tags?.split(',').map(t => t.trim()) || []
          if (!filters.tags.some(tag => movieTags.includes(tag))) {
            return false
          }
        }

        // Series filter
        if (filters.series.length > 0 && !filters.series.includes(movie.series)) {
          return false
        }

        // Year range filter
        if (filters.yearFrom || filters.yearTo) {
          const movieYear = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null
          if (movieYear) {
            if (filters.yearFrom && movieYear < parseInt(filters.yearFrom)) {
              return false
            }
            if (filters.yearTo && movieYear > parseInt(filters.yearTo)) {
              return false
            }
          } else if (filters.yearFrom || filters.yearTo) {
            return false // Exclude movies without release dates when year filter is applied
          }
        }

        return true
      })

      // Apply sorting
      switch (filters.sortBy) {
        case 'newest':
          filteredMovies.sort((a, b) => new Date(b.releaseDate || 0).getTime() - new Date(a.releaseDate || 0).getTime())
          break
        case 'oldest':
          filteredMovies.sort((a, b) => new Date(a.releaseDate || 0).getTime() - new Date(b.releaseDate || 0).getTime())
          break
        case 'title':
          filteredMovies.sort((a, b) => (a.titleEn || a.titleJp || '').localeCompare(b.titleEn || b.titleJp || ''))
          break
        default: // relevance - keep original order
          break
      }

      setSearchResults(filteredMovies)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const clearFilters = () => {
    setFilters({
      query: '',
      types: [],
      studios: [],
      actors: [],
      actresses: [],
      tags: [],
      series: [],
      yearFrom: '',
      yearTo: '',
      sortBy: 'relevance'
    })
    setSearchResults([])
    setHasSearched(false)
  }

  const removeFilter = (category: keyof SearchFilters, value: string) => {
    if (Array.isArray(filters[category])) {
      setFilters(prev => ({
        ...prev,
        [category]: (prev[category] as string[]).filter(item => item !== value)
      }))
    }
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.query.trim()) count++
    count += filters.types.length
    count += filters.studios.length
    count += filters.actors.length
    count += filters.actresses.length
    count += filters.tags.length
    count += filters.series.length
    if (filters.yearFrom) count++
    if (filters.yearTo) count++
    return count
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Advanced Search</h1>
          <p className="text-muted-foreground">Search movies with detailed filters</p>
        </div>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search Filters
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary">{getActiveFiltersCount()} active</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Apply multiple filters to find exactly what you're looking for
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Text Search */}
          <div className="space-y-2">
            <Label>Text Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search in title, director, actors, code, etc..."
                value={filters.query}
                onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Types */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Film className="h-4 w-4" />
                Types
              </Label>
              <MultiSelect
                placeholder="Select types..."
                searchPlaceholder="Search types..."
                emptyText="No types found."
                options={availableTypes.map(type => ({ value: type, label: type }))}
                selected={filters.types}
                onChange={(selected) => setFilters(prev => ({ ...prev, types: selected }))}
              />
            </div>

            {/* Studios */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Studios
              </Label>
              <MultiSelect
                placeholder="Select studios..."
                searchPlaceholder="Search studios..."
                emptyText="No studios found."
                options={availableStudios.map(studio => ({ value: studio, label: studio }))}
                selected={filters.studios}
                onChange={(selected) => setFilters(prev => ({ ...prev, studios: selected }))}
              />
            </div>

            {/* Actors */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Actors
              </Label>
              <MultiSelect
                placeholder="Select actors..."
                searchPlaceholder="Search actors..."
                emptyText="No actors found."
                options={availableActors.map(actor => {
                  const aliases = getAllAliases(actor)
                  const label = actor.name || ''
                  const searchableLabel = aliases.length > 0 
                    ? `${label} (${aliases.join(', ')})` 
                    : label
                  return { 
                    value: actor.name || '', 
                    label: searchableLabel
                  }
                })}
                selected={filters.actors}
                onChange={(selected) => setFilters(prev => ({ ...prev, actors: selected }))}
              />
            </div>

            {/* Actresses */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Actresses
              </Label>
              <MultiSelect
                placeholder="Select actresses..."
                searchPlaceholder="Search actresses..."
                emptyText="No actresses found."
                options={availableActresses.map(actress => {
                  const aliases = getAllAliases(actress)
                  const label = actress.name || ''
                  const searchableLabel = aliases.length > 0 
                    ? `${label} (${aliases.join(', ')})` 
                    : label
                  return { 
                    value: actress.name || '', 
                    label: searchableLabel
                  }
                })}
                selected={filters.actresses}
                onChange={(selected) => setFilters(prev => ({ ...prev, actresses: selected }))}
              />
            </div>

            {/* Tags */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <TagIcon className="h-4 w-4" />
                Tags
              </Label>
              <MultiSelect
                placeholder="Select tags..."
                searchPlaceholder="Search tags..."
                emptyText="No tags found."
                options={availableTags.map(tag => ({ 
                  value: tag.name || '', 
                  label: tag.name || '' 
                }))}
                selected={filters.tags}
                onChange={(selected) => setFilters(prev => ({ ...prev, tags: selected }))}
              />
            </div>

            {/* Series */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <PlayCircle className="h-4 w-4" />
                Series
              </Label>
              <MultiSelect
                placeholder="Select series..."
                searchPlaceholder="Search series..."
                emptyText="No series found."
                options={availableSeries.map(series => ({ value: series, label: series }))}
                selected={filters.series}
                onChange={(selected) => setFilters(prev => ({ ...prev, series: selected }))}
              />
            </div>

            {/* Year Range */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Release Year
              </Label>
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="From year"
                  value={filters.yearFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, yearFrom: e.target.value }))}
                  min="1900"
                  max="2030"
                />
                <Input
                  type="number"
                  placeholder="To year"
                  value={filters.yearTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, yearTo: e.target.value }))}
                  min="1900"
                  max="2030"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Sort Order */}
          <div className="space-y-2">
            <Label>Sort Results By</Label>
            <Select
              value={filters.sortBy}
              onValueChange={(value: SearchFilters['sortBy']) => 
                setFilters(prev => ({ ...prev, sortBy: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleSearch} 
              disabled={isSearching}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear All
            </Button>
          </div>

          {/* Active Filters Display */}
          {getActiveFiltersCount() > 0 && (
            <div className="space-y-2">
              <Label>Active Filters:</Label>
              <div className="flex flex-wrap gap-2">
                {filters.query && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Text: "{filters.query}"
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setFilters(prev => ({ ...prev, query: '' }))}
                    />
                  </Badge>
                )}
                {filters.types.map(type => (
                  <Badge key={type} variant="secondary" className="flex items-center gap-1">
                    Type: {type}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeFilter('types', type)}
                    />
                  </Badge>
                ))}
                {filters.studios.map(studio => (
                  <Badge key={studio} variant="secondary" className="flex items-center gap-1">
                    Studio: {studio}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeFilter('studios', studio)}
                    />
                  </Badge>
                ))}
                {filters.actors.map(actor => (
                  <Badge key={actor} variant="secondary" className="flex items-center gap-1">
                    Actor: {actor}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeFilter('actors', actor)}
                    />
                  </Badge>
                ))}
                {filters.actresses.map(actress => (
                  <Badge key={actress} variant="secondary" className="flex items-center gap-1">
                    Actress: {actress}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeFilter('actresses', actress)}
                    />
                  </Badge>
                ))}
                {filters.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    Tag: {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeFilter('tags', tag)}
                    />
                  </Badge>
                ))}
                {filters.series.map(series => (
                  <Badge key={series} variant="secondary" className="flex items-center gap-1">
                    Series: {series}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeFilter('series', series)}
                    />
                  </Badge>
                ))}
                {filters.yearFrom && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    From: {filters.yearFrom}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setFilters(prev => ({ ...prev, yearFrom: '' }))}
                    />
                  </Badge>
                )}
                {filters.yearTo && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    To: {filters.yearTo}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setFilters(prev => ({ ...prev, yearTo: '' }))}
                    />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {hasSearched && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              {isSearching ? 'Searching...' : `Found ${searchResults.length} movies`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No movies found matching your criteria.</p>
                <p className="text-sm">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {searchResults.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onClick={() => onMovieClick(movie)}
                    onActressClick={onProfileSelect ? (actressName, e) => {
                      e.stopPropagation()
                      onProfileSelect('actress', actressName)
                    } : undefined}
                    accessToken={accessToken}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}