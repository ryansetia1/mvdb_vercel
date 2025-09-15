import { useState, useEffect } from 'react'
import { MasterDataItem, masterDataApi } from '../../utils/masterDataApi'
import { GROUP_FORM_CONSTANTS, EMPTY_FORM_DATA } from './constants'
import { toast } from 'sonner@2.0.3'

interface UseGroupFormProps {
  accessToken: string
}

export function useGroupForm({ accessToken }: UseGroupFormProps) {
  const [groups, setGroups] = useState<MasterDataItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editingGroup, setEditingGroup] = useState<MasterDataItem | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM_DATA)
  // New states for actress management
  const [availableActresses, setAvailableActresses] = useState<MasterDataItem[]>([])
  const [groupActresses, setGroupActresses] = useState<MasterDataItem[]>([])
  const [actressOperationLoading, setActressOperationLoading] = useState(false)

  // Load groups and actresses on mount
  useEffect(() => {
    loadGroups()
    loadActresses()
  }, [])

  const loadGroups = async () => {
    try {
      setIsLoading(true)
      const data = await masterDataApi.getByType('group', accessToken)
      setGroups(data || [])
    } catch (err) {
      console.error('Error loading groups:', err)
      setError(GROUP_FORM_CONSTANTS.MESSAGES.LOAD_ERROR)
    } finally {
      setIsLoading(false)
    }
  }

  const loadActresses = async () => {
    try {
      const data = await masterDataApi.getByType('actress', accessToken)
      setAvailableActresses(data || [])
    } catch (err) {
      console.error('Error loading actresses:', err)
    }
  }

  const loadGroupActresses = async (groupName: string) => {
    try {
      console.log('=== LOADING GROUP ACTRESSES ===')
      console.log('Group name:', groupName)
      
      // Reload actresses first to get the latest data
      await loadActresses()
      
      // Then filter for the specific group using the updated data
      // We need to get the latest availableActresses state
      const latestActressesData = await masterDataApi.getByType('actress', accessToken)
      console.log('Latest actresses data count:', latestActressesData?.length || 0)
      
      // Filter actresses that have this group in their selectedGroups
      const actresses = (latestActressesData || []).filter(actress => {
        const hasGroup = actress.selectedGroups && actress.selectedGroups.includes(groupName)
        if (hasGroup) {
          console.log(`✓ ${actress.name} is in group ${groupName}:`, actress.selectedGroups)
        }
        return hasGroup
      })
      
      console.log('Filtered group actresses:', actresses.map(a => ({ name: a.name, groups: a.selectedGroups })))
      setGroupActresses(actresses)
    } catch (err) {
      console.error('Error loading group actresses:', err)
    }
  }

  const resetForm = () => {
    setFormData(EMPTY_FORM_DATA)
    setEditingGroup(null)
    setError(null)
    setSuccess(null)
  }

  const handleCreate = () => {
    resetForm()
    setShowDialog(true)
  }

  const handleEdit = async (group: MasterDataItem) => {
    console.log('=== EDITING GROUP ===')
    console.log('Group:', group)
    
    const formDataToSet = {
      name: group.name || '',
      jpname: group.jpname || '',
      profilePicture: group.profilePicture || '',
      website: group.website || '',
      description: group.description || '',
      gallery: Array.isArray(group.gallery) ? group.gallery : []
    }
    
    console.log('Form data being set:', formDataToSet)
    setFormData(formDataToSet)
    setEditingGroup(group)
    
    // Make sure we have the latest actress data before loading group actresses
    if (group.name) {
      console.log('Loading actresses first, then group actresses...')
      await loadActresses()
      // Small delay to ensure state is updated
      setTimeout(() => {
        loadGroupActresses(group.name)
      }, 100)
    }
    setShowDialog(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('=== FORM SUBMIT START ===')
    console.log('Form data at submit:', formData)
    console.log('Gallery data specifically:', formData.gallery)
    console.log('Gallery data type:', typeof formData.gallery)
    console.log('Gallery data is array:', Array.isArray(formData.gallery))
    console.log('Gallery data length:', formData.gallery?.length)
    
    if (!formData.name.trim()) {
      setError(GROUP_FORM_CONSTANTS.VALIDATION.NAME_REQUIRED)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      if (editingGroup) {
        console.log('=== UPDATING EXISTING GROUP ===')
        console.log('Group ID:', editingGroup.id)
        console.log('Calling updateGroup with gallery:', formData.gallery)
        
        // Update existing group
        await masterDataApi.updateGroup(
          editingGroup.id,
          formData.name,
          formData.jpname,
          formData.profilePicture,
          formData.website,
          formData.description,
          accessToken,
          formData.gallery
        )
        setSuccess(GROUP_FORM_CONSTANTS.MESSAGES.UPDATE_SUCCESS)
      } else {
        console.log('=== CREATING NEW GROUP ===')
        console.log('Calling createGroup with gallery:', formData.gallery)
        
        // Create new group
        await masterDataApi.createGroup(
          formData.name,
          formData.jpname,
          formData.profilePicture,
          formData.website,
          formData.description,
          accessToken,
          formData.gallery
        )
        setSuccess(GROUP_FORM_CONSTANTS.MESSAGES.CREATE_SUCCESS)
      }

      console.log('=== GROUP SAVE SUCCESS ===')
      
      // Reload groups and close dialog
      await loadGroups()
      setShowDialog(false)
      resetForm()
    } catch (err) {
      console.error('Error saving group:', err)
      setError(err instanceof Error ? err.message : 
        editingGroup ? GROUP_FORM_CONSTANTS.MESSAGES.UPDATE_ERROR : GROUP_FORM_CONSTANTS.MESSAGES.CREATE_ERROR)
    } finally {
      setIsLoading(false)
    }
    
    console.log('=== FORM SUBMIT END ===')
  }

  const handleDelete = async (group: MasterDataItem) => {
    if (!confirm(`Are you sure you want to delete the group "${group.name}"?`)) {
      return
    }

    try {
      setIsLoading(true)
      await masterDataApi.delete('group', group.id, accessToken)
      setSuccess(GROUP_FORM_CONSTANTS.MESSAGES.DELETE_SUCCESS)
      await loadGroups()
    } catch (err) {
      console.error('Error deleting group:', err)
      setError(err instanceof Error ? err.message : GROUP_FORM_CONSTANTS.MESSAGES.DELETE_ERROR)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | string[]) => {
    console.log('=== HANDLE INPUT CHANGE ===')
    console.log('Field:', field)
    console.log('Value:', value)
    console.log('Current formData before update:', formData)
    
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [field]: value
      }
      console.log('New formData after update:', newFormData)
      return newFormData
    })
    
    console.log('=== END HANDLE INPUT CHANGE ===')
  }

  const handleAddActressToGroup = async (actressId: string) => {
    if (!editingGroup?.name) return
    
    try {
      setActressOperationLoading(true)
      const actress = availableActresses.find(a => a.id === actressId)
      if (!actress) return

      // Check if actress is already in this group
      if (actress.selectedGroups && actress.selectedGroups.includes(editingGroup.name)) {
        setError('Actress is already in this group')
        return
      }

      const updatedGroups = [...(actress.selectedGroups || []), editingGroup.name]
      
      // Preserve ALL existing data when updating
      const updateData = {
        name: actress.name, // Required field
        jpname: actress.jpname,
        birthdate: actress.birthdate,
        alias: actress.alias,
        links: actress.links,
        takulinks: actress.takulinks,
        tags: actress.tags,
        photo: actress.photo,
        profilePicture: actress.profilePicture,
        groupId: actress.groupId,
        groupData: actress.groupData,
        selectedGroups: updatedGroups
      }

      console.log('Frontend: Adding actress to group with preserved data:', updateData)

      await masterDataApi.updateExtended('actress', actressId, updateData, accessToken)

      toast.success('Actress added to group successfully!')
      setSuccess('Actress added to group successfully!')
      setError(null)
      // Immediately reload data and update UI
      await Promise.all([
        loadActresses(),
        loadGroupActresses(editingGroup.name)
      ])
    } catch (err) {
      console.error('Error adding actress to group:', err)
      const errorMessage = 'Failed to add actress to group'
      toast.error(errorMessage)
      setError(errorMessage)
      setSuccess(null)
    } finally {
      setActressOperationLoading(false)
    }
  }

  const handleRemoveActressFromGroup = async (actressId: string) => {
    if (!editingGroup?.name) {
      console.error('No editing group or group name found')
      toast.error('No group selected')
      return
    }

    // Find the actress to show confirmation with her name
    const actress = groupActresses.find(a => a.id === actressId) || availableActresses.find(a => a.id === actressId)
    if (!actress) {
      toast.error('Actress not found')
      return
    }

    // Confirm removal
    if (!confirm(`Are you sure you want to remove "${actress.name}" from the group "${editingGroup.name}"?`)) {
      return
    }

    console.log('=== REMOVE ACTRESS FROM GROUP ===')
    console.log('Actress ID:', actressId)
    console.log('Actress name:', actress.name)
    console.log('Group name:', editingGroup.name)
    console.log('Current groupActresses:', groupActresses)

    try {
      setActressOperationLoading(true)

      console.log('Found actress:', {
        id: actress.id,
        name: actress.name,
        selectedGroups: actress.selectedGroups
      })

      // Check if the actress actually has this group
      if (!actress.selectedGroups || !actress.selectedGroups.includes(editingGroup.name)) {
        console.warn('Actress is not in this group:', {
          actressGroups: actress.selectedGroups,
          groupToRemove: editingGroup.name
        })
        toast.error('Actress is not in this group')
        return
      }

      // Filter out the current group
      const updatedGroups = actress.selectedGroups.filter(group => {
        const shouldKeep = group !== editingGroup.name
        console.log(`Group "${group}": ${shouldKeep ? 'keeping' : 'removing'}`)
        return shouldKeep
      })
      
      console.log('Original groups:', actress.selectedGroups)
      console.log('Updated groups after removal:', updatedGroups)
      
      // Prepare update data - use null for empty arrays to completely remove the field
      const updateData = {
        name: actress.name, // Required field
        jpname: actress.jpname || null,
        birthdate: actress.birthdate || null,
        alias: actress.alias || null,
        links: actress.links || null,
        takulinks: actress.takulinks || null,
        tags: actress.tags || null,
        photo: actress.photo || null,
        profilePicture: actress.profilePicture || null,
        groupId: actress.groupId || null,
        groupData: actress.groupData || null,
        generationData: null, // Remove generationData when removing from group
        selectedGroups: updatedGroups.length > 0 ? updatedGroups : null
      }

      console.log('Update data to send:', updateData)
      
      const result = await masterDataApi.updateExtended('actress', actressId, updateData, accessToken)
      console.log('Backend update result:', result)

      toast.success(`${actress.name} removed from ${editingGroup.name}`)
      setSuccess('Actress removed from group successfully!')
      setError(null)
      
      // Force reload data with a small delay to ensure backend has processed
      console.log('Forcing data reload...')
      await new Promise(resolve => setTimeout(resolve, 100))
      
      await Promise.all([
        loadActresses(),
        loadGroupActresses(editingGroup.name)
      ])
      
      console.log('Data reloaded. New groupActresses count:', groupActresses.length - 1)
    } catch (err) {
      console.error('Error removing actress from group:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove actress from group'
      toast.error(errorMessage)
      setError(errorMessage)
      setSuccess(null)
    } finally {
      setActressOperationLoading(false)
    }
  }

  const handleCreateNewActress = async (name: string) => {
    if (!editingGroup?.name) return

    try {
      setActressOperationLoading(true)
      console.log('Frontend: Creating new actress with data:', {
        name: name.trim(),
        selectedGroups: [editingGroup.name]
      })
      
      const newActress = await masterDataApi.createExtended('actress', {
        name: name.trim(),
        selectedGroups: [editingGroup.name]
      }, accessToken)

      console.log('Frontend: New actress created successfully:', newActress)

      toast.success('New actress created and added to group!')
      setSuccess('New actress created and added to group!')
      setError(null)
      // Immediately reload data and update UI
      await Promise.all([
        loadActresses(),
        loadGroupActresses(editingGroup.name)
      ])
    } catch (err) {
      console.error('Error creating new actress:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create new actress'
      toast.error(errorMessage)
      setError(errorMessage)
      setSuccess(null)
    } finally {
      setActressOperationLoading(false)
    }
  }

  return {
    groups,
    isLoading,
    error,
    success,
    editingGroup,
    showDialog,
    formData,
    availableActresses,
    groupActresses,
    actressOperationLoading,
    setShowDialog,
    handleCreate,
    handleEdit,
    handleSubmit,
    handleDelete,
    handleInputChange,
    handleAddActressToGroup,
    handleRemoveActressFromGroup,
    handleCreateNewActress
  }
}