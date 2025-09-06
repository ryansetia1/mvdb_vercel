import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { FilterIndicator } from '../ui/filter-indicator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ImageWithFallback } from '../figma/ImageWithFallback'
import { LightboxWithThumbnails } from '../LightboxWithThumbnails'
import { Movie, movieApi } from '../../utils/movieApi'
import { Photobook, photobookApi } from '../../utils/photobookApi'
import { MasterDataItem, masterDataApi } from '../../utils/masterDataApi'
import { favoritesApi, FavoriteItem } from '../../utils/favoritesApi'
import { 
  Film, 
  Image as ImageIcon, 
  User, 
  PlayCircle, 
  Heart,
  Trash2,
  Calendar
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'

interface FavoritesContentProps {
  accessToken: string
  onMovieSelect: (movie: Movie) => void
  onPhotobookSelect: (photobook: Photobook) => void
  onProfileSelect: (type: 'actor' | 'actress' | 'director', name: string) => void
  searchQuery: string
  // Accept cached data from parent to avoid redundant API calls
  cachedMovies?: Movie[]
  cachedPhotobooks?: Photobook[]
  cachedCast?: MasterDataItem[]
}

interface FavoriteImageData {
  id: string
  url: string
  sourceType: 'movie' | 'photobook'
  sourceId: string
  sourceTitle: string
  movieCode?: string
  actresses?: string[]
  actors?: string[]
  releaseDate?: string
}

interface TabDataState {
  movies: { loaded: boolean; data: Movie[] }
  images: { loaded: boolean; data: FavoriteImageData[] }
  cast: { loaded: boolean; data: MasterDataItem[] }
  series: { loaded: boolean; data: any[] }
}

export function FavoritesContent({ 
  accessToken, 
  onMovieSelect, 
  onPhotobookSelect, 
  onProfileSelect,
  searchQuery,
  cachedMovies = [],
  cachedPhotobooks = [],
  cachedCast = []
}: FavoritesContentProps) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [movies, setMovies] = useState<Movie[]>(cachedMovies)
  const [photobooks, setPhotobooks] = useState<Photobook[]>(cachedPhotobooks)
  const [cast, setCast] = useState<MasterDataItem[]>(cachedCast)
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true)
  const [activeTab, setActiveTab] = useState('movies')
  const [isLoadingTabData, setIsLoadingTabData] = useState(false)
  
  // Processed favorites data (computed from favorites + source data)
  const [favoriteMovies, setFavoriteMovies] = useState<Movie[]>([])
  const [favoriteImages, setFavoriteImages] = useState<FavoriteImageData[]>([])
  const [favoriteCast, setFavoriteCast] = useState<MasterDataItem[]>([])
  const [favoriteSeries, setFavoriteSeries] = useState<any[]>([])
  
  // Lightbox state
  const [showLightbox, setShowLightbox] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  
  // Load favorites first, then load data for current tab
  useEffect(() => {
    loadFavorites()
  }, [])

  // Load tab data when favorites change or tab changes
  useEffect(() => {
    if (favorites.length > 0) {
      loadCurrentTabData()
    }
  }, [favorites, activeTab])

  const loadFavorites = async () => {
    try {
      setIsLoadingFavorites(true)
      const favoritesData = await favoritesApi.getFavorites(accessToken)
      setFavorites(favoritesData || [])
    } catch (error) {
      console.error('Failed to load favorites:', error)
      setFavorites([])
      toast.error('Could not load favorites. Please refresh to try again.', {
        action: {
          label: 'Refresh',
          onClick: () => window.location.reload()
        }
      })
    } finally {
      setIsLoadingFavorites(false)
    }
  }

  const loadCurrentTabData = async () => {
    if (!favorites.length) return
    
    try {
      setIsLoadingTabData(true)
      
      switch (activeTab) {
        case 'movies':
          await loadMoviesData()
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
      setIsLoadingTabData(false)
    }
  }

  const loadMoviesData = async () => {
    const movieFavorites = favorites.filter(f => f.type === 'movie')
    if (movieFavorites.length === 0) {
      setFavoriteMovies([])
      return
    }

    // Use cached movies if available, otherwise fetch
    let moviesData = movies
    if (moviesData.length === 0) {
      moviesData = await movieApi.getMovies(accessToken).catch(() => [])
      setMovies(moviesData)
    }

    const foundMovies = movieFavorites
      .map(f => moviesData.find(m => m.id === f.itemId))
      .filter(Boolean) as Movie[]

    setFavoriteMovies(foundMovies)
  }

  const loadImagesData = async () => {
    const imageFavorites = favorites.filter(f => f.type === 'image')
    if (imageFavorites.length === 0) {
      setFavoriteImages([])
      return
    }

    // Use cached data if available, otherwise fetch
    let moviesData = movies
    let photobooksData = photobooks

    if (moviesData.length === 0) {
      moviesData = await movieApi.getMovies(accessToken).catch(() => [])
      setMovies(moviesData)
    }
    if (photobooksData.length === 0) {
      photobooksData = await photobookApi.getPhotobooks(accessToken).catch(() => [])
      setPhotobooks(photobooksData)
    }

    const processedImages = imageFavorites
      .map(f => {
        const movie = moviesData.find(m => m.id === f.sourceId)
        const photobook = photobooksData.find(p => p.id === f.sourceId)
        
        if (movie) {
          return {
            id: f.id!,
            url: f.itemId,
            sourceType: 'movie' as const,
            sourceId: movie.id!,
            sourceTitle: movie.titleEn || movie.titleJp || '',
            movieCode: movie.dmm,
            actresses: movie.actress ? movie.actress.split(',').map(a => a.trim()).filter(a => a) : [],
            actors: movie.actors ? movie.actors.split(',').map(a => a.trim()).filter(a => a) : [],
            releaseDate: movie.releaseDate
          }
        } else if (photobook) {
          const actresses = photobook.imageTags 
            ? Array.from(new Set(photobook.imageTags.flatMap(tag => tag.actresses)))
            : photobook.actress ? photobook.actress.split(',').map(a => a.trim()).filter(a => a) : []
            
          return {
            id: f.id!,
            url: f.itemId,
            sourceType: 'photobook' as const,
            sourceId: photobook.id!,
            sourceTitle: photobook.titleEn || photobook.titleJp || '',
            movieCode: undefined,
            actresses,
            actors: [],
            releaseDate: photobook.releaseDate
          }
        }
        return null
      })
      .filter(Boolean) as FavoriteImageData[]

    setFavoriteImages(processedImages)
  }

  const loadCastData = async () => {
    const castFavorites = favorites.filter(f => f.type === 'cast')
    if (castFavorites.length === 0) {
      setFavoriteCast([])
      return
    }

    // Use cached cast if available, otherwise fetch
    let castData = cast
    if (castData.length === 0) {
      const [actorsData, actressesData] = await Promise.all([
        masterDataApi.getByType('actor', accessToken).catch(() => []),
        masterDataApi.getByType('actress', accessToken).catch(() => [])
      ])
      castData = [...(actorsData || []), ...(actressesData || [])]
      setCast(castData)
    }

    const foundCast = castFavorites
      .map(f => castData.find(c => c.name === f.itemId))
      .filter(Boolean) as MasterDataItem[]

    setFavoriteCast(foundCast)
  }

  const loadSeriesData = async () => {
    const seriesFavorites = favorites.filter(f => f.type === 'series')
    if (seriesFavorites.length === 0) {
      setFavoriteSeries([])
      return
    }

    // Use cached movies if available, otherwise fetch
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

  const removeFavorite = async (favoriteId: string) => {
    try {
      await favoritesApi.removeFavorite(favoriteId, accessToken)
      setFavorites(prev => prev.filter(f => f.id !== favoriteId))
      
      // Update relevant favorites data immediately
      const removedFavorite = favorites.find(f => f.id === favoriteId)
      if (removedFavorite) {
        switch (removedFavorite.type) {
          case 'movie':
            setFavoriteMovies(prev => prev.filter(m => m.id !== removedFavorite.itemId))
            break
          case 'image':
            setFavoriteImages(prev => prev.filter(img => img.id !== favoriteId))
            break
          case 'cast':
            setFavoriteCast(prev => prev.filter(c => c.name !== removedFavorite.itemId))
            break
          case 'series':
            setFavoriteSeries(prev => prev.filter(s => s.favoriteId !== favoriteId))
            break
        }
      }
      
      toast.success('Removed from favorites')
    } catch (error) {
      console.error('Failed to remove favorite:', error)
      toast.error('Failed to remove from favorites')
    }
  }

  // Memoized filtered data to avoid recalculating on every render
  const { filteredMovies, filteredImages, filteredCast, filteredSeries } = useMemo(() => {
    const filterBySearch = (items: any[], searchFields: string[]) => {
      if (!searchQuery.trim()) return items
      const query = searchQuery.toLowerCase()
      return items.filter(item => 
        searchFields.some(field => 
          item[field]?.toLowerCase().includes(query)
        )
      )
    }

    return {
      filteredMovies: filterBySearch(favoriteMovies, ['titleEn', 'titleJp', 'dmm']),
      filteredImages: favoriteImages.filter(img => {
        if (!searchQuery.trim()) return true
        const query = searchQuery.toLowerCase()
        return (
          img.sourceTitle.toLowerCase().includes(query) ||
          img.movieCode?.toLowerCase().includes(query) ||
          img.actresses?.some(a => a.toLowerCase().includes(query)) ||
          img.actors?.some(a => a.toLowerCase().includes(query))
      }),
      filteredCast: filterBySearch(favoriteCast, ['name']),
      filteredSeries: favoriteSeries.filter(series => {
        if (!searchQuery.trim()) return true
        const query = searchQuery.toLowerCase()
        return series.name.toLowerCase().includes(query)
      })
    }
  }, [favoriteMovies, favoriteImages, favoriteCast, favoriteSeries, searchQuery])

  // Prepare filter items for FilterIndicator
  const filterItems = useMemo(() => {
    const items = []
    
    if (searchQuery.trim()) {
      items.push({
        key: 'search',
        label: 'Search',
        value: searchQuery,
        displayValue: `"${searchQuery}"`,
        onRemove: () => {
          // Cannot clear global search from here
        }
      })
    }
    
    return items
  }, [searchQuery])

  const handleImageClick = (image: FavoriteImageData) => {
    const imageIndex = filteredImages.findIndex(img => img.id === image.id)
    setSelectedImageIndex(imageIndex)
    setShowLightbox(true)
    
    // Debug log untuk memastikan data correct
    console.log('Image clicked for lightbox:', {
      sourceType: image.sourceType,
      sourceTitle: image.sourceTitle,
      movieCode: image.movieCode,
      actresses: image.actresses,
      actors: image.actors
    })
  }

  const handleSourceClick = (image: FavoriteImageData) => {
    if (image.sourceType === 'movie') {
      const movie = movies.find(m => m.id === image.sourceId)
      if (movie) {
        onMovieSelect(movie)
        setShowLightbox(false) // Close lightbox when navigating
      }
    } else if (image.sourceType === 'photobook') {
      const photobook = photobooks.find(p => p.id === image.sourceId)
      if (photobook) {
        onPhotobookSelect(photobook)
        setShowLightbox(false) // Close lightbox when navigating
      }
    }
  }

  const handleCastClick = (type: 'actor' | 'actress', name: string) => {
    onProfileSelect(type, name)
    setShowLightbox(false) // Close lightbox when navigating
  }

  const handleNext = () => {
    if (selectedImageIndex < filteredImages.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1)
    }
  }

  if (isLoadingFavorites) {
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

      {/* Active Filters Indicator */}
      <FilterIndicator
        filters={filterItems}
        totalResults={
          activeTab === 'movies' ? filteredMovies.length :
          activeTab === 'images' ? filteredImages.length :
          activeTab === 'cast' ? filteredCast.length :
          activeTab === 'series' ? filteredSeries.length : 0
        }
        showResultCount={true}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="movies" className="flex items-center gap-2">
            <Film className="h-4 w-4" />
            Movies ({filteredMovies.length})
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Images ({filteredImages.length})
          </TabsTrigger>
          <TabsTrigger value="cast" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Cast ({filteredCast.length})
          </TabsTrigger>
          <TabsTrigger value="series" className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4" />
            Series ({filteredSeries.length})
          </TabsTrigger>
        </TabsList>

        {/* Favorite Movies Tab */}
        <TabsContent value="movies" className="space-y-4">
          {!favoriteMovies.length ? (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No favorite movies yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {favoriteMovies.map((movie) => {
                const favorite = favorites.find(f => f.type === 'movie' && f.itemId === movie.id)
                return (
                  <Card key={movie.id} className="group hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-0">
                      <div 
                        className="aspect-[3/4] relative overflow-hidden rounded-t-lg"
                        onClick={() => onMovieSelect(movie)}
                      >
                        <ImageWithFallback
                          src={movie.cover || ''}
                          alt={movie.titleEn || movie.titleJp || 'Movie cover'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        
                        {/* Remove favorite button */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (favorite?.id) removeFavorite(favorite.id)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="p-3 space-y-2">
                        <div onClick={() => onMovieSelect(movie)}>
                          <h3 className="font-medium line-clamp-2 leading-tight">
                            {movie.titleEn || movie.titleJp}
                          </h3>
                          {movie.dmm && (
                            <p className="text-sm text-muted-foreground">{movie.dmm}</p>
                          )}
                        </div>

                        {movie.releaseDate && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(movie.releaseDate).getFullYear()}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Favorite Images Tab */}
        <TabsContent value="images" className="space-y-4">
          {!favoriteImages.length ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No favorite images yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {favoriteImages.map((image) => (
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
                      
                      {/* Remove favorite button */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeFavorite(image.id)
                          }}
                        >
                          <Trash2 className="h-2 w-2" />
                        </Button>
                      </div>

                      {/* Source type badge */}
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
          )}
        </TabsContent>

        {/* Favorite Cast Tab */}
        <TabsContent value="cast" className="space-y-4">
          {!favoriteCast.length ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No favorite cast yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {favoriteCast.map((person) => {
                const favorite = favorites.find(f => f.type === 'cast' && f.itemId === person.name)
                return (
                  <Card key={person.id} className="group hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-3">
                      <div 
                        className="space-y-3"
                        onClick={() => handleCastClick(person.type as 'actor' | 'actress', person.name || '')}
                      >
                        <div className="aspect-square relative overflow-hidden rounded-lg">
                          <ImageWithFallback
                            src={person.profilePicture || (person.photo && person.photo[0]) || ''}
                            alt={person.name || 'Profile'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          
                          {/* Remove favorite button */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (favorite?.id) removeFavorite(favorite.id)
                              }}
                            >
                              <Trash2 className="h-2 w-2" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-medium line-clamp-1">{person.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {person.type}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Favorite Series Tab */}
        <TabsContent value="series" className="space-y-4">
          {!favoriteSeries.length ? (
            <div className="text-center py-12">
              <PlayCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No favorite series yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteSeries.map((series) => (
                <Card key={series.favoriteId} className="group hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{series.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {series.movies.length} movies
                        </p>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => removeFavorite(series.favoriteId)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Movie covers preview */}
                    <div className="grid grid-cols-4 gap-1">
                      {series.movies.slice(0, 4).map((movie, index) => (
                        <div 
                          key={movie.id} 
                          className="aspect-[3/4] rounded overflow-hidden cursor-pointer"
                          onClick={() => onMovieSelect(movie)}
                        >
                          <ImageWithFallback
                            src={movie.cover || ''}
                            alt={movie.titleEn || movie.titleJp || 'Movie cover'}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modern Lightbox for Images */}
      {favoriteImages.length > 0 && (
        <LightboxWithThumbnails
          images={favoriteImages.map(img => img.url)}
          currentIndex={selectedImageIndex}
          isOpen={showLightbox}
          onClose={() => setShowLightbox(false)}
          onIndexChange={setSelectedImageIndex}
          altPrefix="Favorite image"
          metadata={favoriteImages[selectedImageIndex] ? {
            sourceType: favoriteImages[selectedImageIndex].sourceType,
            sourceTitle: favoriteImages[selectedImageIndex].sourceTitle,
            movieCode: favoriteImages[selectedImageIndex].movieCode,
            actresses: favoriteImages[selectedImageIndex].actresses,
            actors: favoriteImages[selectedImageIndex].actors,
            releaseDate: favoriteImages[selectedImageIndex].releaseDate,
            onTitleClick: () => handleSourceClick(favoriteImages[selectedImageIndex]),
            onCastClick: handleCastClick
          } : undefined}
        />
      )}
    </div>
  )
}