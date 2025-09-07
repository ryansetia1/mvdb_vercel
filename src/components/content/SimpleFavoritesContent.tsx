import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ImageWithFallback } from '../figma/ImageWithFallback'
import { LightboxWithThumbnails } from '../LightboxWithThumbnails'
import { SimpleFavoriteButton } from '../SimpleFavoriteButton'
import { MovieThumbnail } from '../MovieThumbnail'
import { ClickableProfileAvatar } from '../ClickableProfileAvatar'
import { useSimpleFavoritesContext } from '../../contexts/SimpleFavoritesContext'
import { Movie, movieApi } from '../../utils/movieApi'
import { Photobook, photobookApi } from '../../utils/photobookApi'
import { MasterDataItem, masterDataApi, calculateAge, castMatchesQuery, movieCodeMatchesQuery } from '../../utils/masterDataApi'
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
  actresses?: string[]
  actors?: string[]
  releaseDate?: string
}

export function SimpleFavoritesContent({ 
  accessToken,
  onMovieSelect, 
  onPhotobookSelect, 
  onProfileSelect,
  onFilterSelect,
  searchQuery
}: SimpleFavoritesContentProps) {
  const { favorites, isLoading: favoritesLoading, getFavoritesByType } = useSimpleFavoritesContext()
  
  // Data state
  const [movies, setMovies] = useState<Movie[]>([])
  const [photobooks, setPhotobooks] = useState<Photobook[]>([])
  const [cast, setCast] = useState<MasterDataItem[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  
  // Processed data
  const [favoriteMovies, setFavoriteMovies] = useState<Movie[]>([])
  const [favoriteImages, setFavoriteImages] = useState<FavoriteImageData[]>([])
  const [favoriteCast, setFavoriteCast] = useState<MasterDataItem[]>([])
  const [favoriteSeries, setFavoriteSeries] = useState<{ name: string; movies: Movie[]; favoriteId: string }[]>([])
  
  // UI state
  const [activeTab, setActiveTab] = useState('movies')
  const [showLightbox, setShowLightbox] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // Load base data once
  useEffect(() => {
    const loadBaseData = async () => {
      setIsLoadingData(true)
      try {
        const [moviesData, photobooksData, actorsData, actressesData] = await Promise.all([
          movieApi.getMovies(accessToken).catch(() => []),
          photobookApi.getPhotobooks(accessToken).catch(() => []),
          masterDataApi.getByType('actor', accessToken).catch(() => []),
          masterDataApi.getByType('actress', accessToken).catch(() => [])
        ])
        
        setMovies(moviesData)
        setPhotobooks(photobooksData)
        setCast([...actorsData, ...actressesData])
      } catch (error) {
        console.error('Failed to load base data:', error)
      } finally {
        setIsLoadingData(false)
      }
    }

    loadBaseData()
  }, [accessToken])

  // Process favorites when data changes
  useEffect(() => {
    if (!favorites.length || !movies.length) return

    // Process favorite movies
    const movieFavorites = favorites.filter(f => f.type === 'movie')
    const foundMovies = movieFavorites
      .map(f => movies.find(m => m.id === f.itemId))
      .filter(Boolean) as Movie[]
    setFavoriteMovies(foundMovies)

    // Process favorite images
    const imageFavorites = favorites.filter(f => f.type === 'image')
    const processedImages = imageFavorites
      .map(f => {
        const movie = movies.find(m => m.id === f.sourceId)
        const photobook = photobooks.find(p => p.id === f.sourceId)
        
        if (movie) {
          return {
            id: f.id,
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
            id: f.id,
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

    // Process favorite cast
    if (cast.length) {
      const castFavorites = favorites.filter(f => f.type === 'cast')
      const foundCast = castFavorites
        .map(f => cast.find(c => c.name === f.itemId))
        .filter(Boolean) as MasterDataItem[]
      setFavoriteCast(foundCast)
    }

    // Process favorite series
    const seriesFavorites = favorites.filter(f => f.type === 'series')
    const processedSeries = seriesFavorites.map(f => ({
      name: f.itemId,
      movies: movies.filter(m => m.series === f.itemId),
      favoriteId: f.id
    }))
    setFavoriteSeries(processedSeries)

  }, [favorites, movies, photobooks, cast])

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return {
        movies: favoriteMovies,
        images: favoriteImages,
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
      images: favoriteImages.filter(img => 
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
  }, [favoriteMovies, favoriteImages, favoriteCast, favoriteSeries, searchQuery])

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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="movies" className="flex items-center gap-2">
            <Film className="h-4 w-4" />
            Movies ({filteredData.movies.length})
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Images ({filteredData.images.length})
          </TabsTrigger>
          <TabsTrigger value="cast" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Cast ({filteredData.cast.length})
          </TabsTrigger>
          <TabsTrigger value="series" className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4" />
            Series ({filteredData.series.length})
          </TabsTrigger>
        </TabsList>

        {/* Movies Tab */}
        <TabsContent value="movies" className="space-y-4">
          {!filteredData.movies.length ? (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No favorite movies yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredData.movies.map((movie) => (
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
                      
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <SimpleFavoriteButton
                          type="movie"
                          itemId={movie.id!}
                          size="sm"
                          variant="ghost"
                          className="bg-black/20 hover:bg-black/40 text-white"
                        />
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
              ))}
            </div>
          )}
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-4">
          {!filteredData.images.length ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No favorite images yet</p>
            </div>
          ) : (
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
          )}
        </TabsContent>

        {/* Cast Tab */}
        <TabsContent value="cast" className="space-y-4">
          {!filteredData.cast.length ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No favorite cast yet</p>
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
          {!filteredData.series.length ? (
            <div className="text-center py-12">
              <PlayCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No favorite series yet</p>
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