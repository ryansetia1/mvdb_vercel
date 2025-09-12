import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Separator } from './ui/separator'
import { ArrowLeft, ExternalLink, Calendar, User, Tag, Edit } from 'lucide-react'
import { MasterDataItem, masterDataApi, calculateAge } from '../utils/masterDataApi'
import { Movie, movieApi } from '../utils/movieApi'
import { PhotoCycler } from './PhotoCycler'
import { ImageSlideshow } from './ImageSlideshow'
import { CroppedImage } from './CroppedImage'
import { ModernLightbox } from './ModernLightbox'
import { processTemplate } from '../utils/templateUtils'
import { ActorForm } from './ActorForm'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'

interface ProfilePageProps {
  type: 'actor' | 'actress' | 'director'
  name: string
  accessToken: string
  onBack: () => void
  onMovieSelect: (movie: Movie) => void
}

export function ProfilePage({ type, name, accessToken, onBack, onMovieSelect }: ProfilePageProps) {
  const [profileData, setProfileData] = useState<MasterDataItem | null>(null)
  const [movies, setMovies] = useState<Movie[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEditForm, setShowEditForm] = useState(false)
  const [allCastData, setAllCastData] = useState<MasterDataItem[]>([])
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  useEffect(() => {
    loadProfileData()
    loadMovies()
  }, [type, name])

  const loadProfileData = async () => {
    try {
      const masterData = await masterDataApi.getByType(type)
      const profile = masterData.find(item => item.name === name)
      setProfileData(profile || null)
      setAllCastData(masterData)
    } catch (error: any) {
      console.log('Error loading profile:', error)
      setError(`Failed to load ${type} profile`)
    }
  }

  const loadMovies = async () => {
    try {
      setIsLoading(true)
      const allMovies = await movieApi.getMovies(accessToken)
      
      // Filter movies based on type and name
      const filteredMovies = allMovies.filter((movie: Movie) => {
        switch (type) {
          case 'actress':
            return movie.actress?.toLowerCase().includes(name.toLowerCase())
          case 'actor':
            return movie.actors?.toLowerCase().includes(name.toLowerCase())
          case 'director':
            return movie.director?.toLowerCase().includes(name.toLowerCase())
          default:
            return false
        }
      })
      
      setMovies(filteredMovies)
    } catch (error: any) {
      console.log('Error loading movies:', error)
      setError(`Failed to load ${type} movies`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDataChange = (newData: MasterDataItem) => {
    setProfileData(newData)
    setAllCastData(prev => prev.map(item => item.id === newData.id ? newData : item))
    setShowEditForm(false)
  }

  const handleEditClick = () => {
    if (profileData && (type === 'actor' || type === 'actress')) {
      setShowEditForm(true)
    }
  }

  const getCoverUrl = (movie: Movie) => {
    return movie.cover && movie.dmcode 
      ? processTemplate(movie.cover, { dmcode: movie.dmcode })
      : movie.cover || ''
  }

  // Get all profile pictures (unified from profilePicture and photo fields)
  const getProfilePictures = (): string[] => {
    if (!profileData) return []
    
    const pictures: string[] = []
    
    // Add profilePicture if exists
    if (profileData.profilePicture) {
      pictures.push(profileData.profilePicture)
    }
    
    // Add photos if exist
    if (profileData.photo && Array.isArray(profileData.photo)) {
      pictures.push(...profileData.photo)
    }
    
    // Remove duplicates and empty strings
    return [...new Set(pictures)].filter(pic => pic.trim())
  }

  const profilePictures = getProfilePictures()

  const handleImageClick = (index: number) => {
    setViewerIndex(index)
    setImageViewerOpen(true)
  }


  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header with Back and Edit buttons */}
      <div className="flex justify-between items-center">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Movie
        </Button>

        {/* Show edit button only for actors and actresses */}
        {(type === 'actor' || type === 'actress') && profileData && (
          <Button
            onClick={handleEditClick}
            variant="default"
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit {type === 'actress' ? 'Actress' : 'Actor'}
          </Button>
        )}
      </div>

      {/* Two Section Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Section - Photo & Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Photos - Full Image Display */}
          {profilePictures.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Main slideshow */}
                  <ImageSlideshow
                    images={profilePictures}
                    alt={profileData?.name || name}
                    autoPlay={profilePictures.length > 1}
                    interval={3000}
                    showDots={profilePictures.length > 1}
                    showCounter={true}
                    onImageClick={() => handleImageClick(0)}
                    className="w-full"
                  />
                  
                  {/* Show all photos as clickable thumbnails */}
                  {profilePictures.length > 1 && (
                    <div className="grid grid-cols-3 gap-2">
                      {profilePictures.map((pic, index) => (
                        <div
                          key={index}
                          className="aspect-square rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleImageClick(index)}
                        >
                          <img
                            src={pic}
                            alt={`${profileData?.name || name} photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {profilePictures.length > 1 && (
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    {profilePictures.length} photos available • Click any photo to view full size
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {name}
                <Badge variant="secondary">
                  {type === 'actress' ? 'Actress' : type === 'actor' ? 'Actor' : 'Director'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileData ? (
                <>
                  {profileData.jpname && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Japanese Name</h4>
                      <p>{profileData.jpname}</p>
                    </div>
                  )}
                  
                  {profileData.birthdate && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p>
                          Age: <span className="font-medium text-lg">{calculateAge(profileData.birthdate)}</span> years old
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Born: {new Date(profileData.birthdate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {profileData.alias && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Alias</h4>
                      <p>{profileData.alias}</p>
                    </div>
                  )}
                  
                  {profileData.tags && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {profileData.tags.split(',').map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Links */}
                  {profileData.links && Array.isArray(profileData.links) && profileData.links.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Links</h4>
                      <div className="flex flex-wrap gap-2">
                        {profileData.links.map((link) => (
                          <Button
                            key={link.id}
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(link.url, '_blank')}
                            className="flex items-center gap-1"
                          >
                            {link.label}
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {type === 'actress' && profileData.takulinks && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Taku Links</h4>
                      <div className="text-sm space-y-1">
                        {profileData.takulinks.split('\n').map((link, index) => (
                          <div key={index}>
                            <a 
                              href={link.trim()} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline break-all"
                            >
                              {link.trim()}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">
                  No detailed profile information available.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Section - Movies */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Movies ({movies.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Loading movies...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">
                  <p>{error}</p>
                </div>
              ) : movies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No movies found for this {type}.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {movies.map((movie) => (
                    <div
                      key={movie.id}
                      className="cursor-pointer group"
                      onClick={() => onMovieSelect(movie)}
                    >
                      {/* Cover - Respect user's crop preference */}
                      <div className={`bg-gray-100 rounded-lg overflow-hidden mb-2 ${movie.cropCover ? 'aspect-[3/4]' : 'aspect-auto'}`}>
                        {getCoverUrl(movie) ? (
                          movie.cropCover ? (
                            // Show cropped version
                            <CroppedImage
                              src={getCoverUrl(movie)}
                              alt={movie.titleEn || movie.titleJp || 'Movie cover'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              cropToRight={true}
                            />
                          ) : (
                            // Show full image with natural aspect ratio
                            <img
                              src={getCoverUrl(movie)}
                              alt={movie.titleEn || movie.titleJp || 'Movie cover'}
                              className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-200"
                            />
                          )
                        ) : (
                          <div className="w-full h-32 flex items-center justify-center bg-gray-200 text-gray-500 text-xs">
                            No Cover
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                          {movie.titleEn || movie.titleJp || 'Untitled'}
                        </h4>
                        {movie.code && (
                          <Badge variant="outline" className="text-xs">
                            {movie.code.toUpperCase()}
                          </Badge>
                        )}
                        {movie.releaseDate && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(movie.releaseDate).getFullYear()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modern Lightbox */}
      {profilePictures.length > 0 && (
        <ModernLightbox
          src={profilePictures[viewerIndex]}
          alt={`${profileData?.name || name} photo ${viewerIndex + 1}`}
          isOpen={imageViewerOpen}
          onClose={() => setImageViewerOpen(false)}
        />
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit {type === 'actress' ? 'Actress' : 'Actor'}
            </DialogTitle>
          </DialogHeader>
          <ActorForm
            type={type === 'director' ? 'actor' : type}
            accessToken={accessToken}
            initialData={profileData || undefined}
            onSaved={handleDataChange}
            onClose={() => setShowEditForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}