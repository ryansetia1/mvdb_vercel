import { useState, useMemo, useEffect } from 'react'
import { useGlobalKeyboardPagination } from '../../hooks/useGlobalKeyboardPagination'
import { MasterDataItem, masterDataApi, calculateAge, castMatchesQuery } from '../../utils/masterDataApi'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { SimpleFavoriteButton } from '../SimpleFavoriteButton'
import { PaginationEnhanced } from '../ui/pagination-enhanced'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Button } from '../ui/button'
import { User, Calendar, ImageOff, Filter, X } from 'lucide-react'

interface FilteredActressesContentProps {
  filterType: string
  filterValue: string
  searchQuery: string
  onProfileSelect: (type: 'actress' | 'actor', name: string) => void
  accessToken: string
}

const sortOptions = [
  { key: 'name', label: 'Name (A-Z)', getValue: (actress: MasterDataItem) => actress.name?.toLowerCase() || '' },
  { key: 'name-desc', label: 'Name (Z-A)', getValue: (actress: MasterDataItem) => actress.name?.toLowerCase() || '' },
  { key: 'age', label: 'Age (Young)', getValue: (actress: MasterDataItem) => actress.birthdate ? calculateAge(actress.birthdate) : 999 },
  { key: 'age-desc', label: 'Age (Old)', getValue: (actress: MasterDataItem) => actress.birthdate ? calculateAge(actress.birthdate) : 0 },
  { key: 'movieCount', label: 'Movies (Few)', getValue: (actress: MasterDataItem) => actress.movieCount || 0 },
  { key: 'movieCount-desc', label: 'Movies (Many)', getValue: (actress: MasterDataItem) => actress.movieCount || 0 },
]

const getGroupProfilePicture = (actress: MasterDataItem, filterType: string, filterValue: string) => {
  // Only apply group-specific logic for group filters
  if (filterType !== 'group' || !filterValue) {
    // For non-group filters, use regular profile picture logic
    if (actress.profilePicture?.trim()) {
      return actress.profilePicture.trim()
    }
    if (actress.photoUrl?.trim()) {
      return actress.photoUrl.trim()
    }
    if (actress.photo && Array.isArray(actress.photo) && actress.photo.length > 0) {
      const firstValidPhoto = actress.photo.find(photo => 
        typeof photo === 'string' && photo.trim()
      )
      if (firstValidPhoto) {
        return firstValidPhoto.trim()
      }
    }
    return null
  }

  // For group filters, check group-specific photos first
  // Check the current structure first (for newer data)
  if (actress.groupProfilePictures && typeof actress.groupProfilePictures === 'object') {
    if (actress.groupProfilePictures[filterValue]) {
      const groupPic = actress.groupProfilePictures[filterValue].trim()
      if (groupPic) {
        return groupPic
      }
    }
  }
  
  // Check the groupData structure (for data stored via ActorForm)
  if (actress.groupData && typeof actress.groupData === 'object') {
    if (actress.groupData[filterValue]) {
      const groupInfo = actress.groupData[filterValue]
      
      // Check for profilePicture field (saved from ActorForm)
      if (groupInfo.profilePicture && groupInfo.profilePicture.trim()) {
        return groupInfo.profilePicture.trim()
      }
      
      // Check for photos array (alternative structure)
      if (groupInfo.photos && Array.isArray(groupInfo.photos) && groupInfo.photos.length > 0) {
        const firstPhoto = groupInfo.photos[0]?.trim()
        if (firstPhoto) {
          return firstPhoto
        }
      }
    }
  }
  
  // If no group-specific picture, return null to show placeholder
  return null
}

const getGroupAlias = (actress: MasterDataItem, filterType: string, filterValue: string) => {
  // Only apply group-specific logic for group filters
  if (filterType !== 'group' || !filterValue) {
    return null
  }

  console.log(`Getting alias for ${actress.name} in group ${filterValue}`)
  
  // Check the current structure first (for newer data)
  if (actress.groupAliases && actress.groupAliases[filterValue]) {
    console.log('✅ Found groupAliases alias:', actress.groupAliases[filterValue])
    return actress.groupAliases[filterValue]
  }
  
  // Check the groupData structure (for data stored via ActorForm)
  if (actress.groupData && actress.groupData[filterValue]) {
    const groupInfo = actress.groupData[filterValue]
    if (groupInfo.alias && groupInfo.alias.trim()) {
      console.log('✅ Found groupData alias:', groupInfo.alias)
      return groupInfo.alias.trim()
    }
  }
  
  console.log('❌ No group-specific alias found')
  // Don't fallback to regular alias - only show group-specific alias
  return null
}

export function FilteredActressesContent({ 
  filterType, 
  filterValue, 
  searchQuery, 
  onProfileSelect,
  accessToken
}: FilteredActressesContentProps) {
  const [actresses, setActresses] = useState<MasterDataItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(24)
  const [sortBy, setSortBy] = useState('name')

  // Load actresses data
  useEffect(() => {
    const loadActresses = async () => {
      try {
        setLoading(true)
        const actressesData = await masterDataApi.getByType('actress', accessToken)
        setActresses(actressesData || [])
      } catch (error) {
        console.error('Failed to load actresses:', error)
        setActresses([])
      } finally {
        setLoading(false)
      }
    }

    loadActresses()
  }, [accessToken])

  const filteredAndSortedActresses = useMemo(() => {
    let filtered = actresses

    // Apply filter based on filterType
    if (filterType === 'group') {
      filtered = filtered.filter(actress => 
        actress.selectedGroups && actress.selectedGroups.includes(filterValue)
      )
    }

    // Apply search query if present
    if (searchQuery && searchQuery.trim()) {
      filtered = filtered.filter(actress => castMatchesQuery(actress, searchQuery))
    }

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
  }, [actresses, filterType, filterValue, searchQuery, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedActresses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedActresses = filteredAndSortedActresses.slice(startIndex, startIndex + itemsPerPage)

  // Keyboard navigation for pagination using global hook
  useGlobalKeyboardPagination(
    currentPage,
    totalPages,
    (page: number) => setCurrentPage(page),
    'filtered-actresses-content',
    true
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (filteredAndSortedActresses.length === 0) {
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
        </div>

        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {searchQuery 
              ? `No actresses found in ${filterType}: ${filterValue} matching "${searchQuery}"`
              : `No actresses found in ${filterType}: ${filterValue}`
            }
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {searchQuery 
            ? `Showing ${filteredAndSortedActresses.length} actresses in ${filterType}: ${filterValue} matching "${searchQuery}"`
            : `Showing ${filteredAndSortedActresses.length} actresses in ${filterType}: ${filterValue}`
          }
        </p>
      </div>

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
      </div>

      {/* Pagination - Top */}
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

      {/* Actresses Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {paginatedActresses.map((actress) => {
          // Get profile picture URL - for group filters, get group-specific photos
          const imageUrl = getGroupProfilePicture(actress, filterType, filterValue)
          const groupAlias = getGroupAlias(actress, filterType, filterValue)
          
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
                        alt={filterType === 'group' ? `${actress.name} in ${filterValue}` : (actress.name || 'Actress')}
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
                        <span className="text-xs text-center px-2">
                          {filterType === 'group' ? 'Group image not available' : 'Image not available'}
                        </span>
                      </div>
                    </>
                  ) : (
                    /* No image URL fallback */
                    <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground">
                      <User className="h-12 w-12 mb-2" />
                      <span className="text-xs text-center px-2">
                        {filterType === 'group' ? 'No group photo' : 'No photo'}
                      </span>
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
                  
                  {/* Show group alias if available for group filters */}
                  {groupAlias && (
                    <p className="text-xs text-blue-600 truncate" title={groupAlias}>
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
                      <span>{calculateAge(actress.birthdate)} tahun</span>
                    </div>
                  )}
                  
                  {/* Movie count badge */}
                  {actress.movieCount !== undefined && actress.movieCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      🎬 {actress.movieCount} movies
                    </p>
                  )}
                  
                  {/* Photo count */}
                  {(() => {
                    // Calculate total unique photos
                    const allPhotos = []
                    
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
                      const validPhotos = actress.photo
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
    </div>
  )
}