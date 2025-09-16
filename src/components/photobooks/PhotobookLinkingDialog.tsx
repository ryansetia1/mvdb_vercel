import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Search, Link, Check, Loader2, Camera, Users, Calendar, Users2, User } from 'lucide-react'
import { Photobook, photobookApi } from '../../utils/photobookApi'
import { MasterDataItem } from '../../utils/masterDataApi'
import { toast } from 'sonner'

interface PhotobookLinkingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetType?: 'group' | 'generation' | 'lineup' | 'member'
  targetId?: string
  targetName?: string
  onLink: (photobookId: string, selectedTargetType: string, selectedTargetId: string) => void
  accessToken: string
  // New props for hierarchy data
  generations?: MasterDataItem[]
  lineups?: MasterDataItem[]
  members?: MasterDataItem[]
}

export function PhotobookLinkingDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetName,
  onLink,
  accessToken,
  generations = [],
  lineups = [],
  members = []
}: PhotobookLinkingDialogProps) {
  const [availablePhotobooks, setAvailablePhotobooks] = useState<Photobook[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPhotobooks, setSelectedPhotobooks] = useState<string[]>([])
  const [linkingInProgress, setLinkingInProgress] = useState(false)
  
  // New state for selected target
  const [selectedTargetType, setSelectedTargetType] = useState<string>('')
  const [selectedTargetId, setSelectedTargetId] = useState<string>('')

  // Load available photobooks when dialog opens
  useEffect(() => {
    if (open && accessToken) {
      loadAvailablePhotobooks()
    }
  }, [open, accessToken])

  // Initialize selected target when dialog opens
  useEffect(() => {
    if (open && targetType) {
      setSelectedTargetType(targetType)
      // For group, use the provided targetId
      // For generation/lineup/member, we'll let user select from dropdown
      if (targetType === 'group' && targetId) {
        setSelectedTargetId(targetId)
      } else {
        setSelectedTargetId('') // Reset for user selection
      }
    }
  }, [open, targetType, targetId])

  const loadAvailablePhotobooks = async () => {
    setIsLoading(true)
    try {
      const photobooks = await photobookApi.getAvailablePhotobooksForLinking(accessToken)
      setAvailablePhotobooks(photobooks)
    } catch (error) {
      console.error('Error loading available photobooks:', error)
      toast.error('Failed to load available photobooks')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPhotobooks = availablePhotobooks.filter(photobook =>
    photobook.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    photobook.titleJp?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleLinkSelected = async () => {
    if (selectedPhotobooks.length === 0) return
    if (!selectedTargetType || !selectedTargetId) {
      toast.error(`Please select a ${selectedTargetType} to link to`)
      return
    }

    console.log('Linking photobooks:', {
      selectedPhotobooks,
      selectedTargetType,
      selectedTargetId,
      generations: generations.length,
      lineups: lineups.length,
      members: members.length
    })

    setLinkingInProgress(true)
    try {
      for (const photobookId of selectedPhotobooks) {
        console.log(`Linking photobook ${photobookId} to ${selectedTargetType}:${selectedTargetId}`)
        await onLink(photobookId, selectedTargetType, selectedTargetId)
      }
      setSelectedPhotobooks([])
      onOpenChange(false)
      toast.success(`Successfully linked ${selectedPhotobooks.length} photobook${selectedPhotobooks.length !== 1 ? 's' : ''}`)
    } catch (error) {
      console.error('Error linking photobooks:', error)
      toast.error('Failed to link photobooks')
    } finally {
      setLinkingInProgress(false)
    }
  }

  const togglePhotobookSelection = (photobookId: string) => {
    setSelectedPhotobooks(prev =>
      prev.includes(photobookId)
        ? prev.filter(id => id !== photobookId)
        : [...prev, photobookId]
    )
  }

  // Helper functions for getting target data
  const getTargetIcon = (type: string) => {
    switch (type) {
      case 'group': return <Users className="h-4 w-4" />
      case 'generation': return <Calendar className="h-4 w-4" />
      case 'lineup': return <Users2 className="h-4 w-4" />
      case 'member': return <User className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getTargetOptions = () => {
    switch (selectedTargetType) {
      case 'generation':
        return generations.map(gen => ({ id: gen.id, name: gen.name }))
      case 'lineup':
        return lineups.map(lineup => ({ id: lineup.id, name: lineup.name }))
      case 'member':
        return members.map(member => ({ id: member.id, name: member.name }))
      default:
        return []
    }
  }

  const getTargetName = () => {
    if (selectedTargetType === 'group') return targetName || 'Group'
    
    if (!selectedTargetId) {
      return `Select a ${selectedTargetType}`
    }
    
    const options = getTargetOptions()
    const selected = options.find(opt => opt.id === selectedTargetId)
    return selected?.name || `Select a ${selectedTargetType}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Link Photobooks to {getTargetName()}
          </DialogTitle>
          <DialogDescription>
            {selectedTargetType === 'group' 
              ? `Select photobooks to link to this ${selectedTargetType}`
              : `Select a ${selectedTargetType} and photobooks to link`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Target Selection */}
          {selectedTargetType !== 'group' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Select {selectedTargetType} to link to:
              </label>
              <Select value={selectedTargetId} onValueChange={setSelectedTargetId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={`Select a ${selectedTargetType}`} />
                </SelectTrigger>
                <SelectContent>
                  {getTargetOptions().map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      <div className="flex items-center gap-2">
                        {getTargetIcon(selectedTargetType)}
                        {option.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search photobooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Photobook Selection */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading photobooks...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredPhotobooks.map((photobook) => (
                  <div
                    key={photobook.id}
                    className={`relative cursor-pointer rounded-lg border-2 transition-colors ${
                      selectedPhotobooks.includes(photobook.id || '')
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => togglePhotobookSelection(photobook.id || '')}
                  >
                    {/* Cover */}
                    <div className="aspect-[3/4] overflow-hidden rounded-t-lg">
                      {photobook.cover ? (
                        <img
                          src={photobook.cover}
                          alt={photobook.titleEn}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <Camera className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Title */}
                    <div className="p-3">
                      <h3 className="font-medium text-sm line-clamp-2">
                        {photobook.titleEn}
                      </h3>
                      {photobook.titleJp && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {photobook.titleJp}
                        </p>
                      )}
                    </div>

                    {/* Selection Indicator */}
                    {selectedPhotobooks.includes(photobook.id || '') && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-500">
              {selectedPhotobooks.length} photobook{selectedPhotobooks.length !== 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleLinkSelected}
                disabled={selectedPhotobooks.length === 0 || linkingInProgress}
              >
                {linkingInProgress ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Linking...
                  </>
                ) : (
                  <>
                    <Link className="h-4 w-4 mr-2" />
                    Link Selected
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
