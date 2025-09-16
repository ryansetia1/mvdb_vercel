import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Plus, Loader2, X } from 'lucide-react'
import { MasterDataItem } from '../utils/masterDataApi'
import { masterDataApi } from '../utils/masterDataApi'

interface LineupManagementProps {
  generationId: string
  generationName: string
  groupId: string
  accessToken: string
}

interface LineupFormData {
  name: string
  lineupType: string
  lineupOrder: number
  description?: string
  selectedActresses: string[]
  actressAliases: { [actressId: string]: string }
  actressProfilePictures: { [actressId: string]: string }
  selectedLineupId?: string // For version creation
}

export function LineupManagement({ 
  generationId, 
  generationName, 
  groupId,
  accessToken 
}: LineupManagementProps) {
  const [lineups, setLineups] = useState<MasterDataItem[]>([])
  const [actresses, setActresses] = useState<MasterDataItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingLineup, setEditingLineup] = useState<MasterDataItem | null>(null)
  const [formData, setFormData] = useState<LineupFormData>({
    name: '',
    lineupType: 'Main',
    lineupOrder: 1,
    description: '',
    selectedActresses: [],
    actressAliases: {},
    actressProfilePictures: {}
  })
  const [showVersionDialog, setShowVersionDialog] = useState(false)
  const [versionName, setVersionName] = useState('')
  const [isCreatingVersion, setIsCreatingVersion] = useState(false)
  const [isDeletingVersion, setIsDeletingVersion] = useState(false)
  const [versionUrlWasTrimmed, setVersionUrlWasTrimmed] = useState<{ [actressId: string]: { [versionName: string]: boolean } }>({})
  const [versionPhotoUrls, setVersionPhotoUrls] = useState<{ [actressId: string]: { [versionName: string]: string } }>({})

  // Function to auto-trim fandom.com URLs from the end
  const autoTrimFandomUrl = (url: string): string => {
    if (!url || typeof url !== 'string') return url
    
    // Check if it's a fandom.com URL
    if (!url.includes('static.wikia.nocookie.net')) return url
    
    // Remove everything after the last slash
    const lastSlashIndex = url.lastIndexOf('/')
    if (lastSlashIndex !== -1) {
      return url.substring(0, lastSlashIndex)
    }
    
    return url
  }

  const lineupTypes = [
    { value: 'Main', label: 'Main Lineup' },
    { value: 'Sub', label: 'Sub Lineup' },
    { value: 'Graduated', label: 'Graduated' },
    { value: 'Trainee', label: 'Trainee' },
    { value: 'Special', label: 'Special' }
  ]

  useEffect(() => {
    loadData()
  }, [generationId])

  // Auto-trim version photo URLs with debounce
  useEffect(() => {
    const timeouts: { [key: string]: NodeJS.Timeout } = {}
    
    Object.keys(versionPhotoUrls).forEach(actressId => {
      Object.keys(versionPhotoUrls[actressId]).forEach(versionName => {
        const url = versionPhotoUrls[actressId][versionName]
        
        if (!url.trim()) {
          setVersionUrlWasTrimmed(prev => ({
            ...prev,
            [actressId]: {
              ...prev[actressId],
              [versionName]: false
            }
          }))
          return
        }

        const key = `${actressId}-${versionName}`
        timeouts[key] = setTimeout(() => {
          const trimmedUrl = autoTrimFandomUrl(url.trim())
          const wasTrimmed = trimmedUrl !== url.trim()
          
          setVersionUrlWasTrimmed(prev => ({
            ...prev,
            [actressId]: {
              ...prev[actressId],
              [versionName]: wasTrimmed
            }
          }))
          
          // Auto-update the input field if URL was trimmed
          if (wasTrimmed) {
            setVersionPhotoUrls(prev => ({
              ...prev,
              [actressId]: {
                ...prev[actressId],
                [versionName]: trimmedUrl
              }
            }))
          }
        }, 1000) // 1 second debounce
      })
    })

    return () => {
      Object.values(timeouts).forEach(timeout => clearTimeout(timeout))
    }
  }, [versionPhotoUrls])

  // Handle edit state changes
  useEffect(() => {
    if (editingLineup && !showForm) {
      console.log('Edit state changed, preparing form...')
      // This will be handled by the edit button click
    }
  }, [editingLineup, showForm])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load lineups for this generation
      const allLineups = await masterDataApi.getByType('lineup', accessToken)
      const generationLineups = allLineups.filter(lineup => lineup.generationId === generationId)
      
      // Sort by lineupOrder
      generationLineups.sort((a, b) => (a.lineupOrder || 0) - (b.lineupOrder || 0))
      setLineups(generationLineups)

      // Load actresses for this group (using same logic as GenerationActressManagement)
      const allActresses = await masterDataApi.getByType('actress', accessToken)
      console.log('All actresses loaded:', allActresses.length)
      console.log('Group ID:', groupId)
      
      // Get group name from groupId (we need to find the group name to match with selectedGroups)
      const groups = await masterDataApi.getByType('group', accessToken)
      const currentGroup = groups.find(g => g.id === groupId)
      const groupName = currentGroup?.name
      
      console.log('Current group info:', {
        groupId,
        groupName,
        currentGroup
      })
      
      // Debug: Show first few actresses to understand their structure
      console.log('Sample actresses (first 3):', allActresses.slice(0, 3).map(a => ({
        name: a.name,
        groupId: a.groupId,
        selectedGroups: a.selectedGroups,
        groupData: a.groupData
      })))

      // Filter actresses that are assigned to this group (same logic as GenerationActressManagement)
      const groupActresses = allActresses.filter(actress => {
        const checkGroupId = actress.groupId === groupId
        const checkSelectedGroups = actress.selectedGroups && groupName && actress.selectedGroups.includes(groupName)
        const checkGroupData = actress.groupData && actress.groupData[groupId]
        
        console.log(`Checking actress ${actress.name}:`, {
          actressId: actress.id,
          actressGroupId: actress.groupId,
          actressSelectedGroups: actress.selectedGroups,
          actressGroupData: actress.groupData,
          targetGroupId: groupId,
          targetGroupName: groupName,
          checkGroupId,
          checkSelectedGroups,
          checkGroupData
        })
        
        const isInGroup = checkGroupId || checkSelectedGroups || checkGroupData
        console.log(`Actress ${actress.name} is in group ${groupId} (${groupName}):`, isInGroup)
        return isInGroup
      })
      
      console.log('Group actresses found:', groupActresses.length)
      console.log('LineupManagement: All actresses with lineupData:', groupActresses.map(a => ({ 
        name: a.name, 
        lineupData: a.lineupData,
        hasLineupData: !!a.lineupData 
      })))
      
      // Set actresses for this group only
      setActresses(groupActresses)

    } catch (err) {
      console.error('Error loading lineup data:', err)
      setError('Gagal memuat data lineup')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    
    try {
      setLoading(true)
      
      // Validate required fields
      if (!formData.name || formData.name.trim() === '') {
        setError('Nama lineup harus diisi')
        return
      }
      
      console.log('Submitting lineup data:', {
        name: formData.name,
        lineupType: formData.lineupType,
        lineupOrder: formData.lineupOrder,
        description: formData.description,
        generationId,
        generationName
      })
      
      const lineupData: Partial<MasterDataItem> = {
        name: formData.name.trim(),
        type: 'lineup',
        generationId: generationId,
        generationName: generationName,
        lineupType: formData.lineupType,
        lineupOrder: formData.lineupOrder,
        description: formData.description
      }

      let createdLineup: MasterDataItem
      
      if (editingLineup) {
        // Update existing lineup
        createdLineup = await masterDataApi.updateExtended('lineup', editingLineup.id, lineupData, accessToken)
      } else {
        // Create new lineup
        createdLineup = await masterDataApi.createExtended('lineup', lineupData, accessToken)
      }

      // Update selected actresses with lineup data
      if (formData.selectedActresses && formData.selectedActresses.length > 0 && createdLineup) {
        for (const actressId of formData.selectedActresses) {
          const actress = actresses?.find(a => a.id === actressId)
          if (actress) {
            // Preserve ALL existing actress data when updating
            const updateData: Partial<MasterDataItem> = {
              name: actress.name, // Required field for update
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
              selectedGroups: actress.selectedGroups,
              generationData: actress.generationData,
              lineupData: {
                ...(actress.lineupData || {}),
                [createdLineup.id]: {
                  alias: formData.actressAliases[actressId] || undefined,
                  profilePicture: formData.actressProfilePictures[actressId] || undefined
                }
              }
            }
            console.log('Updating actress with lineup data:', {
              actressId,
              actressName: actress.name,
              lineupId: createdLineup.id,
              updateData
            })
            await masterDataApi.updateExtended('actress', actressId, updateData, accessToken)
            console.log('Actress updated successfully:', actress.name)
          }
        }
      }

      // Reset form and reload data
      setFormData({
        name: '',
        lineupType: 'Main',
        lineupOrder: 1,
        description: '',
        selectedActresses: [],
        actressAliases: {},
        actressProfilePictures: {}
      })
      setShowForm(false)
      setEditingLineup(null)
      
      // Wait a bit for server to process the data, then reload
      setTimeout(async () => {
        await loadData()
      }, 1000)

    } catch (err) {
      console.error('Error saving lineup:', err)
      setError(`Gagal menyimpan lineup: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAddVersion = (lineupId: string, e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    setVersionName('')
    setShowVersionDialog(true)
    // Store lineupId for version creation
    setFormData(prev => ({ ...prev, selectedLineupId: lineupId }))
  }

  const handleSubmitVersion = async () => {
    try {
      setError(null)
      setIsCreatingVersion(true)

      if (!versionName.trim()) {
        setError('Version name is required')
        return
      }

      if (!formData.selectedLineupId) {
        setError('Lineup ID is required')
        return
      }

      // Get lineup actresses for the selected lineup
      const lineupActresses = getLineupActresses(formData.selectedLineupId)
      
      if (lineupActresses.length === 0) {
        setError('No actresses found in this lineup')
        return
      }

      // Create version for all actresses in the selected lineup
      const versionData = {
        photos: [],
        createdAt: new Date().toISOString(),
        description: `Version: ${versionName.trim()}`
      }

      console.log(`Creating version "${versionName.trim()}" for ${lineupActresses.length} actresses...`)

      // Update each actress in the lineup with the new version
      for (const actress of lineupActresses) {
        console.log('Updating actress:', actress.name, 'for lineup:', formData.selectedLineupId)
        console.log('Current lineupData:', actress.lineupData?.[formData.selectedLineupId])
        
        const currentLineupData = actress.lineupData?.[formData.selectedLineupId] || {}
        const updatedLineupData = {
          ...currentLineupData,
          photoVersions: {
            ...currentLineupData.photoVersions,
            [versionName.trim()]: versionData
          }
        }

        console.log('Updated lineupData:', updatedLineupData)

        const updateData = {
          name: actress.name,
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
          selectedGroups: actress.selectedGroups,
          generationData: actress.generationData,
          lineupData: {
            ...actress.lineupData,
            [formData.selectedLineupId]: updatedLineupData
          }
        }

        console.log('Update data for actress:', actress.name, updateData)
        await masterDataApi.updateExtended('actress', actress.id, updateData, accessToken)
        console.log('Actress updated successfully:', actress.name)
      }

      console.log(`Version "${versionName.trim()}" created successfully for all actresses!`)
      setVersionName('')
      setShowVersionDialog(false)
      setFormData(prev => ({ ...prev, selectedLineupId: undefined }))
      
      // Reload data to show updated versions
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create version')
    } finally {
      setIsCreatingVersion(false)
    }
  }

  const handleDeleteVersionFromAll = async (lineupId: string, versionName: string) => {
    if (!confirm(`Are you sure you want to delete version "${versionName}" from ALL actresses in this lineup? This action cannot be undone.`)) {
      return
    }

    try {
      setError(null)
      setIsDeletingVersion(true)

      // Get lineup actresses for the selected lineup
      const lineupActresses = getLineupActresses(lineupId)
      
      if (lineupActresses.length === 0) {
        setError('No actresses found in this lineup')
        return
      }

      console.log(`Deleting version "${versionName}" from ${lineupActresses.length} actresses...`)

      // Remove version from all actresses in the lineup
      for (const actress of lineupActresses) {
        const currentLineupData = actress.lineupData?.[lineupId]
        if (currentLineupData?.photoVersions?.[versionName]) {
          const updatedPhotoVersions = { ...currentLineupData.photoVersions }
          delete updatedPhotoVersions[versionName]

          const updatedLineupData = {
            ...currentLineupData,
            photoVersions: updatedPhotoVersions
          }

          const updateData = {
            name: actress.name,
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
            selectedGroups: actress.selectedGroups,
            generationData: actress.generationData,
            lineupData: {
              ...actress.lineupData,
              [lineupId]: updatedLineupData
            }
          }

          await masterDataApi.updateExtended('actress', actress.id, updateData, accessToken)
          console.log(`Version "${versionName}" deleted from actress:`, actress.name)
        }
      }

      console.log(`Version "${versionName}" deleted successfully from all actresses!`)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete version')
    } finally {
      setIsDeletingVersion(false)
    }
  }

  const handleVersionPhotoChange = async (actressId: string, lineupId: string, versionName: string, newUrl: string) => {
    try {
      // Find the actress
      const actress = actresses.find(a => a.id === actressId)
      if (!actress) {
        setError('Actress not found')
        return
      }

      const currentLineupData = actress.lineupData?.[lineupId]
      if (!currentLineupData?.photoVersions?.[versionName]) {
        setError('Version not found')
        return
      }

      // Update the photoVersions data
      const updatedPhotoVersions = {
        ...currentLineupData.photoVersions,
        [versionName]: {
          ...currentLineupData.photoVersions[versionName],
          photos: newUrl ? [newUrl] : []
        }
      }

      const updatedLineupData = {
        ...currentLineupData,
        photoVersions: updatedPhotoVersions
      }

      const updateData = {
        name: actress.name,
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
        selectedGroups: actress.selectedGroups,
        generationData: actress.generationData,
        lineupData: {
          ...actress.lineupData,
          [lineupId]: updatedLineupData
        }
      }

      await masterDataApi.updateExtended('actress', actressId, updateData, accessToken)
      
      // Reload data after update
      setTimeout(() => loadData(), 500)
    } catch (err) {
      console.error('Error updating version photo:', err)
      setError('Failed to update version photo')
    }
  }

  const handleEdit = (lineup: MasterDataItem) => {
    console.log('=== EDIT LINEUP START ===')
    console.log('Lineup to edit:', lineup)
    
    try {
      // Reset all states first
      setError(null)
      setShowForm(false)
      setEditingLineup(null)
      
      // Wait a bit for state to reset
      setTimeout(() => {
        try {
          console.log('Setting up edit form...')
          
          // Set editing lineup
          setEditingLineup(lineup)
          
          // Set basic form data
          const basicFormData = {
            name: lineup.name || '',
            lineupType: lineup.lineupType || 'Main',
            lineupOrder: lineup.lineupOrder || 1,
            description: lineup.description || '',
            selectedActresses: [],
            actressAliases: {},
            actressProfilePictures: {}
          }
          
          setFormData(basicFormData)
          
          // Show form
          setShowForm(true)
          
          console.log('=== EDIT LINEUP SETUP COMPLETE ===')
          
          // Load lineup actresses in background if needed
          if (actresses && actresses.length > 0) {
            setTimeout(() => {
              try {
                console.log('Loading lineup actresses in background...')
                
                // Find actresses that are already in this lineup
                const lineupActresses = actresses.filter(actress => 
                  actress.lineupData && actress.lineupData[lineup.id]
                )
                
                console.log('Found lineup actresses:', lineupActresses.length)
                
                if (lineupActresses.length > 0) {
                  const selectedActresses = lineupActresses.map(actress => actress.id)
                  const actressAliases: { [actressId: string]: string } = {}
                  const actressProfilePictures: { [actressId: string]: string } = {}
                  
                  lineupActresses.forEach(actress => {
                    const lineupData = actress.lineupData?.[lineup.id]
                    if (lineupData) {
                      actressAliases[actress.id] = lineupData.alias || ''
                      actressProfilePictures[actress.id] = lineupData.profilePicture || ''
                    }
                  })
                  
                  // Update form data with lineup actresses
                  setFormData(prev => ({
                    ...prev,
                    selectedActresses,
                    actressAliases,
                    actressProfilePictures
                  }))
                  
                  console.log('Lineup actresses loaded successfully')
                }
              } catch (error) {
                console.error('Error loading lineup actresses:', error)
              }
            }, 300)
          }
          
        } catch (error) {
          console.error('Error in edit setup:', error)
          setError('Gagal membuka form edit lineup')
        }
      }, 100)
      
    } catch (error) {
      console.error('Error in handleEdit:', error)
      setError('Gagal membuka form edit lineup')
    }
  }

  const handleDelete = async (lineup: MasterDataItem) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus lineup "${lineup.name}"?`)) {
      return
    }

    try {
      setLoading(true)
      await masterDataApi.delete('lineup', lineup.id, accessToken)
      await loadData()
    } catch (err) {
      console.error('Error deleting lineup:', err)
      setError('Gagal menghapus lineup')
    } finally {
      setLoading(false)
    }
  }

  const getLineupActresses = (lineupId: string) => {
    console.log('getLineupActresses called for lineupId:', lineupId)
    console.log('Total actresses available:', actresses.length)
    console.log('Actresses with lineupData:', actresses.filter(a => a.lineupData).length)
    
    const lineupActresses = actresses.filter(actress => {
      const hasLineupData = actress.lineupData && actress.lineupData[lineupId]
      console.log(`Actress ${actress.name}:`, {
        hasLineupData: !!actress.lineupData,
        hasSpecificLineup: !!actress.lineupData?.[lineupId],
        lineupData: actress.lineupData?.[lineupId],
        photoVersions: actress.lineupData?.[lineupId]?.photoVersions
      })
      return hasLineupData
    })
    
    console.log('Lineup actresses found:', lineupActresses.length)
    return lineupActresses
  }

  const getLineupProfilePicture = (actress: MasterDataItem, lineupId: string) => {
    if (actress.lineupData && actress.lineupData[lineupId]?.profilePicture) {
      return actress.lineupData[lineupId].profilePicture
    }
    return actress.profilePicture
  }

  const getLineupAlias = (actress: MasterDataItem, lineupId: string) => {
    if (actress.lineupData && actress.lineupData[lineupId]?.alias) {
      return actress.lineupData[lineupId].alias
    }
    return actress.alias
  }

  if (loading && lineups.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lineup Management</h2>
          <p className="text-gray-600">Kelola lineup untuk {generationName}</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Tambah Lineup
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Lineup Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingLineup ? 'Edit Lineup' : 'Tambah Lineup Baru'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lineup
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipe Lineup
              </label>
              <select
                value={formData.lineupType}
                onChange={(e) => setFormData({ ...formData, lineupType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {lineupTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Urutan Tampil
              </label>
              <input
                type="number"
                value={formData.lineupOrder}
                onChange={(e) => setFormData({ ...formData, lineupOrder: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi (Opsional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            {/* Member Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Members (Opsional)
              </label>
              <div className="border border-gray-300 rounded-lg p-3 max-h-60 overflow-y-auto">
                {!actresses || actresses.length === 0 ? (
                  <p className="text-gray-500 text-sm">Tidak ada actress yang tersedia</p>
                ) : (
                  <div className="space-y-2">
                    {actresses.map(actress => (
                      <div key={actress.id} className="flex items-center space-x-3 p-2 border border-gray-200 rounded-lg">
                        <input
                          type="checkbox"
                          id={`actress-${actress.id}`}
                          checked={formData.selectedActresses?.includes(actress.id) || false}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                selectedActresses: [...(formData.selectedActresses || []), actress.id],
                                actressAliases: { ...formData.actressAliases, [actress.id]: actress.alias || '' },
                                actressProfilePictures: { ...formData.actressProfilePictures, [actress.id]: actress.profilePicture || '' }
                              })
                            } else {
                              const newSelectedActresses = (formData.selectedActresses || []).filter(id => id !== actress.id)
                              const newAliases = { ...formData.actressAliases }
                              const newProfilePictures = { ...formData.actressProfilePictures }
                              delete newAliases[actress.id]
                              delete newProfilePictures[actress.id]
                              setFormData({
                                ...formData,
                                selectedActresses: newSelectedActresses,
                                actressAliases: newAliases,
                                actressProfilePictures: newProfilePictures
                              })
                            }
                          }}
                          className="rounded"
                        />
                        <label htmlFor={`actress-${actress.id}`} className="flex-1 cursor-pointer">
                          <div className="flex items-center space-x-3">
                            {actress.profilePicture && (
                              <img 
                                src={actress.profilePicture} 
                                alt={actress.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium text-sm">{actress.name}</p>
                              {actress.alias && (
                                <p className="text-xs text-gray-500">{actress.alias}</p>
                              )}
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Members Settings */}
            {formData.selectedActresses && formData.selectedActresses.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pengaturan Members
                </label>
                <div className="space-y-3 border border-gray-200 rounded-lg p-3">
                  {formData.selectedActresses.map(actressId => {
                    const actress = actresses?.find(a => a.id === actressId)
                    if (!actress) return null
                    
                    return (
                      <div key={actressId} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                        {actress.profilePicture && (
                          <img 
                            src={actress.profilePicture} 
                            alt={actress.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{actress.name}</p>
                          <div className="flex space-x-2 mt-1">
                            <input
                              type="text"
                              placeholder="Alias untuk lineup ini"
                              value={formData.actressAliases[actressId] || ''}
                              onChange={(e) => setFormData({
                                ...formData,
                                actressAliases: {
                                  ...formData.actressAliases,
                                  [actressId]: e.target.value
                                }
                              })}
                              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <input
                              type="text"
                              placeholder="Profile picture URL"
                              value={formData.actressProfilePictures[actressId] || ''}
                              onChange={(e) => setFormData({
                                ...formData,
                                actressProfilePictures: {
                                  ...formData.actressProfilePictures,
                                  [actressId]: e.target.value
                                }
                              })}
                              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Menyimpan...' : (editingLineup ? 'Update' : 'Simpan')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingLineup(null)
                  setFormData({
                    name: '',
                    lineupType: 'Main',
                    lineupOrder: 1,
                    description: '',
                    selectedActresses: [],
                    actressAliases: {},
                    actressProfilePictures: {}
                  })
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lineups List */}
      <div className="space-y-4">
        {lineups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Belum ada lineup untuk generasi ini
          </div>
        ) : (
          lineups.map((lineup) => {
            const lineupActresses = getLineupActresses(lineup.id)
            
            return (
              <div key={lineup.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {lineup.name}
                    </h3>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {lineupTypes.find(t => t.value === lineup.lineupType)?.label || lineup.lineupType}
                      </span>
                      <span>Urutan: {lineup.lineupOrder}</span>
                      <span>{lineupActresses.length} member</span>
                      {(() => {
                        // Get all available versions from lineup actresses
                        const availableVersions = new Set<string>()
                        lineupActresses.forEach(actress => {
                          if (actress.lineupData?.[lineup.id]?.photoVersions) {
                            Object.keys(actress.lineupData[lineup.id].photoVersions).forEach(version => availableVersions.add(version))
                          }
                        })
                        
                        const versionOptions = Array.from(availableVersions).sort()
                        
                        if (versionOptions.length > 0) {
                          return (
                            <div className="flex items-center gap-1">
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                {versionOptions.length} Version{versionOptions.length > 1 ? 's' : ''}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({versionOptions.join(', ')})
                              </span>
                            </div>
                          )
                        }
                        return (
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                            No Versions
                          </span>
                        )
                      })()}
                    </div>
                    {lineup.description && (
                      <p className="text-gray-600 mt-2">{lineup.description}</p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={(e) => handleAddVersion(lineup.id, e)}
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      disabled={isCreatingVersion}
                    >
                      {isCreatingVersion ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3 mr-1" />
                          Add Version
                        </>
                      )}
                    </Button>
                    {(() => {
                      // Get all available versions from lineup actresses
                      const availableVersions = new Set<string>()
                      lineupActresses.forEach(actress => {
                        if (actress.lineupData?.[lineup.id]?.photoVersions) {
                          Object.keys(actress.lineupData[lineup.id].photoVersions).forEach(version => availableVersions.add(version))
                        }
                      })
                      
                      const versionOptions = Array.from(availableVersions).sort()
                      
                      if (versionOptions.length > 0) {
                        return (
                          <Select 
                            onValueChange={(versionName) => handleDeleteVersionFromAll(lineup.id, versionName)}
                            disabled={isDeletingVersion}
                          >
                            <SelectTrigger className="w-32 h-7 text-xs">
                              <SelectValue placeholder={isDeletingVersion ? "Deleting..." : "Delete Version"} />
                            </SelectTrigger>
                            <SelectContent>
                              {versionOptions.map(version => (
                                <SelectItem key={version} value={version} className="text-red-600">
                                  <div className="flex items-center gap-2">
                                    <X className="h-3 w-3" />
                                    Delete {version}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )
                      }
                      return null
                    })()}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log('Edit button clicked for lineup:', lineup.name)
                        handleEdit(lineup)
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(lineup)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Hapus
                    </button>
                  </div>
                </div>

                {/* Lineup Members */}
                {lineupActresses.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Members:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {lineupActresses.map((actress) => {
                        const lineupData = actress.lineupData?.[lineup.id]
                        
                        return (
                          <div key={actress.id} className="space-y-3 p-4 bg-gray-50 rounded-lg">
                            {/* Actress Info */}
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                                {getLineupProfilePicture(actress, lineup.id) ? (
                                  <img
                                    src={getLineupProfilePicture(actress, lineup.id)}
                                    alt={actress.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-gray-600 text-sm font-medium">
                                    {actress.name?.charAt(0)}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {getLineupAlias(actress, lineup.id) || actress.name}
                                </p>
                                {getLineupAlias(actress, lineup.id) && (
                                  <p className="text-xs text-gray-500 truncate">
                                    {actress.name}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Version Photo Input Fields */}
                            {(() => {
                              console.log('Debug lineupData for actress:', actress.name, lineupData)
                              console.log('Debug photoVersions:', lineupData?.photoVersions)
                              console.log('Debug photoVersions keys:', lineupData?.photoVersions ? Object.keys(lineupData.photoVersions) : 'No photoVersions')
                              
                              if (lineupData?.photoVersions && Object.keys(lineupData.photoVersions).length > 0) {
                                return (
                                  <div className="space-y-2">
                                    <h5 className="text-xs font-medium text-gray-600">Version Photos:</h5>
                                    {Object.keys(lineupData.photoVersions).map(versionName => (
                                      <div key={versionName} className="space-y-1">
                                        <label className="text-xs text-gray-500">{versionName}:</label>
                                        <div className="relative">
                                          <Input
                                            value={versionPhotoUrls[actress.id]?.[versionName] || lineupData.photoVersions[versionName].photos?.[0] || ''}
                                            onChange={(e) => {
                                              // Update local state for immediate UI feedback
                                              setVersionPhotoUrls(prev => ({
                                                ...prev,
                                                [actress.id]: {
                                                  ...prev[actress.id],
                                                  [versionName]: e.target.value
                                                }
                                              }))
                                            }}
                                            onBlur={() => {
                                              const currentUrl = versionPhotoUrls[actress.id]?.[versionName] || lineupData.photoVersions[versionName].photos?.[0] || ''
                                              if (currentUrl.trim()) {
                                                handleVersionPhotoChange(actress.id, lineup.id, versionName, currentUrl)
                                              }
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                const currentUrl = versionPhotoUrls[actress.id]?.[versionName] || lineupData.photoVersions[versionName].photos?.[0] || ''
                                                if (currentUrl.trim()) {
                                                  handleVersionPhotoChange(actress.id, lineup.id, versionName, currentUrl)
                                                }
                                              }
                                            }}
                                            placeholder={`${versionName} photo URL...`}
                                            className="h-7 text-xs"
                                          />
                                          {versionUrlWasTrimmed[actress.id]?.[versionName] && (
                                            <div className="absolute -bottom-5 left-0 right-0 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded px-2 py-1 text-xs text-blue-600">
                                              ✂️ URL trimmed
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )
                              } else {
                                return (
                                  <div className="text-xs text-gray-400 italic">
                                    No versions available
                                  </div>
                                )
                              }
                            })()}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Belum ada member di lineup ini
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Add Version Dialog */}
      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Photo Version</DialogTitle>
            <DialogDescription>
              Create a new photo version for all actresses in the "{lineups.find(l => l.id === formData.selectedLineupId)?.name || 'selected'}" lineup. Each actress will get a new photo input field for this version.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="versionName">Version Name *</Label>
              <Input
                id="versionName"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder="e.g., Version 1, Summer Look, etc."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSubmitVersion()
                  }
                }}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowVersionDialog(false)} disabled={isCreatingVersion}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSubmitVersion} disabled={loading || isCreatingVersion || !versionName.trim()}>
                {isCreatingVersion ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Version...
                  </>
                ) : (
                  'Create Version'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
