import React, { useState, useEffect } from 'react'
import { MasterDataItem } from '../utils/masterDataApi'
import { masterDataApi } from '../utils/masterDataApi'

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

  useEffect(() => {
    loadData()
  }, [lineupId, generationId])

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
      
      const actress = actresses.find(a => a.id === selectedActress)
      if (!actress) return

      // Update actress lineup data while preserving ALL existing data
      const updatedLineupData = {
        ...actress.lineupData,
        [lineupId]: {
          alias: assignmentData.alias || undefined,
          profilePicture: assignmentData.profilePicture || undefined,
          photos: assignmentData.photos.length > 0 ? assignmentData.photos : undefined
        }
      }

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
      setError('Gagal menambahkan aktris ke lineup')
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
      
      const actress = actresses.find(a => a.id === actressId)
      if (!actress) return

      // Remove lineup data while preserving ALL existing data
      const updatedLineupData = { ...actress.lineupData }
      delete updatedLineupData[lineupId]

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
      
      // Wait a bit for server to process the data, then reload
      setTimeout(async () => {
        await loadData()
      }, 1000)

    } catch (err) {
      console.error('Error removing actress from lineup:', err)
      setError('Gagal menghapus aktris dari lineup')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateActressData = async (actressId: string, field: string, value: string | string[]) => {
    try {
      const actress = actresses.find(a => a.id === actressId)
      if (!actress) return

      const updatedLineupData = {
        ...actress.lineupData,
        [lineupId]: {
          ...actress.lineupData?.[lineupId],
          [field]: value
        }
      }

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
      
      // Wait a bit for server to process the data, then reload
      setTimeout(async () => {
        await loadData()
      }, 1000)

    } catch (err) {
      console.error('Error updating actress lineup data:', err)
      setError('Gagal mengupdate data aktris')
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
        <button
          onClick={() => setShowAssignmentForm(true)}
          disabled={availableActresses.length === 0}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Tambah Member
        </button>
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
    </div>
  )
}
