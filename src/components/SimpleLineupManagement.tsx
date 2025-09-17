import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Plus, Trash2, Edit, Users, Loader2, X } from 'lucide-react'
import { MasterDataItem } from '../utils/masterDataApi'
import { masterDataApi } from '../utils/masterDataApi'
import { simpleLineupApi, SimpleLineup, SimpleLineupMember } from '../utils/simpleLineupApi'

interface SimpleLineupManagementProps {
  generationId: string
  generationName: string
  groupId: string
  accessToken: string
}

// Using types from simpleLineupApi

export function SimpleLineupManagement({ 
  generationId, 
  generationName, 
  groupId,
  accessToken 
}: SimpleLineupManagementProps) {
  const [lineups, setLineups] = useState<SimpleLineup[]>([])
  const [actresses, setActresses] = useState<MasterDataItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingLineup, setEditingLineup] = useState<SimpleLineup | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'Main',
    order: 1
  })

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

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load actresses and lineups using the new API
      const [lineupsData, actressesData] = await Promise.all([
        simpleLineupApi.getLineupsForGeneration(generationId, accessToken),
        simpleLineupApi.getAvailableActresses(generationId, accessToken)
      ])

      setLineups(lineupsData)
      setActresses(actressesData)

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
      
      if (!formData.name.trim()) {
        setError('Nama lineup harus diisi')
        return
      }

      if (editingLineup) {
        // Update existing lineup
        await simpleLineupApi.updateLineup(
          editingLineup.id, 
          formData.name, 
          formData.type, 
          formData.order, 
          accessToken
        )
      } else {
        // Create new lineup
        await simpleLineupApi.createLineup(
          formData.name, 
          formData.type, 
          formData.order, 
          generationId, 
          generationName, 
          accessToken
        )
      }

      // Reset form and reload
      setFormData({ name: '', type: 'Main', order: 1 })
      setShowForm(false)
      setEditingLineup(null)
      await loadData()

    } catch (err) {
      console.error('Error saving lineup:', err)
      setError('Gagal menyimpan lineup')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLineup = async (lineupId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus lineup ini?')) {
      return
    }

    try {
      setLoading(true)
      
      // First, remove all actresses from this lineup
      const lineup = lineups.find(l => l.id === lineupId)
      if (lineup) {
        for (const member of lineup.members) {
          await simpleLineupApi.removeActressFromLineup(member.actressId, lineupId, accessToken)
        }
      }

      // Then delete the lineup itself
      await simpleLineupApi.deleteLineup(lineupId, accessToken)
      
      await loadData()

    } catch (err) {
      console.error('Error deleting lineup:', err)
      setError('Gagal menghapus lineup')
    } finally {
      setLoading(false)
    }
  }

  const addActressToLineup = async (actressId: string, lineupId: string) => {
    try {
      const actress = actresses.find(a => a.id === actressId)
      if (!actress) return

      await simpleLineupApi.addActressToLineup(
        actressId, 
        lineupId, 
        actress.name, // Default to English name
        actress.profilePicture,
        accessToken
      )
      
      await loadData()

    } catch (err) {
      console.error('Error adding actress to lineup:', err)
      setError('Gagal menambahkan aktris ke lineup')
    }
  }

  const removeActressFromLineup = async (actressId: string, lineupId: string) => {
    try {
      await simpleLineupApi.removeActressFromLineup(actressId, lineupId, accessToken)
      await loadData()

    } catch (err) {
      console.error('Error removing actress from lineup:', err)
      setError('Gagal menghapus aktris dari lineup')
    }
  }

  const handleEdit = (lineup: SimpleLineup) => {
    setFormData({
      name: lineup.name,
      type: lineup.type,
      order: lineup.order
    })
    setEditingLineup(lineup)
    setShowForm(true)
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
          <h2 className="text-2xl font-bold text-gray-900">Simple Lineup Management</h2>
          <p className="text-gray-600">Kelola lineup untuk {generationName}</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
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
              <Label htmlFor="name">Nama Lineup</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Masukkan nama lineup"
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Tipe Lineup</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {lineupTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="order">Urutan Tampil</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                min="1"
                required
              />
            </div>

            <div className="flex space-x-3">
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  editingLineup ? 'Update' : 'Simpan'
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowForm(false)
                  setEditingLineup(null)
                  setFormData({ name: '', type: 'Main', order: 1 })
                }}
              >
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lineups List */}
      <div className="space-y-4">
        {lineups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Belum ada lineup
          </div>
        ) : (
          lineups.map((lineup) => (
            <div key={lineup.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{lineup.name}</h3>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {lineup.type}
                    </span>
                    <span className="text-sm text-gray-500">Urutan: {lineup.order}</span>
                    <span className="text-sm text-gray-500">{lineup.members.length} member</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(lineup)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteLineup(lineup.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Hapus
                  </Button>
                </div>
              </div>

              {/* Members Section */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Members:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {lineup.members.map((member) => (
                    <div key={member.actressId} className="space-y-3 p-4 bg-gray-50 rounded-lg relative">
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          removeActressFromLineup(member.actressId, lineup.id)
                        }}
                        className="absolute top-2 right-2 text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        title="Hapus dari lineup"
                      >
                        Hapus
                      </button>
                      
                      {/* Member Info */}
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                          {member.profilePicture ? (
                            <img
                              src={member.profilePicture}
                              alt={member.actressName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-600 text-sm font-medium">
                              {member.actressName?.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {member.alias || member.actressName}
                          </p>
                          {member.alias && (
                            <p className="text-xs text-gray-500 truncate">
                              {member.actressName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Member Section */}
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Tambah Member:</h5>
                  <div className="flex flex-wrap gap-2">
                    {actresses
                      .filter(actress => !lineup.members.some(member => member.actressId === actress.id))
                      .map((actress) => (
                        <Button
                          key={actress.id}
                          variant="outline"
                          size="sm"
                          onClick={() => addActressToLineup(actress.id, lineup.id)}
                          className="text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {actress.name}
                        </Button>
                      ))}
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
