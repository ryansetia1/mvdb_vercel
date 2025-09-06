import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './ui/pagination'
import { Plus, Search, Edit, Trash2, User, Calendar, ImageOff } from 'lucide-react'
import { MasterDataItem, masterDataApi, calculateAge } from '../utils/masterDataApi'
import { ActorForm } from './ActorForm'
import { toast } from 'sonner@2.0.3'

interface ActorManagerProps {
  type: 'actor' | 'actress'
  accessToken: string
  onDataChanged?: () => void
  editingProfile?: { type: 'actor' | 'actress', name: string } | null
  onClearEditingProfile?: () => void
}

export function ActorManager({ type, accessToken, onDataChanged, editingProfile, onClearEditingProfile }: ActorManagerProps) {
  const [actors, setActors] = useState<MasterDataItem[]>([])
  const [filteredActors, setFilteredActors] = useState<MasterDataItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingActor, setEditingActor] = useState<MasterDataItem | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  const typeLabel = type === 'actress' ? 'Aktris' : 'Aktor'

  useEffect(() => {
    loadActors()
  }, [type])

  // Handle editing profile from external source (like profile page edit button)
  useEffect(() => {
    if (editingProfile && editingProfile.type === type && actors.length > 0) {
      const foundActor = actors.find(actor => actor.name === editingProfile.name)
      if (foundActor) {
        setEditingActor(foundActor)
        setShowForm(true)
      }
    }
  }, [editingProfile, type, actors])

  useEffect(() => {
    // Filter actors based on search query
    if (!searchQuery.trim()) {
      setFilteredActors(actors)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = actors.filter(actor => 
        actor.name?.toLowerCase().includes(query) ||
        actor.jpname?.toLowerCase().includes(query) ||
        actor.alias?.toLowerCase().includes(query) ||
        actor.tags?.toLowerCase().includes(query)
      )
      setFilteredActors(filtered)
    }
    // Reset to first page when filtering
    setCurrentPage(1)
  }, [searchQuery, actors])

  // Keyboard navigation for pagination
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle keyboard navigation if not in a form field or dialog
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || showForm) {
        return
      }

      const totalPages = Math.ceil(filteredActors.length / itemsPerPage)
      
      if (e.key === 'ArrowLeft' && currentPage > 1) {
        e.preventDefault()
        setCurrentPage(prev => prev - 1)
      } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
        e.preventDefault()
        setCurrentPage(prev => prev + 1)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentPage, filteredActors.length, itemsPerPage, showForm])

  const loadActors = async () => {
    try {
      setIsLoading(true)
      const data = await masterDataApi.getByType(type, accessToken)
      setActors(data.sort((a, b) => (a.name || '').localeCompare(b.name || '')))
    } catch (error: any) {
      console.error('Error loading actors:', error)
      toast.error(`Gagal memuat data ${typeLabel.toLowerCase()}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingActor(undefined)
    setShowForm(true)
  }

  const handleEdit = (actor: MasterDataItem) => {
    setEditingActor(actor)
    setShowForm(true)
  }

  const handleDelete = async (actor: MasterDataItem) => {
    if (!actor.id || !actor.name) return
    
    if (!confirm(`Yakin ingin menghapus ${typeLabel.toLowerCase()} "${actor.name}"?`)) return

    try {
      await masterDataApi.delete(type, actor.id, accessToken)
      setActors(prev => prev.filter(a => a.id !== actor.id))
      toast.success(`${typeLabel} "${actor.name}" berhasil dihapus`)
      
      // Trigger external data refresh
      if (onDataChanged) {
        onDataChanged()
      }
    } catch (error: any) {
      console.error('Error deleting actor:', error)
      toast.error(`Gagal menghapus ${typeLabel.toLowerCase()}: ${error.message}`)
    }
  }

  const handleFormSaved = (savedActor: MasterDataItem) => {
    if (editingActor) {
      // Update existing
      setActors(prev => prev.map(a => a.id === savedActor.id ? savedActor : a))
    } else {
      // Add new
      setActors(prev => [...prev, savedActor].sort((a, b) => (a.name || '').localeCompare(b.name || '')))
    }
    setShowForm(false)
    setEditingActor(undefined)
    
    // Trigger external data refresh
    if (onDataChanged) {
      console.log('ActorManager: Triggering external data refresh after save')
      setTimeout(() => {
        onDataChanged()
      }, 100) // Small delay to ensure database is updated
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingActor(undefined)
    
    // Clear external editing profile if provided
    if (onClearEditingProfile) {
      onClearEditingProfile()
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Memuat data {typeLabel.toLowerCase()}...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Kelola {typeLabel} ({actors.length})
            </CardTitle>
            <Button onClick={handleAdd} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah {typeLabel}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari ${typeLabel.toLowerCase()} berdasarkan nama, nama Jepang, alias, atau tags...`}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actor Grid */}
      {filteredActors.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery ? 'Tidak ada hasil pencarian' : `Belum ada ${typeLabel.toLowerCase()}`}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 
                `Tidak ada ${typeLabel.toLowerCase()} yang cocok dengan pencarian "${searchQuery}"` : 
                `Mulai dengan menambah ${typeLabel.toLowerCase()} baru`
              }
            </p>
            {!searchQuery && (
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah {typeLabel} Pertama
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        (() => {
          // Calculate pagination
          const totalPages = Math.ceil(filteredActors.length / itemsPerPage)
          const startIndex = (currentPage - 1) * itemsPerPage
          const endIndex = startIndex + itemsPerPage
          const paginatedActors = filteredActors.slice(startIndex, endIndex)
          
          return (
            <div className="space-y-6">
              {/* Thumbnail Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {paginatedActors.map((actor) => {
                  // Get profile picture URL
                  let imageUrl = null
                  
                  // Priority 1: profilePicture (main image)
                  if (actor.profilePicture?.trim()) {
                    imageUrl = actor.profilePicture.trim()
                  }
                  // Priority 2: First photo from photo array if no profilePicture
                  else if (actor.photo && Array.isArray(actor.photo) && actor.photo.length > 0) {
                    const firstValidPhoto = actor.photo.find(photo => 
                      typeof photo === 'string' && photo.trim()
                    )
                    if (firstValidPhoto) {
                      imageUrl = firstValidPhoto.trim()
                    }
                  }
                  
                  return (
                    <Card key={actor.id} className="group hover:shadow-lg transition-all duration-200">
                      <CardContent className="p-0">
                        {/* Profile Picture */}
                        <div className="aspect-[3/4] overflow-hidden rounded-t-lg bg-muted relative">
                          {imageUrl ? (
                            <>
                              <img
                                src={imageUrl}
                                alt={actor.name || 'Actor'}
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
                          
                          {/* Action buttons overlay */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                                onClick={() => handleEdit(actor)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-destructive hover:text-destructive"
                                onClick={() => handleDelete(actor)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Info */}
                        <div className="p-3 space-y-1">
                          <h3 className="font-medium text-sm truncate" title={actor.name}>
                            {actor.name || 'Unnamed'}
                          </h3>
                          
                          {actor.jpname && (
                            <p className="text-xs text-muted-foreground truncate" title={actor.jpname}>
                              {actor.jpname}
                            </p>
                          )}
                          
                          {actor.birthdate && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{calculateAge(actor.birthdate)} tahun</span>
                            </div>
                          )}
                          
                          {/* Photo count */}
                          {(() => {
                            // Calculate total unique photos
                            const allPhotos = []
                            
                            // Add profilePicture if it exists
                            if (actor.profilePicture?.trim()) {
                              allPhotos.push(actor.profilePicture.trim())
                            }
                            
                            // Add photos from photo array if they exist
                            if (actor.photo && Array.isArray(actor.photo)) {
                              const validPhotos = actor.photo
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
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col items-center gap-2">
                  <div className="text-sm text-muted-foreground">
                    Showing {Math.min(startIndex + 1, filteredActors.length)} to {Math.min(endIndex, filteredActors.length)} of {filteredActors.length} {typeLabel.toLowerCase()}
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            if (currentPage > 1) setCurrentPage(prev => prev - 1)
                          }}
                          className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      
                      {(() => {
                        const pages = []
                        const showEllipsis = totalPages > 7
                        
                        if (!showEllipsis) {
                          // Show all pages if <= 7 pages
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(
                              <PaginationItem key={i}>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    setCurrentPage(i)
                                  }}
                                  isActive={currentPage === i}
                                >
                                  {i}
                                </PaginationLink>
                              </PaginationItem>
                            )
                          }
                        } else {
                          // Show with ellipsis for > 7 pages
                          // Always show first page
                          pages.push(
                            <PaginationItem key={1}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault()
                                  setCurrentPage(1)
                                }}
                                isActive={currentPage === 1}
                              >
                                1
                              </PaginationLink>
                            </PaginationItem>
                          )
                          
                          // Show ellipsis if current page is > 3
                          if (currentPage > 3) {
                            pages.push(
                              <PaginationItem key="ellipsis1">
                                <PaginationEllipsis />
                              </PaginationItem>
                            )
                          }
                          
                          // Show pages around current page
                          const start = Math.max(2, currentPage - 1)
                          const end = Math.min(totalPages - 1, currentPage + 1)
                          
                          for (let i = start; i <= end; i++) {
                            pages.push(
                              <PaginationItem key={i}>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    setCurrentPage(i)
                                  }}
                                  isActive={currentPage === i}
                                >
                                  {i}
                                </PaginationLink>
                              </PaginationItem>
                            )
                          }
                          
                          // Show ellipsis if current page is < totalPages - 2
                          if (currentPage < totalPages - 2) {
                            pages.push(
                              <PaginationItem key="ellipsis2">
                                <PaginationEllipsis />
                              </PaginationItem>
                            )
                          }
                          
                          // Always show last page
                          if (totalPages > 1) {
                            pages.push(
                              <PaginationItem key={totalPages}>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    setCurrentPage(totalPages)
                                  }}
                                  isActive={currentPage === totalPages}
                                >
                                  {totalPages}
                                </PaginationLink>
                              </PaginationItem>
                            )
                          }
                        }
                        
                        return pages
                      })()}
                      
                      <PaginationItem>
                        <PaginationNext 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            if (currentPage < totalPages) setCurrentPage(prev => prev + 1)
                          }}
                          className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  <div className="text-xs text-muted-foreground">
                    Use ← → arrow keys to navigate pages
                  </div>
                </div>
              )}
            </div>
          )
        })()
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={handleFormClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingActor ? `Edit ${typeLabel}` : `Tambah ${typeLabel} Baru`}
            </DialogTitle>
            <DialogDescription>
              {editingActor 
                ? `Ubah informasi ${typeLabel.toLowerCase()} ${editingActor.name || 'ini'}.`
                : `Tambahkan ${typeLabel.toLowerCase()} baru ke dalam database.`
              }
            </DialogDescription>
          </DialogHeader>
          <ActorForm
            type={type}
            accessToken={accessToken}
            initialData={editingActor}
            onSaved={handleFormSaved}
            onClose={handleFormClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}