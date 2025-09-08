import { useState, useEffect, useMemo } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  ImageOff, 
  Filter, 
  Images, 
  Globe,
  Maximize
} from 'lucide-react'
import { MasterDataItem, masterDataApi, calculateAge } from '../../utils/masterDataApi'
import { Movie, movieApi } from '../../utils/movieApi'
import { SimpleFavoriteButton } from '../SimpleFavoriteButton'
import { ModernLightbox } from '../ModernLightbox'
import { toast } from 'sonner@2.0.3'

interface GroupDetailContentProps {
  group: MasterDataItem
  accessToken: string
  searchQuery?: string
  onBack: () => void
  onProfileSelect: (type: 'actress' | 'actor', name: string) => void
}

const sortOptions = [
  { key: 'name', label: 'Name (A-Z)', getValue: (actress: MasterDataItem) => actress.name?.toLowerCase() || '' },
  { key: 'name-desc', label: 'Name (Z-A)', getValue: (actress: MasterDataItem) => actress.name?.toLowerCase() || '' },
  { key: 'age', label: 'Age (Young)', getValue: (actress: MasterDataItem) => actress.birthdate ? calculateAge(actress.birthdate) : 999 },
  { key: 'age-desc', label: 'Age (Old)', getValue: (actress: MasterDataItem) => actress.birthdate ? calculateAge(actress.birthdate) : 0 },
  { key: 'movieCount', label: 'Movies (Few)', getValue: (actress: MasterDataItem) => actress.movieCount || 0 },
  { key: 'movieCount-desc', label: 'Movies (Many)', getValue: (actress: MasterDataItem) => actress.movieCount || 0 },
]

export function GroupDetailContent({ 
  group, 
  accessToken, 
  searchQuery = '', 
  onBack, 
  onProfileSelect 
}: GroupDetailContentProps) {
  const [actresses, setActresses] = useState<MasterDataItem[]>([])
  const [groupMembers, setGroupMembers] = useState<MasterDataItem[]>([])
  const [movies, setMovies] = useState<Movie[]>([])
  const [sortBy, setSortBy] = useState('name')
  const [isLoading, setIsLoading] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxTitle, setLightboxTitle] = useState('')
  const [activeTab, setActiveTab] = useState('members')

  useEffect(() => {
    loadActresses()
  }, [accessToken, group.name])

  const loadActresses = async () => {
    try {
      setIsLoading(true)
      
      // Load both actresses and movies data
      const [actressesData, moviesData] = await Promise.all([
        masterDataApi.getByType('actress', accessToken),
        movieApi.getMovies(accessToken)
      ])
      
      setMovies(moviesData || [])
      
      // Calculate movie counts for each actress
      const actressesWithMovieCount = (actressesData || []).map(actress => {
        const actressMovies = (moviesData || []).filter(movie => {
          const actressField = movie.actress
          if (typeof actressField === 'string') {
            return actressField.toLowerCase().includes(actress.name?.toLowerCase() || '')
          }
          return false
        })
        
        return {
          ...actress,
          movieCount: actressMovies.length
        }
      })
      
      // Filter actresses that belong to this group
      const members = actressesWithMovieCount.filter(actress => 
        actress.selectedGroups && actress.selectedGroups.includes(group.name)
      )
      
      setActresses(actressesWithMovieCount)
      setGroupMembers(members)
    } catch (error) {
      console.error('Error loading actresses:', error)
      toast.error('Failed to load actresses')
    } finally {
      setIsLoading(false)
    }
  }

  const getGroupProfilePicture = (actress: MasterDataItem, groupName: string) => {
    // Check groupProfilePictures first
    if (actress.groupProfilePictures && typeof actress.groupProfilePictures === 'object') {
      const groupPic = actress.groupProfilePictures[groupName]
      if (groupPic && groupPic.trim()) {
        return groupPic.trim()
      }
    }
    
    // Check groupData structure
    if (actress.groupData && typeof actress.groupData === 'object') {
      const groupInfo = actress.groupData[groupName]
      if (groupInfo?.profilePicture?.trim()) {
        return groupInfo.profilePicture.trim()
      }
      
      // Check photos array
      if (groupInfo?.photos && Array.isArray(groupInfo.photos) && groupInfo.photos.length > 0) {
        const firstPhoto = groupInfo.photos[0]?.trim()
        if (firstPhoto) return firstPhoto
      }
    }
    
    return null
  }

  const getGroupAlias = (actress: MasterDataItem, groupName: string) => {
    // Check groupAliases first
    if (actress.groupAliases && actress.groupAliases[groupName]) {
      return actress.groupAliases[groupName]
    }
    
    // Check groupData structure
    if (actress.groupData && actress.groupData[groupName]?.alias?.trim()) {
      return actress.groupData[groupName].alias.trim()
    }
    
    return null
  }

  // Filter and sort group members based on search
  const filteredAndSortedMembers = useMemo(() => {
    let filtered = groupMembers
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = groupMembers.filter(actress => {
        const name = actress.name?.toLowerCase() || ''
        const jpname = actress.jpname?.toLowerCase() || ''
        const alias = actress.alias?.toLowerCase() || ''
        const groupAlias = getGroupAlias(actress, group.name || '')?.toLowerCase() || ''
        
        return name.includes(query) || 
               jpname.includes(query) || 
               alias.includes(query) ||
               groupAlias.includes(query)
      })
    }
    
    // Apply sorting
    const sortOption = sortOptions.find(option => option.key === sortBy)
    if (!sortOption) return filtered
    
    const isDesc = sortBy.endsWith('-desc')
    return [...filtered].sort((a, b) => {
      const aVal = sortOption.getValue(a)
      const bVal = sortOption.getValue(b)
      
      if (aVal < bVal) return isDesc ? 1 : -1
      if (aVal > bVal) return isDesc ? -1 : 1
      return 0
    })
  }, [groupMembers, searchQuery, sortBy, group.name])

  const openImageViewer = (images: string[], startIndex: number = 0, title: string = '') => {
    setLightboxImages(images)
    setLightboxIndex(startIndex)
    setLightboxTitle(title)
    setLightboxOpen(true)
  }

  const handleLightboxNext = () => {
    setLightboxIndex(prev => (prev + 1) % lightboxImages.length)
  }

  const handleLightboxPrevious = () => {
    setLightboxIndex(prev => (prev - 1 + lightboxImages.length) % lightboxImages.length)
  }

  // Parse gallery photos from group data
  const groupGalleryPhotos = useMemo(() => {
    // Check for the correct gallery field from our implementation
    if (Array.isArray(group.gallery)) {
      return group.gallery.filter(url => url && url.trim()) // Filter out empty URLs
    }
    // Fallback to galleryPhotos for backward compatibility
    if (Array.isArray(group.galleryPhotos)) {
      return group.galleryPhotos.filter(url => url && url.trim())
    }
    return []
  }, [group.gallery, group.galleryPhotos])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading group details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Groups
          </Button>
          <Globe className="h-6 w-6" />
          <h1 className="text-3xl font-bold">{group.name}</h1>
          <Badge variant="secondary" className="ml-2">
            {groupMembers.length} {groupMembers.length === 1 ? 'member' : 'members'}
          </Badge>
        </div>
      </div>

      {/* Group Profile Picture and Info */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Group Profile Picture */}
        <div className="lg:col-span-1">
          <div className="space-y-4">
            {group.profilePicture && (
              <div 
                className="aspect-square w-full rounded-lg overflow-hidden bg-muted relative group cursor-pointer" 
                onClick={() => openImageViewer([group.profilePicture], 0, `${group.name} Profile Picture`)}
              >
                <img
                  src={group.profilePicture}
                  alt={group.name || 'Group'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Maximize className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            )}
            

          </div>
        </div>

        {/* Group Info */}
        <div className="lg:col-span-3">
          <div className="space-y-4">
            {(group.jpname || group.description || group.website) && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  {group.jpname && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Japanese Name</p>
                      <p className="text-lg">{group.jpname}</p>
                    </div>
                  )}
                  
                  {group.description && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                      <p className="text-sm">{group.description}</p>
                    </div>
                  )}
                  
                  {group.website && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Website</p>
                      <a 
                        href={group.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {group.website}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Sort Controls */}
            {groupMembers.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-4">
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

                    <div className="text-sm text-muted-foreground">
                      Showing {filteredAndSortedMembers.length} of {groupMembers.length} members
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Members
            {groupMembers.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {groupMembers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <Images className="h-4 w-4" />
            Gallery
            {groupGalleryPhotos.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {groupGalleryPhotos.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-6">
          {groupMembers.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No members yet</h3>
              <p className="text-muted-foreground">
                No actresses have been assigned to this group yet.
              </p>
            </div>
          ) : filteredAndSortedMembers.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No members found</h3>
              <p className="text-muted-foreground">
                No actresses match your search criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredAndSortedMembers.map((actress) => {
                const imageUrl = getGroupProfilePicture(actress, group.name || '')
                const groupAlias = getGroupAlias(actress, group.name || '')
                
                return (
                  <Card 
                    key={actress.id} 
                    className="group hover:shadow-lg transition-all duration-200 cursor-pointer"
                    onClick={() => onProfileSelect('actress', actress.name)}
                  >
                    <CardContent className="p-0">
                      {/* Profile Picture */}
                      <div className="aspect-[3/4] overflow-hidden rounded-t-lg bg-muted relative">
                        {imageUrl ? (
                          <>
                            <img
                              src={imageUrl}
                              alt={`${actress.name} in ${group.name}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
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
                              <ImageOff className="h-8 w-8 mb-2" />
                              <span className="text-xs text-center px-2">Group image not available</span>
                            </div>
                          </>
                        ) : (
                          /* No group-specific image placeholder */
                          <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground">
                            <User className="h-12 w-12 mb-2" />
                            <span className="text-xs text-center px-2">No group photo</span>
                          </div>
                        )}

                        {/* Favorite Button */}
                        {accessToken && (
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <SimpleFavoriteButton
                              type="cast"
                              itemId={actress.name || ''}
                              size="sm"
                              variant="ghost"
                              className="bg-black/20 hover:bg-black/40 backdrop-blur-sm"
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="p-3 space-y-1">
                        <h3 className="font-medium text-sm truncate" title={actress.name}>
                          {actress.name || 'Unnamed'}
                        </h3>
                        
                        {/* Show group alias if available */}
                        {groupAlias && (
                          <p className="text-xs text-blue-600 truncate" title={`Group alias: ${groupAlias}`}>
                            {groupAlias}
                          </p>
                        )}
                        
                        {actress.jpname && (
                          <p className="text-xs text-muted-foreground truncate" title={actress.jpname}>
                            {actress.jpname}
                          </p>
                        )}
                        
                        {actress.birthdate && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{calculateAge(actress.birthdate)} years</span>
                          </div>
                        )}
                        
                        {/* Movie count badge */}
                        {actress.movieCount !== undefined && actress.movieCount > 0 && (
                          <p className="text-xs text-muted-foreground">
                            🎬 {actress.movieCount} movies
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Gallery Tab */}
        <TabsContent value="gallery" className="mt-6">
          {groupGalleryPhotos.length === 0 ? (
            <div className="text-center py-12">
              <Images className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No gallery photos yet</h3>
              <p className="text-muted-foreground">
                This group doesn't have any gallery photos yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Click any photo to view in full screen • Use arrow keys or swipe to navigate
                </p>
                <Badge variant="outline">
                  {groupGalleryPhotos.length} {groupGalleryPhotos.length === 1 ? 'photo' : 'photos'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                {groupGalleryPhotos.map((photoUrl, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-lg overflow-hidden bg-muted relative group cursor-pointer hover:shadow-lg transition-all duration-200"
                    onClick={() => openImageViewer(groupGalleryPhotos, index, `${group.name} Gallery`)}
                  >
                    <img
                      src={photoUrl}
                      alt={`${group.name} Gallery Photo ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.currentTarget
                        const parent = target.parentElement
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground">
                              <svg class="h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                              <span class="text-xs text-center px-2">Image not available</span>
                            </div>
                          `
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white text-xs font-medium">
                            Photo {index + 1}
                          </span>
                          <Maximize className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modern Lightbox */}
      <ModernLightbox
        src={lightboxImages[lightboxIndex] || ''}
        alt={lightboxTitle}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        currentIndex={lightboxIndex}
        totalImages={lightboxImages.length}
        onNext={lightboxImages.length > 1 ? handleLightboxNext : undefined}
        onPrevious={lightboxImages.length > 1 ? handleLightboxPrevious : undefined}
        showNavigation={lightboxImages.length > 1}
        metadata={{
          sourceType: 'photobook',
          sourceTitle: lightboxTitle
        }}
      />
    </div>
  )
}