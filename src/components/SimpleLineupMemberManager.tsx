import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Plus, Trash2, Edit, Users, Loader2, X } from 'lucide-react'
import { MasterDataItem } from '../utils/masterDataApi'
import { masterDataApi } from '../utils/masterDataApi'

interface SimpleLineupMemberManagerProps {
  lineupId: string
  lineupName: string
  generationId: string
  accessToken: string
}

interface LineupMember {
  actressId: string
  actressName: string
  alias?: string
  profilePicture?: string
}

export function SimpleLineupMemberManager({ 
  lineupId, 
  lineupName, 
  generationId,
  accessToken 
}: SimpleLineupMemberManagerProps) {
  const [members, setMembers] = useState<LineupMember[]>([])
  const [availableActresses, setAvailableActresses] = useState<MasterDataItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedActress, setSelectedActress] = useState<string>('')
  const [memberAlias, setMemberAlias] = useState('')
  const [memberProfilePicture, setMemberProfilePicture] = useState('')

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
      
      setAvailableActresses(groupActresses)

      // Load lineup members
      const lineupMembers: LineupMember[] = []
      groupActresses.forEach(actress => {
        if (actress.lineupData && actress.lineupData[lineupId]) {
          const lineupData = actress.lineupData[lineupId]
          lineupMembers.push({
            actressId: actress.id,
            actressName: actress.name || '',
            alias: lineupData.alias,
            profilePicture: lineupData.profilePicture
          })
        }
      })
      
      setMembers(lineupMembers)

    } catch (err) {
      console.error('Error loading lineup member data:', err)
      setError('Gagal memuat data member lineup')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async () => {
    if (!selectedActress) return

    try {
      setLoading(true)
      
      const actress = availableActresses.find(a => a.id === selectedActress)
      if (!actress) return

      // Simple approach: just add the actress to lineup
      const updateData = {
        name: actress.name,
        lineupData: {
          ...actress.lineupData,
          [lineupId]: {
            alias: memberAlias || actress.name, // Use alias or default to English name
            profilePicture: memberProfilePicture || actress.profilePicture
          }
        }
      }

      await masterDataApi.updateExtended('actress', actress.id, updateData, accessToken)
      
      // Reset form and reload
      setSelectedActress('')
      setMemberAlias('')
      setMemberProfilePicture('')
      setShowAddDialog(false)
      await loadData()

    } catch (err) {
      console.error('Error adding member to lineup:', err)
      setError('Gagal menambahkan member ke lineup')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (actressId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus member ini dari lineup?')) {
      return
    }

    try {
      setLoading(true)
      
      const actress = availableActresses.find(a => a.id === actressId)
      if (!actress) return

      // Simple approach: remove the lineup from actress data
      const updatedLineupData = { ...actress.lineupData }
      delete updatedLineupData[lineupId]

      const updateData = {
        name: actress.name,
        lineupData: updatedLineupData
      }

      await masterDataApi.updateExtended('actress', actressId, updateData, accessToken)
      await loadData()

    } catch (err) {
      console.error('Error removing member from lineup:', err)
      setError('Gagal menghapus member dari lineup')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateMember = async (actressId: string, field: 'alias' | 'profilePicture', value: string) => {
    try {
      const actress = availableActresses.find(a => a.id === actressId)
      if (!actress) return

      const updatedLineupData = {
        ...actress.lineupData,
        [lineupId]: {
          ...actress.lineupData?.[lineupId],
          [field]: value
        }
      }

      const updateData = {
        name: actress.name,
        lineupData: updatedLineupData
      }

      await masterDataApi.updateExtended('actress', actressId, updateData, accessToken)
      await loadData()

    } catch (err) {
      console.error('Error updating member:', err)
      setError('Gagal mengupdate member')
    }
  }

  const availableActressesForAdd = availableActresses.filter(actress => 
    !members.some(member => member.actressId === actress.id)
  )

  if (loading && members.length === 0) {
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
        <Button
          onClick={() => setShowAddDialog(true)}
          disabled={availableActressesForAdd.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Member
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Add Member Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Member ke Lineup</DialogTitle>
            <DialogDescription>
              Pilih aktris yang ingin ditambahkan ke lineup "{lineupName}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="actress">Pilih Aktris</Label>
              <select
                id="actress"
                value={selectedActress}
                onChange={(e) => {
                  setSelectedActress(e.target.value)
                  const actress = availableActresses.find(a => a.id === e.target.value)
                  if (actress) {
                    setMemberAlias(actress.name || '')
                    setMemberProfilePicture(actress.profilePicture || '')
                  }
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih aktris...</option>
                {availableActressesForAdd.map(actress => (
                  <option key={actress.id} value={actress.id}>
                    {actress.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="alias">Alias di Lineup (Opsional)</Label>
              <Input
                id="alias"
                value={memberAlias}
                onChange={(e) => setMemberAlias(e.target.value)}
                placeholder="Nama panggung di lineup ini"
              />
            </div>

            <div>
              <Label htmlFor="profilePicture">Foto Profil Lineup (Opsional)</Label>
              <Input
                id="profilePicture"
                value={memberProfilePicture}
                onChange={(e) => setMemberProfilePicture(e.target.value)}
                placeholder="URL foto profil khusus untuk lineup ini"
              />
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleAddMember}
                disabled={!selectedActress || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menambahkan...
                  </>
                ) : (
                  'Tambahkan'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false)
                  setSelectedActress('')
                  setMemberAlias('')
                  setMemberProfilePicture('')
                }}
              >
                Batal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Members List */}
      <div className="space-y-4">
        {members.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Belum ada member di lineup ini
          </div>
        ) : (
          members.map((member) => (
            <div key={member.actressId} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                {/* Profile Picture */}
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                  {member.profilePicture ? (
                    <img
                      src={member.profilePicture}
                      alt={member.actressName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-600 text-lg font-medium">
                      {member.actressName.charAt(0)}
                    </span>
                  )}
                </div>

                {/* Member Info */}
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {member.alias || member.actressName}
                    </h3>
                    {member.alias && (
                      <p className="text-sm text-gray-600">
                        Nama asli: {member.actressName}
                      </p>
                    )}
                  </div>

                  {/* Editable Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`alias-${member.actressId}`}>Alias di Lineup</Label>
                      <Input
                        id={`alias-${member.actressId}`}
                        value={member.alias || ''}
                        onChange={(e) => handleUpdateMember(member.actressId, 'alias', e.target.value)}
                        placeholder="Nama panggung di lineup ini"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`profile-${member.actressId}`}>Foto Profil Lineup</Label>
                      <Input
                        id={`profile-${member.actressId}`}
                        value={member.profilePicture || ''}
                        onChange={(e) => handleUpdateMember(member.actressId, 'profilePicture', e.target.value)}
                        placeholder="URL foto profil khusus"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveMember(member.actressId)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Hapus dari Lineup
                    </Button>
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
