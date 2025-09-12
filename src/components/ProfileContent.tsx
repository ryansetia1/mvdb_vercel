import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Separator } from './ui/separator'
import { ExternalLink, Calendar, User, Tag, Edit } from 'lucide-react'
import { MasterDataItem, masterDataApi, calculateAge } from '../utils/masterDataApi'
import { Movie, movieApi } from '../utils/movieApi'
import { PhotoCycler } from './PhotoCycler'
import { MovieThumbnail } from './MovieThumbnail'
import { ModernLightbox } from './ModernLightbox'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { processTemplate } from '../utils/templateUtils'
import { TakuLinksIframe } from './TakuLinksIframe'

interface ProfileContentProps {
  type: 'actor' | 'actress' | 'director'
  name: string
  accessToken: string
  onMovieSelect: (movie: Movie) => void
}

export function ProfileContent({ type, name, accessToken, onMovieSelect }: ProfileContentProps) {
  const [profileData, setProfileData] = useState<MasterDataItem | null>(null)
  const [movies, setMovies] = useState<Movie[]>([])
  const [groupData, setGroupData] = useState<MasterDataItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  // Load profile data
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        console.log(`ProfileContent: Loading profile data for ${type}: ${name}`)
        
        // Try to get detailed profile from master data
        let masterData: MasterDataItem[] = []
        try {
          masterData = await masterDataApi.getByType(type, accessToken)
          console.log(`ProfileContent: Loaded ${masterData.length} ${type} records from master data`)
          console.log(`ProfileContent: Master data sample:`, masterData.slice(0, 2))
        } catch (masterError) {
          console.warn(`ProfileContent: Failed to load ${type} master data:`, masterError)
        }
        
        // Find matching profile
        const profile = masterData.find(item => 
          item.name?.toLowerCase() === name.toLowerCase()
        )
        
        console.log(`ProfileContent: Found profile for ${name}:`, profile)
        console.log(`ProfileContent: Profile photos:`, profile?.photo)
        console.log(`ProfileContent: Profile picture:`, profile?.profilePicture)
        setProfileData(profile || null)
        
        // Load group data if actress has a group
        if (type === 'actress' && profile?.groupId) {
          try {
            const groupData = await masterDataApi.getByType('group', accessToken)
            const group = groupData.find(g => g.id === profile.groupId)
            setGroupData(group || null)
            console.log(`ProfileContent: Found group data for ${profile.groupId}:`, group)
          } catch (err) {
            console.error('Error loading group data:', err)
          }
        }
        
        // Load movies featuring this person
        const allMovies = await movieApi.getMovies(accessToken)
        console.log(`ProfileContent: Loaded ${allMovies.length} total movies`)
        
        const personMovies = allMovies.filter(movie => {
          if (type === 'director') {
            return movie.director?.toLowerCase().includes(name.toLowerCase())
          } else if (type === 'actor') {
            return movie.actors?.toLowerCase().includes(name.toLowerCase())
          } else if (type === 'actress') {
            return movie.actress?.toLowerCase().includes(name.toLowerCase())
          }
          return false
        })
        
        console.log(`ProfileContent: Found ${personMovies.length} movies for ${name}`)
        console.log(`ProfileContent: Sample movie covers:`, personMovies.slice(0, 3).map(m => ({
          title: m.titleEn || m.titleJp,
          type: m.type,
          cover: m.cover,
          hasCover: !!m.cover
        })))
        setMovies(personMovies)
        
      } catch (err) {
        console.error('Error loading profile data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load profile data')
      } finally {
        setIsLoading(false)
      }
    }

    if (name && type) {
      loadProfileData()
    }
  }, [name, type, accessToken])



  const handleImageClick = (index: number) => {
    setViewerIndex(index)
    setImageViewerOpen(true)
  }

  // Get profile pictures - handle both photo array and profilePicture
  // IMPORTANT: profilePicture should be FIRST (main avatar), then additional photos from photo array
  const profilePictures = useMemo(() => {
    const photos: string[] = []
    
    // Add profilePicture as the FIRST photo (main avatar) if it exists
    if (profileData?.profilePicture?.trim()) {
      photos.push(profileData.profilePicture.trim())
    }
    
    // Add photos from photo array if they exist (these are additional photos)
    if (profileData?.photo && Array.isArray(profileData.photo)) {
      const validPhotos = profileData.photo
        .filter(photo => typeof photo === 'string' && photo.trim())
        .map(photo => photo.trim())
      photos.push(...validPhotos)
    }
    
    // Remove duplicates while preserving order (profilePicture should remain first)
    const uniquePhotos = []
    const seenPhotos = new Set()
    
    for (const photo of photos) {
      if (!seenPhotos.has(photo)) {
        uniquePhotos.push(photo)
        seenPhotos.add(photo)
      }
    }
    
    console.log(`ProfileContent: Processing photos for ${name}:`)
    console.log(`- profilePicture (main avatar):`, profileData?.profilePicture)
    console.log(`- photo array (additional):`, profileData?.photo)
    console.log(`- final photos order:`, uniquePhotos)
    console.log(`- main avatar (should be profilePicture):`, uniquePhotos[0])
    
    // Log verification that profilePicture is indeed first
    if (profileData?.profilePicture && uniquePhotos[0] !== profileData.profilePicture) {
      console.error(`ProfileContent: WRONG ORDER! Expected profilePicture "${profileData.profilePicture}" to be first, but got "${uniquePhotos[0]}"`)
    } else if (profileData?.profilePicture) {
      console.log(`ProfileContent: ✅ Avatar order correct - profilePicture is first`)
    }
    
    return uniquePhotos
  }, [profileData, name])

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading profile...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        <p>Error loading profile: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">


      {/* Profile Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <User className="h-6 w-6" />
          <h2 className="text-2xl font-bold">{name}</h2>
          <Badge variant="secondary">
            {type === 'actress' ? 'Actress' : type === 'actor' ? 'Actor' : 'Director'}
          </Badge>
        </div>
        <Badge variant="outline">
          {movies.length} movies
        </Badge>
      </div>

      {/* Two Section Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Section - Photo & Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Photos */}
          {profilePictures.length > 0 && (
            <Card>
              <CardContent className="p-6">
                {profilePictures.length === 1 ? (
                  <div 
                    className="w-full aspect-[3/4] rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => handleImageClick(0)}
                  >
                    <ImageWithFallback
                      src={profilePictures[0]}
                      alt={profileData?.name || name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <PhotoCycler
                      photos={profilePictures}
                      name={profileData?.name || name}
                      className="w-full aspect-[3/4] rounded-lg overflow-hidden cursor-pointer"
                      interval={3000}
                      onClick={() => handleImageClick(0)}
                    />
                    
                    <div className="grid grid-cols-3 gap-2">
                      {profilePictures.map((pic, index) => (
                        <div
                          key={index}
                          className="aspect-square rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleImageClick(index)}
                        >
                          <ImageWithFallback
                            src={pic}
                            alt={`${profileData?.name || name} photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
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
                Profile Information
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
                      <TakuLinksIframe 
                        takulinks={profileData.takulinks} 
                        variant="default"
                      />
                    </div>
                  )}
                  
                  {/* Group Information for Actress */}
                  {type === 'actress' && groupData && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Group</h4>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        {groupData.profilePicture && (
                          <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                            <ImageWithFallback
                              src={groupData.profilePicture}
                              alt={groupData.name || 'Group'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{groupData.name}</p>
                          {groupData.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {groupData.description}
                            </p>
                          )}
                        </div>
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
              {movies.length === 0 ? (
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
                      {/* Cover using MovieThumbnail */}
                      <div className="mb-2">
                        <MovieThumbnail
                          movie={movie}
                          onClick={() => onMovieSelect(movie)}
                          showHoverEffect={true}
                          className="group"
                          maxHeight="max-h-[120px]"
                        />
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
    </div>
  )
}