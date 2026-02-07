import React from 'react'
import { useState, useEffect, useMemo } from 'react'
import { useGlobalKeyboardPagination } from '../../hooks/useGlobalKeyboardPagination'
import { Card, CardContent } from '../ui/card'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { FilterIndicator } from '../ui/filter-indicator'
import { ImageWithFallback } from '../figma/ImageWithFallback'
import { CroppedImage } from '../CroppedImage'
import { Search, X, Plus, Filter, Play } from 'lucide-react'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { SCMovie, scMovieApi } from '../../utils/scMovieApi'
import { Movie } from '../../utils/movieApi'
import { movieCodeMatchesQuery } from '../../utils/masterDataApi'
import { PaginationEnhanced } from '../ui/pagination-enhanced'
import { processCoverUrl } from './movieDetail/MovieDetailHelpers'
import { toast } from 'sonner'

interface SoftContentProps {
  searchQuery: string
  accessToken: string
  onSCMovieSelect?: (scMovie: SCMovie) => void
  onMovieSelect?: (movie: any) => void
  onAddSCMovie?: () => void
  movies: Movie[]
  scMovies: SCMovie[]
  // External filter state props for preserving filters across navigation
  externalFilters?: {
    currentPage?: number
    itemsPerPage?: number
  }
  onFiltersChange?: (filters: {
    currentPage: number
    itemsPerPage: number
  }) => void
}

interface SortOption {
  key: string
  label: string
  getValue: (movie: SCMovie) => string | number
}

const sortOptions: SortOption[] = [
  { key: 'titleEn-asc', label: 'Title A-Z', getValue: (movie) => movie.titleEn?.toLowerCase() || '' },
  { key: 'titleEn-desc', label: 'Title Z-A', getValue: (movie) => movie.titleEn?.toLowerCase() || '' },
  { key: 'createdAt-desc', label: 'Date Added (Newest)', getValue: (movie) => movie.createdAt ? new Date(movie.createdAt).getTime() : 0 },
  { key: 'createdAt-asc', label: 'Date Added (Oldest)', getValue: (movie) => movie.createdAt ? new Date(movie.createdAt).getTime() : 0 },
  { key: 'releaseDate-desc', label: 'SC Release Date (Newest)', getValue: (movie) => movie.releaseDate ? new Date(movie.releaseDate).getTime() : 0 },
  { key: 'releaseDate-asc', label: 'SC Release Date (Oldest)', getValue: (movie) => movie.releaseDate ? new Date(movie.releaseDate).getTime() : 0 },
  { key: 'hcReleaseDate-desc', label: 'HC Release Date (Newest)', getValue: (movie) => movie.hcReleaseDate ? new Date(movie.hcReleaseDate).getTime() : 0 },
  { key: 'hcReleaseDate-asc', label: 'HC Release Date (Oldest)', getValue: (movie) => movie.hcReleaseDate ? new Date(movie.hcReleaseDate).getTime() : 0 },
  { key: 'cast-asc', label: 'Cast A-Z', getValue: (movie) => movie.cast?.toLowerCase() || '' },
  { key: 'cast-desc', label: 'Cast Z-A', getValue: (movie) => movie.cast?.toLowerCase() || '' },
  { key: 'hcCode-asc', label: 'HC Code A-Z', getValue: (movie) => movie.hcCode?.toLowerCase() || '' },
  { key: 'hcCode-desc', label: 'HC Code Z-A', getValue: (movie) => movie.hcCode?.toLowerCase() || '' }
]

export function SoftContent({
  searchQuery,
  accessToken,
  movies,
  scMovies,
  onSCMovieSelect,
  onMovieSelect,
  onAddSCMovie,
  externalFilters,
  onFiltersChange
}: SoftContentProps) {
  // Use external filters if provided, otherwise use local state
  const [localCurrentPage, setLocalCurrentPage] = useState(1)
  const [localItemsPerPage, setLocalItemsPerPage] = useState(24)

  // Local UI states
  const [filteredMovies, setFilteredMovies] = useState<SCMovie[]>([])
  const [localSearchQuery, setLocalSearchQuery] = useState('')
  const [hoveredHcCode, setHoveredHcCode] = useState<string | null>(null)

  // Sorting and filtering states
  const [sortBy, setSortBy] = useState('createdAt-asc')
  const [scTypeFilter, setScTypeFilter] = useState('all')
  const [englishSubsFilter, setEnglishSubsFilter] = useState('all')

  // Determine which state to use (external takes precedence)
  const currentPage = externalFilters?.currentPage ?? localCurrentPage
  const itemsPerPage = externalFilters?.itemsPerPage ?? localItemsPerPage

  // Helper function to update filters
  const updateFilters = (updates: Partial<{ currentPage: number; itemsPerPage: number }>) => {
    if (onFiltersChange) {
      const newFilters = {
        currentPage: updates.currentPage ?? currentPage,
        itemsPerPage: updates.itemsPerPage ?? itemsPerPage,
      }
      onFiltersChange(newFilters)
    } else {
      // Fallback to local state if no external handler
      if (updates.currentPage !== undefined) setLocalCurrentPage(updates.currentPage)
      if (updates.itemsPerPage !== undefined) setLocalItemsPerPage(updates.itemsPerPage)
    }
  }

  // Combine global search query with local search
  const effectiveSearchQuery = searchQuery || localSearchQuery

  // Prepare filter items for FilterIndicator
  const filterItems = useMemo(() => {
    const items: Array<{
      key: string
      label: string
      value: string
      displayValue: string
      onRemove: () => void
    }> = []

    if (effectiveSearchQuery.trim()) {
      items.push({
        key: 'search',
        label: 'Search',
        value: effectiveSearchQuery,
        displayValue: `"${effectiveSearchQuery}"`,
        onRemove: () => {
          if (searchQuery) {
            // Cannot clear global search from here
          } else {
            setLocalSearchQuery('')
          }
        }
      })
    }

    if (scTypeFilter !== 'all') {
      items.push({
        key: 'scType',
        label: 'Type',
        value: scTypeFilter,
        displayValue: scTypeFilter === 'real_cut' ? 'Real Cut' : 'Regular',
        onRemove: () => setScTypeFilter('all')
      })
    }

    if (englishSubsFilter !== 'all') {
      items.push({
        key: 'englishSubs',
        label: 'English Subs',
        value: englishSubsFilter,
        displayValue: englishSubsFilter === 'yes' ? 'Yes' : 'No',
        onRemove: () => setEnglishSubsFilter('all')
      })
    }

    return items
  }, [effectiveSearchQuery, searchQuery, scTypeFilter, englishSubsFilter])

  // Track previous filter values to only reset page when they actually change
  const prevFiltersRef = React.useRef({ effectiveSearchQuery, scTypeFilter, englishSubsFilter, sortBy })

  // Reset to page 1 when search query or filters change (but not on initial mount or when page changes)
  useEffect(() => {
    const prevFilters = prevFiltersRef.current
    const filtersChanged =
      prevFilters.effectiveSearchQuery !== effectiveSearchQuery ||
      prevFilters.scTypeFilter !== scTypeFilter ||
      prevFilters.englishSubsFilter !== englishSubsFilter ||
      prevFilters.sortBy !== sortBy

    if (filtersChanged && currentPage !== 1) {
      if (onFiltersChange) {
        onFiltersChange({ currentPage: 1, itemsPerPage })
      } else {
        setLocalCurrentPage(1)
      }
    }

    prevFiltersRef.current = { effectiveSearchQuery, scTypeFilter, englishSubsFilter, sortBy }
  }, [effectiveSearchQuery, scTypeFilter, englishSubsFilter, sortBy])

  // Helper function to check if cast matches query with reverse search capability
  const castMatchesQueryEnhanced = (cast: string, query: string): boolean => {
    const castLower = cast.toLowerCase()
    const queryLower = query.toLowerCase()

    // Direct match
    if (castLower.includes(queryLower)) return true

    // Reverse name search
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0)
    const castWords = castLower.split(/\s+/).filter(w => w.length > 0)

    if (queryWords.length >= 2 && castWords.length >= 2) {
      // Try reverse matching: if query is "hatano yui", check if cast contains "yui hatano"
      const reversedQuery = [...queryWords].reverse().join(' ')
      if (castLower.includes(reversedQuery)) return true

      // Also try partial reverse matching with individual words
      const firstQueryWord = queryWords[0]
      const lastQueryWord = queryWords[queryWords.length - 1]
      const firstName = castWords[0]
      const lastName = castWords[castWords.length - 1]

      // Check if first word of query matches last word of cast AND vice versa
      if (firstName.includes(lastQueryWord) && lastName.includes(firstQueryWord)) {
        return true
      }
    }

    return false
  }

  useEffect(() => {
    // Filter movies based on search query and other filters
    let filtered = [...scMovies]

    // Apply search filter
    if (effectiveSearchQuery.trim()) {
      const query = effectiveSearchQuery.toLowerCase()
      filtered = filtered.filter(movie =>
        movie.titleEn.toLowerCase().includes(query) ||
        movie.titleJp?.toLowerCase().includes(query) ||
        movieCodeMatchesQuery(movie.hcCode, query) ||
        (movie.cast && castMatchesQueryEnhanced(movie.cast, query))
      )
    }

    // Apply SC Type filter
    if (scTypeFilter !== 'all') {
      filtered = filtered.filter(movie => movie.scType === scTypeFilter)
    }

    // Apply English Subs filter
    if (englishSubsFilter !== 'all') {
      const hasSubs = englishSubsFilter === 'yes'
      filtered = filtered.filter(movie => movie.hasEnglishSubs === hasSubs)
    }

    // Apply sorting
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

    setFilteredMovies(filtered)
  }, [scMovies, effectiveSearchQuery, scTypeFilter, englishSubsFilter, sortBy])



  const handleMovieClick = (movie: SCMovie) => {
    if (onSCMovieSelect) {
      onSCMovieSelect(movie)
    } else {
      console.log('Selected SC movie:', movie)
    }
  }


  const clearAllFilters = () => {
    setScTypeFilter('all')
    setEnglishSubsFilter('all')
    if (!searchQuery) {
      setLocalSearchQuery('')
    }
  }

  // Calculate pagination
  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedMovies = filteredMovies.slice(startIndex, endIndex)

  // Keyboard navigation for pagination using global hook
  useGlobalKeyboardPagination(
    currentPage,
    totalPages,
    (page: number) => updateFilters({ currentPage: page }),
    'soft-content',
    true
  )

  return (
    <div className="space-y-6">
      {/* Local Search - only show if no global search is active */}
      {/* {!searchQuery && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search SC movies..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {localSearchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocalSearchQuery('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )} */}

      {/* Active Filters Indicator */}
      <FilterIndicator
        filters={filterItems}
        onClearAll={filterItems.length > 0 ? clearAllFilters : undefined}
        totalResults={filteredMovies.length}
        showResultCount={true}
      />

      {/* Sort and Filter Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Sort:</span>
        </div>

        <Select value={sortBy} onValueChange={setSortBy}>
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

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Type:</span>
        </div>

        <Select value={scTypeFilter} onValueChange={setScTypeFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="regular_censorship">Regular</SelectItem>
            <SelectItem value="real_cut">Real Cut</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">English Subs:</span>
        </div>

        <Select value={englishSubsFilter} onValueChange={setEnglishSubsFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters Button */}
        {filterItems.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearAllFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Search Results Counter - fallback when no filters */}
      {filterItems.length === 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <span>{scMovies.length} SC movie{scMovies.length !== 1 ? 's' : ''} total</span>
          </div>
          {onAddSCMovie && (
            <Button onClick={onAddSCMovie} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah SC Movie
            </Button>
          )}
        </div>
      )}

      {/* Pagination - Top */}
      <PaginationEnhanced
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={filteredMovies.length}
        onPageChange={(page) => updateFilters({ currentPage: page })}
        onItemsPerPageChange={(newItemsPerPage) => {
          updateFilters({ itemsPerPage: newItemsPerPage, currentPage: 1 })
        }}
      />

      {/* SC Movies Grid */}
      {filteredMovies.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {effectiveSearchQuery ? 'No SC movies found matching your search.' : 'No SC movies available.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {paginatedMovies.map((movie) => (
              <Card
                key={movie.id}
                className="group cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden"
                onClick={() => handleMovieClick(movie)}
              >
                <div className="aspect-[3/4] relative overflow-hidden">
                  <ImageWithFallback
                    src={movie.cover}
                    alt={movie.titleEn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />

                  {/* Badges overlay */}
                  <div className="absolute top-2 left-2 space-y-1">
                    <Badge
                      variant="secondary"
                      className="text-xs bg-black/70 text-white border-none"
                    >
                      {movie.scType === 'real_cut' ? 'Real Cut' : 'Regular'}
                    </Badge>
                    {movie.hasEnglishSubs && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-green-600/80 text-white border-none"
                      >
                        EN SUB
                      </Badge>
                    )}
                  </div>

                  {/* Play Button Overlay */}
                  {movie.scStreamingLinks && movie.scStreamingLinks.length > 0 && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-10 w-10 rounded-full bg-white dark:bg-white hover:bg-white text-zinc-900 border border-white/40 shadow-[0_4px_15px_rgba(0,0,0,0.4)] backdrop-blur-md"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          window.open(movie.scStreamingLinks[0], '_blank');
                        }}
                      >
                        <Play className="h-5 w-5 fill-zinc-900 ml-0.5" />
                      </Button>
                    </div>
                  )}

                  {/* HC Code badge */}
                  {movie.hcCode && (
                    <div className="absolute bottom-2 right-2 z-20">
                      <Badge
                        variant="outline"
                        className="text-xs bg-white/90 text-black border-gray-300 hover:bg-primary hover:text-white cursor-pointer transition-colors"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          if (onMovieSelect) {
                            onMovieSelect(movie.hcCode);
                          }
                        }}
                        onMouseEnter={() => setHoveredHcCode(movie.id || null)}
                        onMouseLeave={() => setHoveredHcCode(null)}
                      >
                        {movie.hcCode}
                      </Badge>
                    </div>
                  )}

                  {/* HC Cover Overlay (shown on HC badge hover) */}
                  {movie.hcCode && (() => {
                    const foundMovie = movies.find((m: Movie) => m.code === movie.hcCode);
                    if (foundMovie) {
                      const shouldUseCrop = foundMovie.cropCover || foundMovie.type === 'cen';
                      return (
                        <div
                          className={`absolute inset-0 z-[5] pointer-events-none transition-opacity duration-300 ease-in-out ${hoveredHcCode === movie.id ? 'opacity-100' : 'opacity-0'
                            }`}
                        >
                          {shouldUseCrop ? (
                            <CroppedImage
                              src={processCoverUrl(foundMovie)}
                              alt={foundMovie.titleEn || movie.hcCode || 'HC Cover'}
                              className="w-full h-full"
                              cropToRight={true}
                              fixedSize={false}
                            />
                          ) : (
                            <ImageWithFallback
                              src={processCoverUrl(foundMovie)}
                              alt={foundMovie.titleEn || movie.hcCode || 'HC Cover'}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <CardContent className="p-3">
                  <h3 className="font-medium text-sm line-clamp-2 mb-1">
                    {movie.titleEn}
                  </h3>
                  {movie.titleJp && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                      {movie.titleJp}
                    </p>
                  )}
                  {movie.cast && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                      {movie.cast}
                    </p>
                  )}
                  {movie.releaseDate && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(movie.releaseDate).getFullYear()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination - Bottom Right */}
          <div className="flex justify-end mt-6">
            <PaginationEnhanced
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={filteredMovies.length}
              onPageChange={(page) => updateFilters({ currentPage: page })}
              onItemsPerPageChange={(newItemsPerPage) => {
                updateFilters({ itemsPerPage: newItemsPerPage, currentPage: 1 })
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}
