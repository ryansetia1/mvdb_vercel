import React from 'react'
import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '../ui/card'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { FilterIndicator } from '../ui/filter-indicator'
import { ImageWithFallback } from '../figma/ImageWithFallback'
import { Search, X } from 'lucide-react'
import { Button } from '../ui/button'
import { SCMovie, scMovieApi } from '../../utils/scMovieApi'
import { movieCodeMatchesQuery } from '../../utils/masterDataApi'
import { PaginationEnhanced } from '../ui/pagination-enhanced'

interface SoftContentProps {
  searchQuery: string
  accessToken: string
  onSCMovieSelect?: (scMovie: SCMovie) => void
}

export function SoftContent({ searchQuery, accessToken, onSCMovieSelect }: SoftContentProps) {
  const [scMovies, setScMovies] = useState<SCMovie[]>([])
  const [filteredMovies, setFilteredMovies] = useState<SCMovie[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [localSearchQuery, setLocalSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(24)

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
    
    return items
  }, [effectiveSearchQuery, searchQuery])

  useEffect(() => {
    loadSCMovies()
  }, [accessToken])

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1)
  }, [effectiveSearchQuery])

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
    // Filter movies based on search query
    if (!effectiveSearchQuery.trim()) {
      setFilteredMovies(scMovies)
    } else {
      const query = effectiveSearchQuery.toLowerCase()
      const filtered = scMovies.filter(movie =>
        movie.titleEn.toLowerCase().includes(query) ||
        movie.titleJp?.toLowerCase().includes(query) ||
        movieCodeMatchesQuery(movie.hcCode, query) ||
        (movie.cast && castMatchesQueryEnhanced(movie.cast, query))
      )
      setFilteredMovies(filtered)
    }
  }, [scMovies, effectiveSearchQuery])

  const loadSCMovies = async () => {
    try {
      setIsLoading(true)
      const data = await scMovieApi.getSCMovies(accessToken)
      setScMovies(data)
    } catch (error) {
      console.error('Failed to load SC movies:', error)
      // Show empty state instead of mock data if API fails
      setScMovies([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleMovieClick = (movie: SCMovie) => {
    if (onSCMovieSelect) {
      onSCMovieSelect(movie)
    } else {
      console.log('Selected SC movie:', movie)
    }
  }

  // Calculate pagination
  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedMovies = filteredMovies.slice(startIndex, endIndex)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading Soft Content Movies...</p>
        </div>
      </div>
    )
  }

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
        onClearAll={effectiveSearchQuery && !searchQuery ? () => setLocalSearchQuery('') : undefined}
        totalResults={filteredMovies.length}
        showResultCount={true}
      />

      {/* Search Results Counter - fallback when no filters */}
      {filterItems.length === 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <span>{scMovies.length} SC movie{scMovies.length !== 1 ? 's' : ''} total</span>
          </div>
        </div>
      )}

      {/* Pagination - Top */}
      <PaginationEnhanced
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={filteredMovies.length}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(newItemsPerPage) => {
          setItemsPerPage(newItemsPerPage)
          setCurrentPage(1)
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

                {/* HC Code badge */}
                {movie.hcCode && (
                  <div className="absolute bottom-2 right-2">
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-white/90 text-black border-gray-300"
                    >
                      {movie.hcCode}
                    </Badge>
                  </div>
                )}
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
      )}
    </div>
  )
}