import { useState, useMemo } from 'react'
import { useGlobalKeyboardPagination } from '../../hooks/useGlobalKeyboardPagination'
import { MasterDataItem, calculateAge, castMatchesQuery } from '../../utils/masterDataApi'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { SimpleFavoriteButton } from '../SimpleFavoriteButton'
import { PaginationEnhanced } from '../ui/pagination-enhanced'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { ActorForm } from '../ActorForm'
import { User, Calendar, ImageOff, Filter, X, Edit } from 'lucide-react'

interface ActressesContentProps {
  actresses: MasterDataItem[]
  searchQuery: string
  onProfileSelect: (type: 'actress' | 'actor', name: string) => void
  accessToken?: string
  onDataChange?: (updatedActress: MasterDataItem) => void
}

const sortOptions = [
  { key: 'name', label: 'Name (A-Z)', getValue: (actress: MasterDataItem) => actress.name?.toLowerCase() || '' },
  { key: 'name-desc', label: 'Name (Z-A)', getValue: (actress: MasterDataItem) => actress.name?.toLowerCase() || '' },
  { key: 'age', label: 'Age (Young)', getValue: (actress: MasterDataItem) => actress.birthdate ? calculateAge(actress.birthdate) : 999 },
  { key: 'age-desc', label: 'Age (Old)', getValue: (actress: MasterDataItem) => actress.birthdate ? calculateAge(actress.birthdate) : 0 },
  { key: 'movieCount', label: 'Movies (Few)', getValue: (actress: MasterDataItem) => actress.movieCount || 0 },
  { key: 'movieCount-desc', label: 'Movies (Many)', getValue: (actress: MasterDataItem) => actress.movieCount || 0 },
]

export function ActressesContent({ 
  actresses, 
  searchQuery, 
  onProfileSelect,
  accessToken,
  onDataChange
}: ActressesContentProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(24)
  const [sortBy, setSortBy] = useState('name')
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingActress, setEditingActress] = useState<MasterDataItem | null>(null)

  const filteredAndSortedActresses = useMemo(() => {
    let filtered = actresses

    // Search filter (including aliases)
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
  }, [actresses, searchQuery, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedActresses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedActresses = filteredAndSortedActresses.slice(startIndex, startIndex + itemsPerPage)

  // Keyboard navigation for pagination using global hook
  useGlobalKeyboardPagination(
    currentPage,
    totalPages,
    (page: number) => setCurrentPage(page),
    'actresses-content',
    !showEditDialog // Disable when edit dialog is open
  )

  // Edit functions
  const handleEditActress = (actress: MasterDataItem) => {
    setEditingActress(actress)
    setShowEditDialog(true)
  }

  const handleActressSaved = (savedActress: MasterDataItem) => {
    setShowEditDialog(false)
    setEditingActress(null)
    // Notify parent component with updated data
    if (onDataChange) {
      onDataChange(savedActress)
    }
  }

  const handleEditDialogClose = () => {
    setShowEditDialog(false)
    setEditingActress(null)
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
            {searchQuery ? 'No actresses found matching your search.' : 'No actresses available.'}
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
          // Get profile picture URL
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

                  {/* Action Buttons */}
                  {accessToken && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 bg-black/20 hover:bg-black/40 backdrop-blur-sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditActress(actress)
                          }}
                          title="Edit Actress"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <SimpleFavoriteButton
                          type="cast"
                          itemId={actress.name || ''}
                          size="sm"
                          variant="ghost"
                          className="bg-black/20 hover:bg-black/40 backdrop-blur-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <div className="p-3 space-y-1">
                  <h3 className="font-medium text-sm truncate" title={actress.name}>
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

      {/* Edit Dialog */}
      {showEditDialog && editingActress && accessToken && (
        <Dialog open={showEditDialog} onOpenChange={handleEditDialogClose}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Actress: {editingActress.name}</DialogTitle>
            </DialogHeader>
            <ActorForm
              type="actress"
              accessToken={accessToken}
              initialData={editingActress}
              onSaved={handleActressSaved}
              onClose={handleEditDialogClose}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}