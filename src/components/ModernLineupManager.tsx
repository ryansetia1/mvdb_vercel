import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
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
  XCircle
} from 'lucide-react'
import { MasterDataItem } from '../utils/masterDataApi'
import { masterDataApi } from '../utils/masterDataApi'
import { simpleLineupApi, SimpleLineup, SimpleLineupMember } from '../utils/simpleLineupApi'

interface ModernLineupManagerProps {
  generationId: string
  generationName: string
  groupId: string
  accessToken: string
}

interface LineupCardProps {
  lineup: SimpleLineup
  onEdit: (lineup: SimpleLineup) => void
  onDelete: (lineupId: string) => void
  onAddMember: (lineupId: string) => void
  onRemoveMember: (lineupId: string, actressId: string) => void
  availableActresses: MasterDataItem[]
  accessToken: string
}

const LineupCard: React.FC<LineupCardProps> = ({
  lineup,
  onEdit,
  onDelete,
  onAddMember,
  onRemoveMember,
  availableActresses,
  accessToken
}) => {
  const [showMemberDialog, setShowMemberDialog] = useState(false)
  const [selectedActress, setSelectedActress] = useState<string>('')
  const [memberAlias, setMemberAlias] = useState('')
  const [memberProfilePicture, setMemberProfilePicture] = useState('')

  const handleAddMember = async () => {
    if (!selectedActress) return

    try {
      const actress = availableActresses.find(a => a.id === selectedActress)
      if (!actress) return

      await simpleLineupApi.addActressToLineup(
        actress.id,
        lineup.id,
        memberAlias || actress.name,
        memberProfilePicture || actress.profilePicture,
        accessToken
      )

      setSelectedActress('')
      setMemberAlias('')
      setMemberProfilePicture('')
      setShowMemberDialog(false)
      
      // Reload will be handled by parent
      window.location.reload()
    } catch (err) {
      console.error('Error adding member:', err)
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

  const getLineupColor = (type: string) => {
    switch (type) {
      case 'Main': return 'bg-gradient-to-r from-yellow-400 to-orange-500'
      case 'Sub': return 'bg-gradient-to-r from-blue-400 to-cyan-500'
      case 'Graduated': return 'bg-gradient-to-r from-red-400 to-pink-500'
      case 'Trainee': return 'bg-gradient-to-r from-green-400 to-emerald-500'
      default: return 'bg-gradient-to-r from-gray-400 to-gray-500'
    }
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        {/* Header dengan gradient */}
        <div className={`${getLineupColor(lineup.type)} p-6 text-white relative`}>
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              {getLineupIcon(lineup.type)}
              <div>
                <h3 className="text-xl font-bold">{lineup.name}</h3>
                <p className="text-white/80 text-sm">{lineup.type} Lineup</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(lineup)}
                className="text-white hover:bg-white/20"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(lineup.id)}
                className="text-white hover:bg-white/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="mt-4 flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span className="text-sm">{lineup.members.length} Members</span>
            </div>
            <div className="flex items-center space-x-1">
              <ArrowUpDown className="h-4 w-4" />
              <span className="text-sm">Order: {lineup.order}</span>
            </div>
          </div>
        </div>

        {/* Members Grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            {lineup.members.map((member) => (
              <div key={member.actressId} className="group relative">
                <div className="bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center overflow-hidden">
                      {member.profilePicture ? (
                        <img
                          src={member.profilePicture}
                          alt={member.actressName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-sm font-medium">
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
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => onRemoveMember(lineup.id, member.actressId)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    title="Hapus dari lineup"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Member Button */}
          <Button
            onClick={() => setShowMemberDialog(true)}
            variant="outline"
            className="w-full border-dashed border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Member
          </Button>
        </div>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={showMemberDialog} onOpenChange={setShowMemberDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-blue-500" />
              <span>Tambah Member ke {lineup.name}</span>
            </DialogTitle>
            <DialogDescription>
              Pilih aktris yang ingin ditambahkan ke lineup ini
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
                {availableActresses
                  .filter(actress => !lineup.members.some(member => member.actressId === actress.id))
                  .map(actress => (
                    <option key={actress.id} value={actress.id}>
                      {actress.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <Label htmlFor="alias">Alias di Lineup</Label>
              <Input
                id="alias"
                value={memberAlias}
                onChange={(e) => setMemberAlias(e.target.value)}
                placeholder="Nama panggung di lineup ini"
              />
            </div>

            <div>
              <Label htmlFor="profilePicture">Foto Profil Lineup</Label>
              <Input
                id="profilePicture"
                value={memberProfilePicture}
                onChange={(e) => setMemberProfilePicture(e.target.value)}
                placeholder="URL foto profil khusus"
              />
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleAddMember}
                disabled={!selectedActress}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Tambahkan
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowMemberDialog(false)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Batal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function ModernLineupManager({ 
  generationId, 
  generationName, 
  groupId,
  accessToken 
}: ModernLineupManagerProps) {
  const [lineups, setLineups] = useState<SimpleLineup[]>([])
  const [actresses, setActresses] = useState<MasterDataItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingLineup, setEditingLineup] = useState<SimpleLineup | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [formData, setFormData] = useState({
    name: '',
    type: 'Main',
    order: 1
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

  const handleSubmit = async () => {
    try {
      setLoading(true)
      
      if (!formData.name.trim()) {
        setError('Nama lineup harus diisi')
        return
      }

      if (editingLineup) {
        await simpleLineupApi.updateLineup(
          editingLineup.id, 
          formData.name, 
          formData.type, 
          formData.order, 
          accessToken
        )
      } else {
        await simpleLineupApi.createLineup(
          formData.name, 
          formData.type, 
          formData.order, 
          generationId, 
          generationName, 
          accessToken
        )
      }

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
      
      const lineup = lineups.find(l => l.id === lineupId)
      if (lineup) {
        for (const member of lineup.members) {
          await simpleLineupApi.removeActressFromLineup(member.actressId, lineupId, accessToken)
        }
      }

      await simpleLineupApi.deleteLineup(lineupId, accessToken)
      await loadData()

    } catch (err) {
      console.error('Error deleting lineup:', err)
      setError('Gagal menghapus lineup')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (lineupId: string, actressId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus member ini dari lineup?')) {
      return
    }

    try {
      await simpleLineupApi.removeActressFromLineup(actressId, lineupId, accessToken)
      await loadData()
    } catch (err) {
      console.error('Error removing member:', err)
      setError('Gagal menghapus member dari lineup')
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

  const filteredLineups = lineups.filter(lineup => {
    const matchesSearch = lineup.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || lineup.type === filterType
    return matchesSearch && matchesFilter
  })

  if (loading && lineups.length === 0) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat lineup...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Lineup Manager</h1>
              <p className="text-gray-600">Kelola lineup untuk {generationName}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari lineup..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              {/* Filter */}
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  {lineupTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-3">
              {/* View Mode */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Add Lineup */}
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Buat Lineup Baru
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Lineup Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
            <h3 className="text-2xl font-bold mb-6 flex items-center space-x-2">
              <Sparkles className="h-6 w-6 text-blue-500" />
              <span>{editingLineup ? 'Edit Lineup' : 'Buat Lineup Baru'}</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        <div className="flex items-center space-x-2">
                          <type.icon className={`h-4 w-4 ${type.color}`} />
                          <span>{type.label}</span>
                        </div>
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
            </div>

            <div className="flex space-x-3 mt-6">
              <Button 
                onClick={handleSubmit} 
                disabled={loading}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {editingLineup ? 'Update Lineup' : 'Buat Lineup'}
                  </>
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
                <XCircle className="h-4 w-4 mr-2" />
                Batal
              </Button>
            </div>
          </div>
        )}

        {/* Lineups Grid/List */}
        <div className="space-y-6">
          {filteredLineups.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum ada lineup</h3>
              <p className="text-gray-600 mb-6">Mulai dengan membuat lineup pertama Anda</p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Buat Lineup Pertama
              </Button>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "space-y-4"
            }>
              {filteredLineups.map((lineup) => (
                <LineupCard
                  key={lineup.id}
                  lineup={lineup}
                  onEdit={handleEdit}
                  onDelete={handleDeleteLineup}
                  onAddMember={() => {}}
                  onRemoveMember={handleRemoveMember}
                  availableActresses={actresses}
                  accessToken={accessToken}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
