import React from 'react'
import { useState, useMemo, useEffect } from 'react'
import { useGlobalKeyboardPagination } from '../../hooks/useGlobalKeyboardPagination'
import { Movie } from '../../utils/movieApi'
import { MasterDataItem, castMatchesQuery, movieCodeMatchesQuery } from '../../utils/masterDataApi'
import { MovieCard } from '../MovieCard'
import { PaginationEnhanced } from '../ui/pagination-enhanced'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { SearchableFilterSelect } from '../ui/searchable-filter-select'
import { VirtualizedFilterSelect } from '../ui/virtualized-filter-select'
import { Badge } from '../ui/badge'
import { FilterIndicator } from '../ui/filter-indicator'
import { Search, Filter, X, SortAsc, SortDesc, Plus, FileText } from 'lucide-react'
import { AdvancedSearchTest } from '../AdvancedSearchTest'

interface MoviesContentProps {
  movies: Movie[]
  searchQuery: string
  onMovieSelect: (movie: Movie) => void
  onProfileSelect?: (type: 'actor' | 'actress' | 'director', name: string) => void
  accessToken: string
  actresses?: MasterDataItem[]
  actors?: MasterDataItem[]
  directors?: MasterDataItem[]
  // External filter state props for preserving filters across navigation
  externalFilters?: {
    tagFilter?: string
    studioFilter?: string 
    seriesFilter?: string
    typeFilter?: string
    sortBy?: string
    currentPage?: number
    itemsPerPage?: number
  }
  onFiltersChange?: (filters: {
    tagFilter: string
    studioFilter: string
    seriesFilter: string
    typeFilter: string
    sortBy: string
    currentPage: number
    itemsPerPage: number
  }) => void
  // Admin action handlers
  onAddMovie?: () => void
  onParseMovie?: () => void
}

interface SortOption {
  key: string
  label: string
  getValue: (movie: Movie) => any
}

const sortOptions: SortOption[] = [
  { key: 'titleEn', label: 'Title (A-Z)', getValue: (movie) => movie.titleEn?.toLowerCase() || '' },
  { key: 'titleEn-desc', label: 'Title (Z-A)', getValue: (movie) => movie.titleEn?.toLowerCase() || '' },
  { key: 'releaseDate', label: 'Release Date (Old)', getValue: (movie) => movie.releaseDate || '' },
  { key: 'releaseDate-desc', label: 'Release Date (New)', getValue: (movie) => movie.releaseDate || '' },
  { key: 'actress', label: 'Actress (A-Z)', getValue: (movie) => movie.actress?.toLowerCase() || '' },
  { key: 'actress-desc', label: 'Actress (Z-A)', getValue: (movie) => movie.actress?.toLowerCase() || '' },
]

export function MoviesContent({ 
  movies, 
  searchQuery, 
  onMovieSelect, 
  onProfileSelect, 
  accessToken, 
  actresses = [], 
  actors = [], 
  directors = [],
  externalFilters,
  onFiltersChange,
  onAddMovie,
  onParseMovie
}: MoviesContentProps) {
  // Use external filters if provided, otherwise use local state
  const [localCurrentPage, setLocalCurrentPage] = useState(1)
  const [localItemsPerPage, setLocalItemsPerPage] = useState(24)
  const [localSortBy, setLocalSortBy] = useState('releaseDate-desc')
  const [localTagFilter, setLocalTagFilter] = useState('all')
  const [localStudioFilter, setLocalStudioFilter] = useState('all')
  const [localSeriesFilter, setLocalSeriesFilter] = useState('all')
  const [localTypeFilter, setLocalTypeFilter] = useState('all')
  const [isRandomized, setIsRandomized] = useState(false)
  const [randomMovies, setRandomMovies] = useState<Movie[]>([])

  // Determine which state to use
  const currentPage = externalFilters?.currentPage ?? localCurrentPage
  const itemsPerPage = externalFilters?.itemsPerPage ?? localItemsPerPage
  const sortBy = externalFilters?.sortBy ?? localSortBy
  const tagFilter = externalFilters?.tagFilter ?? localTagFilter
  const studioFilter = externalFilters?.studioFilter ?? localStudioFilter
  const seriesFilter = externalFilters?.seriesFilter ?? localSeriesFilter
  const typeFilter = externalFilters?.typeFilter ?? localTypeFilter

  // Helper function to update filters
  const updateFilters = (updates: Partial<{
    tagFilter: string
    studioFilter: string
    seriesFilter: string
    typeFilter: string
    sortBy: string
    currentPage: number
    itemsPerPage: number
  }>) => {
    if (onFiltersChange) {
      onFiltersChange({
        tagFilter,
        studioFilter,
        seriesFilter,
        typeFilter,
        sortBy,
        currentPage,
        itemsPerPage,
        ...updates
      })
    } else {
      // Fallback to local state if no external handler
      if (updates.tagFilter !== undefined) setLocalTagFilter(updates.tagFilter)
      if (updates.studioFilter !== undefined) setLocalStudioFilter(updates.studioFilter)
      if (updates.seriesFilter !== undefined) setLocalSeriesFilter(updates.seriesFilter)
      if (updates.typeFilter !== undefined) setLocalTypeFilter(updates.typeFilter)
      if (updates.sortBy !== undefined) setLocalSortBy(updates.sortBy)
      if (updates.currentPage !== undefined) setLocalCurrentPage(updates.currentPage)
      if (updates.itemsPerPage !== undefined) setLocalItemsPerPage(updates.itemsPerPage)
    }
  }

  // Helper function to check if a name matches query with reverse search capability
  const nameMatchesQuery = (name: string, query: string): boolean => {
    const nameLower = name.toLowerCase()
    const queryLower = query.toLowerCase()
    
    // Direct match
    if (nameLower.includes(queryLower)) return true
    
    // Reverse name search for fallback when not in master data
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0)
    const nameWords = nameLower.split(/\s+/).filter(w => w.length > 0)
    
    if (queryWords.length >= 2 && nameWords.length >= 2) {
      // Try reverse matching: if query is "hatano yui", check if name contains "yui hatano"
      const reversedQuery = [...queryWords].reverse().join(' ')
      if (nameLower.includes(reversedQuery)) return true
      
      // Also try partial reverse matching with individual words
      const firstQueryWord = queryWords[0]
      const lastQueryWord = queryWords[queryWords.length - 1]
      const firstName = nameWords[0]
      const lastName = nameWords[nameWords.length - 1]
      
      // Check if first word of query matches last word of name AND vice versa
      if (firstName.includes(lastQueryWord) && lastName.includes(firstQueryWord)) {
        return true
      }
    }
    
    return false
  }

  // Helper function to check if a movie contains a cast member that matches the search query
  const movieContainsCastWithQuery = (movie: Movie, query: string): boolean => {
    if (!query || !query.trim()) return true
    
    // Check actress
    if (movie.actress) {
      const actressNames = movie.actress.split(',').map(name => name.trim())
      for (const actressName of actressNames) {
        const actress = actresses.find(a => a.name === actressName)
        if (actress && castMatchesQuery(actress, query)) {
          return true
        }
        // Fallback with enhanced name matching if actress not found in master data
        if (nameMatchesQuery(actressName, query)) {
          return true
        }
      }
    }
    
    // Check actors
    if (movie.actors) {
      const actorNames = movie.actors.split(',').map(name => name.trim())
      for (const actorName of actorNames) {
        const actor = actors.find(a => a.name === actorName)
        if (actor && castMatchesQuery(actor, query)) {
          return true
        }
        // Fallback with enhanced name matching if actor not found in master data
        if (nameMatchesQuery(actorName, query)) {
          return true
        }
      }
    }
    
    // Check director
    if (movie.director) {
      const director = directors.find(d => d.name === movie.director)
      if (director && castMatchesQuery(director, query)) {
        return true
      }
      // Fallback with enhanced name matching if director not found in master data
      if (nameMatchesQuery(movie.director, query)) {
        return true
      }
    }
    
    return false
  }

  // Get unique tags, studios, series, and types for filters
  const { allTags, allStudios, allSeries, allTypes } = useMemo(() => {
    const tags = new Set<string>()
    const studios = new Set<string>()
    const series = new Set<string>()
    const types = new Set<string>()

    movies.forEach(movie => {
      if (movie.tags) {
        movie.tags.split(',').forEach(tag => tags.add(tag.trim()))
      }
      if (movie.studio) studios.add(movie.studio)
      if (movie.series) series.add(movie.series)
      if (movie.type) types.add(movie.type)
    })

    return {
      allTags: Array.from(tags).sort(),
      allStudios: Array.from(studios).sort(),
      allSeries: Array.from(series).sort(),
      allTypes: Array.from(types).sort()
    }
  }, [movies])

  const filteredAndSortedMovies = useMemo(() => {
    let filtered = movies

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(movie =>
        movie.titleEn?.toLowerCase().includes(query) ||
        movie.titleJp?.toLowerCase().includes(query) ||
        movieCodeMatchesQuery(movie.code, query) ||
        movieCodeMatchesQuery(movie.dmcode, query) ||
        movie.studio?.toLowerCase().includes(query) ||
        movie.series?.toLowerCase().includes(query) ||
        movie.tags?.toLowerCase().includes(query) ||
        movieContainsCastWithQuery(movie, query)
      )
    }

    // Tag filter
    if (tagFilter !== 'all') {
      filtered = filtered.filter(movie => 
        movie.tags?.split(',').some(tag => tag.trim() === tagFilter)
      )
    }

    // Studio filter
    if (studioFilter !== 'all') {
      filtered = filtered.filter(movie => movie.studio === studioFilter)
    }

    // Series filter
    if (seriesFilter !== 'all') {
      filtered = filtered.filter(movie => movie.series === seriesFilter)
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(movie => movie.type === typeFilter)
    }

    // Sort
    const sortOption = sortOptions.find(option => option.key === sortBy)
    if (sortOption) {
      const isDesc = sortBy.endsWith('-desc')
      filtered.sort((a, b) => {
        const aVal = sortOption.getValue(a)
        const bVal = sortOption.getValue(b)
        
        if (aVal < bVal) return isDesc ? 1 : -1
        if (aVal > bVal) return isDesc ? -1 : 1
        return 0
      })
    }

    return filtered
  }, [movies, searchQuery, tagFilter, studioFilter, seriesFilter, typeFilter, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedMovies.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedMovies = filteredAndSortedMovies.slice(startIndex, startIndex + itemsPerPage)

  // Fungsi shuffle array
  function shuffleArray(array: Movie[]) {
    const arr = [...array]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }

  // Handler randomize
  const handleRandomize = () => {
    setRandomMovies(shuffleArray(filteredAndSortedMovies))
    setIsRandomized(true)
    // Reset ke halaman pertama setiap kali randomize
    updateFilters({ currentPage: 1 })
  }
  // Handler reset
  const handleResetRandom = () => {
    setIsRandomized(false)
    setRandomMovies([])
    updateFilters({ currentPage: 1 })
  }

  // Reset randomization when searchQuery changes
  useEffect(() => {
    if (searchQuery.trim()) {
      setIsRandomized(false)
      setRandomMovies([])
    }
  }, [searchQuery])

  // Keyboard navigation for pagination using global hook
  useGlobalKeyboardPagination(
    currentPage,
    totalPages,
    (page: number) => {
      updateFilters({ currentPage: page })
      // Scroll to top of the page for better UX
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    'movies-content',
    true
  )

  // Reset to first page when filters change
  const handleFilterChange = (filterType: string, value: string) => {
    const updates: any = { currentPage: 1 }
    
    switch (filterType) {
      case 'tag':
        updates.tagFilter = value
        break
      case 'studio':
        updates.studioFilter = value
        break
      case 'series':
        updates.seriesFilter = value
        break
      case 'type':
        updates.typeFilter = value
        break
    }
    
    updateFilters(updates)
    // Reset randomization when filters change
    setIsRandomized(false)
    setRandomMovies([])
  }

  const clearFilters = () => {
    updateFilters({
      tagFilter: 'all',
      studioFilter: 'all',
      seriesFilter: 'all',
      typeFilter: 'all',
      currentPage: 1
    })
    // Reset randomization when clearing filters
    setIsRandomized(false)
    setRandomMovies([])
  }

  const hasActiveFilters = tagFilter !== 'all' || studioFilter !== 'all' || seriesFilter !== 'all' || typeFilter !== 'all'

  // Prepare filter items for FilterIndicator
  const filterItems = useMemo(() => {
    const items = []
    
    if (tagFilter !== 'all') {
      items.push({
        key: 'tag',
        label: 'Tag',
        value: tagFilter,
        onRemove: () => updateFilters({ tagFilter: 'all', currentPage: 1 })
      })
    }
    
    if (studioFilter !== 'all') {
      items.push({
        key: 'studio',
        label: 'Studio',
        value: studioFilter,
        onRemove: () => updateFilters({ studioFilter: 'all', currentPage: 1 })
      })
    }
    
    if (seriesFilter !== 'all') {
      items.push({
        key: 'series',
        label: 'Series',
        value: seriesFilter,
        onRemove: () => updateFilters({ seriesFilter: 'all', currentPage: 1 })
      })
    }
    
    if (typeFilter !== 'all') {
      items.push({
        key: 'type',
        label: 'Type',
        value: typeFilter,
        onRemove: () => updateFilters({ typeFilter: 'all', currentPage: 1 })
      })
    }
    
    return items
  }, [tagFilter, studioFilter, seriesFilter, typeFilter])

  if (filteredAndSortedMovies.length === 0) {
    return (
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <Select value={tagFilter} onValueChange={(value) => handleFilterChange('tag', value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {allTags.map(tag => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={studioFilter} onValueChange={(value) => handleFilterChange('studio', value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Studios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Studios</SelectItem>
              {allStudios.map(studio => (
                <SelectItem key={studio} value={studio}>{studio}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={seriesFilter} onValueChange={(value) => handleFilterChange('series', value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Series" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Series</SelectItem>
              {allSeries.map(series => (
                <SelectItem key={series} value={series}>{series}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={(value) => handleFilterChange('type', value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {allTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => updateFilters({ sortBy: value })}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.key} value={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>

        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground">
            {searchQuery ? `No movies found for "${searchQuery}"` : 'No movies match the current filters'}
          </p>
          
          {/* Admin Action Buttons untuk empty state */}
          <div className="flex justify-center gap-2">
            {onAddMovie && (
              <Button variant="outline" size="sm" onClick={onAddMovie}>
                <Plus className="h-4 w-4 mr-2" />
                Movie
              </Button>
            )}
            {onParseMovie && (
              <Button variant="outline" size="sm" onClick={onParseMovie}>
                <FileText className="h-4 w-4 mr-2" />
                Parse Movie
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Ganti paginatedMovies agar pakai randomMovies jika randomized
  const moviesToShow = isRandomized ? randomMovies.slice(startIndex, startIndex + itemsPerPage) : paginatedMovies

  return (
    <div className="space-y-6">
      {/* Filters and Sort */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg relative">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        
        {/* Use VirtualizedFilterSelect for large datasets, SearchableFilterSelect for smaller ones */}
        {allTags.length > 100 ? (
          <VirtualizedFilterSelect
            value={tagFilter}
            onValueChange={(value) => handleFilterChange('tag', value)}
            options={allTags}
            placeholder="All Tags"
            allLabel="All Tags"
            className="w-40"
          />
        ) : (
          <SearchableFilterSelect
            value={tagFilter}
            onValueChange={(value) => handleFilterChange('tag', value)}
            options={allTags}
            placeholder="All Tags"
            allLabel="All Tags"
            className="w-40"
          />
        )}

        {allStudios.length > 100 ? (
          <VirtualizedFilterSelect
            value={studioFilter}
            onValueChange={(value) => handleFilterChange('studio', value)}
            options={allStudios}
            placeholder="All Studios"
            allLabel="All Studios"
            className="w-40"
          />
        ) : (
          <SearchableFilterSelect
            value={studioFilter}
            onValueChange={(value) => handleFilterChange('studio', value)}
            options={allStudios}
            placeholder="All Studios"
            allLabel="All Studios"
            className="w-40"
          />
        )}

        {allSeries.length > 100 ? (
          <VirtualizedFilterSelect
            value={seriesFilter}
            onValueChange={(value) => handleFilterChange('series', value)}
            options={allSeries}
            placeholder="All Series"
            allLabel="All Series"
            className="w-40"
          />
        ) : (
          <SearchableFilterSelect
            value={seriesFilter}
            onValueChange={(value) => handleFilterChange('series', value)}
            options={allSeries}
            placeholder="All Series"
            allLabel="All Series"
            className="w-40"
          />
        )}

        {allTypes.length > 100 ? (
          <VirtualizedFilterSelect
            value={typeFilter}
            onValueChange={(value) => handleFilterChange('type', value)}
            options={allTypes}
            placeholder="All Types"
            allLabel="All Types"
            className="w-40"
          />
        ) : (
          <SearchableFilterSelect
            value={typeFilter}
            onValueChange={(value) => handleFilterChange('type', value)}
            options={allTypes}
            placeholder="All Types"
            allLabel="All Types"
            className="w-40"
          />
        )}

        <Select value={sortBy} onValueChange={(value) => updateFilters({ sortBy: value })}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map(option => (
              <SelectItem key={option.key} value={option.key}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tombol Admin Actions dan Randomize di pojok kanan */}
        <div className="ml-auto flex gap-2">
          {/* Admin Action Buttons */}
          {onAddMovie && (
            <Button variant="outline" size="sm" onClick={onAddMovie}>
              <Plus className="h-4 w-4 mr-2" />
              Movie
            </Button>
          )}
          {onParseMovie && (
            <Button variant="outline" size="sm" onClick={onParseMovie}>
              <FileText className="h-4 w-4 mr-2" />
              Parse Movie
            </Button>
          )}
          
          {/* Randomize Buttons */}
          {isRandomized && (
            <Button variant="outline" size="sm" onClick={handleResetRandom}>
              Reset
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleRandomize}>
            Randomize
          </Button>
        </div>

        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filters Indicator */}
      <FilterIndicator
        filters={filterItems}
        onClearAll={clearFilters}
        totalResults={filteredAndSortedMovies.length}
        showResultCount={true}
      />



      {/* Pagination - Top */}
      <PaginationEnhanced
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={filteredAndSortedMovies.length}
        onPageChange={(page) => updateFilters({ currentPage: page })}
        onItemsPerPageChange={(newItemsPerPage) => {
          updateFilters({ 
            itemsPerPage: newItemsPerPage, 
            currentPage: 1 
          })
        }}
      />

      {/* Movies Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {moviesToShow.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onClick={() => onMovieSelect(movie)}
            onActressClick={onProfileSelect ? (actressName, e) => {
              e.stopPropagation()
              onProfileSelect('actress', actressName)
            } : undefined}
            accessToken={accessToken}
          />
        ))}
      </div>
    </div>
  )
}