import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { ImageWithFallback } from '../figma/ImageWithFallback'
import { LightboxWithThumbnails } from '../LightboxWithThumbnails'
import { SimpleFavoriteButton } from '../SimpleFavoriteButton'
import { MovieThumbnail } from '../MovieThumbnail'
import { ClickableProfileAvatar } from '../ClickableProfileAvatar'
import { MovieCard } from '../MovieCard'
import { useSimpleFavoritesContext } from '../../contexts/SimpleFavoritesContext'
import { Movie, movieApi } from '../../utils/movieApi'
import { Photobook, photobookApi } from '../../utils/photobookApi'
import { MasterDataItem, masterDataApi, calculateAge, castMatchesQuery, movieCodeMatchesQuery } from '../../utils/masterDataApi'
import { simpleFavoritesApi } from '../../utils/simpleFavoritesApi'
import { toast } from 'sonner'
import { 
  Film, 
  Image as ImageIcon, 
  User, 
  PlayCircle, 
  Heart,
  Calendar
} from 'lucide-react'

interface SimpleFavoritesContentProps {
  accessToken: string
  onMovieSelect: (movie: Movie) => void
  onPhotobookSelect: (photobook: Photobook) => void
  onProfileSelect: (type: 'actor' | 'actress' | 'director', name: string) => void
  onFilterSelect?: (filterType: string, filterValue: string, title?: string) => void
  searchQuery: string
}

interface FavoriteImageData {
  id: string
  url: string
  sourceType: 'movie' | 'photobook'
  sourceId: string
  sourceTitle: string
  movieCode?: string
  movieType?: string // Movie type for zoom logic
  actresses?: string[]
  actors?: string[]
  releaseDate?: string
  dateAdded?: string // Date when the image was added to favorites
}

export function SimpleFavoritesContent({ 
  accessToken,
  onMovieSelect, 
  onPhotobookSelect, 
  onProfileSelect,
  onFilterSelect,
  searchQuery
}: SimpleFavoritesContentProps) {
  const { favorites, setFavorites, isLoading: favoritesLoading, getFavoritesByType } = useSimpleFavoritesContext()
  
  // Data state - lazy loaded per tab
  const [movies, setMovies] = useState<Movie[]>([])
  const [photobooks, setPhotobooks] = useState<Photobook[]>([])
  const [cast, setCast] = useState<MasterDataItem[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  
  // Processed data
  const [favoriteMovies, setFavoriteMovies] = useState<Movie[]>([])
  const [favoritePhotobooks, setFavoritePhotobooks] = useState<Photobook[]>([])
  const [favoriteImages, setFavoriteImages] = useState<FavoriteImageData[]>([])
  const [favoriteCast, setFavoriteCast] = useState<MasterDataItem[]>([])
  const [favoriteSeries, setFavoriteSeries] = useState<{ name: string; movies: Movie[]; favoriteId: string }[]>([])
  
  // Failed images tracking
  const [failedImages, setFailedImages] = useState<Array<{favorite: any, reason: string}>>([])
  
  // UI state
  const [activeTab, setActiveTab] = useState('movies')
  const [showLightbox, setShowLightbox] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [imageSortBy, setImageSortBy] = useState('dateAdded-desc') // Default sort by date added (newest first)

  // Load data only for active tab
  useEffect(() => {
    const loadTabData = async () => {
      if (!favorites.length) return
      
      setIsLoadingData(true)
      try {
        switch (activeTab) {
          case 'movies':
            await loadMoviesData()
            break
          case 'photobooks':
            await loadPhotobooksData()
            break
          case 'images':
            await loadImagesData()
            break
          case 'cast':
            await loadCastData()
            break
          case 'series':
            await loadSeriesData()
            break
        }
      } catch (error) {
        console.error(`Failed to load data for ${activeTab} tab:`, error)
      } finally {
        setIsLoadingData(false)
      }
    }

    loadTabData()
  }, [activeTab, favorites, accessToken])

  // Individual data loading functions
  const loadMoviesData = async () => {
    const movieFavorites = favorites.filter(f => f.type === 'movie')
    if (movieFavorites.length === 0) {
      setFavoriteMovies([])
      return
    }

    // Only load movies if not already loaded
    if (movies.length === 0) {
      const moviesData = await movieApi.getMovies(accessToken).catch(() => [])
      setMovies(moviesData)
      
      const foundMovies = movieFavorites
        .map(f => moviesData.find(m => m.id === f.itemId))
        .filter(Boolean) as Movie[]
      setFavoriteMovies(foundMovies)
    } else {
      const foundMovies = movieFavorites
        .map(f => movies.find(m => m.id === f.itemId))
        .filter(Boolean) as Movie[]
      setFavoriteMovies(foundMovies)
    }
  }

  const loadPhotobooksData = async () => {
    const photobookFavorites = favorites.filter(f => f.type === 'photobook')
    if (photobookFavorites.length === 0) {
      setFavoritePhotobooks([])
      return
    }

    // Only load photobooks if not already loaded
    if (photobooks.length === 0) {
      const photobooksData = await photobookApi.getPhotobooks(accessToken).catch(() => [])
      setPhotobooks(photobooksData)
      
      const foundPhotobooks = photobookFavorites
        .map(f => photobooksData.find(p => p.id === f.itemId))
        .filter(Boolean) as Photobook[]
      setFavoritePhotobooks(foundPhotobooks)
    } else {
      const foundPhotobooks = photobookFavorites
        .map(f => photobooks.find(p => p.id === f.itemId))
        .filter(Boolean) as Photobook[]
      setFavoritePhotobooks(foundPhotobooks)
    }
  }

  const loadImagesData = async () => {
    const imageFavorites = favorites.filter(f => f.type === 'image')
    if (imageFavorites.length === 0) {
      setFavoriteImages([])
      return
    }

    // Load movies and photobooks if not already loaded
    let moviesData = movies
    let photobooksData = photobooks
    
    if (moviesData.length === 0 || photobooksData.length === 0) {
      const [moviesResult, photobooksResult] = await Promise.all([
        moviesData.length === 0 ? movieApi.getMovies(accessToken).catch(() => []) : Promise.resolve(moviesData),
        photobooksData.length === 0 ? photobookApi.getPhotobooks(accessToken).catch(() => []) : Promise.resolve(photobooksData)
      ])
      
      if (moviesData.length === 0) {
        setMovies(moviesResult)
        moviesData = moviesResult
      }
      if (photobooksData.length === 0) {
        setPhotobooks(photobooksResult)
        photobooksData = photobooksResult
      }
    }

    const processedImages: FavoriteImageData[] = []
    const failedImages: Array<{favorite: any, reason: string}> = []

    imageFavorites.forEach(f => {
      const movie = moviesData.find(m => m.id === f.sourceId)
      const photobook = photobooksData.find(p => p.id === f.sourceId)
      
      if (movie) {
        processedImages.push({
          id: f.id,
          url: f.itemId,
          sourceType: 'movie' as const,
          sourceId: movie.id!,
          sourceTitle: movie.titleEn || movie.titleJp || '',
          movieCode: movie.dmm,
          movieType: movie.type, // Add movie type for zoom logic
          actresses: movie.actress ? movie.actress.split(',').map(a => a.trim()).filter(a => a) : [],
          actors: movie.actors ? movie.actors.split(',').map(a => a.trim()).filter(a => a) : [],
          releaseDate: movie.releaseDate,
          dateAdded: f.createdAt || f.dateAdded
        })
      } else if (photobook) {
        const actresses = photobook.imageTags 
          ? Array.from(new Set(photobook.imageTags.flatMap(tag => tag.actresses)))
          : photobook.actress ? photobook.actress.split(',').map(a => a.trim()).filter(a => a) : []
          
        processedImages.push({
          id: f.id,
          url: f.itemId,
          sourceType: 'photobook' as const,
          sourceId: photobook.id!,
          sourceTitle: photobook.titleEn || photobook.titleJp || '',
          movieCode: undefined,
          actresses,
          actors: [],
          releaseDate: photobook.releaseDate,
          dateAdded: f.createdAt || f.dateAdded
        })
      } else {
        // Track failed images with reason
        failedImages.push({
          favorite: f,
          reason: `Source ${f.sourceId} not found (movie or photobook may have been deleted)`
        })
      }
    })

    setFavoriteImages(processedImages)
    setFailedImages(failedImages)
    
    // Log failed images for debugging
    if (failedImages.length > 0) {
      console.warn('Failed to process images:', failedImages)
    }
  }

  const loadCastData = async () => {
    const castFavorites = favorites.filter(f => f.type === 'cast')
    if (castFavorites.length === 0) {
      setFavoriteCast([])
      return
    }

    // Only load cast if not already loaded
    if (cast.length === 0) {
      const [actorsData, actressesData] = await Promise.all([
        masterDataApi.getByType('actor', accessToken).catch(() => []),
        masterDataApi.getByType('actress', accessToken).catch(() => [])
      ])
      const castData = [...actorsData, ...actressesData]
      setCast(castData)
      
      const foundCast = castFavorites
        .map(f => castData.find(c => c.name === f.itemId))
        .filter(Boolean) as MasterDataItem[]
      setFavoriteCast(foundCast)
    } else {
      const foundCast = castFavorites
        .map(f => cast.find(c => c.name === f.itemId))
        .filter(Boolean) as MasterDataItem[]
      setFavoriteCast(foundCast)
    }
  }

  const loadSeriesData = async () => {
    const seriesFavorites = favorites.filter(f => f.type === 'series')
    if (seriesFavorites.length === 0) {
      setFavoriteSeries([])
      return
    }

    // Only load movies if not already loaded
    let moviesData = movies
    if (moviesData.length === 0) {
      moviesData = await movieApi.getMovies(accessToken).catch(() => [])
      setMovies(moviesData)
    }

    const processedSeries = seriesFavorites.map(f => ({
      name: f.itemId,
      movies: moviesData.filter(m => m.series === f.itemId),
      favoriteId: f.id!
    }))
    setFavoriteSeries(processedSeries)
  }

  // Calculate favorite counts from favorites list (not loaded data)
  const favoriteCounts = useMemo(() => {
    return {
      movies: favorites.filter(f => f.type === 'movie').length,
      photobooks: favorites.filter(f => f.type === 'photobook').length,
      images: favorites.filter(f => f.type === 'image').length,
      cast: favorites.filter(f => f.type === 'cast').length,
      series: favorites.filter(f => f.type === 'series').length
    }
  }, [favorites])

  // Sort images based on selected sort option
  const sortedImages = useMemo(() => {
    const sorted = [...favoriteImages].sort((a, b) => {
      switch (imageSortBy) {
        case 'dateAdded-desc':
          return new Date(b.dateAdded || '').getTime() - new Date(a.dateAdded || '').getTime()
        case 'dateAdded-asc':
          return new Date(a.dateAdded || '').getTime() - new Date(b.dateAdded || '').getTime()
        case 'movieTitle-asc':
          return (a.sourceTitle || '').localeCompare(b.sourceTitle || '')
        case 'movieTitle-desc':
          return (b.sourceTitle || '').localeCompare(a.sourceTitle || '')
        default:
          return 0
      }
    })
    return sorted
  }, [favoriteImages, imageSortBy])

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return {
        movies: favoriteMovies,
        photobooks: favoritePhotobooks,
        images: sortedImages,
        cast: favoriteCast,
        series: favoriteSeries
      }
    }

    const query = searchQuery.toLowerCase()
    
    return {
      movies: favoriteMovies.filter(movie => 
        movie.titleEn?.toLowerCase().includes(query) ||
        movie.titleJp?.toLowerCase().includes(query) ||
        movieCodeMatchesQuery(movie.code, query) ||
        movieCodeMatchesQuery(movie.dmcode, query) ||
        movie.dmm?.toLowerCase().includes(query)
      ),
      photobooks: favoritePhotobooks.filter(photobook => 
        photobook.titleEn?.toLowerCase().includes(query) ||
        photobook.titleJp?.toLowerCase().includes(query) ||
        photobook.actress?.toLowerCase().includes(query)
      ),
      images: sortedImages.filter(img => 
        img.sourceTitle.toLowerCase().includes(query) ||
        img.movieCode?.toLowerCase().includes(query) ||
        img.actresses?.some(a => a.toLowerCase().includes(query)) ||
        img.actors?.some(a => a.toLowerCase().includes(query))
      ),
      cast: favoriteCast.filter(person => castMatchesQuery(person, searchQuery)),
      series: favoriteSeries.filter(series => 
        series.name.toLowerCase().includes(query)
      )
    }
  }, [favoriteMovies, favoritePhotobooks, sortedImages, favoriteCast, favoriteSeries, searchQuery])

  const handleImageClick = (image: FavoriteImageData) => {
    const imageIndex = filteredData.images.findIndex(img => img.id === image.id)
    setSelectedImageIndex(imageIndex)
    setShowLightbox(true)
  }

  const handleSourceClick = (image: FavoriteImageData) => {
    if (image.sourceType === 'movie') {
      const movie = movies.find(m => m.id === image.sourceId)
      if (movie) {
        onMovieSelect(movie)
        setShowLightbox(false)
      }
    } else if (image.sourceType === 'photobook') {
      const photobook = photobooks.find(p => p.id === image.sourceId)
      if (photobook) {
        onPhotobookSelect(photobook)
        setShowLightbox(false)
      }
    }
  }

  const handleCastClick = (type: 'actor' | 'actress', name: string) => {
    onProfileSelect(type, name)
    setShowLightbox(false)
  }

  // Determine default zoom based on movie type (same logic as EnhancedGallery)
  const getDefaultZoom = (movieType?: string) => {
    // For non-Un types, use 1.8x default zoom
    if (movieType && movieType.toLowerCase() !== 'un') {
      return 1.8
    }
    // For Un type or no type specified, use 1x default zoom
    return 1
  }

  const handleRemoveFailedFavorite = async (favoriteId: string) => {
    try {
      await simpleFavoritesApi.removeFavorite(favoriteId, accessToken)
      // Refresh favorites after removal
      const updatedFavorites = favorites.filter(f => f.id !== favoriteId)
      setFavorites(updatedFavorites)
      // Reload images data
      await loadImagesData()
      toast.success('Removed broken favorite')
    } catch (error) {
      console.error('Failed to remove favorite:', error)
      toast.error('Failed to remove favorite')
    }
  }

  const handleSeriesClick = (seriesName: string) => {
    if (onFilterSelect) {
      onFilterSelect('series', seriesName, `Series: ${seriesName}`)
    }
  }

  // Utility function to get the oldest movie in a series
  const getOldestMovie = (movies: Movie[]) => {
    return [...movies].sort((a, b) => {
      if (!a.releaseDate && !b.releaseDate) return 0
      if (!a.releaseDate) return 1
      if (!b.releaseDate) return -1
      return new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
    })[0]
  }

  if (favoritesLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading favorites...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="h-6 w-6 text-red-500" />
            Favorites
          </h1>
          <p className="text-muted-foreground">
            Your favorite movies, images, cast, and series
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex">
          <TabsTrigger value="movies" className="flex items-center gap-2 flex-1 whitespace-nowrap">
            <Film className="h-4 w-4" />
            Movies ({favoriteCounts.movies})
          </TabsTrigger>
          <TabsTrigger value="photobooks" className="flex items-center gap-2 flex-1 whitespace-nowrap">
            <ImageIcon className="h-4 w-4" />
            Photobooks ({favoriteCounts.photobooks})
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-2 flex-1 whitespace-nowrap">
            <ImageIcon className="h-4 w-4" />
            Images ({favoriteCounts.images})
          </TabsTrigger>
          <TabsTrigger value="cast" className="flex items-center gap-2 flex-1 whitespace-nowrap">
            <User className="h-4 w-4" />
            Cast ({favoriteCounts.cast})
          </TabsTrigger>
          <TabsTrigger value="series" className="flex items-center gap-2 flex-1 whitespace-nowrap">
            <PlayCircle className="h-4 w-4" />
            Series ({favoriteCounts.series})
          </TabsTrigger>
        </TabsList>

        {/* Movies Tab */}
        <TabsContent value="movies" className="space-y-4">
          {isLoadingData ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading movies...</p>
            </div>
          ) : favoriteCounts.movies === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No favorite movies yet</p>
              <p className="text-sm text-muted-foreground mt-2">Add movies to your favorites to see them here</p>
            </div>
          ) : !filteredData.movies.length ? (
            <div className="text-center py-12">
              <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No movies match your search</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your search terms</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Movies Grid - Exact same structure as MoviesContent */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {filteredData.movies.map((movie) => {
                  const movieCard = (
                    <MovieCard
                      movie={movie}
                      onClick={() => onMovieSelect(movie)}
                      onActressClick={onProfileSelect ? (actressName, e) => {
                        e.stopPropagation()
                        onProfileSelect('actress', actressName)
                      } : undefined}
                      accessToken={accessToken}
                    />
                  )
                  return <div key={movie.id}>{movieCard}</div>
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Photobooks Tab */}
        <TabsContent value="photobooks" className="space-y-4">
          {isLoadingData ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading photobooks...</p>
            </div>
          ) : favoriteCounts.photobooks === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No favorite photobooks yet</p>
              <p className="text-sm text-muted-foreground mt-2">Add photobooks to your favorites to see them here</p>
            </div>
          ) : !filteredData.photobooks.length ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No photobooks match your search</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your search terms</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Photobooks Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredData.photobooks.map((photobook) => (
                  <Card key={photobook.id} className="group hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-0">
                      {/* Cover Image */}
                      <div 
                        className="aspect-[3/4] relative overflow-hidden rounded-t-lg"
                        onClick={() => onPhotobookSelect(photobook)}
                      >
                        {photobook.cover ? (
                          <ImageWithFallback
                            src={photobook.cover}
                            alt={photobook.titleEn || 'Photobook cover'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <span className="text-muted-foreground">No Cover</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-3 space-y-2">
                        <h3 className="font-medium text-sm line-clamp-2">
                          {photobook.titleEn || photobook.titleJp || 'Untitled'}
                        </h3>
                        {photobook.titleJp && photobook.titleEn && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {photobook.titleJp}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {photobook.releaseDate || 'Unknown'}
                          </div>
                          <div className="flex items-center gap-1">
                            <ImageIcon className="h-3 w-3" />
                            {photobook.imageTags?.length || 0}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-4">
          {isLoadingData ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading images...</p>
            </div>
          ) : favoriteCounts.images === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No favorite images yet</p>
              <p className="text-sm text-muted-foreground mt-2">Add images to your favorites to see them here</p>
            </div>
          ) : !filteredData.images.length ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No images match your search</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your search terms</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Sort Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Sort by:</span>
                  <Select value={imageSortBy} onValueChange={setImageSortBy}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dateAdded-desc">Date Added (Newest)</SelectItem>
                      <SelectItem value="dateAdded-asc">Date Added (Oldest)</SelectItem>
                      <SelectItem value="movieTitle-asc">Movie Title (A-Z)</SelectItem>
                      <SelectItem value="movieTitle-desc">Movie Title (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                  {favoriteCounts.images} image{favoriteCounts.images !== 1 ? 's' : ''}
                </div>
              </div>
              
              {/* Failed Images Warning */}
              {failedImages.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                        <span className="text-yellow-500 text-sm">⚠</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-yellow-600 font-medium mb-2">
                        {failedImages.length} image{failedImages.length !== 1 ? 's' : ''} cannot be displayed
                      </h4>
                      <p className="text-yellow-600/80 text-sm mb-3">
                        These images are still in your favorites but their source content (movie/photobook) may have been deleted or is no longer available.
                      </p>
                      <div className="space-y-2">
                        {failedImages.map((failed, index) => (
                          <div key={index} className="flex items-center justify-between bg-yellow-500/5 rounded p-2">
                            <div className="flex-1">
                              <p className="text-sm text-yellow-600/80">
                                Image from source ID: {failed.favorite.sourceId}
                              </p>
                              <p className="text-xs text-yellow-600/60">
                                {failed.reason}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveFailedFavorite(failed.favorite.id)}
                              className="text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/10"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Images Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredData.images.map((image) => (
                <Card key={image.id} className="group hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-0">
                    <div 
                      className="aspect-square relative overflow-hidden rounded-lg"
                      onClick={() => handleImageClick(image)}
                    >
                      <ImageWithFallback
                        src={image.url}
                        alt="Favorite image"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <SimpleFavoriteButton
                          type="image"
                          itemId={image.url}
                          sourceId={image.sourceId}
                          size="sm"
                          variant="ghost"
                          className="bg-black/20 hover:bg-black/40 text-white"
                        />
                      </div>

                      <Badge 
                        variant="secondary" 
                        className="absolute bottom-2 left-2 text-xs"
                      >
                        {image.sourceType === 'movie' ? 'Movie' : 'Photobook'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Cast Tab */}
        <TabsContent value="cast" className="space-y-4">
          {isLoadingData ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading cast...</p>
            </div>
          ) : favoriteCounts.cast === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No favorite cast yet</p>
              <p className="text-sm text-muted-foreground mt-2">Add actors/actresses to your favorites to see them here</p>
            </div>
          ) : !filteredData.cast.length ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No cast match your search</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your search terms</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredData.cast.map((person) => {
                // Get profile picture URL with same logic as ActorsContent/ActressesContent
                let imageUrl = null
                
                // Priority 1: profilePicture (main image)
                if (person.profilePicture?.trim()) {
                  imageUrl = person.profilePicture.trim()
                }
                // Priority 2: photoUrl for backward compatibility
                else if (person.photoUrl?.trim()) {
                  imageUrl = person.photoUrl.trim()
                }
                // Priority 3: First photo from photo array if no profilePicture
                else if (person.photo && Array.isArray(person.photo) && person.photo.length > 0) {
                  const firstValidPhoto = person.photo.find(photo => 
                    typeof photo === 'string' && photo.trim()
                  )
                  if (firstValidPhoto) {
                    imageUrl = firstValidPhoto.trim()
                  }
                }

                return (
                  <Card 
                    key={person.id} 
                    className="group hover:shadow-lg transition-all duration-200 cursor-pointer"
                    onClick={() => handleCastClick(person.type as 'actor' | 'actress', person.name || '')}
                  >
                    <CardContent className="p-0">
                      {/* Profile Picture */}
                      <div className="aspect-[3/4] overflow-hidden rounded-t-lg bg-muted relative">
                        {imageUrl ? (
                          <>
                            <img
                              src={imageUrl}
                              alt={person.name || 'Person'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                // Simply hide the img and show the fallback
                                e.currentTarget.style.display = 'none'
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement
                                if (fallback) fallback.style.display = 'flex'
                              }}
                            />
                            {/* Broken image fallback */}
                            <div 
                              className="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground"
                              style={{ display: 'none' }}
                            >
                              <User className="h-8 w-8 mb-2" />
                              <span className="text-xs text-center px-2">Image not available</span>
                            </div>
                          </>
                        ) : (
                          /* No image URL fallback */
                          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                            <User className="h-12 w-12" />
                          </div>
                        )}

                        {/* Favorite Button */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <SimpleFavoriteButton
                            type="cast"
                            itemId={person.name || ''}
                            size="sm"
                            variant="ghost"
                            className="bg-black/20 hover:bg-black/40 backdrop-blur-sm"
                          />
                        </div>
                      </div>
                      
                      {/* Info */}
                      <div className="p-3 space-y-1">
                        <h3 className="font-medium text-sm truncate" title={person.name}>
                          {person.name || 'Unnamed'}
                        </h3>
                        
                        {person.jpname && (
                          <p className="text-xs text-muted-foreground truncate" title={person.jpname}>
                            {person.jpname}
                          </p>
                        )}
                        
                        {person.birthdate && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{calculateAge(person.birthdate)} tahun</span>
                          </div>
                        )}
                        
                        {/* Movie count badge */}
                        {person.movieCount !== undefined && person.movieCount > 0 && (
                          <p className="text-xs text-muted-foreground">
                            🎬 {person.movieCount} movies
                          </p>
                        )}
                        
                        {/* Type badge */}
                        <p className="text-xs text-muted-foreground capitalize">
                          {person.type}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Series Tab */}
        <TabsContent value="series" className="space-y-4">
          {isLoadingData ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading series...</p>
            </div>
          ) : favoriteCounts.series === 0 ? (
            <div className="text-center py-12">
              <PlayCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No favorite series yet</p>
              <p className="text-sm text-muted-foreground mt-2">Add series to your favorites to see them here</p>
            </div>
          ) : !filteredData.series.length ? (
            <div className="text-center py-12">
              <PlayCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No series match your search</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your search terms</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {filteredData.series.map((series) => (
                <Card 
                  key={series.favoriteId}
                  className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden group"
                  onClick={() => handleSeriesClick(series.name)}
                >
                  <div className="relative">
                    <MovieThumbnail
                      movie={getOldestMovie(series.movies)}
                      onClick={() => handleSeriesClick(series.name)}
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
                    <h3 className="font-medium line-clamp-2 text-sm">{series.name}</h3>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary" className="text-xs">
                        {series.movies.length} movies
                      </Badge>
                      {(() => {
                        const oldestMovie = getOldestMovie(series.movies)
                        return oldestMovie?.releaseDate ? (
                          <span className="text-xs text-muted-foreground">
                            {new Date(oldestMovie.releaseDate).getFullYear()}
                          </span>
                        ) : null
                      })()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Lightbox */}
      {filteredData.images.length > 0 && (
        <LightboxWithThumbnails
          images={filteredData.images.map(img => img.url)}
          currentIndex={selectedImageIndex}
          isOpen={showLightbox}
          onClose={() => setShowLightbox(false)}
          onIndexChange={setSelectedImageIndex}
          altPrefix="Favorite image"
          defaultZoom={getDefaultZoom(filteredData.images[selectedImageIndex]?.movieType)}
          metadata={filteredData.images[selectedImageIndex] ? {
            sourceType: filteredData.images[selectedImageIndex].sourceType,
            sourceTitle: filteredData.images[selectedImageIndex].sourceTitle,
            movieCode: filteredData.images[selectedImageIndex].movieCode,
            actresses: filteredData.images[selectedImageIndex].actresses,
            actors: filteredData.images[selectedImageIndex].actors,
            releaseDate: filteredData.images[selectedImageIndex].releaseDate,
            onTitleClick: () => handleSourceClick(filteredData.images[selectedImageIndex]),
            onCastClick: handleCastClick
          } : undefined}
        />
      )}
    </div>
  )
}