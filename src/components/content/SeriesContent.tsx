import { useState, useMemo, useEffect } from 'react'
import { useGlobalKeyboardPagination } from '../../hooks/useGlobalKeyboardPagination'
import { Movie } from '../../utils/movieApi'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { SimpleFavoriteButton } from '../SimpleFavoriteButton'
import { MovieThumbnail } from '../MovieThumbnail'
import { PaginationEnhanced } from '../ui/pagination-enhanced'
import { MasterDataItem, masterDataApi } from '../../utils/masterDataApi'
import { Globe, ExternalLink } from 'lucide-react'
import { Button } from '../ui/button'

interface SeriesContentProps {
  movies: Movie[]
  searchQuery: string
  onFilterSelect: (filterType: string, filterValue: string, title?: string) => void
  accessToken: string
}

interface SeriesInfo {
  name: string
  movieCount: number
  firstMovie: Movie
  coverUrl: string
  titleJp?: string
  seriesLinks?: string
  masterDataId?: string
}

export function SeriesContent({ movies, searchQuery, onFilterSelect, accessToken }: SeriesContentProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(24)
  const [masterSeriesData, setMasterSeriesData] = useState<MasterDataItem[]>([])

  // Fetch master series data
  useEffect(() => {
    const fetchSeriesData = async () => {
      try {
        const data = await masterDataApi.getByType('series', accessToken)
        setMasterSeriesData(data)
      } catch (error) {
        console.error('Failed to fetch series master data:', error)
        setMasterSeriesData([])
      }
    }

    fetchSeriesData()
  }, [accessToken])


  const seriesData = useMemo(() => {
    // Group movies by series
    const seriesMap = new Map<string, Movie[]>()
    
    movies.forEach(movie => {
      if (movie.series) {
        if (!seriesMap.has(movie.series)) {
          seriesMap.set(movie.series, [])
        }
        seriesMap.get(movie.series)!.push(movie)
      }
    })
    
    // Create series info with first movie (by release date) as thumbnail
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
      
      // Find matching master series data for additional info
      const masterSeries = masterSeriesData.find(series => {
        // Check if either titleEn or titleJp matches the series name from movies
        return series.titleEn === seriesName || series.titleJp === seriesName ||
               series.titleEn?.toLowerCase() === seriesName.toLowerCase() ||
               series.titleJp?.toLowerCase() === seriesName.toLowerCase()
      })
      
      seriesInfo.push({
        name: seriesName,
        movieCount: seriesMovies.length,
        firstMovie,
        coverUrl: '', // We'll use MovieThumbnail component instead
        titleJp: masterSeries?.titleJp,
        seriesLinks: masterSeries?.seriesLinks,
        masterDataId: masterSeries?.id
      })
    })
    
    // Sort series by name
    return seriesInfo.sort((a, b) => a.name.localeCompare(b.name))
  }, [movies, masterSeriesData])

  const filteredSeries = useMemo(() => {
    if (!searchQuery.trim()) return seriesData
    
    const query = searchQuery.toLowerCase()
    return seriesData.filter(series =>
      series.name.toLowerCase().includes(query) ||
      series.titleJp?.toLowerCase().includes(query)
    )
  }, [seriesData, searchQuery])

  // Helper function to render series links
  const renderSeriesLinks = (seriesLinks: string) => {
    if (!seriesLinks.trim()) return null
    
    const links = seriesLinks.split('\n').filter(link => link.trim())
    if (links.length === 0) return null
    
    return (
      <div className="mt-2 space-y-1">
        {links.slice(0, 2).map((link, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs w-full justify-start"
            onClick={(e) => {
              e.stopPropagation()
              window.open(link.trim(), '_blank', 'noopener,noreferrer')
            }}
          >
            <Globe className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">
              {link.length > 25 ? `${link.substring(0, 25)}...` : link}
            </span>
            <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
          </Button>
        ))}
        {links.length > 2 && (
          <div className="text-xs text-muted-foreground text-center">
            +{links.length - 2} more links
          </div>
        )}
      </div>
    )
  }

  // Pagination
  const totalPages = Math.ceil(filteredSeries.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedSeries = filteredSeries.slice(startIndex, startIndex + itemsPerPage)

  // Keyboard navigation for pagination using global hook
  useGlobalKeyboardPagination(
    currentPage,
    totalPages,
    (page: number) => setCurrentPage(page),
    'series-content',
    true
  )

  if (filteredSeries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {searchQuery ? `No series found for "${searchQuery}"` : 'No series available'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pagination - Top */}
      <PaginationEnhanced
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={filteredSeries.length}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(newItemsPerPage) => {
          setItemsPerPage(newItemsPerPage)
          setCurrentPage(1)
        }}
      />

      {/* Series Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {paginatedSeries.map((series) => (
          <Card 
            key={series.name} 
            className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden group"
            onClick={() => onFilterSelect('series', series.name, `Series: ${series.name}`)}
          >
            <div className="relative">
              <MovieThumbnail
                movie={series.firstMovie}
                onClick={() => onFilterSelect('series', series.name, `Series: ${series.name}`)}
                showHoverEffect={true}
              />
              
              {/* Series Favorite Button */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <SimpleFavoriteButton
                  type="series"
                  itemId={series.name}
                  size="sm"
                  variant="ghost"
                  className="bg-white/90 hover:bg-white text-gray-700 hover:text-red-500 shadow-lg"
                />
              </div>
            </div>
            
            <CardContent className="p-3 space-y-2">
              <div className="space-y-1">
                <h3 className="font-medium line-clamp-2 text-sm">{series.name}</h3>
                {series.titleJp && series.titleJp !== series.name && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{series.titleJp}</p>
                )}
              </div>
              
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
              
              {/* Series Links */}
              {series.seriesLinks && renderSeriesLinks(series.seriesLinks)}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}