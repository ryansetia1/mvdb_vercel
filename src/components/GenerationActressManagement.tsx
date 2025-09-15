import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Checkbox } from './ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { SearchableComboBox, useComboBoxOptions } from './ui/searchable-combobox'
import { Plus, Trash2, Edit, User, Users } from 'lucide-react'
import { MasterDataItem, masterDataApi } from '../utils/masterDataApi'
import { ImageWithFallback } from './figma/ImageWithFallback'

interface GenerationActressManagementProps {
  generationId: string
  generationName: string
  groupId: string
  accessToken: string
}

interface ActressAssignmentFormData {
  actressId: string
  actressName: string
  alias: string
  profilePicture: string
  photos: string[]
}

export function GenerationActressManagement({ 
  generationId, 
  generationName, 
  groupId,
  accessToken 
}: GenerationActressManagementProps) {
  const [actresses, setActresses] = useState<MasterDataItem[]>([])
  const [generationActresses, setGenerationActresses] = useState<MasterDataItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<{
    actress: MasterDataItem
    generationData: any
  } | null>(null)
  const [formData, setFormData] = useState<ActressAssignmentFormData>({
    actressId: '',
    actressName: '',
    alias: '',
    profilePicture: '',
    photos: []
  })
  const [useCustomAlias, setUseCustomAlias] = useState(false)

  useEffect(() => {
    loadData()
  }, [generationId, groupId, accessToken])

  const loadData = async () => {
    if (!generationId || !groupId || !accessToken) {
      console.log('GenerationActressManagement: Missing generationId, groupId, or accessToken')
      return
    }

    try {
      setIsLoading(true)
      console.log('GenerationActressManagement: Loading data for generation:', generationId, 'in group:', groupId)
      
      const allActresses = await masterDataApi.getByType('actress', accessToken)
      console.log('GenerationActressManagement: Loaded all actresses:', allActresses.length)
      
      // Get group name from groupId (we need to find the group name to match with selectedGroups)
      const groups = await masterDataApi.getByType('group', accessToken)
      const currentGroup = groups.find(g => g.id === groupId)
      const groupName = currentGroup?.name
      
      console.log('GenerationActressManagement: Current group info:', {
        groupId,
        groupName,
        currentGroup
      })

      // Filter actresses that are assigned to this group
      const actressesInGroup = allActresses.filter(actress => {
        console.log(`GenerationActressManagement: Checking actress ${actress.name}:`, {
          actressId: actress.id,
          actressGroupId: actress.groupId,
          actressSelectedGroups: actress.selectedGroups,
          actressGroupData: actress.groupData,
          targetGroupId: groupId,
          targetGroupName: groupName
        })
        
        const isInGroup = actress.groupId === groupId || 
                        (actress.selectedGroups && groupName && actress.selectedGroups.includes(groupName)) ||
                        (actress.groupData && actress.groupData[groupId])
        console.log(`GenerationActressManagement: Actress ${actress.name} is in group ${groupId} (${groupName}):`, isInGroup)
        return isInGroup
      })
      
      console.log('GenerationActressManagement: Actresses in group:', actressesInGroup.length)
      
      // Filter actresses that have this generation in their generationData
      const actressesInGeneration = actressesInGroup.filter(actress => {
        const hasGeneration = actress.generationData && actress.generationData[generationId]
        console.log(`GenerationActressManagement: Actress ${actress.name} has generation ${generationId}:`, hasGeneration)
        return hasGeneration
      })
      
      console.log('GenerationActressManagement: Actresses in generation:', actressesInGeneration.length)
      
      setActresses(actressesInGroup) // Only actresses in the group
      setGenerationActresses(actressesInGeneration)
    } catch (err) {
      console.error('GenerationActressManagement: Error loading data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddActress = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    resetForm()
    setShowDialog(true)
  }

  const handleAddAllActresses = async (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    
    if (availableActresses.length === 0) {
      setError('No available actresses to add')
      return
    }

    const confirmed = confirm(
      `Add all ${availableActresses.length} available actresses to ${generationName} generation?\n\nThis will assign each actress with their English name as the default alias.`
    )
    
    if (!confirmed) return

    try {
      setError(null)
      setSuccess(null)
      setIsLoading(true)

      console.log('Adding all actresses to generation:', {
        generationId,
        actressCount: availableActresses.length
      })

      // Add all actresses one by one
      for (const actress of availableActresses) {
        await masterDataApi.assignActressToGeneration(
          actress.id,
          generationId,
          accessToken,
          actress.name || undefined, // Use English name as alias
          undefined, // No custom profile picture
          undefined  // No custom photos
        )
      }

      setSuccess(`Successfully added all ${availableActresses.length} actresses to ${generationName} generation`)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add all actresses')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditAssignment = (actress: MasterDataItem, e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    const generationData = actress.generationData?.[generationId]
    const currentAlias = generationData?.alias || ''
    const englishName = actress.name || ''
    
    setEditingAssignment({ actress, generationData })
    setFormData({
      actressId: actress.id,
      actressName: englishName,
      alias: currentAlias || englishName, // Use English name as default if no alias
      profilePicture: generationData?.profilePicture || '',
      photos: generationData?.photos || []
    })
    // Check if alias is different from English name (custom alias)
    setUseCustomAlias(currentAlias !== '' && currentAlias !== englishName)
    setShowDialog(true)
  }

  const resetForm = () => {
    setFormData({
      actressId: '',
      actressName: '',
      alias: '',
      profilePicture: '',
      photos: []
    })
    setUseCustomAlias(false)
    setEditingAssignment(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError(null)
      setSuccess(null)

      if (!generationId) {
        setError('Generation ID is required')
        return
      }

      if (!formData.actressId) {
        setError('Please select an actress')
        return
      }

      if (!accessToken) {
        setError('Access token is required')
        return
      }

      console.log('GenerationActressManagement: Submitting assignment:', {
        actressId: formData.actressId,
        generationId,
        alias: formData.alias,
        profilePicture: formData.profilePicture,
        photos: formData.photos
      })

      await masterDataApi.assignActressToGeneration(
        formData.actressId,
        generationId,
        accessToken,
        formData.alias || undefined,
        formData.profilePicture || undefined,
        formData.photos.length > 0 ? formData.photos : undefined
      )

      setSuccess('Actress assigned to generation successfully')
      await loadData()
      resetForm()
      setShowDialog(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign actress')
      // Don't close dialog on error so user can see the error message
    }
  }

  const handleRemoveActress = async (actress: MasterDataItem, e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (!confirm(`Remove "${actress.name}" from this generation?`)) {
      return
    }

    try {
      setError(null)
      await masterDataApi.removeActressFromGeneration(actress.id, generationId, accessToken)
      setSuccess('Actress removed from generation successfully')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove actress')
    }
  }

  const handleInputChange = (field: keyof ActressAssignmentFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // If user manually changes alias, enable custom alias mode
    if (field === 'alias' && typeof value === 'string') {
      const englishName = formData.actressName || ''
      if (value !== englishName) {
        setUseCustomAlias(true)
      }
    }
  }

  const handleActressSelect = (actressId: string) => {
    const selectedActress = actresses.find(a => a.id === actressId)
    if (selectedActress) {
      setFormData(prev => ({
        ...prev,
        actressId: actressId,
        actressName: selectedActress.name || '',
        alias: useCustomAlias ? prev.alias : (selectedActress.name || '')
      }))
    }
  }

  const handleCustomAliasChange = (checked: boolean) => {
    setUseCustomAlias(checked)
    if (!checked && formData.actressName) {
      // Reset to English name when unchecking custom alias
      setFormData(prev => ({
        ...prev,
        alias: prev.actressName
      }))
    }
  }

  // Actress options for combobox (exclude already assigned actresses)
  const availableActresses = (actresses || []).filter(actress => 
    !(generationActresses || []).some(ga => ga.id === actress.id)
  )

  const actressComboBoxOptions = useComboBoxOptions(
    availableActresses,
    (actress) => actress.id,
    (actress) => actress.name || 'Unnamed Actress'
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h4 className="font-medium">Actresses in {generationName}</h4>
          <Badge variant="outline">{generationActresses.length} actresses</Badge>
        </div>
        
        <div className="flex gap-2">
          {availableActresses.length > 0 && (
            <Button 
              onClick={handleAddAllActresses} 
              disabled={isLoading} 
              size="sm"
              variant="outline"
            >
              <Users className="h-4 w-4 mr-1" />
              Add All ({availableActresses.length})
            </Button>
          )}
          <Button onClick={(e) => handleAddActress(e)} disabled={isLoading} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Actress
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-md text-sm">
          {success}
        </div>
      )}

      {/* Actresses List */}
      {isLoading && generationActresses.length === 0 ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading actresses...</p>
        </div>
      ) : generationActresses.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <h5 className="font-medium text-gray-900 mb-1">No actresses assigned</h5>
          <p className="text-sm text-gray-500 mb-3">Add actresses to this generation</p>
          <Button onClick={(e) => handleAddActress(e)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add First Actress
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {generationActresses.map((actress) => {
            const generationData = actress.generationData?.[generationId]
            return (
              <ActressAssignmentItem
                key={actress.id}
                actress={actress}
                generationData={generationData}
                generationId={generationId}
                accessToken={accessToken}
                onEdit={(e) => handleEditAssignment(actress, e)}
                onRemove={(e) => handleRemoveActress(actress, e)}
                isLoading={isLoading}
              />
            )
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingAssignment ? 'Edit Actress Assignment' : 'Add Actress to Generation'}
            </DialogTitle>
            <DialogDescription>
              {editingAssignment 
                ? 'Update actress information for this generation' 
                : 'Assign an actress to this generation with custom alias and profile picture'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingAssignment && (
              <div className="space-y-2">
                <Label htmlFor="actress">Actress *</Label>
                <SearchableComboBox
                  options={actressComboBoxOptions}
                  value={formData.actressId}
                  onValueChange={handleActressSelect}
                  placeholder="Select an actress..."
                  searchPlaceholder="Search actresses..."
                  emptyMessage="No actress found."
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="alias">Generation Alias</Label>
              <Input
                id="alias"
                value={formData.alias}
                onChange={(e) => handleInputChange('alias', e.target.value)}
                placeholder="Custom name for this generation"
                disabled={!useCustomAlias}
                className={!useCustomAlias ? "bg-gray-50" : ""}
              />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useCustomAlias"
                  checked={useCustomAlias}
                  onCheckedChange={handleCustomAliasChange}
                />
                <Label htmlFor="useCustomAlias" className="text-sm font-normal">
                  Use custom alias (default: English actress name)
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profilePicture">Generation Profile Picture URL</Label>
              <Input
                id="profilePicture"
                value={formData.profilePicture}
                onChange={(e) => handleInputChange('profilePicture', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={isLoading}>
                {editingAssignment ? 'Update Assignment' : 'Add Actress'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface ActressAssignmentItemProps {
  actress: MasterDataItem
  generationData: any
  generationId: string
  accessToken: string
  onEdit: (e?: React.MouseEvent) => void
  onRemove: (e?: React.MouseEvent) => void
  isLoading: boolean
}

function ActressAssignmentItem({ 
  actress, 
  generationData, 
  generationId,
  accessToken,
  onEdit, 
  onRemove, 
  isLoading 
}: ActressAssignmentItemProps) {
  const [profilePicUrl, setProfilePicUrl] = useState(generationData?.profilePicture || '')
  const [isEditingPic, setIsEditingPic] = useState(false)
  const [isSavingPic, setIsSavingPic] = useState(false)
  
  const displayName = generationData?.alias || actress.name
  const displayPicture = profilePicUrl || actress.profilePicture

  const handleProfilePicChange = async (newUrl: string) => {
    if (newUrl === (generationData?.profilePicture || '')) {
      setIsEditingPic(false)
      return
    }

    setIsSavingPic(true)
    try {
      // Call API to update profile picture
      await masterDataApi.assignActressToGeneration(
        actress.id,
        generationId,
        accessToken,
        generationData?.alias || undefined,
        newUrl || undefined,
        generationData?.photos || undefined
      )
      
      setProfilePicUrl(newUrl)
      setIsEditingPic(false)
    } catch (err) {
      console.error('Failed to update profile picture:', err)
      // Reset to original value on error
      setProfilePicUrl(generationData?.profilePicture || '')
    } finally {
      setIsSavingPic(false)
    }
  }

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 hover:bg-gray-100 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {displayPicture ? (
            <ImageWithFallback
              src={displayPicture}
              alt={displayName || 'Actress'}
              className="w-8 h-8 rounded-full object-cover"
              fallback={<User className="w-8 h-8 text-gray-400" />}
            />
          ) : (
            <User className="w-8 h-8 text-gray-400" />
          )}
          <div>
            <h5 className="font-medium text-gray-900 text-sm">{displayName}</h5>
            {generationData?.alias && generationData.alias !== actress.name && (
              <p className="text-xs text-gray-500">Original: {actress.name}</p>
            )}
          </div>
        </div>
        
        {/* Profile Picture Input Field */}
        <div className="flex-1 mx-4">
          <Input
            value={profilePicUrl}
            onChange={(e) => setProfilePicUrl(e.target.value)}
            onBlur={() => handleProfilePicChange(profilePicUrl)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleProfilePicChange(profilePicUrl)
              }
            }}
            placeholder="Profile picture URL..."
            className="h-7 text-xs"
            disabled={isSavingPic}
          />
        </div>
        
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => onEdit(e)}
            disabled={isLoading}
            className="h-7 w-7 p-0"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => onRemove(e)}
            disabled={isLoading}
            className="h-7 w-7 p-0"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}
