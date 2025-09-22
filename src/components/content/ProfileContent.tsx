import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Button } from '../ui/button'
import { LightboxWithThumbnails } from '../LightboxWithThumbnails'
// Removed SimpleImageViewer import - using LightboxWithThumbnails instead
import { ProfileSidebar } from './profile/ProfileSidebar'
import { PhotobookSelection } from './profile/PhotobookSelection'
import { MoviesGrid } from './profile/MoviesGrid'
import { PhotobooksGrid } from './profile/PhotobooksGrid'
import { PhotobookGallery } from './profile/PhotobookGallery'
import { ActressesGrid } from './profile/ActressesGrid'
import { StudiosGrid } from './profile/StudiosGrid'
import { SeriesGrid } from './profile/SeriesGrid'
import { processProfileImages, getAllProfileImages } from './profile/helpers'
import { ProfileContentProps, ProfileState } from './profile/types'
import { masterDataApi, MasterDataItem } from '../../utils/masterDataApi'
import { movieApi } from '../../utils/movieApi'
import { photobookApi, photobookHelpers } from '../../utils/photobookApi'
import { useCachedData } from '../../hooks/useCachedData'
import { ArrowLeft, Film, Camera, Users, Building, List, Edit } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { ActorForm } from '../ActorForm'

export function ProfileContent({ type, name, accessToken, searchQuery = '', onBack, onMovieSelect, onPhotobookSelect, onGroupSelect, onSCMovieSelect, onProfileSelect, onEditProfile }: ProfileContentProps) {
  const { loadData: loadCachedData } = useCachedData()
  const [state, setState] = useState<ProfileState>({
    profile: null,
    movies: [],
    photobooks: [],
    isLoading: true,
    error: '',
    selectedPhotobook: null,
    lightboxOpen: false,
    lightboxIndex: 0,
    lightboxImages: [],
    profileLightboxOpen: false,
    profileLightboxIndex: 0,
    profileImages: [],
    activeTab: 'movies',
    galleryTab: 'nn'
  })
  const [showEditDialog, setShowEditDialog] = useState(false)

  // State for collaboration filtering
  const [collaborationFilter, setCollaborationFilter] = useState<{
    actorName: string
    actressName: string
  } | null>(null)

  // State for director filtering (studio/series)
  const [directorFilter, setDirectorFilter] = useState<{
    directorName: string
    filterType: 'studio' | 'series'
    filterValue: string
  } | null>(null)

  // State for dynamic search results
  const [searchResults, setSearchResults] = useState<{
    actresses: MasterDataItem[]
    actors: MasterDataItem[]
    directors: MasterDataItem[]
  }>({
    actresses: [],
    actors: [],
    directors: []
  })

  useEffect(() => {
    loadData()
  }, [name, type, accessToken])

  // Dynamic search effect
  useEffect(() => {
    if (searchQuery.trim()) {
      performDynamicSearch(searchQuery.trim())
    } else {
      // Clear search results when search query is empty
      setSearchResults({
        actresses: [],
        actors: [],
        directors: []
      })
    }
  }, [searchQuery])

  // Function to perform dynamic search
  const performDynamicSearch = async (query: string) => {
    try {
      const [actresses, actors, directors] = await Promise.all([
        masterDataApi.getByType('actress', accessToken),
        masterDataApi.getByType('actor', accessToken),
        masterDataApi.getByType('director', accessToken)
      ])

      // Filter results based on search query
      const filteredActresses = actresses.filter(item => 
        item.name?.toLowerCase().includes(query.toLowerCase()) ||
        item.jpname?.toLowerCase().includes(query.toLowerCase()) ||
        item.alias?.toLowerCase().includes(query.toLowerCase())
      )

      const filteredActors = actors.filter(item => 
        item.name?.toLowerCase().includes(query.toLowerCase()) ||
        item.jpname?.toLowerCase().includes(query.toLowerCase()) ||
        item.alias?.toLowerCase().includes(query.toLowerCase())
      )

      const filteredDirectors = directors.filter(item => 
        item.name?.toLowerCase().includes(query.toLowerCase()) ||
        item.jpname?.toLowerCase().includes(query.toLowerCase()) ||
        item.alias?.toLowerCase().includes(query.toLowerCase())
      )

      setSearchResults({
        actresses: filteredActresses,
        actors: filteredActors,
        directors: filteredDirectors
      })
    } catch (error) {
      console.error('Error performing dynamic search:', error)
    }
  }

  // Process profile images when profile data is loaded
  useEffect(() => {
    if (state.profile) {
      const profileImages = getAllProfileImages(state.profile)
      setState(prev => ({ ...prev, profileImages }))
    }
  }, [state.profile])

  const loadData = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: '' }))

    try {
      // Load profile data using cache (same as movie detail page)
      const profiles = await loadCachedData(type, () => masterDataApi.getByType(type, accessToken))
      const foundProfile = profiles.find(p => p.name === name)

      // Load movies
      const allMovies = await movieApi.getMovies(accessToken)
      let filteredMovies = []
      
      if (type === 'director') {
        // For directors, find movies they directed
        filteredMovies = allMovies.filter(movie => movie.director === name)
      } else {
        // For actors/actresses, find movies they appeared in
        filteredMovies = allMovies.filter(movie => {
          const castField = type === 'actor' ? movie.actors : movie.actress
          if (!castField) return false
          return castField.split(',').map(n => n.trim()).includes(name)
        })
      }

      // Load photobooks (only for actresses)
      let photobooks = []
      if (type === 'actress') {
        try {
          photobooks = await photobookApi.getPhotobooksByActress(name, accessToken)
        } catch (photobookError) {
          console.error('Failed to load actress photobooks:', photobookError)
        }
      }

      setState(prev => ({
        ...prev,
        profile: foundProfile || null,
        movies: filteredMovies,
        photobooks,
        isLoading: false
      }))
    } catch (error: any) {
      console.error('Failed to load profile data:', error)
      setState(prev => ({
        ...prev,
        error: 'Failed to load profile data',
        isLoading: false
      }))
      toast.error('Failed to load profile data')
    }
  }

  const handlePhotobookSelect = (photobook) => {
    setState(prev => ({
      ...prev,
      selectedPhotobook: photobook,
      galleryTab: 'nn'
    }))
  }

  const handleBackToPhotobooks = () => {
    setState(prev => ({
      ...prev,
      selectedPhotobook: null,
      galleryTab: 'nn'
    }))
  }

  const handleImageClick = (images, index) => {
    setState(prev => ({
      ...prev,
      lightboxImages: images,
      lightboxIndex: index,
      lightboxOpen: true
    }))
  }

  const handleProfilePictureClick = () => {
    if (state.profileImages.length > 0) {
      setState(prev => ({
        ...prev,
        profileLightboxIndex: 0,
        profileLightboxOpen: true
      }))
    } else if (state.profile?.profilePicture) {
      setState(prev => ({
        ...prev,
        profileImages: [state.profile.profilePicture],
        profileLightboxIndex: 0,
        profileLightboxOpen: true
      }))
    }
  }

  const handleActressCollaboration = (actorName: string, actressName: string) => {
    // Handle collaboration filtering internally without changing the main content state
    setCollaborationFilter({ actorName, actressName })
    // Switch to movies tab to show the filtered results
    setState(prev => ({ ...prev, activeTab: 'movies' }))
  }

  const handleBackFromCollaboration = () => {
    setCollaborationFilter(null)
  }

  const handleDirectorStudioFilter = (directorName: string, studioName: string) => {
    setDirectorFilter({ directorName, filterType: 'studio', filterValue: studioName })
    // Switch to movies tab to show the filtered results
    setState(prev => ({ ...prev, activeTab: 'movies' }))
  }

  const handleDirectorSeriesFilter = (directorName: string, seriesName: string) => {
    setDirectorFilter({ directorName, filterType: 'series', filterValue: seriesName })
    // Switch to movies tab to show the filtered results
    setState(prev => ({ ...prev, activeTab: 'movies' }))
  }

  const handleBackFromDirectorFilter = () => {
    setDirectorFilter(null)
  }

  // Handle navigation to profile from search results
  const handleProfileNavigation = (profileType: 'actor' | 'actress' | 'director', profileName: string) => {
    // Use the onMovieSelect callback to trigger navigation
    // The UnifiedApp will handle the actual navigation
    onMovieSelect(`${profileType}:${profileName}`)
  }

  // Get filtered images based on current gallery tab
  const getFilteredImages = () => {
    if (!state.selectedPhotobook) return []
    
    switch (state.galleryTab) {
      case 'nn':
        return photobookHelpers.getImagesForActressWithRating(state.selectedPhotobook, name, 'NN')
      case 'n':
        return photobookHelpers.getImagesForActressWithRating(state.selectedPhotobook, name, 'N')
      case 'all':
      default:
        return photobookHelpers.getImagesForActress(state.selectedPhotobook, name)
    }
  }

  // Get image counts for tabs
  const getImageCounts = () => {
    if (!state.selectedPhotobook) return { all: 0, nn: 0, n: 0 }
    
    return {
      all: photobookHelpers.getImagesForActress(state.selectedPhotobook, name).length,
      nn: photobookHelpers.getImagesForActressWithRating(state.selectedPhotobook, name, 'NN').length,
      n: photobookHelpers.getImagesForActressWithRating(state.selectedPhotobook, name, 'N').length
    }
  }

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{state.error}</p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
    )
  }

  const filteredImages = getFilteredImages()
  const imageCounts = getImageCounts()

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={state.selectedPhotobook ? handleBackToPhotobooks : onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {state.selectedPhotobook ? 'Back to Photobooks' : 'Back'}
          </Button>
          
          {/* Edit button for profile pages only (not shown when viewing photobook gallery) */}
          {!state.selectedPhotobook && (type === 'actor' || type === 'actress') && (
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(true)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit {type === 'actress' ? 'Actress' : 'Actor'}
            </Button>
          )}
        </div>

        {/* Dynamic Search Results */}
        {searchQuery.trim() && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-100">
              Search Results for "{searchQuery}"
            </h3>
            <div className="space-y-4">
              {/* Actresses Results */}
              {searchResults.actresses.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Actresses ({searchResults.actresses.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {searchResults.actresses.slice(0, 8).map((actress) => (
                      <Button
                        key={actress.name}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Navigate to actress profile
                          handleProfileNavigation('actress', actress.name)
                        }}
                        className="justify-start text-left h-auto p-2"
                      >
                        <div className="flex items-center gap-2 w-full">
                          {actress.profilePicture && (
                            <img
                              src={actress.profilePicture}
                              alt={actress.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{actress.name}</div>
                            {actress.jpname && (
                              <div className="text-xs text-muted-foreground truncate">{actress.jpname}</div>
                            )}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actors Results */}
              {searchResults.actors.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Actors ({searchResults.actors.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {searchResults.actors.slice(0, 8).map((actor) => (
                      <Button
                        key={actor.name}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Navigate to actor profile
                          handleProfileNavigation('actor', actor.name)
                        }}
                        className="justify-start text-left h-auto p-2"
                      >
                        <div className="flex items-center gap-2 w-full">
                          {actor.profilePicture && (
                            <img
                              src={actor.profilePicture}
                              alt={actor.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{actor.name}</div>
                            {actor.jpname && (
                              <div className="text-xs text-muted-foreground truncate">{actor.jpname}</div>
                            )}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Directors Results */}
              {searchResults.directors.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Directors ({searchResults.directors.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {searchResults.directors.slice(0, 8).map((director) => (
                      <Button
                        key={director.name}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Navigate to director profile
                          handleProfileNavigation('director', director.name)
                        }}
                        className="justify-start text-left h-auto p-2"
                      >
                        <div className="flex items-center gap-2 w-full">
                          {director.profilePicture && (
                            <img
                              src={director.profilePicture}
                              alt={director.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{director.name}</div>
                            {director.jpname && (
                              <div className="text-xs text-muted-foreground truncate">{director.jpname}</div>
                            )}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {searchResults.actresses.length === 0 && searchResults.actors.length === 0 && searchResults.directors.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No results found for "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          {/* Left Sidebar - Profile Info */}
          <div className="space-y-4">
            <ProfileSidebar
              profile={state.profile}
              name={name}
              type={type}
              movies={state.movies}
              photobooks={state.photobooks}
              profileImages={state.profileImages}
              onProfilePictureClick={handleProfilePictureClick}
              onGroupSelect={onGroupSelect}
            />

            {/* Current Selection Info */}
            {state.selectedPhotobook && (
              <PhotobookSelection
                selectedPhotobook={state.selectedPhotobook}
                name={name}
                imageCounts={imageCounts}
                onPhotobookSelect={onPhotobookSelect}
              />
            )}
          </div>

          {/* Right Content Area */}
          <div>
            {state.selectedPhotobook ? (
              // Filtered Gallery View with Content Rating Tabs
              <PhotobookGallery
                selectedPhotobook={state.selectedPhotobook}
                name={name}
                galleryTab={state.galleryTab}
                filteredImages={filteredImages}
                imageCounts={imageCounts}
                onGalleryTabChange={(value) => setState(prev => ({ ...prev, galleryTab: value }))}
                onImageClick={handleImageClick}
              />
            ) : (
              // Main Profile Content with Tabs
              <Tabs value={state.activeTab} onValueChange={(value) => setState(prev => ({ ...prev, activeTab: value }))}>
                <TabsList className={`grid w-full ${
                  type === 'actress' ? 'grid-cols-2' : 
                  type === 'actor' ? 'grid-cols-2' : 
                  type === 'director' ? 'grid-cols-4' :
                  'grid-cols-1'
                }`}>
                  <TabsTrigger value="movies" className="flex items-center gap-2">
                    <Film className="h-4 w-4" />
                    Movies ({state.movies.length})
                  </TabsTrigger>
                  {type === 'actress' && (
                    <TabsTrigger value="photobooks" className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Photobooks ({state.photobooks.length})
                    </TabsTrigger>
                  )}
                  {type === 'actor' && (
                    <TabsTrigger value="actresses" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Actresses
                    </TabsTrigger>
                  )}
                  {type === 'director' && (
                    <>
                      <TabsTrigger value="studios" className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Studios
                      </TabsTrigger>
                      <TabsTrigger value="series" className="flex items-center gap-2">
                        <List className="h-4 w-4" />
                        Series
                      </TabsTrigger>
                      <TabsTrigger value="actresses" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Actresses
                      </TabsTrigger>
                    </>
                  )}
                </TabsList>

                {/* Movies Tab */}
                <TabsContent value="movies" className="space-y-4">
                  {directorFilter ? (
                    // Show director filtered movies (by studio or series)
                    <div className="space-y-4">
                      {/* Director filter header with back button */}
                      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div>
                          <h3 className="font-medium text-green-900">
                            {directorFilter.filterType === 'studio' ? 'Studio' : 'Series'} Movies: {directorFilter.filterValue}
                          </h3>
                          <p className="text-sm text-green-700 mt-1">
                            Movies directed by {directorFilter.directorName} for {directorFilter.filterType} "{directorFilter.filterValue}"
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleBackFromDirectorFilter}
                          className="flex items-center gap-2"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Back to All Movies
                        </Button>
                      </div>
                      
                      {/* Filtered movies grid */}
                      <MoviesGrid
                        movies={state.movies.filter(movie => {
                          if (directorFilter.filterType === 'studio') {
                            return movie.studio === directorFilter.filterValue
                          } else {
                            return movie.series === directorFilter.filterValue
                          }
                        })}
                        name={name}
                        profile={state.profile}
                        onMovieSelect={onMovieSelect}
                        onSCMovieSelect={onSCMovieSelect}
                        onProfileSelect={handleProfileNavigation}
                        accessToken={accessToken}
                      />
                    </div>
                  ) : collaborationFilter ? (
                    // Show collaboration filtered movies
                    <div className="space-y-4">
                      {/* Collaboration header with back button */}
                      <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div>
                          <h3 className="font-medium text-blue-900">
                            Collaboration Movies: {collaborationFilter.actorName} & {collaborationFilter.actressName}
                          </h3>
                          <p className="text-sm text-blue-700 mt-1">
                            Movies featuring both {collaborationFilter.actorName} and {collaborationFilter.actressName}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleBackFromCollaboration}
                          className="flex items-center gap-2"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Back to All Movies
                        </Button>
                      </div>
                      
                      {/* Filtered movies grid */}
                      <MoviesGrid
                        movies={state.movies.filter(movie => {
                          // Filter movies that have both actor and actress
                          const hasActor = movie.actors && 
                            movie.actors.split(',').map(n => n.trim()).includes(collaborationFilter.actorName)
                          const hasActress = movie.actress && 
                            movie.actress.split(',').map(n => n.trim()).includes(collaborationFilter.actressName)
                          return hasActor && hasActress
                        })}
                        name={name}
                        profile={state.profile}
                        onMovieSelect={onMovieSelect}
                        onSCMovieSelect={onSCMovieSelect}
                        onProfileSelect={handleProfileNavigation}
                        accessToken={accessToken}
                        collaborationInfo={{
                          actorName: collaborationFilter.actorName,
                          actressName: collaborationFilter.actressName
                        }}
                      />
                    </div>
                  ) : (
                    // Show regular movies - removed onFilterSelect prop to allow internal series filtering
                    <MoviesGrid
                      movies={state.movies}
                      name={name}
                      profile={state.profile}
                      onMovieSelect={onMovieSelect}
                      onSCMovieSelect={onSCMovieSelect}
                      onProfileSelect={handleProfileNavigation}
                      accessToken={accessToken}
                    />
                  )}
                </TabsContent>

                {/* Photobooks Tab */}
                {type === 'actress' && (
                  <TabsContent value="photobooks" className="space-y-4">
                    <PhotobooksGrid
                      photobooks={state.photobooks}
                      name={name}
                      onPhotobookSelect={handlePhotobookSelect}
                    />
                  </TabsContent>
                )}

                {/* Actresses Tab for Actor */}
                {type === 'actor' && (
                  <TabsContent value="actresses" className="space-y-4">
                    <ActressesGrid
                      actorName={name}
                      movies={state.movies}
                      onMovieFilter={handleActressCollaboration}
                      onProfileSelect={onProfileSelect}
                      accessToken={accessToken}
                    />
                  </TabsContent>
                )}

                {/* Director-specific tabs */}
                {type === 'director' && (
                  <>
                    <TabsContent value="studios" className="space-y-4">
                      <StudiosGrid
                        directorName={name}
                        movies={state.movies}
                        onMovieFilter={handleDirectorStudioFilter}
                      />
                    </TabsContent>

                    <TabsContent value="series" className="space-y-4">
                      <SeriesGrid
                        directorName={name}
                        movies={state.movies}
                        onMovieFilter={handleDirectorSeriesFilter}
                      />
                    </TabsContent>

                    <TabsContent value="actresses" className="space-y-4">
                      <ActressesGrid
                        actorName={name}
                        movies={state.movies}
                        onMovieFilter={handleActressCollaboration}
                        onProfileSelect={onProfileSelect}
                        accessToken={accessToken}
                      />
                    </TabsContent>
                  </>
                )}
              </Tabs>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox - Using LightboxWithThumbnails for gallery support */}
      <LightboxWithThumbnails
        images={state.lightboxImages}
        currentIndex={state.lightboxIndex}
        isOpen={state.lightboxOpen}
        onClose={() => setState(prev => ({ ...prev, lightboxOpen: false }))}
        onIndexChange={(index) => setState(prev => ({ ...prev, lightboxIndex: index }))}
        altPrefix={`Photobook Image`}
      />
      
      {/* Profile Pictures Lightbox - Using LightboxWithThumbnails for enhanced gallery support */}
      <LightboxWithThumbnails
        images={state.profileImages}
        currentIndex={state.profileLightboxIndex}
        isOpen={state.profileLightboxOpen}
        onClose={() => setState(prev => ({ ...prev, profileLightboxOpen: false }))}
        onIndexChange={(index) => setState(prev => ({ ...prev, profileLightboxIndex: index }))}
        altPrefix={`${name} Profile`}
        disableZoom={false}
        metadata={{
          sourceType: 'cast' as any,
          sourceTitle: name,
          onTitleClick: () => {
            // Already on profile page, just close lightbox
            setState(prev => ({ ...prev, profileLightboxOpen: false }))
          }
        }}
      />

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          style={{
            maxWidth: '4xl',
            width: '100%',
            maxHeight: '90vh',
            height: '90vh'
          }}
        >
          <DialogHeader>
            <DialogTitle>
              Edit {type === 'actress' ? 'Actress' : 'Actor'}
            </DialogTitle>
            <DialogDescription>
              Ubah informasi {type === 'actress' ? 'actress' : 'actor'} {state.profile?.name || 'ini'}.
            </DialogDescription>
          </DialogHeader>
          <ActorForm
            type={type}
            accessToken={accessToken}
            initialData={state.profile || undefined}
            onSaved={(updatedProfile) => {
              setState(prev => ({ ...prev, profile: updatedProfile }))
              setShowEditDialog(false)
              toast.success(`${type === 'actress' ? 'Actress' : 'Actor'} berhasil diperbarui`)
            }}
            onClose={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}