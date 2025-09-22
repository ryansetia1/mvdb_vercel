import React, { useState, useMemo, useEffect } from 'react'
import { Movie } from '../../../utils/movieApi'
import { MasterDataItem, calculateAge, calculateAgeAtDate, masterDataApi } from '../../../utils/masterDataApi'
import { Card, CardContent } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { SimpleFavoriteButton } from '../../SimpleFavoriteButton'
import { PaginationEnhanced } from '../../ui/pagination-enhanced'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { Button } from '../../ui/button'
import { User, Calendar, ImageOff, Filter, Users, Film, Heart } from 'lucide-react'
import { toast } from 'sonner'

interface TakuActressesGridProps {
  actorName: string
  movies: Movie[]
  onMovieFilter: (actorName: string, actressName: string) => void
  onProfileSelect?: (type: 'actor' | 'actress' | 'director', name: string) => void
  accessToken?: string
}

const sortOptions = [
  { key: 'name', label: 'Name (A-Z)', getValue: (actress: MasterDataItem) => actress.name?.toLowerCase() || '' },
  { key: 'name-desc', label: 'Name (Z-A)', getValue: (actress: MasterDataItem) => actress.name?.toLowerCase() || '' },
  { key: 'age', label: 'Age (Young)', getValue: (actress: MasterDataItem) => actress.birthdate ? calculateAge(actress.birthdate) : 999 },
  { key: 'age-desc', label: 'Age (Old)', getValue: (actress: MasterDataItem) => actress.birthdate ? calculateAge(actress.birthdate) : 0 },
  { key: 'collaborationCount', label: 'Collaborations (Few)', getValue: (actress: any) => actress.collaborationCount || 0 },
  { key: 'collaborationCount-desc', label: 'Collaborations (Many)', getValue: (actress: any) => actress.collaborationCount || 0 },
  { key: 'ageGapAvg', label: 'Age Gap (Smallest)', getValue: (actress: any) => (typeof actress.ageGapAvg === 'number' ? actress.ageGapAvg : Number.MAX_SAFE_INTEGER) },
  { key: 'ageGapAvg-desc', label: 'Age Gap (Largest)', getValue: (actress: any) => (typeof actress.ageGapAvg === 'number' ? actress.ageGapAvg : -1) },
  { key: 'ageGapMax', label: 'Age Gap Max (Smallest)', getValue: (actress: any) => (typeof actress.ageGapMax === 'number' ? actress.ageGapMax : Number.MAX_SAFE_INTEGER) },
  { key: 'ageGapMax-desc', label: 'Age Gap Max (Largest)', getValue: (actress: any) => (typeof actress.ageGapMax === 'number' ? actress.ageGapMax : -1) },
]

export function TakuActressesGrid({ 
  actorName, 
  movies,
  onMovieFilter,
  onProfileSelect,
  accessToken
}: TakuActressesGridProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(24)
  const [sortBy, setSortBy] = useState('collaborationCount-desc')
  const [allActresses, setAllActresses] = useState<MasterDataItem[]>([])
  const [actorProfile, setActorProfile] = useState<MasterDataItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load all actresses data for detailed information and actor profile (for age gap)
  useEffect(() => {
    const loadActresses = async () => {
      try {
        setIsLoading(true)
        const [actressesData, actorsData] = await Promise.all([
          masterDataApi.getByType('actress', accessToken),
          masterDataApi.getByType('actor', accessToken)
        ])
        setAllActresses(actressesData || [])
        if (Array.isArray(actorsData)) {
          const found = actorsData.find((a: MasterDataItem) => a.name === actorName)
          setActorProfile(found || null)
        }
      } catch (error) {
        console.error('Error loading actresses:', error)
        toast.error('Failed to load actresses data')
      } finally {
        setIsLoading(false)
      }
    }

    loadActresses()
  }, [accessToken, actorName])

  // Calculate collaborating actresses and actresses with taku links
  const takuActresses = useMemo(() => {
    if (!movies.length || !allActresses.length) return []

    // Get all unique actresses that collaborated with this actor
    const actressCollaborations = new Map<string, { count: number, movies: Movie[] }>()
    
    movies.forEach(movie => {
      if (movie.actress) {
        // Split actresses by comma and process each
        const actresses = movie.actress.split(',').map(name => name.trim()).filter(name => name)
        
        actresses.forEach(actressName => {
          if (!actressCollaborations.has(actressName)) {
            actressCollaborations.set(actressName, { count: 0, movies: [] })
          }
          const collaboration = actressCollaborations.get(actressName)!
          collaboration.count++
          collaboration.movies.push(movie)
        })
      }
    })

    // Get actresses with taku links
    const actressesWithTakuLinks = allActresses.filter(actress => 
      actress.takulinks && actress.takulinks.trim().length > 0
    )

    // Combine both sets - actresses who collaborated AND actresses with taku links
    const combinedActresses = new Map<string, any>()
    
    // Add collaborating actresses
    for (const [actressName, collaboration] of actressCollaborations) {
      const actressData = allActresses.find(actress => actress.name === actressName)
      combinedActresses.set(actressName, {
        ...actressData,
        name: actressName,
        collaborationCount: collaboration.count,
        collaborationMovies: collaboration.movies,
        hasCollaboration: true,
        hasTakuLinks: false,
        id: actressData?.id || `actress-${actressName}`,
      })
    }

    // Add actresses with taku links (if not already added)
    actressesWithTakuLinks.forEach(actress => {
      if (!combinedActresses.has(actress.name)) {
        combinedActresses.set(actress.name, {
          ...actress,
          collaborationCount: 0,
          collaborationMovies: [],
          hasCollaboration: false,
          hasTakuLinks: true,
        })
      } else {
        // Update existing entry to mark it has taku links
        const existing = combinedActresses.get(actress.name)
        existing.hasTakuLinks = true
        existing.takulinks = actress.takulinks
      }
    })

    // We compute age gap per collaboration at each movie's release date
    const actorBirthdate = actorProfile?.birthdate || null

    // Match with detailed actress data and create enriched objects
    const enrichedActresses: any[] = []
    
    for (const [actressName, actressData] of combinedActresses) {
      const actressBirthdate = actressData.birthdate || null
      // Compute gaps per movie where releaseDate exists and both birthdates are known
      const gaps: number[] = []
      if (actorBirthdate && actressBirthdate && actressData.hasCollaboration) {
        actressData.collaborationMovies.forEach((m: Movie) => {
          if (m.releaseDate) {
            const actorAgeAt = calculateAgeAtDate(actorBirthdate, m.releaseDate)
            const actressAgeAt = calculateAgeAtDate(actressBirthdate, m.releaseDate)
            if (actorAgeAt !== null && actressAgeAt !== null) {
              gaps.push(Math.abs(actorAgeAt - actressAgeAt))
            }
          }
        })
      }
      const ageGapAvg = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : undefined
      const ageGapMax = gaps.length > 0 ? Math.max(...gaps) : undefined
      
      enrichedActresses.push({
        ...actressData,
        ageGapAvg,
        ageGapMax,
      })
    }

    return enrichedActresses
  }, [movies, allActresses, actorName, actorProfile])

  const filteredAndSortedActresses = useMemo(() => {
    let filtered = [...takuActresses]

    // Sort
    const sortOption = sortOptions.find(option => option.key === sortBy)
    if (sortOption) {
      const isDesc = sortBy.endsWith('-desc')
      filtered.sort((a, b) => {
        const aVal = sortOption.getValue(a)
        const bVal = sortOption.getValue(b)
        
        if (aVal < bVal) return isDesc ? 1 : -1
        if (aVal > bVal) return isDesc ? -1 : 1
        return 0
      })
    }

    return filtered
  }, [takuActresses, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedActresses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedActresses = filteredAndSortedActresses.slice(startIndex, startIndex + itemsPerPage)

  const handleActressClick = (actressName: string) => {
    onMovieFilter(actorName, actressName)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading actresses...</p>
        </div>
      </div>
    )
  }

  if (filteredAndSortedActresses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            No actresses found for {actorName}.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            This actor hasn't collaborated with any actresses and no actresses have taku links yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sort controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
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

        <div className="ml-auto text-sm text-muted-foreground">
          {filteredAndSortedActresses.length} actresses (collaborations + taku links)
        </div>
      </div>

      {/* Pagination - Top */}
      {totalPages > 1 && (
        <PaginationEnhanced
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredAndSortedActresses.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(newItemsPerPage) => {
            setItemsPerPage(newItemsPerPage)
            setCurrentPage(1)
          }}
        />
      )}

      {/* Actresses Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {paginatedActresses.map((actress) => {
          // Get profile picture URL - prioritize main profile picture
          let imageUrl = null
          
          // Priority 1: profilePicture (main image)
          if (actress.profilePicture?.trim()) {
            imageUrl = actress.profilePicture.trim()
          }
          // Priority 2: photoUrl for backward compatibility
          else if (actress.photoUrl?.trim()) {
            imageUrl = actress.photoUrl.trim()
          }
          // Priority 3: First photo from photo array if no profilePicture
          else if (actress.photo && Array.isArray(actress.photo) && actress.photo.length > 0) {
            const firstValidPhoto = actress.photo.find(photo => 
              typeof photo === 'string' && photo.trim()
            )
            if (firstValidPhoto) {
              imageUrl = firstValidPhoto.trim()
            }
          }
          
          return (
            <Card 
              key={actress.id} 
              className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-primary/20"
              onClick={() => handleActressClick(actress.name)}
            >
              <CardContent className="p-0">
                {/* Profile Picture */}
                <div className="aspect-[3/4] overflow-hidden rounded-t-lg bg-muted relative">
                  {imageUrl ? (
                    <>
                      <img
                        src={imageUrl}
                        alt={actress.name || 'Actress'}
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
                        <ImageOff className="h-8 w-8 mb-2" />
                        <span className="text-xs text-center px-2">Image not available</span>
                      </div>
                    </>
                  ) : (
                    /* No image URL fallback */
                    <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                      <User className="h-12 w-12" />
                    </div>
                  )}

                  {/* Collaboration Badge */}
                  {actress.hasCollaboration && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="text-xs bg-black/60 text-white border-0 backdrop-blur-sm">
                        <Film className="h-3 w-3 mr-1" />
                        {actress.collaborationCount}
                      </Badge>
                    </div>
                  )}

                  {/* Taku Links Badge */}
                  {actress.hasTakuLinks && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-xs bg-red-600 text-white border-0 backdrop-blur-sm">
                        <Heart className="h-3 w-3 mr-1" />
                        Taku
                      </Badge>
                    </div>
                  )}

                  {/* Favorite Button */}
                  {accessToken && (
                    <div className="absolute bottom-2 right-2 opacity-70 group-hover:opacity-100 transition-opacity">
                      <SimpleFavoriteButton
                        type="cast"
                        itemId={actress.name || ''}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 bg-white/90 hover:bg-white backdrop-blur-sm text-black shadow-lg"
                      />
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <div className="p-3 space-y-1">
                  <h3 
                    className={`font-medium text-sm truncate ${onProfileSelect ? 'text-blue-600 hover:text-blue-800 hover:underline cursor-pointer' : ''}`}
                    title={actress.name}
                    onClick={onProfileSelect ? () => onProfileSelect('actress', actress.name) : undefined}
                  >
                    {actress.name || 'Unnamed'}
                  </h3>
                  
                  {actress.jpname && (
                    <p className="text-xs text-muted-foreground truncate" title={actress.jpname}>
                      {actress.jpname}
                    </p>
                  )}
                  
                  {actress.birthdate && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{calculateAge(actress.birthdate)} tahun</span>
                    </div>
                  )}
                  
                  {/* Collaboration info */}
                  {actress.hasCollaboration && (
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <Users className="h-3 w-3" />
                      <span>{actress.collaborationCount} collaboration{actress.collaborationCount !== 1 ? 's' : ''}</span>
                    </div>
                  )}

                  {/* Taku links info */}
                  {actress.hasTakuLinks && (
                    <div className="flex items-center gap-1 text-xs text-red-600">
                      <Heart className="h-3 w-3" />
                      <span>Taku Links</span>
                    </div>
                  )}

                  {/* Age gap info (based on release dates) */}
                  {(() => {
                    const avg = typeof (actress as any).ageGapAvg === 'number' ? (actress as any).ageGapAvg as number : undefined
                    const max = typeof (actress as any).ageGapMax === 'number' ? (actress as any).ageGapMax as number : undefined
                    if (avg !== undefined || max !== undefined) {
                      const parts: string[] = []
                      if (avg !== undefined) parts.push(`avg ${Math.round(avg)}y`)
                      if (max !== undefined) parts.push(`max ${Math.round(max)}y`)
                      return (
                        <p className="text-xs text-muted-foreground">
                          Gap: {parts.join(', ')}
                        </p>
                      )
                    }
                    return null
                  })()}
                  
                  {/* Total movie count if available */}
                  {actress.movieCount !== undefined && actress.movieCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      🎬 {actress.movieCount} total movies
                    </p>
                  )}

                  {/* Generation information */}
                  {actress.generationData && Object.keys(actress.generationData).length > 0 && (
                    <div className="space-y-1">
                      {Object.entries(actress.generationData).map(([generationId, generationInfo]) => (
                        <div key={generationId} className="flex items-center gap-1">
                          <span className="text-xs text-blue-600 font-medium">
                            {generationInfo.alias || actress.name}
                          </span>
                          {generationInfo.alias && generationInfo.alias !== actress.name && (
                            <span className="text-xs text-muted-foreground">
                              ({actress.name})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Photo count */}
                  {(() => {
                    // Calculate total unique photos
                    const allPhotos: string[] = []
                    
                    // Add profilePicture if it exists
                    if (actress.profilePicture?.trim()) {
                      allPhotos.push(actress.profilePicture.trim())
                    }
                    
                    // Add photoUrl if it exists and different from profile picture
                    if (actress.photoUrl?.trim() && actress.photoUrl.trim() !== actress.profilePicture?.trim()) {
                      allPhotos.push(actress.photoUrl.trim())
                    }
                    
                    // Add photos from photo array if they exist
                    if (actress.photo && Array.isArray(actress.photo)) {
                      const validPhotos: string[] = actress.photo
                        .filter(photo => typeof photo === 'string' && photo.trim())
                        .map(photo => photo.trim())
                      allPhotos.push(...validPhotos)
                    }
                    
                    // Remove duplicates to get accurate count
                    const uniquePhotos = [...new Set(allPhotos)]
                    
                    if (uniquePhotos.length > 1) {
                      return (
                        <p className="text-xs text-muted-foreground">
                          📸 {uniquePhotos.length} foto
                        </p>
                      )
                    }
                    return null
                  })()}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Pagination - Bottom */}
      {totalPages > 1 && (
        <PaginationEnhanced
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredAndSortedActresses.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(newItemsPerPage) => {
            setItemsPerPage(newItemsPerPage)
            setCurrentPage(1)
          }}
        />
      )}

      {/* Info section */}
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
        <div className="font-medium mb-1">💡 Taku Actresses View</div>
        <div className="text-xs space-y-1">
          <div>• Shows actresses who collaborated with {actorName} OR have taku links</div>
          <div>• Red "Taku" badge indicates actresses with taku links</div>
          <div>• Film badge shows collaboration count for actresses who appeared together</div>
          <div>• Click on any actress to see movies featuring both {actorName} and that actress</div>
          <div>• Sorted by collaboration count by default (most collaborations first)</div>
        </div>
      </div>
    </div>
  )
}
