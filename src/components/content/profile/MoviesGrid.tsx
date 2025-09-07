import React, { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { getTypeColorClasses, getTypeColorStyles } from '../../../utils/movieTypeColors'
import { MovieThumbnail } from '../../MovieThumbnail'
import { SCMovieThumbnail } from '../../SCMovieThumbnail'
import { Movie } from '../../../utils/movieApi'
import { SCMovie, scMovieApi } from '../../../utils/scMovieApi'
import { MasterDataItem, calculateAgeAtDate, masterDataApi } from '../../../utils/masterDataApi'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs'
import { SearchableSelect } from '../../SearchableSelect'
import { SimpleFavoriteButton } from '../../SimpleFavoriteButton'
import { Button } from '../../ui/button'
import { Film, ArrowUpDown, ArrowUp, ArrowDown, SortAsc, SortDesc, Heart, Tag, Building, Clapperboard, Tags, ArrowLeft, PlayCircle } from 'lucide-react'

interface MoviesGridProps {
  movies: Movie[]
  name: string
  profile: MasterDataItem | null
  onMovieSelect: (movie: Movie) => void
  onSCMovieSelect?: (scMovieId: string) => void
  onFilterSelect?: (filterType: string, filterValue: string, title?: string) => void
  accessToken?: string
  collaborationInfo?: {
    actorName: string
    actressName: string
  }
}

interface SeriesInfo {
  name: string
  movieCount: number
  firstMovie: Movie
}

export function MoviesGrid({ movies, name, profile, onMovieSelect, onSCMovieSelect, onFilterSelect, accessToken, collaborationInfo }: MoviesGridProps) {
  const [sortBy, setSortBy] = useState<string>('releaseDate_desc')
  const [activeTab, setActiveTab] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStudio, setSelectedStudio] = useState<string>('all')
  const [selectedSeries, setSelectedSeries] = useState<string>('all')
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [showSeriesGrid, setShowSeriesGrid] = useState<boolean>(true) // Control series grid vs filtered movies view
  const [scMovies, setSCMovies] = useState<SCMovie[]>([])
  const [scMoviesLoading, setSCMoviesLoading] = useState(false)
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage, setItemsPerPage] = useState<number>(24)
  // Cast master data for age-gap calculation
  const [allActresses, setAllActresses] = useState<MasterDataItem[]>([])
  const [allActors, setAllActors] = useState<MasterDataItem[]>([])

  // Get current sort label for display
  const getSortLabel = (value: string) => {
    switch (value) {
      case 'releaseDate_desc': return 'Release Date (Newest)'
      case 'releaseDate_asc': return 'Release Date (Oldest)'
      case 'title_asc': return 'Title (A-Z)'
      case 'title_desc': return 'Title (Z-A)'
      case 'code_asc': return 'Code (A-Z)'
      case 'code_desc': return 'Code (Z-A)'
      case 'age_asc': return 'Age (Youngest)'
      case 'age_desc': return 'Age (Oldest)'
      case 'ageGapMax_desc': return 'Age Gap (Largest)'
      case 'ageGapMax_asc': return 'Age Gap (Smallest)'
      default: return 'Sort by...'
    }
  }

  // Extract unique metadata values from movies
  const metadataValues = useMemo(() => {
    const types = new Set<string>()
    const studios = new Set<string>()
    const series = new Set<string>()
    const tags = new Set<string>()
    
    movies.forEach(movie => {
      if (movie.type) types.add(movie.type)
      if (movie.studio) studios.add(movie.studio)
      if (movie.series) series.add(movie.series)
      if (movie.tags) {
        movie.tags.split(',').forEach(tag => {
          const trimmedTag = tag.trim()
          if (trimmedTag) tags.add(trimmedTag)
        })
      }
    })
    
    return {
      types: Array.from(types).sort(),
      studios: Array.from(studios).sort(),
      series: Array.from(series).sort(),
      tags: Array.from(tags).sort()
    }
  }, [movies])

  // Create series data for card-based display
  const seriesData = useMemo(() => {
    const seriesMap = new Map<string, Movie[]>()
    
    movies.forEach(movie => {
      if (movie.series) {
        if (!seriesMap.has(movie.series)) {
          seriesMap.set(movie.series, [])
        }
        seriesMap.get(movie.series)!.push(movie)
      }
    })
    
    const seriesInfo: SeriesInfo[] = []
    
    seriesMap.forEach((seriesMovies, seriesName) => {
      // Sort by release date to get the first movie
      const sortedMovies = [...seriesMovies].sort((a, b) => {
        if (!a.releaseDate && !b.releaseDate) return 0
        if (!a.releaseDate) return 1
        if (!b.releaseDate) return -1
        return new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
      })
      
      const firstMovie = sortedMovies[0]
      
      seriesInfo.push({
        name: seriesName,
        movieCount: seriesMovies.length,
        firstMovie
      })
    })
    
    return seriesInfo.sort((a, b) => a.name.localeCompare(b.name))
  }, [movies])

  // Check if this is an actress profile for showing Takufied tab
  const isActressProfile = profile?.type === 'actress'

  // Fetch SC Movies when component mounts
  useEffect(() => {
    const fetchSCMovies = async () => {
      if (!accessToken) return
      
      try {
        setSCMoviesLoading(true)
        const allSCMovies = await scMovieApi.getSCMovies(accessToken)
        setSCMovies(allSCMovies)
      } catch (error) {
        console.error('Error fetching SC movies:', error)
        setSCMovies([])
      } finally {
        setSCMoviesLoading(false)
      }
    }

    fetchSCMovies()
  }, [accessToken])

  // Load master data for cast (for age-gap per movie)
  useEffect(() => {
    const loadCast = async () => {
      try {
        if (accessToken) {
          const [actresses, actors] = await Promise.all([
            masterDataApi.getByType('actress', accessToken).catch(() => []),
            masterDataApi.getByType('actor', accessToken).catch(() => [])
          ])
          setAllActresses(Array.isArray(actresses) ? actresses : [])
          setAllActors(Array.isArray(actors) ? actors : [])
        }
      } catch {
        // ignore silently for UI resilience
      }
    }
    loadCast()
  }, [accessToken])

  // Filter SC Movies that feature this person
  const personSCMovies = useMemo(() => {
    if (!scMovies.length) return []
    
    const personName = name.toLowerCase()
    return scMovies.filter(scMovie => {
      if (!scMovie.cast) return false
      const castLower = scMovie.cast.toLowerCase()
      return castLower.includes(personName)
    })
  }, [scMovies, name])

  // Filter movies based on active tab and selected filters
  const filteredMovies = useMemo(() => {
    let filtered = movies

    switch (activeTab) {
      case 'all':
        filtered = movies
        break
      case 'takufied':
        if (isActressProfile) {
          filtered = movies.filter(movie => {
            const actors = movie.actors ? movie.actors.toLowerCase() : ''
            const director = movie.director ? movie.director.toLowerCase() : ''
            return actors.includes('taku yoshimura') || director.includes('taku yoshimura')
          })
        }
        break
      case 'type':
        if (selectedType && selectedType !== 'all') {
          filtered = movies.filter(movie => movie.type === selectedType)
        } else {
          filtered = movies.filter(movie => movie.type) // Show all movies with any type
        }
        break
      case 'studio':
        if (selectedStudio && selectedStudio !== 'all') {
          filtered = movies.filter(movie => movie.studio === selectedStudio)
        } else {
          filtered = movies.filter(movie => movie.studio) // Show all movies with any studio
        }
        break
      case 'series':
        if (!showSeriesGrid && selectedSeries && selectedSeries !== 'all') {
          // When viewing filtered movies for a specific series
          filtered = movies.filter(movie => movie.series === selectedSeries)
        } else if (selectedSeries && selectedSeries !== 'all') {
          // When using dropdown selector
          filtered = movies.filter(movie => movie.series === selectedSeries)
        } else {
          filtered = movies.filter(movie => movie.series) // Show all movies with any series
        }
        break
      case 'tags':
        if (selectedTag && selectedTag !== 'all') {
          filtered = movies.filter(movie => {
            if (!movie.tags) return false
            return movie.tags.split(',').some(tag => tag.trim() === selectedTag)
          })
        } else {
          filtered = movies.filter(movie => movie.tags) // Show all movies with any tags
        }
        break
      case 'soft':
        // For soft tab, we don't filter movies - we'll render SC movies instead
        filtered = movies
        break
      default:
        filtered = movies
    }

    return filtered
  }, [movies, activeTab, selectedType, selectedStudio, selectedSeries, selectedTag, showSeriesGrid, isActressProfile])

  // Sorting logic - now works on filtered movies
  const sortedMovies = useMemo(() => {
    const moviesCopy = [...filteredMovies]

    // Helper to compute max age gap per movie at release date
    const computeMaxGap = (movie: Movie): number | null => {
      if (!movie.releaseDate || !profile?.birthdate) return null
      if (profile?.type === 'actor' && movie.actress) {
        const names = movie.actress.split(',').map(n => n.trim()).filter(Boolean)
        const gaps: number[] = []
        names.forEach(n => {
          const info = allActresses.find(a => a.name === n)
          if (info?.birthdate) {
            const actorAge = calculateAgeAtDate(profile.birthdate!, movie.releaseDate!)
            const actressAge = calculateAgeAtDate(info.birthdate, movie.releaseDate!)
            if (actorAge !== null && actressAge !== null) gaps.push(Math.abs(actorAge - actressAge))
          }
        })
        return gaps.length ? Math.max(...gaps) : null
      } else if (profile?.type === 'actress' && movie.actors) {
        const names = movie.actors.split(',').map(n => n.trim()).filter(Boolean)
        const gaps: number[] = []
        names.forEach(n => {
          const info = allActors.find(a => a.name === n)
          if (info?.birthdate) {
            const actressAge = calculateAgeAtDate(profile.birthdate!, movie.releaseDate!)
            const actorAge = calculateAgeAtDate(info.birthdate, movie.releaseDate!)
            if (actorAge !== null && actressAge !== null) gaps.push(Math.abs(actorAge - actressAge))
          }
        })
        return gaps.length ? Math.max(...gaps) : null
      }
      return null
    }
    
    switch (sortBy) {
      case 'releaseDate_desc':
        return moviesCopy.sort((a, b) => {
          const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0
          const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0
          return dateB - dateA // newest first
        })
      
      case 'releaseDate_asc':
        return moviesCopy.sort((a, b) => {
          const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0
          const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0
          return dateA - dateB // oldest first
        })
      
      case 'title_asc':
        return moviesCopy.sort((a, b) => {
          const titleA = (a.titleEn || a.titleJp || '').toLowerCase()
          const titleB = (b.titleEn || b.titleJp || '').toLowerCase()
          return titleA.localeCompare(titleB)
        })
      
      case 'title_desc':
        return moviesCopy.sort((a, b) => {
          const titleA = (a.titleEn || a.titleJp || '').toLowerCase()
          const titleB = (b.titleEn || b.titleJp || '').toLowerCase()
          return titleB.localeCompare(titleA)
        })
      
      case 'code_asc':
        return moviesCopy.sort((a, b) => {
          const codeA = (a.code || '').toLowerCase()
          const codeB = (b.code || '').toLowerCase()
          return codeA.localeCompare(codeB)
        })
      
      case 'code_desc':
        return moviesCopy.sort((a, b) => {
          const codeA = (a.code || '').toLowerCase()
          const codeB = (b.code || '').toLowerCase()
          return codeB.localeCompare(codeA)
        })
      
      case 'age_asc':
        if (!profile?.birthdate) return moviesCopy
        return moviesCopy.sort((a, b) => {
          const ageA = a.releaseDate ? calculateAgeAtDate(profile.birthdate!, a.releaseDate) : 999
          const ageB = b.releaseDate ? calculateAgeAtDate(profile.birthdate!, b.releaseDate) : 999
          const aVal = ageA === null ? 999 : ageA
          const bVal = ageB === null ? 999 : ageB
          return aVal - bVal // youngest age first
        })
      
      case 'age_desc':
        if (!profile?.birthdate) return moviesCopy
        return moviesCopy.sort((a, b) => {
          const ageA = a.releaseDate ? calculateAgeAtDate(profile.birthdate!, a.releaseDate) : 0
          const ageB = b.releaseDate ? calculateAgeAtDate(profile.birthdate!, b.releaseDate) : 0
          const aVal = ageA === null ? 0 : ageA
          const bVal = ageB === null ? 0 : ageB
          return bVal - aVal // oldest age first
        })
      case 'ageGapMax_desc':
        return moviesCopy.sort((a, b) => {
          const gapA = computeMaxGap(a)
          const gapB = computeMaxGap(b)
          const aVal = gapA === null ? -1 : gapA
          const bVal = gapB === null ? -1 : gapB
          return bVal - aVal // largest first; nulls last
        })
      case 'ageGapMax_asc':
        return moviesCopy.sort((a, b) => {
          const gapA = computeMaxGap(a)
          const gapB = computeMaxGap(b)
          const aVal = gapA === null ? Number.MAX_SAFE_INTEGER : gapA
          const bVal = gapB === null ? Number.MAX_SAFE_INTEGER : gapB
          return aVal - bVal // smallest first; nulls last
        })
      
      default:
        return moviesCopy
    }
  }, [filteredMovies, sortBy, profile?.birthdate])

  // Pagination helpers and keyboard navigation
  const totalPages = Math.ceil(sortedMovies.length / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedMovies = sortedMovies.slice(startIndex, startIndex + itemsPerPage)

  useEffect(() => {
    // Reset to page 1 when data or filters change
    setCurrentPage(1)
  }, [sortedMovies.length, activeTab, selectedType, selectedStudio, selectedSeries, selectedTag])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        if (currentPage < totalPages) {
          e.preventDefault()
          setCurrentPage(p => Math.min(totalPages, p + 1))
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentPage > 1) {
          e.preventDefault()
          setCurrentPage(p => Math.max(1, p - 1))
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentPage, totalPages])

  // Reset selections when changing tabs
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab)
    if (newTab !== 'type') setSelectedType('all')
    if (newTab !== 'studio') setSelectedStudio('all')
    if (newTab !== 'series') {
      setSelectedSeries('all')
      setShowSeriesGrid(true) // Reset to series grid when switching tabs
    }
    if (newTab !== 'tags') setSelectedTag('all')
  }

  // Handle series card click
  const handleSeriesCardClick = (seriesName: string) => {
    if (onFilterSelect) {
      // If parent provides filtering, use it
      onFilterSelect('series', seriesName, `Series: ${seriesName}`)
    } else {
      // Otherwise, handle internally by switching to filtered movies view
      setSelectedSeries(seriesName)
      setShowSeriesGrid(false)
    }
  }

  // Handle back to series grid
  const handleBackToSeriesGrid = () => {
    setSelectedSeries('all')
    setShowSeriesGrid(true)
  }

  const renderMovieGrid = () => (
    <>
      {sortedMovies.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedMovies.map((movie) => {
            // Calculate age at movie release
            const ageAtRelease = profile?.birthdate && movie.releaseDate 
              ? calculateAgeAtDate(profile.birthdate, movie.releaseDate)
              : null

            // Calculate max age gap for multi-cast (actor vs actresses, or actress vs actors)
            let maxGap: number | null = null
            let maxGapName: string | null = null
            if (movie.releaseDate && profile?.birthdate) {
              if (profile?.type === 'actor' && movie.actress) {
                const names = movie.actress.split(',').map(n => n.trim()).filter(Boolean)
                const gaps: { name: string; gap: number }[] = []
                names.forEach(n => {
                  const info = allActresses.find(a => a.name === n)
                  if (info?.birthdate) {
                    const actorAge = calculateAgeAtDate(profile.birthdate!, movie.releaseDate!)
                    const actressAge = calculateAgeAtDate(info.birthdate, movie.releaseDate!)
                    if (actorAge !== null && actressAge !== null) gaps.push({ name: n, gap: Math.abs(actorAge - actressAge) })
                  }
                })
                if (gaps.length) {
                  const best = gaps.reduce((acc, cur) => (cur.gap > acc.gap ? cur : acc))
                  maxGap = best.gap
                  // Only show name if multiple actresses
                  if (names.length > 1) {
                    // Extract first name (before space or punctuation)
                    const first = best.name.split(/\s|\(|\[/)[0]
                    maxGapName = first || best.name
                  } else {
                    maxGapName = null
                  }
                }
              } else if (profile?.type === 'actress' && movie.actors) {
                const names = movie.actors.split(',').map(n => n.trim()).filter(Boolean)
                const gaps: { name: string; gap: number }[] = []
                names.forEach(n => {
                  const info = allActors.find(a => a.name === n)
                  if (info?.birthdate) {
                    const actressAge = calculateAgeAtDate(profile.birthdate!, movie.releaseDate!)
                    const actorAge = calculateAgeAtDate(info.birthdate, movie.releaseDate!)
                    if (actorAge !== null && actressAge !== null) gaps.push({ name: n, gap: Math.abs(actorAge - actressAge) })
                  }
                })
                if (gaps.length) {
                  const best = gaps.reduce((acc, cur) => (cur.gap > acc.gap ? cur : acc))
                  maxGap = best.gap
                  if (names.length > 1) {
                    const first = best.name.split(/\s|\(|\[/)[0]
                    maxGapName = first || best.name
                  } else {
                    maxGapName = null
                  }
                }
              }
            }

            return (
              <div
                key={movie.id}
                className="group cursor-pointer"
                onClick={() => onMovieSelect(movie)}
              >
                {/* Movie Code and Type */}
                <div className="text-center mb-2">
                  <Badge variant="secondary" className="text-xs font-mono px-2 py-1">
                    {movie.code?.toUpperCase() || 'NO CODE'}
                  </Badge>
                  {movie.type && (
                    <span 
                      className={`ml-2 text-[10px] px-2 py-0.5 rounded font-medium align-middle ${getTypeColorClasses(movie.type)}`}
                      style={getTypeColorStyles(movie.type)}
                      title={`Movie type: ${movie.type}`}
                    >
                      {movie.type.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Cover using MovieThumbnail component for consistent cropping */}
                <MovieThumbnail
                  movie={movie}
                  onClick={() => onMovieSelect(movie)}
                  showHoverEffect={true}
                  className="mb-2"
                  showFavoriteButton={true}
                  accessToken={accessToken}
                />

                {/* Movie Info */}
                <div className="space-y-1">
                  <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {movie.titleEn || movie.titleJp || 'Untitled'}
                  </h3>
                  
                  {/* Japanese title if different from English */}
                  {movie.titleJp && movie.titleEn && movie.titleJp !== movie.titleEn && (
                    <p className="text-xs text-gray-600 line-clamp-1">
                      {movie.titleJp}
                    </p>
                  )}

                  {/* Release Date and Age + Max Gap */}
                  {movie.releaseDate && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{new Date(movie.releaseDate).getFullYear()}</span>
                      <div className="flex items-center gap-2">
                        {maxGap !== null && (
                          <span className="text-amber-600 font-medium" title="Max age gap in this movie">
                            Gap {Math.round(maxGap)}y{maxGapName ? ` (${maxGapName})` : ''}
                          </span>
                        )}
                        {ageAtRelease !== null && (
                          <span className="text-blue-600 font-medium">
                            Age {ageAtRelease}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-12">
          <Film className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No movies found</p>
          <p className="text-sm">
            {collaborationInfo 
              ? `No collaboration movies found between ${collaborationInfo.actorName} and ${collaborationInfo.actressName}`
              : activeTab === 'takufied' 
              ? `No collaboration movies found with Taku Yoshimura`
              : activeTab !== 'all' && (
                  (selectedType && selectedType !== 'all') || 
                  (selectedStudio && selectedStudio !== 'all') || 
                  (selectedSeries && selectedSeries !== 'all') || 
                  (selectedTag && selectedTag !== 'all')
                )
              ? `No movies found for the selected ${activeTab}`
              : activeTab !== 'all'
              ? `No movies found with ${activeTab} information`
              : `${name} has not appeared in any movies yet`
            }
          </p>
        </div>
      )}
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3 text-sm">
          <button
            className="px-3 py-1 rounded border hover:bg-muted disabled:opacity-50"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            aria-label="Previous page (←)"
          >
            ← Prev
          </button>
          <span>
            Page {currentPage} / {totalPages}
          </span>
          <button
            className="px-3 py-1 rounded border hover:bg-muted disabled:opacity-50"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            aria-label="Next page (→)"
          >
            Next →
          </button>
        </div>
      )}
    </>
  )

  const renderSCMovieGrid = () => (
    <>
      {personSCMovies.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {personSCMovies.map((scMovie) => {
            // Calculate age at SC movie release
            const ageAtRelease = profile?.birthdate && scMovie.releaseDate 
              ? calculateAgeAtDate(profile.birthdate, scMovie.releaseDate)
              : null

            return (
              <div
                key={scMovie.id}
                className="group cursor-pointer"
                onClick={() => onSCMovieSelect?.(scMovie.id || '')}
              >
                {/* SC Movie Title Badge */}
                <div className="text-center mb-2">
                  <Badge variant="secondary" className="text-xs px-2 py-1 bg-purple-100 text-purple-800">
                    SC Movie
                  </Badge>
                </div>

                {/* Cover using SCMovieThumbnail component */}
                <SCMovieThumbnail
                  scMovie={scMovie}
                  onClick={() => onSCMovieSelect?.(scMovie.id || '')}
                  showHoverEffect={true}
                  className="mb-2"
                  showFavoriteButton={true}
                  accessToken={accessToken}
                />

                {/* SC Movie Info */}
                <div className="space-y-1">
                  <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-purple-600 transition-colors">
                    {scMovie.titleEn || 'Untitled'}
                  </h3>
                  
                  {/* Japanese title if different from English */}
                  {scMovie.titleJp && scMovie.titleEn && scMovie.titleJp !== scMovie.titleEn && (
                    <p className="text-xs text-gray-600 line-clamp-1">
                      {scMovie.titleJp}
                    </p>
                  )}

                  {/* Release Date and Age */}
                  {scMovie.releaseDate && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{new Date(scMovie.releaseDate).getFullYear()}</span>
                      {ageAtRelease !== null && (
                        <span className="text-purple-600 font-medium">
                          Age {ageAtRelease}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-12">
          {scMoviesLoading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-lg mb-2">Loading SC movies...</p>
            </>
          ) : (
            <>
              <PlayCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No SC movies found</p>
              <p className="text-sm">
                {name} has not appeared in any soft content movies yet
              </p>
            </>
          )}
        </div>
      )}
    </>
  )

  const renderSeriesCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {seriesData.map((series) => {
        const handleCardClick = () => {
          handleSeriesCardClick(series.name)
        }
        
        return (
          <div 
            key={series.name}
            className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden group bg-white border border-gray-200 rounded-lg"
            onClick={handleCardClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleCardClick()
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={`View movies in series: ${series.name}`}
          >
            <div className="relative">
              <MovieThumbnail
                movie={series.firstMovie}
                showHoverEffect={false}
              />
              
              {/* Series Favorite Button */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div onClick={(e) => e.stopPropagation()}>
                  <SimpleFavoriteButton
                    type="series"
                    itemId={series.name}
                    size="sm"
                    variant="ghost"
                    className="bg-white/90 hover:bg-white text-gray-700 hover:text-red-500 shadow-lg"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-3 space-y-2">
              <h3 className="font-medium line-clamp-2 text-sm">{series.name}</h3>
              <div className="flex justify-between items-center">
                <Badge variant="secondary" className="text-xs">
                  {series.movieCount} movies
                </Badge>
                {series.firstMovie.releaseDate && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(series.firstMovie.releaseDate).getFullYear()}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'type':
        return (
          <div className="space-y-4">
            <SearchableSelect
              placeholder="Select types"
              options={metadataValues.types.map(type => ({
                value: type,
                label: type,
                count: movies.filter(m => m.type === type).length
              }))}
              value={selectedType}
              onValueChange={setSelectedType}
              icon={<Tag className="h-4 w-4 text-muted-foreground" />}
            />
            {renderMovieGrid()}
          </div>
        )

      case 'studio':
        return (
          <div className="space-y-4">
            <SearchableSelect
              placeholder="Select studios"
              options={metadataValues.studios.map(studio => ({
                value: studio,
                label: studio,
                count: movies.filter(m => m.studio === studio).length
              }))}
              value={selectedStudio}
              onValueChange={setSelectedStudio}
              searchThreshold={5} // Show search earlier for studios as they can be many
              icon={<Building className="h-4 w-4 text-muted-foreground" />}
            />
            {renderMovieGrid()}
          </div>
        )

      case 'series':
        return (
          <div className="space-y-4">
            {showSeriesGrid ? (
              // Show series cards grid
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clapperboard className="h-4 w-4" />
                  <span>Click on a series card to view movies featuring {name} in that series</span>
                </div>
                {renderSeriesCards()}
              </>
            ) : (
              // Show filtered movies for selected series
              <>
                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clapperboard className="h-4 w-4 text-blue-700" />
                    <div>
                      <h3 className="font-medium text-blue-900">
                        Series: {selectedSeries}
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Movies featuring {name} in this series
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBackToSeriesGrid}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Series
                  </Button>
                </div>
                {renderMovieGrid()}
              </>
            )}
          </div>
        )

      case 'tags':
        return (
          <div className="space-y-4">
            <SearchableSelect
              placeholder="Select tags"
              options={metadataValues.tags.map(tag => ({
                value: tag,
                label: tag,
                count: movies.filter(m => m.tags?.split(',').some(t => t.trim() === tag)).length
              }))}
              value={selectedTag}
              onValueChange={setSelectedTag}
              searchThreshold={5} // Show search earlier for tags as they can be many
              icon={<Tags className="h-4 w-4 text-muted-foreground" />}
            />
            {renderMovieGrid()}
          </div>
        )

      case 'soft':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <PlayCircle className="h-4 w-4" />
              <span>Soft content movies featuring {name}</span>
            </div>
            {renderSCMovieGrid()}
          </div>
        )

      default:
        return renderMovieGrid()
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Film className="h-5 w-5" />
            <div className="flex flex-col">
              <span>
                {collaborationInfo 
                  ? `Collaboration Movies: ${collaborationInfo.actorName} & ${collaborationInfo.actressName}`
                  : activeTab === 'soft' 
                  ? `SC Movies featuring ${name}`
                  : `Movies featuring ${name}`
                }
              </span>
              {activeTab === 'soft' && personSCMovies.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  {personSCMovies.length} {personSCMovies.length === 1 ? 'SC movie' : 'SC movies'}
                </span>
              )}
              {activeTab !== 'soft' && movies.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  {sortedMovies.length} {sortedMovies.length === 1 ? 'movie' : 'movies'} 
                  {sortedMovies.length !== filteredMovies.length && ` of ${filteredMovies.length} filtered`}
                  {filteredMovies.length !== movies.length && ` (${movies.length} total)`}
                </span>
              )}
            </div>
          </CardTitle>
          
          {/* Sorting Controls */}
          {((activeTab === 'soft' && personSCMovies.length > 1) || (activeTab !== 'soft' && filteredMovies.length > 1)) && (
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] sm:w-[200px]">
                  <SelectValue placeholder="Sort by...">
                    <span className="text-sm">{getSortLabel(sortBy)}</span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="releaseDate_desc">
                    <div className="flex items-center gap-2">
                      <ArrowDown className="h-3 w-3" />
                      Release Date (Newest First)
                    </div>
                  </SelectItem>
                  <SelectItem value="releaseDate_asc">
                    <div className="flex items-center gap-2">
                      <ArrowUp className="h-3 w-3" />
                      Release Date (Oldest First)
                    </div>
                  </SelectItem>
                  <SelectItem value="title_asc">
                    <div className="flex items-center gap-2">
                      <SortAsc className="h-3 w-3" />
                      Title (A-Z)
                    </div>
                  </SelectItem>
                  <SelectItem value="title_desc">
                    <div className="flex items-center gap-2">
                      <SortDesc className="h-3 w-3" />
                      Title (Z-A)
                    </div>
                  </SelectItem>
                  <SelectItem value="code_asc">
                    <div className="flex items-center gap-2">
                      <SortAsc className="h-3 w-3" />
                      Code (A-Z)
                    </div>
                  </SelectItem>
                  <SelectItem value="code_desc">
                    <div className="flex items-center gap-2">
                      <SortDesc className="h-3 w-3" />
                      Code (Z-A)
                    </div>
                  </SelectItem>
                  {profile?.birthdate && (
                    <>
                      <SelectItem value="age_asc">
                        <div className="flex items-center gap-2">
                          <ArrowUp className="h-3 w-3" />
                          Age (Youngest First)
                        </div>
                      </SelectItem>
                      <SelectItem value="age_desc">
                        <div className="flex items-center gap-2">
                          <ArrowDown className="h-3 w-3" />
                          Age (Oldest First)
                        </div>
                      </SelectItem>
                      <SelectItem value="ageGapMax_desc">
                        <div className="flex items-center gap-2">
                          <ArrowDown className="h-3 w-3" />
                          Age Gap (Largest)
                        </div>
                      </SelectItem>
                      <SelectItem value="ageGapMax_asc">
                        <div className="flex items-center gap-2">
                          <ArrowUp className="h-3 w-3" />
                          Age Gap (Smallest)
                        </div>
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="flex w-full justify-start h-auto p-1 overflow-x-auto">
            {/* All Movies Tab */}
            <TabsTrigger value="all" className="flex items-center gap-1 whitespace-nowrap px-4 py-2">
              <Film className="h-3 w-3" />
              All ({movies.length})
            </TabsTrigger>

            {/* Type Tab */}
            {metadataValues.types.length > 0 && (
              <TabsTrigger value="type" className="flex items-center gap-1 whitespace-nowrap px-4 py-2">
                <Tag className="h-3 w-3" />
                Type
              </TabsTrigger>
            )}

            {/* Studio Tab */}
            {metadataValues.studios.length > 0 && (
              <TabsTrigger value="studio" className="flex items-center gap-1 whitespace-nowrap px-4 py-2">
                <Building className="h-3 w-3" />
                Studio
              </TabsTrigger>
            )}

            {/* Series Tab */}
            {metadataValues.series.length > 0 && (
              <TabsTrigger value="series" className="flex items-center gap-1 whitespace-nowrap px-4 py-2">
                <Clapperboard className="h-3 w-3" />
                Series
              </TabsTrigger>
            )}

            {/* Takufied Tab - Only for Actresses */}
            {isActressProfile && movies.some(movie => {
              const actors = movie.actors ? movie.actors.toLowerCase() : ''
              const director = movie.director ? movie.director.toLowerCase() : ''
              return actors.includes('taku yoshimura') || director.includes('taku yoshimura')
            }) && (
              <TabsTrigger value="takufied" className="flex items-center gap-1 whitespace-nowrap px-4 py-2">
                <Heart className="h-3 w-3" />
                Takufied
              </TabsTrigger>
            )}

            {/* Soft Tab - Show if person has SC movies */}
            {personSCMovies.length > 0 && (
              <TabsTrigger value="soft" className="flex items-center gap-1 whitespace-nowrap px-4 py-2">
                <PlayCircle className="h-3 w-3" />
                Soft ({personSCMovies.length})
              </TabsTrigger>
            )}

            {/* Tags Tab */}
            {metadataValues.tags.length > 0 && (
              <TabsTrigger value="tags" className="flex items-center gap-1 whitespace-nowrap px-4 py-2">
                <Tags className="h-3 w-3" />
                Tags
              </TabsTrigger>
            )}
          </TabsList>

          {/* Tab Content */}
          <TabsContent value={activeTab} className="mt-6">
            {renderTabContent()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}