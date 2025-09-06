import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Plus, Trash2, Edit, Save, X, Globe } from 'lucide-react'
import { MasterDataItem, masterDataApi } from '../utils/masterDataApi'

interface SeriesFormProps {
  accessToken: string
  data: MasterDataItem[]
  onDataChange: (newData: MasterDataItem[]) => void
}

interface FormData {
  titleEn: string
  titleJp: string
  seriesLinks: string
}

const initialFormData: FormData = {
  titleEn: '',
  titleJp: '',
  seriesLinks: ''
}

export function SeriesForm({ accessToken, data, onDataChange }: SeriesFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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
    
    if (!formData.titleEn.trim() && !formData.titleJp.trim()) {
      setError('Minimal salah satu title (EN atau JP) harus diisi')
      return
    }

    setIsLoading(true)
    try {
      let result
      if (editingId) {
        result = await masterDataApi.updateSeries(
          editingId,
          formData.titleEn.trim(),
          formData.titleJp.trim(),
          formData.seriesLinks.trim(),
          accessToken
        )
        onDataChange(data.map(item => item.id === editingId ? result : item))
      } else {
        result = await masterDataApi.createSeries(
          formData.titleEn.trim(),
          formData.titleJp.trim(),
          formData.seriesLinks.trim(),
          accessToken
        )
        onDataChange([...data, result])
      }

      resetForm()
      setError('')
    } catch (error: any) {
      setError(error.message || `Gagal ${editingId ? 'mengupdate' : 'menambah'} series`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (item: MasterDataItem) => {
    setFormData({
      titleEn: item.titleEn || '',
      titleJp: item.titleJp || '',
      seriesLinks: item.seriesLinks || ''
    })
    setEditingId(item.id)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus series ini?')) return

    try {
      await masterDataApi.delete('series', id, accessToken)
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
            {editingId ? 'Edit Series' : 'Tambah Series Baru'}
          </CardTitle>
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="titleEn">Title English</Label>
                <Input
                  id="titleEn"
                  value={formData.titleEn}
                  onChange={(e) => handleInputChange('titleEn', e.target.value)}
                  placeholder="Masukkan title bahasa Inggris"
                />
              </div>

              <div>
                <Label htmlFor="titleJp">Title Japanese</Label>
                <Input
                  id="titleJp"
                  value={formData.titleJp}
                  onChange={(e) => handleInputChange('titleJp', e.target.value)}
                  placeholder="Masukkan title bahasa Jepang"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="seriesLinks">Series Links</Label>
              <Textarea
                id="seriesLinks"
                value={formData.seriesLinks}
                onChange={(e) => handleInputChange('seriesLinks', e.target.value)}
                placeholder="Masukkan links series (pisahkan dengan baris baru)"
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
          <CardTitle>Daftar Series</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {data.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Belum ada series yang ditambahkan
              </p>
            ) : (
              data.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="space-y-1">
                        {item.titleEn && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">EN</Badge>
                            <h4 className="font-medium">{item.titleEn}</h4>
                          </div>
                        )}
                        {item.titleJp && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">JP</Badge>
                            <h4 className="font-medium">{item.titleJp}</h4>
                          </div>
                        )}
                      </div>
                      
                      {item.seriesLinks && (
                        <div className="mt-2">
                          <p className="text-sm font-medium mb-1">Links:</p>
                          <div className="text-xs text-muted-foreground">
                            {item.seriesLinks.split('\n').map((link, index) => (
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