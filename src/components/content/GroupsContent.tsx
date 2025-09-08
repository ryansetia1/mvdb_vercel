import { useState, useEffect, useMemo } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Search, Plus, Edit, Trash2, Globe, ArrowLeft, User, Calendar, ImageOff, Filter } from 'lucide-react'
import { MasterDataItem, masterDataApi, calculateAge } from '../../utils/masterDataApi'
import { ImageWithFallback } from '../figma/ImageWithFallback'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { SimpleFavoriteButton } from '../SimpleFavoriteButton'
import { GroupFormDialog } from '../groupForm/GroupFormDialog'
import { toast } from 'sonner@2.0.3'
import { PaginationEnhanced } from '../ui/pagination-enhanced'

interface GroupsContentProps {
  accessToken: string
  searchQuery: string
  onProfileSelect?: (type: 'actress' | 'actor', name: string) => void
  onGroupSelect?: (group: MasterDataItem) => void
  selectedGroupFromNavigation?: string
}

interface GroupFormData {
  name: string
  jpname: string
  profilePicture: string
  website: string
  description: string
  gallery: string[]
}

const sortOptions = [
  { key: 'name', label: 'Name (A-Z)', getValue: (actress: MasterDataItem) => actress.name?.toLowerCase() || '' },
  { key: 'name-desc', label: 'Name (Z-A)', getValue: (actress: MasterDataItem) => actress.name?.toLowerCase() || '' },
  { key: 'age', label: 'Age (Young)', getValue: (actress: MasterDataItem) => actress.birthdate ? calculateAge(actress.birthdate) : 999 },
  { key: 'age-desc', label: 'Age (Old)', getValue: (actress: MasterDataItem) => actress.birthdate ? calculateAge(actress.birthdate) : 0 },
  { key: 'movieCount', label: 'Movies (Few)', getValue: (actress: MasterDataItem) => actress.movieCount || 0 },
  { key: 'movieCount-desc', label: 'Movies (Many)', getValue: (actress: MasterDataItem) => actress.movieCount || 0 },
]

export function GroupsContent({ accessToken, searchQuery, onProfileSelect, onGroupSelect, selectedGroupFromNavigation }: GroupsContentProps) {
  const [groups, setGroups] = useState<MasterDataItem[]>([])
  const [actresses, setActresses] = useState<MasterDataItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingGroup, setEditingGroup] = useState<MasterDataItem | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<MasterDataItem | null>(null)
  const [groupMembers, setGroupMembers] = useState<MasterDataItem[]>([])
  const [editingGroupActresses, setEditingGroupActresses] = useState<MasterDataItem[]>([])
  const [sortBy, setSortBy] = useState('name')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(24)
  const [formData, setFormData] = useState<GroupFormData>({
    name: '',
    jpname: '',
    profilePicture: '',
    website: '',
    description: '',
    gallery: []
  })

  useEffect(() => {
    loadData()
  }, [accessToken])

  // Handle selectedGroupFromNavigation when data is loaded
  useEffect(() => {
    if (selectedGroupFromNavigation && groups.length > 0 && actresses.length > 0) {
      const group = groups.find(g => g.name === selectedGroupFromNavigation)
      if (group) {
        // Allow switching groups even if there's already a selected group
        handleGroupClick(group)
      }
    } else if (!selectedGroupFromNavigation && selectedGroup) {
      // If there's no selectedGroupFromNavigation but we have a selected group,
      // it means user navigated to Groups page normally, so go back to groups list
      handleBackToGroups()
    }
  }, [selectedGroupFromNavigation, groups, actresses])

  const loadData = async () => {
    try {
      setIsLoading(true)
      console.log('🔄 Loading groups and actresses data...')
      
      const [groupsData, actressesData] = await Promise.all([
        masterDataApi.getByType('group', accessToken),
        masterDataApi.getByType('actress', accessToken)
      ])
      
      console.log('📊 Groups loaded:', groupsData?.length || 0)
      console.log('👩 Actresses loaded:', actressesData?.length || 0)
      
      // Debug: log actresses with group data
      if (actressesData && actressesData.length > 0) {
        console.log('\n=== ACTRESS DATA ANALYSIS ===')
        actressesData.forEach((actress, index) => {
          if (actress.selectedGroups && actress.selectedGroups.length > 0) {
            console.log(`\nActress ${index + 1}: ${actress.name}`)
            console.log('- selectedGroups:', actress.selectedGroups)
            console.log('- groupProfilePictures:', actress.groupProfilePictures)
            console.log('- groupData:', actress.groupData)
            console.log('- groupAliases:', actress.groupAliases)
            
            // Check if any group-specific data exists
            const hasGroupPhotos = actress.groupProfilePictures && Object.keys(actress.groupProfilePictures).length > 0
            const hasGroupData = actress.groupData && Object.keys(actress.groupData).length > 0
            console.log('- Has group photos?', hasGroupPhotos)
            console.log('- Has group data?', hasGroupData)
          }
        })
        console.log('=== END ANALYSIS ===\n')
      }
      
      setGroups(groupsData || [])
      setActresses(actressesData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load groups')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      jpname: '',
      profilePicture: '',
      website: '',
      description: '',
      gallery: []
    })
    setEditingGroup(null)
    setEditingGroupActresses([])
  }

  const handleCreate = () => {
    resetForm()
    setShowCreateDialog(true)
  }

  const loadEditingGroupActresses = async (groupName: string) => {
    try {
      console.log('=== LOADING EDITING GROUP ACTRESSES ===')
      console.log('Group name:', groupName)
      
      // Get fresh actress data
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
      
      console.log('Filtered editing group actresses:', actresses.map(a => ({ name: a.name, groups: a.selectedGroups })))
      setEditingGroupActresses(actresses)
    } catch (err) {
      console.error('Error loading editing group actresses:', err)
    }
  }

  const handleEdit = async (group: MasterDataItem) => {
    console.log('=== EDITING GROUP ===')
    console.log('Group:', group)
    
    setFormData({
      name: group.name || '',
      jpname: group.jpname || '',
      profilePicture: group.profilePicture || '',
      website: group.website || '',
      description: group.description || '',
      gallery: group.gallery || []
    })
    setEditingGroup(group)
    
    // Load actresses for this specific group being edited
    if (group.name) {
      console.log('Loading actresses for editing group...')
      await loadEditingGroupActresses(group.name)
    }
    
    setShowCreateDialog(true)
  }

  const handleInputChange = (field: string, value: string | string[]) => {
    console.log('=== HANDLE INPUT CHANGE ===')
    console.log('Field:', field)
    console.log('Value:', value)
    console.log('Value type:', typeof value)
    console.log('Current formData before update:', formData)
    
    setFormData(prev => {
      const newFormData = { ...prev, [field]: value }
      console.log('New formData after update:', newFormData)
      console.log('=== END HANDLE INPUT CHANGE ===')
      return newFormData
    })
  }

  const handleAddActressToGroup = async (actressId: string) => {
    if (!editingGroup?.name) return
    
    try {
      setIsLoading(true)
      const actress = actresses.find(a => a.id === actressId)
      if (!actress) return

      // Check if actress is already in this group
      if (actress.selectedGroups && actress.selectedGroups.includes(editingGroup.name)) {
        toast.error('Actress is already in this group')
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
      // Reload data
      await Promise.all([
        loadData(),
        loadEditingGroupActresses(editingGroup.name)
      ])
    } catch (err) {
      console.error('Error adding actress to group:', err)
      toast.error('Failed to add actress to group')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveActressFromGroup = async (actressId: string) => {
    if (!editingGroup?.name) {
      toast.error('No group selected')
      return
    }

    // Find the actress to show confirmation with her name
    const actress = editingGroupActresses.find(a => a.id === actressId) || actresses.find(a => a.id === actressId)
    if (!actress) {
      toast.error('Actress not found')
      return
    }

    // Confirm removal
    if (!confirm(`Are you sure you want to remove "${actress.name}" from the group "${editingGroup.name}"?`)) {
      return
    }

    try {
      setIsLoading(true)

      // Check if the actress actually has this group
      if (!actress.selectedGroups || !actress.selectedGroups.includes(editingGroup.name)) {
        toast.error('Actress is not in this group')
        return
      }

      // Filter out the current group
      const updatedGroups = actress.selectedGroups.filter(group => group !== editingGroup.name)
      
      // Prepare update data
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
        selectedGroups: updatedGroups.length > 0 ? updatedGroups : null
      }
      
      await masterDataApi.updateExtended('actress', actressId, updateData, accessToken)

      toast.success(`${actress.name} removed from ${editingGroup.name}`)
      
      // Reload data
      await Promise.all([
        loadData(),
        loadEditingGroupActresses(editingGroup.name)
      ])
    } catch (err) {
      console.error('Error removing actress from group:', err)
      toast.error('Failed to remove actress from group')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateNewActress = async (name: string) => {
    if (!editingGroup?.name) return

    try {
      setIsLoading(true)
      console.log('Frontend: Creating new actress with data:', {
        name: name.trim(),
        selectedGroups: [editingGroup.name]
      })
      
      await masterDataApi.createExtended('actress', {
        name: name.trim(),
        selectedGroups: [editingGroup.name]
      }, accessToken)

      toast.success('New actress created and added to group!')
      
      // Reload data
      await Promise.all([
        loadData(),
        loadEditingGroupActresses(editingGroup.name)
      ])
    } catch (err) {
      console.error('Error creating new actress:', err)
      toast.error('Failed to create new actress')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Group name is required')
      return
    }

    try {
      setIsLoading(true)

      console.log('=== FORM SUBMIT START ===')
      console.log('Form data being submitted:', formData)
      console.log('Gallery data being submitted:', formData.gallery)
      
      if (editingGroup) {
        console.log('Updating existing group...')
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
        console.log('Group update API call completed')
        toast.success('Group updated successfully')
      } else {
        console.log('Creating new group...')
        await masterDataApi.createGroup(
          formData.name,
          formData.jpname,
          formData.profilePicture,
          formData.website,
          formData.description,
          accessToken,
          formData.gallery
        )
        console.log('Group create API call completed')
        toast.success('Group created successfully')
      }
      
      console.log('=== FORM SUBMIT END ===')

      await loadData()
      setShowCreateDialog(false)
      resetForm()
    } catch (error) {
      console.error('Error saving group:', error)
      toast.error(editingGroup ? 'Failed to update group' : 'Failed to create group')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (group: MasterDataItem) => {
    if (!confirm(`Are you sure you want to delete the group "${group.name}"?`)) {
      return
    }

    try {
      setIsLoading(true)
      await masterDataApi.delete('group', group.id, accessToken)
      toast.success('Group deleted successfully')
      await loadData()
    } catch (error) {
      console.error('Error deleting group:', error)
      toast.error('Failed to delete group')
    } finally {
      setIsLoading(false)
    }
  }

  const getGroupActressCount = (groupName: string) => {
    return actresses.filter(actress => 
      actress.selectedGroups && actress.selectedGroups.includes(groupName)
    ).length
  }

  const handleGroupClick = (group: MasterDataItem) => {
    const members = actresses.filter(actress => 
      actress.selectedGroups && actress.selectedGroups.includes(group.name)
    )
    
    // Debug logging to check data structure
    console.log('Group clicked:', group.name)
    console.log('Group members found:', members.length)
    members.forEach((actress, index) => {
      console.log(`Member ${index + 1}: ${actress.name}`)
      console.log('- selectedGroups:', actress.selectedGroups)
      console.log('- groupProfilePictures:', actress.groupProfilePictures)
      console.log('- groupData:', actress.groupData)
      console.log('- groupAliases:', actress.groupAliases)
    })
    
    setGroupMembers(members)
    setSelectedGroup(group)
    setSortBy('name') // Reset sort to default when switching groups
  }

  const handleBackToGroups = () => {
    setSelectedGroup(null)
    setGroupMembers([])
    setSortBy('name') // Reset sort when going back to groups
    setCurrentPage(1) // Reset pagination when going back to groups
  }

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const getGroupProfilePicture = (actress: MasterDataItem, groupName: string) => {
    console.log(`\n=== Getting profile picture for ${actress.name} in group ${groupName} ===`)
    
    // Debug: log all actress data
    console.log('Full actress data:', {
      id: actress.id,
      name: actress.name,
      profilePicture: actress.profilePicture,
      groupProfilePictures: actress.groupProfilePictures,
      groupData: actress.groupData,
      groupAliases: actress.groupAliases,
      selectedGroups: actress.selectedGroups,
      // Log all fields that might contain group-specific data
      ...Object.fromEntries(
        Object.entries(actress).filter(([key]) => 
          key.toLowerCase().includes('group') || 
          key.toLowerCase().includes('photo') ||
          key.toLowerCase().includes('picture')
        )
      )
    })
    
    // Check the current structure first (for newer data)
    console.log('Checking groupProfilePictures:', actress.groupProfilePictures)
    if (actress.groupProfilePictures && typeof actress.groupProfilePictures === 'object') {
      console.log(`Looking for groupProfilePictures[${groupName}]:`, actress.groupProfilePictures[groupName])
      if (actress.groupProfilePictures[groupName]) {
        const groupPic = actress.groupProfilePictures[groupName].trim()
        if (groupPic) {
          console.log('✅ Found groupProfilePictures photo:', groupPic)
          return groupPic
        }
      }
    }
    
    // Check the groupData structure (for data stored via ActorForm)
    console.log('Checking groupData:', actress.groupData)
    if (actress.groupData && typeof actress.groupData === 'object') {
      console.log(`Looking for groupData[${groupName}]:`, actress.groupData[groupName])
      if (actress.groupData[groupName]) {
        const groupInfo = actress.groupData[groupName]
        console.log(`Found groupInfo for ${groupName}:`, groupInfo)
        
        // Check for profilePicture field (saved from ActorForm)
        if (groupInfo.profilePicture && groupInfo.profilePicture.trim()) {
          console.log('✅ Found groupData profilePicture:', groupInfo.profilePicture)
          return groupInfo.profilePicture.trim()
        }
        
        // Check for photos array (alternative structure)
        if (groupInfo.photos && Array.isArray(groupInfo.photos) && groupInfo.photos.length > 0) {
          const firstPhoto = groupInfo.photos[0]?.trim()
          if (firstPhoto) {
            console.log('✅ Found groupData photos array:', firstPhoto)
            return firstPhoto
          }
        }
      }
    }
    
    console.log('❌ No group-specific photo found, showing placeholder')
    // If no group-specific picture, return null to show placeholder
    return null
  }

  const getGroupAlias = (actress: MasterDataItem, groupName: string) => {
    console.log(`\n=== Getting alias for ${actress.name} in group ${groupName} ===`)
    
    // Check the current structure first (for newer data)
    console.log('Checking groupAliases:', actress.groupAliases)
    if (actress.groupAliases && actress.groupAliases[groupName]) {
      console.log('✅ Found groupAliases alias:', actress.groupAliases[groupName])
      return actress.groupAliases[groupName]
    }
    
    // Check the groupData structure (for data stored via ActorForm)
    console.log('Checking groupData for alias:', actress.groupData)
    if (actress.groupData && actress.groupData[groupName]) {
      const groupInfo = actress.groupData[groupName]
      console.log(`Found groupInfo for ${groupName}:`, groupInfo)
      if (groupInfo.alias && groupInfo.alias.trim()) {
        console.log('✅ Found groupData alias:', groupInfo.alias)
        return groupInfo.alias.trim()
      }
    }
    
    console.log('❌ No group-specific alias found')
    // Don't fallback to regular alias - only show group-specific alias
    return null
  }

  // Filter groups based on search query
  const filteredGroups = groups.filter(group => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      group.name?.toLowerCase().includes(query) ||
      group.jpname?.toLowerCase().includes(query) ||
      group.description?.toLowerCase().includes(query)
    )
  })

  // Sort group members
  const sortedGroupMembers = useMemo(() => {
    if (groupMembers.length === 0) return []
    
    const sortOption = sortOptions.find(option => option.key === sortBy)
    if (!sortOption) return groupMembers
    
    const isDesc = sortBy.endsWith('-desc')
    const sorted = [...groupMembers].sort((a, b) => {
      const aVal = sortOption.getValue(a)
      const bVal = sortOption.getValue(b)
      
      if (aVal < bVal) return isDesc ? 1 : -1
      if (aVal > bVal) return isDesc ? -1 : 1
      return 0
    })
    
    return sorted
  }, [groupMembers, sortBy])

  // Calculate pagination for groups list
  const groupsTotalPages = Math.ceil(filteredGroups.length / itemsPerPage)
  const groupsStartIndex = (currentPage - 1) * itemsPerPage
  const paginatedGroups = filteredGroups.slice(groupsStartIndex, groupsStartIndex + itemsPerPage)

  // Calculate pagination for group members
  const membersTotalPages = Math.ceil(sortedGroupMembers.length / itemsPerPage)
  const membersStartIndex = (currentPage - 1) * itemsPerPage
  const paginatedMembers = sortedGroupMembers.slice(membersStartIndex, membersStartIndex + itemsPerPage)

  if (isLoading && groups.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading groups...</p>
        </div>
      </div>
    )
  }

  // If a group is selected, show its members
  if (selectedGroup) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackToGroups}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Groups
            </Button>
            <Globe className="h-6 w-6" />
            <h2 className="text-2xl font-bold">{selectedGroup.name}</h2>
            <Badge variant="secondary" className="ml-2">
              {groupMembers.length} {groupMembers.length === 1 ? 'member' : 'members'}
            </Badge>
          </div>
        </div>

        {/* Group Info */}
        {(selectedGroup.jpname || selectedGroup.description) && (
          <div className="p-4 bg-muted/50 rounded-lg">
            {selectedGroup.jpname && (
              <p className="text-sm text-muted-foreground mb-2">
                {selectedGroup.jpname}
              </p>
            )}
            {selectedGroup.description && (
              <p className="text-sm">
                {selectedGroup.description}
              </p>
            )}
          </div>
        )}

        {/* Sort controls - Show only when there are members */}
        {groupMembers.length > 0 && (
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
        )}

        {/* Pagination - Top */}
        <PaginationEnhanced
          currentPage={currentPage}
          totalPages={membersTotalPages}
          itemsPerPage={itemsPerPage}
          totalItems={sortedGroupMembers.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(newItemsPerPage) => {
            setItemsPerPage(newItemsPerPage)
            setCurrentPage(1)
          }}
        />

        {/* Members Grid */}
        {groupMembers.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No members yet</h3>
            <p className="text-muted-foreground">
              No actresses have been assigned to this group yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {paginatedMembers.map((actress) => {
              const imageUrl = getGroupProfilePicture(actress, selectedGroup.name || '')
              const groupAlias = getGroupAlias(actress, selectedGroup.name || '')
              
              return (
                <Card 
                  key={actress.id} 
                  className="group hover:shadow-lg transition-all duration-200 cursor-pointer"
                  onClick={() => onProfileSelect?.('actress', actress.name)}
                >
                  <CardContent className="p-0">
                    {/* Profile Picture */}
                    <div className="aspect-[3/4] overflow-hidden rounded-t-lg bg-muted relative">
                      {imageUrl ? (
                        <>
                          <img
                            src={imageUrl}
                            alt={`${actress.name} in ${selectedGroup.name}`}
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
                      
                      {/* Show group alias if available, otherwise show regular alias */}
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
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Groups</h2>
          <Badge variant="secondary" className="ml-2">
            {filteredGroups.length} {filteredGroups.length === 1 ? 'group' : 'groups'}
          </Badge>
        </div>
        
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Group
        </Button>
      </div>

      {/* Pagination - Top */}
      <PaginationEnhanced
        currentPage={currentPage}
        totalPages={groupsTotalPages}
        itemsPerPage={itemsPerPage}
        totalItems={filteredGroups.length}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(newItemsPerPage) => {
          setItemsPerPage(newItemsPerPage)
          setCurrentPage(1)
        }}
      />

      {/* Groups Grid */}
      {filteredGroups.length === 0 ? (
        <div className="text-center py-12">
          <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {searchQuery ? 'No groups found' : 'No groups yet'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery 
              ? 'Try adjusting your search terms'
              : 'Create your first group to organize actresses'
            }
          </p>
          {!searchQuery && (
            <Button onClick={handleCreate} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Group
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedGroups.map(group => (
            <Card 
              key={group.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onGroupSelect ? onGroupSelect(group) : handleGroupClick(group)}
            >
              <CardContent className="p-4">
                {/* Group Profile Picture */}
                {group.profilePicture && (
                  <div className="aspect-square w-full mb-3 rounded-md overflow-hidden bg-muted">
                    <ImageWithFallback
                      src={group.profilePicture}
                      alt={group.name || 'Group'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* Group Info */}
                <div className="space-y-2">
                  <h3 className="font-medium line-clamp-1">{group.name}</h3>
                  
                  {group.jpname && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {group.jpname}
                    </p>
                  )}
                  
                  {group.website && (
                    <p className="text-xs text-blue-600 hover:underline cursor-pointer line-clamp-1">
                      <a href={group.website} target="_blank" rel="noopener noreferrer">
                        {group.website}
                      </a>
                    </p>
                  )}
                  
                  {group.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {group.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{getGroupActressCount(group.name || '')} actresses</span>
                    <span>{new Date(group.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex justify-end gap-1 mt-3 pt-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit(group)
                    }}
                    disabled={isLoading}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(group)
                    }}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <GroupFormDialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open)
          if (!open) {
            resetForm()
          }
        }}
        editingGroup={editingGroup}
        formData={formData}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        availableActresses={actresses}
        groupActresses={editingGroup ? editingGroupActresses : []}
        actressOperationLoading={isLoading}
        onAddActressToGroup={handleAddActressToGroup}
        onRemoveActressFromGroup={handleRemoveActressFromGroup}
        onCreateNewActress={handleCreateNewActress}
        accessToken={accessToken}
      />
    </div>
  )
}