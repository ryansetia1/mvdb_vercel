import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { 
  Plus, 
  Trash2, 
  Edit, 
  Users, 
  Loader2, 
  X, 
  Search,
  Filter,
  Grid3X3,
  List,
  Star,
  Heart,
  Crown,
  Sparkles,
  ArrowUpDown,
  MoreVertical,
  CheckCircle,
  XCircle,
  DragHandleDots2Icon,
  GripVertical,
  Move,
  Save,
  RotateCcw
} from 'lucide-react'
import { MasterDataItem } from '../utils/masterDataApi'
import { masterDataApi } from '../utils/masterDataApi'
import { simpleLineupApi, SimpleLineup, SimpleLineupMember } from '../utils/simpleLineupApi'

interface LineupBuilderProps {
  generationId: string
  generationName: string
  groupId: string
  accessToken: string
}

interface DraggableMember {
  id: string
  actressId: string
  actressName: string
  alias?: string
  profilePicture?: string
  isDragging?: boolean
}

interface LineupSlot {
  id: string
  position: number
  member?: DraggableMember
}

export function LineupBuilder({ 
  generationId, 
  generationName, 
  groupId,
  accessToken 
}: LineupBuilderProps) {
  const [lineups, setLineups] = useState<SimpleLineup[]>([])
  const [actresses, setActresses] = useState<MasterDataItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLineup, setSelectedLineup] = useState<SimpleLineup | null>(null)
  const [availableMembers, setAvailableMembers] = useState<DraggableMember[]>([])
  const [lineupSlots, setLineupSlots] = useState<LineupSlot[]>([])
  const [draggedMember, setDraggedMember] = useState<DraggableMember | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'Main',
    order: 1,
    maxMembers: 12
  })

  const lineupTypes = [
    { value: 'Main', label: 'Main Lineup', icon: Crown, color: 'text-yellow-500' },
    { value: 'Sub', label: 'Sub Lineup', icon: Star, color: 'text-blue-500' },
    { value: 'Graduated', label: 'Graduated', icon: Heart, color: 'text-red-500' },
    { value: 'Trainee', label: 'Trainee', icon: Sparkles, color: 'text-green-500' },
    { value: 'Special', label: 'Special', icon: Users, color: 'text-purple-500' }
  ]

  useEffect(() => {
    loadData()
  }, [generationId])

  useEffect(() => {
    if (selectedLineup) {
      initializeLineupBuilder()
    }
  }, [selectedLineup, actresses])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

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

  const initializeLineupBuilder = () => {
    if (!selectedLineup) return

    // Create lineup slots
    const slots: LineupSlot[] = []
    for (let i = 0; i < selectedLineup.members.length || 12; i++) {
      slots.push({
        id: `slot-${i}`,
        position: i,
        member: selectedLineup.members[i] ? {
          id: `member-${selectedLineup.members[i].actressId}`,
          actressId: selectedLineup.members[i].actressId,
          actressName: selectedLineup.members[i].actressName,
          alias: selectedLineup.members[i].alias,
          profilePicture: selectedLineup.members[i].profilePicture
        } : undefined
      })
    }
    setLineupSlots(slots)

    // Create available members list
    const available = actresses
      .filter(actress => !selectedLineup.members.some(member => member.actressId === actress.id))
      .map(actress => ({
        id: `available-${actress.id}`,
        actressId: actress.id,
        actressName: actress.name || '',
        alias: actress.alias,
        profilePicture: actress.profilePicture
      }))
    setAvailableMembers(available)
  }

  const handleCreateLineup = async () => {
    try {
      setLoading(true)
      
      if (!formData.name.trim()) {
        setError('Nama lineup harus diisi')
        return
      }

      const newLineup = await simpleLineupApi.createLineup(
        formData.name, 
        formData.type, 
        formData.order, 
        generationId, 
        generationName, 
        accessToken
      )

      setFormData({ name: '', type: 'Main', order: 1, maxMembers: 12 })
      setShowCreateDialog(false)
      await loadData()
      
      // Select the newly created lineup
      const updatedLineups = await simpleLineupApi.getLineupsForGeneration(generationId, accessToken)
      const lineup = updatedLineups.find(l => l.id === newLineup.id)
      if (lineup) {
        setSelectedLineup(lineup)
      }

    } catch (err) {
      console.error('Error creating lineup:', err)
      setError('Gagal membuat lineup')
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (e: React.DragEvent, member: DraggableMember) => {
    setDraggedMember(member)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, slot: LineupSlot) => {
    e.preventDefault()
    
    if (!draggedMember || !selectedLineup) return

    try {
      // Remove member from current position
      const updatedSlots = lineupSlots.map(s => 
        s.id === slot.id 
          ? { ...s, member: draggedMember }
          : { ...s, member: s.member?.id === draggedMember.id ? undefined : s.member }
      )

      // Update available members
      const updatedAvailable = availableMembers.filter(m => m.id !== draggedMember.id)
      
      // If slot had a member, add it back to available
      if (slot.member) {
        updatedAvailable.push(slot.member)
      }

      setLineupSlots(updatedSlots)
      setAvailableMembers(updatedAvailable)

      // Update lineup data
      const lineupMembers = updatedSlots
        .filter(s => s.member)
        .map(s => ({
          actressId: s.member!.actressId,
          actressName: s.member!.actressName,
          alias: s.member!.alias,
          profilePicture: s.member!.profilePicture
        }))

      // Update actress lineup data
      for (const member of lineupMembers) {
        await simpleLineupApi.addActressToLineup(
          member.actressId,
          selectedLineup.id,
          member.alias,
          member.profilePicture,
          accessToken
        )
      }

      // Remove actresses that are no longer in lineup
      const removedActresses = actresses.filter(actress => 
        !lineupMembers.some(member => member.actressId === actress.id) &&
        selectedLineup.members.some(member => member.actressId === actress.id)
      )

      for (const actress of removedActresses) {
        await simpleLineupApi.removeActressFromLineup(
          actress.id,
          selectedLineup.id,
          accessToken
        )
      }

    } catch (err) {
      console.error('Error updating lineup:', err)
      setError('Gagal mengupdate lineup')
    } finally {
      setDraggedMember(null)
    }
  }

  const handleRemoveMember = async (member: DraggableMember) => {
    if (!selectedLineup) return

    try {
      await simpleLineupApi.removeActressFromLineup(
        member.actressId,
        selectedLineup.id,
        accessToken
      )

      // Update local state
      const updatedSlots = lineupSlots.map(slot => 
        slot.member?.id === member.id ? { ...slot, member: undefined } : slot
      )
      setLineupSlots(updatedSlots)

      const updatedAvailable = [...availableMembers, member]
      setAvailableMembers(updatedAvailable)

    } catch (err) {
      console.error('Error removing member:', err)
      setError('Gagal menghapus member')
    }
  }

  const getLineupIcon = (type: string) => {
    switch (type) {
      case 'Main': return <Crown className="h-5 w-5 text-yellow-500" />
      case 'Sub': return <Star className="h-5 w-5 text-blue-500" />
      case 'Graduated': return <Heart className="h-5 w-5 text-red-500" />
      case 'Trainee': return <Sparkles className="h-5 w-5 text-green-500" />
      default: return <Users className="h-5 w-5 text-gray-500" />
    }
  }

  if (loading && lineups.length === 0) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat lineup builder...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Move className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Lineup Builder</h1>
              <p className="text-gray-600">Drag & drop untuk membangun lineup {generationName}</p>
            </div>
          </div>

          {/* Lineup Selector */}
          <div className="flex items-center space-x-4 mb-6">
            <Label className="text-sm font-medium">Pilih Lineup:</Label>
            <select
              value={selectedLineup?.id || ''}
              onChange={(e) => {
                const lineup = lineups.find(l => l.id === e.target.value)
                setSelectedLineup(lineup || null)
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih lineup...</option>
              {lineups.map(lineup => (
                <option key={lineup.id} value={lineup.id}>
                  {lineup.name} ({lineup.type})
                </option>
              ))}
            </select>
            
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Buat Lineup Baru
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Lineup Builder */}
        {selectedLineup ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lineup Slots */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center space-x-2">
                    {getLineupIcon(selectedLineup.type)}
                    <span>{selectedLineup.name}</span>
                  </h3>
                  <div className="text-sm text-gray-500">
                    {lineupSlots.filter(s => s.member).length} / {lineupSlots.length} members
                  </div>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {lineupSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`aspect-square border-2 border-dashed rounded-xl flex items-center justify-center transition-all duration-200 ${
                        slot.member 
                          ? 'border-blue-300 bg-blue-50' 
                          : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, slot)}
                    >
                      {slot.member ? (
                        <div className="relative group">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center overflow-hidden">
                            {slot.member.profilePicture ? (
                              <img
                                src={slot.member.profilePicture}
                                alt={slot.member.actressName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white text-sm font-medium">
                                {slot.member.actressName?.charAt(0)}
                              </span>
                            )}
                          </div>
                          
                          <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleRemoveMember(slot.member!)}
                              className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b-xl">
                            <p className="truncate">{slot.member.alias || slot.member.actressName}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="w-8 h-8 border-2 border-gray-300 rounded-full flex items-center justify-center mb-2">
                            <Plus className="h-4 w-4 text-gray-400" />
                          </div>
                          <span className="text-xs text-gray-500">Slot {slot.position + 1}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Available Members */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                  <Users className="h-5 w-5 text-green-500" />
                  <span>Available Members</span>
                </h3>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {availableMembers.map((member) => (
                    <div
                      key={member.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, member)}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-move transition-colors"
                    >
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center overflow-hidden">
                        {member.profilePicture ? (
                          <img
                            src={member.profilePicture}
                            alt={member.actressName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white text-xs font-medium">
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
                  ))}
                </div>

                {availableMembers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Semua member sudah di lineup</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Move className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Pilih Lineup untuk Diedit</h3>
            <p className="text-gray-600 mb-6">Pilih lineup dari dropdown di atas atau buat lineup baru</p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Buat Lineup Pertama
            </Button>
          </div>
        )}

        {/* Create Lineup Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <span>Buat Lineup Baru</span>
              </DialogTitle>
              <DialogDescription>
                Buat lineup baru untuk {generationName}
              </DialogDescription>
            </DialogHeader>

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
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {lineupTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                <div>
                  <Label htmlFor="maxMembers">Max Members</Label>
                  <Input
                    id="maxMembers"
                    type="number"
                    value={formData.maxMembers}
                    onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) })}
                    min="1"
                    max="20"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleCreateLineup}
                  disabled={!formData.name.trim() || loading}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Membuat...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Buat Lineup
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Batal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
