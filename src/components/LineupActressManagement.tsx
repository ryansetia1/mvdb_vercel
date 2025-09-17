import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Plus, Trash2, Edit, User, Users, Loader2, X } from 'lucide-react'
import { MasterDataItem } from '../utils/masterDataApi'
import { masterDataApi } from '../utils/masterDataApi'
import { ImageWithFallback } from './figma/ImageWithFallback'

interface LineupActressManagementProps {
  lineupId: string
  lineupName: string
  generationId: string
  accessToken: string
}

interface ActressAssignment {
  actressId: string
  actressName: string
  alias?: string
  profilePicture?: string
  photos?: string[]
}

export function LineupActressManagement({ 
  lineupId, 
  lineupName, 
  generationId,
  accessToken 
}: LineupActressManagementProps) {
  const [actresses, setActresses] = useState<MasterDataItem[]>([])
  const [lineupActresses, setLineupActresses] = useState<ActressAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAssignmentForm, setShowAssignmentForm] = useState(false)
  const [selectedActress, setSelectedActress] = useState<string>('')
  const [assignmentData, setAssignmentData] = useState({
    alias: '',
    profilePicture: '',
    photos: [] as string[]
  })
  const [showVersionDialog, setShowVersionDialog] = useState(false)
  const [versionName, setVersionName] = useState('')
  const [isCreatingVersion, setIsCreatingVersion] = useState(false)
  const [isDeletingVersion, setIsDeletingVersion] = useState(false)

  useEffect(() => {
    loadData()
  }, [lineupId, generationId])

  // Update assignmentData when selectedActress changes
  useEffect(() => {
    if (selectedActress) {
      const actress = actresses.find(a => a.id === selectedActress)
      if (actress) {
        // Set alias default to English name instead of actress alias
        setAssignmentData(prev => ({
          ...prev,
          alias: actress.name || ''
        }))
      }
    } else {
      // Reset assignmentData when no actress is selected
      setAssignmentData({ alias: '', profilePicture: '', photos: [] })
    }
  }, [selectedActress, actresses])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load all actresses for this generation's group
      const allActresses = await masterDataApi.getByType('actress', accessToken)
      
      // Filter actresses that belong to the same group as this generation
      const generations = await masterDataApi.getByType('generation', accessToken)
      const generation = generations.find(g => g.id === generationId)
      const groupActresses = allActresses.filter(actress => 
        actress.selectedGroups && actress.selectedGroups.includes(generation?.groupName || '')
      )
      
      setActresses(groupActresses)

      // Load lineup assignments
      const assignments: ActressAssignment[] = []
      groupActresses.forEach(actress => {
        if (actress.lineupData && actress.lineupData[lineupId]) {
          assignments.push({
            actressId: actress.id,
            actressName: actress.name || '',
            alias: actress.lineupData[lineupId].alias,
            profilePicture: actress.lineupData[lineupId].profilePicture,
            photos: actress.lineupData[lineupId].photos
          })
        }
      })
      
      setLineupActresses(assignments)

    } catch (err) {
      console.error('Error loading lineup actress data:', err)
      setError('Gagal memuat data aktris lineup')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignActress = async () => {
    if (!selectedActress) return

    try {
      setLoading(true)
      setError(null) // Clear any previous errors
      
      const actress = actresses.find(a => a.id === selectedActress)
      if (!actress) {
        console.error('Actress not found:', selectedActress)
        setError('Aktris tidak ditemukan')
        return
      }

      console.log('=== ASSIGNING ACTRESS TO LINEUP ===')
      console.log('Actress:', { id: actress.id, name: actress.name })
      console.log('Lineup ID:', lineupId)
      console.log('Assignment data:', assignmentData)

      // Check if actress is already in this lineup
      if (actress.lineupData && actress.lineupData[lineupId]) {
        console.warn('Actress is already in this lineup:', {
          actressId: actress.id,
          actressName: actress.name,
          lineupId,
          existingData: actress.lineupData[lineupId]
        })
        setError('Aktris sudah berada di lineup ini')
        return
      }

      // Update actress lineup data while preserving ALL existing data
      const updatedLineupData = {
        ...(actress.lineupData || {}), // Handle undefined lineupData
        [lineupId]: {
          alias: assignmentData.alias || undefined,
          profilePicture: assignmentData.profilePicture || undefined,
          photos: assignmentData.photos.length > 0 ? assignmentData.photos : undefined
        }
      }

      console.log('Updated lineupData after assignment:', updatedLineupData)

      // Preserve ALL existing actress data when updating
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
        selectedGroups: actress.selectedGroups,
        generationData: actress.generationData,
        lineupData: updatedLineupData
      }

      console.log('Frontend: Adding actress to lineup with preserved data:', updateData)

      await masterDataApi.updateExtended('actress', actress.id, updateData, accessToken)
      
      console.log('Successfully added actress to lineup:', actress.name)
      
      // Reset form and reload data
      setSelectedActress('')
      setAssignmentData({ alias: '', profilePicture: '', photos: [] })
      setShowAssignmentForm(false)
      
      // Wait a bit for server to process the data, then reload
      setTimeout(async () => {
        await loadData()
      }, 1000)

    } catch (err) {
      console.error('Error assigning actress to lineup:', err)
      const errorMessage = err instanceof Error ? err.message : 'Gagal menambahkan aktris ke lineup'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveActress = async (actressId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus aktris dari lineup ini?')) {
      return
    }

    try {
      setLoading(true)
      setError(null) // Clear any previous errors
      
      const actress = actresses.find(a => a.id === actressId)
      if (!actress) {
        console.error('Actress not found:', actressId)
        setError('Aktris tidak ditemukan')
        return
      }

      console.log('=== REMOVING ACTRESS FROM LINEUP ===')
      console.log('Actress:', { id: actress.id, name: actress.name })
      console.log('Lineup ID:', lineupId)
      console.log('Current lineupData:', actress.lineupData)

      // Validate that actress is actually in this lineup
      if (!actress.lineupData || !actress.lineupData[lineupId]) {
        console.warn('Actress is not in this lineup:', {
          actressId: actress.id,
          actressName: actress.name,
          lineupId,
          hasLineupData: !!actress.lineupData,
          hasSpecificLineup: !!actress.lineupData?.[lineupId]
        })
        setError('Aktris tidak berada di lineup ini')
        return
      }

      // Remove lineup data while preserving ALL existing data
      const updatedLineupData = { ...(actress.lineupData || {}) }
      delete updatedLineupData[lineupId]

      console.log('Updated lineupData after removal:', updatedLineupData)

      // Preserve ALL existing actress data when updating
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
        selectedGroups: actress.selectedGroups,
        generationData: actress.generationData,
        lineupData: Object.keys(updatedLineupData).length > 0 ? updatedLineupData : undefined
      }

      console.log('Frontend: Removing actress from lineup with preserved data:', updateData)

      await masterDataApi.updateExtended('actress', actress.id, updateData, accessToken)
      
      console.log('Successfully removed actress from lineup:', actress.name)
      
      // Wait a bit for server to process the data, then reload
      setTimeout(async () => {
        await loadData()
      }, 1000)

    } catch (err) {
      console.error('Error removing actress from lineup:', err)
      const errorMessage = err instanceof Error ? err.message : 'Gagal menghapus aktris dari lineup'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateActressData = async (actressId: string, field: string, value: string | string[]) => {
    try {
      setError(null) // Clear any previous errors
      
      const actress = actresses.find(a => a.id === actressId)
      if (!actress) {
        console.error('Actress not found:', actressId)
        setError('Aktris tidak ditemukan')
        return
      }

      console.log('=== UPDATING ACTRESS LINEUP DATA ===')
      console.log('Actress:', { id: actress.id, name: actress.name })
      console.log('Lineup ID:', lineupId)
      console.log('Field:', field, 'Value:', value)

      // Validate that actress is in this lineup
      if (!actress.lineupData || !actress.lineupData[lineupId]) {
        console.warn('Actress is not in this lineup:', {
          actressId: actress.id,
          actressName: actress.name,
          lineupId,
          hasLineupData: !!actress.lineupData,
          hasSpecificLineup: !!actress.lineupData?.[lineupId]
        })
        setError('Aktris tidak berada di lineup ini')
        return
      }

      const updatedLineupData = {
        ...(actress.lineupData || {}), // Handle undefined lineupData
        [lineupId]: {
          ...(actress.lineupData?.[lineupId] || {}),
          [field]: value
        }
      }

      console.log('Updated lineupData after field update:', updatedLineupData)

      // Preserve ALL existing actress data when updating
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
        selectedGroups: actress.selectedGroups,
        generationData: actress.generationData,
        lineupData: updatedLineupData
      }

      console.log('Frontend: Updating actress lineup data with preserved data:', updateData)

      await masterDataApi.updateExtended('actress', actress.id, updateData, accessToken)
      
      console.log('Successfully updated actress lineup data:', actress.name)
      
      // Wait a bit for server to process the data, then reload
      setTimeout(async () => {
        await loadData()
      }, 1000)

    } catch (err) {
      console.error('Error updating actress lineup data:', err)
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengupdate data aktris'
      setError(errorMessage)
    }
  }

  const handleAddVersion = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    setVersionName('')
    setShowVersionDialog(true)
  }

  const handleSubmitVersion = async () => {
    try {
      setError(null)
      setIsCreatingVersion(true)

      if (!versionName.trim()) {
        setError('Version name is required')
        return
      }

      if (!lineupId) {
        setError('Lineup ID is required')
        return
      }

      if (!accessToken) {
        setError('Access token is required')
        return
      }

      // Create version for all actresses in this lineup
      const versionData = {
        photos: [],
        createdAt: new Date().toISOString(),
        description: `Version: ${versionName.trim()}`
      }

      // Update each actress with the new version
      for (const actress of actresses) {
        if (actress.lineupData && actress.lineupData[lineupId]) {
          const currentLineupData = actress.lineupData[lineupId]
          const updatedLineupData = {
            ...currentLineupData,
            photoVersions: {
              ...currentLineupData.photoVersions,
              [versionName.trim()]: versionData
            }
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
        }
      }

      await loadData()
      setVersionName('')
      setShowVersionDialog(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create version')
    } finally {
      setIsCreatingVersion(false)
    }
  }

  const handleDeleteVersionFromAll = async (versionName: string) => {
    if (!confirm(`Are you sure you want to delete version "${versionName}" from ALL actresses in this lineup? This action cannot be undone.`)) {
      return
    }

    try {
      setError(null)
      setIsDeletingVersion(true)

      if (!lineupId) {
        setError('Lineup ID is required')
        return
      }

      if (!accessToken) {
        setError('Access token is required')
        return
      }

      // Remove version from all actresses in this lineup
      for (const actress of actresses) {
        if (actress.lineupData && actress.lineupData[lineupId]) {
          const currentLineupData = actress.lineupData[lineupId]
          const updatedPhotoVersions = { ...currentLineupData.photoVersions }
          delete updatedPhotoVersions[versionName]

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
              [lineupId]: {
                ...currentLineupData,
                photoVersions: updatedPhotoVersions
              }
            }
          }

          await masterDataApi.updateExtended('actress', actress.id, updateData, accessToken)
        }
      }

      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete version')
    } finally {
      setIsDeletingVersion(false)
    }
  }

  const availableActresses = actresses.filter(actress => 
    !lineupActresses.some(la => la.actressId === actress.id)
  )

  if (loading && lineupActresses.length === 0) {
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
          <h2 className="text-2xl font-bold text-gray-900">Lineup Members</h2>
          <p className="text-gray-600">Kelola member untuk lineup "{lineupName}"</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={(e) => handleAddVersion(e)} disabled={loading} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add Version
          </Button>
          {(() => {
            // Get all available versions from lineup actresses
            const availableVersions = new Set<string>()
            lineupActresses.forEach(assignment => {
              const actress = actresses.find(a => a.id === assignment.actressId)
              if (actress?.lineupData?.[lineupId]?.photoVersions) {
                Object.keys(actress.lineupData[lineupId].photoVersions).forEach(version => availableVersions.add(version))
              }
            })
            
            const versionOptions = Array.from(availableVersions).sort()
            
            if (versionOptions.length > 0) {
              return (
                <Select onValueChange={handleDeleteVersionFromAll}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Delete Version" />
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
          <Button
            onClick={() => setShowAssignmentForm(true)}
            disabled={availableActresses.length === 0}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Tambah Member
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Assignment Form */}
      {showAssignmentForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Tambah Member ke Lineup</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pilih Aktris
              </label>
              <select
                value={selectedActress}
                onChange={(e) => setSelectedActress(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih aktris...</option>
                {availableActresses.map(actress => (
                  <option key={actress.id} value={actress.id}>
                    {actress.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alias di Lineup (Opsional)
              </label>
              <input
                type="text"
                value={assignmentData.alias}
                onChange={(e) => setAssignmentData({ ...assignmentData, alias: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nama panggung di lineup ini"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Foto Profil Lineup (Opsional)
              </label>
              <input
                type="url"
                value={assignmentData.profilePicture}
                onChange={(e) => setAssignmentData({ ...assignmentData, profilePicture: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="URL foto profil khusus untuk lineup ini"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleAssignActress}
                disabled={!selectedActress || loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Menambahkan...' : 'Tambahkan'}
              </button>
              <button
                onClick={() => {
                  setShowAssignmentForm(false)
                  setSelectedActress('')
                  setAssignmentData({ alias: '', profilePicture: '', photos: [] })
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lineup Members */}
      <div className="space-y-4">
        {lineupActresses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Belum ada member di lineup ini
          </div>
        ) : (
          lineupActresses.map((assignment) => (
            <div key={assignment.actressId} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                {/* Profile Picture */}
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                  {assignment.profilePicture ? (
                    <img
                      src={assignment.profilePicture}
                      alt={assignment.actressName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-600 text-lg font-medium">
                      {assignment.actressName.charAt(0)}
                    </span>
                  )}
                </div>

                {/* Actress Info */}
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {assignment.alias || assignment.actressName}
                    </h3>
                    {assignment.alias && (
                      <p className="text-sm text-gray-600">
                        Nama asli: {assignment.actressName}
                      </p>
                    )}
                  </div>

                  {/* Editable Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alias di Lineup
                      </label>
                      <input
                        type="text"
                        value={assignment.alias || ''}
                        onChange={(e) => handleUpdateActressData(assignment.actressId, 'alias', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nama panggung di lineup ini"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Foto Profil Lineup
                      </label>
                      <input
                        type="url"
                        value={assignment.profilePicture || ''}
                        onChange={(e) => handleUpdateActressData(assignment.actressId, 'profilePicture', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="URL foto profil khusus"
                      />
                    </div>
                  </div>

                  {/* Version Photo Input Fields */}
                  {(() => {
                    const actress = actresses.find(a => a.id === assignment.actressId)
                    const lineupData = actress?.lineupData?.[lineupId]
                    
                    if (lineupData?.photoVersions && Object.keys(lineupData.photoVersions).length > 0) {
                      return (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Version Photos</h4>
                          <div className="space-y-2">
                            {Object.keys(lineupData.photoVersions).map(versionName => (
                              <div key={versionName} className="flex items-center gap-2">
                                <Input
                                  value={lineupData.photoVersions[versionName].photos?.[0] || ''}
                                  onChange={(e) => {
                                    const updatedPhotoVersions = {
                                      ...lineupData.photoVersions,
                                      [versionName]: {
                                        ...lineupData.photoVersions[versionName],
                                        photos: e.target.value ? [e.target.value] : []
                                      }
                                    }
                                    handleUpdateActressData(assignment.actressId, 'photoVersions', updatedPhotoVersions)
                                  }}
                                  placeholder={`${versionName} photo URL...`}
                                  className="flex-1"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const updatedPhotoVersions = { ...lineupData.photoVersions }
                                    delete updatedPhotoVersions[versionName]
                                    handleUpdateActressData(assignment.actressId, 'photoVersions', updatedPhotoVersions)
                                  }}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title={`Delete version "${versionName}"`}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    }
                    return null
                  })()}

                  {/* Action Buttons */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleRemoveActress(assignment.actressId)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Hapus dari Lineup
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Version Dialog */}
      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Photo Version</DialogTitle>
            <DialogDescription>
              Create a new photo version for all actresses in this lineup. Each actress will get a new photo input field for this version.
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
