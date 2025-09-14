import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Plus, Trash2, Edit, Save, X, ExternalLink } from 'lucide-react'
import { MasterDataItem, LabeledLink, masterDataApi } from '../utils/masterDataApi'
import { DatePicker } from './DatePicker'
import { PhotoCycler } from './PhotoCycler'
import { LabeledLinksManager } from './LabeledLinksManager'
import { MultiSelectWithCreate } from './MultiSelectWithCreate'
import { normalizeJapaneseNames } from '../utils/japaneseNameNormalizer'

interface ExtendedFormProps {
  type: 'actor' | 'actress'
  accessToken: string
  data: MasterDataItem[]
  onDataChange: (newData: MasterDataItem[]) => void
  initialEditItem?: MasterDataItem
}

interface FormData {
  name: string
  jpname: string
  kanjiName: string
  kanaName: string
  birthdate: Date | undefined
  alias: string
  links: LabeledLink[]
  takulinks: string
  tags: string
  photo: string[]
  groupPhoto: string[] // Legacy field - will be migrated to groupData
  profilePicture: string
  selectedGroups: string[]
  groupData: { [groupName: string]: { photos: string[], alias?: string } }
}

const initialFormData: FormData = {
  name: '',
  jpname: '',
  kanjiName: '',
  kanaName: '',
  birthdate: undefined,
  alias: '',
  links: [],
  takulinks: '',
  tags: '',
  photo: [''],
  groupPhoto: [''], // Legacy field
  profilePicture: '',
  selectedGroups: [],
  groupData: {}
}

export function ExtendedForm({ type, accessToken, data, onDataChange, initialEditItem }: ExtendedFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Auto-populate form if initialEditItem is provided
  useEffect(() => {
    if (initialEditItem) {
      console.log('Auto-populating form with initial edit item:', initialEditItem)
      handleEdit(initialEditItem)
    }
  }, [initialEditItem])

  const resetForm = () => {
    setFormData(initialFormData)
    setEditingId(null)
    setError('')
  }

  const calculateAge = (birthdate: string): number | null => {
    if (!birthdate) return null
    const birth = new Date(birthdate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age >= 0 ? age : null
  }

  const handleInputChange = (field: keyof FormData, value: string | Date | undefined | LabeledLink[] | string[] | { [groupName: string]: { photos: string[], alias?: string } }) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handle group selection changes - ensure groupData has entries for all selected groups
  const handleGroupSelectionChange = (selectedGroups: string[]) => {
    setFormData(prev => {
      const newGroupData = { ...prev.groupData }
      
      // Add entries for new groups
      selectedGroups.forEach(group => {
        if (!newGroupData[group]) {
          newGroupData[group] = { photos: [''], alias: '' }
        }
      })
      
      // Remove entries for deselected groups
      Object.keys(newGroupData).forEach(group => {
        if (!selectedGroups.includes(group)) {
          delete newGroupData[group]
        }
      })
      
      return {
        ...prev,
        selectedGroups,
        groupData: newGroupData
      }
    })
  }

  // Handle photo changes for specific group
  const handleGroupPhotoChange = (groupName: string, photoIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      groupData: {
        ...prev.groupData,
        [groupName]: {
          ...prev.groupData[groupName],
          photos: prev.groupData[groupName].photos.map((photo, index) => 
            index === photoIndex ? value : photo
          )
        }
      }
    }))
  }

  // Add photo field for specific group
  const addGroupPhotoField = (groupName: string) => {
    setFormData(prev => ({
      ...prev,
      groupData: {
        ...prev.groupData,
        [groupName]: {
          ...prev.groupData[groupName],
          photos: [...prev.groupData[groupName].photos, '']
        }
      }
    }))
  }

  // Remove photo field for specific group
  const removeGroupPhotoField = (groupName: string, photoIndex: number) => {
    setFormData(prev => ({
      ...prev,
      groupData: {
        ...prev.groupData,
        [groupName]: {
          ...prev.groupData[groupName],
          photos: prev.groupData[groupName].photos.filter((_, index) => index !== photoIndex)
        }
      }
    }))
  }

  // Handle alias change for specific group
  const handleGroupAliasChange = (groupName: string, alias: string) => {
    setFormData(prev => ({
      ...prev,
      groupData: {
        ...prev.groupData,
        [groupName]: {
          ...prev.groupData[groupName],
          alias
        }
      }
    }))
  }

  const handlePhotoChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      photo: prev.photo.map((p, i) => i === index ? value : p)
    }))
  }

  const addPhotoField = () => {
    setFormData(prev => ({
      ...prev,
      photo: [...prev.photo, '']
    }))
  }

  const removePhotoField = (index: number) => {
    if (formData.photo.length > 1) {
      setFormData(prev => ({
        ...prev,
        photo: prev.photo.filter((_, i) => i !== index)
      }))
    }
  }

  // Legacy group photo functions - kept for backward compatibility
  const handleLegacyGroupPhotoChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      groupPhoto: prev.groupPhoto.map((p, i) => i === index ? value : p)
    }))
  }

  const addLegacyGroupPhotoField = () => {
    setFormData(prev => ({
      ...prev,
      groupPhoto: [...prev.groupPhoto, '']
    }))
  }

  const removeLegacyGroupPhotoField = (index: number) => {
    if (formData.groupPhoto.length > 1) {
      setFormData(prev => ({
        ...prev,
        groupPhoto: prev.groupPhoto.filter((_, i) => i !== index)
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Nama wajib diisi')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      const filteredPhotos = formData.photo.filter(p => p.trim())
      const filteredGroupPhotos = formData.groupPhoto.filter(p => p.trim())
      
      // Convert birthdate to proper ISO string format
      let birthdateString: string | undefined = undefined
      if (formData.birthdate) {
        // Ensure the date is formatted as YYYY-MM-DD to match database expectations
        const year = formData.birthdate.getFullYear()
        const month = String(formData.birthdate.getMonth() + 1).padStart(2, '0')
        const day = String(formData.birthdate.getDate()).padStart(2, '0')
        birthdateString = `${year}-${month}-${day}`
      }

      // Process group data - filter out empty photos
      const processedGroupData: { [groupName: string]: { photos: string[], alias?: string } } = {}
      Object.entries(formData.groupData).forEach(([groupName, groupInfo]) => {
        const filteredPhotos = groupInfo.photos.filter(photo => photo.trim())
        if (filteredPhotos.length > 0 || groupInfo.alias?.trim()) {
          processedGroupData[groupName] = {
            photos: filteredPhotos,
            alias: groupInfo.alias?.trim() || undefined
          }
        }
      })

      // Normalize Japanese names to avoid redundancy
      const normalizedNames = normalizeJapaneseNames({
        jpname: formData.jpname.trim(),
        kanjiName: formData.kanjiName.trim()
      })

      const submitData = {
        name: formData.name.trim(),
        jpname: normalizedNames.jpname || undefined,
        kanjiName: normalizedNames.kanjiName || undefined,
        kanaName: formData.kanaName.trim() || undefined,
        birthdate: birthdateString,
        alias: formData.alias.trim() || undefined,
        links: formData.links.length > 0 ? formData.links : undefined,
        tags: formData.tags.trim() || undefined,
        photo: filteredPhotos.length > 0 ? filteredPhotos : undefined,
        groupPhoto: filteredGroupPhotos.length > 0 ? filteredGroupPhotos : undefined, // Legacy field
        profilePicture: formData.profilePicture.trim() || undefined,
        selectedGroups: formData.selectedGroups.length > 0 ? formData.selectedGroups : undefined,
        groupData: Object.keys(processedGroupData).length > 0 ? processedGroupData : undefined
      }

      if (type === 'actress' && formData.takulinks.trim()) {
        submitData.takulinks = formData.takulinks.trim()
      }

      console.log('Submitting data with editing ID:', editingId, 'Data:', submitData)

      let result
      if (editingId) {
        console.log('Updating actor/actress:', editingId)
        result = await masterDataApi.updateExtended(type, editingId, submitData, accessToken)
        onDataChange(data.map(item => item.id === editingId ? result : item))
      } else {
        console.log('Creating new actor/actress')
        result = await masterDataApi.createExtended(type, submitData, accessToken)
        onDataChange([...data, result])
      }

      resetForm()
      setError('')
    } catch (error: any) {
      console.error('Submit error:', error)
      
      // More specific error messages
      if (error.message?.includes('Item already exists') || error.message?.includes('already exists')) {
        if (editingId) {
          setError(`Tidak dapat update: Sudah ada ${type === 'actress' ? 'aktris' : 'aktor'} lain dengan nama "${formData.name}". Silakan gunakan nama yang berbeda.`)
        } else {
          setError(`Tidak dapat menambah: Sudah ada ${type === 'actress' ? 'aktris' : 'aktor'} dengan nama "${formData.name}". Silakan gunakan nama yang berbeda.`)
        }
      } else {
        setError(error.message || `Gagal ${editingId ? 'mengupdate' : 'menambah'} ${type}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (item: MasterDataItem) => {
    console.log('Editing item:', item)
    
    // Handle backward compatibility for old string-based links
    let linkArray: LabeledLink[] = []
    if (Array.isArray(item.links)) {
      linkArray = item.links
    } else if (typeof item.links === 'string' && item.links.trim()) {
      linkArray = [{
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        label: 'Website',
        url: item.links.trim()
      }]
    }

    // Parse birthdate more carefully to handle different date formats
    let birthdateValue: Date | undefined = undefined
    if (item.birthdate) {
      try {
        // Handle both YYYY-MM-DD and ISO date formats
        const dateValue = new Date(item.birthdate)
        if (!isNaN(dateValue.getTime())) {
          birthdateValue = dateValue
        }
      } catch (error) {
        console.error('Error parsing birthdate:', error)
      }
    }

    // Initialize group data from existing data or create empty structure
    const groupData: { [groupName: string]: { photos: string[], alias?: string } } = {}
    if (item.selectedGroups) {
      item.selectedGroups.forEach(groupName => {
        if (item.groupData && item.groupData[groupName]) {
          // Use existing group data
          groupData[groupName] = {
            photos: item.groupData[groupName].photos.length > 0 ? item.groupData[groupName].photos : [''],
            alias: item.groupData[groupName].alias || ''
          }
        } else {
          // Create empty structure for new groups
          groupData[groupName] = { photos: [''], alias: '' }
        }
      })
    }

    setFormData({
      name: item.name || '',
      jpname: item.jpname || '',
      kanjiName: item.kanjiName || '',
      kanaName: item.kanaName || '',
      birthdate: birthdateValue,
      alias: item.alias || '',
      links: linkArray,
      takulinks: item.takulinks || '',
      tags: item.tags || '',
      photo: item.photo && item.photo.length > 0 ? item.photo : [''],
      groupPhoto: item.groupPhoto && item.groupPhoto.length > 0 ? item.groupPhoto : [''],
      profilePicture: item.profilePicture || '',
      selectedGroups: item.selectedGroups || [],
      groupData
    })
    
    setEditingId(item.id)
    console.log('Set editing ID to:', item.id)
    setError('')
  }

  const handleDelete = async (id: string) => {
    if (!confirm(`Yakin ingin menghapus ${type} ini?`)) return

    try {
      await masterDataApi.delete(type, id, accessToken)
      onDataChange(data.filter(item => item.id !== id))
      if (editingId === id) {
        resetForm()
      }
      setError('')
    } catch (error: any) {
      setError(`Gagal menghapus: ${error.message}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {editingId ? `Edit ${type === 'actress' ? 'Aktris' : 'Aktor'}: ${formData.name}` : `Tambah ${type === 'actress' ? 'Aktris' : 'Aktor'} Baru`}
          </CardTitle>
          {editingId && (
            <p className="text-sm text-muted-foreground">
              ID: {editingId}
            </p>
          )}
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nama *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Masukkan nama"
                  required
                />
              </div>

              <div>
                <Label htmlFor="jpname">Nama Jepang</Label>
                <Input
                  id="jpname"
                  value={formData.jpname}
                  onChange={(e) => handleInputChange('jpname', e.target.value)}
                  placeholder="Masukkan nama Jepang"
                />
              </div>

              <div>
                <Label htmlFor="kanjiName">Kanji Name</Label>
                <Input
                  id="kanjiName"
                  value={formData.kanjiName}
                  onChange={(e) => handleInputChange('kanjiName', e.target.value)}
                  placeholder="Masukkan nama dalam kanji (漢字)"
                />
              </div>

              <div>
                <Label htmlFor="kanaName">Kana Name</Label>
                <Input
                  id="kanaName"
                  value={formData.kanaName}
                  onChange={(e) => handleInputChange('kanaName', e.target.value)}
                  placeholder="Masukkan nama dalam kana (かな)"
                />
              </div>

              <div>
                <Label>Tanggal Lahir</Label>
                <DatePicker
                  selected={formData.birthdate}
                  onSelect={(date) => handleInputChange('birthdate', date)}
                  placeholder="Pilih tanggal lahir"
                />
                {formData.birthdate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Format yang akan disimpan: {formData.birthdate.getFullYear()}-{String(formData.birthdate.getMonth() + 1).padStart(2, '0')}-{String(formData.birthdate.getDate()).padStart(2, '0')}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="alias">Alias</Label>
                <Input
                  id="alias"
                  value={formData.alias}
                  onChange={(e) => handleInputChange('alias', e.target.value)}
                  placeholder="Masukkan alias"
                />
              </div>
            </div>

            {/* Labeled Links Manager */}
            <div className="space-y-4">
              <LabeledLinksManager
                links={formData.links}
                onChange={(links) => handleInputChange('links', links)}
                accessToken={accessToken}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {type === 'actress' && (
                <div>
                  <Label htmlFor="takulinks">Taku Links</Label>
                  <Textarea
                    id="takulinks"
                    value={formData.takulinks}
                    onChange={(e) => handleInputChange('takulinks', e.target.value)}
                    placeholder="Masukkan taku links (pisahkan dengan baris baru)"
                    rows={3}
                  />
                </div>
              )}

              <div className={type === 'actress' ? '' : 'md:col-span-2'}>
                <Label htmlFor="tags">Tags</Label>
                <Textarea
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="Masukkan tags (pisahkan dengan koma)"
                  rows={2}
                />
              </div>
            </div>

            {/* Profile Picture */}
            <div>
              <Label htmlFor="profilePicture">Profile Picture URL</Label>
              <Input
                id="profilePicture"
                value={formData.profilePicture}
                onChange={(e) => handleInputChange('profilePicture', e.target.value)}
                placeholder="Masukkan URL gambar profil untuk avatar"
              />
              <p className="text-xs text-muted-foreground mt-1">
                URL ini akan digunakan untuk avatar di movie page dan profile page
              </p>
            </div>

            {/* Group Selection - Only for actress */}
            {type === 'actress' && (
              <div>
                <Label>Grup Aktris</Label>
                <MultiSelectWithCreate
                  type="group"
                  value={formData.selectedGroups}
                  onChange={handleGroupSelectionChange}
                  placeholder="Pilih grup untuk aktris ini..."
                  accessToken={accessToken}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Aktris dapat dikategorikan ke dalam beberapa grup (MILF, Teen, dll.)
                </p>
              </div>
            )}

            {/* Group-Specific Data - Only show if actress has selected groups */}
            {type === 'actress' && formData.selectedGroups.length > 0 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-base">Data Per Grup</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Konfigurasi photo links dan alias untuk setiap grup yang dipilih
                  </p>
                </div>
                
                {formData.selectedGroups.map((groupName) => (
                  <Card key={groupName} className="p-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Grup: {groupName}</h4>
                      </div>
                      
                      {/* Group Alias */}
                      <div>
                        <Label htmlFor={`group-alias-${groupName}`} className="text-sm">
                          Alias untuk grup {groupName}
                        </Label>
                        <Input
                          id={`group-alias-${groupName}`}
                          value={formData.groupData[groupName]?.alias || ''}
                          onChange={(e) => handleGroupAliasChange(groupName, e.target.value)}
                          placeholder={`Alias aktris dalam grup ${groupName}`}
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Nama/alias khusus untuk aktris dalam grup ini (opsional)
                        </p>
                      </div>
                      
                      {/* Group Photos */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm">Photo Links untuk {groupName}</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addGroupPhotoField(groupName)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Tambah Photo
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {(formData.groupData[groupName]?.photos || ['']).map((photo, photoIndex) => (
                            <div key={photoIndex} className="flex gap-2">
                              <Input
                                value={photo}
                                onChange={(e) => handleGroupPhotoChange(groupName, photoIndex, e.target.value)}
                                placeholder={`Photo link ${photoIndex + 1} untuk ${groupName}`}
                                className="flex-1"
                              />
                              {(formData.groupData[groupName]?.photos || []).length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeGroupPhotoField(groupName, photoIndex)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Photo khusus yang akan ditampilkan ketika aktris muncul dalam konteks grup {groupName}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Photo Links - Moved after group data section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Photo Links (General)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPhotoField}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Photo
                </Button>
              </div>
              <div className="space-y-2">
                {formData.photo.map((photo, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={photo}
                      onChange={(e) => handlePhotoChange(index, e.target.value)}
                      placeholder={`Photo link ${index + 1}`}
                      className="flex-1"
                    />
                    {formData.photo.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removePhotoField(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Photo umum untuk aktris/aktor ini (tidak spesifik grup)
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isLoading ? 'Menyimpan...' : editingId ? 'Update' : 'Simpan'}
              </Button>
              
              {editingId && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={resetForm}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Batal
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Data List */}

    </div>
  )
}