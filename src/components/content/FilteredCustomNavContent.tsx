import React from 'react'
import { useState, useMemo, useEffect } from 'react'
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
import { Search, Filter, X, SortAsc, SortDesc } from 'lucide-react'
import { AdvancedSearchTest } from '../AdvancedSearchTest'
import { useGlobalKeyboardPagination } from '../../hooks/useGlobalKeyboardPagination'

interface FilteredCustomNavContentProps {
  movies: Movie[]
  searchQuery: string
  onMovieSelect: (movie: Movie) => void
  onProfileSelect?: (type: 'actor' | 'actress' | 'director', name: string) => void
  accessToken: string
  actresses?: MasterDataItem[]
  actors?: MasterDataItem[]
  directors?: MasterDataItem[]
  filterType: string
  filterValue: string
  customNavLabel: string
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
  { key: 'createdAt', label: 'Date Added (Old)', getValue: (movie) => movie.createdAt || '' },
  { key: 'createdAt-desc', label: 'Date Added (New)', getValue: (movie) => movie.createdAt || '' },
  { key: 'actress', label: 'Actress (A-Z)', getValue: (movie) => movie.actress?.toLowerCase() || '' },
  { key: 'actress-desc', label: 'Actress (Z-A)', getValue: (movie) => movie.actress?.toLowerCase() || '' },
]

export function FilteredCustomNavContent({ 
  movies, 
  searchQuery, 
  onMovieSelect, 
  onProfileSelect, 
  accessToken, 
  actresses = [], 
  actors = [], 
  directors = [],
  filterType,
  filterValue,
  customNavLabel,
  externalFilters,
  onFiltersChange
}: FilteredCustomNavContentProps) {
  
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

  // First filter by the custom nav filter (e.g., Taku Yoshimura)
  const customNavFilteredMovies = useMemo(() => {
    return movies.filter(movie => {
      switch (filterType) {
        case 'actress':
          return movie.actress?.toLowerCase().includes(filterValue.toLowerCase())
        case 'actor':
          return movie.actors?.toLowerCase().includes(filterValue.toLowerCase())
        case 'director':
          return movie.director?.toLowerCase().includes(filterValue.toLowerCase())
        case 'series':
          return movie.series === filterValue
        case 'studio':
          return movie.studio === filterValue
        case 'tag':
          const movieTags = movie.tags ? movie.tags.split(',').map(tag => tag.trim()) : []
          return movieTags.some(tag => tag.toLowerCase().includes(filterValue.toLowerCase()))
        case 'type':
          return movie.type === filterValue
        case 'group':
          // Filter movies by actresses in the selected group
          if (!movie.actress) return false
          const movieActresses = movie.actress.split(',').map(name => name.trim().toLowerCase())
          return actresses.some(actress => 
            actress.groupName === filterValue &&
            movieActresses.some(movieActress => 
              movieActress.includes(actress.name?.toLowerCase() || '')
            )
          )
        default:
          return false
      }
    })
  }, [movies, filterType, filterValue, actresses])

  // Then apply additional filters and search
  const filteredAndSortedMovies = useMemo(() => {
    let filtered = [...customNavFilteredMovies]

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(movie => {
        return (
          movie.titleEn?.toLowerCase().includes(query) ||
          movie.titleJp?.toLowerCase().includes(query) ||
          movieCodeMatchesQuery(movie.code, query) ||
          movieCodeMatchesQuery(movie.dmcode, query) ||
          castMatchesQuery(movie.actress, query) ||
          castMatchesQuery(movie.actors, query) ||
          castMatchesQuery(movie.director, query) ||
          movie.studio?.toLowerCase().includes(query) ||
          movie.series?.toLowerCase().includes(query) ||
          movie.tags?.toLowerCase().includes(query) ||
          movie.label?.toLowerCase().includes(query)
        )
      })
    }

    // Apply tag filter
    if (tagFilter !== 'all') {
      filtered = filtered.filter(movie => {
        const movieTags = movie.tags ? movie.tags.split(',').map(tag => tag.trim()) : []
        return movieTags.some(tag => tag.toLowerCase() === tagFilter.toLowerCase())
      })
    }

    // Apply studio filter
    if (studioFilter !== 'all') {
      filtered = filtered.filter(movie => movie.studio === studioFilter)
    }

    // Apply series filter
    if (seriesFilter !== 'all') {
      filtered = filtered.filter(movie => movie.series === seriesFilter)
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(movie => movie.type === typeFilter)
    }

    // Apply sorting
    const selectedSortOption = sortOptions.find(option => option.key === sortBy)
    if (selectedSortOption) {
      filtered.sort((a, b) => {
        const aValue = selectedSortOption.getValue(a)
        const bValue = selectedSortOption.getValue(b)
        
        if (sortBy.includes('-desc')) {
          return bValue > aValue ? 1 : bValue < aValue ? -1 : 0
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
        }
      })
    }

    return filtered
  }, [customNavFilteredMovies, searchQuery, tagFilter, studioFilter, seriesFilter, typeFilter, sortBy])

  // Get unique values for filter dropdowns
  const uniqueTags = useMemo(() => {
    const tags = new Set<string>()
    customNavFilteredMovies.forEach(movie => {
      if (movie.tags) {
        movie.tags.split(',').forEach(tag => {
          const trimmedTag = tag.trim()
          if (trimmedTag) tags.add(trimmedTag)
        })
      }
    })
    return Array.from(tags).sort()
  }, [customNavFilteredMovies])

  const uniqueStudios = useMemo(() => {
    const studios = new Set<string>()
    customNavFilteredMovies.forEach(movie => {
      if (movie.studio) studios.add(movie.studio)
    })
    return Array.from(studios).sort()
  }, [customNavFilteredMovies])

  const uniqueSeries = useMemo(() => {
    const series = new Set<string>()
    customNavFilteredMovies.forEach(movie => {
      if (movie.series) series.add(movie.series)
    })
    return Array.from(series).sort()
  }, [customNavFilteredMovies])

  const uniqueTypes = useMemo(() => {
    const types = new Set<string>()
    customNavFilteredMovies.forEach(movie => {
      if (movie.type) types.add(movie.type)
    })
    return Array.from(types).sort()
  }, [customNavFilteredMovies])

  // Update filters function
  const updateFilters = (updates: Partial<{
    tagFilter: string
    studioFilter: string
    seriesFilter: string
    typeFilter: string
    sortBy: string
    currentPage: number
    itemsPerPage: number
  }>) => {
    if (updates.tagFilter !== undefined) {
      if (externalFilters) {
        onFiltersChange?.({ ...externalFilters, ...updates, currentPage: 1 })
      } else {
        setLocalTagFilter(updates.tagFilter)
        setLocalCurrentPage(1)
      }
    }
    if (updates.studioFilter !== undefined) {
      if (externalFilters) {
        onFiltersChange?.({ ...externalFilters, ...updates, currentPage: 1 })
      } else {
        setLocalStudioFilter(updates.studioFilter)
        setLocalCurrentPage(1)
      }
    }
    if (updates.seriesFilter !== undefined) {
      if (externalFilters) {
        onFiltersChange?.({ ...externalFilters, ...updates, currentPage: 1 })
      } else {
        setLocalSeriesFilter(updates.seriesFilter)
        setLocalCurrentPage(1)
      }
    }
    if (updates.typeFilter !== undefined) {
      if (externalFilters) {
        onFiltersChange?.({ ...externalFilters, ...updates, currentPage: 1 })
      } else {
        setLocalTypeFilter(updates.typeFilter)
        setLocalCurrentPage(1)
      }
    }
    if (updates.sortBy !== undefined) {
      if (externalFilters) {
        onFiltersChange?.({ ...externalFilters, ...updates, currentPage: 1 })
      } else {
        setLocalSortBy(updates.sortBy)
        setLocalCurrentPage(1)
      }
    }
    if (updates.currentPage !== undefined) {
      if (externalFilters) {
        onFiltersChange?.({ ...externalFilters, ...updates })
      } else {
        setLocalCurrentPage(updates.currentPage)
      }
    }
    if (updates.itemsPerPage !== undefined) {
      if (externalFilters) {
        onFiltersChange?.({ ...externalFilters, ...updates, currentPage: 1 })
      } else {
        setLocalItemsPerPage(updates.itemsPerPage)
        setLocalCurrentPage(1)
      }
    }
  }

  // Clear all filters
  const clearFilters = () => {
    updateFilters({
      tagFilter: 'all',
      studioFilter: 'all',
      seriesFilter: 'all',
      typeFilter: 'all',
      sortBy: 'releaseDate-desc',
      currentPage: 1
    })
  }

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedMovies.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const moviesToShow = filteredAndSortedMovies.slice(startIndex, endIndex)

  // Keyboard navigation for pagination using global hook
  useGlobalKeyboardPagination(
    currentPage,
    totalPages,
    (page: number) => updateFilters({ currentPage: page }),
    'filtered-custom-nav-content',
    true
  )

  // Randomize function
  const handleRandomize = () => {
    const shuffled = [...filteredAndSortedMovies].sort(() => Math.random() - 0.5)
    setRandomMovies(shuffled)
    setIsRandomized(true)
  }

  const handleResetRandom = () => {
    setRandomMovies([])
    setIsRandomized(false)
  }

  // Get movies to display (randomized or normal)
  const displayMovies = isRandomized ? randomMovies : moviesToShow

  // Check if there are active filters
  const hasActiveFilters = tagFilter !== 'all' || studioFilter !== 'all' || seriesFilter !== 'all' || typeFilter !== 'all'

  // Filter items for indicator
  const filterItems = [
    ...(tagFilter !== 'all' ? [{ 
      key: 'tag', 
      label: 'Tag', 
      value: tagFilter,
      onRemove: () => updateFilters({ tagFilter: 'all', currentPage: 1 })
    }] : []),
    ...(studioFilter !== 'all' ? [{ 
      key: 'studio', 
      label: 'Studio', 
      value: studioFilter,
      onRemove: () => updateFilters({ studioFilter: 'all', currentPage: 1 })
    }] : []),
    ...(seriesFilter !== 'all' ? [{ 
      key: 'series', 
      label: 'Series', 
      value: seriesFilter,
      onRemove: () => updateFilters({ seriesFilter: 'all', currentPage: 1 })
    }] : []),
    ...(typeFilter !== 'all' ? [{ 
      key: 'type', 
      label: 'Type', 
      value: typeFilter,
      onRemove: () => updateFilters({ typeFilter: 'all', currentPage: 1 })
    }] : [])
  ]

  return (
    <div className="space-y-6">
      {/* Header with custom nav info */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{customNavLabel}</h1>
          <p className="text-muted-foreground">
            Showing {filteredAndSortedMovies.length} movies for {filterType}: {filterValue}
          </p>
        </div>
      </div>


      {/* Advanced Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        <Select value={tagFilter} onValueChange={(value) => updateFilters({ tagFilter: value })}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Tags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            {uniqueTags.map(tag => (
              <SelectItem key={tag} value={tag}>{tag}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={studioFilter} onValueChange={(value) => updateFilters({ studioFilter: value })}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Studios" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Studios</SelectItem>
            {uniqueStudios.map(studio => (
              <SelectItem key={studio} value={studio}>{studio}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={seriesFilter} onValueChange={(value) => updateFilters({ seriesFilter: value })}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Series" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Series</SelectItem>
            {uniqueSeries.map(series => (
              <SelectItem key={series} value={series}>{series}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={(value) => updateFilters({ typeFilter: value })}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {uniqueTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value) => updateFilters({ sortBy: value })}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map(option => (
              <SelectItem key={option.key} value={option.key}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tombol Randomize di pojok kanan */}
        <div className="ml-auto flex gap-2">
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
        {displayMovies.map((movie) => (
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

      {/* Pagination - Bottom */}
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
    </div>
  )
}
