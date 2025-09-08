import React from 'react'
import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { FilterIndicator } from '../ui/filter-indicator'
import { ImageWithFallback } from '../figma/ImageWithFallback'
import { PhotobookForm } from '../PhotobookForm'
import { PaginationEnhanced } from '../ui/pagination-enhanced'
import { SimpleFavoriteButton } from '../SimpleFavoriteButton'
import { Photobook, photobookApi } from '../../utils/photobookApi'
import { projectId } from '../../utils/supabase/info'
import { Plus, Search, Edit, Trash2, ExternalLink, Calendar, User, AlertCircle } from 'lucide-react'
import { toast } from 'sonner@2.0.3'

interface PhotobooksContentProps {
  accessToken: string
  onPhotobookSelect: (photobook: Photobook) => void 
  searchQuery?: string
}

export function PhotobooksContent({ accessToken, onPhotobookSelect, searchQuery = '' }: PhotobooksContentProps) {
  const [photobooks, setPhotobooks] = useState<Photobook[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPhotobook, setEditingPhotobook] = useState<Photobook | undefined>()
  const [internalSearchQuery, setInternalSearchQuery] = useState('')
  const [serverError, setServerError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(24)

  // Use external searchQuery if provided, otherwise use internal
  const effectiveSearchQuery = searchQuery || internalSearchQuery

  const filteredPhotobooks = useMemo(() => {
    if (!effectiveSearchQuery.trim()) return photobooks
    
    const query = effectiveSearchQuery.toLowerCase()
    return photobooks.filter(photobook =>
      photobook.titleEn?.toLowerCase().includes(query) ||
      photobook.titleJp?.toLowerCase().includes(query) ||
      photobook.actress?.toLowerCase().includes(query)
    )
  }, [photobooks, effectiveSearchQuery])

  // Prepare filter items for FilterIndicator
  const filterItems = useMemo(() => {
    const items = []
    
    if (effectiveSearchQuery.trim()) {
      items.push({
        key: 'search',
        label: 'Search',
        value: effectiveSearchQuery,
        displayValue: `"${effectiveSearchQuery}"`,
        onRemove: () => {
          if (searchQuery) {
            // Cannot clear global search from here
          } else {
            setInternalSearchQuery('')
          }
        }
      })
    }
    
    return items
  }, [effectiveSearchQuery, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredPhotobooks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedPhotobooks = filteredPhotobooks.slice(startIndex, startIndex + itemsPerPage)

  useEffect(() => {
    loadPhotobooks()
  }, [])

  const loadPhotobooks = async () => {
    try {
      setIsLoading(true)
      setServerError(null)
      console.log('Loading photobooks with access token:', accessToken ? 'present' : 'missing')
      
      // First test if server is responding
      try {
        const healthResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-785baef1/health`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        })
        
        if (healthResponse.ok) {
          const healthData = await healthResponse.json()
          console.log('Server health check:', healthData)
        } else {
          console.warn('Server health check failed:', healthResponse.status)
        }
      } catch (healthError) {
        console.warn('Server health check error:', healthError)
      }
      
      const data = await photobookApi.getPhotobooks(accessToken)
      console.log('Photobooks loaded successfully:', data)
      setPhotobooks(data)
    } catch (error: any) {
      console.error('Failed to load photobooks:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        accessToken: accessToken ? 'present' : 'missing'
      })
      setServerError(error.message || 'Unknown error')
      toast.error(`Failed to load photobooks: ${error.message || error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPhotobook = () => {
    setEditingPhotobook(undefined)
    setShowForm(true)
  }

  const handleEditPhotobook = (photobook: Photobook) => {
    setEditingPhotobook(photobook)
    setShowForm(true)
  }

  const handleDeletePhotobook = async (photobook: Photobook) => {
    if (!photobook.id) return

    if (!confirm(`Are you sure you want to delete "${photobook.titleEn}"?`)) {
      return
    }

    try {
      await photobookApi.deletePhotobook(photobook.id, accessToken)
      toast.success('Photobook deleted successfully')
      loadPhotobooks()
    } catch (error) {
      console.error('Failed to delete photobook:', error)
      toast.error('Failed to delete photobook')
    }
  }

  const handleSavePhotobook = async (photobook: Photobook) => {
    try {
      setShowForm(false)
      setEditingPhotobook(undefined)
      toast.success(`Photobook ${editingPhotobook ? 'updated' : 'created'} successfully`)
      loadPhotobooks()
    } catch (error) {
      console.error('Failed to save photobook:', error)
      toast.error('Failed to save photobook')
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingPhotobook(undefined)
  }

  const getImageCount = (photobook: Photobook): number => {
    if (!photobook.imageLinks) return 0
    
    return photobook.imageLinks.split(',').filter(link => {
      const trimmed = link.trim()
      return trimmed.length > 0
    }).length
  }

  if (showForm) {
    return (
      <PhotobookForm
        photobook={editingPhotobook}
        onSave={handleSavePhotobook}
        onCancel={handleCancelForm}
        accessToken={accessToken}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Photobooks</h1>
          <p className="text-muted-foreground">
            Manage photobook collection
          </p>
        </div>
        <Button onClick={handleAddPhotobook} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Photobook
        </Button>
      </div>

      {/* Active Filters Indicator */}
      <FilterIndicator
        filters={filterItems}
        onClearAll={effectiveSearchQuery && !searchQuery ? () => setInternalSearchQuery('') : undefined}
        totalResults={filteredPhotobooks.length}
        showResultCount={true}
      />

      {/* Search - Only show if no external searchQuery */}
      {/* Search bar kecil di bawah ini dihapus agar hanya search bar utama yang dipakai */}
      {/* {!searchQuery && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search photobooks..."
              value={internalSearchQuery}
              onChange={(e) => setInternalSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )} */}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading photobooks...</p>
        </div>
      )}

      {/* Server Error State */}
      {!isLoading && serverError && (
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="font-medium text-red-800 mb-2">Server Connection Error</h3>
            <p className="text-sm text-red-600 mb-4">{serverError}</p>
            <div className="space-y-2 text-xs text-left text-red-700 bg-red-100 p-3 rounded">
              <div><strong>Debug Info:</strong></div>
              <div>Access Token: {accessToken ? '✓ Present' : '✗ Missing'}</div>
              <div>URL: /functions/v1/make-server-785baef1/photobooks</div>
              <div>Method: GET</div>
            </div>
            <Button onClick={loadPhotobooks} variant="outline" size="sm" className="mt-4">
              Retry Connection
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredPhotobooks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {effectiveSearchQuery ? 'No photobooks found matching your search' : 'No photobooks yet'}
          </div>
          {!effectiveSearchQuery && (
            <Button onClick={handleAddPhotobook} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Photobook
            </Button>
          )}
        </div>
      )}

      {/* Content with Pagination */}
      {!isLoading && filteredPhotobooks.length > 0 && (
        <>
          {/* Pagination - Top */}
          <PaginationEnhanced
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filteredPhotobooks.length}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(newItemsPerPage) => {
              setItemsPerPage(newItemsPerPage)
              setCurrentPage(1)
            }}
          />

          {/* Photobooks Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {paginatedPhotobooks.map((photobook) => (
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
                    
                    {/* Action Buttons Overlay */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        {accessToken && (
                          <SimpleFavoriteButton
                            type="photobook"
                            itemId={photobook.id || ''}
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 p-0"
                          />
                        )}
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditPhotobook(photobook)
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeletePhotobook(photobook)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Image Count Badge */}
                    {getImageCount(photobook) > 0 && (
                      <Badge 
                        variant="secondary" 
                        className="absolute bottom-2 right-2 text-xs"
                      >
                        {getImageCount(photobook)} images
                      </Badge>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 space-y-2">
                    {/* Title */}
                    <div onClick={() => onPhotobookSelect(photobook)}>
                      <h3 className="font-medium line-clamp-2 leading-tight">
                        {photobook.titleEn}
                      </h3>
                      {photobook.titleJp && photobook.titleJp !== photobook.titleEn && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {photobook.titleJp}
                        </p>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="space-y-1">
                      {photobook.actress && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span className="truncate">{photobook.actress}</span>
                        </div>
                      )}
                      
                      {photobook.releaseDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(photobook.releaseDate).getFullYear()}</span>
                        </div>
                      )}

                      {photobook.link && (
                        <div className="flex items-center gap-1 text-xs">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(photobook.link, '_blank')
                            }}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Official Link
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}