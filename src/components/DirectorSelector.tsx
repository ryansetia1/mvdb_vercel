import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Plus, Search, User, Users, Trash2, Edit, Check, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { MasterDataItem, masterDataApi } from '../utils/masterDataApi'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

interface DirectorSelectorProps {
  accessToken: string
  directors: MasterDataItem[]
  onDirectorAdd: (director: MasterDataItem) => void
  onDirectorDelete: (id: string) => void
  onDirectorUpdate?: (director: MasterDataItem) => void
}

export function DirectorSelector({ 
  accessToken, 
  directors, 
  onDirectorAdd, 
  onDirectorDelete,
  onDirectorUpdate 
}: DirectorSelectorProps) {
  const [actors, setActors] = useState<MasterDataItem[]>([])
  const [actresses, setActresses] = useState<MasterDataItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [newDirectorName, setNewDirectorName] = useState('')
  const [newDirectorJpName, setNewDirectorJpName] = useState('')
  const [newDirectorKanjiName, setNewDirectorKanjiName] = useState('')
  const [newDirectorKanaName, setNewDirectorKanaName] = useState('')
  const [selectedPersonId, setSelectedPersonId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingJpName, setEditingJpName] = useState('')
  const [editingKanjiName, setEditingKanjiName] = useState('')
  const [editingKanaName, setEditingKanaName] = useState('')

  // Load actors and actresses when component mounts
  useEffect(() => {
    loadPersons()
  }, [])

  const loadPersons = async () => {
    setIsLoading(true)
    try {
      const [actorsData, actressesData] = await Promise.all([
        masterDataApi.getByType('actor', accessToken),
        masterDataApi.getByType('actress', accessToken)
      ])
      setActors(actorsData)
      setActresses(actressesData)
    } catch (error: any) {
      setError(`Gagal memuat data: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Combine and filter actors/actresses for selection
  const allPersons = [...actors, ...actresses].filter(person => {
    if (!searchTerm) return true
    const nameMatch = person.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const jpnameMatch = person.jpname?.toLowerCase().includes(searchTerm.toLowerCase())
    return nameMatch || jpnameMatch
  })

  const handleAddFromExisting = async () => {
    if (!selectedPersonId) return

    const selectedPerson = allPersons.find(p => p.id === selectedPersonId)
    if (!selectedPerson) return

    try {
      // Create a director entry using the selected person's data including all relevant fields
      const directorData: Partial<MasterDataItem> = {
        name: selectedPerson.name || '',
        jpname: selectedPerson.jpname || undefined,
        kanjiName: selectedPerson.kanjiName || undefined,
        kanaName: selectedPerson.kanaName || undefined,
        profilePicture: selectedPerson.profilePicture || undefined,
        birthdate: selectedPerson.birthdate || undefined,
        alias: selectedPerson.alias || undefined,
        photo: selectedPerson.photo || undefined,
        links: selectedPerson.links || undefined,
        tags: selectedPerson.tags || undefined
      }
      
      const newDirector = await masterDataApi.createExtended('director', directorData, accessToken)
      onDirectorAdd(newDirector)
      setSelectedPersonId('')
      setError('')
    } catch (error: any) {
      setError(`Gagal menambah director: ${error.message}`)
    }
  }

  const handleAddNewDirector = async () => {
    const name = newDirectorName.trim()
    if (!name) return

    try {
      // Use createExtended to include jpname, kanjiName, and kanaName if provided
      const directorData: Partial<MasterDataItem> = {
        name,
        jpname: newDirectorJpName.trim() || undefined,
        kanjiName: newDirectorKanjiName.trim() || undefined,
        kanaName: newDirectorKanaName.trim() || undefined
      }
      
      const newDirector = await masterDataApi.createExtended('director', directorData, accessToken)
      onDirectorAdd(newDirector)
      setNewDirectorName('')
      setNewDirectorJpName('')
      setNewDirectorKanjiName('')
      setNewDirectorKanaName('')
      setError('')
    } catch (error: any) {
      setError(`Gagal menambah director: ${error.message}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus director ini?')) return

    try {
      await masterDataApi.delete('director', id, accessToken)
      onDirectorDelete(id)
      setError('')
    } catch (error: any) {
      setError(`Gagal menghapus director: ${error.message}`)
    }
  }

  const handleEditStart = (director: MasterDataItem) => {
    setEditingId(director.id)
    setEditingName(director.name || '')
    setEditingJpName(director.jpname || '')
    setEditingKanjiName(director.kanjiName || '')
    setEditingKanaName(director.kanaName || '')
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditingName('')
    setEditingJpName('')
    setEditingKanjiName('')
    setEditingKanaName('')
  }

  const handleEditSave = async (id: string) => {
    const name = editingName.trim()
    if (!name) return

    try {
      const updatedDirector = await masterDataApi.updateExtended(
        'director', 
        id, 
        { 
          name, 
          jpname: editingJpName.trim() || undefined,
          kanjiName: editingKanjiName.trim() || undefined,
          kanaName: editingKanaName.trim() || undefined
        }, 
        accessToken
      )
      
      if (onDirectorUpdate) {
        onDirectorUpdate(updatedDirector)
      }
      
      setEditingId(null)
      setEditingName('')
      setEditingJpName('')
      setEditingKanjiName('')
      setEditingKanaName('')
      setError('')
    } catch (error: any) {
      setError(`Gagal mengupdate director: ${error.message}`)
    }
  }

  // Check if director was created from cast (by checking if name exists in actors/actresses)
  const isDirectorFromCast = (director: MasterDataItem) => {
    const allPersons = [...actors, ...actresses]
    return allPersons.some(person => 
      person.name === director.name && person.jpname === director.jpname
    )
  }

  const handleKeyPress = (e: React.KeyboardEvent, action: 'new' | 'existing') => {
    if (e.key === 'Enter') {
      if (action === 'new') {
        handleAddNewDirector()
      } else {
        handleAddFromExisting()
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Directors
        </CardTitle>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <div className="text-red-600 text-sm">{error}</div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="existing" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Pilih dari Cast
            </TabsTrigger>
            <TabsTrigger value="new" className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              Tambah Baru
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-4">Loading cast data...</div>
            ) : (
              <>
                {/* Info Text */}
                <div className="text-sm text-muted-foreground">
                  Tersedia {actors.length} actors dan {actresses.length} actresses
                  {searchTerm && ` (menampilkan ${allPersons.length} hasil)`}
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari actor/actress..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Person Selector */}
                <div className="space-y-2">
                  <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        allPersons.length === 0 
                          ? "Tidak ada data yang tersedia..."
                          : "Pilih actor/actress sebagai director..."
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {allPersons.length === 0 ? (
                        <SelectItem value="no-data" disabled>
                          Tidak ada data yang sesuai
                        </SelectItem>
                      ) : (
                        allPersons.map((person) => (
                          <SelectItem key={person.id} value={person.id}>
                            <div className="flex items-center gap-2">
                              <Badge variant={person.type === 'actor' ? 'default' : 'secondary'}>
                                {person.type === 'actor' ? 'Actor' : 'Actress'}
                              </Badge>
                              <span>{person.name}</span>
                              {person.jpname && (
                                <span className="text-muted-foreground">({person.jpname})</span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>

                  <Button 
                    onClick={handleAddFromExisting}
                    disabled={!selectedPersonId || selectedPersonId === 'no-data'}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah sebagai Director
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="new" className="space-y-4">
            <div className="space-y-3">
              <div>
                <Input
                  placeholder="Nama director baru..."
                  value={newDirectorName}
                  onChange={(e) => setNewDirectorName(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'new')}
                />
              </div>
              
              <div>
                <Input
                  placeholder="Nama Jepang (opsional)..."
                  value={newDirectorJpName}
                  onChange={(e) => setNewDirectorJpName(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'new')}
                />
              </div>
              
              <div>
                <Input
                  placeholder="Kanji Name (opsional)..."
                  value={newDirectorKanjiName}
                  onChange={(e) => setNewDirectorKanjiName(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'new')}
                />
              </div>
              
              <div>
                <Input
                  placeholder="Kana Name (opsional)..."
                  value={newDirectorKanaName}
                  onChange={(e) => setNewDirectorKanaName(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'new')}
                />
              </div>
              
              <Button onClick={handleAddNewDirector} className="w-full" disabled={!newDirectorName.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Director Baru
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Current Directors List */}
        <div className="space-y-2">
          <h4 className="font-medium">Directors Tersimpan:</h4>
          {directors.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Belum ada director yang ditambahkan
            </div>
          ) : (
            <div className="grid gap-2">
              {directors.map((director) => (
                <div key={director.id} className="p-2 border rounded">
                  {editingId === director.id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div>
                        <Input
                          placeholder="Nama director..."
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleEditSave(director.id)
                            if (e.key === 'Escape') handleEditCancel()
                          }}
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Nama Jepang (opsional)..."
                          value={editingJpName}
                          onChange={(e) => setEditingJpName(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleEditSave(director.id)
                            if (e.key === 'Escape') handleEditCancel()
                          }}
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Kanji Name (opsional)..."
                          value={editingKanjiName}
                          onChange={(e) => setEditingKanjiName(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleEditSave(director.id)
                            if (e.key === 'Escape') handleEditCancel()
                          }}
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Kana Name (opsional)..."
                          value={editingKanaName}
                          onChange={(e) => setEditingKanaName(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleEditSave(director.id)
                            if (e.key === 'Escape') handleEditCancel()
                          }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEditSave(director.id)}
                          size="sm"
                          disabled={!editingName.trim()}
                          className="flex-1"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Simpan
                        </Button>
                        <Button
                          onClick={handleEditCancel}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Batal
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Display Mode
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-medium">{director.name}</span>
                        {director.jpname && (
                          <span className="text-sm text-muted-foreground">{director.jpname}</span>
                        )}
                        {isDirectorFromCast(director) && (
                          <Badge variant="secondary" className="text-xs w-fit mt-1">
                            Dari Cast
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {!isDirectorFromCast(director) && (
                          <Button 
                            onClick={() => handleEditStart(director)}
                            variant="ghost" 
                            size="sm"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          onClick={() => handleDelete(director.id)}
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}