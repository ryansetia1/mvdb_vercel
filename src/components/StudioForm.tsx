import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Trash2, Edit, Save, X, Search } from 'lucide-react'
import { MasterDataItem, masterDataApi } from '../utils/masterDataApi'

interface StudioFormProps {
  accessToken: string
  data: MasterDataItem[]
  onDataChange: (newData: MasterDataItem[]) => void
}

interface FormData {
  name: string
  jpname: string
  alias: string
  studioLinks: string
}

const initialFormData: FormData = {
  name: '',
  jpname: '',
  alias: '',
  studioLinks: ''
}

export function StudioForm({ accessToken, data, onDataChange }: StudioFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const resetForm = () => {
    setFormData(initialFormData)
    setEditingId(null)
    setError('')
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Nama studio wajib diisi')
      return
    }

    setIsLoading(true)
    try {
      let result
      if (editingId) {
        const updateData: any = {
          name: formData.name.trim(),
          jpname: formData.jpname.trim() || null,
          alias: formData.alias.trim() || null,
          studioLinks: formData.studioLinks.trim() || null
        }
        
        console.log('Updating studio with data:', updateData)
        
        result = await masterDataApi.updateExtended('studio', editingId, updateData, accessToken)
        console.log('Update result:', result)
        onDataChange(data.map(item => item.id === editingId ? result : item))
      } else {
        const createData: any = {
          name: formData.name.trim(),
          jpname: formData.jpname.trim() || null,
          alias: formData.alias.trim() || null,
          studioLinks: formData.studioLinks.trim() || null
        }
        
        result = await masterDataApi.createExtended('studio', createData, accessToken)
        onDataChange([...data, result])
      }

      resetForm()
      setError('')
    } catch (error: any) {
      setError(error.message || `Gagal ${editingId ? 'mengupdate' : 'menambah'} studio`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (item: MasterDataItem) => {
    setFormData({
      name: item.name || '',
      jpname: item.jpname || '',
      alias: item.alias || '',
      studioLinks: item.studioLinks || ''
    })
    setEditingId(item.id)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus studio ini?')) return

    try {
      await masterDataApi.delete('studio', id, accessToken)
      onDataChange(data.filter(item => item.id !== id))
      if (editingId === id) {
        resetForm()
      }
      setError('')
    } catch (error: any) {
      setError(`Gagal menghapus: ${error.message}`)
    }
  }

  // Filter data based on search query
  const filteredData = data.filter((item) => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase()
    const name = item.name?.toLowerCase() || ''
    const jpname = item.jpname?.toLowerCase() || ''
    const alias = item.alias?.toLowerCase() || ''
    const links = item.studioLinks?.toLowerCase() || ''
    
    return name.includes(query) || jpname.includes(query) || alias.includes(query) || links.includes(query)
  })

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {editingId ? 'Edit Studio' : 'Tambah Studio Baru'}
          </CardTitle>
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nama Studio (English) *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Masukkan nama studio dalam bahasa Inggris"
                required
              />
            </div>

            <div>
              <Label htmlFor="jpname">Nama Jepang</Label>
              <Input
                id="jpname"
                value={formData.jpname || ''}
                onChange={(e) => handleInputChange('jpname', e.target.value)}
                placeholder="Masukkan nama studio dalam bahasa Jepang"
              />
            </div>

            <div>
              <Label htmlFor="alias">Alias</Label>
              <Input
                id="alias"
                value={formData.alias || ''}
                onChange={(e) => handleInputChange('alias', e.target.value)}
                placeholder="Masukkan alias studio (opsional)"
              />
            </div>

            <div>
              <Label htmlFor="studioLinks">Studio Links</Label>
              <Textarea
                id="studioLinks"
                value={formData.studioLinks || ''}
                onChange={(e) => handleInputChange('studioLinks', e.target.value)}
                placeholder="Masukkan links studio (pisahkan dengan baris baru)"
                rows={4}
              />
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Daftar Studio</span>
            <span className="text-sm font-normal text-muted-foreground">
              {searchQuery ? `${filteredData.length} dari ${data.length} studio` : `${data.length} studio`}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari studio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredData.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                {searchQuery ? 'Tidak ada studio yang cocok dengan pencarian' : 'Belum ada studio yang ditambahkan'}
              </p>
            ) : (
              filteredData.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      
                      {(item.jpname || item.alias) && (
                        <div className="mt-1 space-y-1">
                          {item.jpname && (
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Jepang:</span> {item.jpname}
                            </p>
                          )}
                          {item.alias && (
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Alias:</span> {item.alias}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {item.studioLinks && (
                        <div className="mt-2">
                          <p className="text-sm font-medium mb-1">Links:</p>
                          <div className="text-xs text-muted-foreground">
                            {item.studioLinks.split('\n').map((link, index) => (
                              <div key={index} className="break-all">
                                {link.trim() && (
                                  <a 
                                    href={link.trim()} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="hover:text-primary underline"
                                  >
                                    {link.trim()}
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}